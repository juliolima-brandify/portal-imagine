# 📍 Estado Atual do Projeto — 07/07/2026

> **Este é o documento canônico de estado do projeto.** Em caso de conflito com qualquer outro `.md`, **este prevalece**. Guias mais antigos podem conter informações desatualizadas (versão v2.1.6 de out/2025, referências a CapRover, credenciais placeholder, etc.).

---

## 🔴 Pendências críticas (ler antes de qualquer deploy)

### 1. Falha de segurança: API admin sem autenticação
`src/app/api/admin/projects/route.ts` (e provavelmente `src/app/api/admin/users/route.ts`) usa a **service_role key SEM verificar login nem role**. Qualquer pessoa com a URL pode **criar, editar e apagar projetos** direto pela API.

- Hoje está "protegida por acidente" porque o banco de **produção está morto** (ver abaixo).
- **No instante em que a produção for religada ao banco novo (vivo), vira exploração total.**
- **Correção obrigatória ANTES de religar a produção:** validar a sessão do Supabase (via `src/lib/supabase-server.ts`) e exigir `profiles.role = 'admin'` em todos os handlers (GET/POST/PUT/DELETE). Remover também o fallback perigoso `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY` na linha 5.

### 2. Produção aponta para um banco morto
O deploy em `portal.imagineinstituto.com` (Vercel) foi construído apontando para o Supabase `nsnmeufhzxdkqhlwkeml`, que **não existe mais** (DNS não resolve). O site está no ar, mas **não conecta no banco**.

- **Correção:** atualizar as variáveis de ambiente na Vercel para o projeto novo (`zzxtethlsdjjfjjrqmlk`) e **redeploy** (a chave pública fica embutida no build; só muda com novo deploy). Passo a passo na seção [Como consertar a produção](#-como-consertar-a-produção).

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
| `FRAMER_API_TOKEN` | Token do CMS do Framer (`fr_...`) — segredo, rotacionar após a integração |
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

## 🚑 Como consertar a produção

Ordem obrigatória (não pular o passo 1):

1. **Corrigir a segurança** de `/api/admin/*` (sessão + `role='admin'`) — ver [Pendência #1](#1-falha-de-segurança-api-admin-sem-autenticação). Deve entrar no mesmo deploy que religa o banco.
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

## 🎨 Integração Portal ↔ Framer (planejada)

O site público **imagineinstituto.com é um site Framer** (plano pago, já tem CMS com 2 collections). A visão acordada:

- **Framer = vitrine pública** (marketing, lista de projetos, página de cada projeto via CMS + template).
- **Portal (este sistema) = motor logado** (admin, login, checkout, dashboards) e **fonte da verdade** (Supabase).
- **Elo 1 (Portal → Framer):** criar/editar projeto no admin → **Database Webhook do Supabase** → rota `/api/webhooks/supabase-projects` no portal → **Framer CMS API** cria/atualiza a página automaticamente.
- **Elo 2 (Framer → Portal):** botão "Doar" da página do Framer → checkout do portal com o `id` do projeto.

**Abordagem recomendada:** Opção B (custom, webhook + Framer CMS API no próprio portal) em vez de plugin low-code — custo zero, mesma stack, e o segredo do Framer fica só no Vercel. Fases sugeridas: (0) decisões/plano Framer, (1) portal publicado com env correto, (2) segurança + rota `/doar/[id]`, (3) colunas `slug`/`framer_item_id` em `projects`, (4) collection+template no Framer, (5) sync, (6) botão Doar + Stripe, (7) reconciliação/SEO.

> Detalhes completos (mapeamento de campos, tratamento de imagens, riscos) foram levantados em sessão e devem virar um doc próprio quando a integração começar.

---

## 🧩 Pendências / próximos passos (priorizado)

1. 🔴 **Corrigir segurança da API admin** (`/api/admin/projects` e `/api/admin/users`).
2. 🔴 **Religar a produção** ao banco novo (env Vercel + redeploy) — só depois do item 1.
3. 🟡 **Criar admin real** em produção (não usar contas demo).
4. 🟡 **Reativar Stripe** (chaves live + webhook) — hoje em placeholder, pagamentos inativos.
5. 🟡 **Reativar Resend** (emails transacionais) — hoje em placeholder.
6. 🟢 **Criar a página `/doar/[id]`** (existe desativada em `checkouts-desativados/`) e opcionalmente `src/app/projetos/[id]/page.tsx` (pasta existe vazia).
7. 🟢 **Implementar a integração Framer** (Elo 1 e Elo 2).
8. 🟢 **Commitar** as mudanças de código/SQL desta sessão.

---

## 📌 Notas de estado que corrigem docs antigos

- A afirmação "Sistema 100% funcional em produção / 0 bugs" (README, `_contexto.md`, changelog v2.1.6) **está desatualizada**: a produção está quebrada por causa do banco morto e há a falha de segurança aberta.
- Guias que citam "credenciais placeholder" ou "criar novo projeto Supabase" devem apontar para o ref atual `zzxtethlsdjjfjjrqmlk` e o formato de chave `sb_publishable_`.
- `docs/guias/CONFIGURACAO_PRODUCAO_URGENTE.md` menciona **CapRover** — a produção hoje é **Vercel**.
- Ambiente **Local** hoje usa **banco real** (não mais mock), conectado ao projeto novo.

---

*Documento criado em 07/07/2026 para consolidar o estado real do projeto após a reconexão do banco e o mapeamento da integração com o Framer.*
