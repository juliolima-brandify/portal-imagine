#!/usr/bin/env node

/**
 * Script para inserir doações de teste no Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Doações de teste
const testDonations = [
  {
    amount: 150.00,
    status: 'completed',
    payment_method: 'PIX',
    donor_name: 'João Silva',
    donor_email: 'joao@exemplo.com',
    project_name: 'Educação Infantil',
    created_at: new Date('2024-01-15').toISOString()
  },
  {
    amount: 75.50,
    status: 'completed',
    payment_method: 'Cartão de Crédito',
    donor_name: 'Maria Santos',
    donor_email: 'maria@exemplo.com',
    project_name: 'Alimentação Escolar',
    created_at: new Date('2024-01-14').toISOString()
  },
  {
    amount: 200.00,
    status: 'pending',
    payment_method: 'PIX',
    donor_name: 'Pedro Oliveira',
    donor_email: 'pedro@exemplo.com',
    project_name: 'Educação Infantil',
    created_at: new Date('2024-01-13').toISOString()
  },
  {
    amount: 50.00,
    status: 'failed',
    payment_method: 'Cartão de Crédito',
    donor_name: 'Ana Costa',
    donor_email: 'ana@exemplo.com',
    project_name: 'Alimentação Escolar',
    created_at: new Date('2024-01-12').toISOString()
  },
  {
    amount: 300.00,
    status: 'completed',
    payment_method: 'PIX',
    donor_name: 'Carlos Ferreira',
    donor_email: 'carlos@exemplo.com',
    project_name: 'Educação Infantil',
    created_at: new Date('2024-01-11').toISOString()
  }
]

async function insertTestDonations() {
  console.log('🔍 Inserindo Doações de Teste no Supabase')
  console.log('========================================')
  
  try {
    // Limpar doações existentes
    console.log('\n1. 🧹 Limpando doações existentes...')
    const { error: deleteError } = await supabase
      .from('donations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todas
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar doações (pode ser RLS):', deleteError.message)
    } else {
      console.log('✅ Doações existentes removidas')
    }
    
    // Inserir doações de teste
    console.log('\n2. ➕ Inserindo doações de teste...')
    const { data: insertedDonations, error: insertError } = await supabase
      .from('donations')
      .insert(testDonations)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir doações:', insertError.message)
      console.log('💡 Verifique se a tabela donations tem as colunas corretas')
      return
    }
    
    console.log('✅ Doações de teste inseridas com sucesso!')
    console.log(`📈 Total inserido: ${insertedDonations?.length || 0}`)
    
    // Verificar se as doações foram inseridas
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
          console.log(`   ${index + 1}. ${donation.donor_name} - R$ ${donation.amount} - ${donation.status}`)
        })
      }
    }
    
    console.log('\n✅ Doações de teste inseridas com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   - Doações inseridas: ${insertedDonations?.length || 0}`)
    console.log(`   - Total na tabela: ${allDonations?.length || 0}`)
    console.log('   - Status: ✅ Pronto para teste')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

insertTestDonations()
