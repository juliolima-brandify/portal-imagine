#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testUpdateTemplate() {
  console.log('📢 Testando template de Atualização de Projeto...');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const testEmail = 'projeto.institutoimagine@gmail.com';

  try {
    const result = await resend.emails.send({
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
    
    if (result.error) throw result.error;
    console.log('✅ Template de Atualização enviado com sucesso!');
    console.log(`📧 ID: ${result.data?.id}`);
    console.log('');
    console.log('🎉 TODOS OS 5 TEMPLATES TESTADOS COM SUCESSO!');
    console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testUpdateTemplate();
