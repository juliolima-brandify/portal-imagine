# Sessão de correção — achados da /banca sobre `a607706`

**Repositório:** `C:\Users\julio\Projetos\portal-imagine` · **Branch:** `feat/pagamentos-asaas-resend` · **Ponto de partida:** `a607706` (laudo: ❌ REPROVADO)
**Fluxo:** use a skill `/desenvolvimento` para corrigir e, ao final, rode `/banca` sobre o novo commit (rodada de correção: base = `a607706`).

## Regras operacionais (não negociáveis)
- Não fazer merge na `main`, não publicar no Cloudflare Workers, não aplicar migração no Supabase de produção (`zzxtethlsdjjfjjrqmlk`) e **não rodar nenhuma consulta nele, nem de leitura**.
- Commits novos na mesma branch (não reescrever histórico). Mensagem no padrão `fix(pagamentos): ...`.
- Correção de migração: **nova migração** `supabase/migrations/20261128_banca_r3_fixes.sql` (idempotente). Só edite `20261126`/`20261127` onde for indispensável para a reexecução fora de ordem (item 6) — e explique no commit.
- Dúvida de negócio não se resolve no código: use as decisões da seção abaixo; o que estiver em branco fica como pendência e **não** é implementado como definitivo.
- Atualize `docs/PAGAMENTOS_ASAAS_RESEND.md` (regras novas, decisões, pendências) no mesmo commit.

## Decisões do Julio (preencher antes de enviar)
| # | Pergunta | Opções | Resposta |
|---|---|---|---|
| D7 | Recibo de doação `partially_refunded` | (a) detalhado: doado / estornado / líquido — **recomendado**; (b) só líquido; (c) não emitir | (a) detalhado — aceito a recomendação do Julio |
| D8 | `PAYMENT_CHARGEBACK_DISPUTE` | (a) novo status `disputed` (não conta no total, pode voltar a `completed` se o Instituto ganhar) — **recomendado**; (b) manter `refunded` definitivo | (a) disputed — aceito a recomendação do Julio |
| D9 | KPI "Doadores" | (a) doadores únicos por `user_id`/e-mail, inclusive anônimos (só o número aparece) — **recomendado**; (b) cada doação anônima/convidado conta como um | (a) doadores únicos — aceito a recomendação do Julio |
| D10 | `matched=false` (evento sem doação) | (a) 200 + gravar em tabela `webhook_unmatched` para conciliação — **recomendado** (não trava a fila do Asaas); (b) responder 409/503 para o Asaas reenviar | (a) 200 + webhook_unmatched — aceito a recomendação do Julio |

Pendência para o sandbox do Asaas (não decidir no código): `refundedValue` do `PAYMENT_PARTIALLY_REFUNDED` é acumulado ou do estorno atual? Até a validação, somar `refunds[]` com `status=DONE` por `id` (idempotente) e usar `refundedValue` só quando `refunds[]` não vier.

## Correções obrigatórias (ordem de prioridade)

### 🔴 Bloqueantes
1. **Tomada de doações via `profiles.email` (R5/R6/R11).** `src/lib/server/donor-provision.ts:39-43`, `:67-73`, `:148-154`; `supabase/migrations/20261125_harden_rls_and_remove_framer_trigger.sql:11,45-50`. Hoje o usuário autenticado pode `PATCH profiles.email` para o e-mail da vítima e herdar as doações dela.
   - Identificar a conta pelo e-mail de `auth.users` (via `supabaseAdmin.auth.admin`), nunca por `profiles.email`.
   - Na migração nova: trigger `BEFORE UPDATE` que bloqueia mudança de `email` quando `current_user = 'authenticated'` (ou REVOKE UPDATE da tabela + GRANT só nas colunas editáveis) e sincronização de `profiles.email` a partir de `auth.users`.
   - Mesma correção em `resend-receipt/route.ts:126` e `create-session/route.ts:197` (`donorEmailHint`).
