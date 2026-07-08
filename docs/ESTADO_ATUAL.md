# 📍 Estado Atual do Projeto — 08/07/2026

> **Este é o documento canônico de estado do projeto.** Em caso de conflito com qualquer outro `.md`, **este prevalece**. Guias mais antigos podem conter informações desatualizadas (versão v2.1.6 de out/2025, referências a CapRover, credenciais placeholder, etc.).

---

## 🟢 Estado geral: produção NO AR e conectada

As duas pendências críticas anteriores (segurança da API admin e produção apontando para banco morto) foram **resolvidas e deployadas** em 07–08/07/2026. Além disso, a **integração Portal ↔ Framer foi construída e publicada ao vivo**. Detalhes abaixo.

### 1. Falha de segurança: API admin sem autenticação — ✅ CORRIGIDA E DEPLOYADA
`src/app/api/admin/projects/route.ts` e `src/app/api/admin/users/route.ts` usavam a **service_role key SEM verificar login nem role**. Qualquer pessoa com a URL podia **criar, editar e apagar projetos e usuários** direto pela API.

- **Corrigido e em produção:** guard `requireAdmin()` em `src/lib/admin-auth.ts` (valida Bearer token com fallback para cookie + exige `profiles.role='admin'`) aplicado em todos os handlers; helper `adminFetch()` (`src/lib/admin-api.ts`) injeta o token nas chamadas das páginas admin; removido o fallback inseguro `SERVICE_ROLE || ANON`.
- **Verificado em produção:** `/api/admin/*` retorna **401 sem login** e **200 para admin autenticado**.

### 2. Produção reconectada ao banco novo — ✅ RELIGADA E NO AR
O deploy em `portal.imagineinstituto.com` (Vercel, projeto `portal-imagine-of`, scope "Brandify Hub") apontava para o Supabase `nsnmeufhzxdkqhlwkeml`, que **não existe mais** (DNS não resolve).

- **Corrigido:** variáveis de ambiente atualizadas na Vercel para o projeto novo (`zzxtethlsdjjfjjrqmlk`) + **redeploy**; `vercel.json` corrigido (removido `NODE_ENV=development`, que forçava modo dev em produção).
- **Verificado:** o portal serve o **banco novo** e está no ar e funcional.

---

## 🗺️ Mapa dos 3 bancos Supabase

Houve confusão histórica com **três** projetos Supabase diferentes:

| # | Ref do projeto | Papel | Estado |
|---|---|---|---|
| 1 | `nsnmeufhzxdkqhlwkeml` | O que a **produção** (Vercel) usa | 🔴 **MORTO** (DNS não resolve) |
| 2 | Projeto da conta `projeto.institutoimagine@gmail.com` | Antigo, do screenshot | 🟡 Pausado >90 dias; backup **vazio** (sem dados reais) |
| 3 | **`zzxtethlsdjjfjjrqmlk`** | **NOVO e atual** | 🟢 **Vivo — fonte da verdade** |

> URL do banco atual: `https://zzxtethlsdjjfjjrqmlk.supabase.co` (região `sa-east-1`).
> Nenhum dado real foi perdido — a apuração desta sessão mostrou que os bancos antigos nunca tiveram dados de verdade (o app sempre rodou com placeholder/mock).

---

## ✅ O que funciona hoje (ambiente LOCAL)

O ambiente de desenvolvimento local está **conectado ao banco novo e funcionando**:

- **5 tabelas:** `profiles`, `projects`, `donations`, `favorites`, `notifications`
- **RLS ativo** em todas
- **2 buckets de storage:** `avatars`, `projects`
- **4 projetos de exemplo** (seed): Educação Digital, Saúde Comunitária, Meio Ambiente, Esporte Social
- **3 usuários demo** (ver abaixo)
- Servidor local sobe em `http://localhost:3001`

### Usuários demo
| Papel | Email | Senha | role em `profiles` |
|---|---|---|---|
| Admin | `admin@demo.com` | `demo123` | `admin` |
| Doador | `doador@demo.com` | `demo123` | `donor` |
| Voluntário | `voluntario@demo.com` | `demo123` | `volunteer` |

---

## 🔑 Credenciais e segredos

Todas as credenciais reais vivem **apenas** no `.env.local` (que é **gitignored** — nunca é commitado):

