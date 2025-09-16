# 🚀 Configuração do Root no CapRover

## 📋 **Configuração Básica do CapRover**

### **1. 🏗️ Configuração da Aplicação**

#### **No painel do CapRover:**

1. **Criar Nova Aplicação:**
   - Nome: `portal-imagine`
   - Porta: `3000`
   - Domínio: `portal.imagineinstituto.com` (ou seu domínio)

2. **Configurar Build Settings:**
   ```
   Dockerfile Path: ./Dockerfile
   Build Context: .
   Port: 3000
   ```

3. **Configurar Domínio:**
   ```
   Custom Domain: portal.imagineinstituto.com
   Enable HTTPS: ✅
   Force HTTPS: ✅
   ```

### **2. 🔧 Configuração de Variáveis de Ambiente**

#### **No painel CapRover > App Configs:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Next.js
NEXTAUTH_URL=https://portal.imagineinstituto.com
NEXTAUTH_SECRET=your_secret_key

# Instituto
NEXT_PUBLIC_INSTITUTE_NAME="Instituto Imagine"
NEXT_PUBLIC_INSTITUTE_URL="https://imagineinstituto.com"

# Node.js
NODE_ENV=production
PORT=3000
```

### **3. 🐳 Configuração do Dockerfile**

O Dockerfile já está configurado, mas vou explicar as partes importantes:

```dockerfile
# Multi-stage build para otimização
FROM node:18-alpine AS base
FROM base AS deps
FROM base AS builder
FROM base AS runner

# Configuração de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Porta e usuário
EXPOSE 3000
USER nextjs
```

### **4. 📁 Estrutura de Arquivos para Deploy**

```
portal-imagine/
├── Dockerfile                 # ✅ Criado
├── captain-definition         # ✅ Criado
├── .dockerignore             # ✅ Criado
├── next.config.js            # ✅ Configurado
├── package.json              # ✅ Scripts adicionados
├── src/                      # ✅ Código fonte
├── public/                   # ✅ Assets estáticos
└── deploy-caprover.md        # ✅ Guia completo
```

### **5. 🚀 Processo de Deploy**

#### **Opção 1: Deploy via Git (Recomendado)**

1. **Conectar Repositório:**
   ```
   Repository: https://github.com/seu-usuario/portal-imagine
   Branch: main
   Build Context: .
   ```

2. **Deploy Automático:**
   - Push para `main` = Deploy automático
   - Build time: ~3-5 minutos
   - Zero downtime

#### **Opção 2: Deploy via Upload**

1. **Fazer Build Local:**
   ```bash
   npm run build
   ```

2. **Criar Arquivo de Deploy:**
   ```bash
   tar -czf portal-imagine.tar.gz .
   ```

3. **Upload no CapRover:**
   - Interface web > Upload
   - Selecionar arquivo `.tar.gz`
   - Deploy automático

### **6. 🔍 Verificações Pós-Deploy**

#### **Health Check:**
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

#### **Testes Funcionais:**
- [ ] **Página inicial** carrega
- [ ] **Login/Logout** funciona
- [ ] **Dashboard** acessível
- [ ] **Projetos** listando
- [ ] **Doações** processando
- [ ] **Upload de imagens** funcionando
- [ ] **Pagamentos** integrados

### **7. 🛠️ Troubleshooting**

#### **Problemas Comuns:**

1. **Build Falha:**
   ```bash
   # Verificar logs
   caprover logs -a portal-imagine
   
   # Verificar variáveis de ambiente
   caprover env -a portal-imagine
   ```

2. **App Não Inicia:**
   ```bash
   # Verificar portas
   caprover logs -a portal-imagine --follow
   
   # Verificar configuração
   caprover app -a portal-imagine
   ```

3. **Erro de CORS:**
   - Verificar `NEXTAUTH_URL`
   - Verificar configuração do Supabase
   - Verificar headers de segurança

#### **Logs Úteis:**
```bash
# Logs da aplicação
caprover logs -a portal-imagine

# Logs do build
caprover logs -a portal-imagine --follow

# Status da aplicação
caprover app -a portal-imagine
```

### **8. 📊 Monitoramento**

#### **Métricas Importantes:**
- **CPU Usage** < 80%
- **Memory Usage** < 80%
- **Response Time** < 2s
- **Uptime** > 99%

#### **Alertas Configurados:**
- App down
- High CPU/Memory
- Build failures
- SSL certificate expiry

### **9. 🔄 Atualizações**

#### **Deploy de Atualizações:**
```bash
# 1. Fazer push para repositório
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 2. Deploy automático via CapRover
# 3. Verificar funcionamento
```

#### **Rollback:**
```bash
# No painel CapRover
# Deploy > Previous Deployments
# Selecionar versão anterior
```

### **10. 🎯 URLs de Produção**

- **Portal**: `https://portal.imagineinstituto.com`
- **Dashboard**: `https://portal.imagineinstituto.com/dashboard`
- **Admin**: `https://portal.imagineinstituto.com/admin/usuarios`
- **API Health**: `https://portal.imagineinstituto.com/api/health`

### **11. 🔐 Segurança**

#### **Headers de Segurança:**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ HTTPS Forçado

#### **Configurações de Produção:**
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

**🚀 Seu portal estará online e funcionando perfeitamente!**
