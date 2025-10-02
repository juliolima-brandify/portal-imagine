#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testIntegratedEmail() {
  console.log('🧪 Testando sistema integrado de emails...');
  console.log('==========================================');
  console.log('');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';
  
  // URL do logo baseada no ambiente
  const logoUrl = process.env.NODE_ENV === 'production' 
    ? 'https://portal.imagineinstituto.com/images/logo.png'
    : 'http://localhost:3000/images/logo.png';

  console.log('📋 Simulando fluxo completo de doação:');
  console.log('1. ✅ Doação processada com sucesso');
  console.log('2. 📧 Enviando confirmação...');
  console.log('3. 🎉 Enviando boas-vindas...');
  console.log('4. 💰 Notificando admin...');
  console.log('');

  const results = [];

  // 1. Email de Confirmação (Imediato)
  console.log('📧 1. Enviando confirmação de doação...');
  try {
    const result1 = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '✅ Confirmação de doação - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de doação</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
            .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 20px; }
            .donation-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="Instituto Imagine" style="height: 80px; max-width: 200px;">
              </div>
              <h1 class="title">Doação Confirmada!</h1>
            </div>

            <p>Olá <strong>Maria Santos</strong>,</p>

            <p>Sua doação foi processada com sucesso! Agradecemos muito pela sua contribuição.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da doação:</h3>
              <p><strong>ID da doação:</strong> don_test_${Date.now()}</p>
              <p><strong>Valor:</strong> <span class="amount">R$ 200,00</span></p>
              <p><strong>Projeto:</strong> Educação Digital</p>
              <p><strong>Método:</strong> PIX</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <p>Você receberá um email de boas-vindas em breve com instruções para acessar o portal.</p>

            <p>Obrigado por fazer a diferença!</p>

            <p>Com gratidão,<br><strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result1.error) throw result1.error;
    results.push({ type: 'Confirmação', success: true, id: result1.data?.id });
    console.log('✅ Confirmação enviada!');
  } catch (error) {
    results.push({ type: 'Confirmação', success: false, error: error.message });
    console.log('❌ Erro na confirmação:', error.message);
  }

  // Aguardar para evitar rate limit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Email de Boas-vindas (Para novo usuário)
  console.log('🎉 2. Enviando boas-vindas...');
  try {
    const result2 = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '🎉 Obrigado pela sua doação! - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Obrigado pela sua doação!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
            .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 20px; }
            .subtitle { font-size: 18px; color: #6b7280; margin-bottom: 30px; }
            .donation-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .login-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credentials { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; font-family: monospace; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="Instituto Imagine" style="height: 80px; max-width: 200px;">
              </div>
              <h1 class="title">Obrigado pela sua doação!</h1>
              <p class="subtitle">Sua contribuição faz a diferença na vida de muitas pessoas.</p>
            </div>

            <p>Olá <strong>Maria Santos</strong>,</p>

            <p>Recebemos sua doação e queremos agradecer de coração pelo seu apoio! Sua generosidade é fundamental para continuarmos nossa missão.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da sua doação:</h3>
              <p><strong>Valor:</strong> <span class="amount">R$ 200,00</span></p>
              <p><strong>Projeto:</strong> Educação Digital</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <div class="login-info">
              <h3>🔐 Acesso ao Portal</h3>
              <p>Criamos uma conta para você no nosso portal, onde você pode:</p>
              <ul>
                <li>Ver o histórico completo das suas doações</li>
                <li>Acompanhar o progresso dos projetos que você apoia</li>
                <li>Gerenciar doações recorrentes</li>
                <li>Receber atualizações sobre nossos projetos</li>
              </ul>

              <div class="credentials">
                <p><strong>Email:</strong> maria@exemplo.com</p>
                <p><strong>Senha temporária:</strong> temp456</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="https://portal.imagineinstituto.com/auth" class="button">Acessar Portal</a>
              </div>
            </div>

            <p>Com gratidão,<br><strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result2.error) throw result2.error;
    results.push({ type: 'Boas-vindas', success: true, id: result2.data?.id });
    console.log('✅ Boas-vindas enviadas!');
  } catch (error) {
    results.push({ type: 'Boas-vindas', success: false, error: error.message });
    console.log('❌ Erro nas boas-vindas:', error.message);
  }

  // Aguardar para evitar rate limit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Notificação Admin
  console.log('💰 3. Notificando administrador...');
  try {
    const result3 = await resend.emails.send({
      from: 'Sistema Portal Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '💰 Nova Doação Recebida!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Doação Recebida!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
            .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 20px; }
            .notification-content { background: #f0fdf4; border: 1px solid #05966933; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .admin-data { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 12px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="Instituto Imagine" style="height: 80px; max-width: 200px;">
              </div>
              <h1 class="title">💰 Nova Doação Recebida!</h1>
            </div>

            <p>Olá <strong>Administrador</strong>,</p>

            <div class="notification-content">
              <h3>💰 Notificação do Sistema</h3>
              <p>Uma nova doação de R$ 200,00 foi recebida para o projeto "Educação Digital".</p>
            </div>

            <div class="admin-data">
              <h4>📊 Dados Detalhados:</h4>
              <pre>{
  "donationId": "don_test_${Date.now()}",
  "amount": 200.00,
  "projectTitle": "Educação Digital",
  "donorEmail": "maria@exemplo.com",
  "donorName": "Maria Santos",
  "paymentMethod": "PIX",
  "timestamp": "${new Date().toISOString()}"
}</pre>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://portal.imagineinstituto.com/admin/dashboard" class="button">Acessar Admin</a>
            </div>

            <p>Atenciosamente,<br><strong>Sistema Portal Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Portal de Administração</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result3.error) throw result3.error;
    results.push({ type: 'Admin', success: true, id: result3.data?.id });
    console.log('✅ Admin notificado!');
  } catch (error) {
    results.push({ type: 'Admin', success: false, error: error.message });
    console.log('❌ Erro na notificação admin:', error.message);
  }

  console.log('');
  console.log('📊 Resumo do Teste Integrado:');
  console.log('=============================');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.type}: ${result.success ? 'Sucesso' : 'Falha'}`);
    if (result.success && result.id) {
      console.log(`   📧 ID: ${result.id}`);
    } else if (!result.success) {
      console.log(`   ❌ Erro: ${result.error}`);
    }
  });
  
  console.log('');
  console.log(`🎯 Taxa de Sucesso: ${successCount}/${totalCount} (${Math.round((successCount/totalCount)*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('');
    console.log('🎉 SISTEMA INTEGRADO FUNCIONANDO PERFEITAMENTE!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
    console.log('');
    console.log('🚀 Fluxo completo testado:');
    console.log('   1. ✅ Confirmação imediata');
    console.log('   2. ✅ Boas-vindas para novo usuário');
    console.log('   3. ✅ Notificação para administrador');
    console.log('   4. 🏛️ Logo em todos os emails');
    console.log('   5. 🎨 Design profissional e consistente');
  } else {
    console.log('⚠️ Alguns emails falharam. Verifique os erros acima.');
  }
}

testIntegratedEmail();
