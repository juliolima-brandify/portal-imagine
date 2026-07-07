# 🚀 Configuração do Supabase - Instituto Imagine

> ⚠️ **Parcialmente desatualizado — leia [docs/ESTADO_ATUAL.md](../ESTADO_ATUAL.md) primeiro (07/07/2026).** Projeto Supabase atual: `zzxtethlsdjjfjjrqmlk`. Chave pública no **formato novo `sb_publishable_...`**. Para recriar o banco do zero, use **`docs/SETUP-COMPLETO.sql`** (script consolidado idempotente).

## 📋 Passo a Passo para Configurar o Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: `portal-imagine`
   - **Database Password**: Gere uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
5. Clique em "Create new project"

### 2. Configurar o Banco de Dados

1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em "New Query"
3. Copie e cole o conteúdo do arquivo `supabase-setup.sql`
4. Clique em "Run" para executar o script
5. Repita o processo com o arquivo `supabase-storage-setup.sql`

### 3. Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Configure as seguintes opções:
   - **Site URL**: `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/dashboard`
3. Em **Email**, configure:
   - **Enable email confirmations**: ✅
   - **Enable email change confirmations**: ✅

### 4. Obter Chaves de API

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**
   - **anon public key**
   - **service_role key** (mantenha em segredo)

### 5. Atualizar Variáveis de Ambiente

Atualize seu arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

### 6. Testar a Configuração

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000/auth`
3. Tente criar uma conta de teste
4. Verifique se o usuário aparece na tabela `profiles` no Supabase

### 7. Criar Usuário Admin

Para criar um usuário admin, execute no SQL Editor:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email desejado
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## 🔧 Configurações Adicionais

### Row Level Security (RLS)
O script já configura RLS para todas as tabelas. Isso garante que:
- Usuários só veem seus próprios dados
- Admins têm acesso total
- Projetos são públicos para visualização

### Storage
O script configura dois buckets:
- `avatars`: Para fotos de perfil dos usuários
- `projects`: Para imagens dos projetos

### Triggers Automáticos
- Criação automática de perfil após signup
- Atualização automática de `updated_at`
- Cálculo automático de valores arrecadados

## 🚨 Troubleshooting

### Erro de RLS
Se encontrar erros de RLS, verifique se:
1. O usuário está autenticado
2. As políticas estão corretas
3. O usuário tem o role correto

### Erro de Storage
Se não conseguir fazer upload de imagens:
1. Verifique se os buckets foram criados
2. Confirme as políticas de storage
3. Teste com um usuário admin

### Erro de Autenticação
Se a autenticação não funcionar:
1. Verifique as URLs de redirect
2. Confirme as chaves de API
3. Teste em modo incógnito

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Supabase Dashboard
2. Consulte a documentação do Supabase
3. Teste as queries no SQL Editor

---

**Próximo passo**: Configurar o Stripe para pagamentos reais! 🎯
