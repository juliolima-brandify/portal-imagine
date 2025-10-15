'use client'

import { memo, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import UnifiedLayout from '@/components/UnifiedLayout'
import type { User } from '@supabase/supabase-js'

const AdminLayout = memo(function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        // 1) Priorizar usuário autenticado real
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          setLoading(false)
          return
        }

        // 2) Sem sessão real: permitir admin demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        if (demoEmail === 'admin@institutoimagine.org') {
          setUser({
            id: 'demo-admin',
            email: demoEmail,
            user_metadata: { name: 'Admin Demo' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          setLoading(false)
          return
        }

        // 3) Sem sessão e sem demo
        console.log('Usuário não encontrado, redirecionando para /auth')
        window.location.href = '/auth'
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        window.location.href = '/auth'
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Se houver usuário autenticado real, não propagar demoEmail
  const demoEmailProp = (() => {
    if (user) return null
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('demo_email')
    }
    return null
  })()

  return (
    <UnifiedLayout
      variant="admin"
      user={{
        name: user.user_metadata?.name || user.email || 'Admin',
        email: user.email || '',
        role: 'admin'
      }}
      demoEmail={demoEmailProp}
    >
      {children}
    </UnifiedLayout>
  )
})

export default AdminLayout