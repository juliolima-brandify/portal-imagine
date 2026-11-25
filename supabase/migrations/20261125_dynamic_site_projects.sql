-- Migração: Projetos 100% dinâmicos no site institucional
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/zzxtethlsdjjfjjrqmlk/sql/new

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS show_on_site BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS site_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS site_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_idx
  ON public.projects (slug)
  WHERE slug IS NOT NULL;
