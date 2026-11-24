import test from 'node:test'
import assert from 'node:assert/strict'

// Testes unitários das regras puras (espelhando src/lib/imagine-site.ts)
function parseBRNumber(raw) {
  const v = parseFloat(raw.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(v) && v > 0 ? v : 0
}

function generatePixBRCode(chave, valor, nome, cidade, txid) {
  const semAc = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const field = (id, s) => id + String(s.length).padStart(2, '0') + s
  const payload =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', chave)) +
    field('52', '0000') +
    field('53', '986') +
    (valor > 0 ? field('54', valor.toFixed(2)) : '') +
    field('58', 'BR') +
    field('59', semAc(nome).slice(0, 25)) +
    field('60', semAc(cidade).slice(0, 15)) +
    field('62', field('05', txid.replace(/[^A-Z0-9]/g, '').slice(0, 25) || '***')) +
    '6304'
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0')
}

function calcINSS(s) {
  const faixas = [[1518, 0.075], [2793.88, 0.09], [4190.83, 0.12], [8157.41, 0.14]]
  let ant = 0, t = 0
  for (const [lim, aliq] of faixas) {
    if (s > ant) t += (Math.min(s, lim) - ant) * aliq
    ant = lim
  }
  return t
}

function calcTabelaIR(b) {
  const f = [[29145.6, 0, 0], [33919.8, 0.075, 2185.92], [45012.6, 0.15, 4729.92], [55976.16, 0.225, 8105.88], [Infinity, 0.275, 10904.76]]
  for (const [lim, aliq, ded] of f) if (b <= lim) return Math.max(0, b * aliq - ded)
  return 0
}

function simulateIR2026(input) {
  const rend = input.sal * 12 + input.alu * 12 + input.bon
  if (!rend) return null
  const ded = calcINSS(input.sal) * 12 + input.dep * 2275.08 + Math.min(input.edu * 12, 3561.5 * (1 + input.dep)) + input.sau * 12 + Math.min(input.pgbl * 12, rend * 0.12) + input.out * 12
  const base = Math.max(0, rend - ded)
  let imp = calcTabelaIR(base)
  const red = rend <= 60000 ? imp : rend <= 88200 ? Math.max(0, 8429.73 - 0.095575 * rend) : 0
  imp = Math.max(0, imp - Math.min(red, imp))
  return { rend, ded, imp, pot: imp * 0.06 }
}

test('parseBRNumber converte formato brasileiro e rejeita inválidos', () => {
  assert.equal(parseBRNumber('1.250,50'), 1250.5)
  assert.equal(parseBRNumber('0'), 0)
  assert.equal(parseBRNumber('-50'), 0)
  assert.equal(parseBRNumber('abc'), 0)
})

test('generatePixBRCode gera payload EMV com CRC16 válido de 4 dígitos hex', () => {
  const code = generatePixBRCode('14351728000172', 50, 'Instituto Imagine', 'Uberlândia', 'IIARTES')
  assert.ok(code.startsWith('000201'))
  assert.ok(code.includes('540550.00'))
  assert.ok(code.includes('6010UBERLANDIA'))
  assert.match(code.slice(-8), /^6304[0-9A-F]{4}$/)
})

test('simulateIR2026 retorna null para rendimento zero e isento <= 60k', () => {
  assert.equal(simulateIR2026({ sal: 0, alu: 0, bon: 0, dep: 0, edu: 0, sau: 0, pgbl: 0, out: 0 }), null)
  const isento = simulateIR2026({ sal: 4500, alu: 0, bon: 0, dep: 0, edu: 0, sau: 0, pgbl: 0, out: 0 })
  assert.equal(isento.imp, 0)
  assert.equal(isento.pot, 0)
})

test('simulateIR2026 calcula 6% de potencial para renda tributável alta', () => {
  const res = simulateIR2026({ sal: 15000, alu: 0, bon: 0, dep: 2, edu: 500, sau: 400, pgbl: 500, out: 0 })
  assert.ok(res.imp > 0)
  assert.ok(Math.abs(res.pot - res.imp * 0.06) < 0.01)
})
