import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Valida o token do webhook do Asaas (header asaas-access-token) em tempo constante.
 * Módulo puro (sem server-only) para ser testado diretamente.
 */
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
