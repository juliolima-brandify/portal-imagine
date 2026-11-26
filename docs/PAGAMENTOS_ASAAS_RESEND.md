# 🏗️ Frente 2 — Pagamentos Asaas + E-mails Transacionais Resend (`docs/PAGAMENTOS_ASAAS_RESEND.md`)

- **Modo**: **Mudança crítica** (toca dinheiro, banco/migração, permissões/RLS e integrações externas Asaas + Resend)
- **Branch**: `feat/pagamentos-asaas-resend` (base `main` `78e8298`)
- **Arquivos a criar ou alterar**:
  - Criar: `supabase/migrations/20261126_asaas_payments_and_webhooks.sql`, `src/lib/payments.ts`, `src/lib/payments.test.mjs`, `src/lib/server/asaas.ts`, `src/lib/server/email.ts`, `src/lib/server/donor-provision.ts`, `src/app/api/webhooks/asaas/route.ts`, `src/app/api/admin/donations/route.ts`, `src/app/api/admin/donations/[id]/resend-receipt/route.ts`, `src/app/embed/checkout/page.tsx`
  - Alterar: `package.json`, `src/lib/database.ts`, `src/lib/urls.ts`, `src/lib/export.ts`, `src/lib/validations.ts`, `src/lib/validations-updated.ts`, `src/app/api/checkout/create-session/route.ts`, `src/app/api/checkout/session/[sessionId]/route.ts`, `src/app/api/health/route.ts`, `src/components/site/ImagineSitePage.tsx`, `src/components/DonationEmbed.tsx`, `src/app/embed/checkout/checkout-stripe/page.tsx`, `src/app/embed/checkout/[id]/page.tsx`, `src/app/doacao-sucesso/page.tsx`, `src/app/entrar/page.tsx`, `src/app/doacoes/page.tsx`, `src/app/doacoes/[id]/page.tsx`, `src/app/historico/page.tsx`, `src/app/admin/doacoes/page.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/admin/relatorios/page.tsx`, `src/app/contato/page.tsx`, `src/app/sobre/page.tsx`
  - Remover: `src/lib/stripe.ts`, `src/lib/stripe-integration.ts`, `src/components/StripePaymentForm.tsx`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/payments/create-intent/route.ts`, `src/app/payments/page.tsx`, `src/app/prototype/checkout/[id]/page.tsx`, `src/lib/resend.ts`, `src/lib/email-service.ts`, `src/lib/email-config.ts`

---

## Fase 2 — As Duas Listas (`🏗️ O Arquiteto`)

### Lista 1: Regras que não podem quebrar

| # | Regra (e quem decidiu) | Formas de falha que precisa suportar | Teste que prova |
|---|---|---|---|
| **R1** | **Zero Stripe no sistema**: o projeto nunca carrega nem expõe SDKs, rotas, telas protótipo ou textos do Stripe, operando 100% no Asaas Checkout (`POST /v3/checkouts`) para Pix, Cartão e Assinatura Recorrente (Julio Lima — `1A` + `2A`) | Links legados apontando para `/embed/checkout/checkout-stripe`; referências antigas em `export.ts`, `/contato`, `/sobre`, `/api/health` | `src/lib/payments.test.mjs` (varredura estática de imports/dependências Stripe) + `npx.cmd vinext build` |
| **R2** | **Isolamento Server-Only e Zero Segredos em `dist/client`**: módulos client (`database.ts`, componentes `'use client'`) nunca importam clientes Asaas, Resend ou `supabaseAdmin`, e nenhum segredo vaza para `dist/client` (Julio Lima / Contexto Geral) | Import indireto via `database.ts`; variáveis `ASAAS_*`, `RESEND_*` ou `SUPABASE_SERVICE_ROLE_KEY` embutidas no bundle do navegador | `src/lib/payments.test.mjs` + inspeção automatizada dos artefatos de `dist/client` após `npx.cmd vinext build` |
| **R3** | **Webhook Asaas Blindado, Atômico e Idempotente**: `POST /api/webhooks/asaas` só processa eventos com `asaas-access-token` válido em tempo constante (`timingSafeEqual`), nunca processa o mesmo `event.id` duas vezes, nunca duplica `projects.current_amount` e sempre responde `200 OK` rápido executando e-mails em background (`waitUntil`/`after`) (Arquitetura / Segurança) | Token ausente ou inválido (`401`); payload > 256 KB (`413`); entrega *at-least-once* repetida; `PAYMENT_RECEIVED` após `PAYMENT_CONFIRMED` na mesma cobrança; 2ª mensalidade de assinatura recorrente (`asaas_subscription_id`); `CHECKOUT_EXPIRED` atrasado após doação já `completed`; estorno `PAYMENT_REFUNDED` | `src/lib/payments.test.mjs` (máquina de estados, token timing-safe, recorrência e fora de ordem) + função atômica `apply_asaas_webhook_event` na migração SQL |
| **R4** | **Verdade Financeira, Carimbo por Projeto e Limites Reais da API Asaas**: toda cobrança exige valor `>= R$ 5,00` calculado em centavos inteiros, carimba `items[0].name` com `<= 30` caracteres e `description` com o nome completo do projeto/campanha, usa `callback` HTTPS público válido, emite recibos exclusivamente com o CNPJ oficial `14.351.728/0001-72` e nunca marca pagamento como confirmado só pela URL `/doacao-sucesso` (Julio Lima / Cofre) | Nome de projeto longo (> 30 chars gerando HTTP 400 no Asaas); `localhost` em `callback` gerando HTTP 400 no Asaas; conta Sandbox sem chave Pix cadastrada; ponto flutuante (`19.99 * 100`); doador voltando para `/doacao-sucesso` antes de pagar o Pix | `src/lib/payments.test.mjs` (`buildAsaasCheckoutPayload`, centavos, truncamento `<= 30`, `callback` HTTPS, recibo CNPJ oficial) |
| **R5** | **Privacidade de Dados (Anti-IDOR / Zero PII Público) e Anti-Injeção**: `/api/checkout/session/[sessionId]` nunca expõe `donor_email`, `donor_name` ou CPF; `/doacoes/[id]` só exibe doação pertencente ao `auth.uid()` autenticado; e-mails escapam HTML (`escapeHtml`) e exportações CSV/Excel neutralizam fórmulas (`=`, `+`, `-`, `@`) (Segurança / LGPD) | Tentativa de enumerar UUIDs em `/api/checkout/session/[id]` ou `/doacoes/[id]`; nome/mensagem com `<script>` ou `<img onerror>` no e-mail; mensagem começando com `=CMD()` no CSV admin | `src/lib/payments.test.mjs` (`sanitizePublicSessionResponse`, `escapeHtml`, `sanitizeSpreadsheetCell`) |
| **R6** | **Conta Automática Segura sem Senha em Texto Plano (`3A`)**: ao confirmar doação com e-mail válido, o servidor cria/vincula o usuário (`role = 'donor'`) via `supabaseAdmin` e gera link seguro de definição de senha (`generateLink` → `/entrar?reset=true`), onde o doador define a própria senha sem jamais trafegar senha em texto plano por e-mail (Julio Lima — `3A`) | Doador que já possui conta no Portal (apenas vincula `user_id` sem recriar e sem sobrescrever `role` de `admin`/`volunteer`); doação anônima ou sem e-mail no Asaas; link de recuperação aberto em `/entrar?reset=true` | `src/lib/payments.test.mjs` (regras de provisionamento e proteção de `role`) + fluxo `PASSWORD_RECOVERY` em `src/app/entrar/page.tsx` |
| **R7** | **Resiliência do Resend (`mail.imagineinstituto.com`) e Reenvio Admin**: todo envio usa o domínio já verificado `mail.imagineinstituto.com` (preservando 100% os 10 registros Hostinger na zona raiz), falha ou cota `429` (`100/dia UTC`) no Resend nunca derruba o webhook nem reverte a doação, e `/admin/doacoes` reenvia recibo por rota real protegida por `requireAdmin()` + `verifyAdminMutationOrigin()` (Julio Lima — `4`) | Resend retornando `429` ou timeout; doação sem `donor_email` (`422` amigável no reenvio manual); duplo clique em "Reenviar Recibo" | `src/lib/payments.test.mjs` + rota `/api/admin/donations/[id]/resend-receipt` |
| **R8** | **Menor Privilégio no Postgres e Compatibilidade com Projetos Dinâmicos e Campanhas**: `public.donations` e `public.webhook_events` têm RLS ativo sem acesso `anon`, escritas exclusivas via `service_role`, e suportam tanto projetos de `public.projects` quanto doações institucionais (`'geral'` e `'natal'` com `project_id IS NULL` + `campaign_slug`) sem quebrar `update_project_amount` (Arquitetura) | Doação para *"Onde for mais necessário"* ou *"Natal Feliz 2026"* com `project_id = NULL` disparando trigger em `projects`; cliente `anon` tentando `SELECT` ou `INSERT` direto em `donations` | Revisão de `supabase/migrations/20261126_asaas_payments_and_webhooks.sql` + `src/lib/payments.test.mjs` |

### Lista 2: Pendências de regra de negócio

| # | Pergunta | Quem responde | Comportamento até a resposta |
|---|---|---|---|
| — | *Nenhuma pendência bloqueante para a Frente 2* (`1A`, `2A`, `3A` e `4` decididas por Julio Lima em 26/11/2026; domínio `mail.imagineinstituto.com` verificado no Resend; chave Pix EVP ativa na conta Asaas de produção). | — | As pendências institucionais globais (`irAtivo: false` e badges `.pend` de metas/beneficiários) permanecem inalteradas conforme `CONTEXTO_GERAL_IMAGINE.md`. |

---

## Roteiro dos 5 Blocos

### 1. 🕵️ Segurança, Permissões e Dados (Contrato do *Invasor*)
- **Rotas e Permissões**:
  - `POST /api/checkout/create-session`: pública para doadores autenticados ou visitantes; valida payload via Zod, resolve `user_id` exclusivamente pelo token/cookie real no servidor (nunca confia em `userId` enviado no body!) e grava via `supabaseAdmin`.
  - `GET /api/checkout/session/[sessionId]`: pública com `jsonNoStore()`, retornando apenas resumo sem PII (`status`, `amount`, `projectTitle`, `isRecurring`, `recurringFrequency`, `paymentMethod`).
  - `POST /api/webhooks/asaas`: exige `asaas-access-token` validado com `timingSafeEqual` (SHA-256) e limita corpo a `256 KB`.
  - `GET /api/admin/donations` e `POST /api/admin/donations/[id]/resend-receipt`: exigem `requireAdmin()` (`401`/`403`) + `verifyAdminMutationOrigin()` nas mutações + `jsonNoStore()`.
- **Anti-IDOR**: `/doacoes` e `/doacoes/[id]` filtram `user_id = auth.uid()` (reforçado por RLS no Postgres).
- **Banco de Dados**: `REVOKE ALL ON public.donations, public.webhook_events FROM PUBLIC, anon, authenticated`, concedendo `SELECT` apenas de colunas necessárias de `donations` para `authenticated` sob RLS (`user_id = (SELECT auth.uid())` ou `admin`), e `ALL` apenas para `service_role`. Funções `SECURITY DEFINER` com `SET search_path = pg_catalog, public, pg_temp`.

### 2. 🤪 Regras de Domínio e Casos Extremos (Contrato do *Usuário Confuso*)
- **Precisão Matemática**: Valores validados e somados em **centavos inteiros** (`Math.round(v * 100)`), bloqueando valores `< 500` centavos (`R$ 5,00`) e `> 50000000` centavos (`R$ 500.000,00`, teto PJ do Asaas).
- **Limites Reais da API Asaas (comprovados em Sandbox)**:
  - `items[0].name`: truncado de forma limpa em até **30 caracteres** (ex.: `Doacao - Projeto Amarelinha`), mantendo o título completo em `items[0].description` (`<= 100` chars).
  - `callback`: se a origem da requisição for `localhost`/`127.0.0.1`, usa `NEXT_PUBLIC_BASE_URL` (`https://imagineinstituto.com`) para não tomar HTTP `400` do validador de URL do Asaas.
