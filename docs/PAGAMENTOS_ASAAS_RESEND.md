# 🏗️ Frente 2 — Pagamentos Asaas + E-mails Transacionais Resend (`docs/PAGAMENTOS_ASAAS_RESEND.md`)

- **Branch**: `feat/pagamentos-asaas-resend` (base `main` `78e8298`)
- **Migração SQL prevista**: `supabase/migrations/20261126_asaas_payments_and_webhooks.sql` (colunas Asaas em `public.donations`, suporte a doação geral/campanha com `project_id` opcional + `campaign_slug`, tabela de idempotência `public.webhook_events` e RLS de menor privilégio)
- **Decisões marteladas por Julio Lima (25–26/11/2026)**:
  - **P1 → R9 (1A — Tudo pelo Asaas)**: **Pix avulso, Cartão de Crédito e Doação Recorrente** rodam 100% pelo **Asaas**, eliminando conciliação manual e carimbando cada cobrança com descrição clara do projeto (`"Doação - <Projeto>"`) + `externalReference = donation.id` para separação automática tanto no extrato do Asaas quanto no Portal Imagine.
  - **P2 → R10 (2A — Tela Segura Hospedada do Asaas)**: Uso do **Asaas Checkout (`POST /v3/checkouts`)**. O doador escolhe projeto (incluindo os projetos dinâmicos do Supabase, *"Onde for mais necessário"* e *"Natal Feliz 2026"*), valor (mínimo `R$ 5,00`), frequência (`Única` ou `Mensal` / `Trimestral` / `Anual`), opção anônima e mensagem no nosso site/modal, finaliza na página segura hospedada do Asaas (`asaas.com/checkoutSession/show?id=<id>` ou Sandbox) e retorna para `/doacao-sucesso`. Zero coleta de dados de cartão/CEP/CPF no nosso frontend.
  - **P3 → R11 (3A — Conta Automática Segura no Portal)**: Na 1ª doação confirmada via webhook com e-mail válido, o servidor cria/vincula automaticamente o doador no Supabase Auth + `public.profiles` (`role = 'donor'`) via `supabaseAdmin` e envia no e-mail de confirmação um **link seguro de acesso/definição de senha** (`generateLink`), **nunca** senha temporária em texto plano.
  - **P4 → R12 (Resend Transacional 3.000/mês)**: Ativação do **Resend** no plano grátis (`3.000/mês` · `100/dia UTC`, com upgrade futuro se necessário), focado nos e-mails transacionais 1-para-1 (recibo/confirmação com acesso ao Portal, aviso para `ADMIN_NOTIFY_EMAIL`, alerta de falha/estorno e reenvio manual de recibo em `/admin/doacoes`), 100% isolado no servidor e sem tocar nos 10 registros DNS corporativos da Hostinger.

---

## 1. 🎯 Propósito e Problema Real (PRD do `/conselho`)
- **Problema raiz**: O Portal ainda carrega o legado inativo do Stripe (`stripe`, `@stripe/*`, rotas e componentes quebrados, recibo com CNPJ falso `12.345.678/0001-90` em `src/app/doacoes/page.tsx`) e acopla `src/lib/resend.ts` dentro de `src/lib/database.ts`, puxando código server-only para o bundle client (`dist/client`) na Cloudflare Workers.
- **Público-Alvo / Quem vive isso (🎭 Mímico)**: Doadores PF/PJ no celular ou computador em `imagineinstituto.com` e `portal.imagineinstituto.com` + equipe financeira/administrativa do Instituto em `/admin/doacoes` e no extrato do Asaas *(persona presumida + áudio real da operação validando necessidade de separação automática por projeto sem cadastro manual no Asaas)*.
- **Resultado esperado no negócio (💼 Cofre)**: Recebimento real em produção via Asaas (Pix R$ 1,99 / R$ 0,99 promocional; Cartão à vista 2,99% + R$ 0,49 / 1,99% + R$ 0,49 promocional; mínimo R$ 5,00), saldo `projects.current_amount` e relatórios separados por projeto atualizados exclusivamente por webhook autenticado e recibos automáticos com o CNPJ oficial **`14.351.728/0001-72`**.
- **Hipóteses a monitorar após subida**:
  1. Taxa de conversão entre clique em *"Continuar para pagamento"* e evento `CHECKOUT_PAID` / `PAYMENT_CONFIRMED` (medir funil sem cookies no Umami).
  2. Consumo diário da cota de `100 e-mails/dia UTC` do plano grátis do Resend em dias de pico de campanha (como Natal Feliz).

