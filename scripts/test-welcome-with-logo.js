#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testWelcomeWithLogo() {
  console.log('🎉 Testando template de Boas-vindas com logo...');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';
  
  // URL do logo baseada no ambiente
  const logoUrl = process.env.NODE_ENV === 'production' 
    ? 'https://portal.imagineinstituto.com/images/logo.png'
    : 'http://localhost:3000/images/logo.png';

  try {
    const result = await resend.emails.send({
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
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              margin-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 20px;
            }
            .subtitle {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            .donation-info {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
            }
            .login-info {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credentials {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 15px 0;
              font-family: monospace;
            }
            .button {
              display: inline-block;
              background: #059669;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px 5px;
            }
            .button:hover {
              background: #047857;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
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

            <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>

            <p>Mais uma vez, obrigado por acreditar na nossa causa!</p>

            <p>Com gratidão,<br>
            <strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) throw result.error;
    
    console.log('✅ Template de Boas-vindas com logo enviado com sucesso!');
    console.log(`📧 ID: ${result.data?.id}`);
    console.log(`🏛️ Logo URL: ${logoUrl}`);
    console.log('');
    console.log('🎉 Template profissional com logo funcionando perfeitamente!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testWelcomeWithLogo();
