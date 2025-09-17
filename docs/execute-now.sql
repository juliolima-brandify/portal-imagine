-- =============================================
-- EXECUTE ESTE SCRIPT NO SUPABASE AGORA
-- =============================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este código e execute

-- Remover política restritiva atual
DROP POLICY IF EXISTS "Users can create donations" ON donations;

-- Criar política permissiva para doações
CREATE POLICY "Allow donation creation" ON donations
  FOR INSERT WITH CHECK (true);

-- Verificar se funcionou
SELECT 
  'Políticas RLS para donations:' as info,
  policyname, 
  cmd, 
  with_check 
FROM pg_policies 
WHERE tablename = 'donations'
ORDER BY policyname;

