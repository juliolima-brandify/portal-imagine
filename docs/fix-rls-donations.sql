-- =============================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA DOAÇÕES
-- =============================================
-- 
-- Este script corrige o problema de Row-Level Security
-- que está impedindo doações anônimas

-- 1. Remover a política restritiva atual
DROP POLICY IF EXISTS "Users can create donations" ON donations;

-- 2. Criar nova política mais permissiva
-- Permite inserção de doações para usuários autenticados E anônimos
CREATE POLICY "Allow donation creation" ON donations
  FOR INSERT WITH CHECK (
    -- Usuário autenticado pode criar doação para si mesmo
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Ou permitir inserção sem verificação de usuário (para doações anônimas)
    (auth.uid() IS NULL)
  );

-- 3. Política para visualização (manter a existente)
-- Usuários podem ver suas próprias doações
DROP POLICY IF EXISTS "Users can view own donations" ON donations;

CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (
    -- Usuário autenticado pode ver suas próprias doações
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Admins podem ver todas as doações
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 4. Política para atualização (manter a existente)
DROP POLICY IF EXISTS "Users can update own donations" ON donations;

CREATE POLICY "Users can update own donations" ON donations
  FOR UPDATE USING (
    -- Usuário autenticado pode atualizar suas próprias doações
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Admins podem atualizar todas as doações
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 5. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'donations'
ORDER BY policyname;

-- 6. Teste de inserção (opcional - descomente para testar)
-- INSERT INTO donations (user_id, project_id, amount, currency, status)
-- VALUES (
--   gen_random_uuid(),
--   '550e8400-e29b-41d4-a716-446655440002',
--   50.00,
--   'BRL',
--   'pending'
-- );

COMMIT;

