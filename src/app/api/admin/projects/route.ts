import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { isValidUuid, sanitizeAdminProjectPayload } from '@/lib/site-projects'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

function mapDbError(error: { code?: string; message?: string }) {
  if (error?.code === '23505') {
    return jsonNoStore(
      { error: 'Já existe um projeto com este slug. Escolha outro identificador de URL.' },
      409
    )
  }
  if (error?.code === '23503') {
    return jsonNoStore(
      { error: 'Operação bloqueada: existem registros vinculados a este projeto.' },
      409
    )
  }
  if (error?.code === '22P02') {
    return jsonNoStore({ error: 'Formato de dado ou identificador inválido.' }, 400)
  }
  if (error?.code === '23502' || error?.code === '23514') {
    return jsonNoStore({ error: 'Os dados informados violam as regras de validação do projeto.' }, 422)
  }
  return jsonNoStore({ error: 'Erro ao persistir projeto no banco de dados' }, 500)
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('site_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ API: Erro ao carregar projetos:', error)
      return jsonNoStore({ error: 'Erro ao carregar projetos' }, 500)
    }

    return jsonNoStore({ data: data || [] })
  } catch (error) {
    console.error('❌ API: Erro na requisição:', error)
    return jsonNoStore({ error: 'Erro interno do servidor' }, 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição' }, 400)
    }

    const sanitized = sanitizeAdminProjectPayload(body, 'create')
    if (!sanitized.ok) {
      return jsonNoStore({ error: sanitized.error }, sanitized.status)
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([sanitized.data])
      .select()

    if (error) {
      console.error('❌ API: Erro ao criar projeto:', error)
      return mapDbError(error)
    }

    return jsonNoStore({ data: data?.[0] }, 201)
  } catch (error) {
    console.error('❌ API: Erro na criação:', error)
    return jsonNoStore({ error: 'Erro interno do servidor' }, 500)
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição' }, 400)
    }

    const sanitized = sanitizeAdminProjectPayload(body, 'update')
    if (!sanitized.ok || !sanitized.id) {
      return jsonNoStore(
        { error: sanitized.ok ? 'ID do projeto é obrigatório' : sanitized.error },
        sanitized.ok ? 400 : sanitized.status
      )
    }

    // Se show_on_site === true sem slug no payload de PUT, garante que o projeto já tem slug salvo
    if (sanitized.data.show_on_site === true && sanitized.data.slug === undefined) {
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('projects')
        .select('id, slug')
        .eq('id', sanitized.id)
        .maybeSingle()

      if (fetchErr) {
        console.error('❌ API: Erro ao verificar projeto:', fetchErr)
        return mapDbError(fetchErr)
      }
      if (!existing) {
        return jsonNoStore({ error: 'Projeto não encontrado' }, 404)
      }
      if (!existing.slug) {
        return jsonNoStore(
          { error: 'Informe um slug válido para exibir o projeto no site institucional.' },
          422
        )
      }
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(sanitized.data)
      .eq('id', sanitized.id)
      .select()

    if (error) {
      console.error('❌ API: Erro ao atualizar projeto:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore({ error: 'Projeto não encontrado' }, 404)
    }

    return jsonNoStore({ data: data[0] })
  } catch (error) {
    console.error('❌ API: Erro na atualização:', error)
    return jsonNoStore({ error: 'Erro interno do servidor' }, 500)
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (!isValidUuid(id)) {
      return jsonNoStore({ error: 'ID do projeto inválido (esperado UUID)' }, 400)
    }

    // Protege histórico financeiro contra ON DELETE CASCADE
    const { count: donationsCount, error: donationsErr } = await supabaseAdmin
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id as string)

    if (donationsErr) {
      console.error('❌ API: Erro ao verificar doações do projeto:', donationsErr)
      return mapDbError(donationsErr)
    }

    if ((donationsCount ?? 0) > 0) {
      return jsonNoStore(
        {
          error:
            'Não é possível excluir um projeto com doações registradas. Pause o projeto em vez de excluí-lo.',
        },
        409
      )
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id as string)
      .select('id')

    if (error) {
      console.error('❌ API: Erro ao deletar projeto:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore({ error: 'Projeto não encontrado' }, 404)
    }

    return jsonNoStore({ success: true })
  } catch (error) {
    console.error('❌ API: Erro na deleção:', error)
    return jsonNoStore({ error: 'Erro interno do servidor' }, 500)
  }
}
