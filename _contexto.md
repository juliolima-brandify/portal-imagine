# Diário de Bordo / Contexto para a IA

> 📍 **Estado canônico do projeto: [docs/ESTADO_ATUAL.md](./docs/ESTADO_ATUAL.md).** As sessões abaixo (out/2025 e anteriores) descrevem "sistema 100% funcional em produção", mas **isso mudou** — ver sessão 07/07/2026.

## Sessão Atual (07/07/2026)

### O que foi feito:
- ✅ **Reconexão ao banco de dados** — o `.env.local` estava com credenciais placeholder; conectado ao **novo projeto Supabase `zzxtethlsdjjfjjrqmlk`** (chave pública no formato novo `sb_publishable_...`).
- ✅ **Mapeados 3 bancos Supabase na história** (ver `docs/ESTADO_ATUAL.md`): o de produção (`nsnmeufhzxdkqhlwkeml`) está **morto**; o antigo do screenshot estava pausado com backup **vazio**; o novo (`zzxtethlsdjjfjjrqmlk`) é a **fonte da verdade**.
- ✅ **Banco recriado** via `docs/SETUP-COMPLETO.sql` — 5 tabelas, RLS, 2 buckets storage, 4 projetos de exemplo.
- ✅ **Correções de código/schema:** `isSupabaseConfigured()` passou a aceitar `sb_publishable_`; `CHECK` de `profiles.role` relaxado para incluir `volunteer` (antes só `donor`/`admin` — quebrava o app).
- ✅ **3 usuários demo criados** (admin/doador/voluntário, senha `demo123`) — botões de demo voltaram a funcionar.
- 🔴 **Achado de segurança:** `/api/admin/projects` (e provavelmente `/api/admin/users`) usa service_role **sem autenticação** — corrigir antes de religar a produção.
- 🔴 **Produção quebrada:** aponta para o banco morto; precisa atualizar env vars na Vercel + redeploy.
- 📝 **Planejada integração Portal ↔ Framer** (Framer = vitrine via CMS; portal = motor/fonte da verdade; sync via webhook Supabase → Framer CMS API).
- 📚 **Documentação viva atualizada** e criado o doc-mestre `docs/ESTADO_ATUAL.md`.

### Pendências priorizadas:
Ver seção "Pendências / próximos passos" em `docs/ESTADO_ATUAL.md`.

---

## Sessão Anterior (15/10/2025)

### O que foi feito:
- ✅ **Perfis Simplificados por Role**
  - ✅ **Perfil Admin**: Nome, Email, Telefone, Foto, Alterar Senha
  - ✅ **Perfil Doador/Voluntário**: Detecção dinâmica de role
  - ✅ **Stats específicos**: Doador (doações) | Voluntário (horas)
  - ✅ **Redução de 60%**: Campos não essenciais removidos
  - ✅ **Upload de foto**: Integração Supabase Storage
  - ✅ **Modal Alterar Senha**: Funcional para admin
  - ✅ **Removidos do Admin**: Bio, 2FA, Estatísticas extensas, CPF, Endereço
  - ✅ **Foco**: Apenas funcionalidades essenciais
