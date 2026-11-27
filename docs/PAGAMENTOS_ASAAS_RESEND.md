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

---

## Correções da Banca de Revisão (26/11/2026)

Esta seção complementa as duas listas acima com as regras e decisões que a `/banca` do commit `7fef677` levantou. **Nenhuma migração nova vai a produção antes da `/banca` aprovar este commit.**

### Regras adicionais (não podem quebrar)

| # | Regra (e quem decidiu) | Formas de falha que precisa suportar | Teste que prova |
|---|---|---|---|
| **R9** | **Fallback do webhook não existe em produção**: sem a RPC `apply_asaas_webhook_event`, a rota responde `503` e o Asaas reenvia; nunca processa o evento por caminho alternativo (Julio Lima — banca 26/11/2026) | Migração não aplicada; `PGRST202`/`42883`; evento repetido sem `webhook_events` | `payments.test.mjs` (varredura da rota); contrato de rota contra banco real pendente |
| **R10** | **Reembolso parcial é parcial**: `PAYMENT_PARTIALLY_REFUNDED` grava `refunded_amount` e status `partially_refunded`, sem estorno total e sem subtrair o valor inteiro de `projects.current_amount` (Julio Lima — banca 26/11/2026) | Estorno de R$ 10 numa doação de R$ 100; estorno total depois de parcial; evento fora de ordem | `payments.test.mjs` (máquina de estados) + trigger `update_project_amount` na migração |
| **R11** | **Vínculo de doação por e-mail é exato**: `donor-provision` compara e-mail normalizado por igualdade, nunca por `ilike` com curingas (`_`, `%`) (Julio Lima — banca 26/11/2026) | `joao_silva@x.com` casando com `joao.silva@x.com`; e-mail com `%`; e-mail de terceiro | `payments.test.mjs` (`escapeLikePattern`) |
| **R12** | **Leitura do doador usa colunas concedidas**: `getDonations`/`getUserDonationById` listam colunas explícitas e nunca `select('*')` sob `GRANT` por coluna (Julio Lima — banca 26/11/2026) | `SELECT *` exigindo `donor_email`/`donor_name` sem `GRANT`; lista vazia silenciosa | `payments.test.mjs` (varredura de `database.ts`) + `SET ROLE authenticated` no banco |
| **R13** | **`ASAAS_ENV` é explícito**: sem `ASAAS_ENV`, o sistema falha fechado e não escolhe sandbox/produção por `NODE_ENV` (Julio Lima — banca 26/11/2026) | `NODE_ENV` diferente de `production` com chave de produção; chave sandbox com produção | `payments.test.mjs` (varredura de `asaas.ts`) |
| **R14** | **Callback do checkout é allowlist**: `successUrl`/`cancelUrl` só apontam para hosts aprovados; `Origin` do request não é autoridade (Julio Lima — banca 26/11/2026) | `Origin: https://atacante.example`; host com subdomínio parecido; `localhost` em dev | `payments.test.mjs` (`resolvePublicCallbackBaseUrl`) |
| **R15** | **Zero Stripe na árvore ativa**: sem coluna, rota, guia, env ou texto Stripe em `src/`, `supabase/` e `config/`; a coluna legada é migrada para `asaas_payment_id` e removida (Julio Lima — banca 26/11/2026) | Coluna `stripe_payment_intent_id`; `/embed/checkout/checkout-stripe`; guias `docs/guias/STRIPE_*` | `payments.test.mjs` (varredura de `src/`, `supabase/`, `config/`) |
| **R16** | **Totais do admin não são truncados**: métricas e busca percorrem todas as páginas do PostgREST (ou agregam no Postgres), nunca `limit(5000)`/`limit(1000)` silencioso (Julio Lima — banca 26/11/2026) | Mais de 1.000 doações; busca fora do lote recente; KPI subestimada | `payments.test.mjs` (varredura de `admin/donations/route.ts`) |
| **R17** | **Reenvio de recibo é idempotente no servidor**: `receipt_lock_at`/`receipt_sent_at` impedem dois envios simultâneos e o modal Admin pede confirmação com status e data do último envio (Julio Lima — banca 26/11/2026) | Duplo clique; duas abas; clique sem confirmação | `payments.test.mjs` (varredura da rota); teste manual de concorrência pendente |

