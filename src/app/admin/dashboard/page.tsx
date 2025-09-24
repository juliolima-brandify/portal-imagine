'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDonated: 0,
    totalDonations: 0,
    totalUsers: 0
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Carregar estatísticas reais do Supabase
        const [projectsResult, donationsResult, usersResult] = await Promise.all([
          supabase.from('projects').select('id, created_at').eq('status', 'active'),
          supabase.from('donations').select('amount, created_at, donor_id, project_id').eq('status', 'completed'),
          supabase.from('profiles').select('id')
        ])

        const totalProjects = projectsResult.data?.length || 0
        const totalDonated = donationsResult.data?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0
        const totalDonations = donationsResult.data?.length || 0
        const totalUsers = usersResult.data?.length || 0

        setStats({
          totalProjects,
          totalDonated,
          totalDonations,
          totalUsers
        })

        // Carregar projetos recentes
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5)
        
        setRecentProjects(projects || [])

        // Carregar doações recentes
        const { data: donations } = await supabase
          .from('donations')
          .select(`
            id, amount, created_at, status,
            profiles!donations_donor_id_fkey(name),
            projects!donations_project_id_fkey(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
        
        setRecentDonations(donations || [])

      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Admin
        </h1>
        <p className="text-gray-600">
          Visão geral do sistema e métricas principais.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalProjects}
          </div>
          <div className="text-sm text-gray-600">
            Projetos Ativos
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-600 mb-1">
            {formatCurrency(stats.totalDonated)}
          </div>
          <div className="text-sm text-gray-600">
            Total Arrecadado
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-700 mb-1">
            {stats.totalDonations}
          </div>
          <div className="text-sm text-gray-600">
            Doações
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-500 mb-1">
            {stats.totalUsers}
          </div>
          <div className="text-sm text-gray-600">
            Usuários
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Projetos Recentes
          </h3>
          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-500">
                      Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhum projeto encontrado</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Doações Recentes
          </h3>
          <div className="space-y-3">
            {recentDonations.length > 0 ? (
              recentDonations.map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(donation.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {donation.profiles?.name || 'Anônimo'} - {donation.projects?.title || 'Projeto'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(donation.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhuma doação encontrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
