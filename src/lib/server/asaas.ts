import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import type { AsaasCheckoutPayload } from '@/lib/payments'

const ASAAS_PROD_BASE_URL = 'https://api.asaas.com/v3'
const ASAAS_SANDBOX_BASE_URL = 'https://api-sandbox.asaas.com/v3'
const ASAAS_USER_AGENT = 'InstitutoImaginePortal/1.0'
const ASAAS_TIMEOUT_MS = 12_000

export type AsaasEnvironment = 'production' | 'sandbox'

export interface AsaasConfig {
  env: AsaasEnvironment
  baseUrl: string
  apiKey: string
}

export function resolveAsaasConfig(): AsaasConfig | null {
  const rawEnv = (process.env.ASAAS_ENV || '').trim().toLowerCase()
  const prodKey = (process.env.ASAAS_API_KEY || '').trim()
  const sandboxKey = (process.env.ASAAS_API_KEY_SANDBOX || '').trim()

  // ASAAS_ENV é obrigatório. Sem ele, o sistema falha fechado em vez de
  // escolher sandbox/produção por NODE_ENV.
  if (rawEnv === 'sandbox') {
    if (!sandboxKey) return null
    return {
      env: 'sandbox',
      baseUrl: ASAAS_SANDBOX_BASE_URL,
      apiKey: sandboxKey,
    }
  }

  if (rawEnv === 'production') {
    if (!prodKey) return null
    return {
      env: 'production',
      baseUrl: ASAAS_PROD_BASE_URL,
      apiKey: prodKey,
    }
  }

  if (rawEnv) {
    console.error(`[Asaas] ASAAS_ENV inválido: "${rawEnv}". Use "production" ou "sandbox".`)
  }

  return null
}

export function isAsaasConfigured(): boolean {
  return resolveAsaasConfig() !== null
}

export function verifyAsaasWebhookToken(
  receivedToken: string | null | undefined,
  expectedToken: string | null | undefined = process.env.ASAAS_WEBHOOK_TOKEN
): boolean {
  const cleanReceived = (receivedToken || '').trim()
  const cleanExpected = (expectedToken || '').trim()
  if (!cleanReceived || !cleanExpected || cleanExpected.length < 16) {
    return false
  }
  const hashA = createHash('sha256').update(cleanReceived).digest()
  const hashB = createHash('sha256').update(cleanExpected).digest()
  return timingSafeEqual(hashA, hashB)
}

export async function readBoundedJson(
  request: NextRequest,
  maxBytes: number = 256 * 1024
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    const parsedLength = Number(contentLength)
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return { ok: false, status: 413, error: 'Payload excede o tamanho máximo permitido.' }
    }
  }

  if (!request.body) {
    return { ok: false, status: 400, error: 'Corpo da requisição ausente.' }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return { ok: false, status: 413, error: 'Payload excede o tamanho máximo permitido.' }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, status: 400, error: 'Falha ao ler corpo da requisição.' }
  }

  if (totalBytes === 0) {
    return { ok: false, status: 400, error: 'Corpo JSON vazio.' }
  }

  const combined = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const text = new TextDecoder().decode(combined)
    const parsed: unknown = JSON.parse(text)
    return { ok: true, data: parsed }
  } catch {
    return { ok: false, status: 400, error: 'JSON malformado.' }
  }
}

async function asaasFetch(
  config: AsaasConfig,
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': ASAAS_USER_AGENT,
      access_token: config.apiKey,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(ASAAS_TIMEOUT_MS),
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

  return { ok: res.ok, status: res.status, data }
}

function extractAsaasErrorMessage(data: any): string {
  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (first && typeof first.description === 'string' && first.description.trim()) {
      return first.description.trim()
    }
  }
  return 'Não foi possível iniciar o checkout de pagamento no momento.'
}

export interface CreateCheckoutResult {
  ok: true
  checkoutId: string
  checkoutUrl: string
  env: AsaasEnvironment
}

export interface CreateCheckoutError {
  ok: false
  error: string
  status: number
}

