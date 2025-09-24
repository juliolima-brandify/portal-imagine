-- =============================================
-- Script para desabilitar/habilitar RLS temporariamente
-- Para inserção de dados fake
-- =============================================

-- Função para desabilitar RLS temporariamente
CREATE OR REPLACE FUNCTION disable_rls_for_fake_data()
RETURNS void AS $$
BEGIN
  -- Desabilitar RLS nas tabelas principais
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
  ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
  ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'RLS desabilitado temporariamente para inserção de dados fake';
END;
$$ LANGUAGE plpgsql;

-- Função para reabilitar RLS
CREATE OR REPLACE FUNCTION enable_rls_for_fake_data()
RETURNS void AS $$
BEGIN
  -- Reabilitar RLS nas tabelas principais
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'RLS reabilitado';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INSTRUÇÕES DE USO:
-- =============================================

-- 1. Execute este SQL no Supabase SQL Editor primeiro
-- 2. Depois execute: npm run insert-fake-data
-- 3. O script vai desabilitar/habilitar RLS automaticamente

-- =============================================
-- COMANDOS MANUAIS (se necessário):
-- =============================================

-- Para desabilitar RLS manualmente:
-- SELECT disable_rls_for_fake_data();

-- Para reabilitar RLS manualmente:
-- SELECT enable_rls_for_fake_data();
