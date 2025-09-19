#!/bin/bash

# ===========================================
# CONFIGURAR BANCO DE DADOS DEV
# ===========================================
# Script para configurar o novo banco Supabase para dev

echo "🔧 Configurando banco de dados para ambiente DEV..."

# Verificar se estamos na branch dev
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  Você não está na branch 'dev'"
    echo "🔄 Mudando para branch dev..."
    git checkout dev
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local para DEV..."
    cp env.dev.example .env.local
fi

echo "📋 CONFIGURAÇÃO NECESSÁRIA:"
echo ""
echo "1. Acesse o Supabase Dashboard"
echo "2. Vá para o projeto DEV que você criou"
echo "3. Copie as credenciais:"
echo "   - Project URL"
echo "   - Anon Key"
echo ""
echo "4. Edite o arquivo .env.local com as credenciais:"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-dev.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
echo "5. Execute o script de setup do banco:"
echo "   ./scripts/setup-dev-database.sh"
echo ""
echo "✅ Após configurar, execute:"
echo "   npm run deploy:dev"
