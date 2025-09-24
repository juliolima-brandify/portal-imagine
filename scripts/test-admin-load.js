// Script para testar carregamento de projetos como admin
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminLoad() {
  console.log('🧪 Testando carregamento de projetos como admin...\n')
  
  try {
    console.log('🔍 Carregando projetos do Supabase...')
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao carregar projetos:', error.message)
      console.error('Detalhes do erro:', error)
      return false
    }
    
    console.log(`✅ ${data ? data.length : 0} projetos carregados com sucesso!`)
    
    if (data && data.length > 0) {
      console.log('\n📋 Projetos encontrados:')
      data.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} (ID: ${project.id})`)
        console.log(`     Status: ${project.status}`)
        console.log(`     Meta: R$ ${project.target_amount}`)
        console.log(`     Arrecadado: R$ ${project.current_amount}`)
        console.log('')
      })
    } else {
      console.log('⚠️ Nenhum projeto encontrado no Supabase')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao testar carregamento:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Teste de carregamento de projetos para admin\n')
  
  const success = await testAdminLoad()
  
  if (success) {
    console.log('✅ Teste concluído com sucesso!')
    console.log('💡 Se o portal ainda mostra 0 projetos, verifique:')
    console.log('   1. Console do navegador para erros')
    console.log('   2. Network tab para requisições falhando')
    console.log('   3. Se o supabaseAdmin está sendo usado corretamente')
  } else {
    console.log('❌ Teste falhou!')
  }
}

main().catch(console.error)
