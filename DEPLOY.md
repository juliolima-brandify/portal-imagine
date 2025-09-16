# 🚀 Deploy no CapRover - Portal Imagine

## 📋 Arquivos Criados/Configurados

- ✅ `Dockerfile` - Container otimizado para Next.js
- ✅ `captain-definition` - Configuração do CapRover
- ✅ `next.config.js` - Configurado para standalone e produção
- ✅ `env.example` - Variáveis de ambiente atualizadas
- ✅ `.dockerignore` - Otimização do build

## 🔧 Configuração no CapRover

### 1. Criar Nova App
1. Acesse o painel do CapRover
2. Clique em "Create New App"
3. Nome: `portal-imagine`
4. Clique em "Create New App"

### 2. Configurar Domínio
1. Na aba "HTTP Settings"
2. Adicionar domínio: `portal.imagineinstituto.com`
3. Habilitar HTTPS (Let's Encrypt)

### 3. Configurar Variáveis de Ambiente
Na aba "App Configs" → "Environment Variables":

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_do_stripe
NEXTAUTH_URL=https://portal.imagineinstituto.com
NEXTAUTH_SECRET=seu_secret_aleatorio
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com
```

### 4. Deploy

#### Opção A - Deploy via Git
1. Faça push do código para um repositório Git
2. No CapRover, vá em "Deployment"
3. Cole a URL do repositório
4. Clique em "Deploy"

#### Opção B - Deploy via CLI
```bash
# Instalar CapRover CLI
npm install -g caprover

# Login no CapRover
caprover login

# Deploy
caprover deploy
```

## 🔗 Integração com Site Principal

### No Site Framer (imagineinstituto.com)
Configurar o botão "Login" para redirecionar para:
```
https://portal.imagineinstituto.com/auth
```

### No Portal (portal.imagineinstituto.com)
Configurar logout para redirecionar para:
```
https://imagineinstituto.com
```

## 📊 Monitoramento

Após o deploy, monitore:
- Logs da aplicação no CapRover
- Performance no dashboard
- Certificados SSL
- Uso de recursos

## 🛠️ Comandos Úteis

```bash
# Build local para teste
npm run build
npm run start

# Verificar se está funcionando
curl https://portal.imagineinstituto.com

# Logs do CapRover
caprover logs -a portal-imagine
```

## ✅ Checklist de Deploy

- [ ] Repositório Git configurado
- [ ] App criada no CapRover
- [ ] Domínio configurado
- [ ] Variáveis de ambiente definidas
- [ ] HTTPS habilitado
- [ ] Deploy realizado
- [ ] Teste de funcionamento
- [ ] Integração com site principal
