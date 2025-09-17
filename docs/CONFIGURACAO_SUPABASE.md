# 🔧 Configuração do Supabase - Portal Imagine

## ❌ Problema Identificado

O erro **"Failed to fetch"** está ocorrendo porque o Supabase não está configurado. O sistema está tentando se conectar com URLs e chaves placeholder.

## ✅ Solução

### 1. **Criar arquivo `.env.local`**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration (opcional para testes)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret_aqui

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

### 2. **Configurar Supabase**

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie uma nova conta ou faça login
   - Clique em "New Project"
   - Escolha uma organização e nomeie o projeto

2. **Obter credenciais:**
   - No dashboard do projeto, vá em **Settings > API**
   - Copie a **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - Copie a **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

3. **Configurar banco de dados:**
   - Vá em **SQL Editor** no dashboard
   - Execute o script `supabase-setup-safe.sql` (criar tabelas)
   - Execute o script `supabase-storage-setup-safe.sql` (configurar storage)

### 3. **Testar configuração**

Execute o comando de teste:

```bash
npm run test-supabase
```

Se tudo estiver correto, você verá:
```
✅ Conexão com Supabase funcionando!
✅ Tabela profiles: OK
✅ Tabela projects: OK
✅ Tabela donations: OK
✅ Tabela favorites: OK
✅ Tabela notifications: OK
```

## 🎯 **Status Atual**

- ✅ **Sistema de autenticação** - Funcionando com contas demo
- ✅ **Tratamento de erros** - Melhorado com mensagens claras
- ✅ **Indicador visual** - Mostra status da configuração
- ⏳ **Supabase** - Aguardando configuração

## 🚀 **Como testar agora**

### **Opção 1: Usar contas demo (recomendado para testes)**
1. Acesse `/auth`
2. Clique em **"Demo Doador"** ou **"Demo Admin"**
3. Os campos serão preenchidos automaticamente
4. Clique em **"Entrar"**

### **Opção 2: Configurar Supabase (para produção)**
1. Siga os passos acima para configurar o Supabase
2. Crie o arquivo `.env.local`
3. Execute `npm run test-supabase`
4. Agora você pode criar contas reais

## 📋 **Próximos passos**

1. **Configurar Supabase** (se necessário para produção)
2. **Configurar Stripe** (para pagamentos reais)
3. **Deploy** (usando CapRover, Vercel, etc.)

## 🔍 **Troubleshooting**

### Erro "Failed to fetch"
- ✅ **Causa**: Supabase não configurado
- ✅ **Solução**: Criar arquivo `.env.local` com credenciais válidas

### Erro "supabaseUrl is required"
- ✅ **Causa**: Variável de ambiente não definida
- ✅ **Solução**: Verificar se `.env.local` existe e tem as variáveis corretas

### Erro "Invalid login credentials"
- ✅ **Causa**: Email/senha incorretos
- ✅ **Solução**: Usar contas demo ou verificar credenciais

---

**💡 Dica**: Para testes rápidos, use sempre as contas demo. Para produção, configure o Supabase seguindo os passos acima.
