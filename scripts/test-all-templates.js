#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testAllTemplates() {
  console.log('🧪 Testando todos os templates de email...');
  console.log('==========================================');
  console.log('');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';
  const results = [];

  // 1. Email de Boas-vindas
  console.log('1. 🎉 Testando Email de Boas-vindas...');
  try {
    const result1 = await resend.emails.send({
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
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 20px; }
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
              <div class="logo">🏛️ Instituto Imagine</div>
              <h1 class="title">Obrigado pela sua doação!</h1>
              <p style="font-size: 18px; color: #6b7280; margin-bottom: 30px;">Sua contribuição faz a diferença na vida de muitas pessoas.</p>
            </div>

            <p>Olá <strong>João Silva</strong>,</p>

            <p>Recebemos sua doação e queremos agradecer de coração pelo seu apoio! Sua generosidade é fundamental para continuarmos nossa missão.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da sua doação:</h3>
              <p><strong>Valor:</strong> <span class="amount">R$ 150,00</span></p>
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
                <p><strong>Email:</strong> joao@exemplo.com</p>
                <p><strong>Senha temporária:</strong> temp123</p>
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
    
    if (result1.error) throw result1.error;
    results.push({ type: 'Boas-vindas', success: true, id: result1.data?.id });
    console.log('✅ Enviado com sucesso!');
  } catch (error) {
    results.push({ type: 'Boas-vindas', success: false, error: error.message });
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // 2. Confirmação de Doação
  console.log('2. ✅ Testando Confirmação de Doação...');
  try {
    const result2 = await resend.emails.send({
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
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 20px; }
            .donation-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏛️ Instituto Imagine</div>
              <h1 class="title">Doação Confirmada!</h1>
            </div>

            <p>Olá <strong>Maria Santos</strong>,</p>

            <p>Sua doação foi processada com sucesso! Agradecemos muito pela sua contribuição.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da doação:</h3>
              <p><strong>ID da doação:</strong> don_123456789</p>
              <p><strong>Valor:</strong> <span class="amount">R$ 75,00</span></p>
              <p><strong>Projeto:</strong> Alimentação Escolar</p>
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
    
    if (result2.error) throw result2.error;
    results.push({ type: 'Confirmação', success: true, id: result2.data?.id });
    console.log('✅ Enviado com sucesso!');
  } catch (error) {
    results.push({ type: 'Confirmação', success: false, error: error.message });
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // 3. Atualização de Projeto
  console.log('3. 📢 Testando Atualização de Projeto...');
  try {
    const result3 = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '🎯 Marco Atingido! - Construção da Biblioteca',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Marco Atingido!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
            .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 20px; }
            .project-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .update-content { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏛️ Instituto Imagine</div>
              <h1 class="title">🎯 Marco Atingido!</h1>
            </div>

            <p>Olá <strong>Pedro Costa</strong>,</p>

            <p>Queremos compartilhar uma atualização emocionante sobre um projeto que você apoia!</p>

            <div class="project-info">
              <h3>📋 Projeto:</h3>
              <p><strong>Construção da Biblioteca</strong></p>
            </div>

            <div class="update-content">
              <h3>🎯 Marco Atingido!</h3>
              <p>Acabamos de atingir 50% da meta de arrecadação! Muito obrigado pelo seu apoio. Com sua contribuição, conseguimos arrecadar R$ 15.000 dos R$ 30.000 necessários para construir a nova biblioteca comunitária.</p>
            </div>

            <p>Seu apoio é fundamental para que possamos continuar fazendo a diferença. Obrigado por acreditar na nossa missão!</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://portal.imagineinstituto.com/projetos/biblioteca" class="button">Ver Projeto Completo</a>
              <a href="https://portal.imagineinstituto.com/projetos" class="button">Ver Outros Projetos</a>
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
    
    if (result3.error) throw result3.error;
    results.push({ type: 'Atualização', success: true, id: result3.data?.id });
    console.log('✅ Enviado com sucesso!');
  } catch (error) {
    results.push({ type: 'Atualização', success: false, error: error.message });
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // 4. Lembrete Recorrente
  console.log('4. ⏰ Testando Lembrete Recorrente...');
  try {
    const result4 = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '⏰ Lembrete: Próxima doação recorrente - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Doação Recorrente</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
            .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #d97706; margin-bottom: 20px; }
            .reminder-info { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 5px; }
            .button.secondary { background: #6b7280; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏛️ Instituto Imagine</div>
              <h1 class="title">⏰ Lembrete de Doação</h1>
            </div>

            <p>Olá <strong>Ana Silva</strong>,</p>

            <p>Este é um lembrete amigável sobre sua doação recorrente que está programada para acontecer em breve.</p>

            <div class="reminder-info">
              <h3>📋 Detalhes da sua doação recorrente:</h3>
              <p><strong>Projeto:</strong> Educação Infantil</p>
              <p><strong>Valor:</strong> <span class="amount">R$ 50,00</span></p>
              <p><strong>Frequência:</strong> Mensal</p>
              <p><strong>Próximo pagamento:</strong> 15 de Janeiro de 2025</p>
            </div>

            <p>Seu apoio contínuo é fundamental para que possamos manter nossos projetos ativos e fazer ainda mais diferença na vida das pessoas.</p>

            <p>Se você deseja modificar ou cancelar sua doação recorrente, pode fazê-lo a qualquer momento através do seu portal.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://portal.imagineinstituto.com/projetos/educacao-infantil" class="button">Ver Projeto</a>
              <a href="https://portal.imagineinstituto.com/doacoes" class="button secondary">Gerenciar Doações</a>
            </div>

            <p>Obrigado por sua generosidade contínua!</p>

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
    
    if (result4.error) throw result4.error;
    results.push({ type: 'Lembrete', success: true, id: result4.data?.id });
    console.log('✅ Enviado com sucesso!');
  } catch (error) {
    results.push({ type: 'Lembrete', success: false, error: error.message });
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // 5. Notificação Admin
  console.log('5. 💰 Testando Notificação Admin...');
  try {
    const result5 = await resend.emails.send({
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
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
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
              <div class="logo">🏛️ Instituto Imagine</div>
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
  "donationId": "don_987654321",
  "amount": 200.00,
  "projectTitle": "Educação Digital",
  "donorEmail": "joao@exemplo.com",
  "donorName": "João Silva",
  "paymentMethod": "cartão",
  "timestamp": "${new Date().toISOString()}"
}</pre>
            </div>

            <p>Esta é uma notificação automática do sistema Portal Imagine.</p>

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
    
    if (result5.error) throw result5.error;
    results.push({ type: 'Admin', success: true, id: result5.data?.id });
    console.log('✅ Enviado com sucesso!');
  } catch (error) {
    results.push({ type: 'Admin', success: false, error: error.message });
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // Resumo dos resultados
  console.log('📊 Resumo dos Testes:');
  console.log('=====================');
  
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
    console.log('🎉 Todos os templates testados com sucesso!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
    console.log('');
    console.log('🚀 Sistema de emails transacionais 100% funcional!');
  } else {
    console.log('⚠️ Alguns templates falharam. Verifique os erros acima.');
  }
}

testAllTemplates();