| Variável | Formato / observação |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zzxtethlsdjjfjjrqmlk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Formato novo** `sb_publishable_...` (não é mais `eyJ...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Formato `eyJ...` — **somente server-side**, nunca com prefixo `NEXT_PUBLIC` |
| `FRAMER_API_TOKEN` | Token do CMS do Framer (`fr_...`) — segredo, usado pelo sync. Também na Vercel (produção+preview) |
| `FRAMER_PROJECT_URL` | URL do projeto Framer (`https://framer.com/projects/INSTITUTO-IMAGINE--...`) — usada pelo `framer-api` |
| `SUPABASE_WEBHOOK_SECRET` | Segredo compartilhado entre o trigger `pg_net` do Supabase e a rota `/api/webhooks/supabase-projects` (header `x-webhook-secret`) |
| Senha do banco Postgres | Guardada no `.env.local` (comentada); usada só para conexão direta/migrations |

> ⚠️ **Nunca** escreva service_role key, senha do banco ou token do Framer em arquivos versionados (`.md`, `.sql`, `.ts`).

---

## 🗄️ Setup do banco (recriar do zero)

O script consolidado e idempotente está em **`docs/SETUP-COMPLETO.sql`** (junção de `supabase-setup-safe.sql` + `supabase-storage-setup-safe.sql`). Ele cria tabelas, RLS, triggers, buckets, índices e insere os 4 projetos de exemplo. Pode rodar mais de uma vez sem quebrar.

Para aplicar: **SQL Editor do Supabase** → colar o conteúdo de `docs/SETUP-COMPLETO.sql` → Run.

### Correções de schema aplicadas nesta sessão
- **`profiles.role`**: o `CHECK` foi relaxado de `('donor','admin')` para **`('donor','admin','volunteer')`**. O valor `volunteer` é usado pelo app em vários lugares, mas era barrado pelo constraint antigo. Corrigido no banco e nos fontes `supabase-setup-safe.sql` e `supabase-setup.sql`.
- **`isSupabaseConfigured()`** (`src/lib/supabase.ts`): agora aceita a chave pública no formato novo `sb_publishable_` além do antigo `eyJ`.

---

## 🚑 Como consertar a produção — ✅ FEITO (referência histórica / para recriar)

> Estes passos **já foram executados** em 07–08/07/2026; a produção está no ar e conectada. A sequência fica registrada como referência caso seja preciso reconfigurar o ambiente do zero.

Ordem obrigatória (não pular o passo 1):

1. **Corrigir a segurança** de `/api/admin/*` (sessão + `role='admin'`) — ver [Pendência #1](#1-falha-de-segurança-api-admin-sem-autenticação--corrigida-e-deployada). Deve entrar no mesmo deploy que religa o banco.
2. **Atualizar variáveis de ambiente na Vercel** (Production) para o banco novo:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://zzxtethlsdjjfjjrqmlk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → a chave `sb_publishable_...` (ver `.env.local`)
   - `SUPABASE_SERVICE_ROLE_KEY` → a service_role `eyJ...` (ver `.env.local`, somente server-side)
   - `NEXTAUTH_URL` → `https://portal.imagineinstituto.com`
   - Conferir `vercel.json`: remover qualquer `NODE_ENV=development` forçado em produção.
3. **Redeploy** na Vercel (a chave `NEXT_PUBLIC_*` é embutida no build).
4. **Supabase Auth** → Authentication → URL Configuration: Site URL = `https://portal.imagineinstituto.com`; Redirect URLs incluindo `https://portal.imagineinstituto.com/**` e `http://localhost:3001/**`.
5. **Criar o primeiro admin real** no banco novo (ver `docs/guias/SETUP_PRIMEIRO_ADMIN.md`), já que as contas demo não devem ser usadas em produção.
6. **Smoke test:** login, `/projetos`, CRUD de projeto no admin, `/api/health`.

---

## 🎨 Integração Portal ↔ Framer — ✅ CONSTRUÍDA e PUBLICADA

O site público **imagineinstituto.com é um site Framer** (plano pago). A integração está **no ar**: mudar um projeto no banco reflete no Framer sozinho em ~10s.

> **Referência técnica completa:** [`INTEGRACAO_FRAMER.md`](./INTEGRACAO_FRAMER.md) — arquitetura, mapa de campos, embed dinâmico, fluxo automático, env vars, como publicar. Esta seção é apenas o resumo de estado.

**Arquitetura:**
- **Portal Next.js = motor / fonte da verdade** (admin, checkout, Supabase).
- **Site Framer `imagineinstituto.com` = vitrine pública.**

**O que foi entregue:**
- **Collection:** reusa a **"Programas"** (o plano Framer só permite 2 collections; uma 3ª "Projetos" estourava o limite — foi criada e deletada).
- **Template CMS:** Detail Page da "Programas" em `/programas/[slug]`, reaproveitando o design da página estática `/esporte` (recurso "Swap Collection" do Framer). Conteúdo dinâmico por item.
- **Embed de doação dinâmico:** campo **EmbedURL** na Programas guarda a URL do checkout embed por projeto (`https://portal.imagineinstituto.com/embed/checkout/checkout-stripe?project=<id>&source=embed&utm_campaign=<slug>`); no Framer o componente Embed (Type URL) tem a URL ligada por "Convert" a esse campo.
- **Código:** `src/lib/framer-sync.ts` (upsert/remove via pacote npm `framer-api`, import dinâmico ESM, imagem de fallback = logo do portal quando o projeto não tem foto) + rota `src/app/api/webhooks/supabase-projects/route.ts` (runtime `nodejs`, valida header `x-webhook-secret`, previne loop ignorando eventos que só mexem nas colunas `framer_*`).
- **Colunas novas em `projects`:** `framer_item_id`, `framer_synced_at`, `framer_sync_status`.
- **Fluxo automático (Elo 1, Portal → Framer):** trigger `framer_sync_projects` na tabela `public.projects` (função `notify_framer_sync` via extensão `pg_net` / `net.http_post`) chama a rota do portal com o header do segredo → `framer-api` cria/atualiza o item. **Testado E2E.**
- **Elo 2 (Framer → Portal):** botão "Doar" da página Framer → checkout embed do portal com o `id` do projeto (via campo EmbedURL).
- **Publicado ao vivo** via `framer.publish()` (deployment b0baae0de) → páginas em `imagineinstituto.com/programas/{slug}` (ex.: `/programas/esporte-social`, `/educacao-digital`, `/saude-comunitaria` — todas retornam 200).

**Env vars** (na Vercel produção+preview e no `.env.local`): `FRAMER_API_TOKEN`, `FRAMER_PROJECT_URL`, `SUPABASE_WEBHOOK_SECRET`. Pacote `framer-api` adicionado ao `package.json`.

**Follow-ups não-bloqueantes:** (1) fotos reais nos projetos (hoje usam o logo de fallback); (2) limpar projetos-seed de teste (ex.: "Meio Ambiente (Cópia)") — deletar no admin remove do Framer automaticamente; (3) opcional: `noindex` nos itens curados (`educacao/arte/esporte/social/saude`) que ganharam `/programas/{slug}` pela template mas não são linkados — **decisão atual: deixar como está**.

---

## 🧩 Pendências / próximos passos (priorizado)

1. ✅ **Segurança da API admin corrigida e deployada** — `/api/admin/*` exige admin autenticado em produção (401 sem login).
2. ✅ **Produção religada** ao banco novo (env Vercel + redeploy + `vercel.json` corrigido) — no ar e conectada.
3. ✅ **Integração Framer implementada e publicada** (Elo 1 automático via trigger; Elo 2 via embed dinâmico) — ver [`INTEGRACAO_FRAMER.md`](./INTEGRACAO_FRAMER.md).
4. 🟡 **Criar admin real** em produção (não usar contas demo).
5. 🟡 **Reativar Stripe** (chaves live + webhook) — hoje em placeholder, pagamentos inativos.
6. 🟡 **Reativar Resend** (emails transacionais) — hoje em placeholder.
7. 🟢 **Follow-ups Framer (não-bloqueantes):** fotos reais nos projetos (hoje logo de fallback); limpar projetos-seed de teste; `noindex` opcional nos itens curados.
8. ✅ **Mudanças de código/SQL/docs commitadas** na `main`.

---

## 📌 Notas de estado que corrigem docs antigos

- A afirmação "Sistema 100% funcional em produção / 0 bugs" (README, `_contexto.md`, changelog v2.1.6) refere-se à versão de out/2025; o estado real e atual é **este documento**. A produção hoje está **no ar e conectada ao banco novo**, com a segurança da API admin corrigida.
- Guias que citam "credenciais placeholder" ou "criar novo projeto Supabase" devem apontar para o ref atual `zzxtethlsdjjfjjrqmlk` e o formato de chave `sb_publishable_`.
- `docs/guias/CONFIGURACAO_PRODUCAO_URGENTE.md` menciona **CapRover** — a produção hoje é **Vercel** (projeto `portal-imagine-of`).
- Ambiente **Local** hoje usa **banco real** (não mais mock), conectado ao projeto novo.
- A integração com o Framer deixou de ser "planejada": está **construída e publicada** — ver [`INTEGRACAO_FRAMER.md`](./INTEGRACAO_FRAMER.md).

---

*Documento criado em 07/07/2026 para consolidar o estado real do projeto após a reconexão do banco e o mapeamento da integração com o Framer. Atualizado em 08/07/2026: produção religada e no ar, segurança deployada, integração Framer construída e publicada.*
