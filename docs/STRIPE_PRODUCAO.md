# 💳 Configurar Stripe Produção

Este guia te ajuda a configurar as chaves do Stripe para o ambiente de produção.

## 📋 Checklist de Configuração

### **✅ Passo 1: Acessar Stripe Dashboard**

1. **Acesse o [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Faça login** com sua conta Stripe
3. **Vá para "Developers" → "API Keys"**

### **✅ Passo 2: Obter Chaves de Produção**

1. **Certifique-se** de estar no modo "Live" (não "Test")
2. **Copie as chaves:**
   - **Secret Key**: `sk_live_51...` (começa com `sk_live_`)
   - **Publishable Key**: `pk_live_51...` (começa com `pk_live_`)

### **✅ Passo 3: Configurar Webhooks**

1. **Vá para "Developers" → "Webhooks"**
2. **Clique em "Add endpoint"**
3. **Configure:**
   - **Endpoint URL**: `https://portal.imagineinstituto.com/api/webhooks/stripe`
   - **Events**: Selecione todos os eventos de pagamento
   - **Description**: "Portal Imagine - Webhooks"

### **✅ Passo 4: Configurar Variáveis de Ambiente**

#### **No Vercel Dashboard (Produção):**
```env
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **No arquivo .env.local (local):**
```env
# Para testes locais (use chaves de teste)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚨 Importante - Segurança

### **⚠️ NUNCA use chaves de produção em:**
- ❌ Ambiente de desenvolvimento
- ❌ Ambiente de teste
- ❌ Código fonte
- ❌ Repositórios Git

### **✅ SEMPRE use chaves de produção apenas em:**
- ✅ Ambiente de produção
- ✅ Vercel Dashboard (variáveis de ambiente)
- ✅ Servidor de produção

## 🧪 Testando Configuração

### **1. Teste com Cartões de Teste:**
```javascript
// Cartões de teste (modo desenvolvimento)
4242 4242 4242 4242 // Visa - Aprovado
4000 0000 0000 0002 // Visa - Recusado
```

### **2. Teste com Cartões Reais:**
```javascript
// Cartões reais (modo produção)
// Use cartões reais apenas em produção
// Cuidado: cobrança real será feita!
```

## 📊 Comparação de Chaves

| Ambiente | Secret Key | Publishable Key | Resultado |
|----------|------------|-----------------|-----------|
| **Local** | `sk_test_...` | `pk_test_...` | Demonstração |
| **Dev** | `sk_test_...` | `pk_test_...` | Teste real |
| **Prod** | `sk_live_...` | `pk_live_...` | Produção real |

## 🔧 Configuração Final

### **Ambiente Local:**
```env
# Use chaves de teste
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### **Ambiente Dev:**
```env
# Use chaves de teste
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### **Ambiente Prod:**
```env
# Use chaves de produção
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

## ✅ Checklist Final

- [ ] Chaves de produção obtidas
- [ ] Webhooks configurados
- [ ] Variáveis de ambiente configuradas
- [ ] Testes realizados
- [ ] Segurança verificada

## 🎯 Resultado

Após configurar, você terá:

- **Ambiente Local**: Demonstração (sem cobrança)
- **Ambiente Dev**: Testes reais (sem cobrança)
- **Ambiente Prod**: Produção real (com cobrança)

**🚀 Stripe configurado para todos os ambientes!**
