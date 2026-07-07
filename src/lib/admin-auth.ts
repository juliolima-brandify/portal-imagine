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

  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await client.auth.getUser(token)
    if (!error && data.user) return data.user
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (!error && data.user) return data.user

  return null
}

/**
 * Guard de autorização para rotas /api/admin/*.
 * Exige usuário autenticado com perfil role = 'admin'.
 *
 * Uso no handler:
 *   const auth = await requireAdmin()
 *   if (auth.error) return auth.error
 */
export async function requireAdmin() {
  const user = await resolveUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
      user: null,
    }
  }

  // Confere o role no banco (via service role — a identidade já foi validada acima)
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
}
