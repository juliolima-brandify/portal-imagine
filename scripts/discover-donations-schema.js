#!/usr/bin/env node

/**
 * Script para descobrir o schema correto da tabela donations
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

async function discoverDonationsSchema() {
  console.log('🔍 Descobrindo Schema da Tabela Donations')
  console.log('========================================')
  
  try {
    // Tentar inserir com campos mínimos
    console.log('\n1. ➕ Testando inserção com campos mínimos...')
    
    const minimalDonation = {
      amount: 100.00
    }
    
    const { data: insertedDonation, error: insertError } = await supabase
      .from('donations')
      .insert([minimalDonation])
      .select()
    
    if (insertError) {
      console.log('❌ Erro ao inserir doação mínima:', insertError.message)
    } else {
      console.log('✅ Doação mínima inserida com sucesso!')
      console.log('📋 Campos retornados:', Object.keys(insertedDonation[0]))
      console.log('📋 Valores:', insertedDonation[0])
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertedDonation[0].id)
      console.log('🧹 Doação de teste removida')
    }
    
    // Tentar inserir com campos adicionais
    console.log('\n2. ➕ Testando inserção com campos adicionais...')
    
    const extendedDonation = {
      amount: 150.00,
      status: 'completed',
      payment_method: 'PIX'
    }
    
    const { data: insertedExtended, error: extendedError } = await supabase
      .from('donations')
      .insert([extendedDonation])
      .select()
    
    if (extendedError) {
      console.log('❌ Erro ao inserir doação estendida:', extendedError.message)
    } else {
      console.log('✅ Doação estendida inserida com sucesso!')
      console.log('📋 Campos retornados:', Object.keys(insertedExtended[0]))
      console.log('📋 Valores:', insertedExtended[0])
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertedExtended[0].id)
      console.log('🧹 Doação de teste removida')
    }
    
    // Tentar inserir com campos de texto
    console.log('\n3. ➕ Testando inserção com campos de texto...')
    
    const textDonation = {
      amount: 200.00,
      status: 'pending',
      payment_method: 'Cartão',
      donor_name: 'Teste',
      donor_email: 'teste@exemplo.com',
      project_name: 'Projeto Teste'
    }
    
    const { data: insertedText, error: textError } = await supabase
      .from('donations')
      .insert([textDonation])
      .select()
    
    if (textError) {
      console.log('❌ Erro ao inserir doação com texto:', textError.message)
    } else {
      console.log('✅ Doação com texto inserida com sucesso!')
      console.log('📋 Campos retornados:', Object.keys(insertedText[0]))
      console.log('📋 Valores:', insertedText[0])
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertedText[0].id)
      console.log('🧹 Doação de teste removida')
    }
    
    console.log('\n✅ Descoberta do schema concluída!')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

discoverDonationsSchema()
