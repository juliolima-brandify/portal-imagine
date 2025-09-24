#!/usr/bin/env node

/**
 * Script para inserir usuários de teste no Supabase
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

// Usuários de teste
const testUsers = [
  {
    email: 'joao@exemplo.com',
    name: 'João Silva',
    role: 'donor',
    status: 'active'
  },
  {
    email: 'maria@exemplo.com',
    name: 'Maria Santos',
    role: 'donor',
    status: 'active'
  },
  {
    email: 'pedro@exemplo.com',
    name: 'Pedro Costa',
    role: 'donor',
    status: 'inactive'
  },
  {
    email: 'ana@exemplo.com',
    name: 'Ana Oliveira',
    role: 'donor',
    status: 'active'
  },
  {
    email: 'admin@institutoimagine.org',
    name: 'Admin Sistema',
    role: 'admin',
    status: 'active'
  }
]

async function insertTestUsers() {
  console.log('🔍 Inserindo Usuários de Teste no Supabase')
  console.log('=========================================')
  
  try {
    // Limpar usuários existentes (exceto admin atual)
    console.log('\n1. 🧹 Limpando usuários existentes...')
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar usuários:', deleteError.message)
    } else {
      console.log('✅ Usuários existentes removidos')
    }
    
    // Inserir usuários de teste
    console.log('\n2. ➕ Inserindo usuários de teste...')
    
    for (const userData of testUsers) {
      try {
        // Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: '123456', // Senha padrão para teste
          email_confirm: true
        })

        if (authError) {
          console.log(`⚠️ Erro ao criar usuário ${userData.email}:`, authError.message)
          continue
        }

        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            status: userData.status
          })

        if (profileError) {
          console.log(`⚠️ Erro ao criar perfil ${userData.email}:`, profileError.message)
        } else {
          console.log(`✅ Usuário ${userData.email} criado com sucesso`)
        }
        
      } catch (error) {
        console.log(`⚠️ Erro inesperado ao criar ${userData.email}:`, error.message)
      }
    }
    
    // Verificar usuários inseridos
    console.log('\n3. 🔍 Verificando usuários inseridos...')
    const { data: allUsers, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ Erro ao verificar usuários:', selectError.message)
    } else {
      console.log(`✅ Total de usuários na tabela: ${allUsers?.length || 0}`)
      
      if (allUsers && allUsers.length > 0) {
        console.log('\n📋 Usuários inseridos:')
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
        })
      }
    }
    
    console.log('\n✅ Usuários de teste inseridos!')
    console.log('\n📋 Resumo:')
    console.log(`   - Usuários inseridos: ${allUsers?.length || 0}`)
    console.log('   - Status: ✅ Pronto para teste na interface')
    
    console.log('\n🎯 Próximos passos:')
    console.log('   1. Acesse: http://localhost:3000/admin/usuarios?demo_email=admin@institutoimagine.org')
    console.log('   2. Verifique se os usuários aparecem na interface')
    console.log('   3. Teste as funcionalidades: criar, editar, excluir, ativar/desativar')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

insertTestUsers()