---

## 2. ⚡ Jornada Sem Atrito (Fluxo Ponta a Ponta)
1. **Escolha no Site ou Portal**: Em qualquer botão *"Quero doar"* da Home `/`, `/projetos/[slug]`, `/natal-feliz`, `/projetos` do Portal ou `/embed/checkout`, o doador seleciona o destino (projeto específico, *"Onde for mais necessário"* ou *"Natal Feliz 2026"*), valor (`R$ 50`, `R$ 100`, `R$ 200` ou personalizado `>= R$ 5,00`), recorrência (`Única` ou `Mensal` / `Trimestral` / `Anual`), doação anônima e mensagem opcional.
2. **Criação da Sessão (`POST /api/checkout/create-session`)**:
   - Valida o payload (Zod), resolve o projeto no Supabase (quando aplicável), grava a doação `pending` em `public.donations` via `supabaseAdmin` e chama `POST /v3/checkouts` no Asaas (`DETACHED` com `["PIX", "CREDIT_CARD"]` para doação única; `RECURRENT` com `["CREDIT_CARD"]` + `subscription.cycle` para recorrente; pré-preenche `customerData` se o doador já estiver autenticado).
   - Redireciona `window.top.location.href` para a tela segura do Asaas. *(Fallback seguro para WhatsApp apenas se o Asaas estiver indisponível ou não configurado no ambiente.)*
3. **Retorno e Confirmação Assíncrona**:
   - `/doacao-sucesso` consulta endpoint seguro sem expor PII e distingue claramente *"Aguardando confirmação do pagamento (Pix/Cartão)"* de *"Doação confirmada!"* — nunca aprova pagamento apenas pela URL de retorno.
   - `POST /api/webhooks/asaas` valida `asaas-access-token`, registra `event.id` de forma idempotente, atualiza `donations` (`completed`, `failed` ou `refunded`), cria/vincula a conta do doador (`3A`) e dispara e-mails no Resend via `after()` / `waitUntil()` antes/após responder `200 OK` rápido.

---

## 3. 🔒 Regras Decididas (entram como "regras que não podem quebrar" no `/desenvolvimento`)

