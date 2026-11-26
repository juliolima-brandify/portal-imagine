import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { jsonNoStore, verifyAdminMutationOrigin } from '@/lib/admin-http'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDonationDestinationLabel, isValidUuid } from '@/lib/payments'
import { ensureDonorAccountAndAccessLink } from '@/lib/server/donor-provision'
import { sendDonorReceiptEmail } from '@/lib/server/email'

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

    if (row.status !== 'completed') {
      return jsonNoStore(
        { error: 'Só é possível enviar recibo para doações já confirmadas.' },
        { status: 422 }
      )
    }

    let donorEmail: string | null = (row as any).donor_email || null
    let donorName: string | null = (row as any).donor_name || null

    if (row.user_id && (!donorEmail || !donorName)) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email, name')
        .eq('id', row.user_id)
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
    const lockThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: claimed, error: lockErr } = await supabaseAdmin
      .from('donations')
      .update({ receipt_lock_at: new Date().toISOString() })
      .eq('id', donationId)
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

    try {
      const projectObj =
        row.projects && typeof row.projects === 'object' && !Array.isArray(row.projects)
          ? (row.projects as { title?: string })
          : null

      const projectTitle = getDonationDestinationLabel({
        projectTitle: projectObj?.title || null,
        campaignSlug: (row as any).campaign_slug || null,
        projectId: row.project_id,
      })

      const provision = await ensureDonorAccountAndAccessLink({
        email: donorEmail,
        name: donorName,
      })

      const sendRes = await sendDonorReceiptEmail({
        to: donorEmail,
        donorName,
        anonymous: Boolean(row.anonymous),
        amount: Number(row.amount) || 0,
        projectTitle,
        donationId: row.id,
        transactionId:
          (row as any).asaas_payment_id ||
          (row as any).asaas_checkout_id ||
          null,
        paymentMethod: row.payment_method,
        isRecurring: Boolean(row.is_recurring),
        recurringFrequency: row.recurring_frequency,
        message: row.message,
        createdAt: row.created_at,
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
      await supabaseAdmin
        .from('donations')
        .update({ receipt_sent_at: sentAt })
        .eq('id', row.id)
        .then(() => undefined, () => undefined)

      return jsonNoStore({
        success: true,
        recipient: donorEmail,
        receiptSentAt: sentAt,
      })
    } finally {
      // Libera o lock sempre, mesmo em erro, para não travar o reenvio.
      await supabaseAdmin
        .from('donations')
        .update({ receipt_lock_at: null })
        .eq('id', donationId)
        .then(() => undefined, () => undefined)
    }
  } catch (err) {
    console.error('[AdminResendReceipt] Erro ao reenviar recibo:', err)
    return jsonNoStore({ error: 'Erro interno ao reenviar recibo.' }, { status: 500 })
  }
}
