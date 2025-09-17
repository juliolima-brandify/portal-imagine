// =============================================
// VERIFICAR PROJETOS EXISTENTES NO BANCO
// =============================================

const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProjects() {
  try {
    console.log('🔍 Verificando projetos existentes no banco...')
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, status')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao buscar projetos:', error)
      return
    }
    
    if (!projects || projects.length === 0) {
      console.log('⚠️  Nenhum projeto encontrado no banco!')
      console.log('📝 Vamos criar alguns projetos de teste...')
      
      // Criar projetos de teste
      const testProjects = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Educação Digital',
          description: 'Levando tecnologia e educação para comunidades carentes',
          category: 'educacao',
          target_amount: 60000,
          current_amount: 45000,
          status: 'active',
          location: 'São Paulo, SP',
          organization: 'Instituto Imagine'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Saúde Comunitária',
          description: 'Clínicas móveis levando saúde básica para regiões remotas',
          category: 'saude',
          target_amount: 50000,
          current_amount: 32000,
          status: 'active',
          location: 'Bahia, BA',
          organization: 'Instituto Imagine'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Meio Ambiente',
          description: 'Projetos de preservação e conscientização ambiental',
          category: 'meio-ambiente',
          target_amount: 40000,
          current_amount: 28000,
          status: 'active',
          location: 'Amazonas, AM',
          organization: 'Instituto Imagine'
        }
      ]
      
      for (const project of testProjects) {
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert(project)
          .select('id, title')
          .single()
        
        if (insertError) {
          console.error(`❌ Erro ao criar projeto ${project.title}:`, insertError)
        } else {
          console.log(`✅ Projeto criado: ${newProject.title} (${newProject.id})`)
        }
      }
      
    } else {
      console.log(`✅ Encontrados ${projects.length} projetos:`)
      projects.forEach(project => {
        console.log(`  - ${project.title} (${project.id}) - Status: ${project.status}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkProjects()

