-- =============================================
-- CORREÇÃO DO FOREIGN KEY CONSTRAINT
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Opção 1: Permitir user_id NULL para doações anônimas
ALTER TABLE donations ALTER COLUMN user_id DROP NOT NULL;

-- Opção 2: Remover a constraint de foreign key temporariamente
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_user_id_fkey;

-- Verificar se a constraint foi removida
SELECT 
  'Constraints da tabela donations:' as info,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'donations'::regclass;

-- Teste de inserção sem user_id
INSERT INTO donations (project_id, amount, currency, status, anonymous)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  50.00,
  'BRL',
  'pending',
  true
);

-- Verificar se funcionou
SELECT 
  'Teste de inserção funcionou!' as resultado,
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

