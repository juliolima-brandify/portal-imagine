-- Adicionar colunas de URL para projetos
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna para URL do projeto Framer
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS framer_project_url TEXT;

-- Adicionar coluna para URL do checkout com tracking
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS checkout_tracking_url TEXT;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN projects.framer_project_url IS 'URL para a página detalhada do projeto no site principal (Framer)';
COMMENT ON COLUMN projects.checkout_tracking_url IS 'URL direto para o checkout de doação com tracking de origem';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('framer_project_url', 'checkout_tracking_url');