- **Fuso Horário**: `subscription.nextDueDate` calculado explicitamente no fuso `America/Sao_Paulo`.
- **Duplo Clique e Concorrência**: Botões de checkout e de admin travados durante `await` (`processing` + `useRef` lock); no banco, `webhook_events.event_id` (`PRIMARY KEY`) e `SELECT ... FOR UPDATE` dentro de `apply_asaas_webhook_event` eliminam condições de corrida.

### 3. 🧓 Arquitetura, Transações e Escala (Contrato do *Programador Sênior*)
- **Regra Pura Extraída**: `src/lib/payments.ts` concentra validação, centavos, montagem do payload Asaas, máquina de estados do webhook, escape HTML, proteção CSV e formatação de recibo.
- **Transação Atômica no Banco**: A RPC `public.apply_asaas_webhook_event` grava em `webhook_events` e atualiza/insere em `donations` na mesma transação Postgres (disparando `update_project_amount` exatamente uma vez por transição para `completed`).
- **Paginação e Anti-N+1**: `/api/admin/donations` pagina no servidor (`range(from, to)`) e resolve projetos/perfis em lote (`in('id', ids)`), sem queries em loop.
- **Workers Lifecycle**: Uso de `waitUntil` (via `cloudflare:workers` quando disponível no runtime Worker, com fallback seguro em dev) para enviar e-mails sem atrasar o `200 OK` do Asaas.

