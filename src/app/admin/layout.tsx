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
        // Primeiro, verificar se é modo demo via URL
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
        } else {
          // Usuário real - autenticação com Supabase
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUser(user)
          } else {
            window.location.href = '/auth'
            return
          }
        }
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

  return (
    <UnifiedLayout
      variant="admin"
      user={{
        name: user.user_metadata?.name || user.email || 'Admin',
        email: user.email || '',
        role: 'admin'
      }}
    >
      {children}
    </UnifiedLayout>
  )
})

export default AdminLayout