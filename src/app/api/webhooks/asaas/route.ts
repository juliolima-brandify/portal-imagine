import { NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { jsonNoStore } from '@/lib/admin-http'
import {
  classifyAsaasWebhookEvent,
  getDonationDestinationLabel,
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
  refundChanged: boolean
}

const VALID_STATUSES = new Set<DonationStatus>([
  'pending',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
])

function parseRpcOutcome(data: unknown): AppliedWebhookOutcome {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const asStatus = (value: unknown): DonationStatus | null =>
    typeof value === 'string' && VALID_STATUSES.has(value as DonationStatus)
      ? (value as DonationStatus)
      : null

  return {
    duplicate: Boolean(d.duplicate),
    matched: Boolean(d.matched),
    createdRenewal: Boolean(d.created_renewal),
    donationId: typeof d.donation_id === 'string' ? d.donation_id : null,
    previousStatus: asStatus(d.previous_status),
    currentStatus: asStatus(d.current_status),
    statusChanged: Boolean(d.status_changed),
    refundChanged: Boolean(d.refund_changed),
  }
}

function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  const message = String((error as { message?: string }).message ?? '')
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /could not find the function|function .* does not exist/i.test(message)
  )
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('asaas-access-token')
  if (!verifyAsaasWebhookToken(token)) {
    return jsonNoStore({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: 'Webhook temporariamente indisponível' }, { status: 503 })
  }

  const parsed = await readBoundedJson(request, 256 * 1024)
  if (!parsed.ok) {
    return jsonNoStore({ error: parsed.error }, { status: parsed.status })
  }

  const classified = classifyAsaasWebhookEvent(parsed.data)
  if (!classified) {
    return jsonNoStore({ error: 'Evento de webhook inválido' }, { status: 400 })
  }

  let outcome: AppliedWebhookOutcome
  try {
    outcome = await applyAsaasWebhookEvent({ classified, rawPayload: parsed.data })
  } catch (error) {
    if (isMissingRpcError(error)) {
      // Sem a migração, o fallback perdia a 2ª parcela e não deduplicava.
      // 503 faz o Asaas reenviar quando a RPC estiver disponível.
      console.error(
        '[WebhookAsaas] RPC apply_asaas_webhook_event ausente. Migração não aplicada; respondendo 503.'
      )
      return jsonNoStore({ error: 'Webhook temporariamente indisponível' }, { status: 503 })
    }
    console.error('[WebhookAsaas] Erro ao persistir evento', error)
    return jsonNoStore({ error: 'Erro interno ao processar evento' }, { status: 500 })
  }

  if (outcome.duplicate) {
    return jsonNoStore({ received: true, duplicate: true })
  }

  if (!outcome.matched || !outcome.donationId) {
    return jsonNoStore({ received: true, matched: false })
  }

  const becameCompleted =
    outcome.currentStatus === 'completed' && (outcome.statusChanged || outcome.createdRenewal)
  const becameAlertState =
    classified.shouldNotifyFailureOrRefund && (outcome.statusChanged || outcome.refundChanged)

  if (becameCompleted || becameAlertState) {
    const donationId = outcome.donationId
    runInBackground(() =>
      handlePostWebhookSideEffects({
        donationId,
        eventType: classified.eventType,
        becameCompleted,
        becameAlertState,
        checkoutId: classified.checkoutId,
        customerId: classified.customerId,
        paymentId: classified.paymentId,
        billingType: classified.billingType,
        donorName: classified.donorName,
        donorEmail: classified.donorEmail,
      })
    )
  }

  return jsonNoStore({
    received: true,
    donationId: outcome.donationId,
    status: outcome.currentStatus,
  })
}

async function applyAsaasWebhookEvent(params: {
  classified: NonNullable<ReturnType<typeof classifyAsaasWebhookEvent>>
  rawPayload: unknown
}): Promise<AppliedWebhookOutcome> {
  const { classified } = params

  const rpcRes = await supabaseAdmin.rpc('apply_asaas_webhook_event', {
    p_event_id: classified.eventId,
    p_event_type: classified.eventType,
    p_external_reference: classified.externalReference,
    p_asaas_checkout_id: classified.checkoutId,
    p_asaas_payment_id: classified.paymentId,
    p_asaas_subscription_id: classified.subscriptionId,
    p_asaas_customer_id: classified.customerId,
    p_target_status: classified.targetStatus,
    p_payment_method: classified.billingType,
    p_amount: classified.valueBrl,
    p_donor_name: classified.donorName,
    p_donor_email: classified.donorEmail,
    p_payload: params.rawPayload,
    p_refunded_amount: classified.refundedAmountBrl,
  })

  if (rpcRes.error) throw rpcRes.error
  return parseRpcOutcome(rpcRes.data)
}