### 4. 🎨 Gabarito de Tela Irmã e os 8 Pontos Visuais (Contrato do *Designer*)
- **Telas e Modais Irmãos de Gabarito**:
  - **Admin (`/admin/doacoes`)**: clona a geometria aprovada na Banca de `src/app/admin/blog/page.tsx` + `Modal` de 3 zonas de `src/components/ConfirmDialog.tsx`.
  - **Site Institucional (Modal de Doação `.ii-root`)**: mantém a geometria nativa de `src/components/site/ImagineSitePage.tsx` + `src/components/site/imagine-site.css`.
- **Verificação dos 8 Pontos**:
  1. **Abas e Rolagem**: Zero abas empilhadas e zero barra de rolagem horizontal aparente (`whitespace-nowrap`).
  2. **Barra de Filtros (`Toolbar`)**: Em `/admin/doacoes`, `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end` com `input-modern h-12 !py-0` e `btn-secondary w-full h-12 !py-0 flex items-center justify-center`.
  3. **Menus Flutuantes e Dicas**: Zero atributo `title=` nativo do HTML; botão direto `Exportar CSV` no topo sem popover cortado por `overflow-hidden`.
  4. **Janelas / Modais (3 Zonas)**: `<Modal>` de `ConfirmDialog.tsx` com cabeçalho fixo (`border-b`), corpo com rolagem limpa (`overflow-y-auto`, sem caixas triplamente aninhadas) e rodapé fixo (`border-t`) com `Fechar` (`type="button"`) e `Reenviar Recibo` travado durante `await`.
  5. **Alinhamento e Tabelas**: Todo `<th>` tem exatamente o mesmo alinhamento (`text-left` ou `text-right`) do seu `<td>`; colunas `Valor` (`text-right tabular-nums whitespace-nowrap`) e `Data` (`text-left tabular-nums whitespace-nowrap`).
  6. **Cabeçalho Global**: Único `<h1>` por página (`text-3xl font-bold text-gray-900 mb-2`), respeitando `GlobalLayout` e `AdminLayout`.
  7. **Contraste**: Classes e tokens de alto contraste consistentes tanto nas telas claras do Portal/Admin quanto nas seções `.ii-root` (`.escuro` e creme `#FBF8F3`).
  8. **Decisão Informada**: Antes de redirecionar ao Asaas, o doador vê claramente projeto escolhido, valor formatado em `R$`, periodicidade (`Única` ou `Mensal`/`Trimestral`/`Anual`) e aviso *"Pagamento seguro via Asaas (Pix ou Cartão)"*; no modal Admin, o operador vê `donorEmail`, status e data do último envio antes de reenviar o recibo.

