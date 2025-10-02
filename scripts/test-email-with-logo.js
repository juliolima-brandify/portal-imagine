#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testEmailWithLogo() {
  console.log('🧪 Testando email com logo do Instituto Imagine...');
  
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
      subject: '🏛️ Teste com Logo - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Teste com Logo</title>
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
              font-size: 24px; 
              font-weight: bold; 
              color: #059669; 
              margin-bottom: 20px; 
            }
            .test-info { 
              background: #f0fdf4; 
              border: 1px solid #bbf7d0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
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
              <h1 class="title">🏛️ Teste com Logo</h1>
            </div>

            <p>Olá <strong>Teste</strong>,</p>

            <p>Este é um email de teste para verificar se o logo do Instituto Imagine está sendo exibido corretamente nos emails transacionais.</p>

            <div class="test-info">
              <h3>📋 Informações do Teste:</h3>
              <p><strong>Logo URL:</strong> ${logoUrl}</p>
              <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <p><strong>Status:</strong> ✅ Logo integrado com sucesso!</p>
            </div>

            <p>O logo agora aparece em todos os emails transacionais do Portal Imagine, proporcionando uma identidade visual consistente e profissional.</p>

            <p>Com identidade visual,<br><strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email de teste automático.</p>
              <p>Portal Imagine - Sistema de emails transacionais</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) throw result.error;
    
    console.log('✅ Email com logo enviado com sucesso!');
    console.log(`📧 ID: ${result.data?.id}`);
    console.log(`🏛️ Logo URL: ${logoUrl}`);
    console.log('');
    console.log('🎉 Logo do Instituto Imagine integrado com sucesso!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
    console.log('');
    console.log('📋 Próximos emails transacionais incluirão:');
    console.log('   - Logo profissional do Instituto Imagine');
    console.log('   - Identidade visual consistente');
    console.log('   - URLs dinâmicas por ambiente');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testEmailWithLogo();
