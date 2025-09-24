# 🧪 Configurar Ambiente DEV

Este guia te ajuda a configurar o ambiente de desenvolvimento com o novo banco de dados Supabase.

## 📋 Checklist de Configuração

### **✅ Passo 1: Obter Credenciais do Banco DEV**

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione o projeto DEV que você criou

2. **Copie as Credenciais**
   - Vá para **Settings** → **API**
   - Copie:
     - **Project URL** (ex: `https://xxxxx.supabase.co`)
     - **Anon Key** (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **✅ Passo 2: Configurar Variáveis de Ambiente**

1. **Copiar arquivo de exemplo**
   ```bash
   cp env.dev.example .env.local
   ```

2. **Editar .env.local**
   ```env
   # Substitua pelas suas credenciais
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-dev.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Use as mesmas chaves de teste do ambiente prod
   STRIPE_SECRET_KEY=sk_test_51...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Use a mesma chave do ambiente prod
   RESEND_API_KEY=re_...
   ```

### **✅ Passo 3: Configurar Estrutura do Banco**

1. **Acesse o SQL Editor no Supabase**
   - Vá para **SQL Editor** no dashboard
   - Execute os scripts necessários

2. **Scripts Disponíveis**
   - `supabase-setup-safe.sql` - Estrutura básica
   - `supabase-storage-setup-safe.sql` - Storage

3. **Configurar RLS (Row Level Security)**
   - Execute as políticas de segurança
   - Configure permissões de acesso

### **✅ Passo 4: Testar Conexão**

1. **Testar localmente**
   ```bash
   npm run test-supabase
   ```

2. **Iniciar servidor dev**
   ```bash
   npm run dev
   ```

3. **Testar funcionalidades**
   - Login/registro
   - Criação de projetos
   - Sistema de doações

### **✅ Passo 5: Deploy para Vercel**

1. **Criar branch dev**
   ```bash
   npm run setup:dev
   ```

2. **Configurar projeto no Vercel**
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Crie novo projeto
   - Conecte com a branch `dev`
   - Configure variáveis de ambiente

3. **Deploy automático**
   ```bash
   npm run deploy:dev
   ```

## 🔧 Scripts Disponíveis

### **Configurar Banco DEV:**
```bash
./scripts/configure-dev-database.sh
```

### **Setup do Banco:**
```bash
./scripts/setup-dev-database.sh
```

### **Deploy DEV:**
```bash
npm run deploy:dev
```

## 📊 Estrutura Final

```
🏠 Local:    Sem banco (dados mock)
🧪 Dev:      Supabase DEV (novo banco)
🚀 Prod:     Supabase PROD (banco existente)
```

## 🎯 Benefícios da Configuração

### **✅ Segurança:**
- **Dados isolados** por ambiente
- **Testes seguros** sem afetar produção
- **Controle de acesso** independente

### **✅ Desenvolvimento:**
- **Testes de integração** reais
- **Dados de teste** controlados
- **Deploy independente**

### **✅ Manutenção:**
- **Configuração simples**
- **Scripts automatizados**
- **Documentação completa**

## 🚨 Importante

### **⚠️ Nunca use dados de produção no DEV:**
- Use sempre dados de teste
- Configure RLS adequadamente
- Mantenha credenciais separadas

### **⚠️ Configure variáveis de ambiente:**
- Nunca commite arquivos `.env.local`
- Use variáveis de ambiente no Vercel
- Mantenha credenciais seguras

## 🎉 Resultado Final

Após configurar, você terá:

- **Ambiente Local**: Prototipação rápida
- **Ambiente DEV**: Testes de integração
- **Ambiente PROD**: Produção estável

**🚀 Agora você tem um fluxo completo de desenvolvimento profissional!**
