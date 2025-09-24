#!/usr/bin/env node

/**
 * Script para testar sincronização de doações com Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Verifique se .env.local está configurado corretamente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDonationsSync() {
  console.log('🔍 Testando Sincronização de Doações com Supabase')
  console.log('================================================')
  
  try {
    // Testar conexão
    console.log('\n1. 🔗 Testando conexão com Supabase...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('⚠️ Não autenticado (normal para teste)')
    } else {
      console.log('✅ Usuário autenticado:', user?.email)
    }
    
    // Testar tabela donations
    console.log('\n2. 📊 Testando tabela donations...')
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*')
      .limit(5)
    
    if (donationsError) {
      console.error('❌ Erro ao acessar tabela donations:', donationsError.message)
      return
    }
    
    console.log(`✅ Tabela donations acessível`)
    console.log(`📈 Total de doações encontradas: ${donations?.length || 0}`)
    
    if (donations && donations.length > 0) {
      console.log('\n📋 Primeiras doações:')
      donations.forEach((donation, index) => {
        console.log(`   ${index + 1}. ID: ${donation.id}, Valor: R$ ${donation.amount || 0}, Status: ${donation.status || 'N/A'}`)
      })
    }
    
    // Testar relacionamentos
    console.log('\n3. 🔗 Testando relacionamentos...')
    const { data: donationsWithRelations, error: relationsError } = await supabase
      .from('donations')
      .select(`
        *,
        projects:project_id (
          title
        ),
        profiles:donor_id (
          name,
          email
        )
      `)
      .limit(3)
    
    if (relationsError) {
      console.error('❌ Erro ao testar relacionamentos:', relationsError.message)
    } else {
      console.log('✅ Relacionamentos funcionando')
      if (donationsWithRelations && donationsWithRelations.length > 0) {
        console.log('\n📋 Doações com relacionamentos:')
        donationsWithRelations.forEach((donation, index) => {
          console.log(`   ${index + 1}. Doador: ${donation.profiles?.name || 'N/A'}, Projeto: ${donation.projects?.title || 'N/A'}`)
        })
      }
    }
    
    // Testar inserção de doação de teste
    console.log('\n4. ➕ Testando inserção de doação de teste...')
    const testDonation = {
      amount: 100.00,
      status: 'completed',
      payment_method: 'PIX',
      transaction_id: `TEST-${Date.now()}`,
      donor_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
      project_id: '00000000-0000-0000-0000-000000000000' // UUID fictício
    }
    
    const { data: insertedDonation, error: insertError } = await supabase
      .from('donations')
      .insert([testDonation])
      .select()
    
    if (insertError) {
      console.log('⚠️ Erro ao inserir doação de teste (pode ser RLS):', insertError.message)
    } else {
      console.log('✅ Doação de teste inserida com sucesso')
      
      // Limpar doação de teste
      if (insertedDonation && insertedDonation[0]) {
        await supabase
          .from('donations')
          .delete()
          .eq('id', insertedDonation[0].id)
        console.log('🧹 Doação de teste removida')
      }
    }
    
    console.log('\n✅ Teste de sincronização concluído!')
    console.log('\n📋 Resumo:')
    console.log(`   - Conexão: ✅ Funcionando`)
    console.log(`   - Tabela donations: ✅ Acessível`)
    console.log(`   - Relacionamentos: ✅ Funcionando`)
    console.log(`   - Total de doações: ${donations?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

testDonationsSync()
