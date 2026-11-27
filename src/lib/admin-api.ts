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
    const errJson = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(errJson?.error || `Falha ao carregar doações (${res.status})`)
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

export interface AdminDonationsReport {
  granularity: 'hour' | 'day' | 'month'
  overview: {
    net_total: number
    donation_count: number
    unique_donors: number
    average_donation: number
    previous_net_total: number
    growth_pct: number
    monthly_growth_pct: number
  }
  global_totals: {
    recognized_total: number
    recognized_count: number
  }
  series: Array<{ bucket: string; net: number; count: number }>
  payment_methods: Array<{ method: string; count: number; net: number }>
  donor_segments: Array<{ segment: string; count: number; net: number }>
  top_projects: Array<{ project_id: string; net: number; donors: number }>
  top_donors: Array<{ key: string; label: string; amount: number; count: number }>
  top_donors_90d: Array<{ key: string; label: string; amount: number; count: number }>
  recent_donations: Array<{
    id: string
    donor: string
    project_id: string | null
    campaign_slug: string | null
    project_title: string | null
    amount: number
    created_at: string
  }>
  latest_donations: Array<{
    id: string
    donor: string
    project_id: string | null
    campaign_slug: string | null
    project_title: string | null
    amount: number
    refunded_amount: number
    net_amount: number
    status: string
    created_at: string
  }>
}

export async function fetchAdminDonationsReport(opts: {
  start?: Date
  end?: Date
  projectId?: string
}): Promise<AdminDonationsReport> {
  const params = new URLSearchParams({ mode: 'report' })
  if (opts.start) params.set('start', opts.start.toISOString())
  if (opts.end) params.set('end', opts.end.toISOString())
  if (opts.projectId && opts.projectId !== 'all') params.set('projectId', opts.projectId)

  const res = await adminFetch(`/api/admin/donations?${params.toString()}`)
  if (!res.ok) {
    const errJson = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(errJson?.error || `Falha ao carregar relatório (${res.status})`)
  }
  const json = (await res.json().catch(() => ({}))) as { report?: AdminDonationsReport }
  return (json.report ?? {}) as AdminDonationsReport
}
