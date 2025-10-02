#!/usr/bin/env node

/**
 * Script para testar o sistema de emails transacionais
 * 
 * Uso:
 * node scripts/test-email-system.js [tipo]
 * 
 * Tipos disponíveis:
 * - welcome: Testa email de boas-vindas
 * - confirmation: Testa confirmação de doação
 * - update: Testa atualização de projeto
 * - reminder: Testa lembrete recorrente
 * - admin: Testa notificação admin
 * - all: Testa todos os tipos
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Importar as funções de email
async function testEmailSystem() {
  const args = process.argv.slice(2)
  const emailType = args[0] || 'all'
  
  console.log('🧪 Testando sistema de emails transacionais...')
  console.log(`📧 Tipo: ${emailType}`)
  console.log('')

  // Email de teste
  const testEmail = 'teste@exemplo.com'
  const testName = 'Usuário Teste'

  try {
    // Importar módulos dinamicamente
    const { EmailService } = await import('../src/lib/email-service.js')
    
    const results = []

    // Teste de email de boas-vindas
    if (emailType === 'welcome' || emailType === 'all') {
      console.log('📧 Testando email de boas-vindas...')
      const result = await EmailService.sendWelcome({
        name: testName,
        email: testEmail,
        tempPassword: 'temp123',
        donationAmount: 100.00,
        projectTitle: 'Educação Digital'
      })
      results.push({ type: 'welcome', success: result })
      console.log(`✅ Resultado: ${result ? 'Sucesso' : 'Falha'}`)
    }

    // Teste de confirmação de doação
    if (emailType === 'confirmation' || emailType === 'all') {
      console.log('📧 Testando confirmação de doação...')
      const result = await EmailService.sendDonationConfirmation({
        name: testName,
        email: testEmail,
        amount: 150.00,
        projectTitle: 'Alimentação Escolar',
        donationId: 'don_123456789',
        paymentMethod: 'PIX'
      })
      results.push({ type: 'confirmation', success: result })
      console.log(`✅ Resultado: ${result ? 'Sucesso' : 'Falha'}`)
    }

    // Teste de atualização de projeto
    if (emailType === 'update' || emailType === 'all') {
      console.log('📧 Testando atualização de projeto...')
      const result = await EmailService.sendProjectUpdate({
        name: testName,
        email: testEmail,
        projectTitle: 'Construção da Biblioteca',
        projectId: 'proj_123',
        updateType: 'milestone',
        updateMessage: 'Acabamos de atingir 50% da meta de arrecadação! Muito obrigado pelo seu apoio.',
        projectUrl: 'https://portal.imagineinstituto.com/projetos/proj_123'
      })
      results.push({ type: 'update', success: result })
      console.log(`✅ Resultado: ${result ? 'Sucesso' : 'Falha'}`)
    }

    // Teste de lembrete recorrente
    if (emailType === 'reminder' || emailType === 'all') {
      console.log('📧 Testando lembrete recorrente...')
      const result = await EmailService.sendRecurringReminder({
        name: testName,
        email: testEmail,
        projectTitle: 'Educação Infantil',
        amount: 75.00,
        frequency: 'Mensal',
        nextPaymentDate: '15 de Janeiro de 2025',
        projectUrl: 'https://portal.imagineinstituto.com/projetos/educacao-infantil'
      })
      results.push({ type: 'reminder', success: result })
      console.log(`✅ Resultado: ${result ? 'Sucesso' : 'Falha'}`)
    }

    // Teste de notificação admin
    if (emailType === 'admin' || emailType === 'all') {
      console.log('📧 Testando notificação admin...')
      const result = await EmailService.sendAdminNotification({
        adminEmail: 'admin@institutoimagine.org',
        type: 'new_donation',
        title: 'Nova Doação Recebida!',
        message: 'Uma nova doação de R$ 200,00 foi recebida para o projeto "Educação Digital".',
        data: {
          donationId: 'don_123456789',
          amount: 200.00,
          projectTitle: 'Educação Digital',
          donorEmail: testEmail,
          donorName: testName,
          timestamp: new Date().toISOString()
        }
      })
      results.push({ type: 'admin', success: result })
      console.log(`✅ Resultado: ${result ? 'Sucesso' : 'Falha'}`)
    }

    // Resumo dos resultados
    console.log('')
    console.log('📊 Resumo dos Testes:')
    console.log('===================')
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${result.type}: ${result.success ? 'Sucesso' : 'Falha'}`)
    })
    
    console.log('')
    console.log(`🎯 Taxa de Sucesso: ${successCount}/${totalCount} (${Math.round((successCount/totalCount)*100)}%)`)
    
    if (successCount === totalCount) {
      console.log('🎉 Todos os testes passaram! Sistema de emails funcionando perfeitamente.')
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique a configuração do Resend.')
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message)
    console.error('')
    console.error('💡 Verifique se:')
    console.error('   - As dependências estão instaladas (npm install)')
    console.error('   - O arquivo .env.local está configurado')
    console.error('   - A API key do Resend está definida')
    process.exit(1)
  }
}

// Função para verificar configuração
async function checkConfiguration() {
  console.log('🔧 Verificando configuração...')
  
  const requiredEnvVars = [
    'RESEND_API_KEY'
  ]
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente ausentes:')
    missing.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('')
    console.error('💡 Configure no arquivo .env.local:')
    console.error('   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    return false
  }
  
  console.log('✅ Configuração OK')
  return true
}

// Função principal
async function main() {
  console.log('🏛️ Portal Imagine - Teste de Emails Transacionais')
  console.log('================================================')
  console.log('')
  
  const configOk = await checkConfiguration()
  
  if (!configOk) {
    process.exit(1)
  }
  
  console.log('')
  await testEmailSystem()
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testEmailSystem, checkConfiguration }