async function handlePostWebhookSideEffects(params: {
  donationId: string
  eventType: string
  becameCompleted: boolean
  becameAlertState: boolean
  checkoutId: string | null
  customerId: string | null
  paymentId: string | null
  billingType: string | null
  donorName: string | null
  donorEmail: string | null
}): Promise<void> {
  let paymentId = params.paymentId
  let customerId = params.customerId
  let billingType = params.billingType
  let donorName = params.donorName
  let donorEmail = params.donorEmail

  // Enriquecimento fora do caminho crítico do webhook (R3: responder 200 rápido).
  if (params.checkoutId && (!paymentId || !customerId || !billingType)) {
    const summary = await getAsaasPaymentByCheckoutSession(params.checkoutId)
    if (summary) {
      paymentId = paymentId ?? summary.id
      customerId = customerId ?? summary.customerId
      billingType = billingType ?? summary.billingType
    }
  }

  if (customerId && (!donorEmail || !donorName)) {
    const customer = await getAsaasCustomer(customerId)
    if (customer) {
      donorName = donorName ?? customer.name
      donorEmail = donorEmail ?? customer.email
    }
  }

  const rowRes = await supabaseAdmin
    .from('donations')
    .select('*, projects:project_id(title)')
    .eq('id', params.donationId)
    .maybeSingle()

  const row = rowRes.data
  if (!row) return

  const enrichUpdates: Record<string, unknown> = {}
  if (paymentId && !row.asaas_payment_id) enrichUpdates.asaas_payment_id = paymentId
  if (customerId && !row.asaas_customer_id) enrichUpdates.asaas_customer_id = customerId
  if (billingType && !row.payment_method) enrichUpdates.payment_method = billingType
  if (donorName && !row.donor_name) enrichUpdates.donor_name = donorName
  if (donorEmail && !row.donor_email) enrichUpdates.donor_email = donorEmail.toLowerCase()

  if (Object.keys(enrichUpdates).length > 0) {
    await supabaseAdmin.from('donations').update(enrichUpdates).eq('id', params.donationId)
  }

  const projectObj =
    row.projects && typeof row.projects === 'object' && !Array.isArray(row.projects)
      ? (row.projects as { title: string })
      : null
  const projectTitle = getDonationDestinationLabel({
    projectTitle: projectObj?.title,
    campaignSlug: row.campaign_slug,
  })

  const effectiveDonorEmail = row.donor_email || (donorEmail ? donorEmail.toLowerCase() : null)
  const effectiveDonorName = row.donor_name || donorName
  const amount = Number(row.amount)
  const txId = row.asaas_payment_id || paymentId || null
  const method = row.payment_method || billingType || 'PIX'

  if (params.becameCompleted) {
    if (effectiveDonorEmail && !row.receipt_sent_at) {
      const lockAt = new Date().toISOString()
      const lockThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data: claimed, error: claimErr } = await supabaseAdmin
        .from('donations')
        .update({ receipt_lock_at: lockAt })
        .eq('id', params.donationId)
        .is('receipt_sent_at', null)
        .or(`receipt_lock_at.is.null,receipt_lock_at.lt.${lockThreshold}`)
        .select('id')
        .maybeSingle()

      if (claimErr) {
        console.error('[AsaasWebhook] Erro ao obter lock de recibo:', claimErr)
      } else if (claimed) {
        try {
          const provision = await ensureDonorAccountAndAccessLink({
            email: effectiveDonorEmail,
            name: effectiveDonorName,
          })

          if (provision.userId && !row.user_id) {
            await supabaseAdmin
              .from('donations')
              .update({ user_id: provision.userId })
              .eq('id', params.donationId)
          }

          const receipt = await sendDonorReceiptEmail({
            to: effectiveDonorEmail,
            donorName: effectiveDonorName,
            anonymous: Boolean(row.anonymous),
            amount,
            projectTitle,
            donationId: params.donationId,
            transactionId: txId,
            paymentMethod: method,
            isRecurring: Boolean(row.is_recurring),
            recurringFrequency: row.recurring_frequency,
            message: row.message,
            createdAt: row.created_at,
            isNewAccount: provision.isNewAccount,
            portalAccessUrl: provision.portalAccessUrl,
          })

          if (receipt.sent) {
            const { error: sentErr } = await supabaseAdmin
              .from('donations')
              .update({
                receipt_sent_at: new Date().toISOString(),
                receipt_lock_at: null,
              })
              .eq('id', params.donationId)
              .eq('receipt_lock_at', lockAt)
            if (sentErr) {
              console.error('[AsaasWebhook] Erro ao gravar receipt_sent_at:', sentErr)
            }
          } else {
            const { error: releaseErr } = await supabaseAdmin
              .from('donations')
              .update({ receipt_lock_at: null })
              .eq('id', params.donationId)
              .eq('receipt_lock_at', lockAt)
            if (releaseErr) {
              console.error('[AsaasWebhook] Erro ao liberar lock de recibo:', releaseErr)
            }
          }
        } catch (err) {
          console.error('[AsaasWebhook] Erro ao enviar recibo:', err)
          await supabaseAdmin
            .from('donations')
            .update({ receipt_lock_at: null })
            .eq('id', params.donationId)
            .eq('receipt_lock_at', lockAt)
        }
      }
    } else if (effectiveDonorEmail && !row.user_id) {
      const provision = await ensureDonorAccountAndAccessLink({
        email: effectiveDonorEmail,
        name: effectiveDonorName,
      })

      if (provision.userId) {
        await supabaseAdmin
          .from('donations')
          .update({ user_id: provision.userId })
          .eq('id', params.donationId)
      }
    }

    await sendAdminNewDonationEmail({
      donorName: effectiveDonorName,
      donorEmail: effectiveDonorEmail,
      anonymous: Boolean(row.anonymous),
      amount,
      projectTitle,
      donationId: params.donationId,
      transactionId: txId,
      paymentMethod: method,
      isRecurring: Boolean(row.is_recurring),
      recurringFrequency: row.recurring_frequency,
      message: row.message,
    })
  } else if (params.becameAlertState) {
    await sendAdminPaymentAlertEmail({
      eventType: params.eventType,
      amount,
      projectTitle,
      donationId: params.donationId,
      donorEmail: effectiveDonorEmail,
    })
  }
}
