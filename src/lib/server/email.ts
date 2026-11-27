import 'server-only'
import {
  buildDonorReceiptEmail,
  type DonorReceiptEmailInput,
  INSTITUTE_CNPJ,
  INSTITUTE_NAME,
  INSTITUTE_ADDRESS,
  escapeHtml,
  formatCurrencyBRL,
  getDonationStatusLabelPTBR,
  getFrequencyLabelPTBR,
  normalizePaymentMethodLabel,
  getReceiptAmounts,
} from '@/lib/payments'

const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_TIMEOUT_MS = 10_000
const DEFAULT_RESEND_FROM = 'Instituto Imagine <noreply@mail.imagineinstituto.com>'
const DEFAULT_ADMIN_EMAIL = 'admin@institutoimagine.org'

export interface SendEmailResult {
  sent: boolean
  id?: string
  rateLimited?: boolean
  error?: string
}

function getResendApiKey(): string | null {
  const key = (process.env.RESEND_API_KEY || '').trim()
  if (!key || key === 're_placeholder' || !key.startsWith('re_')) {
    return null
  }
  return key
}

function getFromAddress(): string {
  const configured = (process.env.RESEND_FROM || '').trim()
  return configured || DEFAULT_RESEND_FROM
}

export function getAdminNotifyEmail(): string {
  const configured = (process.env.ADMIN_NOTIFY_EMAIL || '').trim()
  return configured && configured.includes('@') ? configured : DEFAULT_ADMIN_EMAIL
}

export function getPublicSiteOrigin(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim()
  if (base.startsWith('https://')) {
    try {
      return new URL(base).origin
    } catch {
      // ignora URL malformada
    }
  }
  return 'https://imagineinstituto.com'
}

export function getPortalOrigin(): string {
  return 'https://portal.imagineinstituto.com'
}

async function sendResendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<SendEmailResult> {
  const apiKey = getResendApiKey()
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY ausente; envio ignorado de forma segura.')
    return { sent: false, error: 'RESEND_API_KEY não configurada' }
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    })

    const text = await res.text()
    let data: any = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }

    if (res.status === 429) {
      console.warn('[Resend] Limite de cota atingido (429):', data?.message || text)
      return {
        sent: false,
        rateLimited: true,
        error: 'Limite diário de envio atingido no provedor de e-mail.',
      }
    }

    if (!res.ok) {
      const msg = data?.message || `HTTP ${res.status}`
      console.error('[Resend] Erro ao enviar e-mail:', { status: res.status, message: msg })
      return { sent: false, error: String(msg) }
    }

    return { sent: true, id: data?.id ? String(data.id) : undefined }
  } catch (err) {
    console.error('[Resend] Exceção de rede ao enviar e-mail:', err)
    return { sent: false, error: 'Falha de conexão com o serviço de e-mail.' }
  }
}

export type { DonorReceiptEmailInput } from '@/lib/payments'

export async function sendDonorReceiptEmail(
  input: DonorReceiptEmailInput
): Promise<SendEmailResult> {
  const message = buildDonorReceiptEmail({
    ...input,
    publicOrigin: getPublicSiteOrigin(),
    portalOrigin: getPortalOrigin(),
  })
  return sendResendEmail(message)
}