- **R1 — Remoção Total do Stripe (decidida por Julio Lima / Contexto Geral):**
  - *Regra:* Remover 100% dos pacotes `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, arquivos `src/lib/stripe.ts`, `src/lib/stripe-integration.ts`, `src/components/StripePaymentForm.tsx`, rotas `/api/webhooks/stripe`, `/api/payments/create-intent`, páginas protótipo `/payments` e `/prototype/checkout/[id]`, e menções a "Stripe" na UI (`/contato`, `/sobre`, `DonationEmbed`, `embed/checkout`, `/api/health`, `export.ts`). Manter redirect/compatibilidade em `/embed/checkout/checkout-stripe` apontando para a nova rota limpa `/embed/checkout` para não quebrar links antigos.
  - *Prova:* Busca global por `stripe` em `src/` e `package.json` (restando apenas coluna legada se mantida por compatibilidade ou migrada, e rota de redirect se aplicável) + `npx.cmd vinext build`.
- **R2 — Isolamento Server-Only e Zero Segredos em `dist/client` (decidida por Julio Lima):**
  - *Regra:* `src/lib/database.ts` e qualquer módulo importado por componentes `'use client'` nunca importam `resend`, `email-config`, `email-service`, `asaas` ou `supabaseAdmin`. Os clientes de Asaas e Resend vivem em `src/lib/server/*` com `import 'server-only'` e usam `fetch` nativo compatível com Cloudflare Workers (`workerd`).
  - *Prova:* Teste automatizado/inspeção sobre `dist/client` após `npx.cmd vinext build` garantindo zero ocorrência de `RESEND_API_KEY`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` ou `api.resend.com`.
- **R3 — Webhook Asaas Blindado e Idempotente na Cloudflare Workers (Arquitetura / Segurança):**
  - *Regra:* `POST /api/webhooks/asaas` exige header `asaas-access-token` validado com `timingSafeEqual` (SHA-256) contra `ASAAS_WEBHOOK_TOKEN` (`401` com `Cache-Control: no-store` se ausente/inválido), grava `event.id` em `public.webhook_events` para idempotência *at-least-once*, atualiza `donations` de forma atômica evitando dupla contagem em `projects.current_amount` (`CHECKOUT_PAID` / `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` / `PAYMENT_REFUNDED`) e executa envios de e-mail em `after()` / `waitUntil()` com `try/catch` isolado para responder `200 OK` rápido e nunca travar a fila do Asaas (que pausa após 15 erros consecutivos).
  - *Prova:* Testes unitários do processador de webhook cobrindo token inválido, evento duplicado, transição `pending → completed`, `PAYMENT_RECEIVED` após `PAYMENT_CONFIRMED` (sem somar 2x) e estorno `completed → refunded`.
- **R4 — Verdade Financeira, Separação por Projeto e CNPJ Oficial (Cofre / Operação):**
  - *Regra:* Toda sessão criada no Asaas envia `items[0].name` e `description` identificados com o nome do projeto/campanha (ex.: `"Doação - Projeto Amarelinha"`, `"Doação - Natal Feliz 2026"`, `"Doação - Onde for mais necessário"`) e `externalReference = donation.id`. Todos os recibos e telas usam o CNPJ oficial **`14.351.728/0001-72`** (corrigindo o CNPJ incorreto em `src/app/doacoes/page.tsx`), e `/doacao-sucesso` nunca marca pagamento como confirmado sem confirmação no banco.
  - *Prova:* Testes unitários de montagem do payload Asaas + verificação de CNPJ e status em `/doacao-sucesso` e recibos.
- **R5 — Privacidade de Dados (LGPD) e Anti-XSS em E-mails (Segurança):**
  - *Regra:* Endpoints públicos consultados por `/doacao-sucesso` retornam apenas metadados não sensíveis da doação (`status`, `amount`, `projectTitle`, `isRecurring`), jamais expondo `donor_email`, `donor_name` ou CPF sem sessão autenticada. Todos os templates HTML de e-mail aplicam `escapeHtml()` em qualquer dado vindo do usuário (`name`, `projectTitle`, `message`).
  - *Prova:* Testes unitários de `escapeHtml` e sanitização do retorno público da sessão de checkout.
- **R6 — Conta Automática Segura sem Senha em Texto Plano — Decisão 3A (decidida por Julio Lima):**
  - *Regra:* Remover `createUserFromDonation` de `src/lib/database.ts` (que usava `supabase.auth.signUp` anon e enviava senha em texto plano). No webhook confirmado, se houver `donor_email`, o servidor garante o usuário/perfil via `supabaseAdmin` (`role = 'donor'`) vinculando `donations.user_id` e gera link seguro de primeiro acesso/definição de senha (`supabaseAdmin.auth.admin.generateLink`) apontando para `NEXT_PUBLIC_BASE_URL` / `portal.imagineinstituto.com`.
  - *Prova:* Teste unitário do fluxo de provisionamento de doador (novo e-mail vs e-mail já existente em `profiles`).
- **R7 — Integridade do DNS Hostinger e Resiliência de E-mail — Decisão 4 (decidida por Julio Lima):**
  - *Regra:* A verificação do domínio no Resend usa o subdomínio de Return-Path (`send.imagineinstituto.com` para MX/SPF + `resend._domainkey` para DKIM), **sem alterar nem ativar proxy** nos 10 registros corporativos da Hostinger na zona Cloudflare `imagineinstituto.com`. Erro HTTP ou limite `429` (`100/dia UTC`) no Resend é registrado em log sem reverter a confirmação financeira da doação, e `/admin/doacoes` ganha endpoint real protegido por `requireAdmin()` + `verifyAdminMutationOrigin()` para reenviar recibo.
  - *Prova:* Teste unitário garantindo que falha no Resend não derruba o webhook + teste de autorização (`401`/`403`) na rota admin de reenvio de recibo.
- **R8 — Menor Privilégio no Banco (`public.donations` e `public.webhook_events`) e Compatibilidade com Frente 1:**
  - *Regra:* `public.donations` e `public.webhook_events` operam com RLS ativo (`ENABLE ROW LEVEL SECURITY`): `anon` não tem `SELECT`/`INSERT`/`UPDATE`/`DELETE`; `authenticated` lê apenas as próprias doações (`auth.uid() = user_id`) ou todas se `role = 'admin'`; escritas acontecem exclusivamente via `service_role` (`supabaseAdmin`). Suporta tanto os projetos dinâmicos de `public.projects` quanto doações institucionais gerais (`project_id IS NULL` com `campaign_slug = 'geral' | 'natal'`).
  - *Prova:* Revisão da migração SQL seguindo o padrão de `20261125_harden_rls_and_remove_framer_trigger.sql` + testes das regras puras.

---

## 4. ❓ Pendências de Regra de Negócio
- **Nenhuma pendência bloqueante de produto para a Frente 2** (`1A`, `2A`, `3A` e `4` marteladas por Julio Lima em 26/11/2026; chaves `ASAAS_API_KEY`, `ASAAS_API_KEY_SANDBOX`, `RESEND_API_KEY` e `ADMIN_NOTIFY_EMAIL` já presentes em `.env.local`).
- **Pendências institucionais herdadas do Contexto Geral (não bloqueiam a Frente 2)**:
  - `irAtivo: false` (leis de incentivo ainda em preparação) e badges `.pend` de metas/beneficiários.
- **Checklist operacional de virada em produção (após `/desenvolvimento` + `/banca`)**:
  1. Aplicar `supabase/migrations/20261126_asaas_payments_and_webhooks.sql` no Supabase `zzxtethlsdjjfjjrqmlk`.
  2. Verificar o domínio `imagineinstituto.com` (Return-Path `send`) no painel do Resend adicionando apenas os registros `send` e `resend._domainkey` (`proxied: false`) na zona Cloudflare sem tocar nos registros Hostinger.
  3. Subir os secrets no Worker `instituto-imagine` (`ASAAS_ENV`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_NOTIFY_EMAIL`) e registrar o webhook `https://imagineinstituto.com/api/webhooks/asaas` no Asaas.
  4. Garantir `https://portal.imagineinstituto.com/**` nas Redirect URLs do Supabase Auth (para o link de acesso `3A`).

---

## 5. 🧓 Diretriz Técnica e Gabarito de Tela Irmã
- **Base existente a reaproveitar**:
  - `src/lib/supabase-admin.ts`, `src/lib/admin-auth.ts` (`requireAdmin()`) e `src/lib/admin-http.ts` (`jsonNoStore`, `verifyAdminMutationOrigin`).
  - Padrão `safeEqual` (`createHash` + `timingSafeEqual` de `node:crypto`) de `src/app/api/webhooks/supabase-projects/route.ts`.
  - Catálogo dinâmico `src/lib/site-projects.ts` / `src/lib/site-projects-server.ts` da Frente 1.
- **Gabarito de Tela Irmã**:
  - **Modal Institucional (`.ii-root`)**: `src/components/site/ImagineSitePage.tsx` + `src/components/site/imagine-site.css` — manter a estética limpa do modal atual (seleção de projeto, botões de valor, campo de outro valor, recorrência, opção anônima/mensagem opcional e botão direto *"Continuar para pagamento seguro"* redirecionando ao Asaas Checkout, sem iframe apertado quando desnecessário).
  - **Admin (`/admin/doacoes`)**: alinhar filtros, tabela, modais (`ConfirmDialog.tsx`) e ações reais ao padrão aprovado em `src/app/admin/projetos/page.tsx` e `src/app/admin/blog/page.tsx`, removendo dados falsos (`'email@exemplo.com'`) e botões stub sem backend.

---

## 6. ✂️ Escopo Cortado (Inimigo do Atrito)
- ❌ **Boleto bancário**: Cortado por compensação lenta e alto índice de abandono em doações.
- ❌ **Formulário próprio de cartão de crédito (Checkout Transparente)**: Cortado por decisão `2A` (elimina coleta de CEP/endereço/cartão no site e escopo PCI-DSS na Worker).
- ❌ **`POST /v3/paymentLinks` fixos por projeto**: Cortado em favor de `POST /v3/checkouts` dinâmico (zero cadastro manual no Asaas para a equipe do Instituto).
- ❌ **Disparo de e-mails de marketing em massa pelo Portal nesta entrega**: Cortado para proteger a cota transacional diária (`100/dia UTC`) do plano grátis do Resend (notícias públicas já contam com `/blog` da Frente 3).
