// =============================================
// SCRIPT SIMPLES PARA PREENCHER CHECKOUT
// =============================================
// 
// Copie e cole este código no console do navegador (F12)

console.log('🚀 Iniciando preenchimento automático...')

// Função para preencher campo
function fillField(selector, value, description) {
  const field = document.querySelector(selector)
  if (field) {
    field.value = value
    field.dispatchEvent(new Event('input', { bubbles: true }))
    console.log(`✅ ${description}: ${value}`)
    return true
  } else {
    console.log(`⚠️ ${description} não encontrado`)
    return false
  }
}

// Função para clicar em botão
function clickButton(selector, description) {
  const button = document.querySelector(selector)
  if (button) {
    button.click()
    console.log(`✅ ${description}`)
    return true
  } else {
    console.log(`⚠️ ${description} não encontrado`)
    return false
  }
}

// 1. Selecionar valor da doação
clickButton('button[class*="border-2"]', 'Valor R$ 50 selecionado')

// 2. Preencher nome
fillField('input[placeholder*="Nome"]', 'João Silva', 'Nome')

// 3. Preencher email
fillField('input[placeholder*="email"]', 'joao.silva@email.com', 'Email')

// 4. Preencher nome no cartão
fillField('input[placeholder*="Nome completo"]', 'João Silva', 'Nome no cartão')

// 5. Preencher número do cartão
fillField('input[placeholder*="1234 1234 1234 1234"]', '4242 4242 4242 4242', 'Número do cartão')

// 6. Preencher validade
fillField('input[placeholder*="MM / AA"]', '12 / 25', 'Validade')

// 7. Preencher CVC
fillField('input[placeholder*="123"]', '123', 'CVC')

console.log('🎉 Preenchimento concluído! Clique em "Finalizar doação" para testar.')

// Mostrar resumo
console.log(`
📋 RESUMO DO PREENCHIMENTO:
- Nome: João Silva
- Email: joao.silva@email.com
- Cartão: 4242 4242 4242 4242 (Visa)
- Validade: 12 / 25
- CVC: 123
- Valor: R$ 50

💡 Próximo passo: Clique em "Finalizar doação"
`)

