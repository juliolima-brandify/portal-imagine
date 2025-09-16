# 🚀 Configuração Completa do CapRover - Portal Imagine

## 📋 **Ordem de Configuração (OBRIGATÓRIA)**

### **⚠️ IMPORTANTE: Siga esta ordem exata!**

1. ✅ **Configurar Domínio Raiz** (PRIMEIRO)
2. ✅ **Configurar CapRover**
3. ✅ **Deploy do Portal Imagine**
4. ✅ **Configurar Variáveis de Ambiente**
5. ✅ **Testar Funcionalidades**

---

## 🌐 **PASSO 1: Configurar Domínio Raiz (OBRIGATÓRIO)**

### **1.1 Escolher Domínio Raiz**

Exemplos válidos:
- `captain.imagineinstituto.com`
- `caprover.empresa.com.br`
- `portal.imagineinstituto.com` (se for o domínio principal)

### **1.2 Configurar DNS no Provedor**

#### **No painel do seu provedor de domínio:**

1. **Acessar configurações DNS**
2. **Adicionar entrada A coringa:**
   ```
   Tipo: A
   Nome: *.captain.imagineinstituto.com
   IP: [IP_DO_SEU_SERVIDOR_CAPROVER]
   TTL: 3600
   ```

#### **Exemplo prático:**
```
Tipo: A
Nome: *.captain.imagineinstituto.com
IP: 110.120.130.140
TTL: 3600
```

### **1.3 Verificar Configuração DNS**

```bash
# Verificar se o DNS está funcionando
nslookup captain.imagineinstituto.com
nslookup test-app.captain.imagineinstituto.com
```

**⏰ Aguardar propagação DNS (até 48h)**

---

## 🏗️ **PASSO 2: Configurar CapRover**

### **2.1 Acessar CapRover**

1. **Acessar:** `https://captain.imagineinstituto.com:3000`
2. **Login:** admin
3. **Senha:** [sua senha do CapRover]

### **2.2 Configurar Domínio Raiz**

1. **Vá para "Captain Settings"**
2. **Na seção "Root Domain":**
   ```
   Root Domain: captain.imagineinstituto.com
   ```
3. **Clique em "Update"**

### **2.3 Configurar SSL (Recomendado)**

1. **Vá para "Captain Settings"**
2. **Na seção "SSL":**
   ```
   Enable SSL: ✅
   Force HTTPS: ✅
   ```
3. **Clique em "Update"**

---

## 🚀 **PASSO 3: Deploy do Portal Imagine**

### **3.1 Criar Aplicação**

1. **Vá para "Apps"**
2. **Clique em "Create New App"**
3. **Nome:** `portal-imagine`
4. **Clique em "Create App"**

### **3.2 Configurar Build Settings**

1. **Vá para "Deployment"**
2. **Configure:**
   ```
   Dockerfile Path: ./Dockerfile
   Build Context: .
   Port: 3000
   ```

### **3.3 Configurar Domínio do App**

1. **Vá para "HTTP Settings"**
2. **Configure:**
   ```
   Custom Domain: portal-imagine.captain.imagineinstituto.com
   Enable HTTPS: ✅
   Force HTTPS: ✅
   ```

### **3.4 Deploy**

#### **Opção 1: Deploy via Git (Recomendado)**

1. **Vá para "Deployment"**
2. **Configure Git:**
   ```
   Repository: https://github.com/seu-usuario/portal-imagine
   Branch: main
   Build Context: .
   ```
3. **Clique em "Connect Repository"**
4. **Clique em "Deploy"**

#### **Opção 2: Deploy via Upload**

1. **Fazer build local:**
   ```bash
   npm run build
   ```

2. **Criar arquivo de deploy:**
   ```bash
   tar -czf portal-imagine.tar.gz .
   ```

3. **Upload no CapRover:**
   - Vá para "Deployment"
   - Clique em "Upload"
   - Selecione o arquivo `portal-imagine.tar.gz`
   - Clique em "Deploy"

---

## 🔐 **PASSO 4: Configurar Variáveis de Ambiente**

### **4.1 Acessar App Configs**

1. **Vá para "App Configs"** na aplicação `portal-imagine`
2. **Clique em "Add New Config"**

### **4.2 Adicionar Variáveis Básicas**

