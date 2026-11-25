import type { MetadataRoute } from 'next'
import { SITE_CANONICAL_ORIGIN } from '@/lib/blog-posts'
import { getAllPublishedBlogSlugsForSitemap } from '@/lib/blog-posts-server'
import { getPublicSiteProjects } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, blogEntries] = await Promise.all([
    getPublicSiteProjects(),
    getAllPublishedBlogSlugsForSitemap(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_CANONICAL_ORIGIN}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_CANONICAL_ORIGIN}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_CANONICAL_ORIGIN}/empresas`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_CANONICAL_ORIGIN}/natal-feliz`, changeFrequency: 'monthly', priority: 0.7 },
    {
      url: `${SITE_CANONICAL_ORIGIN}/politica-de-privacidade`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_CANONICAL_ORIGIN}/projetos/${p.id}`,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const blogRoutes: MetadataRoute.Sitemap = blogEntries.map((entry) => {
    let validDate: Date | undefined
    if (entry.lastModified) {
      const parsed = new Date(entry.lastModified)
      if (!Number.isNaN(parsed.getTime())) {
        validDate = parsed
      }
    }
    return {
      url: `${SITE_CANONICAL_ORIGIN}/blog/${entry.slug}`,
      lastModified: validDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    }
  })

  return [...staticRoutes, ...projectRoutes, ...blogRoutes]
}
