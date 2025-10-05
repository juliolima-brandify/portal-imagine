#!/usr/bin/env node

/**
 * Script para criar o primeiro administrador do sistema
 * Execute após o deploy em produção
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

async function createFirstAdmin() {
  console.log('🚀 Criando primeiro administrador do sistema...')
  
  // Dados do primeiro admin
  const adminData = {
    email: 'admin@institutoimagine.org',
    password: 'AdminImagine2024!',
    name: 'Administrador Instituto Imagine',
    role: 'admin'
  }
  
  try {
    console.log('📧 Criando usuário no Supabase Auth...')
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        name: adminData.name
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message)
      return false
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id)

    // Criar perfil com role admin
    console.log('👤 Criando perfil de administrador...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        name: adminData.name,
        role: 'admin'
      })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message)
      // Tentar limpar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
      return false
    }

    console.log('✅ Perfil de administrador criado com sucesso!')
    
    console.log('\n🎉 PRIMEIRO ADMIN CRIADO COM SUCESSO!')
    console.log('📧 Email:', adminData.email)
    console.log('🔑 Senha:', adminData.password)
    console.log('🌐 URL Admin:', 'https://portal.imagineinstituto.com/admin/dashboard')
    
    console.log('\n⚠️  IMPORTANTE:')
    console.log('1. Faça login com essas credenciais')
    console.log('2. Altere a senha imediatamente')
    console.log('3. Crie outros administradores se necessário')
    console.log('4. Delete este script após o uso por segurança')
    
    return true

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    return false
  }
}

async function checkExistingAdmins() {
  console.log('🔍 Verificando administradores existentes...')
  
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('role', 'admin')

    if (error) {
      console.error('❌ Erro ao verificar admins:', error.message)
      return false
    }

    if (admins && admins.length > 0) {
      console.log(`✅ ${admins.length} administrador(es) encontrado(s):`)
      admins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`)
      })
      return true
    } else {
      console.log('⚠️  Nenhum administrador encontrado')
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao verificar admins:', error.message)
    return false
  }
}

async function main() {
  console.log('🎯 SETUP DO PRIMEIRO ADMINISTRADOR')
  console.log('=====================================\n')

  // Verificar se já existem admins
  const hasAdmins = await checkExistingAdmins()
  
  if (hasAdmins) {
    console.log('\n❓ Já existem administradores no sistema.')
    console.log('Deseja mesmo criar um novo administrador?')
    console.log('Pressione Ctrl+C para cancelar ou Enter para continuar...')
    
    // Aguardar input do usuário
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve())
    })
  }

  const success = await createFirstAdmin()
  
  if (success) {
    console.log('\n✅ Setup concluído com sucesso!')
    process.exit(0)
  } else {
    console.log('\n❌ Falha no setup do administrador')
    process.exit(1)
  }
}

// Executar script
main().catch(console.error)
