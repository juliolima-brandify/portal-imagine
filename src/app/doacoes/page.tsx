'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDonations, getUserStats } from '@/lib/database'
import type { User } from '@supabase/supabase-js'
import type { Donation } from '@/lib/database'

export default function DoacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'recurring'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Primeiro, verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org' || demoEmail === 'volunteer@institutoimagine.org') {
          setUser({
            id: '00000000-0000-0000-0000-000000000001',
            email: demoEmail,
            user_metadata: { 
              name: demoEmail === 'admin@institutoimagine.org' ? 'Admin Demo' : 
                    demoEmail === 'volunteer@institutoimagine.org' ? 'Voluntário Demo' : 
                    'Doador Demo' 
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          
          // Carregar dados reais do Supabase para demo
          try {
            const userDonations = await getDonations('00000000-0000-0000-0000-000000000001')
            setDonations(userDonations)
            
            const stats = await getUserStats('00000000-0000-0000-0000-000000000001')
            setUserStats(stats)
          } catch (error) {
            console.log('Erro ao carregar dados do Supabase para demo:', error)
            setDonations([])
            setUserStats({
              totalDonated: 0,
              totalDonations: 0,
              averageDonation: 0
            })
          }
        } else {
          // Usuário real - autenticação com Supabase
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUser(user)
            
            // Carregar doações reais do Supabase
            const userDonations = await getDonations(user.id)
            setDonations(userDonations)
            
            // Carregar estatísticas reais
            const stats = await getUserStats(user.id)
            setUserStats(stats)
          } else {
            // Se não conseguir obter usuário, redirecionar para login
            window.location.href = '/auth'
          }
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
    let matchesFilter = true
    
    if (filter === 'completed') {
      matchesFilter = donation.status === 'completed'
    } else if (filter === 'pending') {
      matchesFilter = donation.status === 'pending'
    } else if (filter === 'recurring') {
      matchesFilter = donation.is_recurring === true
    }
    
    const matchesSearch = searchTerm === '' || 
                         donation.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.message?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const totalDonated = userStats?.totalDonated || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleReceipt = (donation: Donation) => {
    setSelectedDonation(donation)
    setShowReceipt(true)
  }

  const generateReceipt = () => {
    if (!selectedDonation) return

    const receiptContent = `
      RECIBO DE DOAÇÃO
      
      Instituto Imagine
      CNPJ: 12.345.678/0001-90
      
      Doador: ${user?.user_metadata?.name || 'Anônimo'}
      Email: ${user?.email}
      
      Doação ID: ${selectedDonation.id}
      Valor: ${formatCurrency(selectedDonation.amount)}
      Status: ${selectedDonation.status === 'completed' ? 'Concluída' : 'Pendente'}
      Método: ${selectedDonation.payment_method}
      Data: ${formatDate(selectedDonation.created_at)}
      
      ${selectedDonation.message ? `Mensagem: ${selectedDonation.message}` : ''}
      
      ${selectedDonation.is_recurring ? 'Doação Recorrente: Sim' : 'Doação Recorrente: Não'}
      ${selectedDonation.anonymous ? 'Doação Anônima: Sim' : 'Doação Anônima: Não'}
    `

    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo_doacao_${selectedDonation.id}.txt`
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
        return 'bg-yellow-100 text-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'refunded':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsada'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando doações...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="mb-4 text-gray-600">Você precisa estar logado para acessar esta página.</p>
          <Link href="/auth" className="btn-primary">
            Fazer Login
          </Link>
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
            Minhas Doações
          </h1>
          <p className="text-gray-600">
            Acompanhe o histórico de suas doações e o impacto que você está causando.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="card p-4 md:p-6">
            <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalDonated)}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Total Doado
            </div>
          </div>
          <div className="card p-4 md:p-6">
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
              {userStats?.totalDonations || 0}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Doações Concluídas
            </div>
          </div>
          <div className="card p-4 md:p-6">
            <div className="text-xl md:text-2xl font-bold text-yellow-600 mb-1">
              {donations.filter(d => d.status === 'pending').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Doações Pendentes
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por projeto ou ID da transação..."
                className="input-modern"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Concluídas
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilter('recurring')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'recurring' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recorrentes
              </button>
            </div>
          </div>
        </div>

        {/* Donations Table - Seguindo padrão Admin */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma doação encontrada
              </h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Você ainda não fez nenhuma doação.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projeto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Projeto ID: {donation.project_id}
                        </div>
                        {donation.message && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {donation.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(donation.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(donation.status)}`}>
                          {getStatusText(donation.status)}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {donation.is_recurring && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🔄 Recorrente
                            </span>
                          )}
                          {donation.anonymous && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              👤 Anônima
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(donation.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleReceipt(donation)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            📄 Recibo
                          </button>
                          <Link 
                            href={`/doacoes/${donation.id}`} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Ver Detalhes
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

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="card p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quer fazer uma nova doação?
            </h3>
            <p className="text-gray-600 mb-6">
              Descubra novos projetos e continue fazendo a diferença.
            </p>
            <Link href="/projetos" className="btn-primary">
              Ver Projetos Disponíveis
            </Link>
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {showReceipt && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gerar Recibo
            </h3>
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium text-gray-700">Doação ID:</span>
                <span className="ml-2 text-gray-900">{selectedDonation.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Valor:</span>
                <span className="ml-2 text-gray-900">{formatCurrency(selectedDonation.amount)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Data:</span>
                <span className="ml-2 text-gray-900">{formatDate(selectedDonation.created_at)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 text-gray-900">
                  {selectedDonation.status === 'completed' ? 'Concluída' : 'Pendente'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateReceipt}
                className="flex-1 btn-primary"
              >
                📄 Baixar Recibo
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}