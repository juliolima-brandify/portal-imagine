'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/admin-api'
import { Modal } from '@/components/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/Toast'
import { exportToCSV } from '@/lib/export'
import {
  formatCurrencyBRL,
  getDonationStatusLabelPTBR,
  getFrequencyLabelPTBR,
  sanitizeSpreadsheetCell,
} from '@/lib/payments'

const ADMIN_PAGE_SIZE = 25

interface AdminDonationRow {
  id: string
  userId: string | null
  projectId: string | null
  campaignSlug: string | null
  projectTitle: string
  donorName: string
  donorEmail: string
  hasValidEmail: boolean
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  rawMethod: string | null
  isRecurring: boolean
  recurringFrequency: string | null
  anonymous: boolean
  message: string | null
  transactionId: string
  receiptSentAt: string | null
  createdAt: string
}

interface AdminDonationStats {
  total: number
  completedCount: number
  pendingCount: number
  failedCount: number
  totalCompletedBrl: number
  totalPendingBrl: number
}

async function safeReadJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text()
    if (!text) return {}
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function AdminDoacoesPage() {
  const [donations, setDonations] = useState<AdminDonationRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<AdminDonationStats>({
    total: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCompletedBrl: 0,
    totalPendingBrl: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | 'pix' | 'card' | 'recurring'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const [selectedDonation, setSelectedDonation] = useState<AdminDonationRow | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const { toasts, removeToast, success, error, warning } = useToast()
  const toastRef = useRef({ success, error, warning })
  toastRef.current = { success, error, warning }
  const loadSeqRef = useRef(0)
  const operationLockRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchTerm.trim()
      if (normalized !== debouncedSearch) {
        setDebouncedSearch(normalized)
        setPage(1)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  const loadDonations = useCallback(async () => {
    const seq = ++loadSeqRef.current
    setIsLoading(true)
    setLoadError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ADMIN_PAGE_SIZE),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (methodFilter !== 'all') params.set('method', methodFilter)
      if (debouncedSearch) params.set('q', debouncedSearch)

      const res = await adminFetch(`/api/admin/donations?${params.toString()}`)
      const json = await safeReadJson(res)
      if (seq !== loadSeqRef.current) return

      if (res.ok) {
        const list = (json.data as AdminDonationRow[]) || []
        const nextTotal = typeof json.total === 'number' ? json.total : list.length
        setDonations(list)
        setTotal(nextTotal)

        if (json.stats && typeof json.stats === 'object') {
          const s = json.stats as Partial<AdminDonationStats>
          setStats({
            total: typeof s.total === 'number' ? s.total : nextTotal,
            completedCount: typeof s.completedCount === 'number' ? s.completedCount : 0,
            pendingCount: typeof s.pendingCount === 'number' ? s.pendingCount : 0,
            failedCount: typeof s.failedCount === 'number' ? s.failedCount : 0,
            totalCompletedBrl: typeof s.totalCompletedBrl === 'number' ? s.totalCompletedBrl : 0,
            totalPendingBrl: typeof s.totalPendingBrl === 'number' ? s.totalPendingBrl : 0,
          })
        }

        const totalPages = Math.max(1, Math.ceil(nextTotal / ADMIN_PAGE_SIZE))
        if (nextTotal > 0 && page > totalPages) {
          setPage(totalPages)
        }
      } else {
        const msg = String(json.error || 'Tente novamente em alguns instantes.')
        setDonations([])
        setTotal(0)
        setLoadError(msg)
        toastRef.current.error('Erro ao carregar doações', msg)
      }
    } catch {
      if (seq !== loadSeqRef.current) return
      const msg = 'Não foi possível carregar as doações por falha de conexão.'
      setDonations([])
      setTotal(0)
      setLoadError(msg)
      toastRef.current.error('Erro de conexão', msg)
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoading(false)
      }
    }
  }, [page, statusFilter, methodFilter, debouncedSearch])

  useEffect(() => {
    void loadDonations()
  }, [loadDonations])

  const handleResendReceipt = async (row: AdminDonationRow) => {
    if (operationLockRef.current || resendingId) return
    if (row.status !== 'completed') {
      toastRef.current.warning(
        'Doação ainda não confirmada',
        'O recibo só pode ser enviado após a confirmação do pagamento.'
      )
      return
    }
    if (!row.hasValidEmail) {
      toastRef.current.warning(
        'E-mail indisponível',
        'Esta doação não possui um endereço de e-mail válido cadastrado.'
      )
      return
    }

    operationLockRef.current = true
    setResendingId(row.id)
    try {
      const res = await adminFetch(
        `/api/admin/donations/${encodeURIComponent(row.id)}/resend-receipt`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )
      const json = await safeReadJson(res)
      if (!res.ok) {
        toastRef.current.error(
          'Falha ao reenviar recibo',
          String(json.error || 'Verifique a configuração do Resend e tente novamente.')
        )
        return
      }

      const sentAt = typeof json.receiptSentAt === 'string' ? json.receiptSentAt : new Date().toISOString()
      toastRef.current.success(
        'Recibo enviado',
        `O recibo e o acesso ao Portal foram enviados para ${row.donorEmail}.`
      )

      setDonations((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, receiptSentAt: sentAt } : item))
      )
      setSelectedDonation((prev) =>
        prev && prev.id === row.id ? { ...prev, receiptSentAt: sentAt } : prev
      )
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível contatar o servidor de e-mail.')
    } finally {
      operationLockRef.current = false
      setResendingId(null)
    }
  }

  const handleExportCurrentCSV = () => {
    if (donations.length === 0) {
      toastRef.current.warning('Sem dados', 'Não há doações listadas neste filtro para exportar.')
      return
    }

    const rows = donations.map((d) => ({
      'ID': sanitizeSpreadsheetCell(d.id),
      'Data': new Date(d.createdAt).toLocaleString('pt-BR'),
      'Doador': sanitizeSpreadsheetCell(d.donorName),
      'E-mail': sanitizeSpreadsheetCell(d.donorEmail),
      'Destino': sanitizeSpreadsheetCell(d.projectTitle),
      'Valor (BRL)': d.amount.toFixed(2),
      'Status': getDonationStatusLabelPTBR(d.status),
      'Meio': sanitizeSpreadsheetCell(d.method),
      'Modalidade': d.isRecurring
        ? `Recorrente (${getFrequencyLabelPTBR(d.recurringFrequency)})`
        : 'Única',
      'ID Asaas / Gateway': sanitizeSpreadsheetCell(d.transactionId),
      'Mensagem': sanitizeSpreadsheetCell(d.message || ''),
    }))

    exportToCSV(rows, `doacoes_imagine_${new Date().toISOString().split('T')[0]}`)
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setMethodFilter('all')
    setSearchTerm('')
    setDebouncedSearch('')
    setPage(1)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Confirmada', cls: 'bg-green-100 text-green-700' }
      case 'pending':
        return { label: 'Em processamento', cls: 'bg-yellow-100 text-yellow-800' }
      case 'refunded':
        return { label: 'Estornada', cls: 'bg-gray-200 text-gray-700' }
      case 'failed':
        return { label: 'Não concluída', cls: 'bg-red-100 text-red-700' }
      default:
        return { label: status, cls: 'bg-gray-100 text-gray-700' }
    }
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
  const hasActiveFilters =
    statusFilter !== 'all' || methodFilter !== 'all' || debouncedSearch !== ''

  return (
    <div className="max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header — gabarito Tela Irmã (/admin/blog) */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Doações</h1>
            <p className="text-gray-600">
              Acompanhe os recebimentos via Asaas (Pix e Cartão) e reenvie recibos oficiais por e-mail.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCurrentCSV}
            disabled={isLoading || donations.length === 0}
            className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards com tabular-nums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-6">
          <div className="text-2xl font-bold text-green-600 mb-1 tabular-nums">
            {formatCurrencyBRL(stats.totalCompletedBrl)}
          </div>
          <div className="text-sm text-gray-600">Total Confirmado</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-yellow-600 mb-1 tabular-nums">
            {formatCurrencyBRL(stats.totalPendingBrl)}
          </div>
          <div className="text-sm text-gray-600">Aguardando Compensação</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
            {stats.completedCount}
          </div>
          <div className="text-sm text-gray-600">Doações Confirmadas</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-700 mb-1 tabular-nums">{stats.total}</div>
          <div className="text-sm text-gray-600">Total de Registros</div>
        </div>
      </div>

      {/* Barra de Filtros Uniforme — h-12 !py-0 */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label
              htmlFor="admin-don-status"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Status
            </label>
            <select
              id="admin-don-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setPage(1)
              }}
              className="input-modern h-12 !py-0"
            >
              <option value="all">Todos ({stats.total})</option>
              <option value="completed">Confirmadas ({stats.completedCount})</option>
              <option value="pending">Em processamento ({stats.pendingCount})</option>
              <option value="failed">Não concluídas / Estornadas ({stats.failedCount})</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-don-method"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Meio / Modalidade
            </label>
            <select
              id="admin-don-method"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as any)
                setPage(1)
              }}
              className="input-modern h-12 !py-0"
            >
              <option value="all">Todos os Meios</option>
              <option value="pix">Pix</option>
              <option value="card">Cartão de Crédito</option>
              <option value="recurring">Assinaturas Recorrentes</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-don-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Buscar
            </label>
            <input
              id="admin-don-search"
              type="text"
              placeholder="Doador, e-mail, projeto ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern h-12 !py-0"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary w-full h-12 !py-0 flex items-center justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        {!isLoading && total > 0 && (
          <div className="mt-3 text-xs text-gray-500 tabular-nums">
            Exibindo {donations.length} de {total} doações{hasActiveFilters ? ' neste filtro' : ''}
          </div>
        )}
      </div>

      {/* Tabela Principal — Alinhamento estrito th === td */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="animate-pulse flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-6 bg-gray-200 rounded-full w-24" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Não foi possível carregar as doações
            </h2>
            <p className="text-sm text-gray-600 mb-5">{loadError}</p>
            <button type="button" onClick={() => void loadDonations()} className="btn-secondary">
              Tentar novamente
            </button>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma doação encontrada
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              {stats.total === 0 && !hasActiveFilters
                ? 'As doações iniciadas pelo site ou portal aparecerão automaticamente aqui.'
                : 'Ajuste os filtros acima para localizar outros registros.'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="btn-secondary">
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destino / Projeto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donations.map((row) => {
                    const badge = statusBadge(row.status)
                    const isResendingThis = resendingId === row.id

                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-left">
                          <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {row.donorName}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[220px]">
                            {row.donorEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {row.projectTitle}
                          </div>
                          <div className="text-xs text-gray-500 font-mono truncate max-w-[180px]">
                            {row.transactionId}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap tabular-nums">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrencyBRL(row.amount)}
                          </div>
                          {row.isRecurring && (
                            <div className="text-xs text-blue-700 font-medium">
                              {getFrequencyLabelPTBR(row.recurringFrequency)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-xs font-medium text-gray-700">
                          {row.method}
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap tabular-nums text-xs text-gray-600">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDonation(row)}
                              className="inline-flex items-center text-xs font-medium text-gray-900 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors"
                            >
                              Detalhes
                            </button>
                            {row.status === 'completed' && row.hasValidEmail && (
                              <button
                                type="button"
                                onClick={() => void handleResendReceipt(row)}
                                disabled={Boolean(resendingId)}
                                className="inline-flex items-center text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isResendingThis ? 'Enviando...' : 'Reenviar Recibo'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="btn-secondary text-sm !py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-medium text-gray-600 tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="btn-secondary text-sm !py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal 3 zonas — gabarito ConfirmDialog.tsx */}
      <Modal
        isOpen={Boolean(selectedDonation)}
        onClose={() => {
          if (!resendingId) setSelectedDonation(null)
        }}
        title="Detalhes da Doação"
        size="md"
        showCloseButton={!resendingId}
        closeOnOverlayClick={!resendingId}
        closeOnEscape={!resendingId}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedDonation(null)}
              disabled={Boolean(resendingId)}
              className="btn-secondary disabled:opacity-50"
            >
              Fechar
            </button>
            {selectedDonation &&
              selectedDonation.status === 'completed' &&
              selectedDonation.hasValidEmail && (
                <button
                  type="button"
                  onClick={() => void handleResendReceipt(selectedDonation)}
                  disabled={Boolean(resendingId)}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingId === selectedDonation.id ? 'Enviando recibo...' : 'Reenviar Recibo por E-mail'}
                </button>
              )}
          </div>
        }
      >
        {selectedDonation && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(selectedDonation.status).cls}`}
                >
                  {statusBadge(selectedDonation.status).label}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Valor:</dt>
              <dd className="font-bold text-gray-900 tabular-nums">
                {formatCurrencyBRL(selectedDonation.amount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Destino / Projeto:</dt>
              <dd className="font-medium text-gray-900 text-right">
                {selectedDonation.projectTitle}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Doador:</dt>
              <dd className="font-medium text-gray-900 text-right">
                {selectedDonation.donorName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">E-mail:</dt>
              <dd className="text-gray-900 break-all text-right">
                {selectedDonation.donorEmail}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Meio de Pagamento:</dt>
              <dd className="text-gray-900">{selectedDonation.method}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Modalidade:</dt>
              <dd className="text-gray-900">
                {selectedDonation.isRecurring
                  ? `Recorrente (${getFrequencyLabelPTBR(selectedDonation.recurringFrequency)})`
                  : 'Doação única'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Data do Registro:</dt>
              <dd className="text-gray-900 tabular-nums">
                {formatDateTime(selectedDonation.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Último Recibo Enviado:</dt>
              <dd className="text-gray-900 tabular-nums">
                {selectedDonation.receiptSentAt
                  ? formatDateTime(selectedDonation.receiptSentAt)
                  : 'Aguardando / Não registrado'}
              </dd>
            </div>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">ID Interno:</dt>
                <dd className="font-mono text-xs text-gray-600 break-all text-right">
                  {selectedDonation.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">ID Asaas / Gateway:</dt>
                <dd className="font-mono text-xs text-gray-600 break-all text-right">
                  {selectedDonation.transactionId}
                </dd>
              </div>
            </div>
            {selectedDonation.message && (
              <div className="pt-3 border-t border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Mensagem do Doador
                </dt>
                <dd className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedDonation.message}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  )
}
