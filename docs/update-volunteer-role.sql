-- =============================================
-- Atualizar Banco para Incluir Role de Voluntário
-- =============================================

-- Atualizar constraint da tabela profiles para incluir 'volunteer'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Adicionar nova constraint com 3 roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('donor', 'admin', 'volunteer'));

-- Verificar se a constraint foi aplicada
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'profiles' 
AND constraint_name = 'profiles_role_check';

-- Testar inserção com role de voluntário
INSERT INTO profiles (id, email, name, role) 
VALUES (
  gen_random_uuid(), 
  'volunteer@institutoimagine.org', 
  'Voluntário Teste', 
  'volunteer'
) ON CONFLICT (email) DO NOTHING;

-- Verificar se a inserção funcionou
SELECT * FROM profiles WHERE role = 'volunteer';
