// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivakbchrkalimxgyfmda.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCreateUser() {
  console.log('🧪 Testando criação de usuário...')
  
  const testUser = {
    email: 'teste@exemplo.com',
    password: '123456',
    name: 'Usuário Teste',
    role: 'donor'
  }
  
  try {
    // 1. Criar usuário no Auth
    console.log('🔄 Criando usuário no Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError)
      return
    }
    
    console.log('✅ Usuário criado no Auth:', authData.user.id)
    
    // 2. Criar perfil
    console.log('🔄 Criando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      })
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)
      // Limpar usuário do Auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }
    
    console.log('✅ Perfil criado com sucesso')
    
    // 3. Verificar se foi criado
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar perfil:', fetchError)
    } else {
      console.log('✅ Perfil encontrado:', profile)
    }
    
    // 4. Limpar teste
    console.log('🔄 Limpando dados de teste...')
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.log('✅ Teste concluído com sucesso')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

testCreateUser()
