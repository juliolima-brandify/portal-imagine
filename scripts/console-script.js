// =============================================
// SCRIPT SIMPLES PARA CONSOLE DO NAVEGADOR
// =============================================
// 
// Copie e cole este código no console do navegador (F12)

(function() {
  console.log('🚀 Preenchendo checkout automaticamente...')
  
  // Preencher nome
  const nameInput = document.querySelector('input[placeholder*="Nome"]')
  if (nameInput) {
    nameInput.value = 'João Silva'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ Nome: João Silva')
  }
  
  // Preencher email
  const emailInput = document.querySelector('input[placeholder*="email"]')
  if (emailInput) {
    emailInput.value = 'joao.silva@email.com'
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ Email: joao.silva@email.com')
  }
  
  // Selecionar valor
  const amountButtons = document.querySelectorAll('button[class*="border-2"]')
  if (amountButtons.length > 0) {
    amountButtons[0].click()
    console.log('✅ Valor: R$ 50')
  }
  
  // Preencher cartão
  const cardNameInput = document.querySelector('input[placeholder*="Nome completo"]')
  if (cardNameInput) {
    cardNameInput.value = 'João Silva'
    cardNameInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ Nome no cartão: João Silva')
  }
  
  const cardNumberInput = document.querySelector('input[placeholder*="1234 1234 1234 1234"]')
  if (cardNumberInput) {
    cardNumberInput.value = '4242 4242 4242 4242'
    cardNumberInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ Cartão: 4242 4242 4242 4242 (Visa)')
  }
  
  const expiryInput = document.querySelector('input[placeholder*="MM / AA"]')
  if (expiryInput) {
    expiryInput.value = '12 / 25'
    expiryInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ Validade: 12 / 25')
  }
  
  const cvcInput = document.querySelector('input[placeholder*="123"]')
  if (cvcInput) {
    cvcInput.value = '123'
    cvcInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log('✅ CVC: 123')
  }
  
  console.log('🎉 Checkout preenchido! Clique em "Finalizar doação" para testar.')
})()

