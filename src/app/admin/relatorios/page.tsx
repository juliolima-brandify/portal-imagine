'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

import ExportDropdown from '@/components/ExportDropdown'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockReports = {
  overview: {
    totalDonations: 125000,
    totalDonors: 450,
    activeProjects: 12,
    completedProjects: 8,
    monthlyGrowth: 15.5,
    averageDonation: 278
  },
  monthlyData: [
    { month: 'Jan', donations: 15000, donors: 45, amount: 15000 },
    { month: 'Fev', donations: 18000, donors: 52, amount: 18000 },
    { month: 'Mar', donations: 22000, donors: 68, amount: 22000 },
    { month: 'Abr', donations: 19000, donors: 58, amount: 19000 },
    { month: 'Mai', donations: 25000, donors: 72, amount: 25000 },
    { month: 'Jun', donations: 28000, donors: 85, amount: 28000 }
  ],
  topProjects: [
    { id: '1', name: 'Educação Digital', amount: 45000, donors: 120, progress: 75 },
    { id: '2', name: 'Saúde Comunitária', amount: 32000, donors: 95, progress: 64 },
    { id: '3', name: 'Meio Ambiente', amount: 28000, donors: 78, progress: 56 },
    { id: '4', name: 'Esporte Social', amount: 20000, donors: 65, progress: 40 }
  ],
  donorSegments: [
    { segment: 'Novos Doadores', count: 120, percentage: 26.7 },
    { segment: 'Doadores Recorrentes', count: 180, percentage: 40.0 },
    { segment: 'Doadores VIP', count: 85, percentage: 18.9 },
    { segment: 'Doadores Inativos', count: 65, percentage: 14.4 }
  ],
  paymentMethods: [
    { method: 'PIX', count: 180, percentage: 40.0, amount: 50000 },
    { method: 'Cartão de Crédito', count: 150, percentage: 33.3, amount: 42000 },
    { method: 'Boleto', count: 120, percentage: 26.7, amount: 33000 }
  ],
  recentDonations: [
    { id: '1', donor: 'João Silva', amount: 150.00, project: 'Educação Digital', date: '2024-01-15' },
    { id: '2', donor: 'Maria Santos', amount: 75.50, project: 'Saúde Comunitária', date: '2024-01-14' },
    { id: '3', donor: 'Pedro Costa', amount: 200.00, project: 'Educação Digital', date: '2024-01-13' },
    { id: '4', donor: 'Ana Oliveira', amount: 100.00, project: 'Meio Ambiente', date: '2024-01-12' }
  ]
}

export default function AdminRelatoriosPage() {
  const [user, setUser] = useState<User | null>(null)
  // Loading removido
  const [reports, setReports] = useState(mockReports)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedReport, setSelectedReport] = useState<'overview' | 'donations' | 'projects' | 'donors'>('overview')

  useEffect(() => {
    const getUser = async () => {
      // Primeiro, verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
      console.log('🔍 [RELATÓRIOS] Verificando autenticação...')
      console.log('📧 Demo Email:', demoEmail)
      console.log('🌐 URL atual:', window.location.href)
      
      if (demoEmail === 'admin@institutoimagine.org') {
        console.log('✅ [RELATÓRIOS] Demo admin detectado, permitindo acesso')
        setUser({
          id: 'demo-admin',
          email: demoEmail,
          user_metadata: { name: 'Admin Demo' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
        // Loading removido
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
              console.log('❌ [RELATÓRIOS] Usuário não é admin, redirecionando para dashboard')
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
      // Loading removido
    }

    getUser()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Loading removido - página carrega diretamente

  // Verificação de autenticação removida - gerenciada pelo layout

  return (
    <div className="max-w-7xl mx-auto">
      {/* Main Content */}
      <main>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Relatórios e Análises
              </h1>
              <p className="text-gray-600">
                Visualize métricas, relatórios de impacto e dados financeiros com análises avançadas.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ExportDropdown 
                data={reports} 
                filename="relatorio_completo"
              />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Análise
              </label>
              <select
                className="input-modern w-full"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
              >
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último ano</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foco da Análise
              </label>
              <select
                className="input-modern w-full"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as any)}
              >
                <option value="overview">Visão Geral</option>
                <option value="donations">Análise de Doações</option>
                <option value="projects">Performance de Projetos</option>
                <option value="donors">Comportamento de Doadores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Métricas Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrency(reports.overview.totalDonations)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{reports.overview.monthlyGrowth}% vs mês anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Doadores</p>
                  <p className="text-2xl font-bold text-black">
                    {reports.overview.totalDonors}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-black">
                    {reports.overview.activeProjects}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Projetos Concluídos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reports.overview.completedProjects}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Doação Média</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(reports.overview.averageDonation)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analysis */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Análises Detalhadas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Arrecadação Mensal
                </h3>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                {reports.monthlyData.map((data, index) => (
                  <div key={data.month} className="flex items-center">
                    <div className="w-12 text-sm text-gray-600">{data.month}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(data.donations / Math.max(...reports.monthlyData.map(d => d.donations))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-900 text-right">
                      {formatCurrency(data.donations)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Projects */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Projetos com Maior Arrecadação
                </h3>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                {reports.topProjects.map((project, index) => (
                  <div key={project.name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.donors} doadores
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(project.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.progress}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Donor Analysis */}
        {selectedReport === 'donors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Segmentação de Doadores
              </h3>
              <div className="space-y-4">
                {reports.donorSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {segment.segment}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${segment.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {segment.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métodos de Pagamento
              </h3>
              <div className="space-y-4">
                {reports.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {method.method === 'PIX' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : method.method === 'Cartão de Crédito' ? (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {method.method}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {method.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        R$ {method.amount.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Donations */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Doações Recentes
            </h3>
            <button className="btn-secondary text-sm">
              Ver Todas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.recentDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {donation.donor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donation.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(donation.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