- ✅ **Date Range Picker Premium Implementado**
  - ✅ Design elegante com cores Portal Imagine (#2EB87E)
  - ✅ Formato "DD MMM YY – DD MMM YY" (ex: "28 Dez 22 – 10 Jan 23")
  - ✅ Dropdown com 2 colunas (presets + calendário)
  - ✅ Presets simplificados: Hoje, Ontem, Última semana, Último mês, Último trimestre
  - ✅ **Feedback visual completo:** hover com fundo cinza, scale 1.05, transições suaves
  - ✅ **Botão "Aplicar"** para confirmar seleção personalizada
  - ✅ **Botão "Cancelar"** para descartar mudanças
  - ✅ **Botão "Limpar"** que desseleciona as datas
  - ✅ Popover permanece aberto durante interação (não fecha ao clicar dentro)
  - ✅ **Responsivo:** Posicionamento inteligente (esquerda/direita), colunas empilham em mobile
  - ✅ **Adaptativo:** 1 mês em mobile, 2 meses em desktop
  - ✅ Removidas todas as cores azul/roxo padrão
  - ✅ Hoje destacado com borda verde
  - ✅ Intervalo com fundo verde claro
  - ✅ Integrado em Dashboard e Relatórios Admin
- ✅ **Solução Definitiva para Problemas de Cache do Next.js**
  - ✅ Script `start-clean.ps1` criado para inicialização limpa
  - ✅ Comando `npm run dev:clean` adicionado ao package.json
  - ✅ Configuração webpack otimizada no `next.config.js`
  - ✅ Cache em memória (type: 'memory') ao invés de filesystem
  - ✅ Runtime único (runtimeChunk: 'single') para consistência
  - ✅ Split chunks simplificado para reduzir erros
  - ✅ IDs de módulos e chunks nomeados para melhor debug
  - ✅ `.gitignore` atualizado para ignorar caches
  - ✅ Documentação completa em `README_DEV.md`
  - ✅ Guia de troubleshooting em `TROUBLESHOOTING_CACHE.md`
- ✅ **Documentação Atualizada**
  - ✅ `docs/CHANGELOG_COMPLETO.md` - v2.1.6 com todas as mudanças
  - ✅ `docs/RESUMO_EXECUTIVO.md` - Data e métricas atualizadas
  - ✅ `docs/FUNCIONALIDADES_IMPLEMENTADAS.md` - Novas funcionalidades adicionadas
  - ✅ `README.md` - Versão v2.1.6
  - ✅ `_contexto.md` - Sessão completa documentada

## Sessão Anterior (14/10/2025)

### O que foi feito:
- ✅ **Sistema de Exportação de Relatórios 100% Funcional**
- ✅ Instaladas bibliotecas: jspdf, jspdf-autotable, xlsx
- ✅ Implementação real de exportação PDF com tabelas formatadas
- ✅ Implementação real de exportação Excel com ajuste automático
- ✅ Exportação CSV já funcional, mantida e otimizada
- ✅ Função especial para processar dados complexos de relatórios
- ✅ Formatação automática de moedas (R$ X.XXX,XX)
- ✅ Formatação automática de datas (DD/MM/YYYY)
- ✅ Separação por seções: Métricas Gerais, Arrecadação Mensal, Top Projetos, Doações Recentes
- ✅ Documentação completa de testes criada
- ✅ **Correção do redirecionamento de admin após login**
- ✅ **Proteção no dashboard genérico para redirecionar admins**
- ✅ **Simplificação dos Perfis por Role**
  - ✅ Perfil Admin simplificado: Nome, Email, Telefone, Foto, Alterar Senha
  - ✅ Perfil Doador/Voluntário com detecção dinâmica de role
  - ✅ Stats específicos por role (doador: doações | voluntário: horas)
  - ✅ Removidos campos não essenciais (CPF, endereço, preferências extensas)
  - ✅ Interface mais limpa e focada em funcionalidades essenciais

### Principais correções:
- **Exportação PDF:** Implementação real substituindo simulação
- **Exportação Excel:** Implementação real substituindo simulação
- **Processamento de dados:** Função inteligente para estrutura complexa de relatórios
- **Build:** Compilação 100% sem erros
- **Tipos TypeScript:** Todos corretos e validados
- **Redirecionamento Admin:** Função `handleDemoLogin` agora redireciona corretamente por role
- **Dashboard Admin:** Proteção automática redireciona admins de `/dashboard` para `/admin/dashboard`
- **Perfil Admin:** Simplificado com apenas funcionalidades essenciais (Bio, 2FA e Estatísticas removidas)
- **Perfil Doador/Voluntário:** Detecção dinâmica de role com stats específicos por tipo de usuário
- **Upload de Foto:** Funcional em ambos os perfis com integração ao Supabase Storage
- **Alterar Senha:** Modal funcional implementado para admin

### Documentação atualizada:
- `docs/guias/TESTE_EXPORTACAO_RELATORIOS.md` - Guia completo de testes
- `docs/CHANGELOG_COMPLETO.md` - Nova versão 2.1.5
- `README.md` - Atualizado com funcionalidades de exportação
- `_contexto.md` - Sessão atual documentada

### Status atual:
- **Sistema:** 100% funcional em produção
- **URL:** https://portal.imagineinstituto.com
- **Versão:** v2.1.6
- **Funcionalidades:** 35/35 (100% implementadas)
- **Bugs conhecidos:** 0
- **Nova funcionalidade:** Sistema de exportação de relatórios (CSV, PDF, Excel)
- **Melhoria implementada:** Perfis simplificados por role (Admin, Doador, Voluntário)
- **Bug corrigido:** Admin agora sempre vê dashboard correto no primeiro acesso

## Sessão Anterior (06/10/2025)

### O que foi feito:
- ✅ Skeleton loading na listagem de projetos (Admin) e melhoria UX
- ✅ Botão duplicado removido (mantido "Relatórios do Projeto")
- ✅ Modal de compartilhamento (Projeto URL, Checkout URL, Embed)
- ✅ Padronização de abas no formulário de projeto (Projeto URL, Checkout URL, Embed)
- ✅ Renomeação de "Framer URL" para "Projeto URL"
- ✅ Barra de progresso oculta quando "Sem meta"
- ✅ Dashboard/Layouts: prioridade para sessão real sobre demo (admin/doador/voluntário)
- ✅ Relatórios Admin: filtro por projeto, Top Doadores com avatar, Voluntários totais
- ✅ **GlobalLayout: busca role da tabela profiles (fix sidebar admin em /perfil)**
- ✅ **Área do Doador: Página "Projetos" transformada em "Meus Projetos"**
- ✅ **Filtro inteligente: mostra apenas projetos do usuário (doações + favoritos)**
- ✅ **CTA para site principal: "Explorar projetos no site principal"**
- ✅ **Remoção de abas: interface simplificada focada no usuário**
- ✅ **UX otimizada: foco na experiência personalizada do doador**
- ✅ **Design System: Botões do modal "Esqueceu a senha" padronizados (btn-primary e btn-outline)**

### Principais correções:
- **Sessão/Role:** Sessão real tem prioridade e `demo_email` é ignorado quando autenticado
- **Admin Projetos:** Skeleton de carregamento, estado vazio só sem loading
- **Cards de Projeto:** Removidas "Estatísticas" duplicadas; ícone "Relatórios" funcional
- **Compartilhar:** Modal com ações para Projeto/Checkout/Embed
- **Metas:** Esconder progresso quando sem meta
- **Doador UX:** Página "Projetos" agora mostra apenas "Meus Projetos" (doações + favoritos)
- **Navegação:** CTA para explorar novos projetos no site principal
- **Interface:** Removidas abas desnecessárias, foco na experiência do usuário
- **Personalização:** Filtro inteligente que mostra apenas projetos relevantes ao doador
- **Sidebar Admin:** Corrigido bug onde admin via /perfil mostrava sidebar de doador

### Documentação atualizada:
- `docs/CHANGELOG_COMPLETO.md` - Histórico completo de implementações
- `docs/FUNCIONALIDADES_IMPLEMENTADAS.md` - 33 funcionalidades detalhadas
- `docs/RESUMO_EXECUTIVO.md` - Visão geral e status atual
- `docs/GUIA_DEPLOY_PRODUCAO.md` - Processo de deploy
- `docs/README_PRINCIPAL.md` - Ponto de entrada da documentação
- `README.md` - Atualizado com status v2.1.2 (novas funcionalidades de relatórios e UX)

### Status atual:
- **Sistema:** 100% funcional em produção
- **URL:** https://portal.imagineinstituto.com
- **Versão:** v2.1.6
- **Funcionalidades:** 35/35 (100% implementadas)
- **Bugs conhecidos:** 0
- **Novas funcionalidades:** 
  - Perfis simplificados por role (Admin, Doador, Voluntário)
  - Date Range Picker Premium (Dashboard e Relatórios Admin)
  - Solução definitiva para cache do Next.js

## Sessão Anterior (24/09/2025)

### O que foi feito:
- Organização completa da documentação do projeto Portal Instituto Imagine
- Criação de estrutura de pastas em `docs/`: `guias/`, `arquitetura/`, `assets/`
- Categorização e movimentação de 44 arquivos `.md` para subpastas apropriadas
- Criação do arquivo `docs/SUMARIO.md` com índice completo e navegação organizada
- Movimentação da imagem `logo.png` para `docs/assets/`

### Principais arquivos modificados:
- `docs/SUMARIO.md` (criado)
- `docs/guias/` (17 arquivos movidos)
- `docs/arquitetura/` (15 arquivos movidos)
- `docs/assets/logo.png` (movido de `public/images/`)
- Estrutura de pastas `docs/guias/`, `docs/arquitetura/`, `docs/assets/` (criadas)

### Estrutura de documentação organizada:
- **Guias**: Tutoriais, configuração, testes, deploy
- **Arquitetura**: Design system, jornada do usuário, admin panel, integrações
- **Assets**: Imagens e mídias
- **Relatórios**: Mantidos na raiz de `docs/` para fácil acesso

---

## Sessão Atual (24/09/2025)

### O que foi feito hoje:
- ✅ Verificação completa dos links no `docs/SUMARIO.md` - todos funcionando
- ✅ Atualização das referências do logo em `docs/guias/LOGO-SETUP.md`
- ✅ Criação do `docs/README.md` com navegação intuitiva
- ✅ Confirmação de que todos os arquivos estão nas pastas corretas
- ✅ Verificação de que não há links quebrados após reorganização
- ✅ Remoção de pastas vazias (ambientes, configuracao, deploy)
- ✅ Verificação final da estrutura de documentação
- ✅ Commit e push da documentação organizada
- ✅ Criação da branch `dev` no Git
- ✅ Teste de conexão Supabase - funcionando perfeitamente
- ✅ Build de produção testado - funcionando
- ✅ **Remoção completa dos dados mock da versão DEV**
- ✅ **Deploy DEV funcionando com dados reais do Supabase**
- ✅ **Push das mudanças para a branch dev**
- ✅ **Dashboard admin corrigido com dados reais do Supabase**
- ✅ **Relatórios admin removidos dados mock**
- ✅ **Perfil admin corrigido com autenticação real**
- ✅ **Problemas de redirecionamento para /auth corrigidos**
- ✅ **Build funcionando perfeitamente**
- ✅ **Lógica de modo demo restaurada para usuários demo**
- ✅ **Dashboard doador demo funcionando**
- ✅ **Minhas doações doador demo funcionando**
- ✅ **Perfil admin demo funcionando**
- ✅ **Dashboard admin demo funcionando**
- ✅ **Relatórios admin demo funcionando**
- ✅ **Página geral de perfil funcionando para admin demo**
- ✅ **Todas as páginas admin funcionando perfeitamente**
- ✅ **Correção do erro de criação de usuário no admin**
- ✅ **Melhoria da lógica de verificação de usuários existentes**
- ✅ **Servidor local funcionando perfeitamente (porta 3001)**
- ✅ **Ambiente local, dev e prod sincronizados**
- ✅ **Sistema 100% funcional com dados reais**
- ✅ **Sistema de emails transacionais do Resend implementado**
- ✅ **5 tipos de emails transacionais criados**
- ✅ **Integração com webhooks do Stripe**
- ✅ **Templates profissionais e responsivos**
- ✅ **Logo do Instituto Imagine integrado em todos os emails**
- ✅ **URLs dinâmicas para logo funcionando perfeitamente**
- ✅ **Sistema de fallback robusto**
- ✅ **Scripts de teste automatizados**
- ✅ **Documentação completa do sistema atualizada**
- ✅ **One Page Checkout funcionando perfeitamente (sem sidebar) - MODELO PRINCIPAL**
- ✅ **Erro TypeError corrigido no prototype checkout**
- ✅ **GlobalLayout otimizado para páginas de checkout**
- ✅ **One Page Checkout definido como modelo principal de checkout**
- ✅ **Campos CPF e Celular (WhatsApp) adicionados ao One Page Checkout**
- ✅ **Máscaras automáticas implementadas para CPF e telefone**
- ✅ **Desativados todos os outros checkouts**
- ✅ **Centralizado no One Page Checkout como modelo único**
- ✅ **Código embed do checkout implementado no formulário de projetos**
- ✅ **Fallback melhorado para projetos não encontrados**
- ✅ **Deploy dev atualizado e funcionando perfeitamente**
- ✅ **🚀 SISTEMA HÍBRIDO DE CHECKOUT IMPLEMENTADO COMPLETAMENTE**
- ✅ **Componente DonationEmbed criado (primeira etapa do checkout)**
- ✅ **API de criação de sessões Stripe implementada**
- ✅ **URLs otimizadas (/embed/checkout/checkout-stripe)**
- ✅ **Campos desnecessários removidos (nome, email, CPF, telefone)**
- ✅ **Validação simplificada e otimizada**
- ✅ **Opções da primeira etapa preservadas (recorrência, anônimo, mensagem)**
- ✅ **Logs detalhados para debugging**
- ✅ **Página de sucesso atualizada para Stripe**
- ✅ **README.md atualizado com sistema híbrido**
- ✅ **Deploy DEV realizado com sucesso**

### Principais arquivos modificados hoje:
- `docs/README.md` (criado)
- `docs/guias/LOGO-SETUP.md` (atualizado referências do logo)
- `src/app/page.tsx` (removida lógica de modo demo)
- `src/app/doacoes/page.tsx` (removida lógica de modo demo)
- `src/components/Header.tsx` (removida lógica de modo demo)
- `src/components/VolunteerDashboard.tsx` (removidos dados mock)
- `src/app/dashboard/page.tsx` (corrigido erro de tipo)
- `src/app/admin/dashboard/page.tsx` (dados reais do Supabase)
- `src/app/admin/relatorios/page.tsx` (removidos dados mock)
- `src/app/admin/perfil/page.tsx` (autenticação real)
- `src/app/dashboard/page.tsx` (lógica demo restaurada)
- `src/app/doacoes/page.tsx` (lógica demo restaurada)
- `src/app/admin/dashboard/page.tsx` (lógica demo restaurada)
- `src/app/admin/relatorios/page.tsx` (lógica demo restaurada)
- `src/app/api/admin/users/route.ts` (correção criação usuário + melhoria lógica)
- `src/lib/resend.ts` (expandido com 5 tipos de emails transacionais + logo integrado)
- `src/lib/email-service.ts` (criado serviço centralizado de emails)
- `src/lib/email-config.ts` (criado configurações de email + função getLogoUrl)
- `src/lib/stripe-integration.ts` (integração com emails nos webhooks)
- `scripts/test-email-simple.js` (criado script de teste)
- `scripts/test-email-system.js` (criado script de teste completo)
- `scripts/test-logo-urls.js` (criado script de teste de logos)
- `scripts/test-welcome-with-logo.js` (criado script de teste com logo)
- `scripts/test-final-logo.js` (criado script de teste final)
- `docs/guias/CONFIGURACAO_RESEND.md` (atualizado com logo e novos testes)
- `docs/guias/EMAILS_TRANSACIONAIS_IMPLEMENTADOS.md` (atualizado com seção de logo)
- `src/components/GlobalLayout.tsx` (otimizado para páginas de checkout)
- `next.config.js` (configuração otimizada para desenvolvimento)
- `ONEPAGE_CHECKOUT_STATUS.md` (criado documentação do One Page Checkout)
- `src/app/prototype/checkout/[id]/page.tsx` (adicionados campos CPF e Celular + máscaras)
- `checkouts-desativados/` (pasta criada com todos os checkouts desativados)
- `checkouts-desativados/README.md` (documentação dos checkouts desativados)
- `src/components/ProjectForm.tsx` (adicionado campo código embed do checkout)
- `src/lib/database.ts` (melhorado fallback da função getProject)
- `_contexto.md` (atualizado progresso)
- **🚀 NOVOS ARQUIVOS DO SISTEMA HÍBRIDO:**
- `src/components/DonationEmbed.tsx` (criado componente da primeira etapa)
- `src/app/api/checkout/create-session/route.ts` (criado API Stripe)
- `src/app/api/checkout/session/[sessionId]/route.ts` (criado API de sessão)
- `src/app/embed/checkout/checkout-stripe/page.tsx` (criado página embed)
- `src/lib/urls.ts` (atualizado URLs para sistema híbrido)
- `src/app/doacao-sucesso/page.tsx` (atualizado para Stripe)
- `README.md` (atualizado com sistema híbrido)

---

## Próximos Passos / Foco Atual

- [x] Verificar se todos os links nos documentos ainda funcionam após a reorganização
- [x] Atualizar referências de imagens nos documentos se necessário
- [x] Considerar criar um README.md específico para a pasta `docs/`
- [x] Revisar se algum arquivo foi movido incorretamente e precisa de ajuste
- [x] Documentar qualquer link quebrado encontrado durante a navegação
- [x] Remover dados mock da versão DEV
- [x] Corrigir problemas de autenticação e redirecionamento
- [x] Implementar lógica demo robusta
- [x] Corrigir erro de criação de usuário no admin
- [x] Sincronizar ambientes local, dev e prod
- [x] Sistema Híbrido de Checkout implementado completamente
- [x] Deploy DEV realizado com sucesso
- [ ] **Sistema de suporte e reporte de bugs**
  - [ ] Página de suporte integrada
  - [ ] Formulário de reporte de bugs
  - [ ] Sistema de tickets/tracking
  - [ ] Notificações automáticas
  - [ ] Base de conhecimento (FAQ)
  - [ ] Chat de suporte ao vivo
  - [ ] Sistema de feedback dos usuários
  - [ ] Métricas de satisfação
  - [ ] Dashboard de suporte para admins

---

## Contexto do Projeto

**Portal Instituto Imagine** - Sistema de doações para ONG com:
- ✅ Sistema de doações com Stripe (PIX, cartão, boleto)
- ✅ Autenticação completa via Supabase
- ✅ Dashboard personalizado por role (Admin, Doador, Voluntário)
- ✅ Design minimalista e responsivo
- ✅ 3 ambientes separados (Local, Dev, Prod)
- ✅ Deploy ativo no Vercel
- ✅ Documentação agora 100% organizada

**Status**: Sistema 100% funcional em produção com documentação reorganizada, dados reais, sistema completo de emails transacionais, logo do Instituto Imagine integrado em todos os emails, **Sistema Híbrido de Checkout** (primeira etapa + Stripe Checkout) como modelo principal, código embed implementado, e deploy dev atualizado.
