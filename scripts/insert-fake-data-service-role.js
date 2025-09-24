// Script para inserir dados fake usando service role (bypassa RLS)
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.log('Configure o arquivo .env.local com:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase')
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key')
  console.log('\n💡 A service role key bypassa RLS automaticamente!')
  process.exit(1)
}

// Usar service role key (bypassa RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Dados fake realistas (mesmo do script original)
const fakeProjects = [
  {
    title: 'Educação Digital',
    description: 'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
    long_description: 'Este projeto visa criar laboratórios de informática em escolas públicas de comunidades carentes, fornecendo computadores, internet e capacitação para professores. O objetivo é reduzir a desigualdade digital e preparar os estudantes para o futuro tecnológico.',
    category: 'educacao',
    target_amount: 60000.00,
    current_amount: 45000.00,
    status: 'active',
    location: 'São Paulo, SP',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    framer_project_url: 'https://imagineinstituto.com/projetos/educacao-digital',
    impact: { students: 500, schools: 10, teachers: 50 },
    timeline: '6 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Saúde Comunitária',
    description: 'Clínicas móveis levando saúde básica, exames e vacinação para regiões remotas.',
    long_description: 'Projeto que leva atendimento médico básico para comunidades rurais e periféricas através de clínicas móveis equipadas. Inclui consultas, exames preventivos, vacinação e orientação sobre saúde preventiva.',
    category: 'saude',
    target_amount: 50000.00,
    current_amount: 32000.00,
    status: 'active',
    location: 'Bahia, BA',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center',
    framer_project_url: 'https://imagineinstituto.com/projetos/saude-comunitaria',
    impact: { patients: 1000, communities: 15, healthWorkers: 25 },
    timeline: '8 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Meio Ambiente',
    description: 'Reflorestamento e conscientização ambiental em escolas públicas.',
    long_description: 'Projeto de reflorestamento em áreas degradadas com envolvimento de estudantes e comunidade. Inclui plantio de árvores nativas, educação ambiental e criação de viveiros comunitários.',
    category: 'meio-ambiente',
    target_amount: 30000.00,
    current_amount: 18000.00,
    status: 'active',
    location: 'Amazonas, AM',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&crop=center',
    impact: { trees: 2000, students: 300, communities: 5 },
    timeline: '12 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Esporte Social',
    description: 'Construção de quadras esportivas e formação de atletas em comunidades carentes.',
    long_description: 'Projeto que constrói quadras esportivas em comunidades carentes e oferece treinamento esportivo para crianças e jovens. Inclui equipamentos esportivos, treinadores qualificados e competições locais.',
    category: 'esporte',
    target_amount: 40000.00,
    current_amount: 40000.00,
    status: 'completed',
    location: 'Rio de Janeiro, RJ',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center',
    impact: { athletes: 200, courts: 3, coaches: 8 },
    timeline: '10 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Cultura e Arte',
    description: 'Oficinas de arte e cultura para crianças e jovens em comunidades carentes.',
    long_description: 'Projeto que oferece oficinas de arte, música, dança e teatro para crianças e jovens em comunidades carentes. Inclui materiais artísticos, instrutores qualificados e apresentações públicas.',
    category: 'cultura',
    target_amount: 25000.00,
    current_amount: 15000.00,
    status: 'active',
    location: 'Minas Gerais, MG',
    image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&crop=center',
    impact: { students: 200, workshops: 15, instructors: 10 },
    timeline: '8 meses',
    organization: 'Instituto Imagine'
  }
]

const fakeUsers = [
  {
    email: 'admin@institutoimagine.org',
    name: 'Administrador',
    role: 'admin',
    phone: '(11) 99999-9999',
    cpf: '000.000.000-00'
  },
  {
    email: 'demo@doador.com',
    name: 'Doador Demo',
    role: 'donor',
    phone: '(11) 88888-8888',
    cpf: '111.111.111-11'
  },
  {
    email: 'maria.silva@email.com',
    name: 'Maria Silva',
    role: 'donor',
    phone: '(11) 77777-7777',
    cpf: '222.222.222-22'
  },
  {
    email: 'joao.santos@email.com',
    name: 'João Santos',
    role: 'donor',
    phone: '(11) 66666-6666',
    cpf: '333.333.333-33'
  },
  {
    email: 'ana.costa@email.com',
    name: 'Ana Costa',
    role: 'donor',
    phone: '(11) 55555-5555',
    cpf: '444.444.444-44'
  }
]

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase (Service Role)...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase funcionando! (Service Role - bypassa RLS)')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
    return false
  }
}

async function clearExistingData() {
  console.log('🧹 Limpando dados existentes...')
  
  try {
    // Limpar dados em ordem (respeitando foreign keys)
    await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('favorites').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('✅ Dados existentes limpos!')
  } catch (error) {
    console.log('⚠️ Aviso: Não foi possível limpar todos os dados:', error.message)
  }
}

async function insertProjects() {
  console.log('📝 Inserindo projetos...')
  
  try {
    // Adicionar checkout_tracking_url automática para cada projeto
    const projectsWithCheckoutUrl = fakeProjects.map((project, index) => ({
      ...project,
            checkout_tracking_url: `https://portal.imagineinstituto.com/prototype/checkout/${index + 1}?source=portal&utm_campaign=${project.title.toLowerCase().replace(/\s+/g, '-')}`
    }))
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectsWithCheckoutUrl)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir projetos:', error.message)
      return null
    }
    
    console.log(`✅ ${data.length} projetos inseridos com sucesso!`)
    return data
  } catch (error) {
    console.error('❌ Erro ao inserir projetos:', error.message)
    return null
  }
}

async function insertUsers() {
  console.log('👥 Inserindo usuários...')
  
  try {
    // Gerar UUIDs válidos para os usuários
    const usersWithIds = fakeUsers.map(user => ({
      ...user,
      id: crypto.randomUUID()
    }))
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(usersWithIds)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir usuários:', error.message)
      return null
    }
    
    console.log(`✅ ${data.length} usuários inseridos com sucesso!`)
    return data
  } catch (error) {
    console.error('❌ Erro ao inserir usuários:', error.message)
    return null
  }
}

async function main() {
  console.log('🚀 Iniciando inserção de dados fake no Supabase (Service Role)...\n')
  
  const connected = await testConnection()
  if (!connected) {
    process.exit(1)
  }
  
  console.log('')
  await clearExistingData()
  
  console.log('')
  const projects = await insertProjects()
  
  console.log('')
  const users = await insertUsers()
  
  console.log('\n✅ Inserção de dados fake concluída!')
  console.log('\n📊 Resumo:')
  console.log(`- ${fakeProjects.length} projetos inseridos`)
  console.log(`- ${fakeUsers.length} usuários inseridos`)
  console.log('\n🎯 Agora você pode testar o sistema com dados realistas!')
  console.log('\n💡 Service Role bypassa RLS automaticamente!')
}

main().catch(console.error)