### Decisões tomadas no interrogatório (26/11/2026)

| # | Pergunta | Decisão |
|---|---|---|
| **D1** | Coluna `stripe_payment_intent_id` | Migrar os valores para `asaas_payment_id` onde estiver vazio e **dropar a coluna**; remover do `GRANT` e do CHECK `stripe_legacy`. |
| **D2** | Reembolso parcial | **Estorno parcial real** com `refunded_amount` + status `partially_refunded`; o trigger desconta só o delta. |
| **D3** | Conta automática para e-mail de terceiro | **Mantida a regra 3A** (cria conta e envia link de senha), registrada como pendência de produto para revisão de anti-phishing. |
| **D4** | Checkbox "Lembrar-me" | **Implementada a persistência**: o checkbox grava a preferência e o storage do Supabase alterna entre `localStorage` (lembrar) e `sessionStorage` (não lembrar). Padrão: lembrar. |
| **D5** | E-mail do doador é obrigatório? | **Não é obrigatório** (Julio, 26/11/2026). Sem e-mail, a doação é registrada e o recibo não é enviado; o admin vê "Não informado". |
| **D6** | Doação anônima | **Mantida como flag de exibição** (Julio, 26/11/2026): oculta o nome em relatórios e dashboard, mas o admin continua vendo o nome real em `/admin/doacoes` para conciliar o pagamento. |

### Pendências que continuam abertas (não bloqueiam este commit)

| # | Pergunta | Comportamento até a resposta |
|---|---|---|
| **P2** | Política de retenção de `webhook_events.payload` (contém dados do pagador) | Sem expurgo automático; RLS e `REVOKE` já bloqueiam `anon`/`authenticated`. |
| **P3** | Formato de `subscription.nextDueDate` aceito pelo Asaas | Passa a enviar `YYYY-MM-DD` (formato documentado); validar no sandbox antes do go-live. |
| **P4** | Lista de eventos assinados no painel do Asaas | Eventos sem `targetStatus` são ignorados (não criam linha `pending`). |

## Correções da Banca R3 sobre `a607706` (commit de correção `fix(pagamentos)`)

Brief: `docs/PROMPT-CORRECAO-banca-a607706.md`. Decisões D7–D10 aceitas como recomendadas pelo Julio.

### Decisões aplicadas

| # | Decisão | Como ficou no código |
|---|---|---|
| **D7** | Recibo de doação parcialmente estornada: detalhado | `getReceiptAmounts` (doado / estornado / líquido) é a fonte única do TXT baixado, do e-mail e do assunto (`buildDonorReceiptEmail`, `src/lib/payments.ts`). |
| **D8** | `PAYMENT_CHARGEBACK_DISPUTE` | **Implementado na R4**: classificado como `'disputed'` (reversível para `'completed'`/`'partially_refunded'` se vencer, ou terminal `'refunded'` se perder). |
| **D9** | KPI "Doadores" | Doadores únicos por e-mail normalizado; sem e-mail, `user_id`; sem nenhum, a própria doação (`getDonorKey`, espelhado no SQL de `get_project_public_report` e `admin_donation_totals`). Anônimos entram no número. |
| **D10** | Evento sem doação (`matched=false`) | Responde 200 e grava em `public.webhook_unmatched` (conciliação). Se a gravação falhar, responde 503 para o Asaas reenviar. Corrigido o comentário que prometia retry. |

**Pendência para o sandbox do Asaas (não decidida no código):** `refundedValue` do `PAYMENT_PARTIALLY_REFUNDED` é acumulado ou do estorno atual? Até a validação, a soma dos itens de `refunds[]` com `status = DONE` é usada, e `refundedValue` só entra quando `refunds[]` não vier no payload.

### Regras novas (não podem quebrar)

