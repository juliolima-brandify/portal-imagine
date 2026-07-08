# 🎨 Integração Portal ↔ Framer — Referência Técnica

> **Estado:** ✅ Construída e publicada ao vivo (08/07/2026). Mudar um projeto no banco reflete no site Framer sozinho em ~10s.
>
> Fonte canônica de estado do projeto: [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md). Este documento é a referência operacional dedicada da integração — um dev/agente futuro deve conseguir operar tudo só lendo aqui.

---

## 1. Arquitetura

- **Portal Next.js (`portal.imagineinstituto.com`) = motor / fonte da verdade.** Admin, checkout, Supabase. É onde os projetos são criados e editados.
- **Site Framer (`imagineinstituto.com`) = vitrine pública.** Marketing e páginas de cada projeto, geradas por CMS + template.

Fluxo de dados (unidirecional para conteúdo, com o portal como origem):

```
Admin cria/edita projeto
        │
        ▼
Supabase  public.projects  (INSERT/UPDATE/DELETE)
        │  trigger  framer_sync_projects
        ▼
função notify_framer_sync  (extensão pg_net → net.http_post)
        │  POST com header x-webhook-secret
        ▼
Portal  /api/webhooks/supabase-projects  (runtime nodejs)
        │  src/lib/framer-sync.ts  (pacote npm framer-api)
        ▼
Framer CMS  collection "Programas"  (upsert/remove do item)
        │  framer.publish()
        ▼
Página pública  imagineinstituto.com/programas/{slug}
```

