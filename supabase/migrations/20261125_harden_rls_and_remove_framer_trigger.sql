-- Migração de blindagem de segurança (Frente 1 — Banca Rodada 1)
-- 1. Bloqueia escalação de privilégio em public.profiles (role = 'admin')
-- 2. Restringe privilégios e RLS em public.projects para menor privilégio
-- 3. Remove trigger legado framer_sync_projects / notify_framer_sync e fixa search_path em funções

-- ============================================================
-- 1. Blindagem de public.profiles (P0)
-- ============================================================
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.profiles FROM authenticated;
REVOKE INSERT (role), UPDATE (role) ON public.profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.role, 'donor') <> 'donor' THEN
      RAISE EXCEPTION 'Não é permitido definir role privilegiada diretamente' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Não é permitido alterar o próprio papel (role)' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND COALESCE(role, 'donor') = 'donor');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- 2. Menor privilégio e RLS em public.projects (P2)
-- ============================================================
REVOKE ALL ON public.projects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;

DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Public can view published site projects" ON public.projects;
CREATE POLICY "Public can view published site projects" ON public.projects
  FOR SELECT
  TO anon
  USING (status = 'active' AND show_on_site = true AND slug IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;
CREATE POLICY "Authenticated can view projects" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    (status = 'active' AND show_on_site = true AND slug IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.project_id = projects.id AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.favorites f
      WHERE f.project_id = projects.id AND f.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- 3. Remover trigger legado Framer e endurecer funções SQL (P2)
-- ============================================================
DROP TRIGGER IF EXISTS framer_sync_projects ON public.projects;
DROP FUNCTION IF EXISTS public.notify_framer_sync();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'handle_new_user') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public, pg_temp';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'update_updated_at_column') THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public, pg_temp';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'update_project_amount') THEN
    EXECUTE 'ALTER FUNCTION public.update_project_amount() SET search_path = pg_catalog, public, pg_temp';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_project_amount() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;
