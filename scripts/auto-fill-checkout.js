// =============================================
// SCRIPT PARA PREENCHER CHECKOUT AUTOMATICAMENTE
// =============================================
// 
// Como usar:
// 1. Abra o console do navegador (F12)
// 2. Cole este script
// 3. Execute: autoFillCheckout()
//
// Ou execute diretamente: autoFillCheckout('550e8400-e29b-41d4-a716-446655440002', 100)

function autoFillCheckout(projectId = '550e8400-e29b-41d4-a716-446655440002', amount = 100) {
  console.log('🚀 Iniciando preenchimento automático do checkout...')
  console.log('🔍 Inspecionando elementos da página...')
  
  // Debug: mostrar todos os inputs disponíveis
  const allInputs = document.querySelectorAll('input, textarea, button')
  console.log(`📋 Encontrados ${allInputs.length} elementos:`, allInputs)
  
  try {
    // 1. Selecionar valor da doação
    const amountButtons = document.querySelectorAll('button[class*="border-2"]')
    if (amountButtons.length > 0) {
      // Clicar no primeiro botão de valor (R$ 50)
      amountButtons[0].click()
      console.log('✅ Valor da doação selecionado: R$ 50')
    } else {
      console.log('⚠️ Botões de valor não encontrados')
    }
    
    // 2. Preencher nome
    const nameInput = document.querySelector('input[placeholder*="Nome"]') || 
                     document.querySelector('input[type="text"]')
    if (nameInput) {
      nameInput.value = 'João Silva'
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ Nome preenchido: João Silva')
    } else {
      console.log('⚠️ Campo nome não encontrado')
    }
    
    // 3. Preencher email
    const emailInput = document.querySelector('input[placeholder*="email"]') ||
                      document.querySelector('input[type="email"]')
    if (emailInput) {
      emailInput.value = 'joao.silva@email.com'
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ Email preenchido: joao.silva@email.com')
    } else {
      console.log('⚠️ Campo email não encontrado')
    }
    
    // 4. Preencher nome no cartão
    const cardNameInput = document.querySelector('input[placeholder*="Nome completo"]') ||
                         document.querySelector('input[placeholder*="Nome no cartão"]')
    if (cardNameInput) {
      cardNameInput.value = 'João Silva'
      cardNameInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ Nome no cartão preenchido: João Silva')
    } else {
      console.log('⚠️ Campo nome no cartão não encontrado')
    }
    
    // 5. Preencher número do cartão
    const cardNumberInput = document.querySelector('input[placeholder*="1234 1234 1234 1234"]') ||
                           document.querySelector('input[placeholder*="Número do cartão"]')
    if (cardNumberInput) {
      cardNumberInput.value = '4242 4242 4242 4242'
      cardNumberInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ Número do cartão preenchido: 4242 4242 4242 4242 (Visa)')
    } else {
      console.log('⚠️ Campo número do cartão não encontrado')
    }
    
    // 6. Preencher validade
    const expiryInput = document.querySelector('input[placeholder*="MM / AA"]') ||
                       document.querySelector('input[placeholder*="Validade"]')
    if (expiryInput) {
      expiryInput.value = '12 / 25'
      expiryInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ Validade preenchida: 12 / 25')
    } else {
      console.log('⚠️ Campo validade não encontrado')
    }
    
    // 7. Preencher CVC
    const cvcInput = document.querySelector('input[placeholder*="123"]') ||
                    document.querySelector('input[placeholder*="CVC"]')
    if (cvcInput) {
      cvcInput.value = '123'
      cvcInput.dispatchEvent(new Event('input', { bubbles: true }))
      console.log('✅ CVC preenchido: 123')
    } else {
      console.log('⚠️ Campo CVC não encontrado')
    }
    
    // 8. Ativar doação recorrente (opcional)
    const recurringToggle = document.querySelector('button[class*="bg-gray-200"]')
    if (recurringToggle) {
      recurringToggle.click()
      console.log('✅ Doação recorrente ativada')
    }
    
    // 9. Ativar mensagem (opcional)
    const messageToggles = document.querySelectorAll('button[class*="bg-gray-200"]')
    if (messageToggles.length > 1) {
      messageToggles[1].click()
      console.log('✅ Mensagem ativada')
      
      // Preencher mensagem
      const messageInput = document.querySelector('textarea[placeholder*="mensagem"]')
      if (messageInput) {
        messageInput.value = 'Parabéns pelo projeto! Continuem com o excelente trabalho.'
        messageInput.dispatchEvent(new Event('input', { bubbles: true }))
        console.log('✅ Mensagem preenchida')
      }
    }
    
    console.log('🎉 Preenchimento automático concluído!')
    console.log('💡 Agora você pode clicar em "Finalizar doação" para testar')
    
    return {
      success: true,
      message: 'Checkout preenchido automaticamente!',
      data: {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12 / 25',
        cvc: '123',
        amount: 50
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao preencher checkout:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

// Função para limpar todos os campos
function clearCheckout() {
  console.log('🧹 Limpando checkout...')
  
  const inputs = document.querySelectorAll('input, textarea')
  inputs.forEach(input => {
    if (input.type !== 'checkbox' && input.type !== 'radio') {
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  
  // Desmarcar toggles
  const toggles = document.querySelectorAll('button[class*="bg-green-600"]')
  toggles.forEach(toggle => toggle.click())
  
  console.log('✅ Checkout limpo!')
}

// Função para testar diferentes cartões
function testCard(cardType = 'visa') {
  const cards = {
    visa: '4242 4242 4242 4242',
    mastercard: '5555 5555 5555 4444',
    amex: '3782 822463 10005',
    declined: '4000 0000 0000 0002',
    insufficient: '4000 0000 0000 9995'
  }
  
  const cardNumber = cards[cardType]
  if (!cardNumber) {
    console.error('❌ Tipo de cartão inválido. Use: visa, mastercard, amex, declined, insufficient')
    return
  }
  
  const cardNumberInput = document.querySelector('input[placeholder*="1234 1234 1234 1234"]')
  if (cardNumberInput) {
    cardNumberInput.value = cardNumber
    cardNumberInput.dispatchEvent(new Event('input', { bubbles: true }))
    console.log(`✅ Cartão ${cardType} preenchido: ${cardNumber}`)
  }
}

// Função para preencher com dados específicos
function fillWithData(data) {
  console.log('📝 Preenchendo com dados customizados...', data)
  
  // Nome
  if (data.name) {
    const nameInput = document.querySelector('input[placeholder*="Nome"]')
    if (nameInput) {
      nameInput.value = data.name
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
  
  // Email
  if (data.email) {
    const emailInput = document.querySelector('input[placeholder*="email"]')
    if (emailInput) {
      emailInput.value = data.email
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
  
  // Valor
  if (data.amount) {
    const amountButtons = document.querySelectorAll('button[class*="border-2"]')
    if (amountButtons.length > 0) {
      amountButtons[0].click()
    }
  }
  
  console.log('✅ Dados customizados preenchidos!')
}

// =============================================
// COMANDOS RÁPIDOS
// =============================================

console.log(`
🎯 COMANDOS DISPONÍVEIS:

1. autoFillCheckout() - Preenche com dados padrão
2. autoFillCheckout('project-id', 100) - Preenche com projeto e valor específicos
3. clearCheckout() - Limpa todos os campos
4. testCard('visa') - Testa cartão Visa
5. testCard('mastercard') - Testa cartão MasterCard
6. testCard('amex') - Testa cartão American Express
7. testCard('declined') - Testa cartão recusado
8. fillWithData({name: 'João', email: 'joao@email.com'}) - Dados customizados

💡 Exemplo de uso:
   autoFillCheckout()
   // Aguarde 1 segundo
   // Clique em "Finalizar doação"
`)

// Exportar funções para uso global
window.autoFillCheckout = autoFillCheckout
window.clearCheckout = clearCheckout
window.testCard = testCard
window.fillWithData = fillWithData

console.log('✅ Script carregado! Use autoFillCheckout() para começar.')
