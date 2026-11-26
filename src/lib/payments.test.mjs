import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INSTITUTE_CNPJ,
  ASAAS_ITEM_NAME_MAX_LEN,
  ASAAS_ITEM_DESC_MAX_LEN,
  brlToCents,
  centsToBrl,
  sumDonationsBrl,
  validateCheckoutAmountBrl,
  buildAsaasItemName,
  buildAsaasItemDescription,
  resolvePublicCallbackBaseUrl,
  calculateNextDueDateSaoPaulo,
  buildAsaasCheckoutPayload,
  classifyAsaasWebhookEvent,
  resolveNextDonationStatus,
  sanitizePublicSessionResponse,
  escapeHtml,
  sanitizeSpreadsheetCell,
  buildReceiptText,
} from './payments.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

test('R4: cálculos monetários em centavos inteiros eliminam erro de ponto flutuante e respeitam mínimo R$ 5,00', () => {
  assert.equal(brlToCents(19.99), 1999)
  assert.equal(sumDonationsBrl([0.1, 0.2, 19.99]), 20.29)
  assert.equal(centsToBrl(500), 5)

  const tooLow = validateCheckoutAmountBrl(4.99)
  assert.equal(tooLow.ok, false)

  const exactMin = validateCheckoutAmountBrl(5)
  assert.equal(exactMin.ok, true)
  if (exactMin.ok) {
    assert.equal(exactMin.cents, 500)
    assert.equal(exactMin.valueBrl, 5)
  }

  const tooHigh = validateCheckoutAmountBrl(500_000.01)
  assert.equal(tooHigh.ok, false)
})

test('R4: buildAsaasCheckoutPayload respeita limite rígido de 30 chars no name, callback HTTPS e modos DETACHED vs RECURRENT', () => {
  const longTitle = 'Saúde Emocional e Famílias Atípicas em Uberlândia'
  const itemName = buildAsaasItemName(longTitle, false)
  assert.ok(itemName.length <= ASAAS_ITEM_NAME_MAX_LEN, `name excedeu 30 chars: ${itemName.length}`)

  const itemDesc = buildAsaasItemDescription(longTitle, true, 'quarterly')
  assert.ok(itemDesc.length <= ASAAS_ITEM_DESC_MAX_LEN)
  assert.ok(itemDesc.includes('trimestral'))

  // Localhost em dev nunca pode vazar para o callback do Asaas (evita HTTP 400)
  assert.equal(
    resolvePublicCallbackBaseUrl('http://localhost:3001', 'https://imagineinstituto.com'),
    'https://imagineinstituto.com'
  )
  assert.equal(
    resolvePublicCallbackBaseUrl('http://127.0.0.1:3000', 'http://localhost:3000'),
    'https://imagineinstituto.com'
  )
  assert.equal(
    resolvePublicCallbackBaseUrl('https://portal.imagineinstituto.com'),
    'https://portal.imagineinstituto.com'
  )

  const detached = buildAsaasCheckoutPayload({
    donationId: 'dd0107dc-1802-47af-8755-371603acf890',
    valueBrl: 50,
    destinationTitle: longTitle,
    isRecurring: false,
    callbackBaseUrl: 'http://localhost:3001',
    cancelPath: '/projetos/familias',
    customerData: {
      name: 'Maria Silva',
      email: 'MARIA@EXEMPLO.COM',
      cpfCnpj: '123.456.789-09',
    },
  })

  assert.deepEqual(detached.billingTypes, ['PIX', 'CREDIT_CARD'])
  assert.deepEqual(detached.chargeTypes, ['DETACHED'])
  assert.equal(detached.subscription, undefined)
  assert.ok(detached.items[0].name.length <= 30)
  assert.ok(detached.callback.successUrl.startsWith('https://imagineinstituto.com/doacao-sucesso?donation_id='))
  assert.equal(detached.callback.cancelUrl, 'https://imagineinstituto.com/projetos/familias?cancelled=true')
  assert.equal(detached.customerData?.email, 'maria@exemplo.com')
  assert.equal(detached.customerData?.cpfCnpj, '12345678909')

  // Virada de dia no fuso de São Paulo (2026-11-30T01:30:00Z = 2026-11-29 22:30 BRT -> próximo dia = 2026-11-30)
  // O Asaas documenta subscription.nextDueDate no formato YYYY-MM-DD.
  const fixedNow = new Date('2026-11-30T01:30:00.000Z')
  assert.equal(calculateNextDueDateSaoPaulo(fixedNow), '2026-11-30')

  const recurrent = buildAsaasCheckoutPayload({
    donationId: '6e302335-89a9-4336-9160-70c038576a97',
    valueBrl: 100,
    destinationTitle: 'Projeto Amarelinha',
    isRecurring: true,
    recurringFrequency: 'monthly',
    callbackBaseUrl: 'https://imagineinstituto.com',
    now: fixedNow,
  })

  assert.deepEqual(recurrent.billingTypes, ['CREDIT_CARD'])
  assert.deepEqual(recurrent.chargeTypes, ['RECURRENT'])
  assert.equal(recurrent.subscription?.cycle, 'MONTHLY')
  assert.equal(recurrent.subscription?.nextDueDate, '2026-11-30')
})

