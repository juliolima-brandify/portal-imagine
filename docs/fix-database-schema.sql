-- =============================================
-- Fix Database Schema - Portal Instituto Imagine
-- =============================================

-- Adicionar colunas faltantes na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS has_funding_goal BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS checkout_tracking_url TEXT,
ADD COLUMN IF NOT EXISTS framer_project_url TEXT;

-- Atualizar projetos existentes para ter has_funding_goal = true
UPDATE projects 
SET has_funding_goal = true 
WHERE has_funding_goal IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN projects.has_funding_goal IS 'Define se o projeto tem meta de arrecadação visível no checkout';
COMMENT ON COLUMN projects.checkout_tracking_url IS 'URL do checkout com tracking para o projeto';
COMMENT ON COLUMN projects.framer_project_url IS 'URL do projeto no site principal (Framer)';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('has_funding_goal', 'checkout_tracking_url', 'framer_project_url')
ORDER BY column_name;
