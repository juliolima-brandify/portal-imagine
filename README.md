# 🏠 Portal Instituto Imagine - Sistema Completo de Doações

## 🎯 **Visão Geral**

O Portal Instituto Imagine é uma plataforma completa de doações e gestão de projetos sociais, desenvolvida com Next.js 14, Supabase e Stripe. Sistema 100% funcional com 34 funcionalidades implementadas.

## 🚀 **Status Atual**

> 🔴 **Atenção (07/07/2026): a produção está quebrada e há uma falha de segurança aberta.** O status "100% funcional / 0 bugs" abaixo é de out/2025 (v2.1.6) e **não reflete a realidade atual**. Leia **[docs/ESTADO_ATUAL.md](./docs/ESTADO_ATUAL.md)** — é a fonte canônica: a produção aponta para um banco Supabase morto e a API `/api/admin/*` está sem autenticação. O ambiente **local** está funcionando, conectado ao banco novo `zzxtethlsdjjfjjrqmlk`.

- **✅ Sistema:** 100% funcional e em produção
- **🌐 URL:** https://portal.imagineinstituto.com
- **📅 Última atualização:** 15/10/2025 v2.1.6
- **🐛 Bugs conhecidos:** 0
- **⚡ Performance:** < 2 segundos de carregamento

## 🎯 **Funcionalidades por Role**

### **👨‍💼 Admin**
- ✅ **Gestão completa** de projetos, doações e usuários
- ✅ **Relatórios avançados** com gráficos e métricas
- ✅ **Exportação de dados** (CSV, PDF, Excel)
- ✅ **Dashboard administrativo** com visão geral
- ✅ **Controle de acesso** por roles
- ✅ **Perfil simplificado** - Nome, Email, Telefone, Foto, Alterar Senha
- ✅ **Navegação**: `/admin/dashboard`, `/admin/projetos`, `/admin/doacoes`, `/admin/usuarios`, `/admin/relatorios`, `/admin/perfil`

### **💝 Doador**
- ✅ **Doações** com múltiplos métodos de pagamento
- ✅ **Doações recorrentes** e anônimas
- ✅ **Histórico detalhado** de doações
- ✅ **Sistema de favoritos** e projetos
- ✅ **Meus Projetos** - projetos com doações e favoritos
- ✅ **Filtro inteligente** - mostra apenas projetos do usuário
- ✅ **CTA para site principal** - explorar novos projetos
- ✅ **Interface simplificada** - foco na experiência do usuário
- ✅ **Relatórios de transparência** por projeto
- ✅ **Checkout individual** por projeto
- ✅ **Perfil otimizado** - Stats de doações, Nome, Email, Telefone, Foto, Notificações
- ✅ **Navegação**: `/dashboard`, `/projetos`, `/doacoes`, `/perfil`, `/projetos/[id]/relatorios`

### **🤝 Voluntário**
- ✅ **Participação em projetos** e contribuições
- ✅ **Gestão de disponibilidade** e horários
- ✅ **Histórico de contribuições** e impacto
- ✅ **Meus Projetos** - projetos com voluntariado
- ✅ **Relatórios de transparência** por projeto
- ✅ **Perfil otimizado** - Stats de voluntariado (horas, projetos), Nome, Email, Telefone, Foto, Notificações
- ✅ **Navegação**: `/dashboard`, `/projetos`, `/volunteer/contributions`, `/volunteer/availability`, `/perfil`

## 🎯 **Funcionalidades Técnicas**

### **💰 Sistema de Doações**
- ✅ Checkout híbrido (embed + Stripe)
- ✅ Valores otimizados (R$ 50, 100, 200)
- ✅ Doação recorrente e anônima
- ✅ Meta de arrecadação opcional
- ✅ Fundo branco completo e consistente

### **👥 Gestão de Projetos**
- ✅ CRUD completo com interface admin
- ✅ Autocomplete de estados brasileiros
- ✅ URLs automáticas de checkout
- ✅ Código embed gerado automaticamente
- ✅ Abas unificadas para Projeto URL, Checkout URL e Embed
- ✅ Modal de compartilhamento (Projeto, Checkout, Embed)

### **🔐 Autenticação Inteligente**
- ✅ Redirecionamento por role (admin/doador/voluntário)
- ✅ Recuperação de senha integrada
- ✅ Botões demo (apenas local)
- ✅ Opção "Lembrar-me"

