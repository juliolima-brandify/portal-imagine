'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockProjects = [
  {
    id: '1',
    name: 'Educação Infantil',
    description: 'Projeto focado em melhorar a educação de crianças de 3 a 6 anos em comunidades carentes.',
    status: 'active',
    targetAmount: 50000,
    currentAmount: 32500,
    donors: 45,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    category: 'Educação',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center'
  },
  {
    id: '2',
    name: 'Alimentação Escolar',
    description: 'Fornecimento de refeições nutritivas para crianças em escolas públicas.',
    status: 'active',
    targetAmount: 30000,
    currentAmount: 18750,
    donors: 32,
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    category: 'Alimentação',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center'
  },
  {
    id: '3',
    name: 'Construção de Biblioteca',
    description: 'Construção de uma biblioteca comunitária com acervo de livros educativos.',
    status: 'planning',
    targetAmount: 80000,
    currentAmount: 0,
    donors: 0,
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    category: 'Infraestrutura',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center'
  },
  {
    id: '4',
    name: 'Capacitação de Professores',
    description: 'Programa de capacitação para professores da rede pública.',
    status: 'completed',
    targetAmount: 25000,
    currentAmount: 25000,
    donors: 28,
    startDate: '2023-09-01',
    endDate: '2023-12-31',
    category: 'Educação',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center'
  }
]

export default function AdminProjetosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState(mockProjects)
  const [filter, setFilter] = useState<'all' | 'active' | 'planning' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const getUser = async () => {
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
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Verificar se é admin
        if (user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (profile?.role !== 'admin') {
              window.location.href = '/dashboard'
              return
            }
          } catch (profileError) {
            // Se não conseguir buscar o perfil, assumir que não é admin
            console.log('Erro ao buscar perfil:', profileError)
            window.location.href = '/dashboard'
            return
          }
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'planning':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'planning':
        return 'Planejamento'
      case 'completed':
        return 'Concluído'
      default:
        return 'Desconhecido'
    }
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
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
          <p className="mb-4 text-gray-600">Você precisa estar logado para acessar esta página.</p>
          <Link href="/auth" className="btn-primary">
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user ? {
          id: user.id,
          name: user.user_metadata?.name,
          email: user.email,
          role: 'admin'
        } : undefined}
        onSignOut={() => {
          // Redirecionar para auth
          window.location.href = '/auth'
        }}
        showAuth={false}
        showBackToMain={true}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gerenciar Projetos
              </h1>
              <p className="text-gray-600">
                Crie, edite e acompanhe o progresso dos projetos do Instituto.
              </p>
            </div>
            <button className="btn-primary">
              Novo Projeto
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {projects.length}
            </div>
            <div className="text-sm text-gray-600">
              Total de Projetos
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">
              Projetos Ativos
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(projects.reduce((sum, p) => sum + p.currentAmount, 0))}
            </div>
            <div className="text-sm text-gray-600">
              Total Arrecadado
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {projects.reduce((sum, p) => sum + p.donors, 0)}
            </div>
            <div className="text-sm text-gray-600">
              Total de Doadores
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar projetos..."
                className="input-modern"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilter('planning')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'planning' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Planejamento
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Concluídos
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum projeto encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Crie seu primeiro projeto para começar.'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="card card-hover p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  <span className="text-xs text-gray-500">{project.category}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{getProgressPercentage(project.currentAmount, project.targetAmount).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(project.currentAmount, project.targetAmount)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Arrecadado:</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(project.currentAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Meta:</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(project.targetAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Doadores:</span>
                    <p className="font-semibold text-gray-900">{project.donors}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Prazo:</span>
                    <p className="font-semibold text-gray-900">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 text-sm">
                    Editar
                  </button>
                  <button className="btn-accent flex-1 text-sm">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
