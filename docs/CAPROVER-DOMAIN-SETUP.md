# 🌐 Configuração do Domínio Raiz do CapRover

## 📋 **Configuração Inicial Obrigatória**

### **⚠️ IMPORTANTE: Esta é a PRIMEIRA configuração que deve ser feita!**

Antes de fazer qualquer deploy, você precisa configurar o domínio raiz do CapRover.

## 🎯 **Passo 1: Configurar DNS do Domínio Raiz**

### **1.1 Escolher Domínio Raiz**

Exemplos de domínios raiz válidos:
- `captain.meudominio.com`
- `caprover.empresa.com.br`
- `portal.imagineinstituto.com` (se for o domínio principal)
- `admin.imagineinstituto.com`

### **1.2 Configurar DNS no Provedor**

#### **No painel do seu provedor de domínio (GoDaddy, Namecheap, etc.):**

1. **Acessar configurações DNS**
2. **Adicionar entrada A coringa:**
   ```
   Tipo: A
   Nome: *.caprover-root
   IP: [IP_DO_SEU_SERVIDOR_CAPROVER]
   TTL: 3600 (ou padrão)
   ```

#### **Exemplo prático:**
Se seu domínio raiz for `captain.imagineinstituto.com`:
```
Tipo: A
Nome: *.captain.imagineinstituto.com
IP: 110.120.130.140 (IP do seu servidor CapRover)
```

### **1.3 Verificar Configuração DNS**

```bash
# Verificar se o DNS está funcionando
nslookup captain.imagineinstituto.com
nslookup app1.captain.imagineinstituto.com
nslookup app2.captain.imagineinstituto.com
```

## 🏗️ **Passo 2: Configurar CapRover**

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

### **2.3 Verificar Configuração**

Após configurar, você deve ver:
- ✅ **Root Domain:** captain.imagineinstituto.com
- ✅ **Status:** Active
- ✅ **SSL:** Enabled (se configurado)

## 🔧 **Passo 3: Configurar SSL (Opcional mas Recomendado)**

### **3.1 SSL Automático**

1. **Vá para "Captain Settings"**
2. **Na seção "SSL":**
   ```
   Enable SSL: ✅
   Force HTTPS: ✅
   ```
3. **Clique em "Update"**

### **3.2 Verificar SSL**

```bash
# Verificar certificado SSL
curl -I https://captain.imagineinstituto.com
```

## 🚀 **Passo 4: Testar Configuração**

### **4.1 Criar App de Teste**

1. **Vá para "Apps"**
2. **Clique em "Create New App"**
3. **Nome:** `test-app`
4. **Clique em "Create App"**

### **4.2 Configurar Domínio do App**

1. **Vá para "HTTP Settings"**
2. **Custom Domain:** `test-app.captain.imagineinstituto.com`
3. **Enable HTTPS:** ✅
4. **Clique em "Save"**

### **4.3 Deploy App de Teste**

1. **Vá para "Deployment"**
2. **Dockerfile Path:** `./Dockerfile`
3. **Build Context:** `.`
4. **Port:** `3000`
5. **Clique em "Deploy"**

### **4.4 Verificar Funcionamento**

```bash
# Testar acesso
curl https://test-app.captain.imagineinstituto.com

# Verificar logs
caprover logs -a test-app
```

## 📊 **Estrutura de Domínios Resultante**

Após a configuração, você terá:

```
captain.imagineinstituto.com          # Painel do CapRover
├── portal-imagine.captain.imagineinstituto.com    # Portal Imagine
├── admin.captain.imagineinstituto.com             # App Admin
├── api.captain.imagineinstituto.com               # API
└── test-app.captain.imagineinstituto.com          # App de teste
```

## 🛠️ **Troubleshooting**

### **Problema 1: DNS não resolve**

```bash
# Verificar DNS
dig captain.imagineinstituto.com
nslookup captain.imagineinstituto.com

# Aguardar propagação (até 48h)
```

### **Problema 2: SSL não funciona**

```bash
# Verificar certificado
openssl s_client -connect captain.imagineinstituto.com:443

# Verificar logs do CapRover
caprover logs -a captain
```

### **Problema 3: App não acessível**

```bash
# Verificar status
caprover app -a test-app

# Verificar logs
caprover logs -a test-app --follow

# Verificar configuração
caprover app -a test-app --info
```

## 🔍 **Verificações Finais**

### **Checklist de Configuração:**

- [ ] **DNS configurado** com entrada A coringa
- [ ] **Domínio raiz** configurado no CapRover
- [ ] **SSL habilitado** (opcional)
- [ ] **App de teste** funcionando
- [ ] **Logs** sem erros
- [ ] **Acesso HTTPS** funcionando

### **Comandos de Verificação:**

```bash
# Verificar DNS
nslookup captain.imagineinstituto.com

# Verificar SSL
curl -I https://captain.imagineinstituto.com

# Verificar app
curl https://test-app.captain.imagineinstituto.com

# Verificar logs
caprover logs -a test-app
```

## 🎯 **Próximos Passos**

Após configurar o domínio raiz:

1. ✅ **Configurar domínio raiz** (este guia)
2. 🔄 **Deploy do Portal Imagine** (próximo passo)
3. 🔄 **Configurar variáveis de ambiente**
4. 🔄 **Testar funcionalidades**
5. 🔄 **Configurar monitoramento**

## 📚 **Documentação Adicional**

- **CapRover Docs:** https://caprover.com/docs/
- **DNS Configuration:** https://caprover.com/docs/get-started.html
- **SSL Setup:** https://caprover.com/docs/ssl.html

## 🎉 **Resultado**

Após seguir este guia, você terá:

- ✅ **CapRover funcionando** com domínio próprio
- ✅ **SSL configurado** (se habilitado)
- ✅ **Apps acessíveis** via subdomínios
- ✅ **Base sólida** para deploy do Portal Imagine

**🚀 Agora você pode prosseguir com o deploy do Portal Imagine!**
