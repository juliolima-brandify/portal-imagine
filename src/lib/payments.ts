import { z } from 'zod'

/**
 * Módulo 100% puro e client-safe de regras de pagamento, recibo e sanitização (Frente 2).
 * NUNCA importe SDKs de servidor, segredos ou clientes privilegiados neste arquivo.
 */

export const INSTITUTE_NAME = 'Instituto Imagine'
export const INSTITUTE_CNPJ = '14.351.728/0001-72'
export const INSTITUTE_ADDRESS = 'R. Rui de Castro Santos, 1991 — Grand Ville, Uberlândia-MG, 38406-260'

export const MIN_DONATION_CENTS = 500 // R$ 5,00 (mínimo regulatório do Asaas)
export const MAX_DONATION_CENTS = 50_000_000 // R$ 500.000,00 (teto PJ do Asaas)
export const MIN_DONATION_BRL = MIN_DONATION_CENTS / 100

export const ASAAS_ITEM_NAME_MAX_LEN = 30
export const ASAAS_ITEM_DESC_MAX_LEN = 100

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly'
export type AsaasCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export const SPECIAL_CAMPAIGNS: Record<string, { slug: string; title: string }> = {
  geral: { slug: 'geral', title: 'Onde for mais necessário' },
  natal: { slug: 'natal', title: 'Natal Feliz 2026' },
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false
  return UUID_REGEX.test(value.trim())
}

export function brlToCents(amountBrl: number): number {
  if (typeof amountBrl !== 'number' || !Number.isFinite(amountBrl)) return 0
  return Math.round(amountBrl * 100)
}

export function centsToBrl(cents: number): number {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return 0
  return Math.round(cents) / 100
}

export function sumDonationsBrl(amounts: Array<number | string | null | undefined>): number {
  let totalCents = 0
  for (const raw of amounts) {
    const num = typeof raw === 'string' ? Number(raw) : raw
    if (typeof num === 'number' && Number.isFinite(num) && num > 0) {
      totalCents += Math.round(num * 100)
    }
  }
  return centsToBrl(totalCents)
}

export function formatCurrencyBRL(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe)
}

export function mapFrequencyToAsaasCycle(freq?: string | null): AsaasCycle {
  switch ((freq || '').toLowerCase()) {
    case 'quarterly':
      return 'QUARTERLY'
    case 'yearly':
      return 'YEARLY'
    default:
      return 'MONTHLY'
  }
}

export function getFrequencyLabelPTBR(freq?: string | null): string {
  switch ((freq || '').toLowerCase()) {
    case 'quarterly':
    case 'trimestral':
      return 'Trimestral'
    case 'yearly':
    case 'anual':
      return 'Anual'
    case 'monthly':
    case 'mensal':
      return 'Mensal'
    default:
      return 'Mensal'
  }
}

export function getDonationStatusLabelPTBR(status?: string | null): string {
  switch (status) {
    case 'completed':
      return 'Confirmada'
    case 'pending':
      return 'Em processamento'
    case 'failed':
      return 'Não concluída'
    case 'refunded':
      return 'Estornada'
    default:
      return 'Em processamento'
  }
}

export function normalizePaymentMethodLabel(raw?: string | null): string {
  const upper = (raw || '').trim().toUpperCase()
  if (upper === 'PIX') return 'Pix'
  if (upper === 'CREDIT_CARD' || upper === 'CARTAO' || upper === 'CARTÃO DE CRÉDITO' || upper === 'CARTÃO') {
    return 'Cartão de Crédito'
  }
  if (upper === 'DEBIT_CARD') return 'Cartão de Débito'
  if (upper === 'BOLETO') return 'Boleto'
  return raw?.trim() || 'Asaas (Pix / Cartão)'
}

export function getDonationDestinationLabel(input: {
  projectTitle?: string | null
  campaignSlug?: string | null
  projectId?: string | null
}): string {
  if (input.projectTitle && input.projectTitle.trim()) {
    return input.projectTitle.trim()
  }
  const slug = (input.campaignSlug || '').trim().toLowerCase()
  if (slug && SPECIAL_CAMPAIGNS[slug]) {
    return SPECIAL_CAMPAIGNS[slug].title
  }
  if (input.projectId && SPECIAL_CAMPAIGNS[input.projectId.toLowerCase()]) {
    return SPECIAL_CAMPAIGNS[input.projectId.toLowerCase()].title
  }
  return 'Instituto Imagine — Geral'
}

