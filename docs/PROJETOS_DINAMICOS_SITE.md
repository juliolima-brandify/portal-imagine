# 🏗️ Projetos 100% Dinâmicos no Site Institucional (Supabase → Site)

- **Branch**: `feat/projetos-dinamicos` (base `main` `c9d38bd`)
- **Migração aplicada no Supabase (`zzxtethlsdjjfjjrqmlk`)**: `supabase/migrations/20261125_dynamic_site_projects.sql` (`slug`, `show_on_site`, `site_order`, `site_data` + índice único parcial `projects_slug_unique_idx`).
- **Decisões aprovadas por Julio Lima (24/11/2026)**:
  1. Atualizar os 3 projetos existentes no Supabase (`esporte`, `educacao`, `familias` preservando UUIDs), criar os outros 3 oficiais (`artes`, `amarelinha`, `social`) e pausar/ocultar do site os 2 projetos "Meio Ambiente" de teste (`status = 'paused'`, `show_on_site = false`).
  2. Adicionar colunas `slug` (`UNIQUE`), `show_on_site` (`BOOLEAN`), `site_order` (`INT`) e `site_data` (`JSONB`) em `public.projects`.

---

## 1. Regras que não podem quebrar (Fase 2 — `/desenvolvimento`)

- **R1 — Sincronização Admin → Site (decidida por Julio Lima):**
  - *Regra:* Criar, editar, reordenar, pausar ou ocultar um projeto em `/admin/projetos` sempre reflete automaticamente na Home `/` (com filtro dinâmico por causa), em `/empresas`, na página pública `/projetos/[slug]` e no modal de doação.
  - *Falhas que precisa suportar:* `site_data` vazio ou parcial; duplicação de projeto no admin sem colidir no `UNIQUE (slug)`; duplo clique no botão Salvar (travamento durante `await`).
  - *Prova:* Teste unitário de mapeamento (`mapDbProjectToSiteProject` com `site_data` completo e parcial) + consulta real ao Supabase após seed.
- **R2 — Preservação das 6 URLs oficiais e identidade `.ii-root` (decidida por Julio Lima):**
  - *Regra:* As 6 URLs oficiais (`/projetos/artes`, `/projetos/amarelinha`, `/projetos/esporte`, `/projetos/social`, `/projetos/familias`, `/projetos/educacao`) e qualquer novo `/projetos/<slug>` ativo sempre respondem `200` com o visual `.ii-root` e assets `/img/*`, sem sidebar do Portal e sem chat Tawk.
  - *Falhas que precisa suportar:* slug com maiúsculas, barra final ou query string; slug inexistente (retornar `404` via `notFound()`, nunca `500`); URL de imagem inválida ou maliciosa (`javascript:`, `data:`) substituída por fallback seguro.
  - *Prova:* Teste unitário de `isInstitutionalPath`, `normalizeSlug` e `sanitizeImageUrl` + build `vinext`.
- **R3 — Zero colisão com rotas do Portal (decidida por Julio Lima):**
  - *Regra:* `/projetos` (autenticado do doador) e `/projetos/[id]/relatorios` continuam funcionando sem colisão de segmento dinâmico no App Router (a rota dinâmica pública usa o mesmo segmento `[id]` em `src/app/projetos/[id]/page.tsx`).
  - *Falhas que precisa suportar:* conflito de nomes `[id]` vs `[slug]` no mesmo nível de pasta; `isInstitutionalPath` nunca pode classificar `/projetos` nem `/projetos/<uuid>/relatorios` como rota institucional.
  - *Prova:* Teste unitário de `isInstitutionalPath` + `build vinext`.
- **R4 — Fallback seguro em falha do Supabase (decidida por Julio Lima):**
  - *Regra:* Falha de rede, timeout ou erro no Supabase nunca derruba a Home `/` nem `/projetos/[slug]` com HTTP 500 — faz fallback seguro para o catálogo estático `IMAGINE_PROJECTS`, preservando `.pend` e sem inventar metas.
  - *Falhas que precisa suportar:* ausência de variáveis de ambiente, timeout de rede, resposta parcial ou erro 5xx do PostgREST.
  - *Prova:* Teste unitário do carregador com cliente simulando falha/timeout retornando `IMAGINE_PROJECTS`.
- **R5 — Blindagem e Whitelist em `/api/admin/projects` (decidida por Julio Lima):**
  - *Regra:* `/api/admin/projects` só executa com `requireAdmin()` (`401`/`403`) e aceita exclusivamente campos da whitelist real de `public.projects`, bloqueando mass assignment (`current_amount`, `created_at`, colunas inexistentes) e retornando `409` em slug duplicado e `422` em payload inválido.
  - *Falhas que precisa suportar:* payload com campos extras/perigosos, slug reservado (`relatorios`, `admin`, `api`), slug duplicado (`23505`), `PUT` sem `id` (`400`) ou para ID inexistente (`404`).
  - *Prova:* Testes unitários de `sanitizeAdminProjectPayload` cobrindo POST, PUT, campos bloqueados, slug reservado e sanitização de `site_data`.

---

## 2. Pendências de regra de negócio (herdadas do Contexto Geral)

- **P1 — Chave Pix oficial:** `pixChave: ""` até confirmação oficial do Instituto. *Comportamento até a resposta:* modal de doação exibe fallback seguro via WhatsApp.
- **P2 — Leis de incentivo / Imposto de Renda:** `irAtivo: false` até aprovação oficial. *Comportamento até a resposta:* mantém selo "Em breve" e aviso de preparação.
- **P3 — Beneficiários e Meta 2026 no site:** números oficiais ainda não confirmados. *Comportamento até a resposta:* exibir `<span className="pend">a definir</span>` nos cards e na página do projeto sempre que `site_data.beneficiarios` / `site_data.metaTexto` não forem informados.

---

## 3. Gabarito de Tela Irmã (Bloco 4 — Interface e UX)

- **Site Institucional:** `src/components/site/ImagineSitePage.tsx` + `src/components/site/imagine-site.css` (`.ii-root`) — zero alteração de layout/classes; apenas substituição da fonte de dados estática pela lista dinâmica vinda do Supabase.
- **Admin (`/admin/projetos`):** `src/app/admin/projetos/page.tsx` + `src/components/ProjectForm.tsx` usando o `Modal` padrão de `src/components/ConfirmDialog.tsx` (3 zonas fixas: cabeçalho com título e botão `X`, corpo com rolagem interna sem caixas aninhadas, rodapé fixo com `Cancelar` `type="button"` e botão primário desabilitado durante o `await` da gravação, fechando apenas após sucesso).
