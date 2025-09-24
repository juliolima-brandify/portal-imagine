'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import VolunteerDashboard from '@/components/VolunteerDashboard'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'donor' | 'admin' | 'volunteer'>('donor')
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Verificar se é modo demo via URL
    const urlParams = new URLSearchParams(window.location.search)
    const demoEmail = urlParams.get('demo_email')
    const roleParam = urlParams.get('role')
    
    if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org' || demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer') {
      setIsDemoMode(true)
      setUser({
        id: 'demo-user',
        email: demoEmail || 'demo@doador.com',
        user_metadata: { 
          name: demoEmail === 'admin@institutoimagine.org' ? 'Admin Demo' : 
               demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer' ? 'Voluntário Demo' : 
               'Doador Demo' 
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User)
      setUserRole(demoEmail === 'admin@institutoimagine.org' ? 'admin' : 
                 demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer' ? 'volunteer' : 
                 'donor')
      setLoading(false)
      return
    }

    // Se não for demo, tentar autenticação real
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          // Verificar role do usuário
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (profile?.role === 'admin') {
              setUserRole('admin')
            } else if (profile?.role === 'volunteer') {
              setUserRole('volunteer')
            } else {
              setUserRole('donor')
            }
          } catch (error) {
            setUserRole('donor')
          }
        } else {
          // Se não conseguir obter usuário, definir como doador padrão para demo
          setUser({
            id: 'demo-user',
            email: 'demo@doador.com',
            user_metadata: { name: 'Doador Demo' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          setUserRole('donor')
          setIsDemoMode(true)
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        // Em caso de erro, definir como doador padrão
        setUser({
          id: 'demo-user',
          email: 'demo@doador.com',
          user_metadata: { name: 'Doador Demo' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
        setUserRole('donor')
        setIsDemoMode(true)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/auth'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

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
          <Link
            href="/auth"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  // Renderizar dashboard específico para voluntário
  if (userRole === 'volunteer') {
    return <VolunteerDashboard />
  }

  return (
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user?.user_metadata?.name || user?.email || 'Usuário'}! 👋
          </h1>
          <p className="text-gray-600">
            Bem-vindo ao seu dashboard. Aqui você pode gerenciar suas atividades e acompanhar o progresso.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {userRole === 'admin' ? 'R$ 2.5M' : 'R$ 1.2K'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Total Arrecadado' : 'Total Doado'}
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {userRole === 'admin' ? '1,247' : '12'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Doadores Ativos' : 'Doações Realizadas'}
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {userRole === 'admin' ? '23' : '5'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Projetos Ativos' : 'Projetos Apoiados'}
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {userRole === 'admin' ? '89%' : '3'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Taxa de Sucesso' : 'Meses de Apoio'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href={isDemoMode ? "/projetos?demo_email=" + encodeURIComponent(user.email || '') : "/projetos"} className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {userRole === 'admin' ? 'Gerenciar Projetos' : 'Explorar Projetos'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {userRole === 'admin' 
                ? 'Crie, edite e gerencie todos os projetos da plataforma.'
                : 'Descubra novos projetos e veja o impacto das suas doações.'
              }
            </p>
            <span className="text-blue-600 text-sm font-medium">
              {userRole === 'admin' ? 'Gerenciar →' : 'Explorar →'}
            </span>
          </Link>

          <Link href={isDemoMode ? "/doacoes?demo_email=" + encodeURIComponent(user.email || '') : "/doacoes"} className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {userRole === 'admin' ? 'Gerenciar Doações' : 'Minhas Doações'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {userRole === 'admin' 
                ? 'Acompanhe todas as doações e gerencie o fluxo financeiro.'
                : 'Veja o histórico das suas doações e acompanhe o progresso.'
              }
            </p>
            <span className="text-green-600 text-sm font-medium">
              {userRole === 'admin' ? 'Gerenciar →' : 'Ver Histórico →'}
            </span>
          </Link>

          <Link href={isDemoMode ? "/perfil?demo_email=" + encodeURIComponent(user.email || '') : "/perfil"} className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meu Perfil</h3>
            <p className="text-gray-600 text-sm mb-4">
              Gerencie suas informações pessoais e preferências de comunicação.
            </p>
            <span className="text-purple-600 text-sm font-medium">Gerenciar →</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {userRole === 'admin' 
                    ? 'Nova doação de R$ 500 recebida para o projeto Educação Infantil'
                    : 'Doação de R$ 100 realizada para o projeto Educação Infantil'
                  }
                </p>
                <p className="text-xs text-gray-500">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {userRole === 'admin' 
                    ? 'Projeto "Alimentação Escolar" atingiu 75% da meta'
                    : 'Projeto "Alimentação Escolar" atualizado com novo progresso'
                  }
                </p>
                <p className="text-xs text-gray-500">Há 1 dia</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {userRole === 'admin' 
                    ? 'Novo usuário cadastrado na plataforma'
                    : 'Perfil atualizado com sucesso'
                  }
                </p>
                <p className="text-xs text-gray-500">Há 3 dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}