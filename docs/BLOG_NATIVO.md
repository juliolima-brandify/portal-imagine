# 🏗️ Frente 3 — Blog / Notícias Nativo no Admin (`/blog` + `/admin/blog`)

- **Branch**: `feat/blog-nativo` (base `main` `a25e344`)
- **Migração SQL**: `supabase/migrations/20261126_blog_posts_and_storage.sql` (tabela `public.blog_posts` + RLS menor privilégio + bucket público `blog` no Supabase Storage)
- **Decisões marteladas por Julio Lima (25/11/2026)**:
  - **P1 → R10**: Rota pública `/blog` e `/blog/[slug]` no modelo enxuto **Notícias & Prestação de Contas** (`post_type`: `'news' | 'accountability'`), vinculado opcionalmente aos projetos oficiais (`public.projects`).
  - **P2 → R11**: Upload de capas no **Supabase Storage** (bucket público `blog`, máx. `5 MB` no server) com compressão/redimensionamento client-side para **WebP** (`<= 250 KB`, máx. `1600px`) e adapter isolado (`src/lib/blog-media.ts`).
  - **P3 → R12**: Editor em **Markdown minimalista** com barra de 4 atalhos (`H2`, `Negrito`, `Lista`, `Link`), renderizado via AST/blocos React seguros (zero `dangerouslySetInnerHTML`, zero XSS).
  - **P4 → R13**: Bloco condicional na Home `/` (*"Acompanhe os projetos"*, máx. 3 destaques, exibido apenas com `>= 1` post publicado) + seção condicional nas páginas `/projetos/[slug]` + links no menu/rodapé, começando limpo sem seed de textos antigos do Framer.

---

## 1. Regras que não podem quebrar (Fase 2 — `/desenvolvimento`)

- **R1 — Segurança, Whitelist e RLS (Julio / Arquitetura):**
  - *Regra:* Todas as rotas `/api/admin/blog` e `/api/admin/blog/upload` exigem `requireAdmin()` (`401`/`403`), retornam `Cache-Control: no-store` e validam estritamente os campos permitidos (zero mass assignment). No Postgres, `public.blog_posts` permite `SELECT` público apenas para `status = 'published'`.
  - *Falhas que precisa suportar:* chamada sem token, usuário `donor`/`volunteer`, payload com `author_id`/`id`/`created_at` injetados, `PUT` sem `id` (`400`) ou ID inexistente (`404`), slug duplicado (`409`).
  - *Prova:* Testes unitários de `sanitizeAdminBlogPostPayload` (`src/lib/blog-posts.test.mjs`) + revisão da migração RLS + smoke test `401` sem auth.
- **R2 — Proteção contra XSS e HTML arbitrário (Arquitetura / Designer):**
  - *Regra:* O conteúdo Markdown é transformado em nós estruturados (`parseSafeMarkdown`) e renderizado com elementos React nativos — nunca usa `dangerouslySetInnerHTML`; links só aceitam `https://`, `http://` ou caminho relativo `/` (bloqueando `javascript:`, `data:`, `vbscript:`).
  - *Falhas que precisa suportar:* `<script>alert(1)</script>`, `<img onerror=...>`, links `[clique](javascript:alert(1))`, texto colado do Word/WhatsApp.
  - *Prova:* Testes unitários em `src/lib/blog-posts.test.mjs` cobrindo injeção HTML, links maliciosos e formatação básica (`H2`, negrito, listas, links).
- **R3 — Isolamento Visual `.ii-root` e Zero Vazamento de Portal (Julio):**
  - *Regra:* `/blog` e `/blog/[slug]` herdam 100% o CSS escopado `.ii-root` (`src/components/site/imagine-site.css`) e são reconhecidos por `isInstitutionalPath()` (`src/lib/imagine-site.ts`), bloqueando sidebar do Portal (`GlobalLayout`) e Tawk.to (`ConditionalChat`).
  - *Falhas que precisa suportar:* slug com maiúsculas, barra final, query string ou percent-encoding inválido; `/admin/blog` nunca pode ser classificado como rota institucional.
  - *Prova:* Testes unitários de `isInstitutionalPath` (`src/lib/imagine-site.test.mjs`) + inspeção visual.
- **R4 — Fallbacks Seguros / Zero HTTP 500 (Julio):**
  - *Regra:* Erro, timeout ou tabela vazia no Supabase nunca derruba `/`, `/projetos/[slug]`, `/blog` ou `/blog/[slug]` com HTTP 500. Com `0` posts publicados, a Home `/` e `/projetos/[slug]` não renderizam vitrine vazia, e `/blog` exibe estado vazio acolhedor.
  - *Falhas que precisa suportar:* timeout de 4s no Supabase, tabela ainda não migrada, credenciais ausentes.
  - *Prova:* Teste unitário de `loadPublicBlogPostsWithFallback` simulando erro/timeout.
