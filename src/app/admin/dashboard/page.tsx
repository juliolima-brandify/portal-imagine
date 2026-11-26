'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllAdminDonations } from '@/lib/admin-api'
import {
  formatCurrencyBRL,
  getSaoPauloDateParts,
  saoPauloMidnightUtc,
  sumDonationsBrl,
} from '@/lib/payments'
import DonationTrendChart from '@/components/DonationTrendChart'
import DateRangePickerWithPresets, { PresetId } from '@/components/DateRangePicker'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDonated: 0,
    totalDonations: 0,
    totalUsers: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [recentDonations, setRecentDonations] = useState<any[]>([])
  const [topDonors, setTopDonors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  })
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined)
  const [presetId, setPresetId] = useState<PresetId>('custom')

  useEffect(() => {
    let active = true
    const loadStats = async () => {
      try {
        const [projectsActiveRes, recentProjectsRes, usersRes, adminDonationsRes] =
          await Promise.all([
            supabase.from('projects').select('id').eq('status', 'active'),
            supabase
              .from('projects')
              .select('id, title, created_at, status')
              .order('created_at', { ascending: false })
              .limit(5),
            supabase.from('profiles').select('id'),
            fetchAllAdminDonations('/api/admin/donations'),
          ])

        if (!active) return

        const donationsPayload = adminDonationsRes || {}
        const hydratedList: any[] = Array.isArray(donationsPayload?.data)
          ? donationsPayload.data
          : []
        const donationStats = donationsPayload?.stats || {}

        const totalProjects = projectsActiveRes.data?.length || 0
        const totalUsers = usersRes.data?.length || 0
        const totalDonated =
          typeof donationStats.totalCompletedBrl === 'number'
            ? donationStats.totalCompletedBrl
            : sumDonationsBrl(
                hydratedList.filter((d) => d.status === 'completed').map((d) => d.amount)
              )
        const totalDonations =
          typeof donationStats.completedCount === 'number'
            ? donationStats.completedCount
            : hydratedList.filter((d) => d.status === 'completed').length

        setStats({
          totalProjects,
          totalDonated,
          totalDonations,
          totalUsers,
        })

        setRecentProjects(recentProjectsRes.data || [])
        setRecentDonations(hydratedList.slice(0, 5))

        // Top Doadores (últimos 90 dias sobre doações confirmadas)
        const since = new Date()
        since.setDate(since.getDate() - 90)
        const byDonor = new Map<string, { label: string; amount: number; count: number }>()
        for (const d of hydratedList) {
          if (d.status !== 'completed') continue
          if (d.createdAt && new Date(d.createdAt) < since) continue
          const key = d.anonymous
            ? `anon:${d.id}`
            : d.hasValidEmail
              ? d.donorEmail
              : d.userId || d.donorName || 'anon'
          const label = d.anonymous ? 'Doador Anônimo' : d.donorName || key
          const prev = byDonor.get(key)
          if (!prev) {
            byDonor.set(key, { label, amount: Number(d.amount) || 0, count: 1 })
          } else {
            prev.amount = sumDonationsBrl([prev.amount, d.amount])
            prev.count += 1
          }
        }

        const ranking = Array.from(byDonor.entries())
          .map(([id, info]) => ({ id, ...info }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
        setTopDonors(ranking)

        // Evolução conforme intervalo selecionado
        const now = new Date()
        const start = dateStart
          ? new Date(dateStart)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
        const end = dateEnd ? new Date(dateEnd) : now

        const fillHours = () =>
          Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)
        const fillDays = () => {
          const labels: string[] = []
          const startTs = saoPauloMidnightUtc(start)
          const endTs = saoPauloMidnightUtc(end)
          for (let t = startTs; t <= endTs; t += 86400000) {
            const { day, month } = getSaoPauloDateParts(new Date(t))
            labels.push(`${day}/${month}`)
          }
          return labels
        }
        const fillMonths = () => {
          const labels: string[] = []
          const startParts = getSaoPauloDateParts(start)
          const endParts = getSaoPauloDateParts(end)
          let year = Number(startParts.year)
          let month = Number(startParts.month)
          const endYear = Number(endParts.year)
          const endMonth = Number(endParts.month)
          while (year < endYear || (year === endYear && month <= endMonth)) {
            labels.push(`${year}-${String(month).padStart(2, '0')}`)
            month += 1
            if (month > 12) {
              month = 1
              year += 1
            }
          }
          return labels
        }

        const diffDays = Math.ceil(
          (saoPauloMidnightUtc(end) - saoPauloMidnightUtc(start)) / (1000 * 60 * 60 * 24)
        )
        const labels =
          diffDays <= 1 ? fillHours() : diffDays > 90 ? fillMonths() : fillDays()

        const startTs = saoPauloMidnightUtc(start)
        const endTs = saoPauloMidnightUtc(end) + 86400000 - 1
        const buckets = new Map<string, number>(labels.map((l) => [l, 0]))
        for (const d of hydratedList) {
          if (d.status !== 'completed' || !d.createdAt) continue
          const dt = new Date(d.createdAt)
          if (dt.getTime() < startTs || dt.getTime() > endTs) continue
          const parts = getSaoPauloDateParts(dt)
          const key =
            diffDays <= 1
              ? `${parts.hour}h`
              : diffDays > 90
                ? `${parts.year}-${parts.month}`
                : `${parts.day}/${parts.month}`
          buckets.set(key, sumDonationsBrl([buckets.get(key) || 0, d.amount]))
        }

        const series = labels.map((label) => [label, buckets.get(label) || 0]) as [string, number][]
        setTrend({
          labels: series.map(([l]) => (diffDays > 90 ? l.split('-').reverse().join('/') : l)),
          values: series.map(([, v]) => v),
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadStats()
    return () => {
      active = false
    }
  }, [dateStart, dateEnd, presetId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Início Admin</h1>
        <p className="text-gray-600">Visão geral do sistema e métricas principais.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
            {stats.totalProjects}
          </div>
          <div className="text-sm text-gray-600">Projetos Ativos</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-green-600 mb-1 tabular-nums">
            {formatCurrencyBRL(stats.totalDonated)}
          </div>
          <div className="text-sm text-gray-600">Total Arrecadado</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-700 mb-1 tabular-nums">
            {stats.totalDonations}
          </div>
          <div className="text-sm text-gray-600">Doações Confirmadas</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-500 mb-1 tabular-nums">
            {stats.totalUsers}
          </div>
          <div className="text-sm text-gray-600">Usuários</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Evolução de Arrecadação</h2>
          </div>
          <div className="mb-4">
            <DateRangePickerWithPresets
              start={dateStart ?? undefined}
              end={dateEnd ?? undefined}
              onChange={({ start, end, presetId: nextPreset }) => {
                setDateStart(start)
                setDateEnd(end)
                setPresetId(nextPreset)
              }}
            />
          </div>
          <DonationTrendChart labels={trend.labels} values={trend.values} />
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projetos Recentes</h2>
          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
                    <p className="text-xs text-gray-500 tabular-nums">
                      Criado em {new Date(project.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Doações Recentes</h2>
          <div className="space-y-3">
            {recentDonations.length > 0 ? (
              recentDonations.map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCurrencyBRL(donation.amount)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {donation.anonymous ? 'Doador Anônimo' : donation.donorName || 'Não identificado'} — {donation.projectTitle || 'Instituto Imagine'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                    {donation.createdAt
                      ? new Date(donation.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                      : '—'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhuma doação encontrada</p>
            )}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Doadores (90 dias)</h2>
          {topDonors.length === 0 ? (
            <p className="text-sm text-gray-500">Sem doações confirmadas no período recente</p>
          ) : (
            <div className="space-y-3">
              {topDonors.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{d.label}</div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      {d.count} {d.count === 1 ? 'doação' : 'doações'}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">
                    {formatCurrencyBRL(d.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
