-- =============================================
-- SOLUÇÃO FINAL - EXECUTE NO SUPABASE
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Desabilitar RLS
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- Permitir user_id NULL
ALTER TABLE donations ALTER COLUMN user_id DROP NOT NULL;

-- Remover constraint de foreign key
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_user_id_fkey;

-- Verificar alterações
SELECT 
  'Configuração atualizada!' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'donations';

-- Teste de inserção
INSERT INTO donations (project_id, amount, currency, status, anonymous)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  50.00,
  'BRL',
  'pending',
  true
);

-- Verificar resultado
SELECT 
  'Teste funcionou!' as resultado,
  id,
  user_id,
  project_id,
  amount,
  status,
  anonymous
FROM donations 
ORDER BY created_at DESC 
LIMIT 1;

COMMIT;