- **R-B1** Estorno parcial registrado antes da confirmação se mantém (`refunded_amount` monotônico). Na confirmação, a doação nasce `partially_refunded` (100 → 30 → CONFIRMED = `partially_refunded`, estornado 30, projeto 70).
- **R-B2** Estorno total grava `refunded_amount = amount`. Evento parcial atrasado sobre `refunded` não muda nada e não dispara alerta.
- **R-B3** Estorno parcial sem valor concluído não muda o status nem alerta.
- **R-B4** `profiles.email` não pode ser alterado por `authenticated` (trigger `protect_profile_email`). O e-mail de `profiles` segue `auth.users` (trigger `sync_profile_email_from_auth`). A conta do doador é identificada por `find_confirmed_auth_user_ids_by_email` (só e-mail confirmado, comparação exata e normalizada); nunca por `profiles.email`.
- **R-B5** E-mails de `donations.donor_email` e `profiles.email` são gravados em minúsculo e sem espaços. Busca por e-mail usa igualdade, não `ilike`.
- **R-B6** Relatório público do projeto (`get_project_public_report`) e totais do admin (`admin_donation_totals`) devolvem só agregados, sem PII. Visitante não lê `donations`.

### Migrações

- `20261126_asaas_payments_and_webhooks.sql`: único ajuste (item 6). Ao final, reconcede `SELECT (refunded_amount)` quando a coluna existe, para que a reexecução depois da 20261127 não revogue o valor estornado.
- `20261127_banca_fixes.sql`: sem alteração. A transição de estado foi movida para a nova migração.
- `20261128_banca_r3_fixes.sql` (nova, idempotente): trigger de e-mail, sincronização com `auth.users`, `find_confirmed_auth_user_ids_by_email`, normalização de e-mail e backfill, `asaas_donation_transition` (função pura de estado), `apply_asaas_webhook_event` (mesma assinatura de 14 parâmetros), `webhook_unmatched`, `get_project_public_report`, `admin_donation_totals`, backfill de `refunded_amount` (item 8).
- **Não aplicar em produção** (`zzxtethlsdjjfjjrqmlk`) sem a aprovação da `/banca` sobre o commit final. Nenhuma consulta foi feita nesse projeto.

### Itens da banca: onde e como estão cobertos

| Item | Arquivo (principal) | Prova |
|---|---|---|
| 1 Tomada de doações via `profiles.email` | `src/lib/server/donor-provision.ts` (RPC `find_confirmed_auth_user_ids_by_email`); `src/app/api/admin/donations/[id]/resend-receipt/route.ts` (fallback por `auth.admin.getUserById`); `src/app/api/checkout/create-session/route.ts` (`email: authUser.email`); migração 20261128, seção 1 | `payments.sql.test.mjs`: "item 1" (2 testes) |
| 2 Recibo com valor bruto | `src/lib/payments.ts` (`getReceiptAmounts`, `buildDonorReceiptEmail`, `buildReceiptText`); `src/lib/server/email.ts` (`sendDonorReceiptEmail`, alerta com estornado e líquido); `src/app/api/webhooks/asaas/route.ts` (`refundedAmount`) | `payments.test.mjs`: "Banca R3 itens 2 e 4" |
| 3 Estorno parcial antes da confirmação | migração 20261128, seções 4 e 5 (`asaas_donation_transition` e RPC) | `payments.sql.test.mjs`: "itens 3 e 9" |
| 4 Estorno total e atraso | migração 20261128, seção 4 | `payments.sql.test.mjs`: "item 4"; matriz TS x SQL |
| 5 `matched=false` | `src/app/api/webhooks/asaas/route.ts` (`recordUnmatchedEvent`, comentário corrigido); migração 20261128, seção 6 | `payments.sql.test.mjs`: "item 5" |
| 6 Reexecução 26 depois da 27 | `20261126` (fim da seção 5) | `payments.sql.test.mjs`: "idempotência" (5 sequências com `has_column_privilege`) |
| 7 `ilike` no e-mail | `donor-provision.ts` (`.eq`); migração 20261128, seção 2 (trigger e backfill) | `payments.sql.test.mjs`: "item 7"; `payments.test.mjs`: asserção sobre `.ilike(` |
| 8 Backfill de `refunded_amount` | migração 20261128, seção 3 | `payments.sql.test.mjs`: "item 8" |
| 9 PARTIALLY sem valor | `src/lib/payments.ts` (`classifyAsaasWebhookEvent`, `refunds[]` só com DONE); migração 20261128, seção 4 | `payments.test.mjs`: "itens 3 e 9"; `payments.sql.test.mjs`: "item 9" |
| 10 Relatório público com RLS do visitante | `src/app/projetos/[id]/relatorios/page.tsx` (RPC); migração 20261128, seção 7 (inclui `recent` sem nome). `getProjectStats` removida de `src/lib/database.ts` | `payments.sql.test.mjs`: "item 10" |
| 11 Estatísticas relidas a cada página | `src/app/api/admin/donations/route.ts` (`admin_donation_totals`; `truncated` com 422); `src/app/admin/doacoes/page.tsx` (`stats=true` só na primeira carga); migração 20261128, seção 8 | `payments.sql.test.mjs`: "item 11"; `payments.test.mjs`: asserção sobre `rpc('admin_donation_totals')` |
| 12 UX de relatórios e histórico | `src/app/admin/relatorios/page.tsx` (métricas e exportação bloqueadas com `loadError`; período de 30 dias); `src/app/admin/dashboard/page.tsx` ("Tentar novamente", período de 30 dias, selo de status); `src/app/historico/page.tsx` (`exporting`, `try/finally`); `src/components/DateRangePicker.tsx` (preset "Últimos 30 dias", `onClear`) | Revisão de código, `tsc` e build; sem teste de tela |

