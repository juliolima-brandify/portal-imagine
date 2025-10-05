-- =============================================
-- Instituto Imagine - Portal Setup SQL
-- =============================================

-- 1. Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  cpf TEXT,
  address JSONB,
  preferences JSONB DEFAULT '{}',
  role TEXT DEFAULT 'donor' CHECK (role IN ('donor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  category TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  location TEXT,
  image_url TEXT,
  impact JSONB DEFAULT '{}',
  timeline TEXT,
  organization TEXT DEFAULT 'Instituto Imagine',
  has_funding_goal BOOLEAN DEFAULT true,
  checkout_tracking_url TEXT,
  framer_project_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de doações
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT,
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 5. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para projects (todos podem ver)
CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT USING (true);

-- Apenas admins podem gerenciar projetos
CREATE POLICY "Admins can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Políticas para donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as doações
CREATE POLICY "Admins can view all donations" ON donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Políticas para favorites
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar current_amount dos projetos
CREATE OR REPLACE FUNCTION update_project_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE projects 
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      UPDATE projects 
      SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.project_id;
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      UPDATE projects 
      SET current_amount = current_amount - OLD.amount
      WHERE id = OLD.project_id;
    ELSIF OLD.status = 'completed' AND NEW.status = 'completed' AND OLD.amount != NEW.amount THEN
      UPDATE projects 
      SET current_amount = current_amount - OLD.amount + NEW.amount
      WHERE id = NEW.project_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    UPDATE projects 
    SET current_amount = current_amount - OLD.amount
    WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar valores dos projetos
CREATE TRIGGER update_project_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_project_amount();

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir projetos iniciais
INSERT INTO projects (title, description, long_description, category, target_amount, current_amount, status, location, image_url, impact, timeline) VALUES
(
  'Educação Digital',
  'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
  'Este projeto visa criar laboratórios de informática em escolas públicas de comunidades carentes, fornecendo computadores, internet e capacitação para professores. O objetivo é reduzir a desigualdade digital e preparar os estudantes para o futuro tecnológico.',
  'educacao',
  60000.00,
  45000.00,
  'active',
  'São Paulo, SP',
  '/api/placeholder/600/400',
  '{"students": 500, "schools": 10, "teachers": 50}',
  '6 meses'
),
(
  'Saúde Comunitária',
  'Clínicas móveis levando saúde básica, exames e vacinação para regiões remotas.',
  'Projeto que leva atendimento médico básico para comunidades rurais e periféricas através de clínicas móveis equipadas. Inclui consultas, exames preventivos, vacinação e orientação sobre saúde preventiva.',
  'saude',
  50000.00,
  32000.00,
  'active',
  'Bahia, BA',
  '/api/placeholder/600/400',
  '{"patients": 1000, "communities": 15, "healthWorkers": 25}',
  '8 meses'
),
(
  'Meio Ambiente',
  'Reflorestamento e conscientização ambiental em escolas públicas.',
  'Projeto de reflorestamento em áreas degradadas com envolvimento de estudantes e comunidade. Inclui plantio de árvores nativas, educação ambiental e criação de viveiros comunitários.',
  'meio-ambiente',
  30000.00,
  18000.00,
  'active',
  'Amazonas, AM',
  '/api/placeholder/600/400',
  '{"trees": 2000, "students": 300, "communities": 5}',
  '12 meses'
),
(
  'Esporte Social',
  'Construção de quadras esportivas e formação de atletas em comunidades carentes.',
  'Projeto que constrói quadras esportivas em comunidades carentes e oferece treinamento esportivo para crianças e jovens. Inclui equipamentos esportivos, treinadores qualificados e competições locais.',
  'esporte',
  40000.00,
  40000.00,
  'completed',
  'Rio de Janeiro, RJ',
  '/api/placeholder/600/400',
  '{"athletes": 200, "courts": 3, "coaches": 8}',
  '10 meses'
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
