'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockDonations = [
  {
    id: '1',
    donorName: 'João Silva',
    donorEmail: 'joao@exemplo.com',
    amount: 150.00,
    project: 'Educação Infantil',
    date: '2024-01-15',
    status: 'completed',
    method: 'Cartão de Crédito',
    transactionId: 'TXN-001-2024',
    processedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    donorName: 'Maria Santos',
    donorEmail: 'maria@exemplo.com',
    amount: 75.50,
    project: 'Alimentação Escolar',
    date: '2024-01-14',
    status: 'completed',
    method: 'PIX',
    transactionId: 'TXN-002-2024',
    processedAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '3',
    donorName: 'Pedro Costa',
    donorEmail: 'pedro@exemplo.com',
    amount: 200.00,
    project: 'Construção de Biblioteca',
    date: '2024-01-13',
    status: 'pending',
    method: 'Boleto',
    transactionId: 'TXN-003-2024',
    processedAt: null
  },
  {
    id: '4',
    donorName: 'Ana Oliveira',
    donorEmail: 'ana@exemplo.com',
    amount: 100.00,
    project: 'Alimentação Escolar',
    date: '2024-01-12',
    status: 'completed',
    method: 'Cartão de Crédito',
    transactionId: 'TXN-004-2024',
    processedAt: '2024-01-12T09:15:00Z'
  },
  {
    id: '5',
    donorName: 'Carlos Mendes',
    donorEmail: 'carlos@exemplo.com',
    amount: 300.00,
    project: 'Educação Infantil',
    date: '2024-01-11',
    status: 'failed',
    method: 'Cartão de Crédito',
    transactionId: 'TXN-005-2024',
    processedAt: null
  }
]

export default function AdminDoacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState(mockDonations)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const getUser = async () => {
      // Primeiro, verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
      if (demoEmail === 'admin@institutoimagine.org') {
        setUser({
          id: 'demo-admin',
          email: demoEmail,
          user_metadata: { name: 'Admin Demo' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Verificar se é admin
        if (user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (profile?.role !== 'admin') {
              window.location.href = '/dashboard'
              return
            }
          } catch (profileError) {
            // Se não conseguir buscar o perfil, assumir que não é admin
            console.log('Erro ao buscar perfil:', profileError)
            window.location.href = '/dashboard'
            return
          }
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const filteredDonations = donations.filter(donation => {
    const matchesFilter = filter === 'all' || donation.status === filter
    const matchesSearch = donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
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
      default:
        return 'Desconhecido'
    }
  }

  const totalAmount = donations
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0)

  const pendingAmount = donations
    .filter(d => d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0)

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
          role: 'admin'
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Doações
          </h1>
          <p className="text-gray-600">
            Acompanhe e gerencie todas as doações recebidas pelo Instituto.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {donations.length}
            </div>
            <div className="text-sm text-gray-600">
              Total de Doações
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-gray-600">
              Total Arrecadado
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {formatCurrency(pendingAmount)}
            </div>
            <div className="text-sm text-gray-600">
              Pendente
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {donations.filter(d => d.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">
              Concluídas
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por doador, projeto ou ID da transação..."
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
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'failed' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Falharam
              </button>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="card overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
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
                          : 'Nenhuma doação registrada ainda.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {donation.donorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.donorEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.project}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(donation.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(donation.status)}`}>
                          {getStatusText(donation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(donation.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            Ver Detalhes
                          </button>
                          {donation.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-900">
                              Aprovar
                            </button>
                          )}
                          {donation.status === 'failed' && (
                            <button className="text-yellow-600 hover:text-yellow-900">
                              Reprocessar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 flex justify-center">
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exportar Dados
            </h3>
            <p className="text-gray-600 mb-4">
              Baixe relatórios de doações em diferentes formatos.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary">
                Exportar Excel
              </button>
              <button className="btn-secondary">
                Exportar CSV
              </button>
              <button className="btn-secondary">
                Relatório PDF
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
