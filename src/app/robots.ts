import type { MetadataRoute } from 'next'
import { SITE_CANONICAL_ORIGIN } from '@/lib/blog-posts'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/dashboard',
          '/embed',
          '/prototype',
          '/volunteer',
          '/auth',
          '/entrar',
          '/perfil',
          '/doacoes',
          '/historico',
          '/comunidade',
          '/doacao-sucesso',
        ],
      },
    ],
    sitemap: `${SITE_CANONICAL_ORIGIN}/sitemap.xml`,
  }
}
