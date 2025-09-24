# 🔍 Troubleshooting Vercel - Botão "Doar Agora"

## ✅ **Se você já configurou as variáveis no Vercel:**

### **1. Verificar Variáveis de Ambiente no Vercel**

1. **Acesse o dashboard do Vercel**
2. **Vá para seu projeto** `portal-imagine`
3. **Clique em "Settings"** → **"Environment Variables"**
4. **Verifique se estão configuradas:**

```bash
# Stripe - OBRIGATÓRIO
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51... (ou pk_test_51...)
STRIPE_SECRET_KEY=sk_live_51... (ou sk_test_51...)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase - OBRIGATÓRIO
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js - OBRIGATÓRIO
NEXTAUTH_URL=https://seu-dominio.vercel.app (ou domínio customizado)
NEXTAUTH_SECRET=seu_secret_aleatorio_aqui
```

### **2. Verificar Deploy**

1. **Vá para "Deployments"** no Vercel
2. **Verifique se o último deploy foi bem-sucedido**
3. **Se houver erro, clique no deploy para ver os logs**

### **3. Testar URLs**

Teste estas URLs no seu domínio Vercel:

```bash
# URL base
https://seu-projeto.vercel.app

# Página de projetos
https://seu-projeto.vercel.app/projetos

# Página de doação (modo demo)
https://seu-projeto.vercel.app/doar/1?demo_email=demo@doador.com

# API de health
https://seu-projeto.vercel.app/api/health
```

### **4. Verificar Console do Navegador**

1. **Abra o DevTools** (F12)
2. **Vá para a aba "Console"**
3. **Acesse a página de doação**
4. **Procure por erros** relacionados ao Stripe

**Erros comuns:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined`
- `Stripe Elements failed to load`
- `Payment Intent creation failed`

### **5. Verificar Network Tab**

1. **Abra o DevTools** (F12)
2. **Vá para a aba "Network"**
3. **Tente fazer uma doação**
4. **Verifique se há requisições falhando** para:
   - `/api/payments/create-intent`
   - `js.stripe.com`

## 🚨 **Problemas Comuns e Soluções**

### **Problema 1: "Stripe not loaded"**

**Solução:**
```bash
# Verificar se a chave pública está correta
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51... (produção)
# ou
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51... (teste)
```

### **Problema 2: "Payment Intent failed"**

**Solução:**
```bash
# Verificar se a chave secreta está correta
STRIPE_SECRET_KEY=sk_live_51... (produção)
# ou
STRIPE_SECRET_KEY=sk_test_51... (teste)
```

### **Problema 3: "Webhook failed"**

**Solução:**
1. **Configurar webhook no Stripe:**
   - URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

### **Problema 4: "Supabase connection failed"**

**Solução:**
```bash
# Verificar se as chaves do Supabase estão corretas
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 **Passos para Resolver**

### **1. Redeploy no Vercel**

Após alterar variáveis de ambiente:

1. **Vá para "Deployments"**
2. **Clique nos 3 pontos** do último deploy
3. **Clique em "Redeploy"**

### **2. Verificar Logs**

1. **Vá para "Functions"** no Vercel
2. **Clique em uma função** (ex: `/api/payments/create-intent`)
3. **Verifique os logs** para erros

### **3. Testar Localmente**

Para confirmar que o problema é no Vercel:

```bash
# No seu computador
npm run dev

# Teste localmente
http://localhost:3000/doar/1?demo_email=demo@doador.com
```

## 🧪 **Teste Completo**

### **1. Teste Básico**
```bash
# Acesse a página de projetos
https://seu-dominio.vercel.app/projetos

# Clique em "Doar Agora"
# Deve abrir a página de doação
```

### **2. Teste de Pagamento**
```bash
# Use cartão de teste
4242 4242 4242 4242

# Deve processar o pagamento
# Deve redirecionar para página de sucesso
```

### **3. Teste de Erro**
```bash
# Use cartão que falha
4000 0000 0000 0002

# Deve mostrar erro de pagamento
```

## 📞 **Se ainda não funcionar**

### **1. Verificar Logs do Vercel**
- Vá para "Functions" → "View Function Logs"
- Procure por erros relacionados ao Stripe

### **2. Verificar Configuração do Stripe**
- Dashboard: https://dashboard.stripe.com
- Verificar se as chaves estão ativas
- Verificar se o webhook está configurado

### **3. Verificar Configuração do Supabase**
- Dashboard: https://supabase.com/dashboard
- Verificar se o projeto está ativo
- Verificar se as tabelas foram criadas

## 🎯 **URLs de Teste**

Substitua `seu-dominio.vercel.app` pelo seu domínio real:

```bash
# Página principal
https://seu-dominio.vercel.app

# Projetos
https://seu-dominio.vercel.app/projetos

# Doação (demo)
https://seu-dominio.vercel.app/doar/1?demo_email=demo@doador.com

# Admin (demo)
https://seu-dominio.vercel.app/admin/usuarios?demo_email=admin@institutoimagine.org

# API Health
https://seu-dominio.vercel.app/api/health
```

---

**🎯 Com essas verificações, você deve conseguir identificar e resolver o problema!**
