# 🎯 Portal Instituto Imagine

Sistema moderno e profissional para ONGs, focado em conectar doadores com projetos que precisam de apoio.

## 🚀 Status do Projeto

**✅ 100% FUNCIONAL E EM PRODUÇÃO**

- ✅ Sistema de doações com Stripe (PIX, cartão, boleto)
- ✅ Autenticação completa via Supabase
- ✅ Dashboard personalizado por role
- ✅ Design minimalista e responsivo
- ✅ Acessibilidade WCAG AA
- ✅ Deploy ativo no Vercel
- ✅ 3 ambientes separados (Local, Dev, Prod)

## 🛠️ Stack Tecnológica

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Supabase** - Backend-as-a-Service
- **Stripe** - Processamento de pagamentos
- **Resend** - Envio de emails
- **Vercel** - Deploy e hospedagem

## 🌍 Ambientes

| Ambiente | Propósito | URL | Status |
|----------|-----------|-----|--------|
| **Local** | Prototipação | `http://localhost:3000` | ✅ Funcionando |
| **Dev** | Testes de integração | `https://portal-dev.vercel.app` | ✅ Funcionando |
| **Prod** | Ambiente final | `https://portal.imagineinstituto.com` | ✅ Funcionando |

## 📁 Estrutura do Projeto

```
portal-imagine/
├── src/                    # Código fonte
│   ├── app/               # App Router (Next.js 14)
│   ├── components/        # Componentes reutilizáveis
│   ├── lib/              # Utilitários e configurações
│   └── hooks/            # Hooks customizados
├── docs/                 # Documentação organizada
│   ├── ambientes/        # Configuração de ambientes
│   ├── configuracao/     # Setup de serviços
│   ├── deploy/           # Instruções de deploy
│   └── scripts/          # Documentação de scripts
├── scripts/              # Scripts utilitários
├── public/               # Arquivos estáticos
└── package.json          # Dependências
```

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar ambiente local
```bash
# Copiar arquivo de exemplo
cp env.local.example .env.local

# Iniciar servidor
npm run dev
```

### 3. Configurar ambientes de produção
```bash
# Configurar ambiente dev
npm run setup:dev

# Deploy para produção
npm run deploy:prod
```

## 📚 Documentação

### **🌍 Ambientes**
- [Configuração de Ambientes](docs/ambientes/AMBIENTES.md)
- [Configurar Ambiente Dev](docs/ambientes/CONFIGURAR_DEV.md)

### **⚙️ Configuração**
- [Stripe Produção](docs/configuracao/STRIPE_PRODUCAO.md)
- [Configuração Completa do Stripe](docs/configuracao/CONFIGURACAO_STRIPE_COMPLETA.md)
- [Configuração do Supabase](docs/configuracao/CONFIGURACAO_SUPABASE.md)

### **🚀 Deploy**
- [Instruções de Deploy](docs/deploy/DEPLOY.md)

### **📜 Scripts**
- [Documentação de Scripts](docs/scripts/README.md)

## 🎯 Funcionalidades

### **Para Doadores**
- ✅ Doações com múltiplos métodos de pagamento
- ✅ Doações recorrentes e anônimas
- ✅ Histórico detalhado de doações
- ✅ Sistema de favoritos
- ✅ Notificações em tempo real

### **Para Administradores**
- ✅ Gestão completa de projetos
- ✅ Relatórios avançados com gráficos
- ✅ Exportação de dados (CSV, PDF, Excel)
- ✅ Gestão de usuários
- ✅ Dashboard com métricas

## 🧪 Teste

### **Modo Demo**
- **Admin**: `?demo_email=admin@institutoimagine.org`
- **Doador**: `?demo_email=demo@doador.com`

### **URLs de Teste**
- **Dashboard**: `/dashboard`
- **Projetos**: `/projetos`
- **Doações**: `/doacoes`
- **Embed**: `/embed/checkout/1`
- **Prototype**: `/prototype/demo`

## 🔧 Scripts Disponíveis

### **Desenvolvimento**
```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # Linter ESLint
```

### **Deploy**
```bash
npm run deploy:local     # Deploy local
npm run deploy:dev       # Deploy ambiente dev
npm run deploy:prod      # Deploy ambiente prod
```

### **Configuração**
```bash
npm run setup:dev        # Configurar ambiente dev
npm run configure:dev-db # Configurar banco dev
npm run generate:secrets # Gerar secrets NextAuth
```

### **Testes**
```bash
npm run test-supabase    # Testar conexão Supabase
```

## 🌐 Deploy

### **Ambientes Ativos**
- **Produção**: Vercel (ativo)
- **Desenvolvimento**: Vercel (ativo)
- **Local**: Desenvolvimento

### **Deploy Automático**
- **Push para `main`** → Deploy automático para produção
- **Push para `dev`** → Deploy automático para desenvolvimento

## 🔐 Segurança

### **Variáveis de Ambiente**
- ✅ Configuradas no Vercel Dashboard
- ✅ Separadas por ambiente
- ✅ Nunca commitadas no Git

### **Integrações**
- ✅ Stripe com webhooks configurados
- ✅ Supabase com RLS ativo
- ✅ Resend para emails seguros

## 📊 Monitoramento

### **Logs**
- **Vercel Dashboard** → Functions → Logs
- **Supabase Dashboard** → Logs
- **Stripe Dashboard** → Logs

### **Métricas**
- **Vercel Analytics** → Performance
- **Supabase Analytics** → Database
- **Stripe Analytics** → Pagamentos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes.

---

**🎯 Portal Instituto Imagine - Transformando vidas através da educação e solidariedade**

**🚀 Sistema 100% funcional com 3 ambientes separados, deploy automático e todas as integrações funcionando!**