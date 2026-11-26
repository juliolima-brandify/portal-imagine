import { NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { jsonNoStore } from '@/lib/admin-http'
import {
  classifyAsaasWebhookEvent,
  getDonationDestinationLabel,
  isValidUuid,
  resolveNextDonationStatus,
  type DonationStatus,
} from '@/lib/payments'
import {
  getAsaasCustomer,
  getAsaasPaymentByCheckoutSession,
  readBoundedJson,
  verifyAsaasWebhookToken,
} from '@/lib/server/asaas'
import { ensureDonorAccountAndAccessLink } from '@/lib/server/donor-provision'
import {
  sendAdminNewDonationEmail,
  sendAdminPaymentAlertEmail,
  sendDonorReceiptEmail,
} from '@/lib/server/email'
import { runInBackground } from '@/lib/server/background'

interface AppliedWebhookOutcome {
  duplicate: boolean
  matched: boolean
  createdRenewal: boolean
  donationId: string | null
  previousStatus: DonationStatus | null
  currentStatus: DonationStatus | null
  statusChanged: boolean
}

export async function POST(request: NextRequest) {
  const tokenHeader = request.headers.get('asaas-access-token')
  if (!verifyAsaasWebhookToken(tokenHeader)) {
    return jsonNoStore({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: 'Banco indisponível' }, { status: 503 })
  }

  const parsed = await readBoundedJson(request, 256 * 1024)
  if (!parsed.ok) {
    return jsonNoStore({ error: parsed.error }, { status: parsed.status })
  }

  const classified = classifyAsaasWebhookEvent(parsed.data)
  if (!classified) {
    return jsonNoStore({ error: 'Evento de webhook inválido' }, { status: 400 })
  }

  let paymentId = classified.paymentId
  let subscriptionId = classified.subscriptionId
  let customerId = classified.customerId
  let billingType = classified.billingType
  let valueBrl = classified.valueBrl
  let donorName = classified.donorName
  let donorEmail = classified.donorEmail

  // Quando chega CHECKOUT_PAID, busca resumo da cobrança para capturar paymentId / billingType / customerId
  if (classified.checkoutId && (!paymentId || !customerId || !billingType)) {
    const paymentSummary = await getAsaasPaymentByCheckoutSession(classified.checkoutId)
    if (paymentSummary) {
      paymentId = paymentId || paymentSummary.id
      customerId = customerId || paymentSummary.customerId
      subscriptionId = subscriptionId || paymentSummary.subscriptionId
      billingType = billingType || paymentSummary.billingType
      valueBrl = valueBrl ?? paymentSummary.value
    }
  }

  // Enriquecer nome e e-mail do doador digitados na tela segura do Asaas
  if (customerId && (!donorEmail || !donorName)) {
    const customer = await getAsaasCustomer(customerId)
    if (customer) {
      donorName = donorName || customer.name
      donorEmail = donorEmail || customer.email
    }
  }

  let outcome: AppliedWebhookOutcome

  try {
    outcome = await applyWebhookToDatabase({
      classified,
      paymentId,
      subscriptionId,
      customerId,
      billingType,
      valueBrl,
      donorName,
      donorEmail,
      rawPayload: parsed.data,
    })
  } catch (err) {
    console.error('[WebhookAsaas] Erro ao persistir evento no banco:', err)
    return jsonNoStore({ error: 'Erro interno ao persistir evento' }, { status: 500 })
  }

  if (outcome.duplicate) {
    return jsonNoStore({ received: true, duplicate: true })
  }

  if (!outcome.matched || !outcome.donationId) {
    return jsonNoStore({ received: true, matched: false })
  }

  const finalDonationId = outcome.donationId
  const becameCompleted =
    outcome.currentStatus === 'completed' && (outcome.statusChanged || outcome.createdRenewal)
  const becameAlertState =
    classified.shouldNotifyFailureOrRefund && outcome.statusChanged

  if (becameCompleted || becameAlertState) {
    runInBackground(async () => {
      await handlePostWebhookSideEffects({
        donationId: finalDonationId,
        eventType: classified.eventType,
        becameCompleted,
        becameAlertState,
        fallbackDonorName: donorName,
        fallbackDonorEmail: donorEmail,
        fallbackPaymentId: paymentId,
        fallbackBillingType: billingType,
      })
    })
  }

  return jsonNoStore({
    received: true,
    donationId: finalDonationId,
    status: outcome.currentStatus,
  })
}

async function applyWebhookToDatabase(params: {
  classified: NonNullable<ReturnType<typeof classifyAsaasWebhookEvent>>
  paymentId: string | null
  subscriptionId: string | null
  customerId: string | null
  billingType: string | null
  valueBrl: number | null
  donorName: string | null
  donorEmail: string | null
  rawPayload: unknown
}): Promise<AppliedWebhookOutcome> {
  const { classified } = params

  const rpcRes = await supabaseAdmin.rpc('apply_asaas_webhook_event', {
    p_event_id: classified.eventId,
    p_event_type: classified.eventType,
    p_external_reference: classified.externalReference,
    p_asaas_checkout_id: classified.checkoutId,
    p_asaas_payment_id: params.paymentId,
    p_asaas_subscription_id: params.subscriptionId,
    p_asaas_customer_id: params.customerId,
    p_target_status: classified.targetStatus,
    p_payment_method: params.billingType,
    p_amount: params.valueBrl,
    p_donor_name: params.donorName,
    p_donor_email: params.donorEmail,
    p_payload: params.rawPayload ?? {},
  })

  if (!rpcRes.error && rpcRes.data && typeof rpcRes.data === 'object') {
    const d = rpcRes.data as Record<string, any>
    return {
      duplicate: Boolean(d.duplicate),
      matched: Boolean(d.matched),
      createdRenewal: Boolean(d.created_renewal),
      donationId: typeof d.donation_id === 'string' ? d.donation_id : null,
      previousStatus: (d.previous_status as DonationStatus) || null,
      currentStatus: (d.current_status as DonationStatus) || null,
      statusChanged: Boolean(d.status_changed),
    }
  }

  // Fallback seguro apenas caso a migração SQL ainda não tenha sido aplicada em ambiente dev
  if (rpcRes.error && rpcRes.error.code !== 'PGRST202' && rpcRes.error.code !== '42883') {
    throw rpcRes.error
  }

  if (!classified.externalReference || !isValidUuid(classified.externalReference)) {
    return {
      duplicate: false,
      matched: false,
      createdRenewal: false,
      donationId: null,
      previousStatus: null,
      currentStatus: null,
      statusChanged: false,
    }
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('donations')
    .select('id, status')
    .eq('id', classified.externalReference)
    .maybeSingle()

  if (fetchErr) throw fetchErr
  if (!existing) {
    return {
      duplicate: false,
      matched: false,
      createdRenewal: false,
      donationId: null,
      previousStatus: null,
      currentStatus: null,
      statusChanged: false,
    }
  }

  const prevStatus = (existing.status as DonationStatus) || 'pending'
  const nextStatus = resolveNextDonationStatus(prevStatus, classified.targetStatus)

  const updates: Record<string, unknown> = { status: nextStatus }
  if (params.billingType) updates.payment_method = params.billingType
  if (params.paymentId) updates.stripe_payment_intent_id = params.paymentId

  const { error: updErr } = await supabaseAdmin
    .from('donations')
    .update(updates)
    .eq('id', existing.id)

  if (updErr) throw updErr

  return {
    duplicate: false,
    matched: true,
    createdRenewal: false,
    donationId: existing.id,
    previousStatus: prevStatus,
    currentStatus: nextStatus,
    statusChanged: prevStatus !== nextStatus,
  }
}

async function handlePostWebhookSideEffects(params: {
  donationId: string
  eventType: string
  becameCompleted: boolean
  becameAlertState: boolean
  fallbackDonorName: string | null
  fallbackDonorEmail: string | null
  fallbackPaymentId: string | null
  fallbackBillingType: string | null
}): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from('donations')
    .select('*, projects:project_id(title)')
    .eq('id', params.donationId)
    .maybeSingle()

  if (!row) return

  const projectObj =
    row.projects && typeof row.projects === 'object' && !Array.isArray(row.projects)
      ? (row.projects as { title?: string })
      : null

  const projectTitle = getDonationDestinationLabel({
    projectTitle: projectObj?.title || null,
    campaignSlug: (row as any).campaign_slug || null,
    projectId: row.project_id,
  })

  let donorEmail: string | null =
    (row as any).donor_email || params.fallbackDonorEmail || null
  let donorName: string | null =
    (row as any).donor_name || params.fallbackDonorName || null

  if (row.user_id && (!donorEmail || !donorName)) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', row.user_id)
      .maybeSingle()
    if (profile) {
      donorEmail = donorEmail || profile.email || null
      donorName = donorName || profile.name || null
    }
  }

  const amountNum = Number(row.amount) || 0
  const txId =
    (row as any).asaas_payment_id ||
    params.fallbackPaymentId ||
    row.stripe_payment_intent_id ||
    null
  const method = row.payment_method || params.fallbackBillingType || 'PIX'

  if (params.becameCompleted) {
    // 1) Decisão 3A: criar/vincular conta automática no Portal sem senha em texto plano
    const provision = await ensureDonorAccountAndAccessLink({
      email: donorEmail,
      name: donorName,
    })

    if (provision.userId && !row.user_id) {
      await supabaseAdmin
        .from('donations')
        .update({ user_id: provision.userId })
        .eq('id', row.id)
    }

    // 2) Enviar recibo transacional ao doador (evitando duplicidade se receipt_sent_at já estiver preenchido)
    const alreadySentReceipt = Boolean((row as any).receipt_sent_at)
    if (donorEmail && !alreadySentReceipt) {
      const receiptRes = await sendDonorReceiptEmail({
        to: donorEmail,
        donorName,
        anonymous: Boolean(row.anonymous),
        amount: amountNum,
        projectTitle,
        donationId: row.id,
        transactionId: txId,
        paymentMethod: method,
        isRecurring: Boolean(row.is_recurring),
        recurringFrequency: row.recurring_frequency,
        message: row.message,
        createdAt: row.created_at,
        portalAccessUrl: provision.portalAccessUrl,
        isNewAccount: provision.isNewAccount,
      })

      if (receiptRes.sent) {
        await supabaseAdmin
          .from('donations')
          .update({ receipt_sent_at: new Date().toISOString() })
          .eq('id', row.id)
          .then(() => undefined, () => undefined)
      }
    }

    // 3) Notificar administrador e registrar notificação interna no Portal (se user_id existir)
    await sendAdminNewDonationEmail({
      donorName,
      donorEmail,
      anonymous: Boolean(row.anonymous),
      amount: amountNum,
      projectTitle,
      donationId: row.id,
      transactionId: txId,
      paymentMethod: method,
      isRecurring: Boolean(row.is_recurring),
      recurringFrequency: row.recurring_frequency,
      message: row.message,
    })

    const targetUserId = provision.userId || row.user_id
    if (targetUserId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'donation',
          title: 'Doação Confirmada!',
          message: `Recebemos sua doação de R$ ${amountNum.toFixed(2).replace('.', ',')} para "${projectTitle}". Obrigado!`,
          read: false,
          data: { donationId: row.id, projectId: row.project_id, amount: amountNum },
        })
        .then(() => undefined, () => undefined)
    }
  } else if (params.becameAlertState) {
    await sendAdminPaymentAlertEmail({
      eventType: params.eventType,
      amount: amountNum,
      projectTitle,
      donationId: row.id,
      donorEmail,
    })
  }
}
