#!/usr/bin/env node

/**
 * Script para adicionar um usuário voluntário de teste
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

async function addVolunteerUser() {
  console.log('👥 Adicionando Usuário Voluntário de Teste')
  console.log('=========================================')
  
  try {
    // Criar usuário no Auth
    console.log('\n1. 🔐 Criando usuário no Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'voluntario@exemplo.com',
      password: '123456',
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message)
      return
    }

    console.log('✅ Usuário criado no Auth:', authData.user.email)

    // Criar perfil do usuário
    console.log('\n2. 👤 Criando perfil do usuário...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'voluntario@exemplo.com',
        name: 'Carlos Voluntário',
        role: 'volunteer'
      })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message)
      return
    }

    console.log('✅ Perfil criado com sucesso')

    // Verificar usuários existentes
    console.log('\n3. 🔍 Verificando usuários existentes...')
    const { data: allUsers, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ Erro ao verificar usuários:', selectError.message)
    } else {
      console.log(`✅ Total de usuários na tabela: ${allUsers?.length || 0}`)
      
      if (allUsers && allUsers.length > 0) {
        console.log('\n📋 Usuários existentes:')
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
        })
      }
    }
    
    console.log('\n✅ Usuário voluntário adicionado com sucesso!')
    console.log('\n🎯 Próximos passos:')
    console.log('   1. Acesse: http://localhost:3000/admin/usuarios?demo_email=admin@institutoimagine.org')
    console.log('   2. Verifique se o usuário voluntário aparece na lista')
    console.log('   3. Teste o filtro "Voluntários"')
    console.log('   4. Teste editar o usuário e alterar sua função')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

addVolunteerUser()
