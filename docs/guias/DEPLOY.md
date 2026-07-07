# 🚀 Deploy no Vercel - Portal Imagine

> 🔴 **Antes de deployar, leia [docs/ESTADO_ATUAL.md](../ESTADO_ATUAL.md) (07/07/2026).** Duas pendências críticas: (1) a produção aponta para um banco Supabase **morto** — é preciso atualizar as env vars na Vercel para `zzxtethlsdjjfjjrqmlk` e redeployar; (2) a API `/api/admin/*` está **sem autenticação** e deve ser corrigida **antes** de religar o banco. Chave pública agora no formato `sb_publishable_...`.

## 📋 Configuração Atual

- ✅ **Vercel** - Deploy automático e hospedagem
- ✅ **3 Ambientes** - Local, Dev, Produção
- ✅ **Deploy Automático** - Push para main = deploy automático
- ✅ **HTTPS** - Certificados automáticos
- ✅ **CDN Global** - Performance otimizada

## 🔧 Configuração no Vercel

### 1. Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure o projeto automaticamente

### 2. Variáveis de Ambiente
No dashboard do Vercel, configure:

**Produção:**
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

**Desenvolvimento:**
```env
NODE_ENV=development
# ... mesmas variáveis com URLs de dev
```

### 3. Deploy Automático
- **Push para `main`** → Deploy automático para produção
- **Push para `dev`** → Deploy automático para desenvolvimento
- **Pull Requests** → Preview automático

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

### Vercel Dashboard
- **Analytics** → Performance e uso
- **Functions** → Logs das APIs
- **Deployments** → Histórico de deploys

### Integrações
- **Supabase** → Logs do banco
- **Stripe** → Logs de pagamentos
- **Resend** → Logs de emails

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build local para teste
npm run build
npm run start

# Deploy manual
npm run deploy:prod

# Verificar funcionamento
curl https://portal.imagineinstituto.com
```

## ✅ Checklist de Deploy

- [x] Repositório conectado ao Vercel
- [x] Variáveis de ambiente configuradas
- [x] Deploy automático ativo
- [x] Domínio personalizado configurado
- [x] HTTPS funcionando
- [x] Integração com site principal
- [x] Monitoramento ativo