export function escapeHtml(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return ''
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Previne CSV / Excel Formula Injection neutralizando células iniciadas com =, +, -, @, \t ou \r.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).replace(/\r?\n/g, ' ').trim()
  if (!str) return ''
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`
  }
  return str
}

export const checkoutRequestSchema = z.object({
  amount: z.number({ invalid_type_error: 'Informe um valor numérico válido.' }),
  projectId: z.string().trim().min(1, 'Selecione o destino da doação.').max(100),
  projectTitle: z.string().trim().max(160).optional(),
  source: z.enum(['site', 'portal', 'embed']).optional().default('site'),
  options: z
    .object({
      isRecurring: z.boolean().optional().default(false),
      frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional().default('monthly'),
      anonymous: z.boolean().optional().default(false),
      message: z.string().trim().max(500, 'A mensagem pode ter no máximo 500 caracteres.').optional().default(''),
      donorName: z.string().trim().max(120).optional(),
    })
    .optional()
    .default({}),
})

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>

export function validateCheckoutAmountBrl(
  amount: number
): { ok: true; cents: number; valueBrl: number } | { ok: false; error: string } {
  const cents = brlToCents(amount)
  if (cents < MIN_DONATION_CENTS) {
    return {
      ok: false,
      error: `O valor mínimo para doação online é ${formatCurrencyBRL(MIN_DONATION_BRL)}.`,
    }
  }
  if (cents > MAX_DONATION_CENTS) {
    return {
      ok: false,
      error: 'O valor informado excede o limite máximo permitido por transação.',
    }
  }
  return { ok: true, cents, valueBrl: centsToBrl(cents) }
}

/**
 * Trunca texto ASCII/UTF-8 sem cortar palavras de forma feia e respeitando o limite rígido de 30 chars do Asaas em items[0].name.
 */
export function buildAsaasItemName(destinationTitle: string, isRecurring: boolean): string {
  const cleanTitle = (destinationTitle || 'Instituto Imagine')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const prefix = isRecurring ? 'Mensal - ' : 'Doacao - '
  const full = `${prefix}${cleanTitle}`
  if (full.length <= ASAAS_ITEM_NAME_MAX_LEN) {
    return full
  }
  return full.slice(0, ASAAS_ITEM_NAME_MAX_LEN).trimEnd()
}

export function buildAsaasItemDescription(
  destinationTitle: string,
  isRecurring: boolean,
  frequency?: string | null
): string {
  const cleanTitle = (destinationTitle || 'Instituto Imagine')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const kind = isRecurring ? `Doação ${getFrequencyLabelPTBR(frequency).toLowerCase()}` : 'Doação única'
  const full = `${kind} — ${cleanTitle} (${INSTITUTE_NAME})`
  if (full.length <= ASAAS_ITEM_DESC_MAX_LEN) {
    return full
  }
  return full.slice(0, ASAAS_ITEM_DESC_MAX_LEN).trimEnd()
}

/**
 * O Asaas rejeita URLs http://localhost no campo callback (HTTP 400).
 * Garante sempre uma origem HTTPS pública válida para os callbacks do Asaas.
 */
export function resolvePublicCallbackBaseUrl(
  candidateOrigin?: string | null,
  configuredBaseUrl?: string | null
): string {
  const DEFAULT_PUBLIC = 'https://imagineinstituto.com'

  const tryParsePublicHttps = (raw?: string | null): string | null => {
    if (!raw) return null
    try {
      const parsed = new URL(raw.trim())
      if (parsed.protocol !== 'https:') return null
      const host = parsed.hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return null
      return parsed.origin
    } catch {
      return null
    }
  }

  return (
    tryParsePublicHttps(candidateOrigin) ||
    tryParsePublicHttps(configuredBaseUrl) ||
    DEFAULT_PUBLIC
  )
}

/**
 * Calcula a data da primeira cobrança de assinatura no fuso America/Sao_Paulo (formato YYYY-MM-DD HH:mm:ss aceito pelo Asaas).
 */
export function calculateNextDueDateSaoPaulo(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value || now.getUTCFullYear())
  const month = Number(parts.find((p) => p.type === 'month')?.value || now.getUTCMonth() + 1)
  const day = Number(parts.find((p) => p.type === 'day')?.value || now.getUTCDate())

  const utcDate = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0))
  const yyyy = utcDate.getUTCFullYear()
  const mm = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(utcDate.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} 12:00:00`
}

