import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { jsonNoStore } from '@/lib/admin-http'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getDonationDestinationLabel,
  getRecognizedDonationAmountBrl,
  isValidUuid,
  normalizePaymentMethodLabel,
  sumDonationsBrl,
  sumRecognizedDonationsBrl,
} from '@/lib/payments'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const BATCH_SIZE = 1000
const MAX_PAGES = 100
const PROFILE_CHUNK_SIZE = 100

const DONATION_ADMIN_COLUMNS = [
  'id',
  'user_id',
  'project_id',
  'campaign_slug',
  'donor_name',
  'donor_email',
  'anonymous',
  'asaas_payment_id',
  'asaas_checkout_id',
  'amount',
  'refunded_amount',
  'currency',
  'status',
  'payment_method',
  'is_recurring',
  'recurring_frequency',
  'message',
  'receipt_sent_at',
  'created_at',
].join(', ')

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    )
    const statusFilter = (searchParams.get('status') || 'all').trim().toLowerCase()
    const methodFilter = (searchParams.get('method') || 'all').trim().toLowerCase()
    const searchQuery = (searchParams.get('q') || '').trim().toLowerCase()
    const includeStats = searchParams.get('stats') !== 'false'
    const all = searchParams.get('all') === 'true'
    const maskAnonymous =
      searchParams.get('maskAnonymous') === 'true' || searchParams.get('view') === 'summary'

    const [statsRows, projectsRes] = await Promise.all([
      includeStats && !all ? loadAllStatsRows() : Promise.resolve([]),
      supabaseAdmin.from('projects').select('id, title, slug'),
    ])

    const stats = computeStats(statsRows)

    if (projectsRes.error) {
      console.error('[AdminDonations] Erro ao buscar projetos:', projectsRes.error)
    }

    const projectMap = new Map<string, { title: string; slug: string | null }>()
    for (const p of projectsRes.data || []) {
      projectMap.set(p.id, { title: p.title, slug: p.slug || null })
    }

    // Modo "tudo": devolve todas as linhas filtradas numa única resposta.
    // Evita dezenas de idas e voltas do cliente para montar relatórios (R16).
    if (all) {
      const rows = await loadAllDonations(statusFilter, methodFilter, searchQuery)
      const items = await hydrateDonations(rows, projectMap, maskAnonymous)
      return jsonNoStore({
        data: items,
        total: items.length,
        page: 1,
        pageSize: items.length,
        stats: includeStats ? computeStats(rows) : stats,
      })
    }

    const safeTerm = searchQuery ? sanitizeSearchTerm(searchQuery) : ''
    if (searchQuery && !safeTerm) {
      return jsonNoStore({ data: [], total: 0, page, pageSize, stats })
    }

    const matchedProjectIds = safeTerm ? await findProjectIdsByQuery(safeTerm) : []
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const baseQuery = supabaseAdmin
      .from('donations')
      .select(DONATION_ADMIN_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })

    const filteredQuery = applyDonationFilters(baseQuery, {
      statusFilter,
      methodFilter,
      safeTerm,
      matchedProjectIds,
    })

    const { data: pageRows, count, error: pageErr } = await filteredQuery.range(from, to)
    if (pageErr) {
      console.error('[AdminDonations] Erro ao consultar doações:', pageErr)
      return jsonNoStore({ error: 'Erro ao listar doações.' }, { status: 500 })
    }

    const items = await hydrateDonations((pageRows || []) as unknown as DonationRow[], projectMap, maskAnonymous)
    return jsonNoStore({
      data: items,
      total: typeof count === 'number' ? count : items.length,
      page,
      pageSize,
      stats,
    })
  } catch (err) {
    console.error('[AdminDonations] Exceção inesperada:', err)
    return jsonNoStore({ error: 'Erro interno ao listar doações.' }, { status: 500 })
  }
}

