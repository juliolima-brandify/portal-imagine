#!/bin/bash

# ===========================================
# GERAR SECRETS DO NEXTAUTH
# ===========================================
# Script para gerar secrets seguros para cada ambiente

echo "🔐 Gerando secrets do NextAuth para todos os ambientes..."

# Função para gerar secret aleatório
generate_secret() {
    openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
}

echo ""
echo "📋 SECRETS GERADOS:"
echo ""

echo "🏠 LOCAL:"
echo "NEXTAUTH_SECRET=$(generate_secret)"
echo ""

echo "🧪 DEV:"
echo "NEXTAUTH_SECRET=$(generate_secret)"
echo ""

echo "🚀 PROD:"
echo "NEXTAUTH_SECRET=$(generate_secret)"
echo ""

echo "✅ COMO USAR:"
echo "1. Copie cada secret para o respectivo .env.local"
echo "2. Configure no Vercel Dashboard para cada ambiente"
echo "3. Mantenha os secrets seguros e privados"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- Cada ambiente deve ter um secret diferente"
echo "- Nunca commite os secrets no Git"
echo "- Use variáveis de ambiente no Vercel"
