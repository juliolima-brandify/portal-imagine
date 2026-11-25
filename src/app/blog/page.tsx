import type { Metadata } from 'next'
import ImagineBlogView from '@/components/site/ImagineBlogView'
import { getPublicBlogPostsPage } from '@/lib/blog-posts-server'
import { getPublicSiteProjects } from '@/lib/site-projects-server'
import {
  DEFAULT_BLOG_COVER,
  resolveAbsoluteOgImage,
  resolveCanonicalUrl,
} from '@/lib/blog-posts'

export const dynamic = 'force-dynamic'

const BLOG_PAGE_SIZE = 12

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

interface BlogIndexPageProps {
  searchParams?: { page?: string } | Promise<{ page?: string }>
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedParams = await Promise.resolve(searchParams || {})
  const rawPage = Number.parseInt(resolvedParams?.page || '1', 10)
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const offset = (currentPage - 1) * BLOG_PAGE_SIZE

  const [blogPage, projects] = await Promise.all([
    getPublicBlogPostsPage({ limit: BLOG_PAGE_SIZE, offset }),
    getPublicSiteProjects(),
  ])

  const totalPages = Math.max(1, Math.ceil(blogPage.total / BLOG_PAGE_SIZE))

  return (
    <ImagineBlogView
      mode={blogPage.degraded ? 'degraded' : 'list'}
      posts={blogPage.posts}
      projects={projects}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={blogPage.total}
    />
  )
}
