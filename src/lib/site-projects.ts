import type { ProjectInfo } from './imagine-site'

export type ProjectColorClass = 'cor-magenta' | 'cor-verde' | 'cor-azul' | 'cor-laranja'

export const ALLOWED_PROJECT_CATEGORIES = [
  'cultura',
  'educacao',
  'esporte',
  'social',
  'saude',
  'meio-ambiente',
] as const

export type ProjectCategory = (typeof ALLOWED_PROJECT_CATEGORIES)[number]

export const ALLOWED_PROJECT_STATUSES = [
  'active',
  'paused',
  'completed',
  'cancelled',
] as const

export type ProjectStatus = (typeof ALLOWED_PROJECT_STATUSES)[number]

export const ALLOWED_COLOR_CLASSES: readonly ProjectColorClass[] = [
  'cor-magenta',
  'cor-verde',
  'cor-azul',
  'cor-laranja',
]

export const RESERVED_PROJECT_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'novo',
  'editar',
  'relatorios',
  'projetos',
  'empresas',
  'natal-feliz',
  'politica-de-privacidade',
  'entrar',
  'geral',
  'natal',
])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ProjectSiteData {
  frente?: string
  causa?: string
  corClass?: ProjectColorClass
  heroImg?: string
  alt?: string
  resumo?: string
  intro?: string
  desafio?: string
  fazemos?: string[]
  incentivoTag?: string
  incentivoAviso?: string
  beneficiarios?: string
  metaTexto?: string
  portalCampaignSlug?: string
}

export interface DbProjectRow {
  id: string
  title: string
  description?: string | null
  long_description?: string | null
  category?: string | null
  target_amount?: number | string | null
  current_amount?: number | string | null
  status?: string | null
  location?: string | null
  image_url?: string | null
  slug?: string | null
  show_on_site?: boolean | null
  site_order?: number | null
  site_data?: Record<string, unknown> | null
}

const DEFAULT_PROJECT_IMAGE = '/img/sobre.webp'

export function isValidUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