2. **Recibo reenviado com valor bruto (R4/R17).** `src/app/api/admin/donations/[id]/resend-receipt/route.ts:58,131-146`; `src/lib/server/email.ts:117-132`; também o envio do webhook em `src/app/api/webhooks/asaas/route.ts:240`. Implementar conforme **D7**, reaproveitando a lógica de `buildReceiptText` (`payments.ts:898-927`) — e-mail, assunto e recibo baixado devem mostrar os mesmos números.

### 🟠 Altos
3. **Estorno parcial antes da confirmação se perde (R10).** `20261127_banca_fixes.sql:398-418`. Gravar `refunded_amount` (monotônico) mesmo quando o status não avança; ao transitar para `completed` com `refunded_amount > 0`, ir para `partially_refunded`. Prova esperada: pending 100 → PARTIALLY_REFUNDED 30 → CONFIRMED ⇒ `partially_refunded`, estornado 30, projeto 70.
4. **Valor estornado diminui no estorno total.** `20261127_banca_fixes.sql:410-411`. Com status `refunded`, `refunded_amount = amount`. Evento parcial atrasado sobre `refunded` não muda nada e `refund_changed = false` (sem alerta).
5. **`matched=false`.** `src/app/api/webhooks/asaas/route.ts:112-113` + SQL `:281-291,376-378`. Implementar conforme **D10** e corrigir o comentário que promete retry.
6. **Reexecução 26 depois da 27 revoga `refunded_amount` (R12).** `20261126_asaas_payments_and_webhooks.sql:430-454`. Conceder `refunded_amount` quando a coluna existir (bloco `DO` com `information_schema`). Ordens 26→27, 27→26, 26→27→26→27 devem terminar com o mesmo GRANT.
7. **R11 ainda usa `ilike` (`*` é curinga no PostgREST).** `donor-provision.ts:42,153`; `payments.ts:51-53`. Comparar com `.eq` sobre e-mail normalizado (`lower(trim)`); normalizar na gravação de `donations.donor_email` e `profiles.email`.
8. **Sem backfill de `refunded_amount` em doações já `refunded`.** Na migração nova: `UPDATE public.donations SET refunded_amount = amount WHERE status = 'refunded' AND COALESCE(refunded_amount,0) = 0;`.
9. **PARTIALLY_REFUNDED sem valor DONE vira "parcial com R$ 0".** `payments.ts:748-763`; SQL `:412-416`. Sem valor concluído: não mudar status, não alertar. Fallback `refundedValue` só quando `refunds[]` estiver ausente.
10. **Relatório público do projeto usa dados sob RLS do visitante.** `src/app/projetos/[id]/relatorios/page.tsx:78-101`. Criar RPC `SECURITY DEFINER` (search_path fixo, REVOKE de PUBLIC, GRANT a anon/authenticated) que devolve só agregados por projeto (total líquido, contagem, doadores únicos conforme D9, série mensal) — sem PII. Remover `getProjectStats` morto (`database.ts:426`).
11. **Estatísticas do admin relêem a tabela inteira a cada página.** `src/app/api/admin/donations/route.ts:56,183-214`; `admin/doacoes/page.tsx:117-123`. RPC agregadora (`GROUP BY status`, líquido igual ao trigger) e `stats` só na primeira carga. `MAX_PAGES` atingido ⇒ erro/`truncated: true` explícito (R16), nunca corte silencioso; preferir paginação por chave `(created_at, id)`.
12. **UX dos relatórios e histórico.**
    - `admin/relatorios/page.tsx:335-347,409-420`: com `loadError`, esconder métricas/gráficos/tabelas (ou `—`) e desabilitar o `ExportDropdown`.
    - `admin/relatorios/page.tsx:107-127` e `admin/dashboard/page.tsx:245-255`: iniciar o período em "Últimos 30 dias" (preset visível no `DateRangePicker`) para gráfico e métricas usarem o mesmo escopo.
    - `historico/page.tsx:370-390`: estado `exporting`, botões `disabled`, rótulo "Exportando...", `try/finally` com aviso de erro (gabarito: `admin/doacoes/page.tsx:235-288`).
    - `admin/dashboard/page.tsx:79,197-203`: estado de erro com "Tentar novamente" (gabarito: `admin/relatorios`).

