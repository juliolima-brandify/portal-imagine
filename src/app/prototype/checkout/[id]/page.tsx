'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProject } from '@/lib/database'
import type { User } from '@supabase/supabase-js'
import type { Project } from '@/lib/database'

// Projetos reais do CMS do Framer (fallback)
const mockProjects = [
  {
    id: 'bdfd300b-9138-4def-bde1-9d769e1d9e30',
    title: 'Educação Transformadora',
    description: 'Projetos que transformam vidas através da educação, levando conhecimento e oportunidades para comunidades carentes.',
    longDescription: 'Este projeto visa transformar vidas através da educação, criando oportunidades de aprendizado e desenvolvimento em comunidades carentes. Inclui capacitação de professores, fornecimento de materiais educativos e criação de espaços de aprendizado adequados.',
    category: 'educacao',
    targetAmount: 75000,
    currentAmount: 52000,
    status: 'ativo',
    location: 'São Paulo, SP',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    impact: {
      students: 800,
      schools: 15,
      teachers: 75
    },
    timeline: '8 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: 'f9529225-4b6d-400b-b58a-3b7b32260450',
    title: 'Saúde e Bem Estar',
    description: 'Promovendo saúde e bem-estar através de atendimento médico, prevenção e conscientização em comunidades vulneráveis.',
    longDescription: 'Projeto que promove saúde e bem-estar em comunidades vulneráveis através de atendimento médico, campanhas de prevenção, vacinação e conscientização sobre hábitos saudáveis.',
    category: 'saude',
    targetAmount: 60000,
    currentAmount: 38000,
    status: 'ativo',
    location: 'Bahia, BA',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center',
    impact: {
      patients: 1200,
      communities: 20,
      healthWorkers: 35
    },
    timeline: '10 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: 'eea882e5-cb66-4688-a1c9-58f939a4b65e',
    title: 'Arte que Transforma',
    description: 'Usando a arte como ferramenta de transformação social, desenvolvendo talentos e promovendo cultura em comunidades.',
    longDescription: 'Projeto que utiliza a arte como ferramenta de transformação social, desenvolvendo talentos artísticos, promovendo cultura e criando oportunidades de expressão em comunidades carentes.',
    category: 'arte',
    targetAmount: 45000,
    currentAmount: 28000,
    status: 'ativo',
    location: 'Rio de Janeiro, RJ',
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&crop=center',
    impact: {
      artists: 300,
      workshops: 25,
      exhibitions: 8
    },
    timeline: '6 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Esporte e Cidadania',
    description: 'Desenvolvendo cidadania através do esporte, promovendo valores, disciplina e oportunidades para jovens.',
    longDescription: 'Projeto que desenvolve cidadania através do esporte, promovendo valores como disciplina, trabalho em equipe e superação, criando oportunidades para jovens em situação de vulnerabilidade.',
    category: 'esporte',
    targetAmount: 55000,
    currentAmount: 32000,
    status: 'ativo',
    location: 'Minas Gerais, MG',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center',
    impact: {
      athletes: 400,
      teams: 20,
      competitions: 12
    },
    timeline: '7 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    title: 'Apoio Social e Comunitário',
    description: 'Fortalecendo comunidades através de apoio social, capacitação e desenvolvimento comunitário sustentável.',
    longDescription: 'Projeto que fortalece comunidades através de apoio social, capacitação profissional, desenvolvimento comunitário sustentável e criação de redes de apoio mútuo.',
    category: 'social',
    targetAmount: 80000,
    currentAmount: 45000,
    status: 'ativo',
    location: 'Pernambuco, PE',
    imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop&crop=center',
    impact: {
      families: 500,
      communities: 12,
      volunteers: 80
    },
    timeline: '12 meses',
    organization: 'Instituto Imagine'
  }
]

const donationAmounts = [25, 50, 100, 200, 500, 1000]