export interface AsaasCustomerDataInput {
  name?: string | null
  email?: string | null
  cpfCnpj?: string | null
  phone?: string | null
}

export interface BuildAsaasCheckoutParams {
  donationId: string
  valueBrl: number
  destinationTitle: string
  isRecurring: boolean
  recurringFrequency?: RecurringFrequency | string | null
  callbackBaseUrl: string
  cancelPath?: string
  allowPix?: boolean
  customerData?: AsaasCustomerDataInput | null
  now?: Date
}

export interface AsaasCheckoutPayload {
  billingTypes: Array<'PIX' | 'CREDIT_CARD'>
  chargeTypes: Array<'DETACHED' | 'RECURRENT'>
  minutesToExpire: number
  externalReference: string
  callback: {
    successUrl: string
    cancelUrl: string
    expiredUrl: string
  }
  items: Array<{
    name: string
    description: string
    quantity: number
    value: number
  }>
  subscription?: {
    cycle: AsaasCycle
    nextDueDate: string
  }
  customerData?: {
    name?: string
    email?: string
    cpfCnpj?: string
    phone?: string
  }
}

export function buildAsaasCheckoutPayload(params: BuildAsaasCheckoutParams): AsaasCheckoutPayload {
  const safeBase = resolvePublicCallbackBaseUrl(params.callbackBaseUrl)
  const safeCancelPath =
    params.cancelPath && params.cancelPath.startsWith('/') && !params.cancelPath.startsWith('//')
      ? params.cancelPath
      : '/'

  const cancelSeparator = safeCancelPath.includes('?') ? '&' : '?'
  const cancelUrl = `${safeBase}${safeCancelPath}${cancelSeparator}cancelled=true`
  const expiredUrl = `${safeBase}${safeCancelPath}${cancelSeparator}expired=true`
  const successUrl = `${safeBase}/doacao-sucesso?donation_id=${encodeURIComponent(params.donationId)}`

  const isRecurring = Boolean(params.isRecurring)
  const includePix = params.allowPix !== false && !isRecurring

  const billingTypes: Array<'PIX' | 'CREDIT_CARD'> = includePix
    ? ['PIX', 'CREDIT_CARD']
    : ['CREDIT_CARD']

  const payload: AsaasCheckoutPayload = {
    billingTypes,
    chargeTypes: [isRecurring ? 'RECURRENT' : 'DETACHED'],
    minutesToExpire: 60,
    externalReference: params.donationId,
    callback: {
      successUrl,
      cancelUrl,
      expiredUrl,
    },
    items: [
      {
        name: buildAsaasItemName(params.destinationTitle, isRecurring),
        description: buildAsaasItemDescription(
          params.destinationTitle,
          isRecurring,
          params.recurringFrequency
        ),
        quantity: 1,
        value: centsToBrl(brlToCents(params.valueBrl)),
      },
    ],
  }

  if (isRecurring) {
    payload.subscription = {
      cycle: mapFrequencyToAsaasCycle(params.recurringFrequency),
      nextDueDate: calculateNextDueDateSaoPaulo(params.now),
    }
  }

  if (params.customerData) {
    const cleanCpf = (params.customerData.cpfCnpj || '').replace(/\D/g, '')
    const cleanPhone = (params.customerData.phone || '').replace(/\D/g, '')
    const cleanEmail = (params.customerData.email || '').trim().toLowerCase()
    const cleanName = (params.customerData.name || '').trim()

    const cd: NonNullable<AsaasCheckoutPayload['customerData']> = {}
    if (cleanName.length >= 2) cd.name = cleanName.slice(0, 100)
    if (cleanEmail.includes('@')) cd.email = cleanEmail.slice(0, 120)
    if (cleanCpf.length === 11 || cleanCpf.length === 14) cd.cpfCnpj = cleanCpf
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13) cd.phone = cleanPhone

    if (Object.keys(cd).length > 0) {
      payload.customerData = cd
    }
  }

  return payload
}

