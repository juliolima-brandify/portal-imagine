// Script para inserir dados fake realistas no Supabase
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.log('Configure o arquivo .env.local com:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Dados fake realistas
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
  },
  {
    title: 'Alimentação Saudável',
    description: 'Hortas comunitárias e educação nutricional para famílias carentes.',
    long_description: 'Projeto que cria hortas comunitárias em bairros carentes e oferece educação nutricional para famílias. Inclui sementes, ferramentas, capacitação e acompanhamento nutricional.',
    category: 'alimentacao',
    target_amount: 35000.00,
    current_amount: 22000.00,
    status: 'active',
    location: 'Ceará, CE',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop&crop=center',
    impact: { families: 150, gardens: 20, nutritionists: 5 },
    timeline: '10 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Tecnologia Social',
    description: 'Capacitação em tecnologia para adultos e idosos em comunidades carentes.',
    long_description: 'Projeto que oferece cursos de informática básica, internet e redes sociais para adultos e idosos em comunidades carentes. Inclui computadores, internet e instrutores especializados.',
    category: 'tecnologia',
    target_amount: 40000.00,
    current_amount: 28000.00,
    status: 'active',
    location: 'Paraná, PR',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop&crop=center',
    impact: { adults: 300, seniors: 100, computers: 20 },
    timeline: '12 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Inclusão Social',
    description: 'Projeto de inclusão para pessoas com deficiência em atividades esportivas e culturais.',
    long_description: 'Projeto que promove a inclusão de pessoas com deficiência através de atividades esportivas adaptadas, oficinas culturais e capacitação profissional. Inclui equipamentos adaptados e profissionais especializados.',
    category: 'inclusao',
    target_amount: 45000.00,
    current_amount: 30000.00,
    status: 'active',
    location: 'Santa Catarina, SC',
    image_url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&h=400&fit=crop&crop=center',
    impact: { participants: 120, activities: 25, professionals: 15 },
    timeline: '15 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Empreendedorismo Social',
    description: 'Capacitação em empreendedorismo para jovens de comunidades carentes.',
    long_description: 'Projeto que capacita jovens em empreendedorismo social, oferecendo cursos, mentorias e apoio para criação de negócios sustentáveis. Inclui mentores especializados e apoio financeiro inicial.',
    category: 'empreendedorismo',
    target_amount: 50000.00,
    current_amount: 35000.00,
    status: 'active',
    location: 'Rio Grande do Sul, RS',
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&crop=center',
    impact: { youth: 80, businesses: 15, mentors: 12 },
    timeline: '18 meses',
    organization: 'Instituto Imagine'
  },
  {
    title: 'Proteção Animal',
    description: 'Projeto de proteção e cuidado de animais abandonados em comunidades carentes.',
    long_description: 'Projeto que oferece cuidados veterinários, castração e adoção responsável de animais abandonados em comunidades carentes. Inclui clínicas veterinárias móveis e campanhas de conscientização.',
    category: 'animais',
    target_amount: 30000.00,
    current_amount: 18000.00,
    status: 'active',
    location: 'Goiás, GO',
    image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&crop=center',
    impact: { animals: 500, treatments: 200, adoptions: 150 },
    timeline: '12 meses',
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
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
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

async function disableRLS() {
  console.log('🔓 Desabilitando RLS temporariamente...')
  
  try {
    // Desabilitar RLS para inserção de dados fake
    await supabase.rpc('disable_rls_for_fake_data')
    console.log('✅ RLS desabilitado temporariamente')
  } catch (error) {
    console.log('⚠️ Aviso: Não foi possível desabilitar RLS:', error.message)
    console.log('ℹ️ Continuando com RLS ativo...')
  }
}

async function enableRLS() {
  console.log('🔒 Reabilitando RLS...')
  
  try {
    // Reabilitar RLS
    await supabase.rpc('enable_rls_for_fake_data')
    console.log('✅ RLS reabilitado')
  } catch (error) {
    console.log('⚠️ Aviso: Não foi possível reabilitar RLS:', error.message)
  }
}

async function insertProjects() {
  console.log('📝 Inserindo projetos...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(fakeProjects)
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

async function insertDonations(projects, users) {
  console.log('💰 Inserindo doações...')
  
  if (!projects || !users) {
    console.log('⚠️ Pulando inserção de doações - projetos ou usuários não disponíveis')
    return
  }
  
  const donations = []
  const donorUsers = users.filter(u => u.role === 'donor')
  
  // Criar doações realistas
  for (let i = 0; i < 50; i++) {
    const randomProject = projects[Math.floor(Math.random() * projects.length)]
    const randomUser = donorUsers[Math.floor(Math.random() * donorUsers.length)]
    const amount = Math.floor(Math.random() * 1000) + 50 // R$ 50 a R$ 1050
    const status = Math.random() > 0.1 ? 'completed' : 'pending' // 90% completas
    
    donations.push({
      user_id: randomUser.id,
      project_id: randomProject.id,
      amount: amount,
      currency: 'BRL',
      status: status,
      payment_method: ['pix', 'credit_card', 'boleto'][Math.floor(Math.random() * 3)],
      is_recurring: Math.random() > 0.8, // 20% recorrentes
      recurring_frequency: Math.random() > 0.8 ? 'monthly' : null,
      message: Math.random() > 0.7 ? `Doação para ${randomProject.title}` : null,
      anonymous: Math.random() > 0.8, // 20% anônimas
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Últimos 90 dias
    })
  }
  
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert(donations)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir doações:', error.message)
    } else {
      console.log(`✅ ${data.length} doações inseridas com sucesso!`)
    }
  } catch (error) {
    console.error('❌ Erro ao inserir doações:', error.message)
  }
}

async function insertFavorites(projects, users) {
  console.log('❤️ Inserindo favoritos...')
  
  if (!projects || !users) {
    console.log('⚠️ Pulando inserção de favoritos - projetos ou usuários não disponíveis')
    return
  }
  
  const favorites = []
  const donorUsers = users.filter(u => u.role === 'donor')
  
  // Cada usuário favorita 2-5 projetos aleatórios
  donorUsers.forEach(user => {
    const numFavorites = Math.floor(Math.random() * 4) + 2 // 2-5 favoritos
    const shuffledProjects = [...projects].sort(() => 0.5 - Math.random())
    
    for (let i = 0; i < numFavorites; i++) {
      favorites.push({
        user_id: user.id,
        project_id: shuffledProjects[i].id,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Últimos 30 dias
      })
    }
  })
  
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert(favorites)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir favoritos:', error.message)
    } else {
      console.log(`✅ ${data.length} favoritos inseridos com sucesso!`)
    }
  } catch (error) {
    console.error('❌ Erro ao inserir favoritos:', error.message)
  }
}

