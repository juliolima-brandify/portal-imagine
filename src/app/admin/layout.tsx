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
  const [adminName, setAdminName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          window.location.href = '/entrar'
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', authUser.id)
          .single()

        if (profileError || profile?.role !== 'admin') {
          window.location.href = '/dashboard'
          return
        }

        setUser(authUser)
        setAdminName(profile.name || authUser.user_metadata?.name || authUser.email || 'Admin')
      } catch (error) {
        console.error('Erro ao verificar permissão de administrador:', error)
        window.location.href = '/entrar'
      } finally {
        setLoading(false)
      }
    }

    verifyAdmin()
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
          <p className="text-gray-600 mb-6">Você precisa de permissão de administrador para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <UnifiedLayout
      variant="admin"
      user={{
        name: adminName,
        email: user.email || '',
        role: 'admin',
      }}
      demoEmail={null}
    >
      {children}
    </UnifiedLayout>
  )
})

export default AdminLayout
