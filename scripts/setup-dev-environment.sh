#!/bin/bash

# ===========================================
# CONFIGURAÇÃO DO AMBIENTE DEV
# ===========================================
# Script para configurar o ambiente de desenvolvimento

echo "🚀 Configurando ambiente DEV..."

# Verificar se já existe branch dev
if git branch | grep -q "dev"; then
    echo "⚠️  Branch 'dev' já existe"
    echo "🔄 Mudando para branch dev..."
    git checkout dev
else
    echo "🔄 Criando branch dev..."
    git checkout -b dev
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local para DEV..."
    cp env.dev.example .env.local
    echo "✅ .env.local criado!"
    echo "⚠️  Configure as variáveis de ambiente para DEV!"
    echo "📋 Edite .env.local com suas credenciais de teste"
else
    echo "✅ .env.local já existe"
fi

# Fazer commit das mudanças
echo "💾 Commitando configuração DEV..."
git add .
git commit -m "feat: configuração do ambiente DEV" || echo "Nenhuma mudança para commit"

# Push para branch dev
echo "📤 Enviando para branch dev..."
git push origin dev

echo "✅ Ambiente DEV configurado!"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. Acesse o Vercel Dashboard"
echo "2. Crie um NOVO projeto a partir da branch 'dev'"
echo "3. Configure as variáveis de ambiente para DEV"
echo "4. URL será: https://portal-dev.vercel.app"
echo ""
echo "📋 Variáveis necessárias:"
echo "- NEXT_PUBLIC_SUPABASE_URL (dev)"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY (dev)"
echo "- STRIPE_SECRET_KEY (teste)"
echo "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (teste)"
echo "- RESEND_API_KEY (real)"
echo ""
echo "🎯 Modo: Desenvolvimento (backend + integrações)"
echo "🔐 Autenticação: Supabase real"
echo "💳 Pagamentos: Stripe modo teste"
echo "📧 Emails: Resend real"
