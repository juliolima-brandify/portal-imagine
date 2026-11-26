'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDonations, getUserStats, type Donation } from '@/lib/database'
import {
  INSTITUTE_CNPJ,
  buildReceiptText,
  formatCurrencyBRL,
  getDonationDestinationLabel,
  getDonationStatusLabelPTBR,
  normalizePaymentMethodLabel,
} from '@/lib/payments'
import { Modal } from '@/components/ConfirmDialog'
import type { User } from '@supabase/supabase-js'

export default function DoacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [userStats, setUserStats] = useState<{ totalDonated: number; totalDonations: number } | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'recurring'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          const [userDonations, stats] = await Promise.all([
            getDonations(authUser.id),
            getUserStats(authUser.id),
          ])
          setDonations(userDonations)
          setUserStats(stats)
        } else {
          window.location.href = '/entrar'
        }
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
    d.asaas_payment_id || d.asaas_checkout_id || d.stripe_payment_intent_id || ''

  const filteredDonations = donations.filter((donation) => {
    let matchesFilter = true
    if (filter === 'completed') matchesFilter = donation.status === 'completed'
    else if (filter === 'pending') matchesFilter = donation.status === 'pending'
    else if (filter === 'recurring') matchesFilter = donation.is_recurring === true

    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      q === '' ||
      getDestination(donation).toLowerCase().includes(q) ||
      getTxId(donation).toLowerCase().includes(q) ||
      donation.id.toLowerCase().includes(q) ||
      (donation.message || '').toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const generateReceipt = (donation: Donation) => {
    const receiptContent = buildReceiptText({
      donationId: donation.id,
      donorName: (user?.user_metadata as any)?.name || user?.email || 'Doador',
      donorEmail: user?.email || null,
      anonymous: donation.anonymous,
      amount: Number(donation.amount) || 0,
      projectTitle: getDestination(donation),
      status: donation.status,
      paymentMethod: donation.payment_method,
      createdAt: donation.created_at,
      transactionId: getTxId(donation) || null,
      isRecurring: donation.is_recurring,
      recurringFrequency: donation.recurring_frequency,
      message: donation.message,
    })

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo_imagine_${donation.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'refunded':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Carregando doações...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acesso Restrito</h1>
          <p className="mb-5 text-gray-600">Faça login para visualizar suas doações e recibos.</p>
          <Link href="/entrar" className="btn-primary">
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Doações</h1>
            <p className="text-gray-600">
              Acompanhe o histórico das suas contribuições e emita seus recibos oficiais (CNPJ {INSTITUTE_CNPJ}).
            </p>
          </div>
          <Link href="/projetos" className="btn-primary whitespace-nowrap">
            Nova Doação
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
              {formatCurrencyBRL(userStats?.totalDonated || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Confirmado</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1 tabular-nums">
              {userStats?.totalDonations || 0}
            </div>
            <div className="text-sm text-gray-600">Doações Confirmadas</div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-yellow-600 mb-1 tabular-nums">
              {donations.filter((d) => d.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Em Processamento</div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="lg:col-span-2">
              <label htmlFor="donor-search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                id="donor-search"
                type="text"
                placeholder="Buscar por projeto, protocolo ou mensagem..."
                className="input-modern h-12 !py-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="donor-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por status
              </label>
              <select
                id="donor-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-modern h-12 !py-0"
              >
                <option value="all">Todas ({donations.length})</option>
                <option value="completed">Confirmadas</option>
                <option value="pending">Em processamento</option>
                <option value="recurring">Recorrentes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma doação encontrada
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {searchTerm || filter !== 'all'
                  ? 'Ajuste os filtros acima para localizar outros registros.'
                  : 'Você ainda não possui doações vinculadas a esta conta.'}
              </p>
              <Link href="/projetos" className="btn-primary inline-block">
                Conhecer Projetos
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destino / Projeto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meio
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
                  {filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-left">
                        <div className="text-sm font-semibold text-gray-900">
                          {getDestination(donation)}
                        </div>
                        {donation.message && (
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                            {donation.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap tabular-nums text-sm font-semibold text-gray-900">
                        {formatCurrencyBRL(donation.amount)}
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(donation.status)}`}
                        >
                          {getDonationStatusLabelPTBR(donation.status)}
                        </span>
                        {donation.is_recurring && (
                          <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Recorrente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-700">
                        {normalizePaymentMethodLabel(donation.payment_method)}
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap tabular-nums text-xs text-gray-600">
                        {formatDate(donation.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDonation(donation)}
                            className="text-xs font-medium text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            Recibo
                          </button>
                          <Link
                            href={`/doacoes/${donation.id}`}
                            className="text-xs font-medium text-gray-800 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            Detalhes
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={Boolean(selectedDonation)}
        onClose={() => setSelectedDonation(null)}
        title="Recibo Oficial de Doação"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedDonation(null)}
              className="btn-secondary"
            >
              Fechar
            </button>
            {selectedDonation && (
              <button
                type="button"
                onClick={() => generateReceipt(selectedDonation)}
                className="btn-primary"
              >
                Baixar Recibo (.txt)
              </button>
            )}
          </div>
        }
      >
        {selectedDonation && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Instituição:</dt>
              <dd className="font-medium text-gray-900">Instituto Imagine</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">CNPJ:</dt>
              <dd className="font-medium text-gray-900 tabular-nums">{INSTITUTE_CNPJ}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Destino:</dt>
              <dd className="font-medium text-gray-900 text-right">
                {getDestination(selectedDonation)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Valor:</dt>
              <dd className="font-semibold text-gray-900 tabular-nums">
                {formatCurrencyBRL(selectedDonation.amount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Status:</dt>
              <dd className="font-medium text-gray-900">
                {getDonationStatusLabelPTBR(selectedDonation.status)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Data:</dt>
              <dd className="text-gray-900 tabular-nums">
                {formatDate(selectedDonation.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pt-2 border-t border-gray-100">
              <dt className="text-gray-500">ID da Doação:</dt>
              <dd className="font-mono text-xs text-gray-600 break-all text-right">
                {selectedDonation.id}
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  )
}