- **R5 — SEO, Canônico, OpenGraph, Sitemap e Robots (Estrategista / Sênior):**
  - *Regra:* Páginas públicas `/blog` e `/blog/[slug]` emitem `metadata` com base canônica `https://imagineinstituto.com`, `og:type = 'article'`, `publishedTime` e `og:image` absoluta (fallback `/img/sobre.webp`). `src/app/sitemap.ts` e `src/app/robots.ts` expõem rotas públicas + posts publicados e bloqueiam `/admin`, `/api`, `/dashboard`, `/embed`.
  - *Falhas que precisa suportar:* `NEXT_PUBLIC_BASE_URL` ausente ou apontando para `portal.`, capa sem URL absoluta, resumo vazio.
  - *Prova:* Testes unitários de `resolveCanonicalUrl`, `resolveAbsoluteOgImage` e `deriveExcerpt` + build `vinext`.
- **R6 — Estabilidade de Slugs (Cofre / Sênior):**
  - *Regra:* `slug` é único (`UNIQUE`), normalizado ASCII minúsculo e não pode colidir com palavras reservadas (`admin`, `api`, `novo`, `editar`). Alterar o título de um post já existente **não** sobrescreve o `slug` automaticamente.
  - *Falhas que precisa suportar:* títulos com acentos, pontuação, emojis, título duplicado (`23505` → HTTP `409`), slugs reservados (`422`).
  - *Prova:* Testes unitários de `normalizeBlogSlug` e `sanitizeAdminBlogPostPayload`.
- **R7 — Upload Seguro e Otimização de Capas (Sênior / Diabo):**
  - *Regra:* `/api/admin/blog/upload` valida MIME e magic bytes (`WEBP`, `JPEG`, `PNG`), rejeita arquivos acima de `5 MB` (`413`) e grava no bucket `blog` do Supabase Storage com `cacheControl: '31536000'`. O cliente comprime/redimensiona para WebP (`<= 1600px`) antes de enviar.
  - *Falhas que precisa suportar:* arquivo falso (`.txt` renomeado para `.jpg`), arquivo > 5 MB, falha de rede no upload, tentativa de upload sem admin (`401`/`403`).
  - *Prova:* Teste unitário de detecção de magic bytes (`detectImageMimeFromBytes`) e validação de tamanho.
- **R8 — Fluxo Anti-Abandono e Anti-Duplo-Clique (Atrito / Designer):**
  - *Regra:* Publicar exige apenas Título, Tipo, Corpo (e Capa opcional com fallback seguro), derivando `slug`, `excerpt`, `seo_title`, `seo_description` e `readingTimeMinutes` automaticamente. Botões de salvar/publicar ficam travados durante `await` e o modal só fecha após resposta de sucesso.
  - *Falhas que precisa suportar:* duplo clique em "Publicar", perda de sessão no meio da edição, erro 409 de slug exibido sem fechar o modal.
  - *Prova:* Revisão do componente `BlogPostForm` + teste unitário de derivação automática.

---

## 2. Pendências de regra de negócio
- Nenhuma pendência bloqueante aberta para a Frente 3 (`P1`–`P4` decididas em 25/11/2026).
- *Dependência operacional de produção:* aplicar `supabase/migrations/20261126_blog_posts_and_storage.sql` no Supabase `zzxtethlsdjjfjjrqmlk` após aprovação da `/banca` e antes do deploy final.

---

## 3. Gabarito de Tela Irmã e Modal Irmão (Bloco 4 — Interface e UX)
- **Tela Irmã Admin:** `src/app/admin/projetos/page.tsx` (header `max-w-7xl mx-auto`, barra de filtros em `.card p-6 mb-6` com `grid`, seletores e input `.input-modern` alinhados com altura uniforme, botões `.btn-primary` / `.btn-secondary`, `ToastContainer` e `ConfirmDialog`).
- **Modal Irmão Admin:** `src/components/ConfirmDialog.tsx` (`Modal` em 3 zonas: cabeçalho fixo com `X`, corpo com rolagem interna sem caixas aninhadas, rodapé fixo com `Cancelar` `type="button"` e botões de ação travados durante `loading`).
- **Tela Irmã Pública:** `src/components/site/ImagineSitePage.tsx` + `src/components/site/imagine-site.css` (`.ii-root`, `.proj-hero`, `.pp`, `.pp-txt`, `.pp-doa`, `.projs`, `.proj`, `.filtros`, `.gb`).