function applyDonationFilters<T extends {
  or: (filters: string) => T
  in: (col: string, values: string[]) => T
  eq: (col: string, value: unknown) => T
  ilike: (col: string, pattern: string) => T
}>(
  query: T,
  opts: {
    statusFilter: string
    methodFilter: string
    safeTerm: string
    matchedProjectIds: string[]
  }
): T {
  let q = query

  if (opts.safeTerm) {
    const searchPattern = `%${opts.safeTerm}%`
    const orFilters = [
      `donor_name.ilike.${searchPattern}`,
      `donor_email.ilike.${searchPattern}`,
      `asaas_payment_id.ilike.${searchPattern}`,
      `asaas_checkout_id.ilike.${searchPattern}`,
    ]
    if (isValidUuid(opts.safeTerm)) {
      orFilters.push(`id.eq.${opts.safeTerm}`)
    }
    if (opts.matchedProjectIds.length > 0) {
      orFilters.push(`project_id.in.(${opts.matchedProjectIds.join(',')})`)
    }
    q = q.or(orFilters.join(','))
  }

  if (opts.statusFilter === 'failed') {
    q = q.in('status', ['failed', 'refunded'])
  } else if (['completed', 'pending', 'refunded', 'partially_refunded'].includes(opts.statusFilter)) {
    q = q.eq('status', opts.statusFilter)
  }

  if (opts.methodFilter === 'recurring') {
    q = q.eq('is_recurring', true)
  } else if (opts.methodFilter === 'pix') {
    q = q.ilike('payment_method', '%pix%')
  } else if (opts.methodFilter === 'card') {
    q = q.ilike('payment_method', '%credit%')
  }

  return q
}

async function loadAllStatsRows(): Promise<
  Array<{
    amount: any
    refunded_amount: any
    status: string
    payment_method: string | null
    is_recurring: boolean
  }>
> {
  const rows: Array<{
    amount: any
    refunded_amount: any
    status: string
    payment_method: string | null
    is_recurring: boolean
  }> = []
  let from = 0
  for (let pageIdx = 0; pageIdx < MAX_PAGES; pageIdx++) {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('amount, refunded_amount, status, payment_method, is_recurring')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + BATCH_SIZE - 1)
    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < BATCH_SIZE) break
    from += batch.length
  }
  return rows
}

function computeStats(
  rows: Array<{ amount: any; refunded_amount?: any; status: string | null }>
) {
  return {
    total: rows.length,
    completedCount: rows.filter((r) => r.status === 'completed').length,
    partiallyRefundedCount: rows.filter((r) => r.status === 'partially_refunded').length,
    pendingCount: rows.filter((r) => r.status === 'pending').length,
    failedCount: rows.filter((r) => r.status === 'failed' || r.status === 'refunded').length,
    totalCompletedBrl: sumRecognizedDonationsBrl(rows),
    totalPendingBrl: sumDonationsBrl(
      rows.filter((r) => r.status === 'pending').map((r) => r.amount)
    ),
  }
}

/**
 * Carrega todas as doações que casam com os filtros, paginando internamente
 * para não bater no teto de 1.000 linhas do PostgREST. Usado pelo modo `all=true`.
 */
async function loadAllDonations(
  statusFilter: string,
  methodFilter: string,
  searchQuery: string
): Promise<DonationRow[]> {
  const rows: DonationRow[] = []
  let safeTerm = ''
  let matchedProjectIds: string[] = []

  if (searchQuery) {
    safeTerm = sanitizeSearchTerm(searchQuery)
    if (!safeTerm) return []
    matchedProjectIds = await findProjectIdsByQuery(safeTerm)
  }

  let offset = 0
  for (let pageIdx = 0; pageIdx < MAX_PAGES; pageIdx++) {
    const baseQuery = supabaseAdmin
      .from('donations')
      .select(DONATION_ADMIN_COLUMNS)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })

    const query = applyDonationFilters(baseQuery, {
      statusFilter,
      methodFilter,
      safeTerm,
      matchedProjectIds,
    })

    const { data, error } = await query.range(offset, offset + BATCH_SIZE - 1)
    if (error) throw error
    const batch = (data || []) as unknown as DonationRow[]
    rows.push(...batch)
    if (batch.length < BATCH_SIZE) break
    offset += batch.length
  }

  return rows
}

