# Instituto Imagine - Portal Simplificado

Um sistema moderno e simplificado para ONGs, focado no essencial: conectar doadores com projetos que precisam de apoio.

## 🎯 **Sistema Simplificado**

Este é uma versão otimizada do sistema original do Instituto Imagine, removendo complexidade desnecessária e focando no que realmente importa para uma ONG. **Este portal é acessado através do subdomínio `portal.imagineinstituto.com` e é destinado apenas para usuários logados.**

### ✅ **O que foi mantido (ESSENCIAL):**
- ✅ **Sistema de doações com Stripe** - 100% funcional com Stripe Elements
- Gestão básica de projetos
- Autenticação simples (2 tipos de usuário)
- Dashboard personalizado por role
- Design responsivo e moderno

### ❌ **O que foi removido (DESNECESSÁRIO):**
- Portal corporativo complexo
- Sistema de eventos avançado
- Analytics customizado
- Múltiplas opções de deploy
- Sistema de notificações complexo

## 🚀 **Stack Tecnológica Otimizada**

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Supabase** - Backend-as-a-Service (autenticação e banco de dados)
- **Stripe** - Processamento de pagamentos
- **Zod** - Validação de schemas

## 📦 **Dependências**

- `@supabase/supabase-js` - Cliente Supabase
- `@supabase/ssr` - Suporte SSR para Supabase
- `@supabase/auth-ui-react` - Componentes de autenticação
- `stripe` - SDK do Stripe
- `zod` - Validação de schemas
- `dotenv` - Carregamento de variáveis de ambiente

## 🛠️ **Configuração Rápida**

### **1. Clone e instale:**
```bash
git clone <seu-repositorio>
cd portal-imagine
npm install
```

### **2. Configure o Supabase:**
1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute os scripts SQL:
   - `supabase-setup-safe.sql` - Cria tabelas e dados
   - `supabase-storage-setup-safe.sql` - Configura storage
3. Copie as credenciais (URL e chave anônima)

