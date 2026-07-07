# 🚨 CONFIGURAÇÃO URGENTE - PRODUÇÃO

> ⚠️ **Este guia está desatualizado — a produção hoje roda na Vercel, não em CapRover.** Fonte canônica: [docs/ESTADO_ATUAL.md](../ESTADO_ATUAL.md) (07/07/2026). O problema atual da produção **não é o Stripe**, e sim que as env vars da Vercel apontam para um banco Supabase **morto**; é preciso trocar para `zzxtethlsdjjfjjrqmlk` e redeployar. Corrigir também a falha de autenticação em `/api/admin/*` antes de religar. A chave pública usa o formato novo `sb_publishable_...` e as credenciais ficam só no `.env.local`.

## ❌ **PROBLEMA IDENTIFICADO**

O botão "Doar Agora" não está funcionando na produção porque **as variáveis de ambiente do Stripe não estão configuradas**.

## 🔧 **SOLUÇÃO IMEDIATA**

### **1. Acessar o Painel do CapRover**

1. Acesse o painel do CapRover
2. Vá para a aplicação `portal-imagine`
3. Clique em **"App Configs"**
4. Vá para **"Environment Variables"**

### **2. Adicionar as Variáveis do Stripe**

Adicione estas variáveis **OBRIGATÓRIAS**:

```bash
# Stripe - OBRIGATÓRIO
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase - OBRIGATÓRIO
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js - OBRIGATÓRIO
NEXTAUTH_URL=https://portal.imagineinstituto.com
NEXTAUTH_SECRET=seu_secret_aleatorio_aqui

# Instituto
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com
NODE_ENV=production
```

### **3. Obter as Chaves do Stripe**

#### **3.1 Acessar Dashboard do Stripe:**
1. Vá para https://dashboard.stripe.com/apikeys
2. **Copie as chaves de PRODUÇÃO** (não teste):
   - **Publishable key** (começa com `pk_live_`)
   - **Secret key** (começa com `sk_live_`)

#### **3.2 Configurar Webhook:**
1. Vá para https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. **URL**: `https://portal.imagineinstituto.com/api/webhooks/stripe`
4. **Eventos**: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. **Copie o webhook secret** (começa com `whsec_`)

### **4. Obter as Chaves do Supabase**

#### **4.1 Acessar Dashboard do Supabase:**
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. **Copie**:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### **5. Reiniciar a Aplicação**

Após adicionar todas as variáveis:

1. No CapRover, vá para **"Deployment"**
2. Clique em **"Redeploy"** ou **"Restart"**
3. Aguarde o deploy completar

### **6. Testar**

1. Acesse: `https://portal.imagineinstituto.com/projetos`
2. Clique em **"Doar Agora"** em qualquer projeto
3. Teste com cartão: `4242 4242 4242 4242`

## 🧪 **CARTÕES DE TESTE PARA PRODUÇÃO**

**⚠️ ATENÇÃO**: Use apenas cartões de teste em produção até confirmar que tudo funciona!

```bash
# Cartões que funcionam:
4242 4242 4242 4242 - Visa
5555 5555 5555 4444 - Mastercard

# Cartões que falham:
4000 0000 0000 0002 - Cartão recusado
4000 0000 0000 9995 - Fundos insuficientes

# Dados para todos:
CVV: 123
Data: 12/25
CEP: 01234-567
```

## 🔍 **VERIFICAÇÃO**

### **Se ainda não funcionar:**

1. **Verificar logs** no CapRover
2. **Confirmar** se todas as variáveis foram salvas
3. **Testar** se o webhook está funcionando
4. **Verificar** se o domínio está correto

### **URLs para testar:**

- ✅ `https://portal.imagineinstituto.com/projetos`
- ✅ `https://portal.imagineinstituto.com/doar/1?demo_email=demo@doador.com`
- ✅ `https://portal.imagineinstituto.com/api/health`

## 📞 **SUPORTE**

Se precisar de ajuda:
1. Verifique os logs no CapRover
2. Teste localmente primeiro
3. Confirme se todas as chaves estão corretas

---

**🎯 Após configurar as variáveis, o botão "Doar Agora" funcionará perfeitamente!**
