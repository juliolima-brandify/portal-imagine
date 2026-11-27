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
export const MAX_DONATION_BRL = MAX_DONATION_CENTS / 100

export const ASAAS_ITEM_NAME_MAX_LEN = 30
export const ASAAS_ITEM_DESC_MAX_LEN = 100

export type DonationStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed'
export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly'
export type AsaasCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export const SPECIAL_CAMPAIGNS: Record<string, { slug: string; title: string }> = {
  geral: { slug: 'geral', title: 'Onde for mais necessário' },
  natal: { slug: 'natal', title: 'Natal Feliz 2026' },
}

/**
 * Acesso seguro a campanhas especiais. Evita que chaves de protótipo
 * (`constructor`, `__proto__`, `toString`) sejam tratadas como campanha válida.
 */
export function resolveSpecialCampaign(
  key: string | null | undefined
): { slug: string; title: string } | null {
  const normalized = String(key ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (!Object.prototype.hasOwnProperty.call(SPECIAL_CAMPAIGNS, normalized)) return null
  return SPECIAL_CAMPAIGNS[normalized] ?? null
}

/** E-mail na forma canônica de gravação e comparação (minúsculo, sem espaços). */
export function normalizeDonorEmail(value: string | null | undefined): string | null {
  const clean = String(value ?? '').trim().toLowerCase()
  return clean.includes('@') ? clean : null
}

/**
 * Chave única de doador (espelha o SQL `get_project_public_report` e `admin_donation_totals`):
 * e-mail normalizado; sem e-mail, user_id; sem nenhum dos dois, a própria doação.
 */
export function getDonorKey(input: {
  donorEmail?: string | null
  userId?: string | null
  donationId: string
}): string {
  const email = normalizeDonorEmail(input.donorEmail)
  if (email) return `e:${email}`
  if (input.userId) return `u:${input.userId}`
  return `d:${input.donationId}`
}

/** Uma doação conta como reconhecida (somada em totais, relatórios e histórico) quando confirmada ou parcialmente estornada. */
export function isRecognizedDonationStatus(status: string | null | undefined): boolean {
  return status === 'completed' || status === 'partially_refunded'
}

/**
 * Trunca texto por grafemas (`Intl.Segmenter` com fallback para code points),
 * garantindo que o resultado respeite `.length <= maxLength` em UTF-16 e
 * nunca parta emojis simples, pares substitutos ou sequências ZWJ.
 */
export function truncateGraphemes(value: string, maxLength: number): string {
  if (!value || maxLength <= 0) return ''
  if (value.length <= maxLength) return value

  const SegmenterCtor = (
    Intl as unknown as {
      Segmenter?: new (
        locale?: string,
        opts?: { granularity: 'grapheme' }
      ) => { segment: (input: string) => Iterable<{ segment: string }> }
    }
  )?.Segmenter

  const segments: string[] =
    typeof SegmenterCtor === 'function'
      ? Array.from(
          new SegmenterCtor('pt-BR', { granularity: 'grapheme' }).segment(value),
          (s) => s.segment
        )
      : Array.from(value)

  let out = ''
  for (const seg of segments) {
    if (out.length + seg.length > maxLength) break
    out += seg
  }
  return out.trimEnd()
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

/**
 * Calcula o valor líquido reconhecido de uma doação em reais, igual ao trigger SQL `update_project_amount`:
 * - `completed`: valor integral (`amount`)
 * - `partially_refunded`: `max(0, amount - refunded_amount)` em centavos
 * - demais status (`pending`, `failed`, `refunded`): `0`
 */
export function getRecognizedDonationAmountBrl(row: {
  amount?: number | string | null
  refunded_amount?: number | string | null
  refundedAmount?: number | string | null
  status?: string | null
}): number {
  const status = row.status || ''
  if (status !== 'completed' && status !== 'partially_refunded') {
    return 0
  }
  const rawAmount = typeof row.amount === 'string' ? Number(row.amount) : row.amount
  const amountCents =
    typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0
      ? brlToCents(rawAmount)
      : 0
  if (status === 'completed') {
    return centsToBrl(amountCents)
  }
  const rawRefunded =
    row.refundedAmount !== undefined ? row.refundedAmount : row.refunded_amount
  const numRefunded = typeof rawRefunded === 'string' ? Number(rawRefunded) : rawRefunded
  const refundedCents =
    typeof numRefunded === 'number' && Number.isFinite(numRefunded) && numRefunded > 0
      ? brlToCents(numRefunded)
      : 0
  return centsToBrl(Math.max(0, amountCents - refundedCents))
}

export function sumRecognizedDonationsBrl(
  rows: Array<{
    amount?: number | string | null
    refunded_amount?: number | string | null
    refundedAmount?: number | string | null
    status?: string | null
  }>
): number {
  let totalCents = 0
  for (const row of rows) {
    const recognized = getRecognizedDonationAmountBrl(row)
    if (recognized > 0) {
      totalCents += brlToCents(recognized)
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
    case 'partially_refunded':
      return 'Estornada parcialmente'
    case 'disputed':
      return 'Em disputa'
    default:
      return 'Em processamento'
  }
}

export function getDonationStatusBadgeMeta(status?: string | null): {
  label: string
  className: string
} {
  switch (status) {
    case 'completed':
      return { label: 'Confirmada', className: 'bg-green-100 text-green-700' }
    case 'pending':
      return { label: 'Em processamento', className: 'bg-yellow-100 text-yellow-800' }
    case 'partially_refunded':
      return { label: 'Estornada parcialmente', className: 'bg-amber-100 text-amber-800' }
    case 'disputed':
      return { label: 'Em disputa', className: 'bg-orange-100 text-orange-800' }
    case 'failed':
      return { label: 'Não concluída', className: 'bg-red-100 text-red-700' }
    case 'refunded':
      return { label: 'Estornada', className: 'bg-gray-200 text-gray-700' }
    default:
      return { label: getDonationStatusLabelPTBR(status), className: 'bg-gray-100 text-gray-700' }
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
  const campaign = resolveSpecialCampaign(slug)
  if (campaign) {
    return campaign.title
  }
  const byProjectId = resolveSpecialCampaign(input.projectId)
  if (byProjectId) {
    return byProjectId.title
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

// `\p{Cf}` exige a flag u; o RegExp em tempo de execução evita o erro do alvo ES5 do tsc.
const CONTROL_OR_FORMAT_CHARS = new RegExp('[\\x00-\\x1F\\x7F\\p{Cf}]', 'gu')

/**
 * Previne CSV / Excel Formula Injection neutralizando células iniciadas com =, +, -, @, \t ou \r,
 * bem como prefixos de fórmula logo após `;` (separador padrão do Excel em pt-BR).
 * Remove quebras de linha (\r, \n, \u2028, \u2029), caracteres de controle e marcas invisíveis/bidi.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
    .replace(/[\r\n\t\u2028\u2029]+/g, ' ')
    .replace(CONTROL_OR_FORMAT_CHARS, '')
    .trim()
  if (!str) return ''
  // Em Excel pt-BR, `;` abre nova coluna ao abrir .csv; neutraliza fórmulas após `;` (inclui largura total).
  str = str.replace(/;\s*([=+\-@\uFF1D\uFF0B\uFF0D\uFF20])/g, ";'$1")
  // Inclui os equivalentes de largura total (\uFF1D \uFF0B \uFF0D \uFF20), que o Excel também trata como fórmula.
  if (/^[=+\-@\t\r\uFF1D\uFF0B\uFF0D\uFF20]/.test(str)) {
    return `'${str}`
  }
  return str
}

/** Valida dígitos verificadores (mod-11) de CPF (11 dígitos). */
export function isValidCpf(raw: string | null | undefined): boolean {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  const calc = (len: number, startWeight: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += Number(digits[i]) * (startWeight - i)
    }
    const rem = (sum * 10) % 11
    return rem === 10 ? 0 : rem
  }
  return calc(9, 10) === Number(digits[9]) && calc(10, 11) === Number(digits[10])
}

/** Valida dígitos verificadores (mod-11/mod-14) de CNPJ (14 dígitos). */
export function isValidCnpj(raw: string | null | undefined): boolean {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false
  const calc = (weights: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += Number(digits[i]) * weights[i]
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  return calc(w1) === Number(digits[12]) && calc(w2) === Number(digits[13])
}

export function isValidCpfOrCnpj(raw: string | null | undefined): boolean {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 11) return isValidCpf(digits)
  if (digits.length === 14) return isValidCnpj(digits)
  return false
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
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return { ok: false, error: 'Informe um valor de doação válido.' }
  }

  // Rejeita valores com mais de duas casas decimais antes de arredondar.
  // Sem isso, 4.999 viraria R$ 5,00 e passaria pelo mínimo.
  const rounded = Math.round(amount * 100) / 100
  if (Math.abs(amount - rounded) > 1e-9) {
    return { ok: false, error: 'O valor deve ter no máximo duas casas decimais.' }
  }

  if (amount < MIN_DONATION_BRL) {
    return {
      ok: false,
      error: `O valor mínimo para doação online é ${formatCurrencyBRL(MIN_DONATION_BRL)}.`,
    }
  }
  if (amount > MAX_DONATION_BRL) {
    return {
      ok: false,
      error: 'O valor informado excede o limite máximo permitido por transação.',
    }
  }

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
 * Trunca texto respeitando o limite rígido de 30 code units UTF-16 do Asaas em items[0].name, sem partir emojis/grafemas.
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
  return truncateGraphemes(full, ASAAS_ITEM_NAME_MAX_LEN)
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
  const suffix = ` (${INSTITUTE_NAME})`
  const titleWithPrefix = `${kind} — ${cleanTitle}`
  const full = `${titleWithPrefix}${suffix}`

  // Prioridade: manter o título completo do projeto. Se não couber, remove o sufixo
  // e, por último, trunca o título por grafemas respeitando UTF-16.
  if (full.length <= ASAAS_ITEM_DESC_MAX_LEN) {
    return full
  }
  if (titleWithPrefix.length <= ASAAS_ITEM_DESC_MAX_LEN) {
    return titleWithPrefix
  }
  return truncateGraphemes(titleWithPrefix, ASAAS_ITEM_DESC_MAX_LEN)
}

/**
 * O Asaas rejeita URLs http://localhost no campo callback (HTTP 400).
 * Garante sempre uma origem HTTPS pública válida para os callbacks do Asaas.
 */
export const DEFAULT_PUBLIC_CALLBACK_HOSTS = [
  'imagineinstituto.com',
  'portal.imagineinstituto.com',
]

/**
 * Allowlist de hosts aceitos para o callback pós-pagamento do Asaas.
 * Um `Origin` arbitrário nunca deve virar URL de retorno.
 */
export function parseAllowedCallbackHosts(raw?: string | null): string[] {
  const fromEnv = String(raw ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : DEFAULT_PUBLIC_CALLBACK_HOSTS
}

export function resolvePublicCallbackBaseUrl(
  candidateOrigin?: string | null,
  configuredBaseUrl?: string | null,
  allowedHosts: string[] = DEFAULT_PUBLIC_CALLBACK_HOSTS
): string {
  const DEFAULT_PUBLIC = 'https://imagineinstituto.com'
  const allowed = new Set(allowedHosts.map((host) => host.toLowerCase()))

  const tryParsePublicHttps = (raw?: string | null): string | null => {
    if (!raw) return null
    try {
      const parsed = new URL(raw.trim())
      if (parsed.protocol !== 'https:') return null
      if (parsed.port !== '') return null
      const host = parsed.hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return null
      if (!allowed.has(host)) return null
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
 * Calcula a data da primeira cobrança de assinatura no fuso America/Sao_Paulo.
 * O Asaas documenta `subscription.nextDueDate` no formato `YYYY-MM-DD`.
 */
export const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo'

export interface SaoPauloDateParts {
  year: string
  month: string
  day: string
  hour: string
}

/** Partes de data/hora no fuso de São Paulo, independentes do fuso do navegador. */
export function getSaoPauloDateParts(date: Date): SaoPauloDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
  }
}

/** Meia-noite de São Paulo (UTC-3) como timestamp UTC. */
export function saoPauloMidnightUtc(date: Date): number {
  const { year, month, day } = getSaoPauloDateParts(date)
  return Date.UTC(Number(year), Number(month) - 1, Number(day), 3)
}

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
  return `${yyyy}-${mm}-${dd}`
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
  callbackAllowedHosts?: string[]
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
  const safeBase = resolvePublicCallbackBaseUrl(
    params.callbackBaseUrl,
    null,
    params.callbackAllowedHosts
  )
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
    if (isValidCpfOrCnpj(cleanCpf)) cd.cpfCnpj = cleanCpf
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
  refundedAmountBrl: number | null
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
    case 'PAYMENT_CHARGEBACK_REQUESTED':
      targetStatus = 'refunded'
      shouldNotifyFailureOrRefund = true
      break
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      targetStatus = 'disputed'
      shouldNotifyFailureOrRefund = true
      break
    case 'PAYMENT_PARTIALLY_REFUNDED':
      targetStatus = 'partially_refunded'
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

  // O Asaas envia estornos em `payment.refunds[]` (status: 'DONE', value), com fallback para
  // `refundedValue`/`refundValue`. Valores negativos ou zerados em eventos atrasados são ignorados.
  let refundsArrayCents = 0
  let hasNegativeRefund = false
  if (Array.isArray(payment?.refunds)) {
    for (const item of payment.refunds) {
      if (!item || typeof item !== 'object') continue
      const itemStatus = typeof item.status === 'string' ? item.status.trim().toUpperCase() : ''
      if (itemStatus !== 'DONE') continue
      if (typeof item.value !== 'number' || !Number.isFinite(item.value)) continue
      if (item.value < 0) {
        hasNegativeRefund = true
        break
      }
      if (item.value > 0) {
        refundsArrayCents += brlToCents(item.value)
      }
    }
  }

  const rawRefundedCandidate =
    typeof payment?.refundedValue === 'number'
      ? payment.refundedValue
      : typeof payment?.refundValue === 'number'
        ? payment.refundValue
        : null
  if (rawRefundedCandidate !== null && Number.isFinite(rawRefundedCandidate) && rawRefundedCandidate < 0) {
    hasNegativeRefund = true
  }

  // Com `refunds[]` presente, o valor concluído é só a soma dos itens DONE (sem DONE = sem valor).
  // `refundedValue` é fallback apenas quando o array não vem no payload (item 9).
  const partialRefundBrl = hasNegativeRefund
    ? null
    : Array.isArray(payment?.refunds)
      ? refundsArrayCents > 0
        ? centsToBrl(refundsArrayCents)
        : null
      : rawRefundedCandidate !== null && Number.isFinite(rawRefundedCandidate) && rawRefundedCandidate > 0
        ? centsToBrl(brlToCents(rawRefundedCandidate))
        : null

  const refundedAmountBrl =
    eventType === 'PAYMENT_REFUNDED'
      ? rawValue !== null && Number.isFinite(rawValue) && rawValue > 0
        ? centsToBrl(brlToCents(rawValue))
        : partialRefundBrl
      : targetStatus === 'partially_refunded'
        ? partialRefundBrl
        : null

  // Item 9: estorno parcial sem valor concluído não muda o status nem dispara alerta.
  if (eventType === 'PAYMENT_PARTIALLY_REFUNDED' && refundedAmountBrl === null) {
    targetStatus = null
    shouldNotifyFailureOrRefund = false
  }

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
    refundedAmountBrl,
    donorName,
    donorEmail,
  }
}

/**
 * Espelho TypeScript de `public.asaas_donation_transition` (migração 20261129).
 * Mesma regra de status e de valor estornado; o teste SQL compara as duas implementações.
 */
export function transitionDonationState(input: {
  status: string
  amount: number
  refundedCurrent?: number | null
  target: string | null
  refundedIn?: number | null
}): { status: DonationStatus | string; refunded: number } {
  const amount = Math.max(Number.isFinite(input.amount) ? input.amount : 0, 0)
  const clamp = (v: number) => Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), amount)
  const current = clamp(input.refundedCurrent ?? 0)
  const incoming = clamp(input.refundedIn ?? 0)
  const target = input.target
  const known = ['pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed']

  if (!target || !known.includes(target)) return { status: input.status, refunded: current }
  if (input.status === 'refunded' || target === 'refunded') return { status: 'refunded', refunded: amount }
  if (target === 'disputed') return { status: 'disputed', refunded: current }

  if (target === 'partially_refunded') {
    const refunded = Math.max(current, incoming)
    if (refunded <= 0) return { status: input.status, refunded }
    if (amount > 0 && refunded >= amount) return { status: 'refunded', refunded }
    if (input.status === 'completed' || input.status === 'partially_refunded') {
      return { status: 'partially_refunded', refunded }
    }
    return { status: input.status, refunded }
  }

  if (target === 'completed') {
    if (amount > 0 && current >= amount) return { status: 'refunded', refunded: current }
    if (current > 0) return { status: 'partially_refunded', refunded: current }
    return { status: 'completed', refunded: current }
  }

  // pending / failed
  if (input.status === 'disputed') {
    return { status: 'disputed', refunded: current }
  }
  if (input.status === 'completed' || input.status === 'partially_refunded') {
    return { status: current > 0 ? 'partially_refunded' : 'completed', refunded: current }
  }
  return { status: target, refunded: current }
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
  refunded_amount?: number | string | null
  status?: string | null
  payment_method?: string | null
  is_recurring?: boolean | null
  recurring_frequency?: string | null
  receipt_sent_at?: string | null
}) {
  const numAmount = typeof row.amount === 'string' ? Number(row.amount) : row.amount
  const numRefunded =
    typeof row.refunded_amount === 'string' ? Number(row.refunded_amount) : row.refunded_amount
  const safeRefunded =
    typeof numRefunded === 'number' && Number.isFinite(numRefunded) && numRefunded > 0
      ? centsToBrl(brlToCents(numRefunded))
      : 0
  const safeStatus: DonationStatus =
    row.status === 'completed' ||
    row.status === 'failed' ||
    row.status === 'refunded' ||
    row.status === 'partially_refunded' ||
    row.status === 'disputed'
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
    refundedAmount: safeRefunded,
    refundedAmountFormatted: safeRefunded > 0 ? formatCurrencyBRL(safeRefunded) : null,
    paymentStatus: safeStatus,
    paymentMethod: normalizePaymentMethodLabel(row.payment_method),
    isRecurring: Boolean(row.is_recurring),
    recurringFrequency: row.is_recurring ? getFrequencyLabelPTBR(row.recurring_frequency) : null,
    receiptSentAt: row.receipt_sent_at ? String(row.receipt_sent_at) : null,
  }
}

