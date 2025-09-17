-- =============================================
-- CORREÇÃO RÁPIDA DO RLS PARA DOAÇÕES
-- =============================================
-- 
-- Execute este script no SQL Editor do Supabase

-- Remover política restritiva
DROP POLICY IF EXISTS "Users can create donations" ON donations;

-- Criar política permissiva
CREATE POLICY "Allow donation creation" ON donations
  FOR INSERT WITH CHECK (true);

-- Verificar se funcionou
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'donations';

