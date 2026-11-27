'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAdminDonationsReport, type AdminDonationsReport } from '@/lib/admin-api'
import {
  formatCurrencyBRL,
  getDonationDestinationLabel,
  getDonationStatusBadgeMeta,
  getSaoPauloDateParts,
  saoPauloMidnightUtc,
} from '@/lib/payments'
import DonationTrendChart from '@/components/DonationTrendChart'
import DateRangePickerWithPresets, { PresetId, getPresetRange } from '@/components/DateRangePicker'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDonated: 0,
    totalDonations: 0,
    totalUsers: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [report, setReport] = useState<AdminDonationsReport | null>(null)
  const [loading, setLoading] = useState(true)
  // Gráfico e métricas usam o mesmo escopo do seletor: começa em "Últimos 30 dias".
  const [dateStart, setDateStart] = useState<Date | undefined>(() => getPresetRange('last30Days').start)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(() => getPresetRange('last30Days').end)
  const [presetId, setPresetId] = useState<PresetId>('last30Days')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const spBounds = useMemo(() => {
    const now = new Date()
    const start = dateStart
      ? new Date(dateStart)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const end = dateEnd ? new Date(dateEnd) : now
    return {
      startDate: start,
      endDate: end,
      startUtc: new Date(saoPauloMidnightUtc(start)),
      endUtc: new Date(saoPauloMidnightUtc(end) + 86400000 - 1),
    }
  }, [dateStart, dateEnd])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    const loadStats = async () => {
      try {
        const [projectsCountRes, recentProjectsRes, usersCountRes, reportRes] =
          await Promise.all([
            supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase
              .from('projects')
              .select('id, title, created_at, status')
              .order('created_at', { ascending: false })
              .limit(5),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            fetchAdminDonationsReport({ start: spBounds.startUtc, end: spBounds.endUtc }),
          ])

        if (projectsCountRes.error) throw projectsCountRes.error
        if (recentProjectsRes.error) throw recentProjectsRes.error
        if (usersCountRes.error) throw usersCountRes.error

        if (!active) return

        const totalProjects = projectsCountRes.count ?? 0
        const totalUsers = usersCountRes.count ?? 0
        const totalDonated = Number(reportRes?.global_totals?.recognized_total) || 0
        const totalDonations = Number(reportRes?.global_totals?.recognized_count) || 0

        setStats({
          totalProjects,
          totalDonated,
          totalDonations,
          totalUsers,
        })

        setRecentProjects(recentProjectsRes.data || [])
        setReport(reportRes)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        if (active) setLoadError('Não foi possível carregar o painel. Verifique a conexão e tente de novo.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadStats()
    return () => {
      active = false
    }
  }, [reloadKey])

  // Atualiza apenas a série do gráfico ao mudar o período no seletor
  useEffect(() => {
    if (loading) return
    let active = true
    const refreshSeries = async () => {
      try {
        const nextReport = await fetchAdminDonationsReport({
          start: spBounds.startUtc,
          end: spBounds.endUtc,
        })
        if (active) setReport(nextReport)
      } catch (error) {
        console.error('Erro ao atualizar série do gráfico:', error)
        if (active) setLoadError('Não foi possível atualizar o gráfico para este período.')
      }
    }
    void refreshSeries()
    return () => {
      active = false
    }
  }, [spBounds.startUtc.getTime(), spBounds.endUtc.getTime()])

  const recentDonations = useMemo(() => report?.latest_donations ?? [], [report])
  const topDonors = useMemo(() => report?.top_donors_90d ?? [], [report])

  const trend = useMemo(() => {
    const { startDate: start, endDate: end } = spBounds

    const fillHours = () =>
      Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)
    const fillDays = () => {
      const keys: string[] = []
      const startTs = saoPauloMidnightUtc(start)
      const endTs = saoPauloMidnightUtc(end)
      for (let t = startTs; t <= endTs; t += 86400000) {
        const { year, month, day } = getSaoPauloDateParts(new Date(t))
        keys.push(`${year}-${month}-${day}`)
      }
      return keys
    }
    const fillMonths = () => {
      const keys: string[] = []
      const startParts = getSaoPauloDateParts(start)
      const endParts = getSaoPauloDateParts(end)
      let year = Number(startParts.year)
      let month = Number(startParts.month)
      const endYear = Number(endParts.year)
      const endMonth = Number(endParts.month)
      while (year < endYear || (year === endYear && month <= endMonth)) {
        keys.push(`${year}-${String(month).padStart(2, '0')}`)
        month += 1
        if (month > 12) {
          month = 1
          year += 1
        }
      }
      return keys
    }

    const diffDays = Math.round(
      (saoPauloMidnightUtc(end) - saoPauloMidnightUtc(start)) / (1000 * 60 * 60 * 24)
    )
    const keys =
      diffDays === 0 ? fillHours() : diffDays > 90 ? fillMonths() : fillDays()

    const buckets = new Map<string, number>()
    for (const item of report?.series ?? []) {
      buckets.set(item.bucket, Number(item.net) || 0)
    }

    const formatLabel = (key: string) => {
      if (diffDays === 0) return key
      if (diffDays > 90) return key.split('-').reverse().join('/')
      const [, mm, dd] = key.split('-')
      return `${dd}/${mm}`
    }

    return {
      labels: keys.map(formatLabel),
      values: keys.map((k) => buckets.get(k) || 0),
    }
  }, [report, spBounds, presetId])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="card p-6 max-w-md w-full border-red-200 bg-red-50 flex flex-col gap-4">
          <p className="text-sm text-red-700">{loadError}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-secondary self-start">
            Tentar novamente
          </button>
        </div>
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
              onClear={({ start, end, presetId: nextPreset }) => {
                setDateStart(start)
                setDateEnd(end)
                setPresetId(nextPreset)
              }}
              initialPresetId="last30Days"
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
              recentDonations.map((donation: any) => {
                const badge = getDonationStatusBadgeMeta(donation.status)
                return (
                  <div key={donation.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {formatCurrencyBRL(donation.amount)}
                        {donation.status === 'partially_refunded' && Number(donation.refunded_amount) > 0 && (
                          <span className="ml-1.5 text-xs font-medium text-amber-700">
                            (Líq. {formatCurrencyBRL(donation.net_amount)})
                          </span>
                        )}
                      </p>
                      <span className={`inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {donation.donor || 'Doador Anônimo'} —{' '}
                        {getDonationDestinationLabel({
                          projectTitle: donation.project_title,
                          campaignSlug: donation.campaign_slug,
                          projectId: donation.project_id,
                        })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                      {donation.created_at
                        ? new Date(donation.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                        : '—'}
                    </span>
                  </div>
                )
              })
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
                <div key={d.key} className="flex items-center justify-between gap-4">
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