### Itens 🟡 feitos

- Helpers únicos `getDonorKey` e `isRecognizedDonationStatus`. Uso nas telas: ver pendências B-P3.
- Busca admin: `_` mantido; prefixo de UUID com 8+ hex por faixa `id.gte`/`id.lte` (`uuidPrefixRange`).
- `getSaoPauloDateParts` com `hourCycle: 'h23'`.
- `ConfirmDialog` (`warning`): `bg-amber-700 hover:bg-amber-800`, ícone `text-amber-700`.
- `ProjectForm`: abas numa linha (`whitespace-nowrap`, sem `flex-wrap`), rótulos curtos.
- `DateRangePicker`: "Limpar" notifica a tela-mãe via `onClear`.
- `entrar`: "Lembrar-me" gravado só depois de `signInWithPassword` com sucesso.
- `sanitizeSpreadsheetCell`: `\p{Cf}` com flag `u` (via `RegExp` de tempo de execução, por causa do alvo ES5 do tsc) e fórmulas de largura total (＝ ＋ － ＠). CSV exportado com BOM `﻿`.
- E-mail de alerta de estorno mostra valor estornado e líquido.
- `doacao-sucesso`: linha "Valor líquido"; "Convide amigos" oculto no estorno parcial.
- `admin/dashboard`: selo de status em "Doações Recentes".
- `create-session`: `cf-connecting-ip` só é lido quando o runtime é Cloudflare Workers.
- Checagem de `error` em `webhooks/asaas` (leitura, enriquecimento, vínculo do doador) e em `resend-receipt`.
- `src/lib/validations.ts` aceita `partially_refunded`; `src/app/projetos/page.tsx` usa o líquido.

### Pendências (abertas, não implementadas como regra)

| # | Pendência | Comportamento até a decisão |
|---|---|---|
| **B-P1** | Status `disputed` para `PAYMENT_CHARGEBACK_DISPUTE` (`D8`) | **Fechada na R4**: status `'disputed'` reversível implementado em SQL (`20261129`), `payments.ts`, webhook e telas. |
| **B-P2** | Paginação por chave `(created_at, id)` no admin (item 11 prefere, ainda não feita) | Mantida paginação por `range`, com ordenação estável por `(created_at, id)`. |
| **B-P3** | Chave de doador nas telas admin (`/admin/dashboard` e `/admin/relatorios`) | **Fechada na R4**: cálculos agregados movidos para a RPC `admin_donations_report`, aplicando `D9` no SQL sem distorção por `maskAnonymous` e mantendo `D6` na exibição de anônimos. |
| **B-P4** | Acabamento "input-modern" do `DateRangePicker` | **Fechada na R4**: gatilho alinhado com `input-modern h-12 !py-0`, `htmlFor`/`id` vinculado e seleção manual corrigida. |
| **B-P5** | Exibição do admin ainda usa `profiles.email` como fallback para linhas antigas sem `donor_email` (`admin/donations/route.ts`) | Só afeta exibição para o admin; não concede acesso nem vincula doação. |
| **B-P6** | Recibo não é reenviado sozinho quando há estorno depois do recibo | O admin reenvia manualmente pelo botão de reenvio. |
| **B-P7** | Tela ou rotina de conciliação de `webhook_unmatched` | Os registros ficam guardados; nenhuma tela os consulta ainda. |
| **B-P8** | Validação do `refundedValue` no sandbox do Asaas (ver acima) | Usa `refunds[]` com DONE. |

