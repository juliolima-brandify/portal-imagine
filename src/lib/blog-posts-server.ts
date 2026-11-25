import { cache } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicSiteProjects } from './site-projects-server'
import {
  mapDbBlogPostToPublic,
  mapDbBlogPostsToSummary,
  normalizeBlogSlug,
  type DbBlogPostRow,
  type PublicBlogPost,
  type PublicBlogPostSummary,
} from './blog-posts'

const SUPABASE_BLOG_TIMEOUT_MS = 4000

const PUBLIC_BLOG_SUMMARY_COLUMNS =
  'id,slug,title,excerpt,post_type,project_id,cover_image_url,cover_alt,status,seo_title,seo_description,published_at,created_at,updated_at'

const PUBLIC_BLOG_FULL_COLUMNS = `${PUBLIC_BLOG_SUMMARY_COLUMNS},content`

function createPublicBlogClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (
    !supabaseUrl.startsWith('https://') ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'placeholder-key'
  ) {
    throw new Error('Credenciais públicas do Supabase não configuradas')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface PublicBlogPostsPageResult {
  posts: PublicBlogPostSummary[]
  total: number
  degraded: boolean
}

export async function getPublicBlogPostsPage(options?: {
  limit?: number
  offset?: number
}): Promise<PublicBlogPostsPageResult> {
  const limit = Math.max(1, Math.min(50, options?.limit ?? 12))
  const offset = Math.max(0, options?.offset ?? 0)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_BLOG_TIMEOUT_MS)

  try {
    const client = createPublicBlogClient()
    const [projects, queryRes] = await Promise.all([
      getPublicSiteProjects(),
      client
        .from('blog_posts')
        .select(PUBLIC_BLOG_SUMMARY_COLUMNS, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .abortSignal(controller.signal),
    ])

    if (queryRes.error) {
      throw new Error(queryRes.error.message || 'Erro ao listar publicações')
    }

    const posts = mapDbBlogPostsToSummary((queryRes.data || []) as DbBlogPostRow[], projects)
    return {
      posts,
      total: queryRes.count ?? posts.length,
      degraded: false,
    }
  } catch (err) {
    console.error('[blog] Falha ao carregar página de publicações:', err)
    return { posts: [], total: 0, degraded: true }
  } finally {
    clearTimeout(timer)
  }
}

export interface PublicBlogPostDetailResult {
  post: PublicBlogPost | null
  relatedPosts: PublicBlogPostSummary[]
  degraded: boolean
}

export const getPublicBlogPostBySlug = cache(
  async (rawSlug: string): Promise<PublicBlogPostDetailResult> => {
    let decoded = rawSlug || ''
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      // mantém rawSlug se percent-encoding for inválido
    }
    const clean = normalizeBlogSlug(decoded)
    if (!clean) {
      return { post: null, relatedPosts: [], degraded: false }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SUPABASE_BLOG_TIMEOUT_MS)

    try {
      const client = createPublicBlogClient()
      const [projects, postRes, relatedRes] = await Promise.all([
        getPublicSiteProjects(),
        client
          .from('blog_posts')
          .select(PUBLIC_BLOG_FULL_COLUMNS)
          .eq('status', 'published')
          .eq('slug', clean)
          .abortSignal(controller.signal)
          .maybeSingle(),
        client
          .from('blog_posts')
          .select(PUBLIC_BLOG_SUMMARY_COLUMNS)
          .eq('status', 'published')
          .neq('slug', clean)
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(3)
          .abortSignal(controller.signal),
      ])

      if (postRes.error) {
        throw new Error(postRes.error.message || 'Erro ao buscar publicação')
      }

      const post = postRes.data
        ? mapDbBlogPostToPublic(postRes.data as DbBlogPostRow, projects)
        : null

      const relatedPosts = relatedRes.error
        ? []
        : mapDbBlogPostsToSummary((relatedRes.data || []) as DbBlogPostRow[], projects)

      return { post, relatedPosts, degraded: false }
    } catch (err) {
      console.error('[blog] Falha ao carregar publicação por slug:', clean, err)
      return { post: null, relatedPosts: [], degraded: true }
    } finally {
      clearTimeout(timer)
    }
  }
)

export async function getPublicBlogPostsByProjectId(
  portalProjectId: string | null | undefined,
  limit = 3
): Promise<PublicBlogPostSummary[]> {
  if (!portalProjectId) return []
  const safeLimit = Math.max(1, Math.min(12, limit))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_BLOG_TIMEOUT_MS)

  try {
    const client = createPublicBlogClient()
    const [projects, queryRes] = await Promise.all([
      getPublicSiteProjects(),
      client
        .from('blog_posts')
        .select(PUBLIC_BLOG_SUMMARY_COLUMNS)
        .eq('status', 'published')
        .eq('project_id', portalProjectId)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(safeLimit)
        .abortSignal(controller.signal),
    ])

    if (queryRes.error) {
      throw new Error(queryRes.error.message || 'Erro ao buscar publicações do projeto')
    }

    return mapDbBlogPostsToSummary((queryRes.data || []) as DbBlogPostRow[], projects)
  } catch (err) {
    console.error('[blog] Falha ao carregar publicações por projeto:', portalProjectId, err)
    return []
  } finally {
    clearTimeout(timer)
  }
}

export interface SitemapBlogEntry {
  slug: string
  lastModified?: string
}

export async function getAllPublishedBlogSlugsForSitemap(): Promise<SitemapBlogEntry[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_BLOG_TIMEOUT_MS)

  try {
    const client = createPublicBlogClient()
    const batchSize = 500
    let offset = 0
    const entries: SitemapBlogEntry[] = []

    while (offset < 10000) {
      const { data, error } = await client
        .from('blog_posts')
        .select('slug,published_at,updated_at,created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + batchSize - 1)
        .abortSignal(controller.signal)

      if (error) {
        throw new Error(error.message || 'Erro ao listar slugs do sitemap')
      }

      const rows = (data || []) as Array<{
        slug: string
        published_at?: string | null
        updated_at?: string | null
        created_at?: string | null
      }>

      for (const row of rows) {
        if (!row.slug) continue
        entries.push({
          slug: row.slug,
          lastModified: row.updated_at || row.published_at || row.created_at || undefined,
        })
      }

      if (rows.length < batchSize) break
      offset += batchSize
    }

    return entries
  } catch (err) {
    console.error('[blog] Falha ao gerar entradas de blog para o sitemap:', err)
    return []
  } finally {
    clearTimeout(timer)
  }
}