### **3. Configure o Stripe:**
1. Crie uma conta em [stripe.com](https://stripe.com)
2. Configure webhooks: `https://seu-dominio.com/api/webhooks/stripe`
3. Copie as chaves (secret e publishable)

### **4. Configure as variáveis de ambiente:**
Crie o arquivo `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

### **5. Execute o projeto:**
```bash
npm run dev
```

## 🎉 **Status Atual - FASE 3 COMPLETA + STRIPE 100% FUNCIONAL + DEPLOY ATIVO**

### ✅ **FASE 1 - Backend Integrado:**
- ✅ **Supabase** - Banco de dados configurado
- ✅ **Stripe** - Pagamentos 100% funcionais com Stripe Elements
- ✅ **Autenticação** - Sistema completo
- ✅ **Storage** - Upload de imagens

### ✅ **FASE 2 - Funcionalidades Avançadas:**
- ✅ **Sistema de Notificações** - Tempo real com Supabase Realtime
- ✅ **Sistema de Favoritos** - Projetos favoritos com contador
- ✅ **Histórico Detalhado** - Filtros avançados e análise
- ✅ **Relatórios Avançados** - Gráficos, métricas e insights
- ✅ **Exportação de Dados** - CSV, PDF e Excel

#### **Páginas Funcionais:**
- ✅ **Dashboard** - Personalizado por role (admin/doador)
- ✅ **Projetos** - Listagem com abas (Todos/Meus Projetos/Favoritos) e dados reais
- ✅ **Doações** - Histórico e gestão
- ✅ **Histórico** - Análise detalhada com filtros
- ✅ **Perfil** - Upload de avatar e dados pessoais
- ✅ **Comunidade** - Integração WhatsApp
- ✅ **Doação** - Fluxo completo multi-step
- ✅ **Admin** - Gestão completa + relatórios avançados

#### **Funcionalidades Avançadas:**
- ✅ **Notificações em tempo real** - Centro de notificações
- ✅ **Projetos apoiados** - Aba dedicada aos projetos que o usuário doou
- ✅ **Favoritos integrados** - Abas na página de projetos
- ✅ **Filtros avançados** - Por data, status, categoria
- ✅ **Relatórios consolidados** - Métricas, gráficos e análises em uma única página
- ✅ **Exportação de dados** - Múltiplos formatos (CSV, PDF, Excel)
- ✅ **Análise de doadores** - Segmentação e métodos de pagamento

## 📁 **Estrutura do Projeto**

```
portal-imagine/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── auth/              # Autenticação
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── projetos/          # Listagem de projetos
│   │   ├── doacoes/           # Histórico de doações
│   │   ├── perfil/            # Perfil do usuário
│   │   ├── comunidade/        # Comunidade WhatsApp
│   │   ├── doar/[id]/         # Página de doação
│   │   ├── doacao-sucesso/    # Confirmação de doação
│   │   ├── admin/             # Área administrativa
│   │   │   ├── usuarios/      # Gestão de usuários
│   │   │   ├── projetos/      # Gestão de projetos
│   │   │   ├── doacoes/       # Gestão de doações
│   │   │   └── relatorios/    # Relatórios
│   │   ├── api/               # API Routes
│   │   │   ├── payments/      # Endpoints de pagamento
│   │   │   └── webhooks/      # Webhooks Stripe
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Header.tsx         # Cabeçalho
│   │   └── ImageUpload.tsx    # Upload de imagens
│   ├── lib/                   # Utilitários e configurações
│   │   ├── supabase.ts        # Cliente Supabase (cliente)
│   │   ├── supabase-server.ts # Cliente Supabase (servidor)
│   │   ├── stripe.ts          # Configuração Stripe
│   │   ├── database.ts        # Funções de banco de dados
│   │   ├── stripe-integration.ts # Integração Stripe
│   │   └── validations.ts     # Schemas Zod
│   └── types/                 # Definições de tipos
├── scripts/                   # Scripts utilitários
│   └── test-supabase.js       # Teste de conexão
├── public/                    # Arquivos estáticos
├── supabase-setup-safe.sql    # Script de configuração do banco
├── supabase-storage-setup-safe.sql # Script de storage
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 🔧 **Funcionalidades Detalhadas**

### **Autenticação (Supabase)**
- ✅ Login e registro de usuários
- ✅ Dois tipos de usuário: admin e doador
- ✅ Proteção de rotas por role
- ✅ Modo demo para demonstração
- ✅ Gerenciamento de sessão

### **Gestão de Projetos**
- ✅ CRUD completo de projetos
- ✅ Categorias: educação, saúde, meio ambiente, esporte
- ✅ Upload de imagens
- ✅ Cálculo automático de progresso
- ✅ Status: ativo, concluído, pausado, cancelado

### **Sistema de Doações**
- ✅ **Fluxo multi-step** (valor, método, dados)
- ✅ **Pagamentos via Stripe** (PIX, cartão, boleto) - **100% FUNCIONAL**
- ✅ **Stripe Elements** integrado no frontend
- ✅ **Doações recorrentes** suportadas
- ✅ **Doações anônimas** disponíveis
- ✅ **Mensagens personalizadas** para projetos
- ✅ **Confirmação por email** automática
- ✅ **Webhooks** para atualização de status em tempo real

### **Gestão de Usuários (Admin)**
- ✅ Listagem e filtros
- ✅ Criação e edição
- ✅ Ativação/desativação
- ✅ Exclusão
- ✅ Estatísticas

### **Perfil do Usuário**
- ✅ Dados pessoais
- ✅ Upload de avatar
- ✅ Preferências de comunicação
- ✅ Estatísticas de doações
- ✅ Histórico completo

### **Comunidade WhatsApp**
- ✅ Grupos temáticos por categoria
- ✅ Links diretos para WhatsApp
- ✅ Estatísticas de participação

## 🎨 **Design System**

### **Cores Padronizadas:**
- **Primária**: Cinza escuro (#1f2937)
- **Secundária**: Cinza médio (#6b7280)
- **Accent**: Cinza neutro (#4b5563)
- **Sucesso**: Verde (#059669)
- **Aviso**: Laranja (#d97706)
- **Erro**: Vermelho (#dc2626)

### **Componentes:**
- ✅ Botões padronizados (primary, secondary, accent)
- ✅ Inputs modernos com focus states
- ✅ Cards com hover effects
- ✅ Headers consistentes
- ✅ Loading states
- ✅ Error handling

## 📝 **Scripts Disponíveis**

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Linter ESLint
- `npm run test-supabase` - Teste de conexão com Supabase

## 🔐 **Variáveis de Ambiente**

### **Obrigatórias:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Opcionais:**
```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

## 🚀 **Deploy**

### **✅ DEPLOY ATIVO:**
- ✅ **Vercel** - Deploy automático ativo e funcionando
- ✅ **GitHub Integration** - Deploy automático a cada push
- ✅ **Variáveis de Ambiente** - Configuradas e funcionando
- ✅ **Domínio Personalizado** - Pronto para configuração

### **Configurado para:**
- ✅ **Vercel** - Deploy automático (ATIVO)
- ✅ **CapRover** - `portal.imagineinstituto.com` (backup)
- ✅ **Netlify** - Deploy automático (backup)
- ✅ **Railway** - Deploy automático (backup)

### **Arquivos de Deploy:**
- `Dockerfile` - Container otimizado
- `captain-definition` - Configuração CapRover
- `.dockerignore` - Otimização do build
- `DEPLOY.md` - Instruções completas
- `.env.local` - Variáveis de ambiente locais

## 📋 **Próximas Fases Disponíveis**

### **FASE 3 - Melhorias UX/UI (COMPLETA):**
- ✅ **Sistema de Breadcrumbs** - Navegação hierárquica em todas as páginas
- ✅ **Design Minimalista** - Paleta monocromática estilo Apple/Notion
- ✅ **Animações e transições** - Sistema completo de micro-interações
- ✅ **Otimizações de performance** - Lazy loading, virtual scrolling, memoização
- ✅ **Acessibilidade** - WCAG AA completo com ARIA labels e keyboard navigation
- ⏳ Dark mode (opcional para futuras versões)
- ⏳ PWA (Progressive Web App) (opcional para futuras versões)

### **FASE 4 - Funcionalidades Sociais:**
- Sistema de comentários
- Compartilhamento social
- Gamificação
- Badges e conquistas
- Ranking de doadores

### **FASE 5 - Deploy e Produção:**
- Configuração de produção
- Monitoramento e logs
- Backup automático
- CDN e otimizações
- Testes automatizados

## 🧪 **Testando o Sistema**

### **🌐 Deploy Ativo:**
- **URL de Produção**: Disponível no Vercel Dashboard
- **Deploy Automático**: A cada push no GitHub
- **Variáveis Configuradas**: Supabase + Stripe funcionando

### **💻 Desenvolvimento Local:**
- **URL Local**: `http://localhost:3000`
- **Comando**: `npm run dev`

### **Modo Demo (Produção e Local):**
- **Admin**: `?demo_email=admin@institutoimagine.org`
- **Doador**: `?demo_email=demo@doador.com`

### **URLs de Teste:**
- Dashboard: `/dashboard`
- Projetos: `/projetos`
- Doações: `/doacoes?demo_email=demo@doador.com`
- Perfil: `/perfil?demo_email=demo@doador.com`
- Admin: `/admin/usuarios?demo_email=admin@institutoimagine.org`

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT.

---

## 🎯 **Resumo do Status**

**✅ FASE 1 - 100% COMPLETA**
- Sistema híbrido (demo + real) funcionando
- Integração Supabase + Stripe ativa
- Todas as páginas implementadas
- Design consistente e responsivo

**✅ FASE 2 - 100% COMPLETA**
- Sistema de notificações em tempo real
- Favoritos de projetos funcionando
- Histórico detalhado com filtros avançados
- Relatórios avançados com gráficos
- Exportação de dados (CSV, PDF, Excel)

**✅ FASE 3 - COMPLETA (100%)**
- ✅ Sistema de breadcrumbs implementado em TODO o sistema
- ✅ Design minimalista monocromático aplicado
- ✅ Animações e transições suaves implementadas
- ✅ Sistema de loading states elegantes
- ✅ Otimizações de performance avançadas
- ✅ Acessibilidade completa (WCAG AA)
- ✅ Componentes reutilizáveis e otimizados
- ✅ Hooks de performance (debounce, throttle)
- ✅ Error boundaries e tratamento de erros

## 🎨 **FASE 3 - UX/UI IMPROVEMENTS (COMPLETA)**

### **✨ Animações e Transições Suaves**
- **Sistema de animações** minimalista e profissional
- **Transições entre páginas** com fade-in suave
- **Micro-interações** em botões e cards
- **Loading states** elegantes e consistentes
- **Hover effects** sutis e responsivos

### **⚡ Otimizações de Performance**
- **Lazy Loading** de imagens com Intersection Observer
- **Virtual Scrolling** para listas grandes
- **Debounce/Throttle** hooks para otimização
- **Memoização** de componentes React
- **Error Boundaries** para captura de erros
- **Skeleton Loading** para melhor UX

### **♿ Acessibilidade Completa (WCAG AA)**
- **ARIA labels** e roles em todos os componentes
- **Keyboard navigation** completa
- **Focus management** avançado
- **Screen reader** support
- **Skip links** para navegação
- **Focus trap** para modais
- **Contraste** otimizado

### **🧩 Componentes Reutilizáveis**
- **LoadingSpinner** - Spinner minimalista
- **LoadingState** - Estado de carregamento completo
- **SkeletonLoader** - Loading skeleton
- **LazyImage** - Imagem com lazy loading
- **VirtualList** - Lista virtual otimizada
- **AccessibleButton** - Botão com acessibilidade
- **ErrorBoundary** - Captura de erros
- **FocusTrap** - Armadilha de foco
- **SkipLink** - Link de pular conteúdo

### **🎯 Hooks de Performance**
- **useDebounce** - Debounce de valores
- **useThrottle** - Throttling de funções
- **usePageLoading** - Estado de loading de páginas

**🚀 Sistema agora com UX/UI profissional, performance otimizada, acessibilidade completa, STRIPE 100% FUNCIONAL e DEPLOY ATIVO!**

## 💳 **INTEGRAÇÃO STRIPE 100% COMPLETA**

### ✅ **O que foi implementado:**
- ✅ **Stripe Elements** - Formulário de pagamento seguro
- ✅ **Payment Intent** - Criação e confirmação de pagamentos
- ✅ **Webhooks** - Atualização automática de status
- ✅ **Doações recorrentes** - Suporte completo
- ✅ **Múltiplos métodos** - PIX, cartão, boleto
- ✅ **Interface moderna** - UX otimizada para conversão

### 🧪 **Como testar:**
1. **Acesse**: `/doar/1?demo_email=demo@doador.com`
2. **Use cartões de teste**:
   - `4242 4242 4242 4242` (Visa - funciona)
   - `4000 0000 0000 0002` (Visa - recusado)
3. **Configure variáveis** em `.env.local` (veja `CONFIGURACAO_STRIPE_COMPLETA.md`)

### 📋 **Arquivos da integração:**
- `src/components/StripePaymentForm.tsx` - Componente principal
- `src/lib/stripe-integration.ts` - Funções do backend
- `src/app/api/payments/create-intent/route.ts` - API endpoint
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler

---

## 🎯 **Status Final do Projeto**

### **✅ PROJETO 100% FUNCIONAL:**
- ✅ **FASE 1** - Backend integrado (Supabase + Stripe)
- ✅ **FASE 2** - Funcionalidades avançadas (notificações, favoritos, relatórios)
- ✅ **FASE 3** - UX/UI profissional (breadcrumbs, animações, acessibilidade)
- ✅ **STRIPE** - Integração 100% completa com Stripe Elements
- ✅ **DEPLOY** - Vercel ativo com deploy automático
- ✅ **VARIÁVEIS** - Ambiente configurado e funcionando

### **🌐 Sistema Online:**
- **Deploy**: Vercel com GitHub Integration
- **URL**: `https://portal.imagineinstituto.com`
- **Status**: Funcionando perfeitamente
- **Atualizações**: Automáticas a cada push
- **Domínio**: Personalizado e ativo

### **📱 Funcionalidades Ativas:**
- ✅ **Sistema de doações com Stripe** - 100% funcional com Stripe Elements
- ✅ **Autenticação completa** (demo + real)
- ✅ **Dashboard personalizado** por role
- ✅ **Notificações em tempo real**
- ✅ **Sistema de favoritos**
- ✅ **Relatórios avançados**
- ✅ **Breadcrumbs** em todo sistema
- ✅ **Design minimalista** e responsivo
- ✅ **Acessibilidade WCAG AA**
- ✅ **Pagamentos seguros** (PIX, cartão, boleto)
- ✅ **Doações recorrentes**
- ✅ **Webhooks** para atualização automática
- ✅ **Iframe embed** para Framer - 100% funcional
- ✅ **Criação automática de usuários** após doação
- ✅ **Emails automáticos** via Resend com templates profissionais
- ✅ **Sistema de login** completo para doadores

### **🖼️ Iframe para Framer:**
- ✅ **URL**: `https://portal.imagineinstituto.com/embed/checkout/1`
- ✅ **X-Frame-Options** configurado corretamente
- ✅ **Design responsivo** e moderno
- ✅ **Integração completa** com Stripe
- ✅ **Código pronto** para uso no Framer (veja `IFRAME_FRAMER_FINAL.md`)

**🎉 Portal Instituto Imagine - 100% COMPLETO E FUNCIONAL!**