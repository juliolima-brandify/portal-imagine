'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDonations, getUserStats, type Donation } from '@/lib/database'
import { exportDonations } from '@/lib/export'
import {
  SAO_PAULO_TIME_ZONE,
  formatCurrencyBRL,
  getDonationDestinationLabel,
  getDonationStatusBadgeMeta,
  getDonationStatusLabelPTBR,
  getRecognizedDonationAmountBrl,
  normalizePaymentMethodLabel,
  sumRecognizedDonationsBrl,
} from '@/lib/payments'
import type { User } from '@supabase/supabase-js'

export default function HistoricoPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [filter, setFilter] = useState<
    'all' | 'completed' | 'pending' | 'partially_refunded' | 'disputed' | 'refunded' | 'failed'
  >('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'project'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [exporting, setExporting] = useState<'csv' | 'pdf' | 'excel' | null>(null)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!authUser) {
          window.location.href = '/entrar'
          return
        }
        setUser(authUser)
        const [userDonations, stats] = await Promise.all([
          getDonations(authUser.id),
          getUserStats(authUser.id),
        ])
        setDonations(userDonations)
        setUserStats(stats)
      } catch {
        window.location.href = '/entrar'
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const getDestination = (d: Donation) =>
    getDonationDestinationLabel({
      projectTitle: d.projects?.title || null,
      campaignSlug: d.campaign_slug || null,
      projectId: d.project_id || null,
    })

  const getTxId = (d: Donation) =>
    d.asaas_payment_id || d.asaas_checkout_id || ''

  const filteredDonations = donations
    .filter((donation) => {
      const matchesFilter = filter === 'all' || donation.status === filter
      const q = searchTerm.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        getDestination(donation).toLowerCase().includes(q) ||
        getTxId(donation).toLowerCase().includes(q) ||
        donation.id.toLowerCase().includes(q)

      const donationDate = new Date(donation.created_at)
      const now = new Date()
      let matchesDate = true

      if (dateRange !== 'all') {
        const daysAgo =
          {
            week: 7,
            month: 30,
            year: 365,
          }[dateRange] || 0
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        matchesDate = donationDate >= cutoffDate
      }

      return matchesFilter && matchesSearch && matchesDate
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = (Number(a.amount) || 0) - (Number(b.amount) || 0)
          break
        case 'project':
          comparison = getDestination(a).localeCompare(getDestination(b), 'pt-BR')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Gabarito: admin/doacoes. Botões travados durante a exportação e erro visível se falhar.
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (exporting) return
    setExporting(format)
    setExportError('')
    try {
      await exportDonations(filteredDonations, { format })
    } catch (err) {
      console.error('[Historico] Erro ao exportar doações:', err)
      setExportError(
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível exportar o histórico. Tente novamente.'
      )
    } finally {
      setExporting(null)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getStatusBadge = (status: string) => getDonationStatusBadgeMeta(status).className

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const completedSum = sumRecognizedDonationsBrl(donations)

  return (
    <div className="max-w-7xl mx-auto">
      <main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Histórico Detalhado de Doações
          </h1>
          <p className="text-gray-600">
            Consulte e exporte todas as suas contribuições com filtros por período e projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
              {formatCurrencyBRL(userStats?.totalDonated ?? completedSum)}
            </div>
            <div className="text-sm text-gray-600">Total Confirmado</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1 tabular-nums">
              {userStats?.totalDonations ??
                donations.filter(
                  (d) => d.status === 'completed' || d.status === 'partially_refunded'
                ).length}
            </div>
            <div className="text-sm text-gray-600">Doações Confirmadas</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-amber-700 mb-1 tabular-nums">
              {donations.filter((d) => d.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Em Processamento</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1 tabular-nums">
              {donations.filter((d) => d.is_recurring).length}
            </div>
            <div className="text-sm text-gray-600">Assinaturas / Recorrentes</div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="hist-search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                id="hist-search"
                type="text"
                placeholder="Projeto ou referência..."
                className="input-modern h-12 !py-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="hist-status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="hist-status"
                className="input-modern h-12 !py-0"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="completed">Confirmadas</option>
                <option value="pending">Em processamento</option>
                <option value="partially_refunded">Estornadas parcialmente</option>
                <option value="disputed">Em disputa</option>
                <option value="refunded">Estornadas</option>
                <option value="failed">Não concluídas</option>
              </select>
            </div>

            <div>
              <label htmlFor="hist-period" className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                id="hist-period"
                className="input-modern h-12 !py-0"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="all">Todo o período</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Últimos 30 dias</option>
                <option value="year">Último ano</option>
              </select>
            </div>

            <div>
              <label htmlFor="hist-sort" className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  id="hist-sort"
                  className="input-modern h-12 !py-0 flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="date">Data</option>
                  <option value="amount">Valor</option>
                  <option value="project">Projeto</option>
                </select>
                <button
                  type="button"
                  aria-label={sortOrder === 'asc' ? 'Mudar para ordem decrescente' : 'Mudar para ordem crescente'}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-12 px-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredDonations.length === 0 ? (
            <div className="card p-12 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma doação encontrada
              </h2>
              <p className="text-sm text-gray-600">
                {searchTerm || filter !== 'all' || dateRange !== 'all'
                  ? 'Tente ajustar os filtros acima.'
                  : 'Você ainda não possui doações registradas.'}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => {
              const tx = getTxId(donation)
              return (
                <div key={donation.id} className="card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDestination(donation)}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(donation.status)}`}
                        >
                          {getDonationStatusLabelPTBR(donation.status)}
                        </span>
                        <span className="text-xs text-gray-500 tabular-nums">
                          {formatDate(donation.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-gray-500">Valor</span>
                          <p className="text-base font-semibold text-gray-900 tabular-nums">
                            {formatCurrencyBRL(donation.amount)}
                          </p>
                          {Number(donation.refunded_amount) > 0 && (
                            <p className="text-xs text-amber-700 font-medium tabular-nums">
                              Estornado {formatCurrencyBRL(Number(donation.refunded_amount))} · Líq.{' '}
                              {formatCurrencyBRL(getRecognizedDonationAmountBrl(donation))}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Meio</span>
                          <p className="text-gray-800">
                            {normalizePaymentMethodLabel(donation.payment_method)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Recorrente</span>
                          <p className="text-gray-800">{donation.is_recurring ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Anônima</span>
                          <p className="text-gray-800">{donation.anonymous ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>

                      {tx && (
                        <div className="mt-3 text-xs text-gray-500 font-mono break-all">
                          Referência: {tx}
                        </div>
                      )}

                      {donation.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                          {donation.message}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Link href={`/doacoes/${donation.id}`} className="btn-secondary text-sm">
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredDonations.length > 0 && (
          <div className="mt-10 card p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Exportar Histórico</h2>
            <p className="text-sm text-gray-600 mb-6">
              Baixe seus registros de doação em CSV, PDF ou Excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exporting !== null}
                onClick={() => void handleExport('csv')}
              >
                {exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </button>
              <button
                type="button"
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exporting !== null}
                onClick={() => void handleExport('pdf')}
              >
                {exporting === 'pdf' ? 'Gerando...' : 'Gerar PDF'}
              </button>
              <button
                type="button"
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exporting !== null}
                onClick={() => void handleExport('excel')}
              >
                {exporting === 'excel' ? 'Exportando...' : 'Exportar Excel'}
              </button>
            </div>
            {exportError && (
              <p role="alert" className="mt-4 text-sm text-red-700">{exportError}</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
