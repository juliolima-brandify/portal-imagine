import 'server-only'
import {
  INSTITUTE_CNPJ,
  INSTITUTE_NAME,
  INSTITUTE_ADDRESS,
  escapeHtml,
  formatCurrencyBRL,
  getFrequencyLabelPTBR,
  normalizePaymentMethodLabel,
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

export interface DonorReceiptEmailInput {
  to: string
  donorName?: string | null
  anonymous?: boolean
  amount: number
  projectTitle: string
  donationId: string
  transactionId?: string | null
  paymentMethod?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  message?: string | null
  createdAt?: string | null
  portalAccessUrl?: string | null
  isNewAccount?: boolean
}

export async function sendDonorReceiptEmail(
  input: DonorReceiptEmailInput
): Promise<SendEmailResult> {
  const safeName = escapeHtml(
    input.anonymous ? 'Apoiador(a)' : (input.donorName || '').trim() || 'Apoiador(a)'
  )
  const safeProject = escapeHtml(input.projectTitle || 'Instituto Imagine')
  const safeAmount = escapeHtml(formatCurrencyBRL(input.amount))
  const safeDonationId = escapeHtml(input.donationId)
  const safeTxId = input.transactionId ? escapeHtml(input.transactionId) : ''
  const safeMethod = escapeHtml(normalizePaymentMethodLabel(input.paymentMethod))
  const safeModality = input.isRecurring
    ? `Recorrente (${escapeHtml(getFrequencyLabelPTBR(input.recurringFrequency))})`
    : 'Doação única'
  const safeMessage = input.message ? escapeHtml(input.message) : ''
  const logoUrl = `${getPublicSiteOrigin()}/img/logo-cor.png`

  const dateFormatted = (() => {
    try {
      return new Date(input.createdAt || Date.now()).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return new Date().toLocaleDateString('pt-BR')
    }
  })()

  const safeAccessUrl =
    input.portalAccessUrl && input.portalAccessUrl.startsWith('https://')
      ? escapeHtml(input.portalAccessUrl)
      : escapeHtml(`${getPortalOrigin()}/entrar`)

  const portalSectionHtml = input.isNewAccount
    ? `
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 8px 0;color:#0D2340;font-size:16px;">Acompanhe suas doações no Portal Imagine</h3>
        <p style="margin:0 0 16px 0;color:#374151;font-size:14px;">
          Preparamos o seu acesso exclusivo ao Portal com o e-mail <strong>${escapeHtml(input.to)}</strong>.
          Clique abaixo para definir sua senha com segurança e acompanhar recibos, histórico e relatórios dos projetos:
        </p>
        <div style="text-align:center;">
          <a href="${safeAccessUrl}" style="display:inline-block;background:#0D2340;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Definir Senha e Acessar Portal
          </a>
        </div>
      </div>
    `
    : `
      <div style="text-align:center;margin:24px 0;">
        <a href="${safeAccessUrl}" style="display:inline-block;background:#0D2340;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Ver Histórico no Portal Imagine
        </a>
      </div>
    `

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recibo de Doação — ${INSTITUTE_NAME}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#FBF8F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:32px 28px;border:1px solid #E5E7EB;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${logoUrl}" alt="${INSTITUTE_NAME}" style="height:48px;width:auto;margin-bottom:12px;" />
      <h1 style="margin:0;color:#059669;font-size:24px;">Doação Confirmada!</h1>
      <p style="margin:6px 0 0 0;color:#6B7280;font-size:14px;">Recibo oficial · CNPJ ${INSTITUTE_CNPJ}</p>
    </div>

    <p style="margin:0 0 14px 0;font-size:15px;">Olá, <strong>${safeName}</strong>!</p>
    <p style="margin:0 0 20px 0;font-size:15px;color:#374151;">
      Recebemos a confirmação da sua doação para o <strong>${INSTITUTE_NAME}</strong>. Muito obrigado por caminhar conosco e transformar vidas em Uberlândia!
    </p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:20px;margin:20px 0;">
      <h2 style="margin:0 0 12px 0;color:#065F46;font-size:16px;">Dados do Recibo</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1F2937;">
        <tr><td style="padding:4px 0;color:#4B5563;">Instituição:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${INSTITUTE_NAME}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">CNPJ:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${INSTITUTE_CNPJ}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Destino / Projeto:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${safeProject}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Valor:</td><td style="padding:4px 0;font-weight:700;color:#059669;font-size:16px;text-align:right;">${safeAmount}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Modalidade:</td><td style="padding:4px 0;text-align:right;">${safeModality}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Meio de pagamento:</td><td style="padding:4px 0;text-align:right;">${safeMethod}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Data:</td><td style="padding:4px 0;text-align:right;">${escapeHtml(dateFormatted)}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">ID da Doação:</td><td style="padding:4px 0;font-family:monospace;font-size:12px;text-align:right;">${safeDonationId}</td></tr>
        ${safeTxId ? `<tr><td style="padding:4px 0;color:#4B5563;">Ref. Transação:</td><td style="padding:4px 0;font-family:monospace;font-size:12px;text-align:right;">${safeTxId}</td></tr>` : ''}
      </table>
      ${safeMessage ? `<p style="margin:12px 0 0 0;padding-top:10px;border-top:1px dashed #A7F3D0;font-size:13px;color:#374151;"><strong>Sua mensagem:</strong> ${safeMessage}</p>` : ''}
    </div>

    ${portalSectionHtml}

    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #E5E7EB;text-align:center;color:#6B7280;font-size:12px;">
      <p style="margin:0 0 4px 0;"><strong>${INSTITUTE_NAME}</strong> · CNPJ ${INSTITUTE_CNPJ}</p>
      <p style="margin:0;">${escapeHtml(INSTITUTE_ADDRESS)}</p>
    </div>
  </div>
</body>
</html>`

  return sendResendEmail({
    to: input.to.trim().toLowerCase(),
    subject: `Recibo de doação confirmada (${formatCurrencyBRL(input.amount)}) — ${INSTITUTE_NAME}`,
    html,
  })
}

export async function sendAdminNewDonationEmail(input: {
  donorName?: string | null
  donorEmail?: string | null
  anonymous?: boolean
  amount: number
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
  const safeAmount = escapeHtml(formatCurrencyBRL(input.amount))
  const safeMethod = escapeHtml(normalizePaymentMethodLabel(input.paymentMethod))
  const safeModality = input.isRecurring
    ? `Recorrente (${escapeHtml(getFrequencyLabelPTBR(input.recurringFrequency))})`
    : 'Única'
  const safeMsg = input.message ? escapeHtml(input.message) : ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px 12px;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:28px;border:1px solid #E5E7EB;">
    <h2 style="margin:0 0 12px 0;color:#059669;font-size:20px;">Nova Doação Confirmada: ${safeAmount}</h2>
    <p style="margin:0 0 16px 0;font-size:14px;color:#4B5563;">Projeto / Campanha: <strong>${safeProject}</strong></p>
    <div style="background:#F3F4F6;border-radius:8px;padding:16px;font-size:13px;line-height:1.7;">
      <div><strong>Doador:</strong> ${donorLabel}</div>
      <div><strong>E-mail:</strong> ${safeEmail}</div>
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
    subject: `Nova doação (${formatCurrencyBRL(input.amount)}) — ${input.projectTitle}`,
    html,
  })
}

export async function sendAdminPaymentAlertEmail(input: {
  eventType: string
  amount: number
  projectTitle: string
  donationId: string
  donorEmail?: string | null
}): Promise<SendEmailResult> {
  const adminTo = getAdminNotifyEmail()
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px 12px;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:28px;border:1px solid #FCA5A5;">
    <h2 style="margin:0 0 12px 0;color:#DC2626;font-size:18px;">Alerta de Pagamento / Estorno (${escapeHtml(input.eventType)})</h2>
    <p style="margin:0 0 12px 0;font-size:14px;">Doação de <strong>${escapeHtml(formatCurrencyBRL(input.amount))}</strong> em <strong>${escapeHtml(input.projectTitle)}</strong>.</p>
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
