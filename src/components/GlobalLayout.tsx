'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import UnifiedLayout from './UnifiedLayout'
import { supabase } from '@/lib/supabase'
import { isInstitutionalPath } from '@/lib/imagine-site'

interface GlobalLayoutProps {
  children: ReactNode
}

const NO_SIDEBAR_PATHS = ['/auth', '/entrar', '/', '/admin', '/prototype/checkout', '/embed/checkout', '/doar']

function checkSkipSidebar(pathname: string | null): boolean {
  if (!pathname) return true
  if (isInstitutionalPath(pathname)) return true
  return NO_SIDEBAR_PATHS.some(
    (path) =>
      pathname === path ||
      (path !== '/auth' && path !== '/entrar' && path !== '/' && pathname.startsWith(path))
  )
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  const shouldSkipSidebar = checkSkipSidebar(pathname)

  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<'donor' | 'admin' | 'volunteer'>('donor')
  const [user, setUser] = useState<{
    name?: string
    email?: string
    role?: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    if (shouldSkipSidebar) return

    const detectUserRole = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', authUser.id)
            .single()

          const role = profile?.role || (authUser.user_metadata as any)?.role || 'donor'
          const normalizedRole = role === 'admin' || role === 'volunteer' ? role : 'donor'
          setUserRole(normalizedRole)
          setUser({
            name: profile?.name || (authUser.user_metadata as any)?.name || authUser.email || 'Usuário',
            email: authUser.email || '',
            role: normalizedRole,
          })
          return
        }

        setUserRole('donor')
        setUser({ name: 'Usuário', email: '', role: 'donor' })
      } catch {
        setUserRole('donor')
        setUser({ name: 'Usuário', email: '', role: 'donor' })
      }
    }

    detectUserRole()
  }, [shouldSkipSidebar])

  // Retornar diretamente nas rotas públicas/institucionais/login/admin/checkout sem desmontar na hidratação
  if (shouldSkipSidebar) {
    return <>{children}</>
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <UnifiedLayout
      variant={userRole}
      user={user || undefined}
      demoEmail={null}
    >
      {children}
    </UnifiedLayout>
  )
}
