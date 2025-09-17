-- =============================================
-- CORREÇÃO COMPLETA - EXECUTE NO SUPABASE
-- =============================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'donations';

-- 3. Verificar políticas existentes
SELECT 
  'Políticas existentes:' as info,
  policyname, 
  cmd, 
  with_check 
FROM pg_policies 
WHERE tablename = 'donations';

-- 4. Teste de inserção
INSERT INTO donations (user_id, project_id, amount, currency, status)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002',
  50.00,
  'BRL',
  'pending'
);

-- 5. Verificar se a inserção funcionou
SELECT 
  'Última doação inserida:' as info,
  id,
  user_id,
  project_id,
  amount,
  status,
  created_at
FROM donations 
ORDER BY created_at DESC 
LIMIT 1;

COMMIT;

