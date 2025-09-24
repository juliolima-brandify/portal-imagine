#!/usr/bin/env node

/**
 * Script para verificar o schema da tabela donations
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

async function checkDonationsSchema() {
  console.log('🔍 Verificando Schema da Tabela Donations')
  console.log('========================================')
  
  try {
    // Tentar buscar uma doação para ver o schema
    console.log('\n1. 📊 Testando consulta básica...')
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela donations:', error.message)
      return
    }
    
    console.log('✅ Tabela donations acessível')
    console.log(`📈 Total de registros: ${donations?.length || 0}`)
    
    if (donations && donations.length > 0) {
      console.log('\n📋 Schema da tabela donations:')
      const firstDonation = donations[0]
      Object.keys(firstDonation).forEach(key => {
        console.log(`   - ${key}: ${typeof firstDonation[key]} = ${firstDonation[key]}`)
      })
    } else {
      console.log('\n⚠️ Tabela donations está vazia')
    }
    
    // Testar inserção de doação com campos básicos
    console.log('\n2. ➕ Testando inserção com campos básicos...')
    const testDonation = {
      amount: 100.00,
      status: 'completed',
      payment_method: 'PIX',
      transaction_id: `TEST-${Date.now()}`
    }
    
    const { data: insertedDonation, error: insertError } = await supabase
      .from('donations')
      .insert([testDonation])
      .select()
    
    if (insertError) {
      console.log('⚠️ Erro ao inserir doação:', insertError.message)
      console.log('💡 Campos disponíveis podem ser diferentes')
    } else {
      console.log('✅ Doação inserida com sucesso')
      console.log('📋 Campos inseridos:', Object.keys(insertedDonation[0]))
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertedDonation[0].id)
      console.log('🧹 Doação de teste removida')
    }
    
    // Verificar se existe tabela profiles
    console.log('\n3. 👥 Verificando tabela profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('⚠️ Tabela profiles não encontrada:', profilesError.message)
    } else {
      console.log('✅ Tabela profiles acessível')
      console.log(`📈 Total de perfis: ${profiles?.length || 0}`)
    }
    
    // Verificar se existe tabela projects
    console.log('\n4. 🎯 Verificando tabela projects...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (projectsError) {
      console.log('⚠️ Tabela projects não encontrada:', projectsError.message)
    } else {
      console.log('✅ Tabela projects acessível')
      console.log(`📈 Total de projetos: ${projects?.length || 0}`)
    }
    
    console.log('\n✅ Verificação do schema concluída!')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

checkDonationsSchema()
