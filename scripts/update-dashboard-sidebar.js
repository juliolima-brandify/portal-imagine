#!/usr/bin/env node

/**
 * Script para atualizar o dashboard para usar o sidebar
 */

const fs = require('fs')
const path = require('path')

const dashboardFilePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx')

console.log('🔧 Atualizando dashboard para usar sidebar...')

try {
  // Ler o arquivo atual
  let content = fs.readFileSync(dashboardFilePath, 'utf8')
  
  // 1. Atualizar imports
  const oldImports = `import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import NotificationBell from '@/components/NotificationBell'`
  
  const newImports = `import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import VolunteerDashboard from '@/components/VolunteerDashboard'`
  
  content = content.replace(oldImports, newImports)
  
  // 2. Atualizar userRole para incluir volunteer
  const oldUserRole = `  const [userRole, setUserRole] = useState<'donor' | 'admin'>('donor')`
  const newUserRole = `  const [userRole, setUserRole] = useState<'donor' | 'admin' | 'volunteer'>('donor')`
  
  content = content.replace(oldUserRole, newUserRole)
  
  // 3. Atualizar lógica de detecção de role
  const oldRoleLogic = `        if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org') {
          setIsDemoMode(true)
          setUser({
            id: 'demo-user',
            email: demoEmail,
            user_metadata: { name: demoEmail === 'admin@institutoimagine.org' ? 'Admin Demo' : 'Doador Demo' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          setUserRole(demoEmail === 'admin@institutoimagine.org' ? 'admin' : 'donor')
          setLoading(false)
          return
        }`
  
  const newRoleLogic = `        if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org' || demoEmail === 'volunteer@institutoimagine.org') {
          setIsDemoMode(true)
          setUser({
            id: 'demo-user',
            email: demoEmail,
            user_metadata: { 
              name: demoEmail === 'admin@institutoimagine.org' ? 'Admin Demo' : 
                   demoEmail === 'volunteer@institutoimagine.org' ? 'Voluntário Demo' : 
                   'Doador Demo' 
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          setUserRole(demoEmail === 'admin@institutoimagine.org' ? 'admin' : 
                     demoEmail === 'volunteer@institutoimagine.org' ? 'volunteer' : 
                     'donor')
          setLoading(false)
          return
        }`
  
  content = content.replace(oldRoleLogic, newRoleLogic)
  
  // 4. Atualizar o return para usar LayoutWithSidebar
  const oldReturn = `  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onSignOut={handleSignOut}
        isDemoMode={isDemoMode}
      />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user?.user_metadata?.name || user?.email || 'Usuário'}! 👋
            </h1>
            <p className="text-gray-600">
              Bem-vindo ao seu dashboard. Aqui você pode gerenciar suas atividades e acompanhar o progresso.
            </p>
          </div>`
  
  const newReturn = `  // Renderizar dashboard específico para voluntário
  if (userRole === 'volunteer') {
    return (
      <LayoutWithSidebar userRole={userRole} isDemoMode={isDemoMode}>
        <VolunteerDashboard />
      </LayoutWithSidebar>
    )
  }

  return (
    <LayoutWithSidebar userRole={userRole} isDemoMode={isDemoMode}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user?.user_metadata?.name || user?.email || 'Usuário'}! 👋
          </h1>
          <p className="text-gray-600">
            Bem-vindo ao seu dashboard. Aqui você pode gerenciar suas atividades e acompanhar o progresso.
          </p>
        </div>`
  
  content = content.replace(oldReturn, newReturn)
  
  // 5. Atualizar o fechamento do return
  const oldClosing = `        </div>
      </main>
    </div>
  )`
  
  const newClosing = `        </div>
    </LayoutWithSidebar>
  )`
  
  content = content.replace(oldClosing, newClosing)
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(dashboardFilePath, content, 'utf8')
  
  console.log('✅ Dashboard atualizado com sidebar!')
  console.log('🎯 Agora o dashboard usa:')
  console.log('   - LayoutWithSidebar para estrutura')
  console.log('   - Sidebar responsivo e minimalista')
  console.log('   - VolunteerDashboard para voluntários')
  console.log('   - Suporte a 3 tipos de usuário')
  
} catch (error) {
  console.error('❌ Erro ao atualizar dashboard:', error.message)
  process.exit(1)
}
