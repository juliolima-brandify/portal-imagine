import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { jsonNoStore } from '@/lib/admin-http'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getDonationDestinationLabel,
  normalizePaymentMethodLabel,
  sumDonationsBrl,
} from '@/lib/payments'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

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

    // Carregar métricas globais exatas, paginando para não bater no teto de 1.000 do PostgREST
    const [statsRows, projectsRes] = await Promise.all([
      loadAllStatsRows(),
      supabaseAdmin.from('projects').select('id, title, slug'),
    ])

    const stats = {
      total: statsRows.length,
      completedCount: statsRows.filter((r) => r.status === 'completed').length,
      pendingCount: statsRows.filter((r) => r.status === 'pending').length,
      failedCount: statsRows.filter((r) => r.status === 'failed' || r.status === 'refunded').length,
      totalCompletedBrl: sumDonationsBrl(
        statsRows.filter((r) => r.status === 'completed').map((r) => r.amount)
      ),
      totalPendingBrl: sumDonationsBrl(
        statsRows.filter((r) => r.status === 'pending').map((r) => r.amount)
      ),
    }

    const projectMap = new Map<string, { title: string; slug: string | null }>()
    for (const p of projectsRes.data || []) {
      projectMap.set(p.id, { title: p.title, slug: p.slug || null })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Sem busca textual: aplica filtros direto no banco, com paginação exata.
    if (!searchQuery) {
      let pageQuery = supabaseAdmin
        .from('donations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })

      if (statusFilter === 'failed') {
        pageQuery = pageQuery.in('status', ['failed', 'refunded'])
      } else if (['completed', 'pending', 'refunded', 'partially_refunded'].includes(statusFilter)) {
        pageQuery = pageQuery.eq('status', statusFilter)
      }

      if (methodFilter === 'recurring') {
        pageQuery = pageQuery.eq('is_recurring', true)
      } else if (methodFilter === 'pix') {
        pageQuery = pageQuery.ilike('payment_method', '%pix%')
      } else if (methodFilter === 'card') {
        pageQuery = pageQuery.ilike('payment_method', '%credit%')
      }

      const { data: pageRows, count, error: pageErr } = await pageQuery.range(from, to)
      if (pageErr) {
        return jsonNoStore({ error: 'Erro ao listar doações.' }, { status: 500 })
      }

      const items = await hydrateDonations(pageRows || [], projectMap)
      return jsonNoStore({
        data: items,
        total: typeof count === 'number' ? count : items.length,
        page,
        pageSize,
        stats,
      })
    }

    // Busca textual: filtra no servidor (sem cortar no lote de 1.000).
    const safeTerm = sanitizeSearchTerm(searchQuery)
    if (!safeTerm) {
      return jsonNoStore({ data: [], total: 0, page, pageSize, stats })
    }
    const matchedProjectIds = await findProjectIdsByQuery(safeTerm)
    const searchPattern = `%${safeTerm}%`
    const orFilters = [
      `donor_name.ilike.${searchPattern}`,
      `donor_email.ilike.${searchPattern}`,
      `id.ilike.${searchPattern}`,
      `asaas_payment_id.ilike.${searchPattern}`,
      `asaas_checkout_id.ilike.${searchPattern}`,
    ]
    if (matchedProjectIds.length > 0) {
      orFilters.push(`project_id.in.(${matchedProjectIds.join(',')})`)
    }

    let searchQueryBuilder = supabaseAdmin
      .from('donations')
      .select('*', { count: 'exact' })
      .or(orFilters.join(','))
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })

    if (statusFilter === 'failed') {
      searchQueryBuilder = searchQueryBuilder.in('status', ['failed', 'refunded'])
    } else if (['completed', 'pending', 'refunded', 'partially_refunded'].includes(statusFilter)) {
      searchQueryBuilder = searchQueryBuilder.eq('status', statusFilter)
    }

    if (methodFilter === 'recurring') {
      searchQueryBuilder = searchQueryBuilder.eq('is_recurring', true)
    } else if (methodFilter === 'pix') {
      searchQueryBuilder = searchQueryBuilder.ilike('payment_method', '%pix%')
    } else if (methodFilter === 'card') {
      searchQueryBuilder = searchQueryBuilder.ilike('payment_method', '%credit%')
    }

    const { data: searchRows, count: searchCount, error: searchErr } = await searchQueryBuilder.range(from, to)
    if (searchErr) {
      return jsonNoStore({ error: 'Erro ao buscar doações.' }, { status: 500 })
    }

    const hydrated = await hydrateDonations(searchRows || [], projectMap)
    return jsonNoStore({
      data: hydrated,
      total: typeof searchCount === 'number' ? searchCount : hydrated.length,
      page,
      pageSize,
      stats,
    })
  } catch (err) {
    console.error('[AdminDonations] Exceção inesperada:', err)
    return jsonNoStore({ error: 'Erro interno ao listar doações.' }, { status: 500 })
  }
}

async function loadAllStatsRows(): Promise<
  Array<{ amount: any; status: string; payment_method: string | null; is_recurring: boolean }>
> {
  const rows: Array<{ amount: any; status: string; payment_method: string | null; is_recurring: boolean }> = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('amount, status, payment_method, is_recurring')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
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

async function hydrateDonations(
  rows: Array<Record<string, any>>,
  projectMap: Map<string, { title: string; slug: string | null }>
) {
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((id): id is string => typeof id === 'string' && id.length > 0))
  )

  const profileMap = new Map<string, { name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)
    for (const prof of profiles || []) {
      profileMap.set(prof.id, { name: prof.name || null, email: prof.email || null })
    }
  }

  return rows.map((row) => {
    const prof = row.user_id ? profileMap.get(row.user_id) : undefined
    const proj = row.project_id ? projectMap.get(row.project_id) : undefined

    const resolvedName = (row.donor_name || prof?.name || '').trim()
    const resolvedEmail = (row.donor_email || prof?.email || '').trim()
    const displayDonorName = row.anonymous
      ? resolvedName
        ? `Anônimo (${resolvedName})`
        : 'Doador Anônimo'
      : resolvedName || 'Não identificado'

    const transactionId =
      row.asaas_payment_id ||
      row.asaas_checkout_id ||
      '—'

    return {
      id: String(row.id),
      userId: row.user_id || null,
      projectId: row.project_id || null,
      campaignSlug: row.campaign_slug || null,
      projectTitle: getDonationDestinationLabel({
        projectTitle: proj?.title || null,
        campaignSlug: row.campaign_slug || null,
        projectId: row.project_id || null,
      }),
      donorName: displayDonorName,
      donorEmail: resolvedEmail || '—',
      hasValidEmail: Boolean(resolvedEmail && resolvedEmail.includes('@')),
      amount: Number(row.amount) || 0,
      currency: row.currency || 'BRL',
      status: row.status || 'pending',
      method: normalizePaymentMethodLabel(row.payment_method),
      rawMethod: row.payment_method || null,
      isRecurring: Boolean(row.is_recurring),
      recurringFrequency: row.recurring_frequency || null,
      anonymous: Boolean(row.anonymous),
      message: row.message || null,
      transactionId: String(transactionId),
      receiptSentAt: row.receipt_sent_at || null,
      createdAt: row.created_at,
    }
  })
}
