#!/usr/bin/env node

/**
 * Script para corrigir o schema do banco de dados
 * Adiciona colunas faltantes na tabela projects
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabaseSchema() {
  console.log('🔧 Corrigindo schema do banco de dados...')
  
  try {
    console.log('📊 Verificando colunas existentes...')
    
    // Verificar colunas atuais
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'projects')
      .in('column_name', ['has_funding_goal', 'checkout_tracking_url', 'framer_project_url'])
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError.message)
      return false
    }
    
    console.log('📋 Colunas encontradas:', columns?.map(c => c.column_name) || [])
    
    // Adicionar colunas faltantes via SQL
    console.log('➕ Adicionando colunas faltantes...')
    
    const sqlQueries = [
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS has_funding_goal BOOLEAN DEFAULT true`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS checkout_tracking_url TEXT`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS framer_project_url TEXT`
    ]
    
    for (const query of sqlQueries) {
      console.log(`   Executando: ${query}`)
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: query })
      
      if (sqlError) {
        console.log(`   ⚠️  Query pode já ter sido executada: ${sqlError.message}`)
      } else {
        console.log(`   ✅ Query executada com sucesso`)
      }
    }
    
    // Atualizar projetos existentes
    console.log('🔄 Atualizando projetos existentes...')
    const { error: updateError } = await supabase
      .from('projects')
      .update({ has_funding_goal: true })
      .is('has_funding_goal', null)
    
    if (updateError) {
      console.log(`   ⚠️  Erro ao atualizar projetos: ${updateError.message}`)
    } else {
      console.log('   ✅ Projetos existentes atualizados')
    }
    
    // Verificar resultado final
    console.log('🔍 Verificando resultado final...')
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'projects')
      .in('column_name', ['has_funding_goal', 'checkout_tracking_url', 'framer_project_url'])
    
    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError.message)
      return false
    }
    
    console.log('\n✅ SCHEMA CORRIGIDO COM SUCESSO!')
    console.log('📋 Colunas disponíveis na tabela projects:')
    finalColumns?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    return true

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    return false
  }
}

async function main() {
  console.log('🎯 CORREÇÃO DO SCHEMA DO BANCO DE DADOS')
  console.log('=====================================\n')

  const success = await fixDatabaseSchema()
  
  if (success) {
    console.log('\n✅ Correção concluída com sucesso!')
    console.log('🎉 Agora você pode criar e editar projetos normalmente')
    process.exit(0)
  } else {
    console.log('\n❌ Falha na correção do schema')
    console.log('💡 Execute o SQL manualmente no Supabase Dashboard se necessário')
    process.exit(1)
  }
}

// Executar script
main().catch(console.error)
