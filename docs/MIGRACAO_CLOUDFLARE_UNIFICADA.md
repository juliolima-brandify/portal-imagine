# 🏗️ Migração Unificada (Site Institucional + Portal) para Cloudflare Workers

- **Modo**: Mudança crítica (toca rotas de autenticação, checkout/doação, domínio de produção e infraestrutura Cloudflare)
- **Decisões aprovadas por Julio Lima (24/11/2026)**:
  - `/` vira a Home institucional; login atual move para `/entrar`.
  - Mesmo Worker nos dois domínios: `imagineinstituto.com/` abre o site institucional; `portal.imagineinstituto.com/` redireciona para `/entrar`.
  - Remoção da dependência `framer-api` na branch da Cloudflare (projetos lidos direto do Supabase; zero sync externo).
  - Deploy inicial em URL de preview (`*.workers.dev`) com validação completa e `/banca` antes da virada de DNS.
- **Arquivos a criar ou alterar (Fatia 1)**:
  - `public/img/*` (26 assets originais)
  - `src/lib/imagine-site.ts` (regras puras: catálogo, BRCode Pix CRC16, simulador IR 2026, helpers)
  - `src/lib/imagine-site.test.mjs` (testes unitários das regras puras)
  - `src/components/site/ImagineSitePage.tsx` + `src/components/site/imagine-site.css`
  - `src/app/entrar/page.tsx` (login movido de `src/app/page.tsx`)
  - `src/app/page.tsx`, `src/app/empresas/page.tsx`, `src/app/natal-feliz/page.tsx`, `src/app/politica-de-privacidade/page.tsx`, `src/app/projetos/{artes,amarelinha,esporte,social,familias,educacao}/page.tsx`
  - `src/components/GlobalLayout.tsx`, `src/components/ConditionalChat.tsx`, `src/middleware.ts`
  - `src/app/api/webhooks/supabase-projects/route.ts` (deprecado com segurança sem `framer-api`) e `package.json`

## Regras que não podem quebrar
| # | Regra (e quem decidiu) | Formas de falha que precisa suportar | Teste que prova |
|---|---|---|---|
| R1 | Rotas de produção atuais (`imagineinstituto.com` e `portal.imagineinstituto.com`) nunca caem durante a migração (Julio) | Build quebrado no Worker, env vars ausentes, erro de DNS | Deploy primeiro em `*.workers.dev` + smoke test antes de mexer no DNS |
| R2 | Login, permissões (`admin`/`donor`/`volunteer`) e guarda `requireAdmin()` em `/api/admin/*` nunca perdem proteção (Julio / `ESTADO_ATUAL.md`) | Acesso sem sessão, sessão expirada, role `donor` tentando `/api/admin/*`, redirect pós-login | Smoke test `/entrar`, `/api/admin/projects` (401 sem token) e revisão `/banca` |
| R3 | Site institucional preserva 100% do visual, textos, responsividade e pendências `.pend` sem inventar chave Pix, IR ativo ou metas (Julio) | Viewport desktop/tablet/celular, Tawk.to sobrepondo WhatsApp, sidebar do portal vazando no site | Inspeção visual em 1440/810/390px + `GlobalLayout` e `ConditionalChat` excluindo rotas institucionais |
| R4 | Cálculos do Simulador de IR 2026 e geração de BRCode Pix (CRC16-CCITT) são funções puras determinísticas e exatas (Julio) | Rendimento zero/negativo, faixa isenta, simplificado mais vantajoso que completo, acentos/caracteres especiais no Pix, valor vazio | `src/lib/imagine-site.test.mjs` cobrindo todos os casos extremos |
| R5 | Rota `/projetos` do portal (autenticada) e `/projetos/[id]/relatorios` não conflitam com `/projetos/{artes,amarelinha,esporte,social,familias,educacao}` (Julio) | Navegação entre "Meus Projetos" no portal e páginas públicas de cada projeto | Build Next.js sem conflito de rotas + teste de acesso às rotas |
| R6 | Trigger antigo `framer_sync_projects` no Supabase não gera loop nem erro 500 ao chamar `/api/webhooks/supabase-projects` após remoção de `framer-api` (Arquitetura) | Webhook com segredo inválido (401), webhook com segredo válido (200 deprecated sem erro) | Teste da rota `/api/webhooks/supabase-projects` |

