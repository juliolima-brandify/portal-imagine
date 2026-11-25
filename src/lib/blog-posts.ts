import type { ProjectInfo } from './imagine-site'

export const SITE_CANONICAL_ORIGIN = 'https://imagineinstituto.com'
export const DEFAULT_BLOG_COVER = '/img/sobre.webp'
export const MAX_BLOG_COVER_BYTES = 5 * 1024 * 1024 // 5 MB

export const ALLOWED_BLOG_POST_TYPES = ['news', 'accountability'] as const
export type BlogPostType = (typeof ALLOWED_BLOG_POST_TYPES)[number]

export const ALLOWED_BLOG_POST_STATUSES = ['draft', 'published', 'archived'] as const
export type BlogPostStatus = (typeof ALLOWED_BLOG_POST_STATUSES)[number]

export const RESERVED_BLOG_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'blog',
  'novo',
  'editar',
  'upload',
  'projetos',
  'empresas',
  'natal-feliz',
  'politica-de-privacidade',
  'entrar',
])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UNSAFE_RELATIVE_URL_CHARS = /[\u0000-\u001f\u007f\s\\<>'"]/

export interface DbBlogPostRow {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content?: string | null
  post_type?: BlogPostType | string | null
  project_id?: string | null
  cover_image_url?: string | null
  cover_alt?: string | null
  status?: BlogPostStatus | string | null
  seo_title?: string | null
  seo_description?: string | null
  author_id?: string | null
  published_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PublicBlogPostSummary {
  id: string
  slug: string
  title: string
  excerpt: string
  postType: BlogPostType
  postTypeLabel: string
  projectId: string | null
  projectSlug: string | null
  projectTitle: string | null
  projectColorClass: ProjectInfo['corClass']
  coverImageUrl: string
  coverAlt: string
  seoTitle: string
  seoDescription: string
  publishedAt: string
  readingTimeMinutes: number
  shareUrl: string
}

export interface PublicBlogPost extends PublicBlogPostSummary {
  content: string
}

export interface AdminBlogPostWriteData {
  slug?: string
  title?: string
  excerpt?: string
  content?: string
  post_type?: BlogPostType
  project_id?: string | null
  cover_image_url?: string | null
  cover_alt?: string
  status?: BlogPostStatus
  seo_title?: string | null
  seo_description?: string | null
  author_id?: string
  published_at?: string
}

export type MarkdownInline =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'link'; label: string; href: string }

export type MarkdownBlock =
  | { type: 'h2'; inlines: MarkdownInline[] }
  | { type: 'h3'; inlines: MarkdownInline[] }
  | { type: 'p'; inlines: MarkdownInline[] }
  | { type: 'blockquote'; inlines: MarkdownInline[] }
  | { type: 'ul'; items: MarkdownInline[][] }

export function resolveSiteMetadataBase(): URL {
  return new URL(SITE_CANONICAL_ORIGIN)
}

export function isValidBlogUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

export function normalizeBlogSlug(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return ''
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '')
}

export function isValidBlogSlug(slug: string | null | undefined): boolean {
  if (typeof slug !== 'string') return false
  const clean = slug.trim()
  if (clean.length < 2 || clean.length > 100) return false
  if (RESERVED_BLOG_SLUGS.has(clean)) return false
  if (UUID_REGEX.test(clean)) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)
}

function validateSafeRelativePath(trimmed: string): string | null {
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null
  if (UNSAFE_RELATIVE_URL_CHARS.test(trimmed)) return null
  try {
    const resolved = new URL(trimmed, 'https://imagine.local')
    if (resolved.origin !== 'https://imagine.local') return null
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return null
  }
}

