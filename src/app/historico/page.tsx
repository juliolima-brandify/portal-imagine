'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDonations, getUserStats } from '@/lib/database'
import { exportDonations } from '@/lib/export'

import type { User } from '@supabase/supabase-js'
import type { Donation } from '@/lib/database'

export default function HistoricoPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'project'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Primeiro, verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')

        if (demoEmail === 'demo@doador.com') {
          setUser({
            id: 'demo-user',
            email: demoEmail,
            user_metadata: { name: 'Doador Demo' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)

          // Dados mock para demo
          setDonations([
            {
              id: '1',
              user_id: 'demo-user',
              project_id: '1',
              amount: 150.00,
              currency: 'BRL',
              status: 'completed',
              payment_method: 'Cartão de Crédito',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_001',
              message: 'Doação de teste para educação.'
            },
            {
              id: '2',
              user_id: 'demo-user',
              project_id: '2',
              amount: 75.50,
              currency: 'BRL',
              status: 'completed',
              payment_method: 'PIX',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-10T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_002',
              message: 'Doação para saúde comunitária.'
            },
            {
              id: '3',
              user_id: 'demo-user',
              project_id: '3',
              amount: 200.00,
              currency: 'BRL',
              status: 'pending',
              payment_method: 'Boleto',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-20T10:00:00Z',
              updated_at: '2024-01-20T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_003',
              message: 'Doação para meio ambiente.'
            }
          ] as Donation[])

          setUserStats({
            totalDonated: 425.50,
            totalDonations: 3,
            lastDonation: '2024-01-20T10:00:00Z'
          })

          setLoading(false)
          return
        }

        // Se não for demo, tentar com Supabase
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Carregar doações reais
          const userDonations = await getDonations(user.id)
          setDonations(userDonations)

          // Carregar estatísticas
          const stats = await getUserStats(user.id)
          setUserStats(stats)
        }
      } catch (error) {
        console.log('Erro ao carregar dados:', error)
        window.location.href = '/auth'
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredDonations = donations.filter(donation => {
    const matchesFilter = filter === 'all' || donation.status === filter
    const matchesSearch = searchTerm === '' ||
                          donation.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por data
    const donationDate = new Date(donation.created_at)
    const now = new Date()
    let matchesDate = true
    
    if (dateRange !== 'all') {
      const daysAgo = {
        week: 7,
        month: 30,
        year: 365
      }[dateRange] || 0
      
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
      matchesDate = donationDate >= cutoffDate
    }
    
    return matchesFilter && matchesSearch && matchesDate
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'project':
        comparison = a.project_id.localeCompare(b.project_id)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'pending': return 'Pendente'
      case 'failed': return 'Falhou'
      case 'refunded': return 'Reembolsada'
      default: return 'Desconhecido'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cartão de crédito':
      case 'cartão':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
      case 'pix':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'boleto':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Histórico Detalhado de Doações
          </h1>
          <p className="text-gray-600">
            Acompanhe todas as suas doações com filtros avançados e análises detalhadas.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(userStats?.totalDonated || 0)}
            </div>
            <div className="text-sm text-gray-600">
              Total Doado
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {userStats?.totalDonations || 0}
            </div>
            <div className="text-sm text-gray-600">
              Total de Doações
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {donations.filter(d => d.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">
              Pendentes
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">
              Concluídas
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="ID da transação..."
                className="input-modern"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="input-modern"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="completed">Concluídas</option>
                <option value="pending">Pendentes</option>
                <option value="failed">Falharam</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                className="input-modern"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
                <option value="year">Último ano</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="flex space-x-2">
                <select
                  className="input-modern flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="date">Data</option>
                  <option value="amount">Valor</option>
                  <option value="project">Projeto</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="space-y-4">
          {filteredDonations.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma doação encontrada
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' || dateRange !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Você ainda não fez nenhuma doação.'}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div key={donation.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {getPaymentMethodIcon(donation.payment_method || '')}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Projeto ID: {donation.project_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(donation.created_at)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(donation.status)}`}>
                        {getStatusText(donation.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Valor:</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(donation.amount)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Método:</span>
                        <p className="text-gray-600">{donation.payment_method || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Recorrente:</span>
                        <p className="text-gray-600">
                          {donation.is_recurring ? 'Sim' : 'Não'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Anônima:</span>
                        <p className="text-gray-600">
                          {donation.anonymous ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>
                    
                    {donation.stripe_payment_intent_id && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-medium">ID da Transação:</span> {donation.stripe_payment_intent_id}
                      </div>
                    )}
                    
                    {donation.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Mensagem:</span>
                        <p className="text-gray-600 mt-1">{donation.message}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <Link 
                      href={`/doacoes/${donation.id}`} 
                      className="btn-secondary text-sm"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export Options */}
        <div className="mt-12 text-center">
          <div className="card p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Exportar Dados
            </h3>
            <p className="text-gray-600 mb-6">
              Baixe seu histórico de doações em diferentes formatos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="btn-secondary"
                onClick={() => exportDonations(donations, { format: 'csv' })}
              >
                Exportar CSV
              </button>
              <button 
                className="btn-secondary"
                onClick={() => exportDonations(donations, { format: 'pdf' })}
              >
                Gerar PDF
              </button>
              <button 
                className="btn-secondary"
                onClick={() => exportDonations(donations, { format: 'excel' })}
              >
                Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