export function normalizeSlug(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return ''
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function isValidProjectSlug(slug: string): boolean {
  if (!slug || RESERVED_PROJECT_SLUGS.has(slug) || UUID_REGEX.test(slug)) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function sanitizeImageUrl(
  url: string | null | undefined,
  fallback: string = DEFAULT_PROJECT_IMAGE
): string {
  if (typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  // Permite caminhos relativos internos seguros (ex.: /img/esporte.webp),
  // bloqueando //, /\ e caracteres de controle/espaço.
  if (trimmed.startsWith('/')) {
    if (/^\/(?!\/|\\)[^\s\\<>'"\r\n\t\0]+$/.test(trimmed)) {
      return trimmed
    }
    return fallback
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    return fallback
  }

  return fallback
}

export function categoryToCausa(category: string | null | undefined): string {
  const clean = typeof category === 'string' ? category.toLowerCase() : ''
  switch (clean) {
    case 'cultura':
      return 'Cultura e Artes'
    case 'educacao':
      return 'Educação'
    case 'esporte':
      return 'Esporte'
    case 'social':
      return 'Assistência Social'
    case 'saude':
      return 'Saúde'
    case 'meio-ambiente':
      return 'Meio Ambiente'
    default:
      return 'Projeto Social'
  }
}

export function categoryToCorClass(category: string | null | undefined): ProjectColorClass {
  const clean = typeof category === 'string' ? category.toLowerCase() : ''
  switch (clean) {
    case 'cultura':
    case 'saude':
      return 'cor-magenta'
    case 'educacao':
    case 'meio-ambiente':
      return 'cor-verde'
    case 'social':
      return 'cor-laranja'
    case 'esporte':
    default:
      return 'cor-azul'
  }
}

function cleanString(value: unknown, maxLen = 1000): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLen)
}

function parseStrictFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function sanitizeSiteData(raw: unknown): ProjectSiteData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const out: ProjectSiteData = {}

  const frente = cleanString(src.frente, 160)
  if (frente) out.frente = frente

  const causa = cleanString(src.causa, 80)
  if (causa) out.causa = causa

  if (typeof src.corClass === 'string' && (ALLOWED_COLOR_CLASSES as readonly string[]).includes(src.corClass)) {
    out.corClass = src.corClass as ProjectColorClass
  }

  const rawHeroImg = cleanString(src.heroImg, 500)
  if (rawHeroImg) {
    const safeHero = sanitizeImageUrl(rawHeroImg, '')
    if (safeHero) out.heroImg = safeHero
  }

  const alt = cleanString(src.alt, 260)
  if (alt) out.alt = alt

  const resumo = cleanString(src.resumo, 600)
  if (resumo) out.resumo = resumo

  const intro = cleanString(src.intro, 4000)
  if (intro) out.intro = intro

  const desafio = cleanString(src.desafio, 2000)
  if (desafio) out.desafio = desafio

  if (Array.isArray(src.fazemos)) {
    const items = src.fazemos
      .map((item) => cleanString(item, 240))
      .filter((item): item is string => Boolean(item))
      .slice(0, 20)
    if (items.length > 0) out.fazemos = items
  }

  const incentivoTag = cleanString(src.incentivoTag, 120)
  if (incentivoTag) out.incentivoTag = incentivoTag

  const incentivoAviso = cleanString(src.incentivoAviso, 600)
  if (incentivoAviso) out.incentivoAviso = incentivoAviso

  const beneficiarios = cleanString(src.beneficiarios, 80)
  if (beneficiarios) out.beneficiarios = beneficiarios

  const metaTexto = cleanString(src.metaTexto, 80)
  if (metaTexto) out.metaTexto = metaTexto

  const portalCampaignSlug = cleanString(src.portalCampaignSlug, 80)
  if (portalCampaignSlug) {
    const normalizedCampaign = normalizeSlug(portalCampaignSlug)
    if (normalizedCampaign) out.portalCampaignSlug = normalizedCampaign
  }

  return out
}

export function mapDbProjectToSiteProject(row: DbProjectRow): ProjectInfo | null {
  if (!row || typeof row.id !== 'string' || !row.id.trim()) return null
  if (row.status !== 'active' || row.show_on_site !== true) return null

  const slug = normalizeSlug(row.slug)
  if (!isValidProjectSlug(slug)) return null

  const titulo = cleanString(row.title, 200)
  if (!titulo) return null

  const sd = sanitizeSiteData(row.site_data)
  const causa = sd.causa || categoryToCausa(row.category)
  const frente = sd.frente || causa
  const corClass = sd.corClass || categoryToCorClass(row.category)
  const cardImg = sanitizeImageUrl(row.image_url, DEFAULT_PROJECT_IMAGE)
  const heroImg = sanitizeImageUrl(sd.heroImg || row.image_url, cardImg)
  const resumo = sd.resumo || cleanString(row.description, 600) || ''
  const intro = sd.intro || cleanString(row.long_description, 4000) || resumo

  return {
    id: slug,
    titulo,
    frente,
    causa,
    corClass,
    cardImg,
    heroImg,
    alt: sd.alt || titulo,
    resumo,
    intro,
    desafio: sd.desafio || '',
    fazemos: sd.fazemos || [],
    incentivoTag: sd.incentivoTag,
    incentivoAviso: sd.incentivoAviso,
    beneficiarios: sd.beneficiarios,
    metaTexto: sd.metaTexto,
    shareUrl: `https://imagineinstituto.com/projetos/${slug}/`,
    portalProjectId: row.id,
    portalCampaignSlug: sd.portalCampaignSlug || slug,
  }
}

export function mapDbProjectsToSiteProjects(rows: DbProjectRow[]): ProjectInfo[] {
  const seen = new Set<string>()
  const result: ProjectInfo[] = []
  for (const row of rows) {
    const mapped = mapDbProjectToSiteProject(row)
    if (!mapped || seen.has(mapped.id)) continue
    seen.add(mapped.id)
    result.push(mapped)
  }
  return result
}

export async function loadPublicSiteProjectsWithFallback(
  loader: () => Promise<DbProjectRow[]>,
  fallbackProjects: ProjectInfo[]
): Promise<ProjectInfo[]> {
  try {
    const rows = await loader()
    const mapped = mapDbProjectsToSiteProjects(rows)
    // Se o PostgREST devolver lista vazia (ex.: falha de RLS ou banco sem seed),
    // preserva o catálogo institucional estático para nunca tirar os 6 projetos oficiais do ar (R2/R4).
    if (mapped.length === 0) {
      return fallbackProjects
    }
    return mapped
  } catch (err) {
    console.warn('⚠️ Falha ao carregar projetos do Supabase; usando catálogo estático de fallback:', err)
    return fallbackProjects
  }
}

export type SanitizePayloadResult =
  | { ok: true; data: Record<string, unknown>; id?: string }
  | { ok: false; status: number; error: string }

/**
 * Whitelist estrita para POST e PUT em /api/admin/projects.
 * Bloqueia mass assignment (current_amount, created_at, colunas inexistentes, etc.).
 */
export function sanitizeAdminProjectPayload(
  raw: unknown,
  mode: 'create' | 'update'
): SanitizePayloadResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'Corpo da requisição inválido' }
  }

  const body = raw as Record<string, unknown>
  const out: Record<string, unknown> = {}

  let targetId: string | undefined
  if (mode === 'update') {
    if (!isValidUuid(typeof body.id === 'string' ? body.id : '')) {
      return { ok: false, status: 400, error: 'ID do projeto inválido (esperado UUID)' }
    }
    targetId = (body.id as string).trim()
  }

  if (mode === 'create' || body.title !== undefined) {
    const title = cleanString(body.title, 200)
    if (!title) {
      return { ok: false, status: 422, error: 'Título do projeto é obrigatório' }
    }
    out.title = title
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      return { ok: false, status: 422, error: 'Descrição deve ser um texto válido' }
    }
    out.description = body.description.trim().slice(0, 2000)
  } else if (mode === 'create') {
    out.description = ''
  }

  if (body.long_description !== undefined) {
    if (body.long_description !== null && typeof body.long_description !== 'string') {
      return { ok: false, status: 422, error: 'Descrição detalhada deve ser um texto válido' }
    }
    out.long_description =
      typeof body.long_description === 'string' ? body.long_description.trim().slice(0, 10000) : ''
  }

  if (mode === 'create' || body.category !== undefined) {
    const category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : ''
    if (!(ALLOWED_PROJECT_CATEGORIES as readonly string[]).includes(category)) {
      return {
        ok: false,
        status: 422,
        error: `Categoria inválida. Use: ${ALLOWED_PROJECT_CATEGORIES.join(', ')}`,
      }
    }
    out.category = category
  }

  if (body.target_amount !== undefined) {
    const num = parseStrictFiniteNumber(body.target_amount)
    if (num === null || num < 0) {
      return { ok: false, status: 422, error: 'Meta de arrecadação deve ser um número válido >= 0' }
    }
    out.target_amount = Math.round(num * 100) / 100
  } else if (mode === 'create') {
    out.target_amount = 0
  }

  if (body.status !== undefined) {
    const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : ''
    if (!(ALLOWED_PROJECT_STATUSES as readonly string[]).includes(status)) {
      return {
        ok: false,
        status: 422,
        error: `Status inválido. Use: ${ALLOWED_PROJECT_STATUSES.join(', ')}`,
      }
    }
    out.status = status
  } else if (mode === 'create') {
    out.status = 'active'
  }

  if (body.location !== undefined) {
    if (body.location !== null && typeof body.location !== 'string') {
      return { ok: false, status: 422, error: 'Localização deve ser um texto válido' }
    }
    out.location = typeof body.location === 'string' ? body.location.trim().slice(0, 200) : ''
  }

  if (body.image_url !== undefined) {
    if (body.image_url !== null && typeof body.image_url !== 'string') {
      return { ok: false, status: 422, error: 'URL da imagem deve ser um texto válido' }
    }
    const rawImg = typeof body.image_url === 'string' ? body.image_url.trim() : ''
    if (!rawImg) {
      out.image_url = ''
    } else {
      const safe = sanitizeImageUrl(rawImg, '')
      if (!safe) {
        return {
          ok: false,
          status: 422,
          error: 'URL da imagem inválida. Use caminho relativo (/img/...) ou https://',
        }
      }
      out.image_url = safe
    }
  }

  if (body.timeline !== undefined) {
    if (body.timeline !== null && typeof body.timeline !== 'string') {
      return { ok: false, status: 422, error: 'Timeline deve ser um texto válido' }
    }
    out.timeline = typeof body.timeline === 'string' ? body.timeline.trim().slice(0, 200) : null
  }

  if (body.organization !== undefined) {
    if (typeof body.organization !== 'string') {
      return { ok: false, status: 422, error: 'Organização deve ser um texto válido' }
    }
    out.organization = body.organization.trim().slice(0, 200) || 'Instituto Imagine'
  }

  if (body.slug !== undefined) {
    if (body.slug === null || (typeof body.slug === 'string' && !body.slug.trim())) {
      out.slug = null
    } else if (typeof body.slug === 'string') {
      const normalized = normalizeSlug(body.slug)
      if (!isValidProjectSlug(normalized)) {
        return {
          ok: false,
          status: 422,
          error: 'Slug inválido ou reservado. Use letras minúsculas, números e hífens (ex.: artes-juvenil).',
        }
      }
      out.slug = normalized
    } else {
      return { ok: false, status: 422, error: 'Slug inválido' }
    }
  }

  if (body.show_on_site !== undefined) {
    if (typeof body.show_on_site !== 'boolean') {
      return { ok: false, status: 422, error: 'show_on_site deve ser booleano' }
    }
    out.show_on_site = body.show_on_site
  } else if (mode === 'create') {
    out.show_on_site = Boolean(out.slug)
  }

  // Invariante: não permitir show_on_site = true sem slug válido
  if (mode === 'create' && out.show_on_site === true && !out.slug) {
    return {
      ok: false,
      status: 422,
      error: 'Informe um slug válido para exibir o projeto no site institucional.',
    }
  }
  if (mode === 'update') {
    if (out.show_on_site === true && out.slug === null) {
      return {
        ok: false,
        status: 422,
        error: 'Informe um slug válido para exibir o projeto no site institucional.',
      }
    }
    if (out.slug === null && out.show_on_site === undefined) {
      out.show_on_site = false
    }
  }

  if (body.site_order !== undefined) {
    const order = parseStrictFiniteNumber(body.site_order)
    if (order === null || !Number.isInteger(order) || order < 0 || order > 9999) {
      return { ok: false, status: 422, error: 'Ordem no site deve ser um inteiro entre 0 e 9999' }
    }
    out.site_order = order
  } else if (mode === 'create') {
    out.site_order = 100
  }

  if (body.site_data !== undefined) {
    if (!body.site_data || typeof body.site_data !== 'object' || Array.isArray(body.site_data)) {
      return { ok: false, status: 422, error: 'site_data deve ser um objeto JSON válido' }
    }
    out.site_data = sanitizeSiteData(body.site_data)
  } else if (mode === 'create') {
    out.site_data = {}
  }

  if (mode === 'update' && Object.keys(out).length === 0) {
    return { ok: false, status: 400, error: 'Nenhum campo válido informado para atualização' }
  }

  return { ok: true, data: out, id: targetId }
}
