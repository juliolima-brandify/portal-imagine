import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyAsaasWebhookToken } from './webhook-token.ts'

// Teste executável (não regex) de verifyAsaasWebhookToken: token ausente, curto, errado e certo.
const GOOD = 'whsec_token_com_mais_de_16_caracteres'

test('verifyAsaasWebhookToken: rejeita token ausente ou vazio', () => {
  assert.equal(verifyAsaasWebhookToken(null, GOOD), false)
  assert.equal(verifyAsaasWebhookToken(undefined, GOOD), false)
  assert.equal(verifyAsaasWebhookToken('', GOOD), false)
  assert.equal(verifyAsaasWebhookToken('   ', GOOD), false)
})

test('verifyAsaasWebhookToken: rejeita segredo configurado curto demais, mesmo que seja igual', () => {
  assert.equal(verifyAsaasWebhookToken('abc', 'abc'), false)
  assert.equal(verifyAsaasWebhookToken('x'.repeat(15), 'x'.repeat(15)), false)
  assert.equal(verifyAsaasWebhookToken('x'.repeat(16), 'x'.repeat(16)), true)
})

test('verifyAsaasWebhookToken: rejeita token errado e aceita o certo (com espaços nas bordas)', () => {
  assert.equal(verifyAsaasWebhookToken('token_errado_com_mais_de_16_chars', GOOD), false)
  assert.equal(verifyAsaasWebhookToken(GOOD.slice(0, -1), GOOD), false)
  assert.equal(verifyAsaasWebhookToken(GOOD, GOOD), true)
  assert.equal(verifyAsaasWebhookToken(`  ${GOOD}  `, GOOD), true)
})

test('verifyAsaasWebhookToken: sem segredo configurado no ambiente, nada é aceito', () => {
  const previous = process.env.ASAAS_WEBHOOK_TOKEN
  delete process.env.ASAAS_WEBHOOK_TOKEN
  try {
    assert.equal(verifyAsaasWebhookToken(GOOD), false)
  } finally {
    if (previous !== undefined) process.env.ASAAS_WEBHOOK_TOKEN = previous
  }
})
