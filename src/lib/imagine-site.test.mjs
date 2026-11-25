import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isInstitutionalPath,
  parseBRNumber,
  generatePixBRCode,
  simulateIR2026,
  getInstitutionalProjectPathByPortalId,
} from './imagine-site.ts'

test('isInstitutionalPath normaliza barras, maiúsculas, query strings e separa rotas do portal', () => {
  assert.equal(isInstitutionalPath('/'), true)
  assert.equal(isInstitutionalPath('///'), true)
  assert.equal(isInstitutionalPath('/empresas'), true)
  assert.equal(isInstitutionalPath('/empresas/'), true)
  assert.equal(isInstitutionalPath('/Empresas?utm_source=ig'), true)
  assert.equal(isInstitutionalPath('/projetos/esporte/'), true)
  assert.equal(isInstitutionalPath('/projetos/novo-projeto-dinamico'), true)
  assert.equal(isInstitutionalPath('/projetos'), false)
  assert.equal(isInstitutionalPath('/projetos/dd0107dc-1802-47af-8755-371603acf890/relatorios'), false)
  assert.equal(isInstitutionalPath('/entrar'), false)
  assert.equal(isInstitutionalPath(null), false)
})

test('parseBRNumber converte formato brasileiro, decimal com ponto e rejeita inválidos', () => {
  assert.equal(parseBRNumber('1.250,50'), 1250.5)
  assert.equal(parseBRNumber('1000.50'), 1000.5)
  assert.equal(parseBRNumber('50.5'), 50.5)
  assert.equal(parseBRNumber('R$ 100,00'), 100)
  assert.equal(parseBRNumber('  R$ 100,00 '), 100)
  assert.equal(parseBRNumber('1.000'), 1000)
  assert.equal(parseBRNumber('0'), 0)
  assert.equal(parseBRNumber('-50'), 0)
  assert.equal(parseBRNumber('100,50abc'), 0)
  assert.equal(parseBRNumber('1e10'), 0)
  assert.equal(parseBRNumber('abc'), 0)
})

test('generatePixBRCode valida chave vazia, centavos, emojis, txid minúsculo e CRC16', () => {
  assert.equal(generatePixBRCode('', 50, 'Instituto Imagine', 'Uberlândia', 'II01'), '')

  const code = generatePixBRCode(
    '14351728000172',
    50,
    'Instituto Imagine ❤️',
    'Uberlândia 🚀',
    'iiesporte'
  )
  assert.ok(code.startsWith('000201'))
  assert.ok(code.includes('540550.00'))
  assert.ok(code.includes('5917INSTITUTO IMAGINE'))
  assert.ok(code.includes('6010UBERLANDIA'))
  assert.ok(code.includes('0509IIESPORTE'))
  assert.match(code.slice(-4), /^[0-9A-F]{4}$/)

  const tiny = generatePixBRCode('14351728000172', 0.001, 'Instituto Imagine', 'Uberlandia', '')
  assert.ok(!tiny.includes('54040.00'))
})

test('simulateIR2026 sanitiza negativos/NaN, respeita isenção <= 60k, transição e simplificado', () => {
  assert.equal(
    simulateIR2026({ sal: 0, alu: 0, bon: 0, dep: 0, edu: 0, sau: 0, pgbl: 0, out: 0 }),
    null
  )
  assert.equal(
    simulateIR2026({ sal: -5000, alu: 0, bon: 0, dep: -2, edu: 0, sau: 0, pgbl: 0, out: 0 }),
    null
  )

  const isento = simulateIR2026({ sal: 5000, alu: 0, bon: 0, dep: 0, edu: 0, sau: Number.NaN, pgbl: 0, out: 0 })
  assert.ok(isento)
  assert.equal(isento.rend, 60000)
  assert.equal(isento.imp, 0)
  assert.equal(isento.pot, 0)
  assert.equal(Number.isNaN(isento.ded), false)

  const simplMelhor = simulateIR2026({ sal: 9000, alu: 0, bon: 0, dep: 0, edu: 0, sau: 0, pgbl: 0, out: 0 })
  assert.ok(simplMelhor)
  assert.ok(simplMelhor.obs.includes('modelo simplificado'))

  const completo = simulateIR2026({ sal: 15000, alu: 0, bon: 0, dep: 2, edu: 800, sau: 1200, pgbl: 500, out: 0 })
  assert.ok(completo)
  assert.equal(completo.rend, 180000)
  assert.ok(completo.imp > 10000)
  assert.equal(completo.pot, Math.round(completo.imp * 0.06 * 100) / 100)
  assert.ok(completo.obs.includes('declaração de 2027'))
})

test('getInstitutionalProjectPathByPortalId mapeia UUID para slug institucional com fallback', () => {
  assert.equal(
    getInstitutionalProjectPathByPortalId('dd0107dc-1802-47af-8755-371603acf890'),
    '/projetos/esporte'
  )
  assert.equal(
    getInstitutionalProjectPathByPortalId('uuid-novo', 'musica-jovem'),
    '/projetos/musica-jovem'
  )
  assert.equal(
    getInstitutionalProjectPathByPortalId('uuid-novo', 'relatorios'),
    '/#projetos'
  )
  assert.equal(getInstitutionalProjectPathByPortalId('uuid-desconhecido'), '/#projetos')
})