/**
 * Valores do recibo (doado, estornado e líquido). Fonte única para o TXT baixado,
 * o e-mail e o assunto do e-mail (item 2).
 */
export function getReceiptAmounts(input: {
  amount: number
  refundedAmount?: number | null
  status?: string | null
}): { grossBrl: number; refundedBrl: number; netBrl: number; hasRefund: boolean } {
  const grossBrl = centsToBrl(brlToCents(Number.isFinite(input.amount) ? input.amount : 0))
  const refundedNum =
    typeof input.refundedAmount === 'number' && Number.isFinite(input.refundedAmount) && input.refundedAmount > 0
      ? input.refundedAmount
      : 0
  const refundedBrl = refundedNum > 0 ? centsToBrl(brlToCents(refundedNum)) : 0
  const netBrl = getRecognizedDonationAmountBrl({
    amount: grossBrl,
    refundedAmount: refundedBrl,
    status: input.status,
  })
  return { grossBrl, refundedBrl, netBrl, hasRefund: refundedBrl > 0 }
}

export function buildReceiptText(input: {
  donationId: string
  donorName?: string | null
  donorEmail?: string | null
  anonymous?: boolean
  amount: number
  refundedAmount?: number | null
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

  const receipt = getReceiptAmounts({
    amount: input.amount,
    refundedAmount: input.refundedAmount,
    status: input.status,
  })
  const refundedNum = receipt.refundedBrl
  const netAmount = receipt.netBrl

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
    ...(refundedNum > 0
      ? [
          `Valor Estornado: ${formatCurrencyBRL(refundedNum)}`,
          `Valor Líquido Reconhecido: ${formatCurrencyBRL(netAmount)}`,
        ]
      : []),
    `Status: ${getDonationStatusLabelPTBR(input.status)}`,
    `Meio de Pagamento: ${normalizePaymentMethodLabel(input.paymentMethod)}`,
    `Modalidade: ${input.isRecurring ? `Recorrente (${getFrequencyLabelPTBR(input.recurringFrequency)})` : 'Doação única'}`,
    ...(input.message ? [`Mensagem: ${input.message}`] : []),
    '====================================================',
    'Obrigado por transformar vidas com o Instituto Imagine!',
  ]

  return lines.join('\n')
}

