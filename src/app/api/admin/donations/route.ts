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
} from '@/lib/payments'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const BATCH_SIZE = 500
const MAX_PAGES = 200
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
    const mode = (searchParams.get('mode') || '').trim().toLowerCase()

    if (mode === 'report') {
      const startParam = (searchParams.get('start') || '').trim() || null
      const endParam = (searchParams.get('end') || '').trim() || null
      const rawProjectId = (searchParams.get('projectId') || '').trim()
      const projectId =
        rawProjectId && rawProjectId.toLowerCase() !== 'all' ? rawProjectId : null

      if (projectId && !isValidUuid(projectId)) {
        return jsonNoStore({ error: 'Projeto inválido para o relatório.' }, { status: 400 })
      }
      if (startParam && Number.isNaN(Date.parse(startParam))) {
        return jsonNoStore({ error: 'Data inicial inválida.' }, { status: 400 })
      }
      if (endParam && Number.isNaN(Date.parse(endParam))) {
        return jsonNoStore({ error: 'Data final inválida.' }, { status: 400 })
      }

      const { data: reportData, error: reportErr } = await supabaseAdmin.rpc(
        'admin_donations_report',
        {
          p_start: startParam,
          p_end: endParam,
          p_project_id: projectId,
        }
      )

      if (reportErr) {
        console.error('[AdminDonations] Erro ao gerar relatório agregado:', reportErr)
        return jsonNoStore({ error: 'Erro ao carregar relatório de doações.' }, { status: 500 })
      }

      return jsonNoStore({ report: reportData ?? {} })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    )
    const statusFilter = (searchParams.get('status') || 'all').trim().toLowerCase()
    const methodFilter = (searchParams.get('method') || 'all').trim().toLowerCase()
    const searchQuery = (searchParams.get('q') || '').trim().slice(0, 100).toLowerCase()
    const includeStats = searchParams.get('stats') !== 'false'
    const all = searchParams.get('all') === 'true'
    const maskAnonymous =
      searchParams.get('maskAnonymous') === 'true' || searchParams.get('view') === 'summary'

    // Totais por status vêm de uma RPC agregada (item 11). Sem reler a tabela inteira a cada página;
    // o painel pede stats=true só na primeira carga.
    const [totalsRaw, projectsRes] = await Promise.all([
      includeStats ? loadDonationTotals() : Promise.resolve({} as DonationTotals),
      supabaseAdmin.from('projects').select('id, title, slug'),
    ])

    // Sem stats=true a resposta não traz totais (null), para a tela não sobrescrever com zeros.

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
      const { rows, truncated } = await loadAllDonations(statusFilter, methodFilter, searchQuery)
      // Nunca corta em silêncio (R16): se o teto de páginas foi atingido, avisa explicitamente.
      if (truncated) {
        return jsonNoStore(
          { error: 'A lista excede o limite de linhas para exportação. Refine os filtros.', truncated: true },
          { status: 422 }
        )
      }
      const items = await hydrateDonations(rows, projectMap, maskAnonymous)
      return jsonNoStore({
        data: items,
        total: items.length,
        page: 1,
        pageSize: items.length,
        stats: includeStats ? statsFromTotals(totalsRaw) : null,
      })
    }

    const safeTerm = searchQuery ? sanitizeSearchTerm(searchQuery) : ''
    if (searchQuery && !safeTerm) {
      return jsonNoStore({ data: [], total: 0, page, pageSize, stats: includeStats ? statsFromTotals(totalsRaw) : null })
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
      stats: includeStats ? statsFromTotals(totalsRaw) : null,
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
    } else {
      // Prefixo de UUID com 8+ hex (como aparece na tela): faixa por id, sem curingas.
      const range = uuidPrefixRange(opts.safeTerm)
      if (range) orFilters.push(`and(id.gte.${range.lo},id.lte.${range.hi})`)
    }
    if (opts.matchedProjectIds.length > 0) {
      orFilters.push(`project_id.in.(${opts.matchedProjectIds.join(',')})`)
    }
    q = q.or(orFilters.join(','))
  }

  if (opts.statusFilter === 'failed') {
    q = q.in('status', ['failed', 'refunded'])
  } else if (
    ['completed', 'pending', 'refunded', 'partially_refunded', 'disputed'].includes(opts.statusFilter)
  ) {
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

interface DonationTotals {
  by_status?: Record<string, { count: number; gross: number; refunded: number; net: number }>
  unique_donors?: number
}

async function loadDonationTotals(): Promise<DonationTotals> {
  const { data, error } = await supabaseAdmin.rpc('admin_donation_totals')
  if (error) throw error
  return (data ?? {}) as DonationTotals
}

function statsFromTotals(totals: DonationTotals) {
  const byStatus = totals.by_status ?? {}
  const count = (status: string) => Number(byStatus[status]?.count) || 0
  const total = Object.values(byStatus).reduce((acc, item) => acc + (Number(item?.count) || 0), 0)
  return {
    total,
    completedCount: count('completed'),
    partiallyRefundedCount: count('partially_refunded'),
    disputedCount: count('disputed'),
    pendingCount: count('pending'),
    failedCount: count('failed') + count('refunded'),
    totalCompletedBrl: sumDonationsBrl([
      byStatus.completed?.net ?? 0,
      byStatus.partially_refunded?.net ?? 0,
    ]),
    totalPendingBrl: sumDonationsBrl([byStatus.pending?.gross ?? 0]),
    uniqueDonors: Number(totals.unique_donors) || 0,
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
): Promise<{ rows: DonationRow[]; truncated: boolean }> {
  const rows: DonationRow[] = []
  let safeTerm = ''
  let matchedProjectIds: string[] = []

  if (searchQuery) {
    safeTerm = sanitizeSearchTerm(searchQuery)
    if (!safeTerm) return { rows: [], truncated: false }
    matchedProjectIds = await findProjectIdsByQuery(safeTerm)
  }

  let offset = 0
  let truncated = true
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

    const { data, error } = await query.range(offset, offset + BATCH_SIZE)
    if (error) throw error
    const batch = (data || []) as unknown as DonationRow[]
    if (batch.length <= BATCH_SIZE) {
      rows.push(...batch)
      truncated = false
      break
    }
    rows.push(...batch.slice(0, BATCH_SIZE))
    offset += BATCH_SIZE
  }

  return { rows, truncated }
}

/** Faixa de UUID para um prefixo hexadecimal de 8 a 32 dígitos (com ou sem hifens). */
function uuidPrefixRange(term: string): { lo: string; hi: string } | null {
  const hex = term.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{8,32}$/.test(hex)) return null
  const fmt = (h: string) =>
    `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
  return { lo: fmt(hex.padEnd(32, '0')), hi: fmt(hex.padEnd(32, 'f')) }
}

function sanitizeSearchTerm(value: string): string {
  // Remove curingas (%, *) e caracteres que quebram a sintaxe do filtro `.or()` do PostgREST.
  // O "_" fica: é o que aparece em ids como pay_... e a busca precisa achá-los.
  return value.replace(/[%(),"\\'*]/g, ' ').replace(/\s+/g, ' ').trim()
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
