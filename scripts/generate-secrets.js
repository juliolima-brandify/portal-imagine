#!/usr/bin/env node

// ===========================================
// GERAR SECRETS DO NEXTAUTH
// ===========================================
// Script para gerar secrets seguros para cada ambiente

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('🔐 Gerando secrets do NextAuth para todos os ambientes...\n');

console.log('📋 SECRETS GERADOS:\n');

console.log('🏠 LOCAL:');
console.log(`NEXTAUTH_SECRET=${generateSecret()}\n`);

console.log('🧪 DEV:');
console.log(`NEXTAUTH_SECRET=${generateSecret()}\n`);

console.log('🚀 PROD:');
console.log(`NEXTAUTH_SECRET=${generateSecret()}\n`);

console.log('✅ COMO USAR:');
console.log('1. Copie cada secret para o respectivo .env.local');
console.log('2. Configure no Vercel Dashboard para cada ambiente');
console.log('3. Mantenha os secrets seguros e privados');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- Cada ambiente deve ter um secret diferente');
console.log('- Nunca commite os secrets no Git');
console.log('- Use variáveis de ambiente no Vercel');