test('R3: classifyAsaasWebhookEvent e resolveNextDonationStatus lidam com eventos fora de ordem, renovação e estorno', () => {
  const checkoutPaid = classifyAsaasWebhookEvent({
    id: 'evt_001',
    event: 'CHECKOUT_PAID',
    checkout: {
      id: 'chk_123',
      externalReference: 'dd0107dc-1802-47af-8755-371603acf890',
      customer: 'cus_999',
      items: [{ value: 75.5 }],
      customerData: { name: 'João', email: 'JOAO@TESTE.COM' },
    },
  })
  assert.ok(checkoutPaid)
  assert.equal(checkoutPaid.targetStatus, 'completed')
  assert.equal(checkoutPaid.shouldNotifyDonorSuccess, true)
  assert.equal(checkoutPaid.checkoutId, 'chk_123')
  assert.equal(checkoutPaid.donorEmail, 'joao@teste.com')
  assert.equal(checkoutPaid.valueBrl, 75.5)

  const paymentReceived = classifyAsaasWebhookEvent({
    id: 'evt_002',
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_456',
      customer: 'cus_999',
      subscription: 'sub_789',
      billingType: 'PIX',
      value: 50,
      externalReference: 'dd0107dc-1802-47af-8755-371603acf890',
    },
  })
  assert.ok(paymentReceived)
  assert.equal(paymentReceived.paymentId, 'pay_456')
  assert.equal(paymentReceived.subscriptionId, 'sub_789')
  assert.equal(paymentReceived.billingType, 'PIX')

  // Eventos atrasados (CHECKOUT_EXPIRED / PAYMENT_OVERDUE) nunca rebaixam doação já confirmada
  assert.equal(resolveNextDonationStatus('completed', 'failed'), 'completed')
  assert.equal(resolveNextDonationStatus('completed', 'pending'), 'completed')
  // PAYMENT_RECEIVED após PAYMENT_CONFIRMED mantém completed
  assert.equal(resolveNextDonationStatus('completed', 'completed'), 'completed')
  // Estorno (PAYMENT_REFUNDED) reverte completed -> refunded e trava em refunded
  assert.equal(resolveNextDonationStatus('completed', 'refunded'), 'refunded')
  assert.equal(resolveNextDonationStatus('refunded', 'completed'), 'refunded')
})

test('R4 e R5: recibo usa CNPJ oficial 14.351.728/0001-72, sessão pública omite PII e sanitizadores bloqueiam XSS/CSV injection', () => {
  const receipt = buildReceiptText({
    donationId: 'don-123',
    donorName: 'Ana Paula',
    donorEmail: 'ana@exemplo.com',
    anonymous: false,
    amount: 120,
    projectTitle: 'Projeto Amarelinha',
    status: 'completed',
    paymentMethod: 'PIX',
    createdAt: '2026-11-26T15:00:00Z',
    transactionId: 'pay_999',
    isRecurring: false,
  })
  assert.ok(receipt.includes(INSTITUTE_CNPJ))
  assert.ok(!receipt.includes('12.345.678/0001-90'))

  const anonReceipt = buildReceiptText({
    donationId: 'don-124',
    donorName: 'Segredo',
    donorEmail: 'segredo@exemplo.com',
    anonymous: true,
    amount: 50,
    projectTitle: 'Natal Feliz 2026',
    status: 'pending',
    createdAt: '2026-11-26T15:00:00Z',
  })
  assert.ok(!anonReceipt.includes('segredo@exemplo.com'))
  assert.ok(anonReceipt.includes('Doador Anônimo'))

  const pub = sanitizePublicSessionResponse({
    id: 'don-123',
    campaign_slug: 'natal',
    amount: 50,
    status: 'pending',
    payment_method: 'PIX',
    is_recurring: false,
    // @ts-expect-error garantindo que campos extras nunca vazam
    donor_email: 'nao-vazar@exemplo.com',
    donor_name: 'Nome Privado',
  })
  assert.equal('donor_email' in pub, false)
  assert.equal('donorEmail' in pub, false)
  assert.equal('donorName' in pub, false)
  assert.equal(pub.projectTitle, 'Natal Feliz 2026')
  assert.equal(pub.paymentStatus, 'pending')

  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  assert.equal(sanitizeSpreadsheetCell('=CMD|\' /C calc\'!A0'), "'=CMD|' /C calc'!A0")
  assert.equal(sanitizeSpreadsheetCell('+SUM(A1:A2)'), "'+SUM(A1:A2)")
  assert.equal(sanitizeSpreadsheetCell('Projeto Amarelinha'), 'Projeto Amarelinha')
})

