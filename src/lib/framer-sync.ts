import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Sincronização Portal → Framer (Elo 1).
 *
 * Cada projeto do portal (tabela `projects`) vira/atualiza um item na collection
 * "Programas" do Framer, que é renderizado pela CMS template page `/programas/[slug]`.
 * O vínculo é rastreado por `projects.framer_item_id` (nunca tocamos nos itens
 * curados que não têm esse id no nosso lado).
 *
 * Usa o pacote `framer-api` (WebSocket) — por isso a rota que chama isto roda no
 * runtime Node (não Edge).
 */

const FRAMER_PROJECT = process.env.FRAMER_PROJECT_URL || ''
const FRAMER_TOKEN = process.env.FRAMER_API_TOKEN || ''
const PORTAL = process.env.NEXTAUTH_URL || 'https://portal.imagineinstituto.com'

const SYNC_STATUSES = ['active', 'completed']

export type Project = {
  id: string
  title: string
  description?: string | null
  long_description?: string | null
  image_url?: string | null
  organization?: string | null
  status?: string | null
  created_at?: string | null
  framer_item_id?: string | null
}

export function slugify(s: string): string {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function embedUrl(id: string, title: string): string {
  return `${PORTAL}/embed/checkout/checkout-stripe?project=${id}&source=embed&utm_campaign=${slugify(title)}`
}

function checkoutUrl(id: string): string {
  return `${PORTAL}/doar/${id}`
}

async function connectFramer() {
  if (!FRAMER_PROJECT || !FRAMER_TOKEN) {
    throw new Error('FRAMER_PROJECT_URL ou FRAMER_API_TOKEN não configurados')
  }
  // import dinâmico: framer-api é ESM-only
  const { connect } = await import('framer-api')
  return connect(FRAMER_PROJECT, FRAMER_TOKEN)
}

async function getProgramasCollection(framer: any) {
  const cols = await framer.getCollections()
  const prog = cols.find((c: any) => (c.name || '').toLowerCase() === 'programas')
  if (!prog) throw new Error('Collection "Programas" não encontrada no Framer')
  return prog
}

function buildFieldData(project: Project, fieldsByName: Record<string, any>) {
  const f = (name: string) => fieldsByName[name]?.id
  const fd: Record<string, any> = {}

  fd[f('Title')] = { type: 'string', value: project.title || '' }
  fd[f('Excerpt')] = { type: 'string', value: project.description || '' }
  fd[f('Content 2')] = {
    type: 'formattedText',
    value: `<h5>Introdução</h5><p>${esc(project.long_description || project.description || '')}</p>`,
  }
  fd[f('Featured Post')] = { type: 'boolean', value: false }
  fd[f('Link')] = { type: 'link', value: checkoutUrl(project.id) }
  fd[f('EmbedURL')] = { type: 'string', value: embedUrl(project.id, project.title) }
  if (project.created_at) fd[f('Date')] = { type: 'date', value: new Date(project.created_at).toISOString() }
  // imagem só se for URL pública absoluta (Framer re-hospeda)
  if (typeof project.image_url === 'string' && project.image_url.startsWith('http')) {
    fd[f('Featured Image')] = { type: 'image', value: project.image_url }
  }

  // remove chaves de campos que não existem na collection
  for (const k of Object.keys(fd)) if (!k || k === 'undefined') delete fd[k]
  return fd
}

/**
 * Cria ou atualiza o item do projeto na "Programas".
 * Retorna o id do item Framer.
 */
export async function syncProjectToFramer(project: Project): Promise<string | null> {
  // status fora do escopo público → remover do Framer se existia
  if (!SYNC_STATUSES.includes(project.status || '')) {
    if (project.framer_item_id) await removeProjectFromFramer(project.framer_item_id, project.id)
    return null
  }

  const framer = await connectFramer()
  try {
    const prog = await getProgramasCollection(framer)
    const fields = await prog.getFields()
    const byName: Record<string, any> = {}
    for (const f of fields) byName[f.name] = f
    const fd = buildFieldData(project, byName)

    let itemId = project.framer_item_id || null

    if (itemId) {
      // atualizar item existente (merge por id)
      await prog.addItems([{ id: itemId, fieldData: fd }])
    } else {
      // criar novo item
      const slug = slugify(project.title)
      await prog.addItems([{ slug, fieldData: fd }])
      // addItems retorna void → reconsultar para obter o id
      const items = await prog.getItems()
      const created = items.find((i: any) => i.slug === slug)
      itemId = created?.id || null
    }

    await supabaseAdmin
      .from('projects')
      .update({
        framer_item_id: itemId,
        framer_synced_at: new Date().toISOString(),
        framer_sync_status: 'synced',
      })
      .eq('id', project.id)

    return itemId
  } finally {
    await framer.disconnect?.()
  }
}

/** Remove o item do projeto no Framer. */
export async function removeProjectFromFramer(framerItemId: string, projectId?: string): Promise<void> {
  const framer = await connectFramer()
  try {
    const prog = await getProgramasCollection(framer)
    await prog.removeItems([framerItemId])
    if (projectId) {
      await supabaseAdmin
        .from('projects')
        .update({ framer_item_id: null, framer_synced_at: new Date().toISOString(), framer_sync_status: 'removed' })
        .eq('id', projectId)
    }
  } finally {
    await framer.disconnect?.()
  }
}
