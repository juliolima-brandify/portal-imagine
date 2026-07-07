import { supabase } from '@/lib/supabase'

/**
 * fetch para as rotas /api/admin/*, injetando o access_token da sessão atual
 * no header Authorization. Necessário porque a sessão fica no localStorage
 * (cliente supabase-js), então o token não vai automaticamente por cookie.
 *
 * Uso idêntico ao fetch:
 *   const res = await adminFetch('/api/admin/projects', { method: 'POST', ... })
 */
export async function adminFetch(input: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, { ...init, headers })
}
