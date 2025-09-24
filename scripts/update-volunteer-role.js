#!/usr/bin/env node

/**
 * Script para atualizar o role do usuário voluntário
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

async function updateVolunteerRole() {
  console.log('🔄 Atualizando Role do Usuário Voluntário')
  console.log('========================================')
  
  try {
    // Atualizar o role do usuário voluntário
    console.log('\n1. 👤 Atualizando role para "volunteer"...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'volunteer' })
      .eq('email', 'voluntario@exemplo.com')

    if (updateError) {
      console.error('❌ Erro ao atualizar role:', updateError.message)
      return
    }

    console.log('✅ Role atualizado com sucesso')

    // Verificar usuários existentes
    console.log('\n2. 🔍 Verificando usuários atualizados...')
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
    
    console.log('\n✅ Role do usuário voluntário atualizado com sucesso!')
    console.log('\n🎯 Próximos passos:')
    console.log('   1. Acesse: http://localhost:3000/admin/usuarios?demo_email=admin@institutoimagine.org')
    console.log('   2. Verifique se o usuário voluntário aparece com role correto')
    console.log('   3. Teste o filtro "Voluntários"')
    console.log('   4. Teste editar o usuário e alterar sua função')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

updateVolunteerRole()
