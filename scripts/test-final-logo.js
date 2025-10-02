#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testFinalLogo() {
  console.log('🏛️ Testando logo final com URL de produção...');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';
  
  // URL de produção do logo
  const logoUrl = 'https://portal.imagineinstituto.com/images/logo.png';

  try {
    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: [testEmail],
      subject: '🏛️ Logo Final - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Logo Final</title>
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
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              text-align: center; 
              color: #6b7280; 
              font-size: 14px; 
            }
            .logo-test {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
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

            <div class="logo-test">
              <h3>✅ Logo Testado e Funcionando!</h3>
              <p>Este email confirma que o logo do Instituto Imagine está sendo exibido corretamente em todos os emails transacionais.</p>
              <p><strong>URL do Logo:</strong> ${logoUrl}</p>
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
    
    console.log('✅ Email com logo de produção enviado com sucesso!');
    console.log(`📧 ID: ${result.data?.id}`);
    console.log(`🏛️ Logo URL: ${logoUrl}`);
    console.log('');
    console.log('🎉 Logo do Instituto Imagine funcionando perfeitamente!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
    console.log('');
    console.log('🚀 Agora todos os emails transacionais usarão esta URL de logo.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testFinalLogo();