```bash
# Configurações do Sistema
NODE_ENV = production
PORT = 3000

# Configurações do Instituto
NEXT_PUBLIC_INSTITUTE_NAME = Instituto Imagine
NEXT_PUBLIC_INSTITUTE_URL = https://imagineinstituto.com
```

### **4.3 Adicionar Variáveis do Supabase**

```bash
# Supabase (substitua pelos seus valores)
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
```

### **4.4 Adicionar Variáveis do Stripe**

```bash
# Stripe (substitua pelos seus valores)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_your_key_here
STRIPE_SECRET_KEY = sk_live_your_key_here
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret_here
```

### **4.5 Adicionar Variáveis do NextAuth**

```bash
# NextAuth
NEXTAUTH_URL = https://portal-imagine.captain.imagineinstituto.com
NEXTAUTH_SECRET = your_secret_key_here
```

---

## 🔍 **PASSO 5: Verificações Pós-Deploy**

### **5.1 Verificar Status da Aplicação**

1. **Vá para "App Details"**
2. **Verifique se está "Running"**
3. **Verifique os logs se necessário**

### **5.2 Testar Health Check**

```bash
curl https://portal-imagine.captain.imagineinstituto.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "stripe": "connected"
  }
}
```

### **5.3 Testar Funcionalidades**

- [ ] **Página inicial** carrega
- [ ] **Login/Logout** funciona
- [ ] **Dashboard** acessível
- [ ] **Projetos** listando
- [ ] **Doações** processando
- [ ] **Upload de imagens** funcionando
- [ ] **Pagamentos** integrados

---

## 🛠️ **Troubleshooting**

### **Problema 1: DNS não resolve**

```bash
# Verificar DNS
dig captain.imagineinstituto.com
nslookup captain.imagineinstituto.com

# Aguardar propagação (até 48h)
```

### **Problema 2: Build falha**

```bash
# Verificar logs
caprover logs -a portal-imagine

# Verificar variáveis de ambiente
caprover env -a portal-imagine
```

### **Problema 3: App não inicia**

```bash
# Verificar logs
caprover logs -a portal-imagine --follow

# Verificar configuração
caprover app -a portal-imagine
```

### **Problema 4: SSL não funciona**

```bash
# Verificar certificado
openssl s_client -connect portal-imagine.captain.imagineinstituto.com:443

# Verificar logs do CapRover
caprover logs -a captain
```

---

## 📊 **Estrutura Final**

Após a configuração completa:

```
captain.imagineinstituto.com                    # Painel do CapRover
├── portal-imagine.captain.imagineinstituto.com # Portal Imagine
├── admin.captain.imagineinstituto.com          # App Admin (futuro)
├── api.captain.imagineinstituto.com            # API (futuro)
└── test-app.captain.imagineinstituto.com       # App de teste
```

---

## 🎯 **URLs de Produção**

- **Portal**: `https://portal-imagine.captain.imagineinstituto.com`
- **Dashboard**: `https://portal-imagine.captain.imagineinstituto.com/dashboard`
- **Admin**: `https://portal-imagine.captain.imagineinstituto.com/admin/usuarios`
- **API Health**: `https://portal-imagine.captain.imagineinstituto.com/api/health`

---

## 🔄 **Comandos Úteis**

```bash
# Instalar CapRover CLI
npm install -g caprover

# Login
caprover login

# Ver status
caprover app -a portal-imagine --status

# Ver logs
caprover logs -a portal-imagine --follow

# Reiniciar
caprover app -a portal-imagine --restart

# Ver variáveis de ambiente
caprover env -a portal-imagine
```

---

## 🎉 **Resultado Final**

Após seguir todos os passos:

- ✅ **CapRover funcionando** com domínio próprio
- ✅ **Portal Imagine** deployado e funcionando
- ✅ **SSL/HTTPS** configurado
- ✅ **Variáveis de ambiente** configuradas
- ✅ **Monitoramento** ativo
- ✅ **Deploy automático** via Git

---

## 📚 **Documentação Adicional**

- **`CAPROVER-DOMAIN-SETUP.md`** - Configuração de domínio raiz
- **`CAPROVER-ROOT-SETUP.md`** - Configuração completa
- **`caprover-commands.md`** - Comandos úteis
- **`deploy-caprover.md`** - Guia de deploy

**🚀 Seu portal estará online e funcionando perfeitamente!**

