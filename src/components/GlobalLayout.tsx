'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import UnifiedLayout from './UnifiedLayout'

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

    // Detectar role do usuário
    const detectUserRole = () => {
      // 1. Verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const currentDemoEmail = urlParams.get('demo_email')
      const roleParam = urlParams.get('role')
      
      // Salvar demoEmail para passar para o sidebar
      setDemoEmail(currentDemoEmail)
      
      if (currentDemoEmail === 'admin@institutoimagine.org') {
        setUserRole('admin')
        setUser({
          name: 'Admin Demo',
          email: 'admin@institutoimagine.org',
          role: 'admin'
        })
        return
      }
      
      if (currentDemoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer') {
        setUserRole('volunteer')
        setUser({
          name: 'Voluntário Demo',
          email: 'volunteer@institutoimagine.org',
          role: 'volunteer'
        })
        return
      }
      
      if (currentDemoEmail === 'demo@doador.com') {
        setUserRole('donor')
        setUser({
          name: 'Doador Demo',
          email: 'demo@doador.com',
          role: 'donor'
        })
        return
      }

      // 2. Verificar localStorage para dados de demo
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

      // 3. Default para donor se não conseguir detectar
      setUserRole('donor')
      setUser({
        name: 'Usuário',
        email: '',
        role: 'donor'
      })
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

  // Páginas que NÃO devem ter sidebar
  const noSidebarPaths = ['/auth', '/']
  
  // Se for página de login, home ou admin, não mostrar sidebar
  if (pathname === '/auth' || pathname === '/' || pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
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