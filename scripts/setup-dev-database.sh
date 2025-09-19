#!/bin/bash

# ===========================================
# CONFIGURAR ESTRUTURA DO BANCO DEV
# ===========================================
# Script para configurar tabelas e dados no banco dev

echo "🗄️ Configurando estrutura do banco DEV..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Variáveis de ambiente não configuradas!"
    echo "📋 Configure primeiro o .env.local com as credenciais do Supabase"
    echo "   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-dev.supabase.co"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo "🌐 URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "🔑 Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."

echo ""
echo "📋 PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. Acesse o Supabase Dashboard do projeto DEV"
echo "2. Vá para 'SQL Editor'"
echo "3. Execute os scripts SQL necessários:"
echo ""
echo "   📄 Scripts disponíveis:"
echo "   - supabase-setup-safe.sql (estrutura básica)"
echo "   - supabase-storage-setup-safe.sql (storage)"
echo ""
echo "4. Configure as políticas RLS (Row Level Security)"
echo "5. Teste a conexão com:"
echo "   npm run test-supabase"
echo ""
echo "6. Faça o deploy do ambiente dev:"
echo "   npm run deploy:dev"
echo ""
echo "✅ Após configurar o banco, o ambiente dev estará pronto!"