export async function sendAdminNewDonationEmail(input: {
  donorName?: string | null
  donorEmail?: string | null
  anonymous?: boolean
  amount: number
  refundedAmount?: number | null
  status?: string | null
  projectTitle: string
  donationId: string
  transactionId?: string | null
  paymentMethod?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  message?: string | null
}): Promise<SendEmailResult> {
  const adminTo = getAdminNotifyEmail()
  const donorLabel = input.anonymous
    ? `Anônimo (${escapeHtml(input.donorName || 'sem nome')})`
    : escapeHtml(input.donorName || 'Não informado')
  const safeEmail = escapeHtml(input.donorEmail || 'Não informado')
  const safeProject = escapeHtml(input.projectTitle)
  const amounts = getReceiptAmounts({
    amount: input.amount,
    refundedAmount: input.refundedAmount,
    status: input.status || 'completed',
  })
  const safeGrossAmount = escapeHtml(formatCurrencyBRL(amounts.grossBrl))
  const safeNetAmount = escapeHtml(formatCurrencyBRL(amounts.netBrl))
  const safeRefundedAmount = escapeHtml(formatCurrencyBRL(amounts.refundedBrl))
  const safeStatus = escapeHtml(getDonationStatusLabelPTBR(input.status || 'completed'))
  const safeMethod = escapeHtml(normalizePaymentMethodLabel(input.paymentMethod))
  const safeModality = input.isRecurring
    ? `Recorrente (${escapeHtml(getFrequencyLabelPTBR(input.recurringFrequency))})`
    : 'Única'
  const safeMsg = input.message ? escapeHtml(input.message) : ''
  const titleText = amounts.hasRefund
    ? `Nova Doação Confirmada (Líq. ${safeNetAmount} / Bruto ${safeGrossAmount})`
    : `Nova Doação Confirmada: ${safeGrossAmount}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px 12px;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:28px;border:1px solid #E5E7EB;">
    <h2 style="margin:0 0 12px 0;color:#059669;font-size:20px;">${titleText}</h2>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">Projeto / Campanha: <strong>${safeProject}</strong></p>
    <div style="background:#F3F4F6;border-radius:8px;padding:16px;font-size:13px;line-height:1.7;">
      <div><strong>Doador:</strong> ${donorLabel}</div>
      <div><strong>E-mail:</strong> ${safeEmail}</div>
      <div><strong>Status:</strong> ${safeStatus}</div>
      ${
        amounts.hasRefund
          ? `<div><strong>Valor líquido reconhecido:</strong> ${safeNetAmount} (bruto ${safeGrossAmount}, estornado -${safeRefundedAmount})</div>`
          : `<div><strong>Valor:</strong> ${safeGrossAmount}</div>`
      }
      <div><strong>Meio:</strong> ${safeMethod} · ${safeModality}</div>
      <div><strong>ID Portal:</strong> <code>${escapeHtml(input.donationId)}</code></div>
      ${input.transactionId ? `<div><strong>ID Asaas:</strong> <code>${escapeHtml(input.transactionId)}</code></div>` : ''}
      ${safeMsg ? `<div><strong>Mensagem:</strong> ${safeMsg}</div>` : ''}
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="${escapeHtml(`${getPortalOrigin()}/admin/doacoes`)}" style="display:inline-block;background:#0D2340;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
        Abrir Painel de Doações
      </a>
    </div>
  </div>
</body>
</html>`

  return sendResendEmail({
    to: adminTo,
    subject: amounts.hasRefund
      ? `Nova doação (líquido ${formatCurrencyBRL(amounts.netBrl)}, bruto ${formatCurrencyBRL(amounts.grossBrl)}) — ${input.projectTitle}`
      : `Nova doação (${formatCurrencyBRL(amounts.grossBrl)}) — ${input.projectTitle}`,
    html,
  })
}

export async function sendAdminPaymentAlertEmail(input: {
  eventType: string
  amount: number
  refundedAmount?: number | null
  status?: string | null
  projectTitle: string
  donationId: string
  donorEmail?: string | null
}): Promise<SendEmailResult> {
  const adminTo = getAdminNotifyEmail()
  const alertAmounts = getReceiptAmounts({
    amount: input.amount,
    refundedAmount: input.refundedAmount,
    status: input.status,
  })
  const statusLabel = getDonationStatusLabelPTBR(input.status)
  const pendingNote =
    input.status === 'pending' && alertAmounts.hasRefund
      ? ' (status pending — pagamento ainda aguardando confirmação; estorno parcial já registrado)'
      : input.status
        ? ` (status ${escapeHtml(input.status)})`
        : ''
  const alertRefundHtml = alertAmounts.hasRefund
    ? `<p style="margin:0 0 12px 0;font-size:14px;">Estornado: <strong>${escapeHtml(formatCurrencyBRL(alertAmounts.refundedBrl))}</strong> · Líquido reconhecido: <strong>${escapeHtml(formatCurrencyBRL(alertAmounts.netBrl))}</strong></p>`
    : ''
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px 12px;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:28px;border:1px solid #FCA5A5;">
    <h2 style="margin:0 0 12px 0;color:#DC2626;font-size:18px;">Alerta de Pagamento / Estorno (${escapeHtml(input.eventType)})</h2>
    <p style="margin:0 0 12px 0;font-size:14px;">Doação de <strong>${escapeHtml(formatCurrencyBRL(alertAmounts.grossBrl))}</strong> em <strong>${escapeHtml(input.projectTitle)}</strong>.</p>
    <p style="margin:0 0 12px 0;font-size:14px;">Status atual: <strong>${escapeHtml(statusLabel)}</strong>${pendingNote}</p>
    ${alertRefundHtml}
    <p style="margin:0;font-size:13px;color:#4B5563;">ID Portal: <code>${escapeHtml(input.donationId)}</code> · E-mail: ${escapeHtml(input.donorEmail || 'N/A')}</p>
  </div>
</body>
</html>`

  return sendResendEmail({
    to: adminTo,
    subject: `Alerta Asaas (${input.eventType}) — ${input.projectTitle}`,
    html,
  })
}
