#!/usr/bin/env node

/**
 * Script simples para testar emails do Resend
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

async function testResendConnection() {
  console.log('🧪 Testando conexão com Resend...')
  
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('⚠️ RESEND_API_KEY não configurada ou usando placeholder')
      console.log('📧 Simulando envio de email...')
      console.log('')
      console.log('📧 Email de Boas-vindas:')
      console.log('   Para: teste@exemplo.com')
      console.log('   Assunto: 🎉 Obrigado pela sua doação! - Instituto Imagine')
      console.log('   Status: Simulado (API key não configurada)')
      console.log('')
      console.log('✅ Teste simulado concluído com sucesso!')
      return true
    }

    // Testar com API key real
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    console.log('🔑 API Key configurada, testando envio real...')

    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: ['teste@exemplo.com'],
      subject: '🧪 Teste de Email - Portal Imagine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">🏛️ Instituto Imagine</h1>
          <h2>🧪 Teste de Email Transacional</h2>
          <p>Este é um email de teste do sistema de emails transacionais do Portal Imagine.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Status:</strong> ✅ Sistema funcionando corretamente!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Portal Imagine - Sistema de emails transacionais<br>
            Este é um email de teste automático.
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('❌ Erro ao enviar email:', result.error)
      return false
    }

    console.log('✅ Email de teste enviado com sucesso!')
    console.log(`📧 ID do email: ${result.data?.id}`)
    console.log('')
    console.log('🎉 Sistema de emails funcionando perfeitamente!')
    
    return true

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
    return false
  }
}

async function showEmailTypes() {
  console.log('📧 Tipos de emails implementados:')
  console.log('================================')
  console.log('')
  console.log('1. 🎉 Email de Boas-vindas')
  console.log('   - Enviado após doação bem-sucedida')
  console.log('   - Inclui credenciais de acesso')
  console.log('')
  console.log('2. ✅ Confirmação de Doação')
  console.log('   - Enviado imediatamente após pagamento')
  console.log('   - Inclui detalhes da doação')
  console.log('')
  console.log('3. 📢 Atualização de Projeto')
  console.log('   - Enviado quando há marcos atingidos')
  console.log('   - Inclui progresso e novidades')
  console.log('')
  console.log('4. ⏰ Lembrete Recorrente')
  console.log('   - Enviado antes de cobranças recorrentes')
  console.log('   - Inclui detalhes da próxima cobrança')
  console.log('')
  console.log('5. 💰 Notificação Admin')
  console.log('   - Enviado para administradores')
  console.log('   - Inclui alertas e relatórios')
  console.log('')
}

async function showConfiguration() {
  console.log('⚙️ Configuração atual:')
  console.log('=====================')
  console.log('')
  
  const hasApiKey = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder')
  console.log(`🔑 API Key: ${hasApiKey ? '✅ Configurada' : '❌ Não configurada'}`)
  
  const nodeEnv = process.env.NODE_ENV || 'development'
  console.log(`🌍 Ambiente: ${nodeEnv}`)
  
  const fromEmail = nodeEnv === 'production' 
    ? 'Instituto Imagine <noreply@imagineinstituto.com>'
    : 'Instituto Imagine <noreply@resend.dev>'
  console.log(`📧 Email remetente: ${fromEmail}`)
  
  console.log('')
}

async function main() {
  console.log('🏛️ Portal Imagine - Teste de Emails Transacionais')
  console.log('================================================')
  console.log('')
  
  await showConfiguration()
  await showEmailTypes()
  
  const success = await testResendConnection()
  
  if (success) {
    console.log('')
    console.log('🚀 Próximos passos:')
    console.log('==================')
    console.log('1. Configure RESEND_API_KEY no arquivo .env.local')
    console.log('2. Teste fazendo uma doação real no portal')
    console.log('3. Verifique se os emails estão chegando')
    console.log('4. Monitore os logs do Vercel e Resend')
    console.log('')
    console.log('📚 Documentação: docs/guias/CONFIGURACAO_RESEND.md')
  } else {
    console.log('')
    console.log('🔧 Para corrigir:')
    console.log('================')
    console.log('1. Verifique se RESEND_API_KEY está correta')
    console.log('2. Teste a API key no dashboard do Resend')
    console.log('3. Verifique se o domínio está verificado')
    console.log('4. Consulte a documentação do Resend')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testResendConnection }

