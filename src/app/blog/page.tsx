import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ImagineBlogView from '@/components/site/ImagineBlogView'
import { getPublicBlogPostsPage } from '@/lib/blog-posts-server'
import { getPublicSiteProjects } from '@/lib/site-projects-server'
import {
  DEFAULT_BLOG_COVER,
  resolveAbsoluteOgImage,
  resolveCanonicalUrl,
  type BlogPostType,
} from '@/lib/blog-posts'

export const dynamic = 'force-dynamic'

const BLOG_PAGE_SIZE = 12
const MAX_BLOG_PAGE = 10000

export const metadata: Metadata = {
  title: 'Notícias e Prestação de Contas | Instituto Imagine',
  description:
    'Acompanhe as ações reais, entregas e prestações de contas dos projetos sociais do Instituto Imagine em Uberlândia-MG.',
  alternates: {
    canonical: resolveCanonicalUrl('/blog'),
  },
  openGraph: {
    title: 'Notícias e Prestação de Contas | Instituto Imagine',
    description:
      'Acompanhe as ações reais, entregas e prestações de contas dos projetos sociais do Instituto Imagine em Uberlândia-MG.',
    type: 'website',
    locale: 'pt_BR',
    url: resolveCanonicalUrl('/blog'),
    images: [
      {
        url: resolveAbsoluteOgImage(DEFAULT_BLOG_COVER),
        width: 1200,
        height: 630,
        alt: 'Instituto Imagine — Notícias e Prestação de Contas',
      },
    ],
  },
}

interface BlogIndexSearchParams {
  page?: string
  tipo?: string
  projeto?: string
}

interface BlogIndexPageProps {
  searchParams?: BlogIndexSearchParams | Promise<BlogIndexSearchParams>
}

function buildBlogFilterHref(page: number, tipo: 'all' | BlogPostType, projeto: string): string {
  const params = new URLSearchParams()
  if (tipo !== 'all') params.set('tipo', tipo)
  if (projeto !== 'all') params.set('projeto', projeto)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/blog?${qs}` : '/blog'
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedParams = await Promise.resolve(searchParams || {})
  const rawPage = Number.parseInt(resolvedParams?.page || '1', 10)
  const currentPage =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.min(MAX_BLOG_PAGE, rawPage) : 1
  const offset = (currentPage - 1) * BLOG_PAGE_SIZE

  const rawTipo = (resolvedParams?.tipo || '').trim()
  const activeTypeFilter: 'all' | BlogPostType =
    rawTipo === 'news' || rawTipo === 'accountability' ? rawTipo : 'all'

  const projects = await getPublicSiteProjects()
  const rawProjeto = (resolvedParams?.projeto || '').trim()
  const matchedProject =
    rawProjeto && rawProjeto !== 'geral'
      ? projects.find((p) => p.id === rawProjeto) || null
      : null

  const activeProjectFilter =
    rawProjeto === 'geral' ? 'geral' : matchedProject ? matchedProject.id : 'all'

  const blogPage = await getPublicBlogPostsPage({
    limit: BLOG_PAGE_SIZE,
    offset,
    postType: activeTypeFilter === 'all' ? undefined : activeTypeFilter,
    projectId: matchedProject?.portalProjectId ?? null,
    onlyGeneral: activeProjectFilter === 'geral',
  })

  const totalPages = Math.max(1, Math.ceil(blogPage.total / BLOG_PAGE_SIZE))

  if (!blogPage.degraded && currentPage > totalPages) {
    redirect(buildBlogFilterHref(totalPages, activeTypeFilter, activeProjectFilter))
  }

  return (
    <ImagineBlogView
      mode={blogPage.degraded ? 'degraded' : 'list'}
      posts={blogPage.posts}
      projects={projects}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={blogPage.total}
      activeTypeFilter={activeTypeFilter}
      activeProjectFilter={activeProjectFilter}
    />
  )
}
