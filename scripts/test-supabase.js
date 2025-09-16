 // Script para testar conexão com Supabase e migrar dados
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

async function checkTables() {
  console.log('🔍 Verificando tabelas...')
  
  const tables = ['profiles', 'projects', 'donations', 'favorites', 'notifications']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`)
      } else {
        console.log(`✅ Tabela ${table}: OK`)
      }
    } catch (error) {
      console.log(`❌ Tabela ${table}: ${error.message}`)
    }
  }
}

async function migrateProjects() {
  console.log('🔄 Migrando projetos...')
  
  const mockProjects = [
    {
      title: 'Educação Digital',
      description: 'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
      long_description: 'Este projeto visa criar laboratórios de informática em escolas públicas de comunidades carentes, fornecendo computadores, internet e capacitação para professores. O objetivo é reduzir a desigualdade digital e preparar os estudantes para o futuro tecnológico.',
      category: 'educacao',
      target_amount: 60000.00,
      current_amount: 45000.00,
      status: 'active',
      location: 'São Paulo, SP',
      image_url: '/api/placeholder/600/400',
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
      image_url: '/api/placeholder/600/400',
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
      image_url: '/api/placeholder/600/400',
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
      image_url: '/api/placeholder/600/400',
      impact: { athletes: 200, courts: 3, coaches: 8 },
      timeline: '10 meses',
      organization: 'Instituto Imagine'
    }
  ]
  
  try {
    // Verificar se já existem projetos
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    if (existingProjects && existingProjects.length > 0) {
      console.log('✅ Projetos já existem no banco')
      return
    }
    
    // Inserir projetos
    const { data, error } = await supabase
      .from('projects')
      .insert(mockProjects)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir projetos:', error.message)
    } else {
      console.log(`✅ ${data.length} projetos inseridos com sucesso!`)
    }
  } catch (error) {
    console.error('❌ Erro ao migrar projetos:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando teste e migração do Supabase...\n')
  
  const connected = await testConnection()
  if (!connected) {
    process.exit(1)
  }
  
  console.log('')
  await checkTables()
  
  console.log('')
  await migrateProjects()
  
  console.log('\n✅ Teste e migração concluídos!')
}

main().catch(console.error)