### 5. 🧪 Matriz de Prova Real (Contrato do *Testador*)
- **Testes Unitários de Regra Pura (`src/lib/payments.test.mjs`)**:
  - Conversão/soma em centavos, limites `R$ 5,00`..`R$ 500.000,00`, truncamento `items[0].name <= 30` chars, `callback` HTTPS contra `localhost`, fuso `America/Sao_Paulo`.
  - Verificação `timingSafeEqual` de `asaas-access-token`, máquina de estados para eventos duplicados, fora de ordem (`PAYMENT_RECEIVED` após `PAYMENT_CONFIRMED`, `CHECKOUT_EXPIRED` após `completed`), estornos (`PAYMENT_REFUNDED`) e renovação de assinatura (`asaas_subscription_id` com novo `payment.id`).
  - Sanitização anti-XSS (`escapeHtml`), anti-CSV Formula Injection (`sanitizeSpreadsheetCell`), omissão de PII em `sanitizePublicSessionResponse` e recibo com CNPJ `14.351.728/0001-72`.
  - Auditoria automatizada de código/bundle: verifica ausência de dependências Stripe em `package.json`, ausência de imports proibidos em `src/lib/database.ts` e zero segredos/SDKs de servidor em `dist/client`.
- **O que o teste unitário não cobre sozinho (e como validamos)**:
  - Aplicação da migração SQL `20261126_asaas_payments_and_webhooks.sql` no banco de produção `zzxtethlsdjjfjjrqmlk` (fica pendente para pós-`/banca`, conforme regra de Mudança Crítica; o servidor tem fallback gracioso caso a RPC ainda não exista em dev).
