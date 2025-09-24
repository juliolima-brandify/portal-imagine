#!/usr/bin/env node

/**
 * Script para testar a página de usuários
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

async function testUsersPage() {
  console.log('🔍 Testando Página de Usuários')
  console.log('==============================')
  
  try {
    // Testar conexão com Supabase
    console.log('\n1. 🔗 Testando conexão com Supabase...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('⚠️ Erro de autenticação:', authError.message)
    } else {
      console.log('✅ Conexão com Supabase OK')
    }
    
    // Testar carregamento de perfis
    console.log('\n2. 👥 Testando carregamento de perfis...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ Erro ao carregar perfis:', profilesError.message)
    } else {
      console.log(`✅ Perfis carregados: ${profiles?.length || 0}`)
      
      if (profiles && profiles.length > 0) {
        console.log('\n📋 Perfis encontrados:')
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.email}) - ${profile.role}`)
        })
      }
    }
    
    // Testar estrutura da tabela profiles
    console.log('\n3. 🗂️ Testando estrutura da tabela profiles...')
    const { data: sampleProfile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleProfile) {
      console.log('✅ Estrutura da tabela profiles:')
      console.log('   Colunas disponíveis:', Object.keys(sampleProfile))
    } else {
      console.log('⚠️ Nenhum perfil encontrado para testar estrutura')
    }
    
    console.log('\n✅ Teste da página de usuários concluído!')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

testUsersPage()
