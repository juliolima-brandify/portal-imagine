'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDonations, getUserStats } from '@/lib/database'
import type { User } from '@supabase/supabase-js'
import type { Donation } from '@/lib/database'
import Header from '@/components/Header'

export default function DoacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')

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
          
          // Carregar dados mock para demo
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
              updated_at: '2024-01-15T10:00:00Z'
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
              updated_at: '2024-01-10T10:00:00Z'
            }
          ] as Donation[])
          
          setUserStats({
            totalDonated: 225.50,
            totalDonations: 2,
            lastDonation: '2024-01-15T10:00:00Z'
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
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
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
      default:
        return 'Desconhecido'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Acesso Negado</h1>
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
      <Header 
        user={user ? {
          id: user.id,
          name: user.user_metadata?.name,
          email: user.email,
          role: 'donor'
        } : undefined}
        onSignOut={() => {
          // Redirecionar para auth
          window.location.href = '/auth'
        }}
        showAuth={false}
        showBackToMain={true}
      />

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalDonated)}
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
              Doações Concluídas
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {donations.filter(d => d.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">
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
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Você ainda não fez nenhuma doação.'}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div key={donation.id} className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Projeto ID: {donation.project_id}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(donation.status)}`}>
                        {getStatusText(donation.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Valor:</span> {formatCurrency(donation.amount)}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span> {formatDate(donation.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Método:</span> {donation.payment_method || 'N/A'}
                      </div>
                    </div>
                    {donation.stripe_payment_intent_id && (
                      <div className="mt-2 text-xs text-gray-500">
                        ID: {donation.stripe_payment_intent_id}
                      </div>
                    )}
                    {donation.message && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Mensagem:</span> {donation.message}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <Link href={`/doacoes/${donation.id}`} className="btn-secondary text-sm">
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))
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
    </div>
  )
}
