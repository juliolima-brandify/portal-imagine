#!/bin/bash

# ===========================================
# DEPLOY LOCAL (DESENVOLVIMENTO)
# ===========================================
# Para prototipar e ajustar apenas o front-end

echo "🚀 Configurando ambiente LOCAL..."

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local a partir do exemplo..."
    cp env.local.example .env.local
    echo "✅ .env.local criado! Configure as variáveis se necessário."
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache

# Iniciar servidor de desenvolvimento
echo "🌐 Iniciando servidor local..."
echo "📍 URL: http://localhost:3000"
echo "🎯 Modo: Desenvolvimento (front-end apenas)"
echo "⚠️  Autenticação: Use contas demo"
echo "⚠️  Pagamentos: Modo demonstração"

npm run dev
