'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockDonationDetails = {
  id: '1',
  amount: 150.00,
  project: 'Educação Infantil',
  projectDescription: 'Projeto focado em melhorar a educação de crianças de 3 a 6 anos em comunidades carentes, fornecendo materiais didáticos, capacitação de professores e infraestrutura básica.',
  date: '2024-01-15',
  status: 'completed',
  method: 'Cartão de Crédito',
  transactionId: 'TXN-001-2024',
  donor: {
    name: 'João Silva',
    email: 'joao@exemplo.com'
  },
  impact: {
    childrenHelped: 25,
    teachersTrained: 3,
    materialsProvided: 150
  },
  receipt: {
    url: '#',
    number: 'REC-001-2024'
  }
}

export default function DoacaoDetailPage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donation, setDonation] = useState(mockDonationDetails)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
      }
      setLoading(false)
    }

    getUser()
  }, [])

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
      day: 'numeric'
    })
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
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <img 
                  src="/images/logo.png" 
                  alt="Instituto Imagine" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    // Fallback se o logo não estiver disponível
                    e.currentTarget.style.display = 'none'
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                    if (nextElement) {
                      nextElement.style.display = 'block'
                    }
                  }}
                />
                <span className="text-xl font-semibold text-gray-900 hidden">
                  Instituto Imagine
                </span>
              </Link>
              <span className="ml-4 text-gray-500 font-medium">Detalhes da Doação</span>
            </div>
            <Link href="/doacoes" className="btn-secondary">
              Voltar às Doações
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Doação #{donation.transactionId}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(donation.status)}`}>
              {getStatusText(donation.status)}
            </span>
          </div>
          <p className="text-gray-600">
            Detalhes completos da sua doação para o projeto {donation.project}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donation Details */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações da Doação</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor</label>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(donation.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data</label>
                  <p className="text-lg text-gray-900">{formatDate(donation.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                  <p className="text-lg text-gray-900">{donation.method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID da Transação</label>
                  <p className="text-lg text-gray-900 font-mono">{donation.transactionId}</p>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Projeto Apoiado</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{donation.project}</h3>
              <p className="text-gray-600 mb-4">{donation.projectDescription}</p>
              <Link href="/projetos" className="text-blue-600 hover:text-blue-700 font-medium">
                Ver mais projetos →
              </Link>
            </div>

            {/* Impact */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Impacto da Sua Doação</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {donation.impact.childrenHelped}
                  </div>
                  <div className="text-sm text-green-700">Crianças Ajudadas</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {donation.impact.teachersTrained}
                  </div>
                  <div className="text-sm text-blue-700">Professores Capacitados</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {donation.impact.materialsProvided}
                  </div>
                  <div className="text-sm text-purple-700">Materiais Fornecidos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  Baixar Recibo
                </button>
                <button className="btn-secondary w-full">
                  Compartilhar
                </button>
                <Link href="/projetos" className="btn-accent w-full block text-center">
                  Fazer Nova Doação
                </Link>
              </div>
            </div>

            {/* Receipt Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recibo</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Número:</span>
                  <p className="text-gray-900">{donation.receipt.number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <p className="text-green-600">Disponível</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Precisa de Ajuda?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tem alguma dúvida sobre sua doação? Nossa equipe está aqui para ajudar.
              </p>
              <button className="btn-secondary w-full">
                Entrar em Contato
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
