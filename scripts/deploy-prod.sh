#!/bin/bash

# ===========================================
# DEPLOY PROD (VERCEL - EXISTENTE)
# ===========================================
# Ambiente final com dados reais e usuários
# Usa o projeto Vercel já existente

echo "🚀 Deployando para ambiente PRODUÇÃO (existente)..."

# Verificar se estamos na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Você não está na branch 'main'"
    echo "🔄 Mudando para branch main..."
    git checkout main
fi

# Fazer commit das mudanças
echo "💾 Commitando mudanças..."
git add .
git commit -m "deploy: atualizações para ambiente PROD" || echo "Nenhuma mudança para commit"

# Push para branch main
echo "📤 Enviando para branch main..."
git push origin main

echo "✅ Deploy para PROD iniciado!"
echo "🌐 URL: https://portal.imagineinstituto.com (existente)"
echo "🎯 Modo: Produção (dados reais)"
echo "🔐 Autenticação: Supabase real"
echo "💳 Pagamentos: Stripe modo produção"
echo "📧 Emails: Resend real"
echo "⚠️  ATENÇÃO: Este é o ambiente de produção!"
echo "🔄 Deploy automático via Vercel (branch main)"
