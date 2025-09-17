-- =============================================
-- EXECUTE ESTE SCRIPT NO SUPABASE AGORA
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Desabilitar RLS na tabela donations
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  'RLS desabilitado para donations' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'donations';

-- Teste de inserção
INSERT INTO donations (user_id, project_id, amount, currency, status)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002',
  50.00,
  'BRL',
  'pending'
);

-- Verificar se funcionou
SELECT 
  'Teste de inserção funcionou!' as resultado,
  id,
  amount,
  status
FROM donations 
ORDER BY created_at DESC 
LIMIT 1;

COMMIT;

