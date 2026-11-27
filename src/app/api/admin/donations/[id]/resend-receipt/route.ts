import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { jsonNoStore, verifyAdminMutationOrigin } from '@/lib/admin-http'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDonationDestinationLabel, isValidUuid } from '@/lib/payments'
import { ensureDonorAccountAndAccessLink } from '@/lib/server/donor-provision'
import { sendDonorReceiptEmail } from '@/lib/server/email'

interface DonationRow {
  id: string
  user_id: string | null
  project_id: string | null
  campaign_slug: string | null
  donor_email: string | null
  donor_name: string | null
  amount: number | null
  status: string
  anonymous: boolean | null
  asaas_payment_id: string | null
  asaas_checkout_id: string | null
  payment_method: string | null
  is_recurring: boolean | null
  recurring_frequency: string | null
  message: string | null
  created_at: string | null
  projects?: { title?: string } | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminMutationOrigin(request)) {
    return jsonNoStore({ error: 'Origem da requisição não permitida.' }, { status: 403 })
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const donationId = (params?.id || '').trim()
  if (!isValidUuid(donationId)) {
    return jsonNoStore({ error: 'ID da doação inválido.' }, { status: 400 })
  }

  try {
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('donations')
      .select('*, projects:project_id(title)')
      .eq('id', donationId)
      .maybeSingle()

    if (fetchErr || !row) {
      return jsonNoStore({ error: 'Doação não encontrada.' }, { status: 404 })
    }

    const donation = row as DonationRow

    if (donation.status !== 'completed' && donation.status !== 'partially_refunded') {
      return jsonNoStore(
        { error: 'Só é possível enviar recibo para doações confirmadas ou parcialmente estornadas.' },
        { status: 422 }
      )
    }

    let donorEmail: string | null = donation.donor_email || null
    let donorName: string | null = donation.donor_name || null

    if (donation.user_id && (!donorEmail || !donorName)) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email, name')
        .eq('id', donation.user_id)
        .maybeSingle()
      if (prof) {
        donorEmail = donorEmail || prof.email || null
        donorName = donorName || prof.name || null
      }
    }

    if (!donorEmail || !donorEmail.includes('@')) {
      return jsonNoStore(
        { error: 'Esta doação não possui um endereço de e-mail válido cadastrado.' },
        { status: 422 }
      )
    }

    // Lock no servidor: evita dois e-mails em duplo clique/duas abas (R7).
    // O UPDATE condicional é atômico no Postgres; o segundo pedido não acha a linha.
    const lockAt = new Date().toISOString()
    const lockThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: claimed, error: lockErr } = await supabaseAdmin
      .from('donations')
      .update({ receipt_lock_at: lockAt })
      .eq('id', donationId)
      .in('status', ['completed', 'partially_refunded'])
      .or(`receipt_lock_at.is.null,receipt_lock_at.lt.${lockThreshold}`)
      .select('id')
      .maybeSingle()

    if (lockErr) {
      console.error('[AdminResendReceipt] Erro ao obter lock:', lockErr)
      return jsonNoStore({ error: 'Erro interno ao reenviar recibo.' }, { status: 500 })
    }

    if (!claimed) {
      return jsonNoStore(
        { error: 'Já existe um envio de recibo em andamento para esta doação.' },
        { status: 409 }
      )
    }

    let releaseLock = true

    try {
      const projectObj =
        donation.projects && typeof donation.projects === 'object' && !Array.isArray(donation.projects)
          ? donation.projects
          : null

      const projectTitle = getDonationDestinationLabel({
        projectTitle: projectObj?.title || null,
        campaignSlug: donation.campaign_slug || null,
        projectId: donation.project_id,
      })

      const provision = await ensureDonorAccountAndAccessLink({
        email: donorEmail,
        name: donorName,
      })

      const sendRes = await sendDonorReceiptEmail({
        to: donorEmail,
        donorName,
        anonymous: Boolean(donation.anonymous),
        amount: Number(donation.amount) || 0,
        projectTitle,
        donationId: donation.id,
        transactionId: donation.asaas_payment_id || donation.asaas_checkout_id || null,
        paymentMethod: donation.payment_method,
        isRecurring: Boolean(donation.is_recurring),
        recurringFrequency: donation.recurring_frequency,
        message: donation.message,
        createdAt: donation.created_at,
        portalAccessUrl: provision.portalAccessUrl,
        isNewAccount: provision.isNewAccount,
      })

      if (!sendRes.sent) {
        return jsonNoStore(
          { error: sendRes.error || 'Não foi possível enviar o e-mail pelo Resend.' },
          { status: sendRes.rateLimited ? 429 : 502 }
        )
      }

      const sentAt = new Date().toISOString()
      const { error: sentErr } = await supabaseAdmin
        .from('donations')
        .update({ receipt_sent_at: sentAt })
        .eq('id', donation.id)

      if (sentErr) {
        // Mantém o lock até expirar para evitar duplicidade se o admin clicar de novo.
        releaseLock = false
        console.error('[AdminResendReceipt] Erro ao gravar receipt_sent_at:', sentErr)
        return jsonNoStore(
          {
            error:
              'E-mail enviado, mas não foi possível registrar o envio. Tente novamente em alguns minutos.',
          },
          { status: 500 }
        )
      }

      return jsonNoStore({
        success: true,
        recipient: donorEmail,
        receiptSentAt: sentAt,
      })
    } finally {
      if (releaseLock) {
        const { error: releaseErr } = await supabaseAdmin
          .from('donations')
          .update({ receipt_lock_at: null })
          .eq('id', donationId)
          .eq('receipt_lock_at', lockAt)
        if (releaseErr) {
          console.error('[AdminResendReceipt] Erro ao liberar lock:', releaseErr)
        }
      }
    }
  } catch (err) {
    console.error('[AdminResendReceipt] Erro ao reenviar recibo:', err)
    return jsonNoStore({ error: 'Erro interno ao reenviar recibo.' }, { status: 500 })
  }
}