test('R1, R2, R6, R7 e R8: auditoria arquitetural de pacotes, módulos server-only, fluxo 3A e governança visual Admin', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  assert.equal('stripe' in deps, false, 'dependência stripe ainda presente em package.json')
  assert.equal('@stripe/stripe-js' in deps, false, '@stripe/stripe-js ainda presente em package.json')
  assert.equal('@stripe/react-stripe-js' in deps, false, '@stripe/react-stripe-js ainda presente em package.json')
  assert.equal('resend' in deps, false, 'SDK legado resend ainda presente em package.json')

  const dbSource = fs.readFileSync(path.join(repoRoot, 'src/lib/database.ts'), 'utf8')
  assert.equal(/from\s+['"]\.\/resend['"]/.test(dbSource), false, 'database.ts não pode importar ./resend')
  assert.equal(/from\s+['"]\.\/server\//.test(dbSource), false, 'database.ts não pode importar módulos server-only')
  assert.equal(/createUserFromDonation/.test(dbSource), false, 'createUserFromDonation insegura deve ser removida de database.ts')

  // Módulos server-only protegidos com import 'server-only'
  for (const rel of [
    'src/lib/server/asaas.ts',
    'src/lib/server/email.ts',
    'src/lib/server/donor-provision.ts',
    'src/lib/server/background.ts',
  ]) {
    const content = fs.readFileSync(path.join(repoRoot, rel), 'utf8')
    assert.ok(content.includes("import 'server-only'"), `${rel} deve importar 'server-only'`)
  }

  // Decisão 3A: provisionamento via recovery link sem senha em texto puro e /entrar com PASSWORD_RECOVERY
  const provisionSource = fs.readFileSync(path.join(repoRoot, 'src/lib/server/donor-provision.ts'), 'utf8')
  assert.ok(provisionSource.includes("type: 'recovery'"))
  assert.equal(/tempPassword/i.test(provisionSource), false)

  const entrarSource = fs.readFileSync(path.join(repoRoot, 'src/app/entrar/page.tsx'), 'utf8')
  assert.ok(entrarSource.includes('PASSWORD_RECOVERY'))
  assert.ok(entrarSource.includes('updateUser'))

  // Governança visual Admin (/admin/doacoes): zero atributo HTML nativo title=, Modal 3 zonas e adminFetch
  const adminDoacoesSource = fs.readFileSync(path.join(repoRoot, 'src/app/admin/doacoes/page.tsx'), 'utf8')
  assert.ok(adminDoacoesSource.includes('adminFetch'))
  assert.ok(adminDoacoesSource.includes('tabular-nums'))
  assert.equal(/<[a-z][a-z0-9-]*\b[^>]*\stitle=/.test(adminDoacoesSource), false, 'admin/doacoes não deve usar atributo HTML nativo title=')
  assert.equal(/handleApproveDonation/.test(adminDoacoesSource), false)
})

test('R1: se dist/client existir, garante zero vazamento de segredos ou endpoints privados no bundle do navegador', (t) => {
  const distClientDir = path.join(repoRoot, 'dist/client')
  if (!fs.existsSync(distClientDir)) {
    t.skip('dist/client ausente: rode o build para validar o bundle. Teste marcado como SKIP, não como aprovado.')
    return
  }

  const forbiddenPatterns = [
    'RESEND_API_KEY',
    'ASAAS_API_KEY',
    'ASAAS_WEBHOOK_TOKEN',
    'SUPABASE_SERVICE_ROLE_KEY',
    'api.resend.com',
    'api.asaas.com',
    'api-sandbox.asaas.com',
    'js.stripe.com',
  ]

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...walk(full))
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
        files.push(full)
      }
    }
    return files
  }

  const jsFiles = walk(distClientDir)
  assert.ok(jsFiles.length > 0, 'dist/client existe mas nenhum bundle JS foi encontrado')

  for (const file of jsFiles) {
    const text = fs.readFileSync(file, 'utf8')
    for (const forbidden of forbiddenPatterns) {
      assert.equal(
        text.includes(forbidden),
        false,
        `Padrão proibido "${forbidden}" encontrado no bundle cliente: ${path.relative(repoRoot, file)}`
      )
    }
  }
})