export function sanitizeBlogCoverUrl(
  url: string | null | undefined,
  fallback = DEFAULT_BLOG_COVER
): string {
  if (typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  if (trimmed.startsWith('/')) {
    return validateSafeRelativePath(trimmed) ?? fallback
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

export function sanitizeLinkHref(rawHref: string | null | undefined): string | null {
  if (typeof rawHref !== 'string') return null
  const trimmed = rawHref.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/')) {
    return validateSafeRelativePath(trimmed)
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString()
    }
  } catch {
    return null
  }
  return null
}

/**
 * Scanner linear O(N) para links Markdown `[label](url)` com suporte a parênteses
 * balanceados na URL (ex.: Wikipedia) e sem risco de ReDoS.
 */
function findBalancedMarkdownLink(
  text: string,
  startIdx: number
): { label: string; rawHref: string; endIdx: number } | null {
  if (text[startIdx] !== '[') return null

  let closeBracket = -1
  for (let i = startIdx + 1; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n' || ch === '[') return null
    if (ch === ']') {
      closeBracket = i
      break
    }
  }
  if (closeBracket === -1 || text[closeBracket + 1] !== '(') return null

  const label = text.slice(startIdx + 1, closeBracket)
  if (!label) return null

  let depth = 0
  let closeParen = -1
  for (let j = closeBracket + 2; j < text.length; j++) {
    const ch = text[j]
    if (ch === '\n') return null
    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      if (depth === 0) {
        closeParen = j
        break
      }
      depth--
    }
  }
  if (closeParen === -1) return null

  const rawHref = text.slice(closeBracket + 2, closeParen).trim()
  if (!rawHref) return null

  return { label, rawHref, endIdx: closeParen + 1 }
}

export function stripMarkdown(content: string | null | undefined): string {
  if (typeof content !== 'string' || !content) return ''
  const normalized = content.replace(/\r\n/g, '\n')

  let out = ''
  let i = 0
  while (i < normalized.length) {
    if (normalized[i] === '[') {
      const link = findBalancedMarkdownLink(normalized, i)
      if (link) {
        out += link.label
        i = link.endIdx
        continue
      }
    }
    out += normalized[i]
    i++
  }

  return out
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function deriveExcerpt(content: string | null | undefined, maxLen = 155): string {
  const plain = stripMarkdown(content)
  if (!plain) return ''
  if (plain.length <= maxLen) return plain
  const cut = plain.slice(0, maxLen - 3)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}...`
}

export function estimateReadingTimeMinutes(content: string | null | undefined): number {
  const plain = stripMarkdown(content)
  if (!plain) return 1
  const words = plain.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function resolveCanonicalUrl(pathname: string): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${SITE_CANONICAL_ORIGIN}${cleanPath}`
}

export function resolveAbsoluteOgImage(coverUrl: string | null | undefined): string {
  const safe = sanitizeBlogCoverUrl(coverUrl, DEFAULT_BLOG_COVER)
  if (safe.startsWith('https://')) return safe
  return `${SITE_CANONICAL_ORIGIN}${safe.startsWith('/') ? safe : `/${safe}`}`
}

export function getBlogPostTypeLabel(postType: BlogPostType): string {
  return postType === 'accountability' ? 'Prestação de Contas' : 'Notícia de Ação'
}

export function parseInlineMarkdown(text: string): MarkdownInline[] {
  if (!text) return []
  const tokens: MarkdownInline[] = []
  let buffer = ''
  let i = 0

  const flushText = () => {
    if (buffer) {
      tokens.push({ type: 'text', value: buffer })
      buffer = ''
    }
  }

  while (i < text.length) {
    if (text[i] === '[') {
      const link = findBalancedMarkdownLink(text, i)
      if (link) {
        flushText()
        const safeHref = sanitizeLinkHref(link.rawHref)
        const cleanLabel = link.label
          .replace(/\*\*([^*\n]+)\*\*/g, '$1')
          .replace(/\*([^*\n]+)\*/g, '$1')
        if (safeHref) {
          tokens.push({ type: 'link', label: cleanLabel, href: safeHref })
        } else {
          tokens.push({ type: 'text', value: cleanLabel })
        }
        i = link.endIdx
        continue
      }
    }

    if (text[i] === '*' && text[i + 1] === '*') {
      const closeIdx = text.indexOf('**', i + 2)
      if (closeIdx > i + 2 && !text.slice(i + 2, closeIdx).includes('\n')) {
        flushText()
        tokens.push({ type: 'strong', value: text.slice(i + 2, closeIdx) })
        i = closeIdx + 2
        continue
      }
    }

    if (text[i] === '*' && text[i + 1] !== '*') {
      const closeIdx = text.indexOf('*', i + 1)
      if (closeIdx > i + 1 && !text.slice(i + 1, closeIdx).includes('\n')) {
        flushText()
        tokens.push({ type: 'em', value: text.slice(i + 1, closeIdx) })
        i = closeIdx + 1
        continue
      }
    }

    buffer += text[i]
    i++
  }

  flushText()
  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }]
}

