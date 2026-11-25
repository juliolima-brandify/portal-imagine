import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import ImagineBlogView from '@/components/site/ImagineBlogView'
import SafeMarkdownContent from '@/components/site/SafeMarkdownContent'
import { getPublicBlogPostBySlug } from '@/lib/blog-posts-server'
import { getPublicSiteProjects } from '@/lib/site-projects-server'
import {
  resolveAbsoluteOgImage,
  resolveCanonicalUrl,
} from '@/lib/blog-posts'

export const dynamic = 'force-dynamic'

interface BlogPostPageProps {
  params: { slug: string } | Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params)
  const { post, degraded } = await getPublicBlogPostBySlug(slug)

  if (!post) {
    return {
      title: degraded
        ? 'Notícias | Instituto Imagine'
        : 'Publicação não encontrada | Instituto Imagine',
      robots: degraded ? undefined : { index: false, follow: false },
    }
  }

  const canonical = resolveCanonicalUrl(`/blog/${post.slug}`)
  const ogImage = resolveAbsoluteOgImage(post.coverImageUrl)

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      type: 'article',
      locale: 'pt_BR',
      url: canonical,
      publishedTime: post.publishedAt,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.coverAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.seoDescription,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await Promise.resolve(params)
  const [{ post, relatedPosts, degraded }, projects] = await Promise.all([
    getPublicBlogPostBySlug(slug),
    getPublicSiteProjects(),
  ])

  if (!post) {
    if (degraded) {
      return <ImagineBlogView mode="degraded" posts={[]} projects={projects} />
    }
    notFound()
  }

  if (slug !== post.slug) {
    redirect(`/blog/${post.slug}`)
  }

  return (
    <ImagineBlogView
      mode="post"
      posts={relatedPosts}
      activePost={post}
      projects={projects}
      articleContent={<SafeMarkdownContent content={post.content} />}
    />
  )
}
