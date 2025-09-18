'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'donor' | 'admin'>('donor')
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      // Timeout de segurança para evitar loading infinito
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false)
          console.error('Timeout ao carregar dashboard')
        }
      }, 10000) // 10 segundos

      try {
        // Primeiro, verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org') {
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
          clearTimeout(timeoutId)
          return
        }

        // Se não for demo, tentar com Supabase com timeout
        try {
          const getUserPromise = supabase.auth.getUser()
          const { data: { user }, error } = await Promise.race([
            getUserPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao obter usuário')), 8000)
            )
          ]) as any

          if (error) throw error
          setUser(user)
          
          // Buscar role do usuário na tabela profiles
          if (user) {
            try {
              const profilePromise = supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
              
              const { data: profile } = await Promise.race([
                profilePromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 5000)
                )
              ]) as any
              
              if (profile) {
                setUserRole(profile.role as 'donor' | 'admin')
              } else {
                // Se não encontrar perfil, criar um como doador
                await supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || 'Usuário',
                    role: 'donor'
                  })
                setUserRole('donor')
              }
            } catch (profileError) {
              console.log('Erro ao buscar/criar perfil:', profileError)
              setUserRole('donor') // Default para doador
            }
          }
        } catch (error) {
          // Se houver erro, não definir usuário (vai mostrar acesso negado)
          console.log('Erro ao obter usuário:', error)
        }
      } finally {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getUser()

    // Só configurar listener do Supabase se não for modo demo
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.get('demo_email')) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          if (session?.user) {
            // Buscar role do usuário na tabela profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single()
            
            if (profile) {
              setUserRole(profile.role as 'donor' | 'admin')
            } else {
              setUserRole('donor')
            }
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    if (isDemoMode) {
      window.location.href = '/'
    } else {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Acesso Negado</h1>
          <p className="mb-4 text-gray-600">Você precisa estar logado para acessar o dashboard.</p>
          <Link
            href="/auth"
            className="btn-primary"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={{
          id: user?.id,
          name: user?.user_metadata?.name,
          email: user?.email,
          role: userRole
        }}
        onSignOut={handleSignOut}
        isDemoMode={isDemoMode}
        showAuth={false}
        showBackToMain={false}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao seu Dashboard!
          </h1>
          <p className="text-gray-600">
            {userRole === 'admin' 
              ? 'Gerencie projetos, usuários e acompanhe o impacto do Instituto Imagine.'
              : 'Acompanhe suas doações, veja o impacto que você está causando e descubra novos projetos.'
            }
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
              {userRole === 'admin' ? '50+' : '3'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Projetos Ativos' : 'Projetos Apoiados'}
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {userRole === 'admin' ? '5.000+' : '15'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Vidas Transformadas' : 'Vidas Impactadas'}
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {userRole === 'admin' ? '1.200+' : '12'}
            </div>
            <div className="text-sm text-gray-600">
              {userRole === 'admin' ? 'Doadores Ativos' : 'Doações Realizadas'}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRole === 'donor' ? (
            <>
              <Link href={isDemoMode ? "/projetos?demo_email=demo@doador.com" : "/projetos"} className="card card-hover p-6 animate-scale-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ver Projetos</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Descubra novos projetos e faça doações para causas que você se identifica.
                </p>
                <span className="text-gray-700 text-sm font-medium">Explorar →</span>
              </Link>

              <Link href={isDemoMode ? "/doacoes?demo_email=demo@doador.com" : "/doacoes"} className="card card-hover p-6 animate-scale-in" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Minhas Doações</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Acompanhe o histórico de suas doações e o impacto que você está causando.
                </p>
                <span className="text-green-600 text-sm font-medium">Ver Histórico →</span>
              </Link>

              <Link href={isDemoMode ? "/historico?demo_email=demo@doador.com" : "/historico"} className="card card-hover p-6 animate-scale-in" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Histórico Detalhado</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Análise avançada com filtros, relatórios e exportação de dados.
                </p>
                <span className="text-purple-600 text-sm font-medium">Ver Histórico →</span>
              </Link>

              <Link href={isDemoMode ? "/perfil?demo_email=demo@doador.com" : "/perfil"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Meu Perfil</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Gerencie suas informações pessoais e preferências de comunicação.
                </p>
                <span className="text-blue-600 text-sm font-medium">Gerenciar →</span>
              </Link>

              <Link href={isDemoMode ? "/comunidade?demo_email=demo@doador.com" : "/comunidade"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Comunidade WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Conecte-se com outros doadores e acompanhe o progresso dos projetos.
                </p>
                <span className="text-green-600 text-sm font-medium">Participar →</span>
              </Link>
            </>
          ) : (
            <>
              <Link href={isDemoMode ? "/admin/projetos?demo_email=admin@institutoimagine.org" : "/admin/projetos"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerenciar Projetos</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Crie, edite e acompanhe o progresso dos projetos do Instituto.
                </p>
                <span className="text-gray-700 text-sm font-medium">Gerenciar →</span>
              </Link>

              <Link href={isDemoMode ? "/admin/usuarios?demo_email=admin@institutoimagine.org" : "/admin/usuarios"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuários</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Gerencie usuários, permissões e acompanhe a atividade da plataforma.
                </p>
                <span className="text-blue-600 text-sm font-medium">Gerenciar →</span>
              </Link>

              <Link href={isDemoMode ? "/admin/relatorios?demo_email=admin@institutoimagine.org" : "/admin/relatorios"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatórios</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Visualize métricas, relatórios de impacto e dados financeiros.
                </p>
                <span className="text-green-600 text-sm font-medium">Ver Relatórios →</span>
              </Link>

<Link href={isDemoMode ? "/admin/doacoes?demo_email=admin@institutoimagine.org" : "/admin/doacoes"} className="card card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Doações</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Gerencie e acompanhe todas as doações recebidas.
                </p>
                <span className="text-purple-600 text-sm font-medium">Gerenciar →</span>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
