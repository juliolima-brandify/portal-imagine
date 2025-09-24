// Script para limpar completamente e resetar dados
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Dados limpos para teste
const cleanProjects = [
  {
    title: 'Educação Digital',
    description: 'Levando tecnologia e educação para comunidades carentes.',
    category: 'educacao',
    target_amount: 60000.00,
    current_amount: 45000.00,
    status: 'active',
    location: 'São Paulo, SP',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    framer_project_url: 'https://imagineinstituto.com/projetos/educacao-digital',
    checkout_tracking_url: 'https://portal.imagineinstituto.com/prototype/checkout/1?source=portal&utm_campaign=educacao-digital'
  },
  {
    title: 'Saúde Comunitária',
    description: 'Clínicas móveis levando saúde básica para regiões remotas.',
    category: 'saude',
    target_amount: 50000.00,
    current_amount: 32000.00,
    status: 'active',
    location: 'Bahia, BA',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center',
    framer_project_url: 'https://imagineinstituto.com/projetos/saude-comunitaria',
    checkout_tracking_url: 'https://portal.imagineinstituto.com/prototype/checkout/2?source=portal&utm_campaign=saude-comunitaria'
  }
]

async function cleanDatabase() {
  console.log('🧹 Limpando TODOS os dados...')
  
  try {
    // Limpar todas as tabelas relacionadas
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (projectsError) {
      console.error('❌ Erro ao limpar projetos:', projectsError.message)
    } else {
      console.log('✅ Todos os projetos removidos')
    }
    
    // Verificar quantos projetos restaram
    const { data: remainingProjects, error: checkError } = await supabase
      .from('projects')
      .select('id, title')
    
    if (checkError) {
      console.error('❌ Erro ao verificar projetos restantes:', checkError.message)
    } else {
      console.log(`📊 Projetos restantes: ${remainingProjects ? remainingProjects.length : 0}`)
      if (remainingProjects && remainingProjects.length > 0) {
        console.log('Projetos restantes:', remainingProjects.map(p => `${p.id} - ${p.title}`))
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error.message)
  }
}

async function insertCleanData() {
  console.log('📝 Inserindo dados limpos...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(cleanProjects)
      .select()

    if (error) {
      console.error('❌ Erro ao inserir dados limpos:', error.message)
      return false
    }

    console.log(`✅ ${data.length} projetos inseridos com sucesso!`)
    console.log('Projetos inseridos:')
    data.forEach(project => {
      console.log(`  - ${project.id}: ${project.title}`)
    })
    return true
  } catch (error) {
    console.error('❌ Erro ao inserir dados limpos:', error.message)
    return false
  }
}

async function verifyData() {
  console.log('🔍 Verificando dados finais...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao verificar dados:', error.message)
    } else {
      console.log(`📊 Total de projetos no Supabase: ${data ? data.length : 0}`)
      if (data && data.length > 0) {
        console.log('Projetos no banco:')
        data.forEach(project => {
          console.log(`  - ${project.id}: ${project.title}`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando limpeza e reset completo...\n')
  
  await cleanDatabase()
  console.log('')
  
  const inserted = await insertCleanData()
  console.log('')
  
  await verifyData()
  console.log('')
  
  if (inserted) {
    console.log('✅ Reset completo concluído!')
    console.log('🧪 Agora teste o admin novamente')
  } else {
    console.log('❌ Falha no reset')
  }
}

main().catch(console.error)
