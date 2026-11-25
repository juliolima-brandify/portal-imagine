import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjects } from '@/lib/site-projects-server'
import { getPublicBlogPostsPage } from '@/lib/blog-posts-server'
import { resolveCanonicalUrl } from '@/lib/blog-posts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Instituto Imagine | Doe para projetos sociais em Uberlândia',
  description:
    'Arte, esporte, educação, saúde emocional e ação social para crianças e famílias de Uberlândia-MG. Doe pelo Pix, simule a destinação do seu Imposto de Renda e acompanhe cada projeto.',
  alternates: {
    canonical: resolveCanonicalUrl('/'),
  },
}

export default async function HomePage() {
  const [projects, blogPage] = await Promise.all([
    getPublicSiteProjects(),
    getPublicBlogPostsPage({ limit: 3, offset: 0, includeCount: false }),
  ])
  return <ImagineSitePage page="home" projects={projects} blogPosts={blogPage.posts} />
}
