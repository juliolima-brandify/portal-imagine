'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProjects, getDonations } from '@/lib/database'

import ExportDropdown from '@/components/ExportDropdown'
import DonationTrendChart from '@/components/DonationTrendChart'
import DateRangePickerWithPresets, { PresetId } from '@/components/DateRangePicker'
import type { User } from '@supabase/supabase-js'

// Estrutura para dados reais
const initialReports = {
  overview: {
    totalDonations: 0,
    totalDonors: 0,
    activeProjects: 0,
    completedProjects: 0,
    monthlyGrowth: 0,
    averageDonation: 0,
    totalVolunteers: 0
  },
  monthlyData: [] as any[],
  topProjects: [] as any[],
  donorSegments: [] as any[],
  paymentMethods: [] as any[],
  recentDonations: [] as any[]
}

export default function AdminRelatoriosPage() {
  const [user, setUser] = useState<User | null>(null)
  // Loading removido
  const [reports, setReports] = useState(initialReports)
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined)
  const [presetId, setPresetId] = useState<string>('custom')
  const [selectedReport, setSelectedReport] = useState<'overview' | 'donations' | 'projects' | 'donors'>('overview')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [topDonors, setTopDonors] = useState<any[]>([])
  const chartImageRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Verificar se é modo demo via URL
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
            // Se não conseguir obter usuário, redirecionar para login
            window.location.href = '/auth'
            return
          }
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        // Não redirecionar automaticamente, deixar o layout admin lidar com isso
      }
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

  // Carregar dados dinâmicos do banco
  useEffect(() => {
    const loadReports = async () => {
      try {
        const [projectsData, donations] = await Promise.all([
          getProjects(),
          getDonations()
        ])
        // Contar voluntários (profiles.role = 'volunteer')
        let totalVolunteers = 0
        try {
          const { data: vols } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('role', 'volunteer')
          totalVolunteers = vols?.length || 0
        } catch (e) {
          totalVolunteers = 0
        }


        setProjects(projectsData)

        // Determinar intervalo de datas conforme período
        const startDate = dateStart
        const endDate = dateEnd || new Date()

        // Filtrar por projeto e data
        let filteredDonations = selectedProjectId === 'all'
          ? donations
          : donations.filter((d: any) => d.project_id === selectedProjectId)
        if (startDate) {
          filteredDonations = filteredDonations.filter((d: any) => new Date(d.created_at) >= startDate!)
        }
        if (endDate) {
          filteredDonations = filteredDonations.filter((d: any) => new Date(d.created_at) <= endDate!)
        }

        const activeProjects = projectsData.filter((p: any) => p.status === 'active')
        const completedProjects = projectsData.filter((p: any) => p.status === 'completed')
        const completedDonations = filteredDonations.filter((d: any) => d.status === 'completed')

        const totalDonations = completedDonations.reduce((sum: number, d: any) => sum + d.amount, 0)
        const totalDonors = new Set(completedDonations.map((d: any) => d.user_id).filter(Boolean)).size
        const avgDonation = completedDonations.length > 0 ? totalDonations / completedDonations.length : 0

        // Dados do período para o gráfico
        // Preenchimento de lacunas conforme intervalo
        const fillHours = () => Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2,'0')}h`)
        const fillDays = () => {
          const labels: string[] = []
          const cur = new Date(startDate || new Date())
          cur.setHours(0,0,0,0)
          const last = new Date(endDate)
          last.setHours(23,59,59,999)
          while (cur <= last) {
            labels.push(`${String(cur.getDate()).padStart(2,'0')}/${String(cur.getMonth()+1).padStart(2,'0')}`)
            cur.setDate(cur.getDate()+1)
          }
          return labels
        }
        const fillMonths = () => {
          const s = startDate || new Date()
          const labels: string[] = []
          const cur = new Date(s.getFullYear(), s.getMonth(), 1)
          const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
          while (cur <= last) {
            labels.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`)
            cur.setMonth(cur.getMonth()+1)
          }
          return labels
        }

        // Determinar granularidade baseado no intervalo
        const diffDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30
        
        let labels: string[] = []
        if (diffDays <= 1) {
          // 1 dia ou menos: por hora
          labels = fillHours()
        } else if (diffDays > 90) {
          // Mais de 90 dias: por mês
          labels = fillMonths()
        } else {
          // Entre 2 e 90 dias: por dia
          labels = fillDays()
        }

        const buckets = new Map<string, number>(labels.map(l => [l, 0]))
        completedDonations.forEach((d: any) => {
          const dt = new Date(d.created_at)
          if (dt < (startDate || new Date()) || dt > endDate) return
          let key = ''
          if (diffDays <= 1) {
            key = `${String(dt.getHours()).padStart(2,'0')}h`
          } else if (diffDays > 90) {
            key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
          } else {
            key = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
          }
          buckets.set(key, (buckets.get(key) || 0) + d.amount)
        })
        const monthlyData = labels.map(label => ({ 
          month: diffDays > 90 ? label.split('-').reverse().join('/') : label, 
          donations: buckets.get(label) || 0 
        }))

        // Top projects
        const byProject = new Map<string, { amount: number, donors: Set<string> }>()
        completedDonations.forEach((d: any) => {
          const key = d.project_id
          if (!byProject.has(key)) byProject.set(key, { amount: 0, donors: new Set() })
          const agg = byProject.get(key)!
          agg.amount += d.amount
          if (d.user_id) agg.donors.add(d.user_id)
        })
        const topProjects = projectsData
          .map((p: any) => {
            const agg = byProject.get(p.id)
            const amount = agg?.amount || 0
            const donors = agg ? agg.donors.size : 0
            const progress = p.target_amount ? Math.round(Math.min((p.current_amount / p.target_amount) * 100, 100)) : 0
            return { name: p.title, amount, donors, progress }
          })
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(5)

        // Top Doadores (com perfil quando disponível)
        const byDonor = new Map<string, { amount: number, count: number }>()
        completedDonations.forEach((d: any) => {
          const key = d.user_id || `anon-${d.id}`
          if (!byDonor.has(key)) byDonor.set(key, { amount: 0, count: 0 })
          const agg = byDonor.get(key)!
          agg.amount += d.amount
          agg.count += 1
        })
        const donorsArray = Array.from(byDonor.entries())
          .map(([userId, info]) => ({ userId, ...(info as any) }))
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(0, 5)
        setTopDonors(donorsArray)

        setReports({
          overview: {
            totalDonations,
            totalDonors,
            activeProjects: activeProjects.length,
            completedProjects: completedProjects.length,
            monthlyGrowth: 0,
            averageDonation: avgDonation,
            totalVolunteers
          },
          monthlyData,
          topProjects,
          donorSegments: [],
          paymentMethods: [],
          recentDonations: completedDonations.slice(0, 10).map(d => ({
            id: d.id,
            donor: d.anonymous ? 'Anônimo' : (d.user_id || 'Usuário'),
            project: d.project_id,
            amount: d.amount,
            date: d.created_at
          }))
        })
      } catch (e) {
        // Mantém estado inicial silenciosamente
      }
    }

    loadReports()
  }, [selectedProjectId, dateStart, dateEnd, presetId])

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
                data={{ ...reports, __chartImage: chartImageRef.current, __chartCaption: (dateStart && dateEnd) ? `Período: ${new Date(dateStart).toLocaleDateString('pt-BR')} – ${new Date(dateEnd).toLocaleDateString('pt-BR')}` : undefined }} 
                filename="relatorio_completo"
              />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Período de Análise</label>
              <DateRangePickerWithPresets
                start={dateStart ?? undefined}
                end={dateEnd ?? undefined}
                onChange={({ start, end, presetId }) => {
                  setDateStart(start)
                  setDateEnd(end)
                  setPresetId(presetId)
                }}
              />
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
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Projeto
              </label>
              <select
                className="input-modern w-full"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="all">Todos os Projetos</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Voluntários</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reports.overview.totalVolunteers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                  Evolução de Arrecadação
                </h3>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <DonationTrendChart
                labels={reports.monthlyData.map(d => d.month)}
                values={reports.monthlyData.map(d => d.donations)}
                title="Evolução de Arrecadação"
                onChartReady={(getter) => { chartImageRef.current = getter?.() }}
              />
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

        {/* Top Doadores */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Doadores</h3>
          </div>
          {topDonors.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum doador encontrado</p>
          ) : (
            <div className="space-y-3">
              {topDonors.map((d, idx) => (
                <div key={d.userId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.userId)}`} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.userId.startsWith('anon-') ? 'Anônimo' : d.userId}</div>
                      <div className="text-xs text-gray-500">{d.count} doações</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">R$ {d.amount.toLocaleString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

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