async function insertNotifications(users) {
  console.log('🔔 Inserindo notificações...')
  
  if (!users) {
    console.log('⚠️ Pulando inserção de notificações - usuários não disponíveis')
    return
  }
  
  const notifications = []
  const donorUsers = users.filter(u => u.role === 'donor')
  
  // Criar notificações realistas
  donorUsers.forEach(user => {
    const numNotifications = Math.floor(Math.random() * 5) + 1 // 1-5 notificações
    
    for (let i = 0; i < numNotifications; i++) {
      const types = ['donation_received', 'project_update', 'thank_you', 'reminder']
      const type = types[Math.floor(Math.random() * types.length)]
      
      let title, message
      switch (type) {
        case 'donation_received':
          title = 'Doação Recebida!'
          message = 'Sua doação foi processada com sucesso. Obrigado pelo seu apoio!'
          break
        case 'project_update':
          title = 'Atualização do Projeto'
          message = 'O projeto que você apoia teve uma nova atualização. Confira!'
          break
        case 'thank_you':
          title = 'Obrigado!'
          message = 'Obrigado por fazer a diferença! Sua contribuição é muito importante.'
          break
        case 'reminder':
          title = 'Lembrete'
          message = 'Que tal fazer uma nova doação? Há projetos incríveis esperando por você!'
          break
      }
      
      notifications.push({
        user_id: user.id,
        type: type,
        title: title,
        message: message,
        read: Math.random() > 0.3, // 70% lidas
        data: { project_id: null },
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Últimos 7 dias
      })
    }
  })
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir notificações:', error.message)
    } else {
      console.log(`✅ ${data.length} notificações inseridas com sucesso!`)
    }
  } catch (error) {
    console.error('❌ Erro ao inserir notificações:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando inserção de dados fake no Supabase...\n')
  
  const connected = await testConnection()
  if (!connected) {
    process.exit(1)
  }
  
  console.log('')
  await disableRLS()
  
  console.log('')
  await clearExistingData()
  
  console.log('')
  const projects = await insertProjects()
  
  console.log('')
  const users = await insertUsers()
  
  console.log('')
  await insertDonations(projects, users)
  
  console.log('')
  await insertFavorites(projects, users)
  
  console.log('')
  await insertNotifications(users)
  
  console.log('')
  await enableRLS()
  
  console.log('\n✅ Inserção de dados fake concluída!')
  console.log('\n📊 Resumo:')
  console.log(`- ${fakeProjects.length} projetos inseridos`)
  console.log(`- ${fakeUsers.length} usuários inseridos`)
  console.log('- 50 doações inseridas')
  console.log('- Favoritos inseridos')
  console.log('- Notificações inseridas')
  console.log('\n🎯 Agora você pode testar o sistema com dados realistas!')
}

main().catch(console.error)
