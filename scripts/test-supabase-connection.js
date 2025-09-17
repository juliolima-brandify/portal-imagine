// =============================================
// TESTE DE CONEXÃO COM SUPABASE
// =============================================

const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuração do Supabase...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada')
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔗 Testando conexão...')
    
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    console.log('📊 Dados de teste:', data)
    
    // Teste 2: Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...')
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'donations' })
    
    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas (normal)')
    } else {
      console.log('📋 Políticas encontradas:', policies)
    }
    
    // Teste 3: Tentar inserir uma doação de teste
    console.log('\n🧪 Testando inserção de doação...')
    
    const testDonation = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      project_id: '550e8400-e29b-41d4-a716-446655440002',
      amount: 10.00,
      currency: 'BRL',
      status: 'pending'
    }
    
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert(testDonation)
      .select()
      .single()
    
    if (donationError) {
      console.error('❌ Erro ao inserir doação:', donationError)
      
      if (donationError.code === '42501') {
        console.log('\n🔧 SOLUÇÃO: Execute o script SQL no Supabase:')
        console.log('ALTER TABLE donations DISABLE ROW LEVEL SECURITY;')
      }
    } else {
      console.log('✅ Doação inserida com sucesso!', donation)
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', donation.id)
      
      console.log('🧹 Doação de teste removida')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testConnection()