export interface ClassifiedAsaasWebhook {
  eventId: string
  eventType: string
  targetStatus: DonationStatus | null
  shouldNotifyDonorSuccess: boolean
  shouldNotifyFailureOrRefund: boolean
  externalReference: string | null
  checkoutId: string | null
  paymentId: string | null
  subscriptionId: string | null
  customerId: string | null
  billingType: string | null
  valueBrl: number | null
  donorName: string | null
  donorEmail: string | null
}

/**
 * Classifica o payload bruto do webhook do Asaas (tanto eventos CHECKOUT_* quanto PAYMENT_*).
 */
export function classifyAsaasWebhookEvent(rawPayload: unknown): ClassifiedAsaasWebhook | null {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return null
  }
  const body = rawPayload as Record<string, any>
  const eventId = typeof body.id === 'string' ? body.id.trim() : ''
  const eventType = typeof body.event === 'string' ? body.event.trim().toUpperCase() : ''

  if (!eventId || !eventType) {
    return null
  }

  const payment = body.payment && typeof body.payment === 'object' ? body.payment : null
  const checkout = body.checkout && typeof body.checkout === 'object' ? body.checkout : null
  const subscription =
    body.subscription && typeof body.subscription === 'object' ? body.subscription : null

  let targetStatus: DonationStatus | null = null
  let shouldNotifyDonorSuccess = false
  let shouldNotifyFailureOrRefund = false

  switch (eventType) {
    case 'CHECKOUT_PAID':
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      targetStatus = 'completed'
      shouldNotifyDonorSuccess = true
      break
    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_PARTIALLY_REFUNDED':
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      targetStatus = 'refunded'
      shouldNotifyFailureOrRefund = true
      break
    case 'CHECKOUT_EXPIRED':
    case 'CHECKOUT_CANCELED':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_DELETED':
    case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
    case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
      targetStatus = 'failed'
      shouldNotifyFailureOrRefund =
        eventType === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS' ||
        eventType === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
      break
    default:
      targetStatus = null
  }

  const strOrNull = (v: unknown): string | null =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : null

  const externalReference =
    strOrNull(payment?.externalReference) ||
    strOrNull(checkout?.externalReference) ||
    strOrNull(subscription?.externalReference)

  const checkoutId = strOrNull(payment?.checkoutSession) || strOrNull(checkout?.id)
  const paymentId = strOrNull(payment?.id)
  const subscriptionId = strOrNull(payment?.subscription) || strOrNull(subscription?.id)
  const customerId =
    strOrNull(payment?.customer) ||
    strOrNull(checkout?.customer) ||
    strOrNull(subscription?.customer)

  const billingType =
    strOrNull(payment?.billingType) ||
    (Array.isArray(checkout?.billingTypes) && checkout.billingTypes.length === 1
      ? strOrNull(checkout.billingTypes[0])
      : null)

  const rawValue =
    typeof payment?.value === 'number'
      ? payment.value
      : Array.isArray(checkout?.items) && typeof checkout.items[0]?.value === 'number'
        ? checkout.items[0].value
        : null

  const customerData =
    checkout?.customerData && typeof checkout.customerData === 'object'
      ? checkout.customerData
      : null

  const donorName = strOrNull(customerData?.name)
  const donorEmailRaw = strOrNull(customerData?.email)
  const donorEmail = donorEmailRaw && donorEmailRaw.includes('@') ? donorEmailRaw.toLowerCase() : null

  return {
    eventId,
    eventType,
    targetStatus,
    shouldNotifyDonorSuccess,
    shouldNotifyFailureOrRefund,
    externalReference,
    checkoutId,
    paymentId,
    subscriptionId,
    customerId,
    billingType,
    valueBrl: rawValue !== null && Number.isFinite(rawValue) && rawValue > 0 ? centsToBrl(brlToCents(rawValue)) : null,
    donorName,
    donorEmail,
  }
}