### 🟡 Melhorias (fazer as baratas; o resto registrar como pendência no doc)
- Uma função única em `payments.ts` para "chave de doador" e outra para "doação reconhecida", usadas em dashboard, relatórios, `/admin/doacoes` (`route.ts:221` não conta `partially_refunded`), histórico e projeto.
- Busca admin: não remover `_` (`route.ts:279`) — permitir achar `pay_...`; prefixo de UUID com 8+ hex por faixa `id.gte/lte`.
- `payments.ts:449-457`: `hourCycle: 'h23'` no lugar de `hour12: false`; início padrão calculado com `getSaoPauloDateParts`.
- `ConfirmDialog.tsx` (`warning`): `bg-amber-700 hover:bg-amber-800`, ícone `text-amber-700`.
- `ProjectForm.tsx:616-617`: abas numa linha só, rótulos curtos, sem `flex-wrap` e sem `overflow-x-auto`.
- `DateRangePicker.tsx:162-172`: acabamento do `input-modern`; "Limpar" deve notificar a tela-mãe.
- `entrar/page.tsx:170-176`: gravar "Lembrar-me" só após `signInWithPassword` com sucesso.
- `sanitizeSpreadsheetCell` (`payments.ts:266-277`): usar `\p{Cf}` (flag `u`) e incluir `＝ ＋ － ＠`; CSV com BOM `\uFEFF`.
- E-mail de alerta de estorno: mostrar valor estornado e líquido (`webhooks/asaas/route.ts:349-355`, `email.ts:301-316`).
- `doacao-sucesso/page.tsx:277-284,337`: linha "Valor líquido"; esconder "Convide amigos" no estorno parcial.
- `admin/dashboard/page.tsx:290-311`: selo de status em "Doações Recentes".
- Checar `error` em `webhooks/asaas/route.ts:209-216,226,267-271` e `resend-receipt/route.ts:52-54` (erro de banco ≠ 404).
- `src/lib/validations.ts:65` e `src/app/projetos/page.tsx:66,236-239`: incluir `partially_refunded` e usar o líquido.
- `create-session/route.ts:23-31`: confiar em `cf-connecting-ip` só sob Workers.

## Provas exigidas (não basta varredura de texto)
1. `npx.cmd tsc --noEmit`, `npm.cmd run build:vinext`, `node --test src/lib/payments.test.mjs`, `git diff --check` — tudo verde no commit final.
2. **Teste SQL executável** em Postgres local descartável (PGlite ou Docker — nunca o remoto), versionado no repo (ex.: `src/lib/payments.sql.test.mjs`, com o PGlite como devDependency), cobrindo:
   - itens 3, 4, 8 e 9 com os números esperados de `refunded_amount`, `status` e `projects.current_amount`;
   - idempotência 26→27→28, 27→26→27→28 e 28 duas vezes, terminando com o GRANT de `refunded_amount`;
   - trigger que impede `authenticated` de trocar `profiles.email` (item 1);
   - RPC pública de agregados sem PII (item 10).
3. Teste executável (não regex) de `verifyAsaasWebhookToken` (token ausente, curto, errado, certo).
4. Teste do e-mail de recibo com estorno parcial mostrando os mesmos números de `buildReceiptText`.
5. Remover arquivos temporários e confirmar `git status --short` limpo antes do commit.

## Entrega
- Commit(s) na branch com hash final informado.
- Resumo por item (1–12 + 🟡) com arquivo:linha e a prova que o cobre; o que ficou como pendência e por quê.
- Em seguida, rode **`/banca`** sobre o novo commit (base `a607706`), retestando primeiro os 2 bloqueantes e os itens 3–6.
