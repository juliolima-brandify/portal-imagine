import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { IMAGINE_PROJECTS, type ProjectInfo } from './imagine-site'
import {
  loadPublicSiteProjectsWithFallback,
  normalizeSlug,
  type DbProjectRow,
} from './site-projects'

const SUPABASE_SITE_TIMEOUT_MS = 4000

const PUBLIC_PROJECT_COLUMNS =
  'id,title,description,long_description,category,status,location,image_url,slug,show_on_site,site_order,site_data'

async function fetchFromSupabase(): Promise<DbProjectRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (
    !supabaseUrl.startsWith('https://') ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'placeholder-key'
  ) {
    throw new Error('Credenciais públicas do Supabase não configuradas')
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_SITE_TIMEOUT_MS)

  try {
    const { data, error } = await client
      .from('projects')
      .select(PUBLIC_PROJECT_COLUMNS)
      .eq('status', 'active')
      .eq('show_on_site', true)
      .not('slug', 'is', null)
      .order('site_order', { ascending: true })
      .order('created_at', { ascending: true })
      .abortSignal(controller.signal)

    if (error) {
      throw new Error(error.message || 'Erro ao consultar projetos no Supabase')
    }
    return (data || []) as DbProjectRow[]
  } finally {
    clearTimeout(timer)
  }
}

export const getPublicSiteProjects = cache(async (): Promise<ProjectInfo[]> => {
  return loadPublicSiteProjectsWithFallback(fetchFromSupabase, IMAGINE_PROJECTS)
})

export async function getPublicSiteProjectBySlug(
  rawSlug: string
): Promise<{ project: ProjectInfo | null; allProjects: ProjectInfo[] }> {
  const allProjects = await getPublicSiteProjects()
  let decoded = rawSlug || ''
  try {
    decoded = decodeURIComponent(decoded)
  } catch {
    // mantém rawSlug se percent-encoding for inválido
  }

  const clean = normalizeSlug(decoded)
  const rawLower = decoded.trim().toLowerCase()

  const project =
    allProjects.find(
      (p) => p.id === clean || (rawLower && (p.portalProjectId || '').toLowerCase() === rawLower)
    ) || null

  return { project, allProjects }
}
