#!/usr/bin/env node

/**
 * Script para testar autenticação no Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Debug - Variáveis encontradas:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Encontrada' : '❌ Não encontrada')
console.log('SUPABASE_KEY:', supabaseKey ? '✅ Encontrada' : '❌ Não encontrada')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Verifique se o arquivo .env.local existe e tem as variáveis corretas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🔐 Testando autenticação no Supabase...\n')

  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('✅ Conexão funcionando (usuário não logado)')
    } else {
      console.log('✅ Conexão funcionando (usuário logado)')
    }

    // 2. Testar signup
    console.log('\n2️⃣ Testando signup...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = '123456'
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message)
    } else {
      console.log('✅ Signup funcionando')
      console.log('   - Email:', signupData.user?.email)
      console.log('   - ID:', signupData.user?.id)
    }

    // 3. Testar login
    console.log('\n3️⃣ Testando login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message)
    } else {
      console.log('✅ Login funcionando')
      console.log('   - Email:', loginData.user?.email)
      console.log('   - ID:', loginData.user?.id)
    }

    // 4. Testar logout
    console.log('\n4️⃣ Testando logout...')
    const { error: logoutError } = await supabase.auth.signOut()
    
    if (logoutError) {
      console.log('❌ Erro no logout:', logoutError.message)
    } else {
      console.log('✅ Logout funcionando')
    }

    // 5. Verificar perfil
    console.log('\n5️⃣ Verificando perfil...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message)
    } else {
      console.log('✅ Perfil criado automaticamente')
      console.log('   - Nome:', profile.name)
      console.log('   - Role:', profile.role)
    }

    console.log('\n🎉 Teste de autenticação concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testAuth()
