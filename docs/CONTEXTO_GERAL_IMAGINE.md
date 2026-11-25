# 🧭 Contexto Geral — Instituto Imagine (Site Institucional + Portal Unificados)

> Documento-mãe de handoff entre frentes (zero segredos). Atualizado em 24/11/2026.

## 1. Repositório e Ambiente
- **Repositório local:** `C:\Users\julio\Documents\Codex\2026-11-24\o-seguinte\portal-imagine`
- **GitHub:** `https://github.com/juliolima-brandify/portal-imagine`
- **Branch principal (`main`):** commit `c9d38bd` (aprovado pela `/banca` em 3 rodadas e em produção)
- **Branch em preparação:** `feat/projetos-dinamicos` (contém `docs/PROJETOS_DINAMICOS_SITE.md` e `supabase/migrations/20261125_dynamic_site_projects.sql`)
- **Ambiente Windows PowerShell:** usar sempre `npm.cmd` e `npx.cmd` (ExecutionPolicy bloqueia `.ps1`).
- **Env local:** `.env.local` (ignorado pelo `.gitignore`, nunca commitar nem imprimir valores) já configurado com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_BASE_URL`.

## 2. Infraestrutura em Produção (100% Cloudflare Workers + Supabase)
- **Stack:** Next.js App Router rodando na **Cloudflare Workers** via `vinext` (`npx.cmd vinext build && npx.cmd wrangler deploy`, `wrangler.jsonc` com `nodejs_compat`).
- **Cloudflare Account:** `Projeto.institutoimagine@gmail.com's Account` (Account ID: `114c851f681f1b2b7d2f2e29e91a2e5a`)
- **Cloudflare Worker:** `instituto-imagine` (Secrets já configurados para Supabase + `NEXT_PUBLIC_BASE_URL`)
- **Cloudflare DNS Zone:** `imagineinstituto.com` (Zone ID: `7d6cc7f9ec7f4fa815aac2bc6dd783a1`, status `active`)
- **Domínios Customizados ativos no Worker:**
  - `https://imagineinstituto.com/` — Site institucional (10 páginas, 26 assets em `public/img/*`)
  - `https://www.imagineinstituto.com/` — Site institucional
  - `https://portal.imagineinstituto.com/` — Portal (middleware redireciona `GET /` → `/entrar`)
- **E-mail corporativo:** Hostinger (todos os 10 registros MX, SPF, DMARC, DKIM `a/b/c`, autoconfig e autodiscover preservados `proxied: false` — **nunca alterar nem ativar proxy nos registros de e-mail**).
- **Supabase:** Projeto `zzxtethlsdjjfjjrqmlk` (`https://zzxtethlsdjjfjjrqmlk.supabase.co`, ativo).
  - Admins ativos em `profiles`: `adm.brandify@gmail.com` (Julio Lima) e `admin@institutoimagine.org`. Contas `@demo.com` removidas.
  - Redirect URLs configuradas: `https://imagineinstituto.com/**` e `https://www.imagineinstituto.com/**` (pendente adicionar `https://portal.imagineinstituto.com/**` e ajustar `Site URL` de `http://localhost:3000` para `https://imagineinstituto.com`).

## 3. Regras Inegociáveis de Produção
1. **Zero segredos no Git ou em `dist/client`** (`.env.local` fora do Git; `requireAdmin()` em `/api/admin/*`; `profiles.role === 'admin'` em `AdminLayout`).
2. **Sem bypasses `?demo_email=` ou credenciais demo** em produção.
3. **Sem inventar dados institucionais pendentes (`.pend`):** manter `pixChave: ""` (P1), `irAtivo: false` (P2) e metas/números `.pend` (P3) até confirmação oficial do Instituto.
4. **Isolamento visual:** estilos do site institucional escopados em `.ii-root` (`src/components/site/imagine-site.css`), `GlobalLayout` sem remount na hidratação, `ConditionalChat` desativado nas rotas institucionais/login/checkout.
5. **Gateway de pagamentos oficial:** **Asaas** (não usar Stripe).
6. **Workflow de entrega:** toda mudança de código segue `/desenvolvimento` → `/banca` antes do merge na `main` e deploy na Cloudflare (uma branch/deploy por vez para evitar conflitos).

## 4. Mapa das 4 Frentes (Chats Dedicados)
1. **Frente 1 — Projetos 100% Dinâmicos (`/desenvolvimento` → `/banca`):**
   - Migração SQL em `supabase/migrations/20261125_dynamic_site_projects.sql` (`slug`, `show_on_site`, `site_order`, `site_data`).
   - Seed dos 6 projetos oficiais (`artes`, `amarelinha`, `esporte`, `social`, `familias`, `educacao`), preservando UUIDs existentes (`esporte`, `educacao`, `familias`) e pausando os 2 "Meio Ambiente" de teste.
   - Home `/` e `/projetos/[slug]` lendo direto do Supabase + formulário `/admin/projetos` atualizado.
2. **Frente 2 — Pagamentos Asaas + E-mails Transacionais Resend (`/conselho` → `/desenvolvimento` → `/banca`):**
   - Substituir legado Stripe por **Asaas** (Pix, cartão, assinatura recorrente, webhooks) + ativar **Resend** (plano grátis 3.000/mês) + chave Pix oficial (`P1`).
3. **Frente 3 — Blog Nativo no Admin (`/conselho` → `/desenvolvimento` → `/banca`):**
   - Substituir antigo CMS do Framer por solução enxuta nativa no Supabase + `/admin/blog` + `/blog/[slug]`.
4. **Frente 4 — Base de Conhecimento / Manual por Cargo (`/desenvolvimento`):**
   - Manual prático dentro do Portal (`/ajuda` + `docs/`) cobrindo Admin, Doador e Voluntário.
