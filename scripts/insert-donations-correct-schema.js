#!/usr/bin/env node

/**
 * Script para inserir doações usando o schema correto da tabela donations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Doações usando o schema correto
const correctDonations = [
  {
    amount: 150.00,
    currency: 'BRL',
    status: 'completed',
    payment_method: 'PIX',
    anonymous: false,
    message: 'Doação para educação infantil',
    is_recurring: false
  },
  {
    amount: 75.50,
    currency: 'BRL',
    status: 'completed',
    payment_method: 'Cartão de Crédito',
    anonymous: false,
    message: 'Apoio à alimentação escolar',
    is_recurring: false
  },
  {
    amount: 200.00,
    currency: 'BRL',
    status: 'pending',
    payment_method: 'PIX',
    anonymous: true,
    message: 'Doação anônima para biblioteca',
    is_recurring: false
  },
  {
    amount: 100.00,
    currency: 'BRL',
    status: 'completed',
    payment_method: 'Boleto',
    anonymous: false,
    message: 'Contribuição para alimentação',
    is_recurring: false
  },
  {
    amount: 300.00,
    currency: 'BRL',
    status: 'failed',
    payment_method: 'Cartão de Crédito',
    anonymous: false,
    message: 'Doação para educação infantil',
    is_recurring: false
  }
]

async function insertCorrectDonations() {
  console.log('🔍 Inserindo Doações com Schema Correto')
  console.log('=====================================')
  
  try {
    // Limpar doações existentes
    console.log('\n1. 🧹 Limpando doações existentes...')
    const { error: deleteError } = await supabase
      .from('donations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar doações:', deleteError.message)
    } else {
      console.log('✅ Doações existentes removidas')
    }
    
    // Inserir doações com schema correto
    console.log('\n2. ➕ Inserindo doações com schema correto...')
    const { data: insertedDonations, error: insertError } = await supabase
      .from('donations')
      .insert(correctDonations)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir doações:', insertError.message)
      return
    }
    
    console.log('✅ Doações inseridas com sucesso!')
    console.log(`📈 Total inserido: ${insertedDonations?.length || 0}`)
    
    // Verificar doações inseridas
    console.log('\n3. 🔍 Verificando doações inseridas...')
    const { data: allDonations, error: selectError } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ Erro ao verificar doações:', selectError.message)
    } else {
      console.log(`✅ Total de doações na tabela: ${allDonations?.length || 0}`)
      
      if (allDonations && allDonations.length > 0) {
        console.log('\n📋 Doações inseridas:')
        allDonations.forEach((donation, index) => {
          const donorName = donation.anonymous ? 'Doador Anônimo' : 'Doador'
          console.log(`   ${index + 1}. ${donorName} - R$ ${donation.amount} - ${donation.status}`)
        })
      }
    }
    
    console.log('\n✅ Doações inseridas com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   - Doações inseridas: ${insertedDonations?.length || 0}`)
    console.log(`   - Total na tabela: ${allDonations?.length || 0}`)
    console.log('   - Status: ✅ Pronto para teste na interface')
    
    console.log('\n🎯 Próximos passos:')
    console.log('   1. Acesse: http://localhost:3000/admin/doacoes?demo_email=admin@institutoimagine.org')
    console.log('   2. Verifique se as doações aparecem na interface')
    console.log('   3. Teste os filtros e funcionalidades')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

insertCorrectDonations()
