# 🚀 Comandos Úteis do CapRover

## 📋 **Comandos Básicos**

### **1. 🔧 Configuração Inicial**

```bash
# Instalar CapRover CLI
npm install -g caprover

# Login no CapRover
caprover login

# Verificar status
caprover version
```

### **2. 📱 Gerenciamento de Aplicações**

```bash
# Listar aplicações
caprover app

# Criar aplicação
caprover app -a portal-imagine --create

# Ver detalhes da aplicação
caprover app -a portal-imagine

# Deletar aplicação
caprover app -a portal-imagine --delete
```

### **3. 🔐 Variáveis de Ambiente**

```bash
# Listar variáveis de ambiente
caprover env -a portal-imagine

# Adicionar variável
caprover env -a portal-imagine --set NODE_ENV=production

# Remover variável
caprover env -a portal-imagine --unset NODE_ENV

# Adicionar múltiplas variáveis
caprover env -a portal-imagine --set NODE_ENV=production PORT=3000
```

### **4. 🚀 Deploy**

```bash
# Deploy via Git
caprover app -a portal-imagine --git-repo https://github.com/user/repo
caprover app -a portal-imagine --git-branch main

# Deploy via upload
caprover deploy -a portal-imagine -t portal-imagine.tar.gz

# Deploy manual
caprover deploy -a portal-imagine
```

### **5. 📊 Logs e Monitoramento**

```bash
# Ver logs da aplicação
caprover logs -a portal-imagine

# Ver logs em tempo real
caprover logs -a portal-imagine --follow

# Ver logs do build
caprover logs -a portal-imagine --build

# Ver logs de deploy
caprover logs -a portal-imagine --deploy
```

### **6. 🌐 Domínio e SSL**

```bash
# Adicionar domínio
caprover app -a portal-imagine --domain portal.imagineinstituto.com

# Remover domínio
caprover app -a portal-imagine --domain portal.imagineinstituto.com --remove

# Verificar SSL
caprover app -a portal-imagine --ssl
```

### **7. 🔄 Escalabilidade**

```bash
# Ver instâncias
caprover app -a portal-imagine --instances

# Escalar aplicação
caprover app -a portal-imagine --instances 3

# Ver métricas
caprover app -a portal-imagine --metrics
```

### **8. 🛠️ Manutenção**

```bash
# Reiniciar aplicação
caprover app -a portal-imagine --restart

# Parar aplicação
caprover app -a portal-imagine --stop

# Iniciar aplicação
caprover app -a portal-imagine --start

# Ver status
caprover app -a portal-imagine --status
```

### **9. 📁 Backup e Restore**

```bash
# Fazer backup
caprover backup -a portal-imagine

# Listar backups
caprover backup -a portal-imagine --list

# Restaurar backup
caprover backup -a portal-imagine --restore backup-id
```

### **10. 🔍 Debugging**

```bash
# Ver informações detalhadas
caprover app -a portal-imagine --info

# Ver configuração
caprover app -a portal-imagine --config

# Ver histórico de deploys
caprover app -a portal-imagine --history

# Ver eventos
caprover app -a portal-imagine --events
```

## 🎯 **Comandos Específicos para Portal Imagine**

### **Configuração Completa**

```bash
# 1. Criar aplicação
caprover app -a portal-imagine --create

# 2. Configurar domínio
caprover app -a portal-imagine --domain portal.imagineinstituto.com

# 3. Configurar variáveis de ambiente
caprover env -a portal-imagine --set NODE_ENV=production
caprover env -a portal-imagine --set PORT=3000
caprover env -a portal-imagine --set NEXT_PUBLIC_INSTITUTE_NAME="Instituto Imagine"
caprover env -a portal-imagine --set NEXT_PUBLIC_INSTITUTE_URL="https://imagineinstituto.com"

# 4. Configurar Supabase
caprover env -a portal-imagine --set NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
caprover env -a portal-imagine --set NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
caprover env -a portal-imagine --set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# 5. Configurar Stripe
caprover env -a portal-imagine --set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
caprover env -a portal-imagine --set STRIPE_SECRET_KEY="sk_live_..."
caprover env -a portal-imagine --set STRIPE_WEBHOOK_SECRET="whsec_..."

# 6. Configurar NextAuth
caprover env -a portal-imagine --set NEXTAUTH_URL="https://portal.imagineinstituto.com"
caprover env -a portal-imagine --set NEXTAUTH_SECRET="your_secret_key"

# 7. Deploy via Git
caprover app -a portal-imagine --git-repo https://github.com/seu-usuario/portal-imagine
caprover app -a portal-imagine --git-branch main

# 8. Verificar status
caprover app -a portal-imagine --status
```

### **Verificações Pós-Deploy**

```bash
# Ver logs
caprover logs -a portal-imagine --follow

# Testar health check
curl https://portal.imagineinstituto.com/api/health

# Ver métricas
caprover app -a portal-imagine --metrics

# Ver instâncias
caprover app -a portal-imagine --instances
```

### **Manutenção Diária**

```bash
# Ver status geral
caprover app -a portal-imagine

# Ver logs recentes
caprover logs -a portal-imagine

# Ver métricas de performance
caprover app -a portal-imagine --metrics

# Verificar SSL
caprover app -a portal-imagine --ssl
```

## 🚨 **Comandos de Emergência**

### **Problemas Críticos**

```bash
# Aplicação não responde
caprover app -a portal-imagine --restart

# Aplicação com erro
caprover logs -a portal-imagine --follow

# Rollback para versão anterior
caprover app -a portal-imagine --rollback

# Parar aplicação
caprover app -a portal-imagine --stop

# Iniciar aplicação
caprover app -a portal-imagine --start
```

### **Debugging Avançado**

```bash
# Ver informações completas
caprover app -a portal-imagine --info

# Ver configuração
caprover app -a portal-imagine --config

# Ver eventos
caprover app -a portal-imagine --events

# Ver histórico
caprover app -a portal-imagine --history
```

## 📚 **Dicas Úteis**

### **1. Aliases Úteis**
```bash
# Adicionar ao .bashrc ou .zshrc
alias cap='caprover'
alias cap-logs='caprover logs -a portal-imagine --follow'
alias cap-status='caprover app -a portal-imagine --status'
alias cap-restart='caprover app -a portal-imagine --restart'
```

### **2. Scripts de Automação**
```bash
# Script para deploy
#!/bin/bash
caprover app -a portal-imagine --git-repo https://github.com/user/repo
caprover app -a portal-imagine --git-branch main
caprover logs -a portal-imagine --follow
```

### **3. Monitoramento**
```bash
# Verificar status a cada 5 minutos
watch -n 300 'caprover app -a portal-imagine --status'

# Ver logs em tempo real
caprover logs -a portal-imagine --follow | grep ERROR
```

## 🎉 **Resultado**

Com esses comandos, você terá controle total sobre sua aplicação no CapRover:

- ✅ **Deploy automático**
- ✅ **Monitoramento em tempo real**
- ✅ **Escalabilidade**
- ✅ **Backup e restore**
- ✅ **Debugging avançado**
- ✅ **Manutenção simplificada**

**🚀 Seu portal estará sempre funcionando perfeitamente!**

