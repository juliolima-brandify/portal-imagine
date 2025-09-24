#!/usr/bin/env node

/**
 * Script para verificar as colunas exatas da tabela donations
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

async function checkDonationsColumns() {
  console.log('🔍 Verificando Colunas da Tabela Donations')
  console.log('=========================================')
  
  try {
    // Tentar inserir uma doação com campos mínimos
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
      
      // Tentar com outros campos comuns
      console.log('\n2. 🔍 Testando outros campos comuns...')
      
      const commonFields = [
        'id', 'amount', 'status', 'payment_method', 'transaction_id',
        'donor_id', 'project_id', 'created_at', 'updated_at',
        'donor_name', 'donor_email', 'project_name', 'processed_at'
      ]
      
      for (const field of commonFields) {
        try {
          const testData = { [field]: 'test' }
          const { error } = await supabase
            .from('donations')
            .insert([testData])
          
          if (!error) {
            console.log(`✅ Campo '${field}' existe`)
            // Limpar teste
            await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          } else {
            console.log(`❌ Campo '${field}' não existe: ${error.message}`)
          }
        } catch (e) {
          console.log(`❌ Campo '${field}' não existe`)
        }
      }
      
    } else {
      console.log('✅ Doação mínima inserida com sucesso!')
      console.log('📋 Campos retornados:', Object.keys(insertedDonation[0]))
      
      // Limpar doação de teste
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertedDonation[0].id)
      console.log('🧹 Doação de teste removida')
    }
    
    // Tentar consultar a tabela para ver o schema
    console.log('\n3. 📊 Consultando schema da tabela...')
    const { data: donations, error: selectError } = await supabase
      .from('donations')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('❌ Erro ao consultar tabela:', selectError.message)
    } else {
      console.log('✅ Tabela acessível')
      console.log(`📈 Total de registros: ${donations?.length || 0}`)
    }
    
    console.log('\n✅ Verificação de colunas concluída!')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

checkDonationsColumns()
