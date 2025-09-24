#!/usr/bin/env node

/**
 * Script para testar sincronização de usuários entre interface e Supabase
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

async function testUsersSync() {
  console.log('🔄 Testando Sincronização de Usuários')
  console.log('====================================')
  
  try {
    // 1. Carregar perfis do Supabase (como a interface faz)
    console.log('\n1. 📥 Carregando perfis do Supabase...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Erro ao carregar perfis:', profilesError.message)
      return
    }

    console.log(`✅ Perfis carregados do Supabase: ${profiles?.length || 0}`)
    
    if (profiles && profiles.length > 0) {
      console.log('\n📋 Perfis no Supabase:')
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.email}) - ${profile.role}`)
      })
    }

    // 2. Transformar dados como a interface faz
    console.log('\n2. 🔄 Transformando dados para formato da interface...')
    const transformedUsers = profiles.map(profile => ({
      id: profile.id,
      email: profile.email || 'email@exemplo.com',
      name: profile.name || 'Usuário',
      role: profile.role || 'donor',
      status: 'active', // Status padrão já que a coluna não existe
      totalDonations: 0, // Será calculado separadamente
      donationsCount: 0, // Será calculado separadamente
      lastLogin: profile.last_login || new Date().toISOString().split('T')[0],
      createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }))
    
    console.log(`✅ Usuários transformados: ${transformedUsers.length}`)
    
    // 3. Mostrar dados transformados
    console.log('\n📋 Usuários transformados para interface:')
    transformedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
    })

    // 4. Testar filtros como a interface faz
    console.log('\n3. 🔍 Testando filtros...')
    
    // Filtro por role
    const donors = transformedUsers.filter(user => user.role === 'donor')
    const admins = transformedUsers.filter(user => user.role === 'admin')
    
    console.log(`   - Doadores: ${donors.length}`)
    console.log(`   - Administradores: ${admins.length}`)
    
    // Filtro por status
    const activeUsers = transformedUsers.filter(user => user.status === 'active')
    const inactiveUsers = transformedUsers.filter(user => user.status === 'inactive')
    
    console.log(`   - Ativos: ${activeUsers.length}`)
    console.log(`   - Inativos: ${inactiveUsers.length}`)
    
    // 5. Testar busca por nome/email
    console.log('\n4. 🔎 Testando busca...')
    const searchTerm = 'joao'
    const searchResults = transformedUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    console.log(`   - Busca por "${searchTerm}": ${searchResults.length} resultados`)
    if (searchResults.length > 0) {
      searchResults.forEach(user => {
        console.log(`     * ${user.name} (${user.email})`)
      })
    }

    // 6. Verificar se há problemas de sincronização
    console.log('\n5. ✅ Verificação de sincronização:')
    
    const expectedUsers = [
      'admin@institutoimagine.org',
      'ana@exemplo.com', 
      'pedro@exemplo.com',
      'maria@exemplo.com',
      'joao@exemplo.com'
    ]
    
    const actualEmails = transformedUsers.map(user => user.email)
    const missingUsers = expectedUsers.filter(email => !actualEmails.includes(email))
    const extraUsers = actualEmails.filter(email => !expectedUsers.includes(email))
    
    if (missingUsers.length === 0 && extraUsers.length === 0) {
      console.log('   ✅ Sincronização perfeita! Todos os usuários esperados estão presentes.')
    } else {
      if (missingUsers.length > 0) {
        console.log(`   ⚠️ Usuários faltando: ${missingUsers.join(', ')}`)
      }
      if (extraUsers.length > 0) {
        console.log(`   ⚠️ Usuários extras: ${extraUsers.join(', ')}`)
      }
    }
    
    console.log('\n🎯 Resumo da Sincronização:')
    console.log(`   - Total de usuários no Supabase: ${profiles?.length || 0}`)
    console.log(`   - Total de usuários transformados: ${transformedUsers.length}`)
    console.log(`   - Status: ${missingUsers.length === 0 && extraUsers.length === 0 ? '✅ Sincronizado' : '⚠️ Problemas encontrados'}`)
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

testUsersSync()
