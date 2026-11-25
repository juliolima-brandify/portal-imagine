import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { deleteBlogCoverIfOrphan } from '@/lib/blog-media'
import {
  isValidBlogUuid,
  sanitizeAdminBlogPostPayload,
} from '@/lib/blog-posts'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

const ALLOWED_MUTATION_ORIGINS = new Set([
  'https://imagineinstituto.com',
  'https://www.imagineinstituto.com',
  'https://portal.imagineinstituto.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
])

const ADMIN_LIST_COLUMNS =
  'id,slug,title,excerpt,post_type,project_id,cover_image_url,cover_alt,status,seo_title,seo_description,author_id,published_at,created_at,updated_at'

const ADMIN_DETAIL_COLUMNS = `${ADMIN_LIST_COLUMNS},content`

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

function verifyMutationOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  if (ALLOWED_MUTATION_ORIGINS.has(origin)) return null

  const host = (request.headers.get('host') || '').toLowerCase()
  try {
    const parsedOrigin = new URL(origin)
    if (host && parsedOrigin.host.toLowerCase() === host) {
      return null
    }
  } catch {
    // origin malformada cai no 403 abaixo
  }

  return jsonNoStore({ error: 'Origem não autorizada para esta operação.' }, 403)
}

function mapDbError(error: { code?: string; message?: string }) {
  if (error?.code === '23505') {
    return jsonNoStore(
      { error: 'Já existe uma publicação com este slug. Escolha outro identificador de URL.' },
      409
    )
  }
  if (error?.code === '23503') {
    return jsonNoStore(
      { error: 'O projeto vinculado não foi encontrado no banco de dados.' },
      422
    )
  }
  if (error?.code === '22P02') {
    return jsonNoStore({ error: 'Formato de dado ou identificador inválido.' }, 400)
  }
  if (error?.code === '23502' || error?.code === '23514') {
    return jsonNoStore({ error: 'Os dados informados violam as regras de validação da publicação.' }, 422)
  }
  if (error?.code === '42P01') {
    return jsonNoStore(
      { error: 'Tabela blog_posts ainda não criada no Supabase. Aplique a migração SQL primeiro.' },
      503
    )
  }
  return jsonNoStore({ error: 'Erro ao persistir publicação no banco de dados.' }, 500)
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (id) {
      if (!isValidBlogUuid(id)) {
        return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, 400)
      }
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select(ADMIN_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('❌ API Blog: Erro ao buscar detalhe:', error)
        return mapDbError(error)
      }
      if (!data) {
        return jsonNoStore({ error: 'Publicação não encontrada.' }, 404)
      }
      return jsonNoStore({ data })
    }

    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
    const pageSizeParam = Number.parseInt(searchParams.get('pageSize') || '100', 10)
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(200, pageSizeParam) : 100
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabaseAdmin
      .from('blog_posts')
      .select(ADMIN_LIST_COLUMNS, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('❌ API Blog: Erro ao listar publicações:', error)
      return mapDbError(error)
    }

    return jsonNoStore({
      data: data || [],
      total: count ?? data?.length ?? 0,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no GET:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, 500)
  }
}

export async function POST(request: NextRequest) {
  const originErr = verifyMutationOrigin(request)
  if (originErr) return originErr

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return jsonNoStore({ error: 'Content-Type deve ser application/json.' }, 415)
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição.' }, 400)
    }

    const sanitized = sanitizeAdminBlogPostPayload(body, 'create', {
      authorId: auth.user?.id || null,
    })

    if (!sanitized.ok) {
      return jsonNoStore({ error: sanitized.error }, sanitized.status)
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert([sanitized.data])
      .select()

    if (error) {
      console.error('❌ API Blog: Erro ao criar publicação:', error)
      return mapDbError(error)
    }

    return jsonNoStore({ data: data?.[0] }, 201)
  } catch (err) {
    console.error('❌ API Blog: Erro interno no POST:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, 500)
  }
}

export async function PUT(request: NextRequest) {
  const originErr = verifyMutationOrigin(request)
  if (originErr) return originErr

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return jsonNoStore({ error: 'Content-Type deve ser application/json.' }, 415)
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição.' }, 400)
    }

    const rawRecord =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : null

    const rawId = rawRecord ? String(rawRecord.id || '').trim() : ''
    if (!isValidBlogUuid(rawId)) {
      return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, 400)
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('blog_posts')
      .select('id,published_at,content,cover_image_url,updated_at')
      .eq('id', rawId)
      .maybeSingle()

    if (fetchErr) {
      console.error('❌ API Blog: Erro ao buscar publicação existente:', fetchErr)
      return mapDbError(fetchErr)
    }
    if (!existing) {
      return jsonNoStore({ error: 'Publicação não encontrada.' }, 404)
    }

    const expectedUpdatedAt =
      typeof rawRecord?.expected_updated_at === 'string'
        ? rawRecord.expected_updated_at.trim()
        : ''
    if (
      expectedUpdatedAt &&
      existing.updated_at &&
      new Date(expectedUpdatedAt).getTime() !== new Date(existing.updated_at).getTime()
    ) {
      return jsonNoStore(
        {
          error:
            'Esta publicação foi alterada por outro administrador. Recarregue a lista antes de salvar.',
        },
        409
      )
    }

    const sanitized = sanitizeAdminBlogPostPayload(body, 'update', {
      existingPublishedAt: existing.published_at || null,
      existingContent: existing.content || null,
    })

    if (!sanitized.ok || !sanitized.id) {
      return jsonNoStore(
        { error: sanitized.ok ? 'ID da publicação é obrigatório.' : sanitized.error },
        sanitized.ok ? 400 : sanitized.status
      )
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update(sanitized.data)
      .eq('id', sanitized.id)
      .select()

    if (error) {
      console.error('❌ API Blog: Erro ao atualizar publicação:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore({ error: 'Publicação não encontrada.' }, 404)
    }

    if (
      sanitized.data.cover_image_url !== undefined &&
      existing.cover_image_url &&
      existing.cover_image_url !== sanitized.data.cover_image_url
    ) {
      await deleteBlogCoverIfOrphan(existing.cover_image_url, existing.id)
    }

    return jsonNoStore({ data: data[0] })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no PUT:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, 500)
  }
}

export async function DELETE(request: NextRequest) {
  const originErr = verifyMutationOrigin(request)
  if (originErr) return originErr

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (!isValidBlogUuid(id)) {
      return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id as string)
      .select('id,cover_image_url')

    if (error) {
      console.error('❌ API Blog: Erro ao excluir publicação:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore({ error: 'Publicação não encontrada.' }, 404)
    }

    if (data[0]?.cover_image_url) {
      await deleteBlogCoverIfOrphan(data[0].cover_image_url, data[0].id)
    }

    return jsonNoStore({ success: true })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no DELETE:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, 500)
  }
}
