// =============================================
// SCRIPT UNIVERSAL PARA PREENCHIMENTO
// =============================================
// 
// Este script funciona independente da estrutura da página

(function() {
  console.log('🚀 Script Universal de Preenchimento')
  
  // Lista de dados para preencher
  const data = {
    name: 'João Silva',
    email: 'joao.silva@email.com',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12 / 25',
    cvc: '123'
  }
  
  // Função para encontrar e preencher campo
  function findAndFill(patterns, value, description) {
    for (let pattern of patterns) {
      const field = document.querySelector(pattern)
      if (field && field.type !== 'hidden') {
        field.value = value
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.dispatchEvent(new Event('change', { bubbles: true }))
        console.log(`✅ ${description}: ${value}`)
        return true
      }
    }
    console.log(`⚠️ ${description} não encontrado`)
    return false
  }
  
  // Função para clicar em botão
  function findAndClick(patterns, description) {
    for (let pattern of patterns) {
      const button = document.querySelector(pattern)
      if (button) {
        button.click()
        console.log(`✅ ${description}`)
        return true
      }
    }
    console.log(`⚠️ ${description} não encontrado`)
    return false
  }
  
  // 1. Selecionar valor da doação
  findAndClick([
    'button[class*="border-2"]',
    'button[class*="rounded-full"]',
    'button:contains("R$ 50")',
    'button:contains("50")'
  ], 'Valor R$ 50 selecionado')
  
  // 2. Preencher nome
  findAndFill([
    'input[placeholder*="Nome"]',
    'input[name*="name"]',
    'input[id*="name"]',
    'input[type="text"]'
  ], data.name, 'Nome')
  
  // 3. Preencher email
  findAndFill([
    'input[placeholder*="email"]',
    'input[type="email"]',
    'input[name*="email"]',
    'input[id*="email"]'
  ], data.email, 'Email')
  
  // 4. Preencher nome no cartão
  findAndFill([
    'input[placeholder*="Nome completo"]',
    'input[placeholder*="Nome no cartão"]',
    'input[placeholder*="Card name"]'
  ], data.name, 'Nome no cartão')
  
  // 5. Preencher número do cartão
  findAndFill([
    'input[placeholder*="1234 1234 1234 1234"]',
    'input[placeholder*="Número do cartão"]',
    'input[placeholder*="Card number"]',
    'input[name*="card"]'
  ], data.cardNumber, 'Número do cartão')
  
  // 6. Preencher validade
  findAndFill([
    'input[placeholder*="MM / AA"]',
    'input[placeholder*="Validade"]',
    'input[placeholder*="Expiry"]',
    'input[name*="expiry"]'
  ], data.expiry, 'Validade')
  
  // 7. Preencher CVC
  findAndFill([
    'input[placeholder*="123"]',
    'input[placeholder*="CVC"]',
    'input[placeholder*="CVV"]',
    'input[name*="cvc"]'
  ], data.cvc, 'CVC')
  
  console.log('🎉 Preenchimento universal concluído!')
  console.log('💡 Clique em "Finalizar doação" para testar')
  
  // Retornar dados preenchidos
  return {
    success: true,
    data: data,
    message: 'Checkout preenchido com sucesso!'
  }
})()

