// =============================================
// TESTE FINAL DE INSERÇÃO DE DOAÇÃO
// =============================================

const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDonationFinal() {
  try {
    console.log('🧪 Teste final de inserção de doação...')
    
    // IDs reais dos projetos do banco
    const realProjectIds = [
      'bdfd300b-9138-4def-bde1-9d769e1d9e30', // Educação Digital
      'f9529225-4b6d-400b-b58a-3b7b32260450', // Saúde Comunitária
      'eea882e5-cb66-4688-a1c9-58f939a4b65e'  // Meio Ambiente
    ]
    
    // Teste com cada projeto
    for (const projectId of realProjectIds) {
      console.log(`\n🔍 Testando com projeto: ${projectId}`)
      
      const testDonation = {
        user_id: null,
        project_id: projectId,
        amount: 25.00,
        currency: 'BRL',
        status: 'pending',
        anonymous: true
      }
      
      const { data: donation, error } = await supabase
        .from('donations')
        .insert(testDonation)
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Erro com projeto ${projectId}:`, error)
        
        if (error.code === '42501') {
          console.log('🔧 SOLUÇÃO: Execute no Supabase:')
          console.log('ALTER TABLE donations DISABLE ROW LEVEL SECURITY;')
        }
      } else {
        console.log(`✅ Sucesso com projeto ${projectId}!`, donation)
        
        // Limpar
        await supabase
          .from('donations')
          .delete()
          .eq('id', donation.id)
        
        console.log('🧹 Doação de teste removida')
        break // Parar no primeiro sucesso
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDonationFinal()