- **Elo 1 (Portal → Framer):** automático, descrito acima.
- **Elo 2 (Framer → Portal):** o botão "Doar" na página Framer aponta para o checkout embed do portal com o `id` do projeto (ver [§4 Embed dinâmico](#4-embed-de-doação-dinâmico)).

---

## 2. Decisão da collection: reusar a "Programas"

O plano Framer do projeto **só permite 2 collections**. Já existiam 2 ("Programas" e outra). Criar uma 3ª collection "Projetos" estourava o limite (3/2) — ela foi criada e depois **deletada**.

**Decisão:** a integração **reusa a collection "Programas"** como destino dos projetos do portal. Não crie uma collection nova.

---

## 3. Template CMS `/programas/[slug]`

- **Detail Page** da collection "Programas", no caminho `/programas/[slug]`.
- Reaproveita o **design da página estática `/esporte`** via o recurso **"Swap Collection"** do Framer (a página estática vira template dinâmico da collection).
- O conteúdo é preenchido por item da collection (ver mapa de campos abaixo).

### Duplicação dos itens curados

Os itens curados que já existiam (`educacao`, `arte`, `esporte`, `social`, `saude`) **também** ganham uma URL `/programas/{slug}` pela template. **Decisão atual (opção a): deixar como está** — essas URLs não são linkadas. Se incomodar no SEO, aplicar `noindex` depois (follow-up não-bloqueante).

---

## 4. Embed de doação dinâmico

Cada item da "Programas" tem um campo de texto **`EmbedURL`** que guarda a URL do checkout embed do portal, específica daquele projeto:

```
https://portal.imagineinstituto.com/embed/checkout/checkout-stripe?project=<id>&source=embed&utm_campaign=<slug>
```

No Framer, o componente **Embed (Type: URL)** da template tem a sua URL **ligada por "Convert"** ao campo `EmbedURL` da collection. Assim cada página `/programas/{slug}` renderiza o checkout do projeto correto sem configuração manual. Esse é o **Elo 2** (Framer → Portal).

---

## 5. Mapa de campos (Supabase `projects` → Framer "Programas")

| Campo Framer | Origem no `projects` | Observação |
|---|---|---|
| `Title` | `title` | |
| `Excerpt` | `description` | resumo curto |
| `Content 2` | `long_description` (HTML) | corpo/Introdução |
| `Featured Image` | `image_url` **ou fallback** | **obrigatória** na Programas; se o projeto não tem foto http, usa o **logo do portal** como fallback |
| `Link` | `/doar/{id}` | |
| `Date` | `created_at` | |
| `EmbedURL` | URL do embed (ver §4) | montada com `id` + `slug` |

Colunas de controle adicionadas à tabela `public.projects`:

- `framer_item_id` — id do item correspondente na collection Framer
- `framer_synced_at` — timestamp do último sync
- `framer_sync_status` — estado do último sync

> **Prevenção de loop:** a rota do webhook **ignora eventos que só alteram colunas `framer_*`**, para que a escrita de volta desses campos não dispare um novo ciclo de sync.

---

## 6. Código no portal

| Arquivo | Papel |
|---|---|
| `src/lib/framer-sync.ts` | Upsert/remove de itens via pacote npm **`framer-api`** (import dinâmico ESM). Aplica a imagem de fallback (logo do portal) quando o projeto não tem foto http, pois `Featured Image` é obrigatória. |
| `src/app/api/webhooks/supabase-projects/route.ts` | Rota do webhook. Runtime **`nodejs`**. Valida o header **`x-webhook-secret`**. Ignora eventos que só mexem nas colunas `framer_*` (anti-loop). |

O pacote **`framer-api`** foi adicionado ao `package.json`.

---

## 7. Database Webhook (Supabase)

- **Trigger:** `framer_sync_projects` na tabela `public.projects`.
- **Função:** `notify_framer_sync`, usando a extensão **`pg_net`** (`net.http_post`).
- **Ação:** faz `POST` para a rota `/api/webhooks/supabase-projects` do portal, enviando o header **`x-webhook-secret`** com o valor de `SUPABASE_WEBHOOK_SECRET`.
- **Testado E2E:** alterar um projeto no banco reflete no Framer em ~10s, sem intervenção.

---

## 8. Variáveis de ambiente

Configuradas na **Vercel (produção + preview)** e no **`.env.local`** (gitignored):

| Variável | Descrição |
|---|---|
| `FRAMER_API_TOKEN` | Token do CMS do Framer (`fr_...`). **Segredo.** |
| `FRAMER_PROJECT_URL` | `https://framer.com/projects/INSTITUTO-IMAGINE--JFOlu58SVKtN8DOxXad7-hZJ4s` |
| `SUPABASE_WEBHOOK_SECRET` | Segredo compartilhado com o trigger `pg_net`; validado no header `x-webhook-secret`. **Segredo.** |

> ⚠️ **Nunca** escreva o valor do `FRAMER_API_TOKEN` nem do `SUPABASE_WEBHOOK_SECRET` em arquivos versionados. Eles vivem só no `.env.local` e na Vercel.

---

## 9. Como publicar (deploy do Framer)

A publicação usa a API do pacote **`framer-api`**:

- **`framer.publish()`** — publica ao vivo e **já vai para o domínio custom** (`imagineinstituto.com`). Foi assim que a integração subiu (deployment `b0baae0de`).
- **`deploy(deploymentId, domains)`** — disponível caso precise **promover um deployment manualmente** para domínios específicos.

Verificação pós-publish: `imagineinstituto.com/programas/{slug}` deve retornar 200 (ex.: `/programas/esporte-social`, `/programas/educacao-digital`, `/programas/saude-comunitaria`).

---

## 10. Operação do dia a dia

- **Criar/editar/excluir um projeto:** faça no **admin do portal**. O sync para o Framer é automático (trigger → webhook → `framer-api`). Excluir um projeto no admin **remove o item do Framer** automaticamente.
- **Publicar mudanças de layout/template do Framer:** use `framer.publish()`.
- **Depurar um sync que não refletiu:** verifique `framer_sync_status`/`framer_synced_at` na linha do projeto, os logs da rota `/api/webhooks/supabase-projects` na Vercel, e se o header `x-webhook-secret` bate com `SUPABASE_WEBHOOK_SECRET`.

---

## 11. Follow-ups (não-bloqueantes)

1. **Fotos reais nos projetos** — hoje os projetos sem foto http usam o **logo de fallback** em `Featured Image`. Adicionar imagens reais.
2. **Limpar projetos-seed de teste** (ex.: "Meio Ambiente (Cópia)") — basta deletar no admin; some do Framer automaticamente.
3. **`noindex` nos itens curados** (`educacao`/`arte`/`esporte`/`social`/`saude`) — só se a duplicação `/programas/{slug}` incomodar no SEO.

---

*Documento criado em 08/07/2026. Para o estado geral do projeto, ver [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md).*