test('R9-R17: correções da banca (webhook 503, estorno parcial, e-mail exato, colunas, ASAAS_ENV, allowlist, zero Stripe, totais, lock)', () => {
  const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8')

  // R9: sem fallback de insert; usa RPC e responde 503 quando ela falta
  const webhookSource = read('src/app/api/webhooks/asaas/route.ts')
  assert.ok(webhookSource.includes("rpc('apply_asaas_webhook_event'"), 'webhook deve chamar a RPC idempotente')
  assert.ok(webhookSource.includes('isMissingRpcError'), 'webhook deve detectar RPC ausente')
  assert.ok(webhookSource.includes('status: 503'), 'webhook deve responder 503 sem a RPC')
  assert.equal(/from\('donations'\)\s*\.insert/.test(webhookSource), false, 'webhook não pode ter fallback de insert')

  // R10: estorno parcial real
  const paymentsSource = read('src/lib/payments.ts')
  assert.ok(paymentsSource.includes('partially_refunded'))
  assert.ok(paymentsSource.includes('refundedAmountBrl'))
  const migrationSource = read('supabase/migrations/20261127_banca_fixes.sql')
  assert.ok(migrationSource.includes('refunded_amount'))
  assert.ok(migrationSource.includes('partially_refunded'))

  // R11: e-mail exato com curingas escapados
  const provisionSource = read('src/lib/server/donor-provision.ts')
  assert.ok(provisionSource.includes('escapeLikePattern'))
  assert.equal(/\.ilike\(\s*['"]email['"]\s*,\s*cleanEmail\s*\)/.test(provisionSource), false, 'não pode usar ilike com e-mail cru')

  // R12: colunas explícitas no leitor do doador
  const dbSource = read('src/lib/database.ts')
  assert.ok(dbSource.includes('DONATION_SELECT_COLUMNS'))
  assert.equal(/\.from\('donations'\)\s*\.select\(\s*['"]\*/s.test(dbSource), false, 'getDonations não pode usar select(*)')

  // R13: ASAAS_ENV explícito, sem fallback por NODE_ENV
  const asaasSource = read('src/lib/server/asaas.ts')
  assert.ok(asaasSource.includes('ASAAS_ENV'))
  assert.equal(/NODE_ENV\s*===\s*['"]production['"]/.test(asaasSource), false, 'asaas.ts não pode decidir ambiente por NODE_ENV')

  // R14: callback com allowlist
  assert.ok(paymentsSource.includes('parseAllowedCallbackHosts'))
  assert.ok(paymentsSource.includes('DEFAULT_PUBLIC_CALLBACK_HOSTS'))
  const createSessionSource = read('src/app/api/checkout/create-session/route.ts')
  assert.ok(createSessionSource.includes('ALLOWED_CALLBACK_HOSTS'))

  // R15: zero Stripe na árvore ativa (src sem testes)
  const walk = (dir) => {
    const out = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) out.push(...walk(full))
      else if (/\.(ts|tsx|mjs|js)$/.test(entry.name) && !entry.name.endsWith('.test.mjs')) out.push(full)
    }
    return out
  }
  for (const file of walk(path.join(repoRoot, 'src'))) {
    const text = fs.readFileSync(file, 'utf8')
    assert.equal(/stripe/i.test(text), false, `Stripe residual em ${path.relative(repoRoot, file)}`)
  }
  assert.equal(fs.existsSync(path.join(repoRoot, 'src/app/embed/checkout/checkout-stripe')), false, 'rota checkout-stripe deve ser removida')

  // R16: totais do admin sem truncamento silencioso
  const adminRouteSource = read('src/app/api/admin/donations/route.ts')
  assert.equal(/\.limit\(\s*(1000|5000)\s*\)/.test(adminRouteSource), false, 'admin/donations não pode truncar em 1.000/5.000')
  assert.ok(adminRouteSource.includes('loadAllStatsRows'))

  // R17: reenvio de recibo com lock no servidor e confirmação no admin
  const resendSource = read('src/app/api/admin/donations/[id]/resend-receipt/route.ts')
  assert.ok(resendSource.includes('receipt_lock_at'))
  const adminPageSource = read('src/app/admin/doacoes/page.tsx')
  assert.ok(adminPageSource.includes('ConfirmDialog'))
})