/**
 * Mesma máquina de estados pura usada na função SQL apply_asaas_webhook_event.
 */
export function resolveNextDonationStatus(
  currentStatus: DonationStatus,
  targetStatus: DonationStatus | null
): DonationStatus {
  if (!targetStatus) return currentStatus
  if (currentStatus === 'refunded') return 'refunded'
  if (currentStatus === 'completed' && (targetStatus === 'pending' || targetStatus === 'failed')) {
    return 'completed'
  }
  return targetStatus
}

/**
 * Remove qualquer PII (email, nome, CPF, user_id) da resposta pública de /api/checkout/session/[sessionId].
 */
export function sanitizePublicSessionResponse(row: {
  id: string
  project_id?: string | null
  campaign_slug?: string | null
  projectTitle?: string | null
  amount: number | string
  status?: string | null
  payment_method?: string | null
  is_recurring?: boolean | null
  recurring_frequency?: string | null
}) {
  const numAmount = typeof row.amount === 'string' ? Number(row.amount) : row.amount
  const safeStatus: DonationStatus =
    row.status === 'completed' || row.status === 'failed' || row.status === 'refunded'
      ? row.status
      : 'pending'

  return {
    success: true as const,
    donationId: row.id,
    projectId: row.project_id || row.campaign_slug || 'geral',
    projectTitle: getDonationDestinationLabel({
      projectTitle: row.projectTitle,
      campaignSlug: row.campaign_slug,
      projectId: row.project_id,
    }),
    amount: (Number.isFinite(numAmount) ? numAmount : 0).toFixed(2),
    amountFormatted: formatCurrencyBRL(Number.isFinite(numAmount) ? numAmount : 0),
    paymentStatus: safeStatus,
    paymentMethod: normalizePaymentMethodLabel(row.payment_method),
    isRecurring: Boolean(row.is_recurring),
    recurringFrequency: row.is_recurring ? getFrequencyLabelPTBR(row.recurring_frequency) : null,
  }
}

export function buildReceiptText(input: {
  donationId: string
  donorName?: string | null
  donorEmail?: string | null
  anonymous?: boolean
  amount: number
  projectTitle: string
  status: string
  paymentMethod?: string | null
  createdAt: string
  transactionId?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  message?: string | null
}): string {
  const displayDonor = input.anonymous
    ? 'Doador Anônimo'
    : (input.donorName || '').trim() || 'Doador'

  const formattedDate = (() => {
    try {
      return new Date(input.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    } catch {
      return input.createdAt
    }
  })()

  const lines = [
    '====================================================',
    '            RECIBO DE DOAÇÃO — INSTITUTO IMAGINE',
    '====================================================',
    `Instituição: ${INSTITUTE_NAME}`,
    `CNPJ: ${INSTITUTE_CNPJ}`,
    `Endereço: ${INSTITUTE_ADDRESS}`,
    '----------------------------------------------------',
    `ID da Doação: ${input.donationId}`,
    ...(input.transactionId ? [`Referência Pagamento: ${input.transactionId}`] : []),
    `Data: ${formattedDate}`,
    `Doador: ${displayDonor}`,
    ...(!input.anonymous && input.donorEmail ? [`E-mail: ${input.donorEmail}`] : []),
    `Destino / Projeto: ${input.projectTitle}`,
    `Valor: ${formatCurrencyBRL(input.amount)}`,
    `Status: ${getDonationStatusLabelPTBR(input.status)}`,
    `Meio de Pagamento: ${normalizePaymentMethodLabel(input.paymentMethod)}`,
    `Modalidade: ${input.isRecurring ? `Recorrente (${getFrequencyLabelPTBR(input.recurringFrequency)})` : 'Doação única'}`,
    ...(input.message ? [`Mensagem: ${input.message}`] : []),
    '====================================================',
    'Obrigado por transformar vidas com o Instituto Imagine!',
  ]

  return lines.join('\n')
}
