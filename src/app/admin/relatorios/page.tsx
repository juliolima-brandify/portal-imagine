'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProjects } from '@/lib/database'
import { fetchAllAdminDonations } from '@/lib/admin-api'
import {
  formatCurrencyBRL,
  getDonationDestinationLabel,
  getRecognizedDonationAmountBrl,
  getSaoPauloDateParts,
  saoPauloMidnightUtc,
  sumDonationsBrl,
  sumRecognizedDonationsBrl,
} from '@/lib/payments'

import ExportDropdown from '@/components/ExportDropdown'
import DonationTrendChart from '@/components/DonationTrendChart'
import DateRangePickerWithPresets from '@/components/DateRangePicker'
import type { User } from '@supabase/supabase-js'

export default function AdminRelatoriosPage() {
  const [, setUser] = useState<User | null>(null)
  const [allDonations, setAllDonations] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [totalVolunteers, setTotalVolunteers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [dateStart, setDateStart] = useState<Date | undefined>(undefined)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined)
  const [presetId, setPresetId] = useState<string>('custom')
  const [selectedReport, setSelectedReport] = useState<'overview' | 'donations' | 'projects' | 'donors'>('overview')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const chartImageRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
        } else {
          window.location.href = '/entrar'
        }
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
      }
    }

    void getUser()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }

  const loadBaseData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [projectsData, donationsPayload, volsRes] = await Promise.all([
        getProjects(),
        fetchAllAdminDonations('/api/admin/donations', { maskAnonymous: 'true' }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'volunteer'),
      ])

      const mappedDonations = (donationsPayload.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.userId,
        project_id: item.projectId,
        campaign_slug: item.campaignSlug,
        projectTitle: item.projectTitle,
        donorName: item.donorName,
        donorEmail: item.donorEmail,
        hasValidEmail: item.hasValidEmail,
        amount: item.amount,
        refundedAmount: item.refundedAmount || 0,
        status: item.status,
        anonymous: item.anonymous,
        created_at: item.createdAt,
      }))

      setProjects(projectsData)
      setAllDonations(mappedDonations)
      setTotalVolunteers(volsRes.count ?? 0)
    } catch (err) {
      console.error('[AdminRelatorios] Erro ao carregar relatórios:', err)
      setLoadError('Não foi possível carregar os dados financeiros dos relatórios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBaseData()
  }, [loadBaseData])

  const { reports, topDonors } = useMemo(() => {
    const now = new Date()
    const endDate = dateEnd || now
    const startDate =
      dateStart || new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 29)

    let filteredDonations =
      selectedProjectId === 'all'
        ? allDonations
        : allDonations.filter((d: any) => d.project_id === selectedProjectId)

    const startTs = dateStart ? saoPauloMidnightUtc(startDate) : null
    const endTs = dateEnd ? saoPauloMidnightUtc(endDate) + 86400000 - 1 : null
    if (startTs !== null) {
      filteredDonations = filteredDonations.filter(
        (d: any) => new Date(d.created_at).getTime() >= startTs
      )
    }
    if (endTs !== null) {
      filteredDonations = filteredDonations.filter(
        (d: any) => new Date(d.created_at).getTime() <= endTs
      )
    }

    const activeProjects = projects.filter((p: any) => p.status === 'active')
    const completedProjects = projects.filter((p: any) => p.status === 'completed')
    const recognizedDonations = filteredDonations.filter(
      (d: any) => getRecognizedDonationAmountBrl(d) > 0
    )

    const totalDonations = sumRecognizedDonationsBrl(recognizedDonations)
    const totalDonors = new Set(
      recognizedDonations.map((d: any) =>
        d.anonymous
          ? `anon:${d.id}`
          : d.user_id
            ? `user:${d.user_id}`
            : d.hasValidEmail
              ? `email:${String(d.donorEmail).toLowerCase()}`
              : `guest:${d.id}`
      )
    ).size
    const avgDonation =
      recognizedDonations.length > 0 ? totalDonations / recognizedDonations.length : 0

    // Dados do período para o gráfico (últimos 30 dias como janela padrão quando sem seleção)
    const fillHours = () =>
      Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)
    const fillDays = () => {
      const labels: string[] = []
      const from = saoPauloMidnightUtc(startDate)
      const to = saoPauloMidnightUtc(endDate)
      for (let t = from; t <= to; t += 86400000) {
        const { day, month } = getSaoPauloDateParts(new Date(t))
        labels.push(`${day}/${month}`)
      }
      return labels
    }
    const fillMonths = () => {
      const startParts = getSaoPauloDateParts(startDate)
      const endParts = getSaoPauloDateParts(endDate)
      let year = Number(startParts.year)
      let month = Number(startParts.month)
      const endYear = Number(endParts.year)
      const endMonth = Number(endParts.month)
      const labels: string[] = []
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

    const diffDays = Math.round(
      (saoPauloMidnightUtc(endDate) - saoPauloMidnightUtc(startDate)) / (1000 * 60 * 60 * 24)
    )

    const labels =
      diffDays === 0 ? fillHours() : diffDays > 90 ? fillMonths() : fillDays()

    const chartStartTs = saoPauloMidnightUtc(startDate)
    const chartEndTs = saoPauloMidnightUtc(endDate) + 86400000 - 1
    const buckets = new Map<string, number>(labels.map((l) => [l, 0]))
    for (const d of recognizedDonations) {
      const recognized = getRecognizedDonationAmountBrl(d)
      if (recognized <= 0 || !d.created_at) continue
      const dt = new Date(d.created_at)
      if (dt.getTime() < chartStartTs || dt.getTime() > chartEndTs) continue
      const parts = getSaoPauloDateParts(dt)
      const key =
        diffDays === 0
          ? `${parts.hour}h`
          : diffDays > 90
            ? `${parts.year}-${parts.month}`
            : `${parts.day}/${parts.month}`
      buckets.set(key, sumDonationsBrl([buckets.get(key) || 0, recognized]))
    }

    const monthlyData = labels.map((label) => ({
      month: diffDays > 90 ? label.split('-').reverse().join('/') : label,
      donations: buckets.get(label) || 0,
    }))

    // Top projects
    const byProject = new Map<string, { amount: number; donors: Set<string> }>()
    for (const d of recognizedDonations) {
      const key = d.project_id
      if (!key) continue
      if (!byProject.has(key)) byProject.set(key, { amount: 0, donors: new Set() })
      const agg = byProject.get(key)!
      agg.amount = sumDonationsBrl([agg.amount, getRecognizedDonationAmountBrl(d)])
      const donorKey = d.anonymous
        ? `anon:${d.id}`
        : d.user_id
          ? `user:${d.user_id}`
          : d.hasValidEmail
            ? `email:${String(d.donorEmail).toLowerCase()}`
            : `guest:${d.id}`
      agg.donors.add(donorKey)
    }

    const topProjects = projects
      .map((p: any) => {
        const agg = byProject.get(p.id)
        const amount = agg?.amount || 0
        const donors = agg ? agg.donors.size : 0
        const progress = p.target_amount
          ? Math.round(Math.min((p.current_amount / p.target_amount) * 100, 100))
          : 0
        return { name: p.title, amount, donors, progress }
      })
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5)

    // Top Doadores
    const byDonor = new Map<string, { amount: number; count: number; label: string }>()
    for (const d of recognizedDonations) {
      const recognized = getRecognizedDonationAmountBrl(d)
      if (recognized <= 0) continue
      const key = d.anonymous
        ? `anon:${d.id}`
        : d.hasValidEmail
          ? `email:${String(d.donorEmail).toLowerCase()}`
          : d.user_id
            ? `user:${d.user_id}`
            : `guest:${d.id}`
      const label = d.anonymous
        ? 'Doador Anônimo'
        : d.donorName && d.donorName !== 'Não identificado'
          ? d.donorName
          : 'Não identificado'
      if (!byDonor.has(key)) byDonor.set(key, { amount: 0, count: 0, label })
      const agg = byDonor.get(key)!
      agg.amount = sumDonationsBrl([agg.amount, recognized])
      agg.count += 1
    }
    const donorsArray = Array.from(byDonor.entries())
      .map(([userId, info]) => ({ userId, ...info }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return {
      topDonors: donorsArray,
      reports: {
        overview: {
          totalDonations,
          totalDonors,
          activeProjects: activeProjects.length,
          completedProjects: completedProjects.length,
          monthlyGrowth: 0,
          averageDonation: avgDonation,
          totalVolunteers,
        },
        monthlyData,
        topProjects,
        donorSegments: [] as any[],
        paymentMethods: [] as any[],
        recentDonations: recognizedDonations.slice(0, 10).map((d: any) => ({
          id: d.id,
          donor: d.anonymous
            ? 'Doador Anônimo'
            : d.donorName && d.donorName !== 'Não identificado'
              ? d.donorName
              : 'Não identificado',
          project: getDonationDestinationLabel({
            projectTitle: d.projectTitle || d.projects?.title || null,
            campaignSlug: d.campaign_slug || null,
            projectId: d.project_id || null,
          }),
          amount: getRecognizedDonationAmountBrl(d),
          date: d.created_at,
        })),
      },
    }
  }, [allDonations, projects, totalVolunteers, selectedProjectId, dateStart, dateEnd, presetId])

  return (
    <div className="max-w-7xl mx-auto">
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
                data={{
                  ...reports,
                  __chartImage: chartImageRef.current,
                  __chartCaption:
                    dateStart && dateEnd
                      ? `Período: ${new Date(dateStart).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} – ${new Date(dateEnd).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
                      : undefined,
                }}
                filename="relatorio_completo"
              />
            </div>
          </div>
        </div>

        {loadError && (
          <div className="card p-6 mb-8 border-red-200 bg-red-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-red-900">
                Erro ao carregar relatórios
              </h2>
              <p className="text-sm text-red-700">{loadError}</p>
            </div>
            <button type="button" onClick={() => void loadBaseData()} className="btn-secondary">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Filters and Controls — barra uniforme h-12 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Análise
              </label>
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
            <div>
              <label
                htmlFor="rel-foco"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Foco da Análise
              </label>
              <select
                id="rel-foco"
                className="input-modern h-12 !py-0 w-full"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as any)}
              >
                <option value="overview">Visão Geral</option>
                <option value="donations">Análise de Doações</option>
                <option value="projects">Performance de Projetos</option>
                <option value="donors">Comportamento de Doadores</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="rel-projeto"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filtrar por Projeto
              </label>
              <select
                id="rel-projeto"
                className="input-modern h-12 !py-0 w-full"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="all">Todos os Projetos</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
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
                  <p className="text-2xl font-bold text-black tabular-nums">
                    {loading ? '—' : formatCurrencyBRL(reports.overview.totalDonations)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 tabular-nums">
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
                  <p className="text-2xl font-bold text-black tabular-nums">
                    {loading ? '—' : reports.overview.totalDonors}
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
                  <p className="text-2xl font-bold text-black tabular-nums">
                    {loading ? '—' : reports.overview.activeProjects}
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
                  <p className="text-2xl font-bold text-purple-600 tabular-nums">
                    {loading ? '—' : reports.overview.totalVolunteers}
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
                  <p className="text-2xl font-bold text-purple-600 tabular-nums">
                    {loading ? '—' : reports.overview.completedProjects}
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
                  <p className="text-2xl font-bold text-amber-700 tabular-nums">
                    {loading ? '—' : formatCurrencyBRL(reports.overview.averageDonation)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                labels={reports.monthlyData.map((d) => d.month)}
                values={reports.monthlyData.map((d) => d.donations)}
                title="Evolução de Arrecadação"
                onChartReady={(getter) => {
                  chartImageRef.current = getter?.()
                }}
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
                {reports.topProjects.map((project) => (
                  <div key={project.name} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500 tabular-nums">
                        {project.donors} {project.donors === 1 ? 'doador' : 'doadores'}
                      </div>
                    </div>
                    <div className="text-right tabular-nums flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrencyBRL(project.amount)}
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
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right tabular-nums">
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
                    <span className="text-sm font-medium text-gray-900">
                      {method.method}
                    </span>
                    <div className="text-right tabular-nums">
                      <div className="text-sm font-medium text-gray-900">
                        {method.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrencyBRL(method.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Doadores — avatar local sem vazamento externo */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Doadores</h3>
          </div>
          {topDonors.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum doador encontrado</p>
          ) : (
            <div className="space-y-3">
              {topDonors.map((d) => (
                <div key={d.userId} className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      aria-hidden="true"
                      className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0"
                    >
                      {(d.label || 'D').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{d.label}</div>
                      <div className="text-xs text-gray-500 tabular-nums">
                        {d.count} {d.count === 1 ? 'doação' : 'doações'}
                      </div>
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

        {/* Recent Donations */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Doações Recentes
            </h3>
            <Link href="/admin/doacoes" className="btn-secondary text-sm">
              Ver Todas
            </Link>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium text-gray-900">
                      {donation.donor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                      {donation.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-sm font-semibold text-gray-900">
                      {formatCurrencyBRL(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left tabular-nums text-sm text-gray-500">
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
