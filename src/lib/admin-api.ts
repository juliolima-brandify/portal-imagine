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

export interface AdminDonationsPayload {
  data: any[]
  total: number
  page: number
  pageSize: number
  stats?: {
    total?: number
    completedCount?: number
    totalCompletedBrl?: number
    [key: string]: any
  }
}

/**
 * Carrega todas as doações filtradas numa única requisição (`all=true`).
 * O servidor pagina internamente no PostgREST e devolve o conjunto completo,
 * evitando o corte silencioso de 100 linhas e as dezenas de idas e voltas (R16).
 */
export async function fetchAllAdminDonations(
  baseUrl = '/api/admin/donations',
  query: Record<string, string> = {}
): Promise<AdminDonationsPayload> {
  const params = new URLSearchParams({ ...query, all: 'true' })
  const res = await adminFetch(`${baseUrl}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Falha ao carregar doações (${res.status})`)
  }

  const json = (await res.json().catch(() => ({}))) as AdminDonationsPayload
  const data = Array.isArray(json.data) ? json.data : []
  return {
    ...json,
    data,
    total: typeof json.total === 'number' ? json.total : data.length,
    page: 1,
    pageSize: typeof json.pageSize === 'number' ? json.pageSize : data.length,
  }
}