function sanitizeSearchTerm(value: string): string {
  // Remove curingas e caracteres que quebram a sintaxe do filtro `.or()` do PostgREST.
  return value.replace(/[%_(),"\\'*]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function findProjectIdsByQuery(query: string): Promise<string[]> {
  const safe = sanitizeSearchTerm(query)
  if (!safe) return []
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id')
    .ilike('title', `%${safe}%`)
    .limit(200)
  if (error) {
    console.error('[AdminDonations] Erro ao buscar projetos:', error)
    return []
  }
  return (data || []).map((p) => p.id)
}

interface DonationRow {
  id: string
  user_id: string | null
  project_id: string | null
  campaign_slug: string | null
  donor_name: string | null
  donor_email: string | null
  anonymous: boolean | null
  asaas_payment_id: string | null
  asaas_checkout_id: string | null
  amount: number | string | null
  refunded_amount: number | string | null
  currency: string | null
  status: string | null
  payment_method: string | null
  is_recurring: boolean | null
  recurring_frequency: string | null
  message: string | null
  receipt_sent_at: string | null
  created_at: string
}

async function hydrateDonations(
  rows: DonationRow[],
  projectMap: Map<string, { title: string; slug: string | null }>,
  maskAnonymous = false
) {
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((id): id is string => typeof id === 'string' && id.length > 0))
  )

  const profileMap = new Map<string, { name: string | null; email: string | null }>()
  for (let i = 0; i < userIds.length; i += PROFILE_CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + PROFILE_CHUNK_SIZE)
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .in('id', chunk)
    if (profErr) {
      throw profErr
    }
    for (const prof of profiles || []) {
      profileMap.set(prof.id, { name: prof.name || null, email: prof.email || null })
    }
  }

  return rows.map((row) => {
    const prof = row.user_id ? profileMap.get(row.user_id) : undefined
    const proj = row.project_id ? projectMap.get(row.project_id) : undefined

    const resolvedName = (row.donor_name || prof?.name || '').trim()
    const resolvedEmail = (row.donor_email || prof?.email || '').trim()

    const isMaskedAnon = maskAnonymous && Boolean(row.anonymous)
    const displayDonorName = isMaskedAnon
      ? 'Doador Anônimo'
      : row.anonymous
        ? resolvedName
          ? `Anônimo (${resolvedName})`
          : 'Doador Anônimo'
        : resolvedName || 'Não identificado'
    const displayDonorEmail = isMaskedAnon ? 'Não informado' : resolvedEmail || 'Não informado'
    const hasValidEmail = isMaskedAnon ? false : Boolean(resolvedEmail && resolvedEmail.includes('@'))

    const transactionId =
      row.asaas_payment_id ||
      row.asaas_checkout_id ||
      '—'

    const amount = Number(row.amount) || 0
    const refundedAmount = Number(row.refunded_amount) || 0
    const netAmount = getRecognizedDonationAmountBrl({
      amount,
      refundedAmount,
      status: row.status || 'pending',
    })

    return {
      id: String(row.id),
      userId: isMaskedAnon ? null : row.user_id || null,
      projectId: row.project_id || null,
      campaignSlug: row.campaign_slug || null,
      projectTitle: getDonationDestinationLabel({
        projectTitle: proj?.title || null,
        campaignSlug: row.campaign_slug || null,
        projectId: row.project_id || null,
      }),
      donorName: displayDonorName,
      donorEmail: displayDonorEmail,
      hasValidEmail,
      amount,
      refundedAmount,
      netAmount,
      currency: row.currency || 'BRL',
      status: row.status || 'pending',
      method: normalizePaymentMethodLabel(row.payment_method),
      rawMethod: row.payment_method || null,
      isRecurring: Boolean(row.is_recurring),
      recurringFrequency: row.recurring_frequency || null,
      anonymous: Boolean(row.anonymous),
      message: isMaskedAnon ? null : row.message || null,
      transactionId: String(transactionId),
      receiptSentAt: row.receipt_sent_at || null,
      createdAt: row.created_at,
    }
  })
}
