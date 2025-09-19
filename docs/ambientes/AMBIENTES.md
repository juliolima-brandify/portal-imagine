# 🌍 Configuração de Ambientes

Este documento descreve a configuração dos 3 ambientes do projeto Portal Instituto Imagine.

## 📋 Visão Geral dos Ambientes

| Ambiente | Propósito | URL | Branch | Deploy |
|----------|-----------|-----|--------|--------|
| **Local** | Prototipação front-end | `http://localhost:3000` | - | Manual |
| **Dev** | Testes de integração | `https://portal-dev.vercel.app` | `dev` | Automático |
| **Prod** | Ambiente final | `https://portal.imagineinstituto.com` | `main` | Automático |

## 🏠 Ambiente Local

### **Propósito:**
- Prototipar e ajustar apenas o front-end
- Desenvolvimento rápido sem dependências externas
- Testes de UI/UX

### **Configuração:**
```bash
# 1. Copiar arquivo de exemplo
cp env.local.example .env.local

# 2. Instalar dependências
npm install

# 3. Iniciar servidor
npm run dev
```

### **Características:**
- ✅ **Front-end completo** funcionando
- ✅ **Contas demo** sempre disponíveis
- ✅ **Modo demonstração** ativo
- ❌ **Autenticação real** desabilitada
- ❌ **Pagamentos reais** desabilitados
- ❌ **Emails reais** desabilitados

### **Uso:**
- Desenvolvimento de componentes
- Testes de interface
- Prototipação de funcionalidades
- Demonstrações offline

## 🧪 Ambiente Dev (Vercel)

### **Propósito:**
- Testar autenticação e integrações
- Validar funcionalidades de backend
- Testes com dados reais (modo teste)

### **Configuração:**
```bash
# 1. Criar branch dev
git checkout -b dev

# 2. Configurar variáveis de ambiente
cp env.dev.example .env.local
# Editar .env.local com credenciais de teste

# 3. Deploy
git push origin dev
```

### **Variáveis de Ambiente (Dev):**
```env
# Supabase (REAL - para testes)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (REAL - modo teste)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (REAL - para emails de teste)
RESEND_API_KEY=re_...
```

### **Características:**
- ✅ **Autenticação real** com Supabase
- ✅ **Pagamentos reais** (modo teste)
- ✅ **Emails reais** funcionando
- ✅ **Dados reais** no banco
- ✅ **Integrações completas**

### **Uso:**
- Testes de autenticação
- Validação de pagamentos
- Testes de emails
- Validação de integrações
- Testes de performance

## 🚀 Ambiente Prod (Vercel - Existente)

### **Propósito:**
- Ambiente final com dados reais
- Usuários finais
- Produção

### **Configuração:**
```bash
# 1. Estar na branch main
git checkout main

# 2. Deploy automático
git push origin main
```

### **Variáveis de Ambiente (Prod):**
```env
# Supabase (REAL - produção)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (REAL - modo produção)
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (REAL - para emails de produção)
RESEND_API_KEY=re_...
```

### **Características:**
- ✅ **Autenticação real** com Supabase
- ✅ **Pagamentos reais** (modo produção)
- ✅ **Emails reais** funcionando
- ✅ **Dados reais** no banco
- ✅ **Integrações completas**
- ✅ **Usuários finais**

### **Uso:**
- Ambiente de produção
- Usuários finais
- Dados reais
- Pagamentos reais

## 🔄 Fluxo de Desenvolvimento

### **1. Desenvolvimento Local:**
```bash
# Prototipar no local
npm run dev
# Desenvolver e testar front-end
```

### **2. Testes de Integração:**
```bash
# Testar no ambiente dev
./scripts/deploy-dev.sh
# Validar integrações e backend
```

### **3. Deploy para Produção:**
```bash
# Deploy para produção
./scripts/deploy-prod.sh
# Ambiente final funcionando
```

## 🛠️ Scripts Disponíveis

### **Local:**
```bash
./scripts/deploy-local.sh
```

### **Dev:**
```bash
./scripts/deploy-dev.sh
```

### **Prod:**
```bash
./scripts/deploy-prod.sh
```

## 📊 Comparação dos Ambientes

| Funcionalidade | Local | Dev | Prod |
|----------------|-------|-----|------|
| **Front-end** | ✅ | ✅ | ✅ |
| **Autenticação** | ❌ (Demo) | ✅ (Real) | ✅ (Real) |
| **Pagamentos** | ❌ (Demo) | ✅ (Teste) | ✅ (Real) |
| **Emails** | ❌ (Demo) | ✅ (Real) | ✅ (Real) |
| **Banco de Dados** | ❌ (Mock) | ✅ (Real) | ✅ (Real) |
| **Usuários** | ❌ (Demo) | ✅ (Teste) | ✅ (Real) |
| **URL** | localhost:3000 | portal-dev.vercel.app | portal.imagineinstituto.com |

## 🔧 Configuração do Vercel

### **Projeto Existente (Prod):**
- **Branch:** `main`
- **URL:** `https://portal.imagineinstituto.com`
- **Deploy:** Automático

### **Novo Projeto (Dev):**
- **Branch:** `dev`
- **URL:** `https://portal-dev.vercel.app`
- **Deploy:** Automático

## 📝 Checklist de Configuração

### **Para Local:**
- [ ] Copiar `env.local.example` para `.env.local`
- [ ] Instalar dependências: `npm install`
- [ ] Iniciar servidor: `npm run dev`

### **Para Dev:**
- [ ] Criar branch `dev`
- [ ] Configurar variáveis de ambiente
- [ ] Criar novo projeto no Vercel
- [ ] Configurar deploy automático

### **Para Prod:**
- [ ] Verificar variáveis de ambiente
- [ ] Testar em ambiente dev primeiro
- [ ] Fazer merge para `main`
- [ ] Verificar deploy automático

## 🚨 Considerações Importantes

### **Segurança:**
- **Nunca** commitar arquivos `.env.local`
- **Sempre** usar variáveis de ambiente no Vercel
- **Separar** credenciais de teste e produção

### **Deploy:**
- **Sempre** testar em dev antes de prod
- **Verificar** variáveis de ambiente
- **Monitorar** logs de deploy

### **Desenvolvimento:**
- **Local** para prototipação
- **Dev** para testes de integração
- **Prod** para ambiente final

---

**🎯 Com esta configuração, você tem um fluxo completo de desenvolvimento com 3 ambientes separados e bem definidos!**
