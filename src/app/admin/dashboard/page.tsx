'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import DonationTrendChart from '@/components/DonationTrendChart'
import DateRangePickerWithPresets, { PresetId } from '@/components/DateRangePicker'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDonated: 0,
    totalDonations: 0,
    totalUsers: 0
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [topDonors, setTopDonors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] })
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined)
  const [presetId, setPresetId] = useState<PresetId>('custom')

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

        // Top Donors (últimos 90 dias)
        const since = new Date()
        since.setDate(since.getDate() - 90)
        const { data: donorsData } = await supabase
          .from('donations')
          .select('amount, donor_id, created_at, status')
          .gte('created_at', since.toISOString())
          .eq('status', 'completed')

        const byDonor = new Map<string, { amount: number, count: number }>()
        ;(donorsData || []).forEach(d => {
          const key = d.donor_id || 'anon'
          if (!byDonor.has(key)) byDonor.set(key, { amount: 0, count: 0 })
          const agg = byDonor.get(key)!
          agg.amount += d.amount || 0
          agg.count += 1
        })
        const ranking = Array.from(byDonor.entries())
          .map(([id, info]) => ({ id, ...info }))
          .sort((a,b) => b.amount - a.amount)
          .slice(0, 5)
        setTopDonors(ranking)

        // Evolução conforme intervalo (preenchendo lacunas)
        const now = new Date()
        const start = dateStart ? new Date(dateStart) : new Date(now.getFullYear(), now.getMonth(), now.getDate()-29)
        const end = dateEnd ? new Date(dateEnd) : now

        // Helpers de preenchimento
        const fillHours = () => Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2,'0')}h`)
        const fillDays = () => {
          const labels: string[] = []
          const cur = new Date(start)
          cur.setHours(0,0,0,0)
          const last = new Date(end)
          last.setHours(23,59,59,999)
          while (cur <= last) {
            labels.push(`${String(cur.getDate()).padStart(2,'0')}/${String(cur.getMonth()+1).padStart(2,'0')}`)
            cur.setDate(cur.getDate()+1)
          }
          return labels
        }
        const fillMonths = () => {
          const labels: string[] = []
          const cur = new Date(start.getFullYear(), start.getMonth(), 1)
          const last = new Date(end.getFullYear(), end.getMonth(), 1)
          while (cur <= last) {
            labels.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`)
            cur.setMonth(cur.getMonth()+1)
          }
          return labels
        }

        // Determinar granularidade baseado no intervalo
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        
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
        ;(donationsResult.data || []).forEach(d => {
          if (!d.created_at) return
          const dt = new Date(d.created_at as any)
          if (dt < start || dt > end) return
          let key = ''
          if (diffDays <= 1) {
            key = `${String(dt.getHours()).padStart(2,'0')}h`
          } else if (diffDays > 90) {
            key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
          } else {
            key = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
          }
          buckets.set(key, (buckets.get(key) || 0) + (d.amount || 0))
        })

        const series = labels.map(label => [label, buckets.get(label) || 0]) as [string, number][]
        setTrend({ 
          labels: series.map(([l]) => (diffDays > 90 ? l.split('-').reverse().join('/') : l)), 
          values: series.map(([,v]) => v) 
        })

      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [dateStart, dateEnd, presetId])

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
          Início Admin
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Evolução de Arrecadação</h3>
          </div>
          <div className="mb-4">
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
          <DonationTrendChart labels={trend.labels} values={trend.values} />
        </div>
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

        <div className="card p-6 lg:col-span-1">
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

        <div className="card p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Doadores</h3>
          {topDonors.length === 0 ? (
            <p className="text-sm text-gray-500">Sem dados recentes</p>
          ) : (
            <div className="space-y-3">
              {topDonors.map((d: any, idx: number) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.id)}`} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.id === 'anon' ? 'Anônimo' : d.id}</div>
                      <div className="text-xs text-gray-500">{d.count} doações</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(d.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
