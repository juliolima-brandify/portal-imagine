-- Migração: Frente 3 — Blog / Notícias Nativo no Admin (public.blog_posts + bucket storage 'blog')
-- Idempotente, com menor privilégio (RLS) e sem listagem anônima de capas.

-- ============================================================
-- 1. Garantir função update_updated_at_column endurecida
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. Tabela public.blog_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'news'
    CHECK (post_type IN ('news', 'accountability')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  cover_alt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blog_posts_slug_format_chk
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 2 AND 100),
  CONSTRAINT blog_posts_title_len_chk
    CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  CONSTRAINT blog_posts_content_len_chk
    CHECK (char_length(trim(content)) >= 10)
);

-- Índices para unicidade, listagem pública, filtro por projeto, admin e FKs
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx
  ON public.blog_posts (slug);

CREATE INDEX IF NOT EXISTS blog_posts_published_list_idx
  ON public.blog_posts (published_at DESC NULLS LAST, created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS blog_posts_project_published_idx
  ON public.blog_posts (project_id, published_at DESC NULLS LAST)
  WHERE status = 'published' AND project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS blog_posts_updated_at_idx
  ON public.blog_posts (updated_at DESC);

CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx
  ON public.blog_posts (author_id)
  WHERE author_id IS NOT NULL;

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. RLS e menor privilégio em public.blog_posts
--    anon lê apenas colunas públicas (sem author_id) e somente status = 'published'.
--    Mutações passam obrigatoriamente pelas APIs /api/admin/blog* (requireAdmin + service_role).
-- ============================================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.blog_posts FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  slug,
  title,
  excerpt,
  content,
  post_type,
  project_id,
  cover_image_url,
  cover_alt,
  status,
  seo_title,
  seo_description,
  published_at,
  created_at,
  updated_at
) ON public.blog_posts TO anon;

GRANT SELECT ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts" ON public.blog_posts
  FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated can view published or admin blog posts" ON public.blog_posts;
CREATE POLICY "Authenticated can view published or admin blog posts" ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

-- ============================================================
-- 4. Supabase Storage: bucket público 'blog' (capas WebP/JPG/PNG)
--    public = true habilita download direto via /storage/v1/object/public/blog/...
--    Sem policies em storage.objects para bloquear list() anônimo e escrita direta;
--    todo upload/remoção ocorre via /api/admin/blog* (service_role).
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog',
  'blog',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