### Limites do teste

- `src/lib/payments.sql.test.mjs` roda as migrações reais em PGlite (Postgres em memória). O fixture recria apenas as tabelas base que 26 e 27 alteram, além de `auth.users`, `auth.uid()` e os papéis. As políticas RLS da migração 25 não estão no fixture; a proteção de `profiles.email` é testada pelo trigger, não pela RLS.
- `service_role` está criado com `BYPASSRLS`, como no Supabase.
- `npm install` sem `--legacy-peer-deps` falha com conflito de peer já existente no repositório. O PGlite foi instalado com `--legacy-peer-deps`.

---

## Correções da Banca R4 sobre `56d31a2`

### Regras novas (não podem quebrar)

- **R-B7** **`PAYMENT_CHARGEBACK_DISPUTE` é reversível (`'disputed'`)**: enquanto em `'disputed'`, `isRecognizedDonationStatus` é `false` (não soma em `projects.current_amount`, `admin_donation_totals`, `admin_donations_report` nem `get_project_public_report`), **sem** sobrescrever `refunded_amount`. Ao vencer (`'completed'`), restaura `'partially_refunded'` se `refunded_amount > 0` (e `< amount`) ou `'completed'`; ao perder (`'refunded'`), trava em `'refunded'` com `refunded_amount = amount`.
- **R-B8** **Guarda `P4` em assinaturas**: eventos sem `targetStatus` válido (`PAYMENT_UPDATED`) nunca casam pela assinatura nem criam doação `pending` fantasma.
- **R-B9** **`get_project_public_report` respeita visibilidade de `projects`**: exige `service_role`, projeto público (`status = 'active' AND show_on_site = true AND slug IS NOT NULL`), ou `authenticated` que seja admin, doador do projeto ou tenha favoritado o projeto; caso contrário devolve relatório zerado.
- **R-B10** **Agregação no Postgres para Dashboard e Relatórios Admin (`admin_donations_report`)**: KPIs do período, crescimento real, série em `America/Sao_Paulo`, métodos/segmentos, top projetos e top doadores (`D6`/`D9`) vêm da RPC sem carregar todas as linhas em memória no Worker (`all=true` permanece apenas para exportação CSV paginada com lookahead `BATCH_SIZE + 1`).
- **R-B11** **Reexecução fora de ordem protegida**: `20261127` e `20261128` possuem guardas contra downgrade quando `20261129` já foi aplicada (`25 → 26 → 27 → 28 → 29 → 27/28`).
- **R-B12** **Planilha `pt-BR`, CSS em `@layer components`, `bfcache` e zero `window.alert()` na exportação**: `sanitizeSpreadsheetCell` neutraliza fórmulas também após `;`, `.card`/botões vivem em `@layer components`, formulários de checkout resetam estado em `pageshow` e exportadores lançam `Error` explícito tratado na UI.

### Migração R4

- `supabase/migrations/20261129_banca_r4_fixes.sql` (nova, idempotente):
  - Atualiza `donations_status_chk` com `'disputed'`.
  - Atualiza `asaas_donation_transition` e `apply_asaas_webhook_event` (assinatura única de 14 parâmetros com guarda `P4` e `'disputed'`).
  - Atualiza `get_project_public_report` com checagem de visibilidade de `public.projects`.
  - Cria `admin_donations_report(p_start, p_end, p_project_id)` (`SECURITY DEFINER`, exclusiva para `service_role`).
  - Atualiza `protect_profile_email` para comparar `lower(trim(NEW.email)) IS DISTINCT FROM lower(trim(OLD.email))`.
  - Não aplicar em produção (`zzxtethlsdjjfjjrqmlk`) sem aprovação da `/banca`.
