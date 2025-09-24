// Script para verificar constraints de status no Supabase
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

async function checkStatusConstraints() {
  console.log('🔍 Verificando constraints de status no Supabase...\n')
  
  try {
    // Tentar inserir projetos com diferentes status para ver quais são válidos
    const testStatuses = ['planning', 'ativo', 'pausado', 'concluido', 'cancelado', 'active', 'paused', 'completed', 'cancelled']
    
    for (const status of testStatuses) {
      try {
        console.log(`🧪 Testando status: "${status}"`)
        
        const testProject = {
          id: crypto.randomUUID(),
          title: `Teste Status ${status}`,
          description: 'Projeto de teste',
          category: 'educacao',
          target_amount: 1000,
          current_amount: 0,
          status: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('projects')
          .insert([testProject])
          .select()
        
        if (error) {
          console.log(`❌ Status "${status}" - ERRO: ${error.message}`)
        } else {
          console.log(`✅ Status "${status}" - VÁLIDO`)
          // Deletar o projeto de teste
          await supabase.from('projects').delete().eq('id', testProject.id)
        }
      } catch (err) {
        console.log(`❌ Status "${status}" - EXCEÇÃO: ${err.message}`)
      }
    }
    
    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao verificar constraints:', error.message)
  }
}

async function main() {
  await checkStatusConstraints()
}

main()
