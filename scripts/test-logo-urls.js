#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testLogoUrls() {
  console.log('🔍 Testando diferentes URLs de logo...');
  console.log('====================================');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';

  // URLs de logo para testar
  const logoUrls = [
    {
      name: 'Local (localhost)',
      url: 'http://localhost:3000/images/logo.png'
    },
    {
      name: 'Produção (Vercel)',
      url: 'https://portal.imagineinstituto.com/images/logo.png'
    },
    {
      name: 'Dev (Vercel)',
      url: 'https://portal-imagine-of.vercel.app/images/logo.png'
    },
    {
      name: 'Site Principal',
      url: 'https://imagineinstituto.com/images/logo.png'
    },
    {
      name: 'CDN Genérico',
      url: 'https://via.placeholder.com/200x80/059669/FFFFFF?text=INSTITUTO+IMAGINE'
    }
  ];

  console.log('📋 URLs que serão testadas:');
  logoUrls.forEach((logo, index) => {
    console.log(`${index + 1}. ${logo.name}: ${logo.url}`);
  });
  console.log('');

  for (let i = 0; i < logoUrls.length; i++) {
    const logo = logoUrls[i];
    console.log(`🧪 Testando ${logo.name}...`);
    
    try {
      const result = await resend.emails.send({
        from: 'Instituto Imagine <noreply@resend.dev>',
        to: [testEmail],
        subject: `🏛️ Teste Logo ${i + 1} - ${logo.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teste de Logo</title>
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
              .logo-test { 
                text-align: center; 
                margin: 20px 0; 
                padding: 20px; 
                border: 2px dashed #059669; 
                border-radius: 8px; 
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
                <h1 class="title">🏛️ Teste de Logo ${i + 1}</h1>
              </div>

              <p>Este é um teste para verificar qual URL de logo funciona nos emails.</p>

              <div class="logo-test">
                <h3>Logo Teste:</h3>
                <img src="${logo.url}" alt="Instituto Imagine" style="height: 80px; max-width: 200px; border: 1px solid #e5e7eb;">
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                  <strong>URL:</strong> ${logo.url}
                </p>
              </div>

              <div class="test-info">
                <h3>📋 Informações do Teste:</h3>
                <p><strong>Tipo:</strong> ${logo.name}</p>
                <p><strong>URL:</strong> ${logo.url}</p>
                <p><strong>Teste:</strong> ${i + 1} de ${logoUrls.length}</p>
                <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </div>

              <p>Se você conseguir ver o logo acima, esta URL funciona!</p>

              <div class="footer">
                <p>Este é um email de teste automático.</p>
                <p>Portal Imagine - Teste de URLs de Logo</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      
      if (result.error) throw result.error;
      
      console.log(`✅ ${logo.name}: Enviado com sucesso!`);
      console.log(`   📧 ID: ${result.data?.id}`);
      
    } catch (error) {
      console.log(`❌ ${logo.name}: Erro - ${error.message}`);
    }
    
    console.log('');
    
    // Aguardar para evitar rate limit
    if (i < logoUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🎯 Teste concluído!');
  console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
  console.log('');
  console.log('💡 Dica: Abra os emails e veja qual logo aparece corretamente.');
  console.log('   Use a URL que funcionar melhor nos templates finais.');
}

testLogoUrls();
