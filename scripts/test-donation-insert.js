// =============================================
// TESTE ESPECÍFICO DE INSERÇÃO DE DOAÇÃO
// =============================================

const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDonationInsert() {
  try {
    console.log('🧪 Testando inserção de doação...')
    
    // Teste 1: Inserção com user_id NULL
    console.log('\n1️⃣ Testando inserção com user_id NULL...')
    
    const testDonation1 = {
      user_id: null,
      project_id: '550e8400-e29b-41d4-a716-446655440002',
      amount: 25.00,
      currency: 'BRL',
      status: 'pending',
      anonymous: true
    }
    
    const { data: donation1, error: error1 } = await supabase
      .from('donations')
      .insert(testDonation1)
      .select()
      .single()
    
    if (error1) {
      console.error('❌ Erro com user_id NULL:', error1)
    } else {
      console.log('✅ Inserção com user_id NULL funcionou!', donation1)
      
      // Limpar
      await supabase
        .from('donations')
        .delete()
        .eq('id', donation1.id)
    }
    
    // Teste 2: Inserção sem user_id
    console.log('\n2️⃣ Testando inserção sem user_id...')
    
    const testDonation2 = {
      project_id: '550e8400-e29b-41d4-a716-446655440002',
      amount: 30.00,
      currency: 'BRL',
      status: 'pending',
      anonymous: true
    }
    
    const { data: donation2, error: error2 } = await supabase
      .from('donations')
      .insert(testDonation2)
      .select()
      .single()
    
    if (error2) {
      console.error('❌ Erro sem user_id:', error2)
    } else {
      console.log('✅ Inserção sem user_id funcionou!', donation2)
      
      // Limpar
      await supabase
        .from('donations')
        .delete()
        .eq('id', donation2.id)
    }
    
    // Teste 3: Verificar estrutura da tabela
    console.log('\n3️⃣ Verificando estrutura da tabela...')
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'donations' })
    
    if (tableError) {
      console.log('⚠️  Não foi possível verificar estrutura da tabela')
    } else {
      console.log('📋 Estrutura da tabela:', tableInfo)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDonationInsert()

