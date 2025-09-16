-- =============================================
-- Supabase Storage Setup (SAFE VERSION)
-- =============================================

-- Criar bucket para avatares de usuários (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens de projetos (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket de avatares (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatar images are publicly accessible') THEN
    CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own avatar') THEN
    CREATE POLICY "Users can delete their own avatar" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Políticas para bucket de projetos (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Project images are publicly accessible') THEN
    CREATE POLICY "Project images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'projects');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can upload project images') THEN
    CREATE POLICY "Admins can upload project images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'projects' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can update project images') THEN
    CREATE POLICY "Admins can update project images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'projects' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can delete project images') THEN
    CREATE POLICY "Admins can delete project images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'projects' 
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

