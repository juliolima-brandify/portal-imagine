'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import VolunteerDashboard from '@/components/VolunteerDashboard'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('donor')
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDonations: 0,
    totalProjects: 0,
    totalProjectsSupported: 0
  })

  useEffect(() => {
    const getUser = async () => {
      try {
        // Primeiro, verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org' || demoEmail === 'volunteer@institutoimagine.org') {
          setUser({
            id: '00000000-0000-0000-0000-000000000001',
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
          
          if (demoEmail === 'admin@institutoimagine.org') {
            // Redirecionar admin para dashboard admin
            window.location.href = '/admin/dashboard'
            return
          } else if (demoEmail === 'volunteer@institutoimagine.org') {
            setUserRole('volunteer')
          } else {
            setUserRole('donor')
          }
          
          // Carregar dados reais do Supabase para demo
          try {
            await loadStats('00000000-0000-0000-0000-000000000001', userRole)
          } catch (error) {
            console.log('Erro ao carregar dados do Supabase para demo:', error)
          }
        } else {
          // Usuário real - autenticação com Supabase
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
              
              // Se for admin, redirecionar para dashboard admin
              if (profile?.role === 'admin') {
                window.location.href = '/admin/dashboard'
                return
              } else if (profile?.role === 'volunteer') {
                setUserRole('volunteer')
              } else {
                setUserRole('donor')
              }

              // Buscar estatísticas reais
              await loadStats(user.id, profile?.role || 'donor')
            } catch (error) {
              setUserRole('donor')
              await loadStats(user.id, 'donor')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const loadStats = async (userId: string, role: string) => {
    try {
      if (role === 'admin') {
        // Estatísticas para admin
        const [donationsResult, projectsResult] = await Promise.all([
          supabase.from('donations').select('amount'),
          supabase.from('projects').select('id')
        ])

        const totalDonated = donationsResult.data?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0
        const totalDonations = donationsResult.data?.length || 0
        const totalProjects = projectsResult.data?.length || 0

        setStats({
          totalDonated,
          totalDonations,
          totalProjects,
          totalProjectsSupported: 0
        })
      } else {
        // Estatísticas para doador
        const [donationsResult, projectsResult] = await Promise.all([
          supabase.from('donations').select('amount').eq('donor_id', userId),
          supabase.from('donations').select('project_id').eq('donor_id', userId)
        ])

        const totalDonated = donationsResult.data?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0
        const totalDonations = donationsResult.data?.length || 0
        const uniqueProjects = new Set(projectsResult.data?.map(d => d.project_id)).size

        setStats({
          totalDonated,
          totalDonations,
          totalProjects: 0,
          totalProjectsSupported: uniqueProjects
        })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

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
            Bem-vindo à sua página inicial. Aqui você pode gerenciar suas atividades e acompanhar o progresso.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="card p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {userRole === 'admin' ? formatCurrency(stats.totalDonated) : formatCurrency(stats.totalDonated)}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {userRole === 'admin' ? 'Total Arrecadado' : 'Total Doado'}
            </div>
          </div>
          <div className="card p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
              {userRole === 'admin' ? stats.totalDonations : stats.totalDonations}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {userRole === 'admin' ? 'Doações Recebidas' : 'Doações Realizadas'}
            </div>
          </div>
          <div className="card p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
              {userRole === 'admin' ? stats.totalProjects : stats.totalProjectsSupported}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {userRole === 'admin' ? 'Projetos Ativos' : 'Projetos Apoiados'}
            </div>
          </div>
          <div className="card p-4 md:p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
              {userRole === 'admin' ? '100%' : '100%'}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {userRole === 'admin' ? 'Transparência' : 'Impacto'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Link href="/projetos" className="card card-hover p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              {userRole === 'admin' ? 'Gerenciar Projetos' : 'Explorar Projetos'}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
              {userRole === 'admin'
                ? 'Crie, edite e gerencie todos os projetos da plataforma.'
                : 'Descubra novos projetos e veja o impacto das suas doações.'
              }
            </p>
            <span className="text-blue-600 text-xs md:text-sm font-medium">
              {userRole === 'admin' ? 'Gerenciar →' : 'Explorar →'}
            </span>
          </Link>

          <Link href="/doacoes" className="card card-hover p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              {userRole === 'admin' ? 'Ver Doações' : 'Minhas Doações'}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
              {userRole === 'admin'
                ? 'Visualize e gerencie todas as doações recebidas.'
                : 'Acompanhe o histórico das suas doações e seu impacto.'
              }
            </p>
            <span className="text-green-600 text-xs md:text-sm font-medium">
              {userRole === 'admin' ? 'Visualizar →' : 'Ver Histórico →'}
            </span>
          </Link>

          <Link href="/perfil" className="card card-hover p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              Meu Perfil
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
              Gerencie suas informações pessoais e preferências da conta.
            </p>
            <span className="text-purple-600 text-xs md:text-sm font-medium">
              Gerenciar →
            </span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Bem-vindo ao Portal Imagine
                </p>
                <p className="text-xs text-gray-500">
                  Você está logado e pronto para fazer a diferença
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Logado como: <span className="font-medium text-gray-900">{user.email}</span>
              </p>
              <p className="text-xs text-gray-500">
                Tipo: <span className="font-medium">
                  {userRole === 'admin' ? 'Administrador' : 
                   userRole === 'volunteer' ? 'Voluntário' : 'Doador'}
                </span>
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
  )
}