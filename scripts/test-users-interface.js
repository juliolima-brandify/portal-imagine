#!/usr/bin/env node

/**
 * Script para testar se a interface de usuários está carregando dados corretamente
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Usar ANON key como a interface

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUsersInterface() {
  console.log('🖥️ Testando Interface de Usuários')
  console.log('==================================')
  
  try {
    // Simular o que a interface faz
    console.log('\n1. 🔄 Simulando carregamento da interface...')
    
    // Carregar perfis dos usuários (como a interface faz)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ [USUÁRIOS] Erro ao carregar perfis:', profilesError)
      console.log('💡 [USUÁRIOS] Nenhum dado disponível - tabela vazia ou erro de conexão')
      return
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ [USUÁRIOS] Perfis carregados do Supabase:', profiles.length)
      
      // Transformar dados do Supabase para o formato esperado (como a interface faz)
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
      
      console.log('✅ [USUÁRIOS] Usuários transformados para interface:', transformedUsers.length)
      
      // Mostrar dados como apareceriam na interface
      console.log('\n📋 Usuários que apareceriam na interface:')
      transformedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Criado: ${user.createdAt}`)
        console.log(`      Último login: ${user.lastLogin}`)
        console.log(`      Doações: ${user.donationsCount} (R$ ${user.totalDonations.toFixed(2)})`)
        console.log('')
      })
      
    } else {
      console.log('⚠️ [USUÁRIOS] Nenhum perfil encontrado no Supabase')
      console.log('💡 [USUÁRIOS] A interface mostraria: "Nenhuma doação registrada"')
    }

    // Testar filtros como a interface faria
    console.log('\n2. 🔍 Testando filtros da interface...')
    
    if (profiles && profiles.length > 0) {
      const transformedUsers = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || 'email@exemplo.com',
        name: profile.name || 'Usuário',
        role: profile.role || 'donor',
        status: 'active',
        totalDonations: 0,
        donationsCount: 0,
        lastLogin: profile.last_login || new Date().toISOString().split('T')[0],
        createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
      
      // Filtro por status
      const activeUsers = transformedUsers.filter(user => user.status === 'active')
      const inactiveUsers = transformedUsers.filter(user => user.status === 'inactive')
      
      console.log(`   - Filtro "Ativos": ${activeUsers.length} usuários`)
      console.log(`   - Filtro "Inativos": ${inactiveUsers.length} usuários`)
      
      // Filtro por role
      const donors = transformedUsers.filter(user => user.role === 'donor')
      const admins = transformedUsers.filter(user => user.role === 'admin')
      
      console.log(`   - Filtro "Doadores": ${donors.length} usuários`)
      console.log(`   - Filtro "Administradores": ${admins.length} usuários`)
      
      // Busca por nome/email
      const searchTerm = 'joao'
      const searchResults = transformedUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      console.log(`   - Busca por "${searchTerm}": ${searchResults.length} resultados`)
    }

    console.log('\n✅ Teste da interface concluído!')
    
  } catch (error) {
    console.error('❌ [USUÁRIOS] Erro inesperado ao carregar usuários:', error)
  }
}

testUsersInterface()
