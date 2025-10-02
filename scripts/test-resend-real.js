#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function testRealEmail() {
  console.log('🧪 Testando envio real de email...');
  
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@resend.dev>',
      to: ['projeto.institutoimagine@gmail.com'],
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
    });

    if (result.error) {
      console.error('❌ Erro:', result.error);
      return false;
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log(`📧 ID: ${result.data?.id}`);
      console.log('');
      console.log('🎉 Sistema de emails funcionando perfeitamente!');
      console.log('📧 Verifique sua caixa de entrada: projeto.institutoimagine@gmail.com');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

testRealEmail();
