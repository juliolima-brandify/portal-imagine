-- =============================================
-- SOLUÇÃO COMPLETA - EXECUTE NO SUPABASE
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Desabilitar RLS
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- Permitir user_id NULL
ALTER TABLE donations ALTER COLUMN user_id DROP NOT NULL;

-- Remover constraints de foreign key
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_user_id_fkey;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_project_id_fkey;

-- Verificar alterações
SELECT 
  'Configuração atualizada!' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'donations';

-- Verificar projetos disponíveis
SELECT 
  'Projetos disponíveis:' as info,
  id,
  title,
  status
FROM projects 
WHERE status = 'active'
ORDER BY title;

-- Teste de inserção com projeto real
INSERT INTO donations (project_id, amount, currency, status, anonymous)
VALUES (
  'bdfd300b-9138-4def-bde1-9d769e1d9e30',
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