export async function createAsaasCheckoutSession(
  payload: AsaasCheckoutPayload
): Promise<CreateCheckoutResult | CreateCheckoutError> {
  const config = resolveAsaasConfig()
  if (!config) {
    return {
      ok: false,
      status: 503,
      error: 'Serviço de pagamentos temporariamente indisponível.',
    }
  }

  try {
    let response = await asaasFetch(config, '/checkouts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Em Sandbox sem chave Pix cadastrada, faz fallback transparente para Cartão para viabilizar homologação local
    if (
      !response.ok &&
      response.status === 400 &&
      config.env === 'sandbox' &&
      payload.billingTypes.includes('PIX')
    ) {
      const errMsg = extractAsaasErrorMessage(response.data).toLowerCase()
      if (errMsg.includes('chave pix')) {
        console.warn(
          '[Asaas Sandbox] Conta sandbox sem chave Pix; repetindo criação de checkout apenas com CREDIT_CARD.'
        )
        const fallbackPayload: AsaasCheckoutPayload = {
          ...payload,
          billingTypes: ['CREDIT_CARD'],
        }
        response = await asaasFetch(config, '/checkouts', {
          method: 'POST',
          body: JSON.stringify(fallbackPayload),
        })
      }
    }

    if (!response.ok || !response.data?.id) {
      const asaasMsg = extractAsaasErrorMessage(response.data)
      console.error('[Asaas] Falha ao criar checkout:', {
        env: config.env,
        status: response.status,
        description: asaasMsg,
      })
      return {
        ok: false,
        status: response.status >= 400 && response.status < 500 ? 422 : 502,
        error: asaasMsg,
      }
    }

    const checkoutId = String(response.data.id)
    const directLink =
      typeof response.data.link === 'string' && response.data.link.startsWith('https://')
        ? response.data.link
        : null

    const fallbackHost = config.env === 'sandbox' ? 'https://sandbox.asaas.com' : 'https://asaas.com'
    const checkoutUrl =
      directLink || `${fallbackHost}/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`

    return {
      ok: true,
      checkoutId,
      checkoutUrl,
      env: config.env,
    }
  } catch (err) {
    console.error('[Asaas] Exceção de rede ao criar checkout:', err)
    return {
      ok: false,
      status: 502,
      error: 'Tempo limite excedido ao comunicar com o gateway de pagamento. Tente novamente.',
    }
  }
}

export interface AsaasCustomerDetails {
  id: string
  name: string | null
  email: string | null
}

export async function getAsaasCustomer(customerId: string): Promise<AsaasCustomerDetails | null> {
  const config = resolveAsaasConfig()
  if (!config || !customerId) return null

  try {
    const res = await asaasFetch(config, `/customers/${encodeURIComponent(customerId)}`, {
      method: 'GET',
    })
    if (!res.ok || !res.data?.id) return null

    const name = typeof res.data.name === 'string' && res.data.name.trim() ? res.data.name.trim() : null
    const email =
      typeof res.data.email === 'string' && res.data.email.includes('@')
        ? res.data.email.trim().toLowerCase()
        : null

    return { id: String(res.data.id), name, email }
  } catch {
    return null
  }
}

export interface AsaasPaymentSummary {
  id: string
  customerId: string | null
  subscriptionId: string | null
  billingType: string | null
  value: number | null
  status: string | null
}

export async function getAsaasPaymentByCheckoutSession(
  checkoutId: string
): Promise<AsaasPaymentSummary | null> {
  const config = resolveAsaasConfig()
  if (!config || !checkoutId) return null

  try {
    const res = await asaasFetch(
      config,
      `/payments?checkoutSession=${encodeURIComponent(checkoutId)}&limit=1`,
      { method: 'GET' }
    )
    const first = Array.isArray(res.data?.data) ? res.data.data[0] : null
    if (!res.ok || !first?.id) return null

    return {
      id: String(first.id),
      customerId: typeof first.customer === 'string' ? first.customer : null,
      subscriptionId: typeof first.subscription === 'string' ? first.subscription : null,
      billingType: typeof first.billingType === 'string' ? first.billingType : null,
      value: typeof first.value === 'number' ? first.value : null,
      status: typeof first.status === 'string' ? first.status : null,
    }
  } catch {
    return null
  }
}
