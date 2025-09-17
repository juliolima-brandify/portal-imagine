# 🚀 Deploy no CapRover - Guia Completo

## 📋 Pré-requisitos

1. **CapRover instalado** no seu VPS
2. **Domínio configurado** apontando para o VPS
3. **Certificado SSL** configurado no CapRover

## 🔧 Configuração do Projeto

### 1. **Configurar Variáveis de Ambiente**

No painel do CapRover, vá em **App Configs** e adicione:

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
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key

# Instituto
NEXT_PUBLIC_INSTITUTE_NAME="Instituto Imagine"
NEXT_PUBLIC_INSTITUTE_URL="https://imagineinstituto.com"
```

### 2. **Configurar Build Settings**

- **Dockerfile Path**: `./Dockerfile`
- **Build Context**: `.`
- **Port**: `3000`

### 3. **Configurar Domínio**

- **Custom Domain**: `portal.imagineinstituto.com`
- **Enable HTTPS**: ✅
- **Force HTTPS**: ✅

## 🚀 Deploy

### Opção 1: Deploy via Git (Recomendado)

1. **Conectar repositório Git** no CapRover
2. **Configurar branch**: `main`
3. **Deploy automático** a cada push

### Opção 2: Deploy via Upload

1. **Fazer build local**:
   ```bash
   npm run build
   ```

2. **Criar arquivo tar**:
   ```bash
   tar -czf portal-imagine.tar.gz .
   ```

3. **Upload no CapRover** via interface web

## 🔍 Verificações Pós-Deploy

### 1. **Testar Funcionalidades**
- [ ] Login/Logout
- [ ] Dashboard
- [ ] Projetos
- [ ] Doações
- [ ] Upload de imagens
- [ ] Pagamentos Stripe

### 2. **Verificar Performance**
- [ ] Tempo de carregamento
- [ ] Responsividade
- [ ] Animações
- [ ] Breadcrumbs

### 3. **Testar Modo Demo**
- [ ] Admin: `?demo_email=admin@institutoimagine.org`
- [ ] Doador: `?demo_email=demo@doador.com`

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Build falha**:
   - Verificar variáveis de ambiente
   - Verificar Dockerfile
   - Verificar logs do build

2. **App não inicia**:
   - Verificar portas
   - Verificar variáveis de ambiente
   - Verificar logs da aplicação

3. **Erro de CORS**:
   - Verificar configuração do Supabase
   - Verificar headers de segurança

### Logs Úteis

```bash
# Ver logs da aplicação
caprover logs -a portal-imagine

# Ver logs do build
caprover logs -a portal-imagine --follow
```

## 📊 Monitoramento

### 1. **Health Check**
- URL: `https://portal.imagineinstituto.com/api/health`
- Status: `200 OK`

### 2. **Métricas**
- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

## 🔄 Atualizações

### Deploy de Atualizações

1. **Push para repositório**:
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

2. **Deploy automático** via CapRover

3. **Verificar** funcionamento

## 🎯 URLs de Produção

- **Portal**: `https://portal.imagineinstituto.com`
- **Dashboard**: `https://portal.imagineinstituto.com/dashboard`
- **Admin**: `https://portal.imagineinstituto.com/admin/usuarios`
- **API Health**: `https://portal.imagineinstituto.com/api/health`

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do CapRover
2. Verificar configurações de ambiente
3. Testar localmente
4. Consultar documentação do CapRover
