// Script para inserir dados fake sem as novas colunas de URL
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

// Dados fake sem as novas colunas
const fakeProjects = [
  {
    title: 'Educação Digital',
    description: 'Levando tecnologia e educação para comunidades carentes.',
    category: 'educacao',
    target_amount: 60000.00,
    current_amount: 45000.00,
    status: 'active',
    location: 'São Paulo, SP',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center'
  },
  {
    title: 'Saúde Comunitária',
    description: 'Clínicas móveis levando saúde básica para regiões remotas.',
    category: 'saude',
    target_amount: 50000.00,
    current_amount: 32000.00,
    status: 'active',
    location: 'Bahia, BA',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center'
  },
  {
    title: 'Meio Ambiente',
    description: 'Reflorestamento e conscientização ambiental.',
    category: 'meio-ambiente',
    target_amount: 30000.00,
    current_amount: 18000.00,
    status: 'active',
    location: 'Amazonas, AM',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&crop=center'
  }
]

async function clearExistingProjects() {
  console.log('🧹 Limpando projetos existentes...')
  
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .neq('id', '0') // Deletar todos os projetos
    
    if (error) {
      console.error('❌ Erro ao limpar projetos:', error.message)
    } else {
      console.log('✅ Projetos existentes removidos')
    }
  } catch (error) {
    console.error('❌ Erro ao limpar projetos:', error.message)
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

async function main() {
  console.log('🚀 Iniciando inserção de dados fake (sem URLs)...\n')
  
  await clearExistingProjects()
  console.log('')
  
  const projects = await insertProjects()
  
  if (projects) {
    console.log('\n✅ Inserção concluída com sucesso!')
    console.log('📊 Projetos inseridos:', projects.length)
    console.log('\n💡 Execute o SQL no Supabase para adicionar as colunas de URL:')
    console.log('   docs/add-project-urls-columns.sql')
  } else {
    console.log('\n❌ Falha na inserção de dados')
  }
}

main().catch(console.error)