## Pendências de regra de negócio
| # | Pergunta | Quem responde | Comportamento até a resposta |
|---|---|---|---|
| P1 | Chave Pix oficial para o modal de doação direta | Julio / Instituto | Mantém `pixChave = ""` (fluxo original: direciona para WhatsApp pedir a chave) |
| P2 | Ativação de destinação do Imposto de Renda (`irAtivo`) | Julio / Instituto | Mantém `irAtivo = false` (selo "Em breve" e aviso "Em preparação") |
| P3 | Valores reais de arrecadação/meta 2026, beneficiários, cotas empresariais, nome do fundador e revisão jurídica da privacidade | Julio / Instituto | Mantém badges `.pend` originais sem inventar valores |
| P4 | Migração do gateway de pagamentos de Stripe para **Asaas** e chaves de e-mail (Resend) | Julio | Mantém fluxo atual com fallback Pix/WhatsApp; migração para Asaas entra como próxima fatia dedicada |

## 1. 🕵️ Segurança, Permissões e Dados (Contrato do Invasor)
- **Rotas / Permissões**: Páginas institucionais (`/`, `/empresas`, `/natal-feliz`, `/projetos/{6 slugs}`, `/politica-de-privacidade`) são públicas e somente leitura. `/entrar` é pública para autenticação. `/api/admin/*` mantém `requireAdmin()` inalterado. `/api/webhooks/supabase-projects` continua validando `x-webhook-secret`.
- **Prevenção de Vazamento**: Zero `SUPABASE_SERVICE_ROLE_KEY` ou segredo de webhook em código cliente (`NEXT_PUBLIC_*` apenas para URL/anon key).

## 2. 🤪 Regras de Domínio e Casos Extremos (Contrato do Usuário Confuso)
- **Simulador IR 2026**: Tabela progressiva + INSS por faixa + redução Lei 15.270/2025 + comparação com desconto simplificado (20% até R$ 16.754,34).
- **Pix BRCode**: Normalização NFD sem acentos, limite de 25 chars no nome e 15 na cidade, CRC16-CCITT (`0x1021`, init `0xFFFF`).
- **Subdomínio `portal.`**: `src/middleware.ts` redireciona `GET /` quando `host` começa com `portal.` para `/entrar`, mantendo todos os outros paths (`/dashboard`, `/admin`, `/doar/*`, `/embed/*`, `/api/*`) intactos.

## 3. 🧓 Arquitetura e Escala (Contrato do Programador Sênior)
- **Regra Pura Extraída**: `src/lib/imagine-site.ts` concentra catálogo, BRCode Pix e Simulador de IR — zero duplicação entre páginas.
- **Sem `framer-api` no bundle**: Remoção de `framer-api` (WebSocket Node) evita problemas de compatibilidade no runtime `workerd` da Cloudflare.

## 4. 🎨 Gabarito Visual (Contrato do Designer)
- **Gabarito**: Captura integral `outputs/imagine-site-original/` (tokens `#FBF8F3`, `#0D2340`, `#4EDB20`, fonte `Urbanist`, breakpoints `1080px` e `680px`).
- **Isolamento de estilos**: CSS escopado sob `.ii-root` para não vazar nem quebrar Tailwind/globals do portal autenticado.
- **Sem sobreposição**: `GlobalLayout` oculta sidebar nas rotas institucionais e `/entrar`; `ConditionalChat` oculta Tawk.to nas rotas institucionais para não sobrepor o botão do WhatsApp.

## 5. 🧪 Matriz de Prova Real (Contrato do Testador)
- **Regra Pura**: `node --test src/lib/imagine-site.test.mjs` testando BRCode Pix CRC16 (com e sem valor, com acentos), `parseBRNumber`, e Simulador de IR 2026 (zero, isento <= 60k, faixa de redução 60k-88.2k, completo vs simplificado).
- **Build e Runtime Real**: `npm run build` + `vinext` / `wrangler` preview em `*.workers.dev` testando rotas públicas, `/entrar`, `/api/admin/projects` (401), `/doar/[id]` e `/api/webhooks/supabase-projects`.
