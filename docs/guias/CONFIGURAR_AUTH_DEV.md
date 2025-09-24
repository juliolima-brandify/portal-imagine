# 🔐 Configurar Autenticação no Ambiente DEV

Guia completo para configurar a autenticação no Supabase para o ambiente de desenvolvimento.

## 📋 Checklist de Configuração

### **✅ Passo 1: Configurações Básicas**

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione o projeto DEV

2. **Vá para Authentication → Settings**

3. **Configure as seguintes seções:**

#### **A. Site URL**
```
https://portal-dev.vercel.app
```

#### **B. Redirect URLs**
```
https://portal-dev.vercel.app/auth/callback
https://portal-dev.vercel.app/dashboard
https://portal-dev.vercel.app/prototype/demo
https://portal-dev.vercel.app/prototype/checkout/*
```

### **✅ Passo 2: Configurações de Email**

#### **A. Email Confirmations**
- ❌ **Enable email confirmations**: **DESABILITAR** (para testes)
- ❌ **Enable email change confirmations**: **DESABILITAR** (para testes)

#### **B. Email Templates (Opcional)**
- Configure templates personalizados se necessário
- Use Resend para emails reais

### **✅ Passo 3: Provedores de Autenticação**

#### **A. Email/Password (Habilitar)**
- ✅ **Enable email confirmations**: **DESABILITAR** (para testes)
- ✅ **Enable email change confirmations**: **DESABILITAR** (para testes)

#### **B. Social Providers (Opcional)**
- **Google**: Se quiser login com Google
- **GitHub**: Se quiser login com GitHub

### **✅ Passo 4: Configurações Avançadas**

#### **A. JWT Settings**
- **JWT expiry**: 3600 (1 hora)
- **Refresh token expiry**: 2592000 (30 dias)

#### **B. Security**
- **Enable captcha**: Desabilitar (para testes)
- **Enable phone confirmations**: Desabilitar

### **✅ Passo 5: Testar Configuração**

```bash
# Testar autenticação
npm run test-auth

# Testar conexão geral
npm run test-supabase
```

## 🧪 Dados de Teste

### **Usuários de Teste**
- **Admin**: `admin@institutoimagine.org`
- **Doador**: `demo@doador.com`
- **Teste**: `test@example.com`

### **Senhas**
- Use senhas simples para testes: `123456`
- Em produção, use senhas seguras

## 🔧 Troubleshooting

### **Erro: "Email address is invalid"**
- Desabilite email confirmations
- Use emails válidos (ex: `test@example.com`)

### **Erro: "Invalid login credentials"**
- Verifique se o usuário foi criado
- Confirme a senha

### **Erro: "Cannot coerce the result to a single JSON object"**
- Verifique se a tabela `profiles` existe
- Execute o script `supabase-setup-safe.sql`

## 📚 URLs de Teste

### **Ambiente DEV**
- **Login**: `https://portal-dev.vercel.app/auth`
- **Dashboard**: `https://portal-dev.vercel.app/dashboard`
- **Prototype**: `https://portal-dev.vercel.app/prototype/demo`

### **Modo Demo**
- **Admin**: `?demo_email=admin@institutoimagine.org`
- **Doador**: `?demo_email=demo@doador.com`

## ✅ Verificação Final

Após configurar, teste:

1. **Conexão**: `npm run test-supabase`
2. **Autenticação**: `npm run test-auth`
3. **Aplicação**: `npm run dev`

## 🎯 Resultado Esperado

- ✅ **Conexão funcionando**
- ✅ **Signup funcionando**
- ✅ **Login funcionando**
- ✅ **Logout funcionando**
- ✅ **Perfil criado automaticamente**

---

**🎯 Autenticação configurada e funcionando no ambiente DEV!**
