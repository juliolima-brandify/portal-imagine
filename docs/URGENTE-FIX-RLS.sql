-- =============================================
-- CORREÇÃO URGENTE - EXECUTE NO SUPABASE AGORA
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Desabilitar RLS temporariamente para testar
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'donations';

-- Teste de inserção (opcional)
-- INSERT INTO donations (user_id, project_id, amount, currency, status)
-- VALUES (
--   gen_random_uuid(),
--   '550e8400-e29b-41d4-a716-446655440002',
--   50.00,
--   'BRL',
--   'pending'
-- );

COMMIT;

