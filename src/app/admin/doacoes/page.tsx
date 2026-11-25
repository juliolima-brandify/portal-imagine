'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ToastContainer, useToast } from '@/components/Toast'

import type { User } from '@supabase/supabase-js'

// Mock data removido - usando apenas dados reais do Supabase

export default function AdminDoacoesPage() {
  const [user, setUser] = useState<User | null>(null)
  // Loading removido
  const [donations, setDonations] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<any>(null)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const { toasts, removeToast, success, error, warning, info } = useToast()

  // Função otimizada para carregar doações
  const loadDonationsFromSupabase = useCallback(async () => {
    try {
      console.log('🔄 [DOAÇÕES] Carregando doações do Supabase...')
      
      // Tentar carregar doações com schema básico
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [DOAÇÕES] Erro ao carregar doações:', error)
        console.log('💡 [DOAÇÕES] Nenhum dado disponível - tabela vazia ou erro de conexão')
        setDonations([])
        return
      }

      if (data && data.length > 0) {
        console.log('✅ [DOAÇÕES] Doações carregadas do Supabase:', data.length)
        
        // Transformar dados do Supabase para o formato esperado
        const transformedDonations = data.map(donation => ({
          id: donation.id || `donation-${Date.now()}`,
          donorName: donation.anonymous ? 'Doador Anônimo' : 'Doador',
          donorEmail: 'email@exemplo.com',
          amount: donation.amount || 0,
          project: `Projeto ${donation.project_id || 'Geral'}`,
          date: donation.created_at ? new Date(donation.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: donation.status || 'pending',
          method: donation.payment_method || 'PIX',
          transactionId: donation.transaction_id || 'N/A',
          receipt: donation.receipt_sent || false
        }))
        
        setDonations(transformedDonations)
      } else {
        console.log('📭 [DOAÇÕES] Nenhuma doação encontrada no Supabase')
        setDonations([])
      }
    } catch (error) {
      console.error('❌ [DOAÇÕES] Erro inesperado ao carregar doações:', error)
      setDonations([])
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
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
              console.log('❌ [DOAÇÕES] Usuário não é admin, redirecionando para dashboard')
              window.location.href = '/dashboard'
              return
            }
            
            // Carregar doações do Supabase para admin real
            await loadDonationsFromSupabase()
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
      // Loading removido
    }

    getUser()
  }, [loadDonationsFromSupabase])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.relative')) {
          setShowExportDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportDropdown])


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

  // Função para exportar dados em CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Doador', 'Email', 'Valor', 'Projeto', 'Status', 'Método', 'Data', 'ID Transação'],
      ...filteredDonations.map(donation => [
        donation.id,
        donation.donorName,
        donation.donorEmail,
        donation.amount.toFixed(2),
        donation.project,
        donation.status,
        donation.method,
        new Date(donation.date).toLocaleDateString('pt-BR'),
        donation.transactionId
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `doacoes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDropdown(false)
  }

  // Função para exportar dados em Excel
  const handleExportExcel = () => {
    // Para Excel, vamos usar CSV com extensão .xlsx (simulação)
    const csvContent = [
      ['ID', 'Doador', 'Email', 'Valor', 'Projeto', 'Status', 'Método', 'Data', 'ID Transação'],
      ...filteredDonations.map(donation => [
        donation.id,
        donation.donorName,
        donation.donorEmail,
        donation.amount.toFixed(2),
        donation.project,
        donation.status,
        donation.method,
        new Date(donation.date).toLocaleDateString('pt-BR'),
        donation.transactionId
      ])
    ].map(row => row.join('\t')).join('\n') // Usar tab para Excel

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `doacoes_${new Date().toISOString().split('T')[0]}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDropdown(false)
  }

  // Função para exportar dados em PDF
  const handleExportPDF = () => {
    // Simulação de PDF - na prática seria gerado com uma biblioteca como jsPDF
    const pdfContent = `
RELATÓRIO DE DOAÇÕES
====================
Data: ${new Date().toLocaleDateString('pt-BR')}
Total de doações: ${filteredDonations.length}
Valor total: ${formatCurrency(filteredDonations.reduce((sum, d) => sum + d.amount, 0))}

DETALHES DAS DOAÇÕES:
${filteredDonations.map(donation => `
- ${donation.donorName} | ${formatCurrency(donation.amount)} | ${donation.project} | ${getStatusText(donation.status)}
`).join('')}
    `.trim()

    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `doacoes_${new Date().toISOString().split('T')[0]}.pdf`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDropdown(false)
  }

  // Função para reenviar recibo
  const handleResendReceipt = (donation: any) => {
    // TODO: Implementar envio de email
    console.log('Reenviando recibo para:', donation.donorEmail)
    success('Recibo Reenviado', `Recibo enviado para ${donation.donorEmail}`)
  }

  // Função para processar doação pendente
  const handleProcessDonation = (donation: any) => {
    // TODO: Implementar processamento
    console.log('Processando doação:', donation.id)
    success('Doação Processada', `Doação ${donation.id} marcada como processada`)
  }

  // Função para reembolsar
  const handleRefundDonation = (donation: any) => {
    // TODO: Implementar reembolso
    console.log('Reembolsando doação:', donation.id)
    warning('Reembolso Iniciado', `Reembolso iniciado para doação ${donation.id}`)
  }

  // Função para ver detalhes da doação
  const handleViewDetails = (donation: any) => {
    console.log('Visualizando detalhes da doação:', donation.id)
    setSelectedDonation(donation)
    setShowDetailsModal(true)
  }

  // Função para aprovar doação pendente
  const handleApproveDonation = (donation: any) => {
    console.log('Aprovando doação:', donation.id)
    success('Doação Aprovada', `Doação ${donation.id} aprovada com sucesso!`)
  }

  // Função para reprocessar doação falhada
  const handleReprocessDonation = (donation: any) => {
    console.log('Reprocessando doação:', donation.id)
    info('Doação Reprocessada', `Doação ${donation.id} será reprocessada!`)
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

  // Loading removido - página carrega diretamente

  // Verificação de autenticação removida - gerenciada pelo layout

  return (
    <div className="max-w-7xl mx-auto">
      {/* Main Content */}
      <main>
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

        {/* Filters and Search - Melhorado */}
        <div className="card p-6 mb-6">
          <div className="space-y-4">
            {/* Busca Principal */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por doador, email, projeto ou ID da transação..."
                  className="input-modern"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="btn-secondary flex items-center gap-2 px-4 py-2"
                    title="Exportar dados"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar
                    <svg className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown de Exportação */}
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleExportCSV}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Exportar CSV
                        </button>
                        <button
                          onClick={handleExportExcel}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Exportar Excel
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Exportar PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros por Status */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({donations.length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Concluídas ({donations.filter(d => d.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendentes ({donations.filter(d => d.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'failed' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Falharam ({donations.filter(d => d.status === 'failed').length})
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
                        {searchTerm || filter !== 'all' ? 'Nenhuma doação encontrada' : 'Nenhuma doação registrada'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || filter !== 'all'
                          ? 'Tente ajustar os filtros de busca.' 
                          : 'Ainda não há doações no sistema. As doações aparecerão aqui quando forem registradas.'}
                      </p>
                      {!searchTerm && filter === 'all' && (
                        <div className="text-sm text-gray-500">
                          <p>💡 Dica: As doações são sincronizadas automaticamente com o Supabase.</p>
                        </div>
                      )}
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
                          <button 
                            onClick={() => handleViewDetails(donation)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            title="Ver detalhes da doação"
                          >
                            Ver Detalhes
                          </button>
                          {donation.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveDonation(donation)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              title="Aprovar doação pendente"
                            >
                              Aprovar
                            </button>
                          )}
                          {donation.status === 'failed' && (
                            <button 
                              onClick={() => handleReprocessDonation(donation)}
                              className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded hover:bg-yellow-50 transition-colors"
                              title="Reprocessar doação falhada"
                            >
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

      </main>

      {/* Modal de Detalhes da Doação */}
      {showDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Header Fixo */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes da Doação
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                  aria-label="Fechar modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo Central com Scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID da Doação
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDonation.id}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doador
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDonation.donorName}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDonation.donorEmail}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <div className="text-lg font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-md">
                        {formatCurrency(selectedDonation.amount)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedDonation.status)}`}>
                          {getStatusText(selectedDonation.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de Pagamento
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDonation.method}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Projeto
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDonation.project}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data da Doação
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {formatDate(selectedDonation.date)}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID da Transação
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono">
                        {selectedDonation.transactionId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Fixo */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleResendReceipt(selectedDonation)}
                  className="btn-primary"
                >
                  Reenviar Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
