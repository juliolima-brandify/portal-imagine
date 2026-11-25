import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Resolve o usuário autenticado da requisição.
 *
 * O app guarda a sessão no cliente (localStorage), então as chamadas das
 * páginas admin enviam o access_token no header `Authorization: Bearer ...`.
 * Também aceitamos sessão via cookie (@supabase/ssr) como fallback, para
 * rotas chamadas em contexto server-side.
 */
async function resolveUser() {
  const authHeader = headers().get('authorization')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (authHeader?.toLowerCase().startsWith('bearer ') && supabaseUrl && supabaseAnonKey) {
    const token = authHeader.slice(7).trim()
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client.auth.getUser(token)
    if (!error && data.user) return data.user
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (!error && data.user) return data.user
  } catch {
    return null
  }

  return null
}

/**
 * Guard de autorização para rotas /api/admin/*.
 * Exige usuário autenticado com perfil role = 'admin'.
 */
export async function requireAdmin() {
  try {
    const user = await resolveUser()

    if (!user) {
      return {
        error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
        user: null,
      }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return {
        error: NextResponse.json(
          { error: 'Acesso negado: requer permissão de administrador' },
          { status: 403 }
        ),
        user: null,
      }
    }

    return { error: null as null, user }
  } catch (err) {
    console.error('Erro interno ao verificar permissão de administrador:', err)
    return {
      error: NextResponse.json(
        { error: 'Serviço de autenticação indisponível' },
        { status: 500 }
      ),
      user: null,
    }
  }
}