export function parseSafeMarkdown(rawContent: string | null | undefined): MarkdownBlock[] {
  if (typeof rawContent !== 'string' || !rawContent.trim()) return []

  const lines = rawContent.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraphLines: string[] = []
  let listItems: MarkdownInline[][] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const joined = paragraphLines.join(' ').trim()
    if (joined) {
      blocks.push({ type: 'p', inlines: parseInlineMarkdown(joined) })
    }
    paragraphLines = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push({ type: 'ul', items: listItems })
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    if (line.startsWith('### ')) {
      const headingText = line.slice(4).trim()
      if (!headingText) continue
      flushParagraph()
      flushList()
      blocks.push({ type: 'h3', inlines: parseInlineMarkdown(headingText) })
      continue
    }

    if (line.startsWith('## ') || line.startsWith('# ')) {
      const headingText = line.replace(/^#{1,2}\s+/, '').trim()
      if (!headingText) continue
      flushParagraph()
      flushList()
      blocks.push({ type: 'h2', inlines: parseInlineMarkdown(headingText) })
      continue
    }

    if (line.startsWith('> ')) {
      const quoteText = line.slice(2).trim()
      if (!quoteText) continue
      flushParagraph()
      flushList()
      blocks.push({ type: 'blockquote', inlines: parseInlineMarkdown(quoteText) })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const itemText = line.replace(/^[-*]\s+/, '').trim()
      if (!itemText) continue
      flushParagraph()
      listItems.push(parseInlineMarkdown(itemText))
      continue
    }

    flushList()
    paragraphLines.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

export function mapDbBlogPostToSummary(
  row: DbBlogPostRow,
  projects: ProjectInfo[] = []
): PublicBlogPostSummary | null {
  if (!row || row.status !== 'published') return null
  const slug = normalizeBlogSlug(row.slug)
  if (!isValidBlogSlug(slug)) return null
  const title = (row.title || '').trim()
  if (!title) return null

  const postType: BlogPostType =
    row.post_type === 'accountability' ? 'accountability' : 'news'

  const matchedProject = row.project_id
    ? projects.find((p) => p.portalProjectId === row.project_id) || null
    : null

  const rawContent = typeof row.content === 'string' ? row.content : ''
  const excerpt = (row.excerpt || '').trim() || deriveExcerpt(rawContent, 155)
  const seoTitle = (row.seo_title || '').trim() || `${title} | Instituto Imagine`
  const seoDescription = (row.seo_description || '').trim() || excerpt
  const coverImageUrl = sanitizeBlogCoverUrl(row.cover_image_url, DEFAULT_BLOG_COVER)
  const coverAlt = (row.cover_alt || '').trim() || title
  const publishedAt = row.published_at || row.created_at || new Date().toISOString()

  return {
    id: row.id,
    slug,
    title,
    excerpt,
    postType,
    postTypeLabel: getBlogPostTypeLabel(postType),
    projectId: row.project_id || null,
    projectSlug: matchedProject?.id || null,
    projectTitle: matchedProject?.titulo || null,
    projectColorClass: matchedProject?.corClass || 'cor-verde',
    coverImageUrl,
    coverAlt,
    seoTitle,
    seoDescription,
    publishedAt,
    readingTimeMinutes: estimateReadingTimeMinutes(rawContent || excerpt),
    shareUrl: resolveCanonicalUrl(`/blog/${slug}`),
  }
}

export function mapDbBlogPostToPublic(
  row: DbBlogPostRow,
  projects: ProjectInfo[] = []
): PublicBlogPost | null {
  const summary = mapDbBlogPostToSummary(row, projects)
  if (!summary) return null
  return {
    ...summary,
    content: typeof row.content === 'string' ? row.content : '',
  }
}

export function mapDbBlogPostsToSummary(
  rows: DbBlogPostRow[] | null | undefined,
  projects: ProjectInfo[] = []
): PublicBlogPostSummary[] {
  if (!Array.isArray(rows)) return []
  const seen = new Set<string>()
  const result: PublicBlogPostSummary[] = []
  for (const row of rows) {
    const mapped = mapDbBlogPostToSummary(row, projects)
    if (!mapped || seen.has(mapped.slug)) continue
    seen.add(mapped.slug)
    result.push(mapped)
  }
  return result
}

export function mapDbBlogPostsToPublic(
  rows: DbBlogPostRow[] | null | undefined,
  projects: ProjectInfo[] = []
): PublicBlogPost[] {
  if (!Array.isArray(rows)) return []
  const seen = new Set<string>()
  const result: PublicBlogPost[] = []
  for (const row of rows) {
    const mapped = mapDbBlogPostToPublic(row, projects)
    if (!mapped || seen.has(mapped.slug)) continue
    seen.add(mapped.slug)
    result.push(mapped)
  }
  return result
}

export async function loadPublicBlogPostsWithFallback(
  fetcher: () => Promise<DbBlogPostRow[]>,
  projects: ProjectInfo[] = []
): Promise<PublicBlogPostSummary[]> {
  try {
    const rows = await fetcher()
    return mapDbBlogPostsToSummary(rows, projects)
  } catch (err) {
    console.error('[blog] Falha ao carregar publicações do Supabase (fallback vazio):', err)
    return []
  }
}

export interface SanitizedBlogResult {
  ok: true
  id?: string
  data: AdminBlogPostWriteData
}

export interface SanitizedBlogError {
  ok: false
  status: number
  error: string
}

export function sanitizeAdminBlogPostPayload(
  rawBody: unknown,
  mode: 'create' | 'update',
  options?: {
    authorId?: string | null
    existingPublishedAt?: string | null
    existingContent?: string | null
  }
): SanitizedBlogResult | SanitizedBlogError {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return { ok: false, status: 400, error: 'Payload inválido.' }
  }

  const body = rawBody as Record<string, unknown>
  const data: AdminBlogPostWriteData = {}
  let id: string | undefined

  if (mode === 'update') {
    const rawId = typeof body.id === 'string' ? body.id.trim() : ''
    if (!isValidBlogUuid(rawId)) {
      return { ok: false, status: 400, error: 'ID da publicação inválido (esperado UUID).' }
    }
    id = rawId
  }

  // Title
  if (mode === 'create' || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (title.length < 3 || title.length > 160) {
      return {
        ok: false,
        status: 422,
        error: 'O título deve ter entre 3 e 160 caracteres.',
      }
    }
    data.title = title
  }

  // Content
  if (mode === 'create' || body.content !== undefined) {
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (content.length < 10 || content.length > 50000) {
      return {
        ok: false,
        status: 422,
        error: 'O conteúdo deve ter entre 10 e 50.000 caracteres.',
      }
    }
    data.content = content
  }

  // Slug (no create deriva do título se omitido; no update só muda se vier explicitamente)
  if (mode === 'create') {
    if (body.slug !== undefined && typeof body.slug !== 'string') {
      return { ok: false, status: 422, error: 'Slug inválido.' }
    }
    const candidate =
      typeof body.slug === 'string' && body.slug.trim()
        ? normalizeBlogSlug(body.slug)
        : normalizeBlogSlug(data.title || '')
    if (!isValidBlogSlug(candidate)) {
      return {
        ok: false,
        status: 422,
        error: 'Slug inválido ou reservado. Personalize a URL usando letras minúsculas, números e hífens.',
      }
    }
    data.slug = candidate
  } else if (body.slug !== undefined) {
    if (typeof body.slug !== 'string') {
      return { ok: false, status: 422, error: 'Slug inválido.' }
    }
    const candidate = normalizeBlogSlug(body.slug)
    if (!isValidBlogSlug(candidate)) {
      return {
        ok: false,
        status: 422,
        error: 'Slug inválido ou reservado. Use letras minúsculas, números e hífens.',
      }
    }
    data.slug = candidate
  }

  // Post type (sem coerção silenciosa)
  if (mode === 'create' || body.post_type !== undefined) {
    if (body.post_type !== undefined && typeof body.post_type !== 'string') {
      return { ok: false, status: 422, error: 'Tipo inválido. Use "news" ou "accountability".' }
    }
    const rawType = typeof body.post_type === 'string' ? body.post_type.trim() : 'news'
    if (!(ALLOWED_BLOG_POST_TYPES as readonly string[]).includes(rawType)) {
      return {
        ok: false,
        status: 422,
        error: 'Tipo inválido. Use "news" ou "accountability".',
      }
    }
    data.post_type = rawType as BlogPostType
  }

  // Status (sem coerção silenciosa)
  if (mode === 'create' || body.status !== undefined) {
    if (body.status !== undefined && typeof body.status !== 'string') {
      return { ok: false, status: 422, error: 'Status inválido. Use "draft", "published" ou "archived".' }
    }
    const rawStatus = typeof body.status === 'string' ? body.status.trim() : 'draft'
    if (!(ALLOWED_BLOG_POST_STATUSES as readonly string[]).includes(rawStatus)) {
      return {
        ok: false,
        status: 422,
        error: 'Status inválido. Use "draft", "published" ou "archived".',
      }
    }
    data.status = rawStatus as BlogPostStatus
    if (rawStatus === 'published' && !options?.existingPublishedAt) {
      data.published_at = new Date().toISOString()
    }
  }

  // Project ID (opcional)
  if (body.project_id !== undefined) {
    if (body.project_id === null || body.project_id === '') {
      data.project_id = null
    } else if (typeof body.project_id === 'string' && isValidBlogUuid(body.project_id)) {
      data.project_id = body.project_id.trim()
    } else {
      return { ok: false, status: 422, error: 'Projeto vinculado inválido.' }
    }
  }

  // Excerpt (em PUT parcial sem content, re-deriva de existingContent em vez de apagar)
  if (body.excerpt !== undefined) {
    if (typeof body.excerpt !== 'string') {
      return { ok: false, status: 422, error: 'Resumo inválido.' }
    }
    const rawExcerpt = body.excerpt.trim()
    if (rawExcerpt.length > 300) {
      return { ok: false, status: 422, error: 'Resumo deve ter no máximo 300 caracteres.' }
    }
    if (rawExcerpt) {
      data.excerpt = rawExcerpt
    } else {
      const sourceContent = data.content ?? options?.existingContent ?? ''
      if (sourceContent) {
        data.excerpt = deriveExcerpt(sourceContent, 155)
      }
    }
  } else if (mode === 'create' && data.content) {
    data.excerpt = deriveExcerpt(data.content, 155)
  }

  // Cover image
  if (body.cover_image_url !== undefined) {
    if (body.cover_image_url === null || body.cover_image_url === '') {
      data.cover_image_url = null
    } else if (typeof body.cover_image_url === 'string') {
      const safe = sanitizeBlogCoverUrl(body.cover_image_url, '')
      if (!safe) {
        return {
          ok: false,
          status: 422,
          error: 'URL da imagem de capa inválida. Use HTTPS ou caminho interno.',
        }
      }
      data.cover_image_url = safe
    } else {
      return { ok: false, status: 422, error: 'URL da imagem de capa inválida.' }
    }
  }

  // Cover alt
  if (body.cover_alt !== undefined) {
    const alt = typeof body.cover_alt === 'string' ? body.cover_alt.trim().slice(0, 200) : ''
    data.cover_alt = alt
  } else if (mode === 'create') {
    data.cover_alt = (data.title || '').slice(0, 200)
  }

  // SEO fields (opcionais)
  if (body.seo_title !== undefined) {
    const v = typeof body.seo_title === 'string' ? body.seo_title.trim().slice(0, 120) : ''
    data.seo_title = v || null
  }
  if (body.seo_description !== undefined) {
    const v = typeof body.seo_description === 'string' ? body.seo_description.trim().slice(0, 200) : ''
    data.seo_description = v || null
  }

  // Author ID só definido server-side no create
  if (mode === 'create' && options?.authorId && isValidBlogUuid(options.authorId)) {
    data.author_id = options.authorId
  }

  if (mode === 'update' && Object.keys(data).length === 0) {
    return { ok: false, status: 400, error: 'Nenhum campo válido informado para atualização.' }
  }

  return { ok: true, id, data }
}

export type SupportedImageMime = 'image/webp' | 'image/jpeg' | 'image/png'

export function detectImageMimeFromBytes(bytes: Uint8Array): SupportedImageMime | null {
  if (!bytes || bytes.length < 16) return null

  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR (49 48 44 52 em offset 12..15)
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a &&
    bytes[12] === 0x49 &&
    bytes[13] === 0x48 &&
    bytes[14] === 0x44 &&
    bytes[15] === 0x52
  ) {
    return 'image/png'
  }

  // JPEG: FF D8 FF + marcador JPEG válido (>= 0xC0, bloqueando texto ASCII/HTML como '<' 0x3C)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[3] >= 0xc0) {
    return 'image/jpeg'
  }

  // WEBP: "RIFF" .... "WEBP" + chunk "VP8" (VP8 , VP8L ou VP8X em offset 12..14)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 &&
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38
  ) {
    return 'image/webp'
  }

  return null
}

export function extensionForImageMime(mime: SupportedImageMime): string {
  switch (mime) {
    case 'image/webp':
      return 'webp'
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
  }
}

const BLOG_PUBLIC_BUCKET_MARKER = '/storage/v1/object/public/blog/'

export function extractBlogStoragePath(url: string | null | undefined): string | null {
  if (typeof url !== 'string' || !url.trim()) return null
  try {
    const parsed = new URL(url.trim())
    const idx = parsed.pathname.indexOf(BLOG_PUBLIC_BUCKET_MARKER)
    if (idx === -1) return null
    const relPath = decodeURIComponent(
      parsed.pathname.slice(idx + BLOG_PUBLIC_BUCKET_MARKER.length)
    )
    if (!relPath.startsWith('covers/') || relPath.includes('..')) return null
    return relPath
  } catch {
    return null
  }
}

export function formatBlogDatePTBR(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}
