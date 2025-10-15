'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import UnifiedLayout from './UnifiedLayout'
import { supabase } from '@/lib/supabase'

interface GlobalLayoutProps {
  children: ReactNode
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<'donor' | 'admin' | 'volunteer'>('donor')
  const [user, setUser] = useState<{
    name?: string
    email?: string
    role?: string
  } | null>(null)
  const [demoEmail, setDemoEmail] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)

    const detectUserRole = async () => {
      try {
        // 1) Priorizar usuário autenticado real
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Buscar role da tabela profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', user.id)
            .single()
          
          const role = profile?.role || (user.user_metadata as any)?.role || 'donor'
          const normalizedRole = role === 'admin' || role === 'volunteer' ? role : 'donor'
          setUserRole(normalizedRole)
          setUser({
            name: profile?.name || (user.user_metadata as any)?.name || user.email || 'Usuário',
            email: user.email || '',
            role: normalizedRole
          })
          // Não propagar demo quando há sessão real
          setDemoEmail(null)
          return
        }

        // 2) Sem sessão real: permitir modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const currentDemoEmail = urlParams.get('demo_email')
        const roleParam = urlParams.get('role')

        setDemoEmail(currentDemoEmail)

        if (currentDemoEmail === 'admin@institutoimagine.org') {
          setUserRole('admin')
          setUser({ name: 'Admin Demo', email: 'admin@institutoimagine.org', role: 'admin' })
          return
        }
        if (currentDemoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer') {
          setUserRole('volunteer')
          setUser({ name: 'Voluntário Demo', email: 'volunteer@institutoimagine.org', role: 'volunteer' })
          return
        }
        if (currentDemoEmail === 'demo@doador.com') {
          setUserRole('donor')
          setUser({ name: 'Doador Demo', email: 'demo@doador.com', role: 'donor' })
          return
        }

        // 3) Verificar localStorage (modo demo persistido)
        const demoUserData = localStorage.getItem('demo-user')
        if (demoUserData) {
          try {
            const userData = JSON.parse(demoUserData)
            if (userData.role === 'admin' || userData.role === 'volunteer' || userData.role === 'donor') {
              setUserRole(userData.role)
              setUser(userData)
              return
            }
          } catch (error) {
            console.log('Erro ao parsear demo-user:', error)
          }
        }

        // 4) Default
        setUserRole('donor')
        setUser({ name: 'Usuário', email: '', role: 'donor' })
      } catch (e) {
        // Em caso de erro, fallback para donor
        setUserRole('donor')
        setUser({ name: 'Usuário', email: '', role: 'donor' })
      }
    }

    detectUserRole()
  }, [])

  // Aguardar mount para evitar hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  // Páginas que NÃO devem ter sidebar (apenas wrapper simples)
  const noSidebarPaths = ['/auth', '/', '/admin', '/prototype/checkout', '/embed/checkout', '/doar']
  const shouldSkipSidebar = noSidebarPaths.some(path => 
    pathname === path || 
    (path !== '/auth' && path !== '/' && pathname.startsWith(path))
  )
  
  if (shouldSkipSidebar) {
    return <>{children}</>
  }

  // Usar UnifiedLayout para todas as outras páginas
  return (
    <UnifiedLayout
      variant={userRole}
      user={user || undefined}
      demoEmail={demoEmail}
    >
      {children}
    </UnifiedLayout>
  )
}