/** Recibo de doação enviado por e-mail (interface e HTML/assunto montados aqui, sem server-only). */
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
  refundedAmount?: number | null
  status?: string | null
}

export function buildDonorReceiptEmail(
  input: DonorReceiptEmailInput & { publicOrigin: string; portalOrigin: string }
): { to: string; subject: string; html: string } {
  const safeName = escapeHtml(
    input.anonymous ? 'Apoiador(a)' : (input.donorName || '').trim() || 'Apoiador(a)'
  )
  const safeProject = escapeHtml(input.projectTitle || 'Instituto Imagine')
  // Mesmos números do recibo baixado (buildReceiptText): doado, estornado e líquido.
  const receiptAmounts = getReceiptAmounts({
    amount: input.amount,
    refundedAmount: input.refundedAmount,
    status: input.status,
  })
  const safeAmount = escapeHtml(formatCurrencyBRL(receiptAmounts.grossBrl))
  const isPartialRefund = input.status === 'partially_refunded' || receiptAmounts.hasRefund
  const safeStatusLabel = escapeHtml(
    getDonationStatusLabelPTBR(input.status || (receiptAmounts.hasRefund ? 'partially_refunded' : 'completed'))
  )
  const amountRowsHtml = isPartialRefund
    ? `<tr><td style="padding:4px 0;color:#4B5563;">Valor líquido reconhecido:</td><td style="padding:4px 0;font-weight:700;color:#059669;font-size:16px;text-align:right;">${escapeHtml(formatCurrencyBRL(receiptAmounts.netBrl))}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Valor doado:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${safeAmount}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Valor estornado:</td><td style="padding:4px 0;font-weight:600;color:#B45309;text-align:right;">-${escapeHtml(formatCurrencyBRL(receiptAmounts.refundedBrl))}</td></tr>`
    : `<tr><td style="padding:4px 0;color:#4B5563;">Valor doado:</td><td style="padding:4px 0;font-weight:700;color:#059669;font-size:16px;text-align:right;">${safeAmount}</td></tr>`
  const headingTitle = isPartialRefund ? 'Doação Confirmada (Reembolso Parcial)' : 'Doação Confirmada!'
  const headingColor = isPartialRefund ? '#B45309' : '#059669'
  const safeDonationId = escapeHtml(input.donationId)
  const safeTxId = input.transactionId ? escapeHtml(input.transactionId) : ''
  const safeMethod = escapeHtml(normalizePaymentMethodLabel(input.paymentMethod))
  const safeModality = input.isRecurring
    ? `Recorrente (${escapeHtml(getFrequencyLabelPTBR(input.recurringFrequency))})`
    : 'Doação única'
  const safeMessage = input.message ? escapeHtml(input.message) : ''
  const logoUrl = `${input.publicOrigin}/img/logo-cor.png`

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
    input.isNewAccount && input.portalAccessUrl && input.portalAccessUrl.startsWith('https://')
      ? escapeHtml(input.portalAccessUrl)
      : escapeHtml(`${input.portalOrigin}/entrar`)

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
      <h1 style="margin:0;color:${headingColor};font-size:24px;">${headingTitle}</h1>
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
        ${amountRowsHtml}
        <tr><td style="padding:4px 0;color:#4B5563;">Status:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${safeStatusLabel}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Modalidade:</td><td style="padding:4px 0;text-align:right;">${safeModality}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Meio de pagamento:</td><td style="padding:4px 0;text-align:right;">${safeMethod}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">Data:</td><td style="padding:4px 0;text-align:right;">${escapeHtml(dateFormatted)}</td></tr>
        <tr><td style="padding:4px 0;color:#4B5563;">ID da Doação:</td><td style="padding:4px 0;font-family:monospace;font-size:12px;text-align:right;word-break:break-all;">${safeDonationId}</td></tr>
        ${safeTxId ? `<tr><td style="padding:4px 0;color:#4B5563;">Ref. Transação:</td><td style="padding:4px 0;font-family:monospace;font-size:12px;text-align:right;word-break:break-all;">${safeTxId}</td></tr>` : ''}
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

  return {
    to: input.to.trim().toLowerCase(),
    subject: receiptAmounts.hasRefund
      ? `Recibo de doação (doado ${formatCurrencyBRL(receiptAmounts.grossBrl)}, líquido ${formatCurrencyBRL(receiptAmounts.netBrl)}) — ${INSTITUTE_NAME}`
      : `Recibo de doação confirmada (${formatCurrencyBRL(receiptAmounts.grossBrl)}) — ${INSTITUTE_NAME}`,
    html,
  }
}
