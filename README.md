# Portal Instituto Imagine

Sistema moderno e simplificado para ONGs, focado em conectar doadores com projetos que precisam de apoio.

## 🚀 Status do Projeto

**✅ 100% FUNCIONAL E EM PRODUÇÃO**

- ✅ Sistema de doações com Stripe (PIX, cartão, boleto)
- ✅ Autenticação completa via Supabase
- ✅ Dashboard personalizado por role
- ✅ Design minimalista e responsivo
- ✅ Acessibilidade WCAG AA
- ✅ Deploy ativo no Vercel

## 🛠️ Stack Tecnológica

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Supabase** - Backend-as-a-Service
- **Stripe** - Processamento de pagamentos
- **Instrument Sans** - Fonte principal

## 📁 Estrutura do Projeto

```
portal-imagine/
├── src/                    # Código fonte
│   ├── app/               # App Router (Next.js 14)
│   ├── components/        # Componentes reutilizáveis
│   ├── lib/              # Utilitários e configurações
│   └── hooks/            # Hooks customizados
├── docs/                 # Documentação completa
├── public/               # Arquivos estáticos
├── scripts/              # Scripts utilitários
└── package.json          # Dependências
```

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.local.example` para `.env.local` e configure:
- Supabase (URL e chave anônima)
- Stripe (chaves secret e publishable)
- Resend (para emails)

### 3. Executar em desenvolvimento
```bash
npm run dev
```

## 📚 Documentação

Toda a documentação detalhada está na pasta `docs/`:

- `docs/README.md` - Documentação completa
- `docs/CONFIGURACAO_STRIPE_COMPLETA.md` - Setup do Stripe
- `docs/CONFIGURACAO_SUPABASE.md` - Setup do Supabase
- `docs/FRAMER_SCRIPT_NOVO.md` - Integração com Framer
- `docs/DEPLOY.md` - Instruções de deploy

## 🎯 Funcionalidades

### Para Doadores
- ✅ Doações com múltiplos métodos de pagamento
- ✅ Doações recorrentes e anônimas
- ✅ Histórico detalhado de doações
- ✅ Sistema de favoritos
- ✅ Notificações em tempo real

### Para Administradores
- ✅ Gestão completa de projetos
- ✅ Relatórios avançados com gráficos
- ✅ Exportação de dados (CSV, PDF, Excel)
- ✅ Gestão de usuários
- ✅ Dashboard com métricas

## 🌐 Deploy

- **Produção**: Vercel (ativo)
- **URL**: `https://portal.imagineinstituto.com`
- **Deploy automático**: A cada push no GitHub

## 🧪 Teste

### Modo Demo
- **Admin**: `?demo_email=admin@institutoimagine.org`
- **Doador**: `?demo_email=demo@doador.com`

### URLs de Teste
- Dashboard: `/dashboard`
- Projetos: `/projetos`
- Doações: `/doacoes`
- Embed: `/embed/checkout/1`

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes.

---

**Portal Instituto Imagine - Transformando vidas através da educação e solidariedade** 🎯