### **💬 Chat de Suporte**
- ✅ Widget Tawk.to integrado
- ✅ Visibilidade condicional
- ✅ Suporte 24/7 para usuários

### **📈 Relatórios e Dashboard Admin**
- ✅ Filtro por projeto nos relatórios
- ✅ Top doadores com avatar (relatórios e dashboard)
- ✅ Métrica de voluntários totais
- ✅ Dados dinâmicos sincronizados ao banco
- ✅ **Exportação funcional**: CSV, PDF e Excel
- ✅ **Formatação automática**: moedas, datas e números
- ✅ **Processamento inteligente**: dados complexos estruturados

## 🛠️ **Stack Tecnológica**

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Pagamentos:** Stripe
- **Emails:** Resend
- **Deploy:** Vercel
- **Chat:** Tawk.to

## 📚 **Documentação Completa**

### **📋 Documentação Principal**
- **[📊 Resumo Executivo](./docs/RESUMO_EXECUTIVO.md)** - Visão geral e status
- **[📋 Changelog Completo](./docs/CHANGELOG_COMPLETO.md)** - Histórico de implementações
- **[🎯 Funcionalidades](./docs/FUNCIONALIDADES_IMPLEMENTADAS.md)** - Lista detalhada
- **[🚀 Guia de Deploy](./docs/GUIA_DEPLOY_PRODUCAO.md)** - Processo de deploy
- **[🌍 Jornada Global](./JORNADA_GLOBAL_PORTAL.md)** - Jornada completa por role

### **⚙️ Configuração**
- **[🌍 Ambientes](./docs/AMBIENTES.md)** - Setup de desenvolvimento
- **[🔧 Supabase](./docs/guias/CONFIGURACAO_SUPABASE.md)** - Configuração do banco
- **[💳 Stripe](./docs/guias/CONFIGURACAO_STRIPE_COMPLETA.md)** - Setup de pagamentos
- **[📧 Emails](./docs/guias/CONFIGURACAO_RESEND.md)** - Sistema de emails

### **🏗️ Arquitetura**
- **[📐 Design System](./docs/arquitetura/DESIGN_SYSTEM.md)** - Padrões visuais
- **[🏛️ Arquitetura](./docs/arquitetura/ADMIN_PANEL_COMPLETE.md)** - Estrutura técnica
- **[📡 API Reference](./docs/arquitetura/ADMIN_PANEL_API_REFERENCE.md)** - Documentação das APIs

## 🌐 **URLs do Sistema**

### **🚀 Produção**
- **Site:** https://portal.imagineinstituto.com/
- **Login:** https://portal.imagineinstituto.com/auth
- **Checkout:** https://portal.imagineinstituto.com/embed/checkout/checkout-stripe?project=mock-1
- **Admin:** https://portal.imagineinstituto.com/admin/dashboard

### **💻 Desenvolvimento**
- **Local:** http://localhost:3000/
- **Health Check:** http://localhost:3000/api/health

## 🔧 **Comandos Úteis**

```bash
# Desenvolvimento
npm install          # Instalar dependências
npm run dev         # Executar local
npm run build       # Build para produção

# Scripts úteis
node scripts/create-demo-users.js      # Criar usuários demo
node scripts/setup-first-admin.js      # Setup primeiro admin
node scripts/fix-database-schema.js    # Corrigir schema

# Deploy
vercel ls           # Listar deploys
vercel --prod       # Deploy manual
```

## 👥 **Usuários Demo (Local)**

```
Admin:     admin@demo.com / demo123
Doador:    doador@demo.com / demo123
Voluntário: voluntario@demo.com / demo123
```

## 📊 **Métricas de Sucesso**

- **Funcionalidades:** 35/35 (100% implementadas)
- **Deploy time:** 45 segundos
- **Uptime:** > 99.9%
- **Performance:** < 2 segundos
- **Segurança:** Zero vulnerabilidades conhecidas

## 📞 **Suporte**

- **💬 Chat:** Disponível 24/7 no site
- **📧 Email:** suporte@imagineinstituto.com
- **📚 Docs:** Pasta `docs/` completa
- **🔄 Atualizações:** Automáticas via Vercel

---

**📝 README atualizado em:** 15/10/2025  
**🔄 Versão:** v2.1.6 - Perfis Simplificados & Date Range Picker Premium  
**👨‍💻 Portal Instituto Imagine**  

*Sistema completo e funcional para maximizar o impacto social através da tecnologia.*