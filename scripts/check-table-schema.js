// Script para verificar schema da tabela projects
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

async function checkTableSchema() {
  console.log('🔍 Verificando schema da tabela projects...\n')
  
  try {
    // Tentar buscar um projeto existente para ver quais colunas existem
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao buscar projetos:', error.message)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Colunas encontradas na tabela projects:')
      const project = data[0]
      Object.keys(project).forEach(column => {
        console.log(`  - ${column}: ${typeof project[column]}`)
      })
    } else {
      console.log('ℹ️ Nenhum projeto encontrado para verificar schema')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error.message)
  }
}

async function main() {
  await checkTableSchema()
}

main()
