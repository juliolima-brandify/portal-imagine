import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { jsonNoStore } from '@/lib/admin-http'
import {
  SPECIAL_CAMPAIGNS,
  buildAsaasCheckoutPayload,
  checkoutRequestSchema,
  isValidUuid,
  resolvePublicCallbackBaseUrl,
  validateCheckoutAmountBrl,
} from '@/lib/payments'
import { createAsaasCheckoutSession, readBoundedJson } from '@/lib/server/asaas'

async function resolveOptionalUser(request: NextRequest): Promise<{
  id: string
  email: string | null
  name: string | null
  cpf: string | null
  phone: string | null
} | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  let authUser: { id: string; email?: string; user_metadata?: any } | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await client.auth.getUser(token)
      if (!error && data.user) authUser = data.user
    }
  }

  if (!authUser) {
    try {
      const serverClient = createServerClient()
      const { data, error } = await serverClient.auth.getUser()
      if (!error && data.user) authUser = data.user
    } catch {
      authUser = null
    }
  }

  if (!authUser) return null

  let profile: { name?: string | null; email?: string | null; cpf?: string | null; phone?: string | null } | null =
    null
  if (isSupabaseAdminConfigured()) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('name, email, cpf, phone')
      .eq('id', authUser.id)
      .maybeSingle()
    profile = data
  }

  return {
    id: authUser.id,
    email: profile?.email || authUser.email || null,
    name: profile?.name || authUser.user_metadata?.name || null,
    cpf: profile?.cpf || null,
    phone: profile?.phone || null,
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore(
      { success: false, error: 'Serviço de banco de dados indisponível no momento.' },
      { status: 503 }
    )
  }

  const parsedBody = await readBoundedJson(request, 32 * 1024)
  if (!parsedBody.ok) {
    return jsonNoStore({ success: false, error: parsedBody.error }, { status: parsedBody.status })
  }

  const validation = checkoutRequestSchema.safeParse(parsedBody.data)
  if (!validation.success) {
    const msg = validation.error.issues[0]?.message || 'Dados inválidos para iniciar a doação.'
    return jsonNoStore({ success: false, error: msg }, { status: 400 })
  }

  const { amount, projectId, projectTitle: clientTitle, options } = validation.data
  const amountCheck = validateCheckoutAmountBrl(amount)
  if (!amountCheck.ok) {
    return jsonNoStore({ success: false, error: amountCheck.error }, { status: 422 })
  }

  // Resolver projeto no Supabase ou campanha institucional ('geral' | 'natal')
  const rawTarget = projectId.trim()
  const lowerTarget = rawTarget.toLowerCase()

  let resolvedProjectId: string | null = null
  let campaignSlug: string | null = null
  let destinationTitle = clientTitle?.trim() || 'Instituto Imagine'
  let cancelPath = '/'

  if (SPECIAL_CAMPAIGNS[lowerTarget]) {
    resolvedProjectId = null
    campaignSlug = SPECIAL_CAMPAIGNS[lowerTarget].slug
    destinationTitle = SPECIAL_CAMPAIGNS[lowerTarget].title
    cancelPath = lowerTarget === 'natal' ? '/natal-feliz' : '/'
  } else {
    const query = supabaseAdmin.from('projects').select('id, title, slug, status')
    const { data: projectRow, error: projErr } = isValidUuid(rawTarget)
      ? await query.eq('id', rawTarget).maybeSingle()
      : await query.eq('slug', lowerTarget).maybeSingle()

    if (projErr || !projectRow) {
      return jsonNoStore(
        { success: false, error: 'O projeto selecionado não foi encontrado.' },
        { status: 404 }
      )
    }

    if (projectRow.status !== 'active') {
      return jsonNoStore(
        { success: false, error: 'Este projeto não está recebendo novas doações no momento.' },
        { status: 422 }
      )
    }

    resolvedProjectId = projectRow.id
    campaignSlug = projectRow.slug || null
    destinationTitle = projectRow.title
    cancelPath = projectRow.slug ? `/projetos/${projectRow.slug}` : '/'
  }

  const currentUser = await resolveOptionalUser(request)
  const isRecurring = Boolean(options.isRecurring)
  const frequency = isRecurring ? options.frequency || 'monthly' : null
  const anonymous = Boolean(options.anonymous)
  const cleanMessage = (options.message || '').trim() || null
  const donorNameHint = (options.donorName || currentUser?.name || '').trim() || null
  const donorEmailHint = currentUser?.email ? currentUser.email.trim().toLowerCase() : null

  // 1) Registrar intenção de doação pendente no Supabase (com fallback para banco dev antes da migração)
  let donationId: string | null = null

  const fullInsert = await supabaseAdmin
    .from('donations')
    .insert({
      user_id: currentUser?.id ?? null,
      project_id: resolvedProjectId,
      campaign_slug: campaignSlug,
      amount: amountCheck.valueBrl,
      currency: 'BRL',
      status: 'pending',
      payment_method: isRecurring ? 'CREDIT_CARD' : 'PIX',
      provider: 'asaas',
      is_recurring: isRecurring,
      recurring_frequency: frequency,
      message: cleanMessage,
      anonymous,
      donor_name: donorNameHint,
      donor_email: donorEmailHint,
    })
    .select('id')
    .single()

  if (!fullInsert.error && fullInsert.data?.id) {
    donationId = fullInsert.data.id
  } else {
    const legacyInsert = await supabaseAdmin
      .from('donations')
      .insert({
        user_id: currentUser?.id ?? null,
        project_id: resolvedProjectId,
        amount: amountCheck.valueBrl,
        currency: 'BRL',
        status: 'pending',
        payment_method: isRecurring ? 'CREDIT_CARD' : 'PIX',
        is_recurring: isRecurring,
        recurring_frequency: frequency,
        message: cleanMessage,
        anonymous,
      })
      .select('id')
      .single()

    if (legacyInsert.error || !legacyInsert.data?.id) {
      console.error('[Checkout] Erro ao gravar intenção de doação:', legacyInsert.error || fullInsert.error)
      return jsonNoStore(
        { success: false, error: 'Não foi possível registrar sua doação. Tente novamente.' },
        { status: 500 }
      )
    }
    donationId = String(legacyInsert.data.id)
  }

  if (!donationId) {
    return jsonNoStore(
      { success: false, error: 'Não foi possível registrar sua doação. Tente novamente.' },
      { status: 500 }
    )
  }

  // 2) Criar sessão segura no Asaas Checkout (POST /v3/checkouts)
  const requestOrigin = request.headers.get('origin') || new URL(request.url).origin
  const callbackBaseUrl = resolvePublicCallbackBaseUrl(
    requestOrigin,
    process.env.NEXT_PUBLIC_BASE_URL
  )

  const asaasPayload = buildAsaasCheckoutPayload({
    donationId,
    valueBrl: amountCheck.valueBrl,
    destinationTitle,
    isRecurring,
    recurringFrequency: frequency,
    callbackBaseUrl,
    cancelPath,
    customerData:
      currentUser || donorNameHint
        ? {
            name: donorNameHint,
            email: donorEmailHint,
            cpfCnpj: currentUser?.cpf,
            phone: currentUser?.phone,
          }
        : null,
  })

  const checkoutResult = await createAsaasCheckoutSession(asaasPayload)
  if (!checkoutResult.ok) {
    // Limpar registro pendente órfão para não poluir relatórios
    await supabaseAdmin.from('donations').delete().eq('id', donationId)
    return jsonNoStore(
      { success: false, error: checkoutResult.error },
      { status: checkoutResult.status }
    )
  }

  // 3) Vincular o ID da sessão do Asaas à doação
  const updateCheckoutId = await supabaseAdmin
    .from('donations')
    .update({ asaas_checkout_id: checkoutResult.checkoutId })
    .eq('id', donationId)

  if (updateCheckoutId.error) {
    await supabaseAdmin
      .from('donations')
      .update({ stripe_payment_intent_id: `asaas_chk_${checkoutResult.checkoutId}` })
      .eq('id', donationId)
  }

  return jsonNoStore({
    success: true,
    donationId,
    sessionId: checkoutResult.checkoutId,
    url: checkoutResult.checkoutUrl,
  })
}
