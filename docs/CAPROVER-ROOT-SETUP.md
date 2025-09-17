# 🚀 Configuração do Root no CapRover - Portal Imagine

## 📋 **Passo a Passo Completo**

### **1. 🏗️ Configuração Inicial no CapRover**

#### **1.1 Acessar o Painel do CapRover**
```
URL: https://captain.your-domain.com
Login: admin
Senha: [sua senha do CapRover]
```

#### **1.2 Criar Nova Aplicação**
1. **Clique em "Apps"** no menu lateral
2. **Clique em "Create New App"**
3. **Preencha os dados:**
   ```
   App Name: portal-imagine
   Has Persistent Data: ❌ (não marcado)
   ```
4. **Clique em "Create App"**

### **2. 🔧 Configuração da Aplicação**

#### **2.1 Configurar Build Settings**
1. **Vá para "Deployment"** na aplicação criada
2. **Configure:**
   ```
   Dockerfile Path: ./Dockerfile
   Build Context: .
   Port: 3000
   ```

#### **2.2 Configurar Domínio**
1. **Vá para "HTTP Settings"**
2. **Configure:**
   ```
   Custom Domain: portal.imagineinstituto.com
   Enable HTTPS: ✅
   Force HTTPS: ✅
   ```

### **3. 🔐 Configurar Variáveis de Ambiente**

#### **3.1 Acessar App Configs**
1. **Vá para "App Configs"** na aplicação
2. **Clique em "Add New Config"**

#### **3.2 Adicionar Variáveis Básicas**
```bash
# Configurações do Sistema
NODE_ENV = production
PORT = 3000

# Configurações do Instituto
NEXT_PUBLIC_INSTITUTE_NAME = Instituto Imagine
NEXT_PUBLIC_INSTITUTE_URL = https://imagineinstituto.com
```

#### **3.3 Adicionar Variáveis do Supabase**
```bash
# Supabase (substitua pelos seus valores)
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
```

#### **3.4 Adicionar Variáveis do Stripe**
```bash
# Stripe (substitua pelos seus valores)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_your_key_here
STRIPE_SECRET_KEY = sk_live_your_key_here
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret_here
```

#### **3.5 Adicionar Variáveis do NextAuth**
```bash
# NextAuth
NEXTAUTH_URL = https://portal.imagineinstituto.com
NEXTAUTH_SECRET = your_secret_key_here
```

### **4. 🚀 Deploy da Aplicação**

#### **4.1 Opção 1: Deploy via Git (Recomendado)**

1. **Vá para "Deployment"**
2. **Configure Git:**
   ```
   Repository: https://github.com/seu-usuario/portal-imagine
   Branch: main
   Build Context: .
   ```
3. **Clique em "Connect Repository"**
4. **Clique em "Deploy"**

#### **4.2 Opção 2: Deploy via Upload**

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

### **5. 🔍 Verificações Pós-Deploy**

#### **5.1 Verificar Status da Aplicação**
1. **Vá para "App Details"**
2. **Verifique se está "Running"**
3. **Verifique os logs se necessário**

#### **5.2 Testar Health Check**
```bash
curl https://portal.imagineinstituto.com/api/health
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

#### **5.3 Testar Funcionalidades**
- [ ] **Página inicial** carrega
- [ ] **Login/Logout** funciona
- [ ] **Dashboard** acessível
- [ ] **Projetos** listando
- [ ] **Doações** processando
- [ ] **Upload de imagens** funcionando
- [ ] **Pagamentos** integrados

### **6. 🛠️ Troubleshooting**

#### **6.1 Problemas Comuns**

**Build Falha:**
```bash
# Verificar logs
caprover logs -a portal-imagine

# Verificar variáveis de ambiente
caprover env -a portal-imagine
```

**App Não Inicia:**
```bash
# Verificar logs
caprover logs -a portal-imagine --follow

# Verificar configuração
caprover app -a portal-imagine
```

**Erro de CORS:**
- Verificar `NEXTAUTH_URL`
- Verificar configuração do Supabase
- Verificar headers de segurança

#### **6.2 Logs Úteis**
```bash
# Logs da aplicação
caprover logs -a portal-imagine

# Logs do build
caprover logs -a portal-imagine --follow

# Status da aplicação
caprover app -a portal-imagine
```

### **7. 📊 Monitoramento**

#### **7.1 Métricas Importantes**
- **CPU Usage** < 80%
- **Memory Usage** < 80%
- **Response Time** < 2s
- **Uptime** > 99%

#### **7.2 Alertas Configurados**
- App down
- High CPU/Memory
- Build failures
- SSL certificate expiry

### **8. 🔄 Atualizações**

#### **8.1 Deploy de Atualizações**
```bash
# 1. Fazer push para repositório
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 2. Deploy automático via CapRover
# 3. Verificar funcionamento
```

#### **8.2 Rollback**
```bash
# No painel CapRover
# Deploy > Previous Deployments
# Selecionar versão anterior
```

### **9. 🎯 URLs de Produção**

- **Portal**: `https://portal.imagineinstituto.com`
- **Dashboard**: `https://portal.imagineinstituto.com/dashboard`
- **Admin**: `https://portal.imagineinstituto.com/admin/usuarios`
- **API Health**: `https://portal.imagineinstituto.com/api/health`

### **10. 🔐 Segurança**

#### **10.1 Headers de Segurança**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ HTTPS Forçado

#### **10.2 Configurações de Produção**
- ✅ Usuário não-root no container
- ✅ Variáveis de ambiente seguras
- ✅ SSL/TLS automático
- ✅ Firewall configurado

## 🎉 **Resultado Final**

Após a configuração, você terá:
- ✅ **Portal funcionando** em produção
- ✅ **Deploy automático** via Git
- ✅ **SSL/HTTPS** configurado
- ✅ **Monitoramento** ativo
- ✅ **Backup automático**
- ✅ **Escalabilidade** horizontal

## 📞 **Suporte**

Em caso de problemas:
1. Verificar logs do CapRover
2. Verificar configurações de ambiente
3. Testar localmente
4. Consultar documentação do CapRover

**🚀 Seu portal estará online e funcionando perfeitamente!**

