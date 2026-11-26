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

    // Carregar métricas globais exatas em centavos + projetos em paralelo
    const [allStatsRes, projectsRes] = await Promise.all([
      supabaseAdmin
        .from('donations')
        .select('id, amount, status, payment_method, is_recurring')
        .limit(5000),
      supabaseAdmin.from('projects').select('id, title, slug'),
    ])

    if (allStatsRes.error) {
      console.error('[AdminDonations] Erro ao carregar estatísticas:', allStatsRes.error)
      return jsonNoStore({ error: 'Erro ao carregar doações.' }, { status: 500 })
    }

    const statsRows = allStatsRes.data || []
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

    // Buscar linhas para filtragem/paginação
    let listQuery = supabaseAdmin
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })

    if (statusFilter !== 'all') {
      if (statusFilter === 'failed') {
        listQuery = listQuery.in('status', ['failed', 'refunded'])
      } else if (['completed', 'pending', 'refunded'].includes(statusFilter)) {
        listQuery = listQuery.eq('status', statusFilter)
      }
    }

    if (methodFilter === 'recurring') {
      listQuery = listQuery.eq('is_recurring', true)
    } else if (methodFilter === 'pix') {
      listQuery = listQuery.ilike('payment_method', '%pix%')
    } else if (methodFilter === 'card') {
      listQuery = listQuery.or('payment_method.ilike.%credit%,payment_method.ilike.%cart%')
    }

    // Se não houver busca textual livre, pagina direto no banco; com busca textual, filtra com segurança no lote recente
    if (!searchQuery) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: pageRows, count, error: pageErr } = await supabaseAdmin
        .from('donations')
        .select('*', { count: 'exact' })
        .match(
          statusFilter !== 'all' && statusFilter !== 'failed'
            ? { status: statusFilter }
            : {}
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)

      // Se houver filtro composto (failed+refunded ou methodFilter), usa listQuery com count
      if (statusFilter === 'failed' || methodFilter !== 'all' || pageErr) {
        const { data: filteredRows, error: fErr } = await listQuery.limit(1000)
        if (fErr) {
          return jsonNoStore({ error: 'Erro ao filtrar doações.' }, { status: 500 })
        }
        const allItems = await hydrateDonations(filteredRows || [], projectMap)
        const slice = allItems.slice(from, from + pageSize)
        return jsonNoStore({
          data: slice,
          total: allItems.length,
          page,
          pageSize,
          stats,
        })
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

    const { data: candidateRows, error: searchErr } = await listQuery.limit(1000)
    if (searchErr) {
      return jsonNoStore({ error: 'Erro ao buscar doações.' }, { status: 500 })
    }

    const hydrated = await hydrateDonations(candidateRows || [], projectMap)
    const matched = hydrated.filter((item) => {
      return (
        item.donorName.toLowerCase().includes(searchQuery) ||
        item.donorEmail.toLowerCase().includes(searchQuery) ||
        item.projectTitle.toLowerCase().includes(searchQuery) ||
        item.id.toLowerCase().includes(searchQuery) ||
        item.transactionId.toLowerCase().includes(searchQuery)
      )
    })

    const from = (page - 1) * pageSize
    return jsonNoStore({
      data: matched.slice(from, from + pageSize),
      total: matched.length,
      page,
      pageSize,
      stats,
    })
  } catch (err) {
    console.error('[AdminDonations] Exceção inesperada:', err)
    return jsonNoStore({ error: 'Erro interno ao listar doações.' }, { status: 500 })
  }
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
      row.stripe_payment_intent_id ||
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