export default function PrototypeCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'card' | 'pix'>('card')
  
  const [donationData, setDonationData] = useState({
    amount: '50',
    customAmount: '',
    isRecurring: false,
    frequency: 'monthly',
    anonymous: false,
    message: '',
    name: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

         const loadProject = async () => {
           const projectId = params.id as string
           console.log('🔍 Carregando projeto com ID:', projectId)
           console.log('🔍 URL completa:', window.location.href)
           console.log('🔍 Parâmetros da URL:', new URLSearchParams(window.location.search))
           
           try {
             console.log('🔍 Tentando carregar projeto com ID:', projectId)
             console.log('🔍 Tipo do ID:', typeof projectId)
             console.log('🔍 ID length:', projectId.length)
             
             const projectData = await getProject(projectId)
             console.log('📋 Dados retornados:', projectData)
             console.log('📋 Tipo dos dados:', typeof projectData)
             console.log('📋 É null?', projectData === null)
             console.log('📋 É undefined?', projectData === undefined)
             
             if (projectData) {
               console.log('✅ Projeto carregado:', projectData.title)
               setProject(projectData)
             } else {
               console.error('❌ Projeto não encontrado:', projectId)
               console.error('❌ Dados retornados:', projectData)
               
               // Fallback: usar projeto mock padrão se não encontrar
               console.log('🔄 Tentando usar projeto mock padrão...')
               const fallbackProject = {
                 id: projectId,
                 title: 'Projeto de Doação',
                 description: 'Este é um projeto de doação para apoiar nossa causa.',
                 target_amount: 10000,
                 current_amount: 0,
                 image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop',
                 category: 'Geral',
                 status: 'active',
                 location: 'Brasil',
                 created_at: new Date().toISOString()
               }
               
               console.log('✅ Usando projeto fallback:', fallbackProject.title)
               setProject(fallbackProject)
             }
           } catch (error) {
             console.error('❌ Erro ao carregar projeto:', error)
             console.error('❌ Stack trace:', (error as Error).stack)
             setError('Erro ao carregar projeto')
           } finally {
             setLoading(false)
           }
         }

    fetchUser()
    loadProject()
  }, [params.id])

  const handleAmountChange = (amount: string) => {
    setDonationData(prev => ({
      ...prev,
      amount,
      customAmount: ''
    }))
  }

  const handleCustomAmountChange = (value: string) => {
    setDonationData(prev => ({
      ...prev,
      amount: 'custom',
      customAmount: value
    }))
  }

  const handleRecurringToggle = () => {
    setDonationData(prev => ({
      ...prev,
      isRecurring: !prev.isRecurring,
      frequency: !prev.isRecurring ? 'monthly' : prev.frequency
    }))
  }

  const handleAnonymousToggle = () => {
    setDonationData(prev => ({
      ...prev,
      anonymous: !prev.anonymous
    }))
  }

  const handleMessageToggle = () => {
    setDonationData(prev => ({
      ...prev,
      message: prev.message ? '' : 'Mensagem de apoio ao projeto!'
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setDonationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    handleInputChange('cardNumber', formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value)
    handleInputChange('expiry', formatted)
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    handleInputChange('cvc', value)
  }

  const validateForm = () => {
    if (!donationData.name.trim()) {
      setPaymentError('Nome é obrigatório')
      return false
    }
    if (!donationData.email.trim()) {
      setPaymentError('Email é obrigatório')
      return false
    }
    if (!donationData.email.includes('@')) {
      setPaymentError('Email inválido')
      return false
    }
    if (activeTab === 'card') {
      if (!donationData.cardNumber.replace(/\s/g, '')) {
        setPaymentError('Número do cartão é obrigatório')
        return false
      }
      if (!donationData.expiry) {
        setPaymentError('Data de validade é obrigatória')
        return false
      }
      if (!donationData.cvc) {
        setPaymentError('CVC é obrigatório')
        return false
      }
    }
    
    return true
  }

  const handleContinue = async () => {
    setPaymentError(null)
    setProcessing(true)
    
    console.log('🚀 Iniciando processamento da doação...')
    
    if (!validateForm()) {
      console.log('❌ Validação do formulário falhou')
      setProcessing(false)
      return
    }
    
    console.log('✅ Formulário validado com sucesso')
    
    try {
      // Preparar dados para envio (só incluir recorrência se marcada)
      const requestData: any = {
        amount: getDonationAmount(),
        projectId: project.id,
        message: donationData.message,
        anonymous: donationData.anonymous,
        userName: donationData.name,
        userEmail: donationData.email
      }

      // Só adicionar dados de recorrência se estiver marcado
      if (donationData.isRecurring) {
        requestData.isRecurring = true
        requestData.recurringFrequency = donationData.frequency
      }

      console.log('📤 Enviando dados para API...')
      console.log('📊 Dados da doação:', {
        ...requestData,
        projectTitle: project.title
      })
      
      // Criar Payment Intent diretamente
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('📥 Resposta recebida da API:', response.status, response.statusText)
      
      const result = await response.json()
      console.log('📋 Resultado da API:', result)

      if (result.success) {
        console.log('✅ Doação criada com sucesso!')
        console.log('📊 Dados da doação criada:', result.data)
        console.log('🔄 Redirecionando para página de sucesso...')
        
        // Redirecionar para página de sucesso
        router.push(`/doacao-sucesso?donationId=${result.data.donationId}`)
        setProcessing(false) // Parar o loading antes do redirecionamento
      } else {
        console.error('❌ Erro na resposta da API:', result)
        setPaymentError(result.error || 'Erro ao processar pagamento')
        setProcessing(false)
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error)
      console.error('📋 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
      setPaymentError('Erro ao processar pagamento. Tente novamente.')
      setProcessing(false)
    }
  }

  const getDonationAmount = () => {
    if (donationData.amount === 'custom') {
      return parseFloat(donationData.customAmount) || 0
    }
    return parseFloat(donationData.amount) || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <Link href="/" className="text-green-600 hover:text-green-700">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <img src="/images/logo.png" alt="Logo" className="h-8 w-auto" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Project Info & Donation Amount */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Arrecadado</span>
                  <span className="text-sm font-medium text-gray-900">
                    R$ {project.currentAmount.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(project.currentAmount / project.targetAmount) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Meta: R$ {project.targetAmount.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-500">
                    {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Escolha o valor da doação</h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountChange(amount.toString())}
                    className={`p-4 rounded-full border-2 text-center font-semibold transition-all duration-200 ${
                      donationData.amount === amount.toString()
                        ? 'border-green-500 bg-green-50 text-green-600 shadow-md'
                        : 'border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    R$ {amount}
                  </button>
                ))}
              </div>
              
              {/* Custom Amount */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou digite um valor personalizado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={donationData.customAmount ? `R$ ${donationData.customAmount}` : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace('R$ ', '').replace(/[^0-9,]/g, '')
                      handleCustomAmountChange(value)
                    }}
                    placeholder="R$ 0,00"
                    className="input-modern w-full"
                  />
                </div>
              </div>
              
              {/* Recurring Donation Toggle - iPhone Style */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Doação recorrente
                    </span>
                    <p className="text-xs text-gray-500">
                      Repetir automaticamente
                    </p>
                  </div>
                  <button
                    onClick={handleRecurringToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      donationData.isRecurring ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        donationData.isRecurring ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Frequency Selector - Only show when recurring is enabled */}
                {donationData.isRecurring && (
                  <div className="mt-3 transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência
                    </label>
                    <select
                      value={donationData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="input-modern w-full"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Anonymous Donation Toggle */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Doação anônima
                    </span>
                    <p className="text-xs text-gray-500">
                      Não exibir meu nome
                    </p>
                  </div>
                  <button
                    onClick={handleAnonymousToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      donationData.anonymous ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        donationData.anonymous ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Message Toggle */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Adicionar mensagem
                    </span>
                    <p className="text-xs text-gray-500">
                      Deixar uma mensagem de apoio
                    </p>
                  </div>
                  <button
                    onClick={handleMessageToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      donationData.message ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        donationData.message ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Message Field - Only show when message is enabled */}
                {donationData.message && (
                  <div className="mt-3 transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sua mensagem
                    </label>
                    <textarea
                      value={donationData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Deixe uma mensagem de apoio ao projeto..."
                      rows={3}
                      className="input-modern w-full resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Personal & Payment Details */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Finalizar doação</h2>
            
            {/* Contact Details */}
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">Dados de contato</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={donationData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    className="input-modern w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={donationData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">Método de pagamento</h3>
              
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'card'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  Cartão
                </button>
                <button
                  onClick={() => setActiveTab('pix')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'pix'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  PIX
                </button>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                {activeTab === 'card' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Número do cartão
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={donationData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="input-modern w-full pr-20"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzAwNTFBNyIvPgo8cGF0aCBkPSJNOCA0SDZWNkg4VjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTggNEgxNlY2SDE4VjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgNEgxMFY2SDEyVjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="Visa" className="w-6 h-4" />
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iI0VCMjEzMiIvPgo8cGF0aCBkPSJNOCA0SDZWNkg4VjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTggNEgxNlY2SDE4VjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgNEgxMFY2SDEyVjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="Mastercard" className="w-6 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={donationData.expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / AA"
                          maxLength={7}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={donationData.cvc}
                          onChange={handleCvcChange}
                          placeholder="123"
                          maxLength={4}
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">PIX</h4>
                    <p className="text-gray-600 text-sm">
                      O código PIX será gerado após confirmar a doação
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={processing}
              className="w-full mb-4 px-6 py-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processando...' : 'Finalizar doação'}
            </button>

            {/* Security Seal */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Pagamento seguro</span>
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA2MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzYzNTBGRiIvPgo8dGV4dCB4PSIzMCIgeT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlN0cmlwZTwvdGV4dD4KPC9zdmc+" alt="Stripe" className="h-4" />
              </div>
            </div>
            
            {paymentError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{paymentError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
