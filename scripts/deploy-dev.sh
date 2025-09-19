#!/bin/bash

# ===========================================
# DEPLOY DEV (VERCEL)
# ===========================================
# Para testar autenticação, integrações e backend
# Cria um novo projeto Vercel para desenvolvimento

echo "🚀 Configurando ambiente DEV na Vercel..."

# Verificar se estamos na branch dev
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "🔄 Criando branch dev..."
    git checkout -b dev
fi

# Verificar se .env.local existe para dev
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local para DEV..."
    cp env.dev.example .env.local
    echo "⚠️  Configure as variáveis de ambiente para DEV!"
    echo "📋 Edite .env.local com suas credenciais de teste"
fi

# Fazer commit das mudanças
echo "💾 Commitando mudanças..."
git add .
git commit -m "deploy: configuração para ambiente DEV" || echo "Nenhuma mudança para commit"

# Push para branch dev
echo "📤 Enviando para branch dev..."
git push origin dev

echo "✅ Branch dev criada!"
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. Acesse o Vercel Dashboard"
echo "2. Crie um NOVO projeto a partir da branch 'dev'"
echo "3. Configure as variáveis de ambiente para DEV"
echo "4. URL será: https://portal-dev.vercel.app"
echo "🎯 Modo: Desenvolvimento (backend + integrações)"
echo "🔐 Autenticação: Supabase real"
echo "💳 Pagamentos: Stripe modo teste"
echo "📧 Emails: Resend real"
