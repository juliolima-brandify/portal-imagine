'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockProjects = [
  {
    id: '1',
    title: 'Educação Digital',
    description: 'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
    longDescription: 'Este projeto visa criar laboratórios de informática em escolas públicas de comunidades carentes, fornecendo computadores, internet e capacitação para professores. O objetivo é reduzir a desigualdade digital e preparar os estudantes para o futuro tecnológico.',
    category: 'educacao',
    targetAmount: 60000,
    currentAmount: 45000,
    status: 'ativo',
    location: 'São Paulo, SP',
    imageUrl: '/api/placeholder/600/400',
    impact: {
      students: 500,
      schools: 10,
      teachers: 50
    },
    timeline: '6 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: '2',
    title: 'Saúde Comunitária',
    description: 'Clínicas móveis levando saúde básica, exames e vacinação para regiões remotas.',
    longDescription: 'Projeto que leva atendimento médico básico para comunidades rurais e periféricas através de clínicas móveis equipadas. Inclui consultas, exames preventivos, vacinação e orientação sobre saúde preventiva.',
    category: 'saude',
    targetAmount: 50000,
    currentAmount: 32000,
    status: 'ativo',
    location: 'Bahia, BA',
    imageUrl: '/api/placeholder/600/400',
    impact: {
      patients: 1000,
      communities: 15,
      healthWorkers: 25
    },
    timeline: '8 meses',
    organization: 'Instituto Imagine'
  },
  {
    id: '3',
    title: 'Meio Ambiente',
    description: 'Reflorestamento e conscientização ambiental em escolas públicas.',
    longDescription: 'Projeto de reflorestamento em áreas degradadas com envolvimento de estudantes e comunidade. Inclui plantio de árvores nativas, educação ambiental e criação de viveiros comunitários.',
    category: 'meio-ambiente',
    targetAmount: 30000,
    currentAmount: 18000,
    status: 'ativo',
    location: 'Amazonas, AM',
    imageUrl: '/api/placeholder/600/400',
    impact: {
      trees: 2000,
      students: 300,
      communities: 5
    },
    timeline: '12 meses',
    organization: 'Instituto Imagine'
  }
]

const donationAmounts = [50, 100, 250, 500, 1000, 2500]

export default function DoarPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [donationData, setDonationData] = useState({
    amount: '',
    customAmount: '',
    isRecurring: false,
    frequency: 'monthly',
    message: '',
    anonymous: false,
    email: '',
    name: ''
  })
  const [step, setStep] = useState(1) // 1: Amount, 2: Details, 3: Payment
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const getUser = async () => {
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
        setDonationData(prev => ({ ...prev, email: demoEmail, name: 'Doador Demo' }))
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          setDonationData(prev => ({ 
            ...prev, 
            email: user.email || '', 
            name: user.user_metadata?.name || '' 
          }))
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        // Não redirecionar, permitir doação anônima
      }
      setLoading(false)
    }

    getUser()
  }, [])

  useEffect(() => {
    // Buscar projeto
    const foundProject = mockProjects.find(p => p.id === params.id)
    if (foundProject) {
      setProject(foundProject)
    } else {
      router.push('/projetos')
    }
  }, [params.id, router])

  const handleAmountSelect = (amount: number) => {
    setDonationData(prev => ({ 
      ...prev, 
      amount: amount.toString(),
      customAmount: ''
    }))
  }

  const handleCustomAmount = (value: string) => {
    setDonationData(prev => ({ 
      ...prev, 
      customAmount: value,
      amount: ''
    }))
  }

  const getFinalAmount = () => {
    return donationData.customAmount || donationData.amount
  }

  const handleNext = () => {
    if (step === 1 && getFinalAmount()) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleDonate = async () => {
    setProcessing(true)
    
    try {
      // Simular processamento de doação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Aqui você integraria com o Stripe
      console.log('Processando doação:', {
        projectId: project.id,
        ...donationData,
        amount: getFinalAmount()
      })
      
      // Redirecionar para página de sucesso
      router.push(`/doacao-sucesso?project=${project.id}&amount=${getFinalAmount()}`)
    } catch (error) {
      console.error('Erro ao processar doação:', error)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <Link href="/projetos" className="btn-primary">
            Ver Projetos
          </Link>
        </div>
      </div>
    )
  }

  const progress = (project.currentAmount / project.targetAmount) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/projetos" className="flex items-center space-x-3">
                <img 
                  src="/images/logo.png" 
                  alt="Instituto Imagine" 
                  className="h-10 w-auto"
                />
                <span className="text-xl font-semibold text-gray-900">
                  Instituto Imagine
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/projetos?demo_email=demo@doador.com" className="btn-secondary">
                Voltar aos Projetos
              </Link>
              {user && (
                <Link href="/dashboard?demo_email=demo@doador.com" className="btn-primary">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="mb-6">
                <img 
                  src={project.imageUrl} 
                  alt={project.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                <p className="text-lg text-gray-600 mb-6">{project.description}</p>
                <p className="text-gray-700 mb-6">{project.longDescription}</p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso</span>
                  <span className="text-sm font-medium text-gray-700">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gray-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>R$ {project.currentAmount.toLocaleString('pt-BR')}</span>
                  <span>R$ {project.targetAmount.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Impact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(project.impact).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{String(value)}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {key === 'students' ? 'Estudantes' :
                       key === 'schools' ? 'Escolas' :
                       key === 'teachers' ? 'Professores' :
                       key === 'patients' ? 'Pacientes' :
                       key === 'communities' ? 'Comunidades' :
                       key === 'healthWorkers' ? 'Profissionais' :
                       key === 'trees' ? 'Árvores' : key}
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Localização:</span>
                  <span className="ml-2 text-gray-600">{project.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duração:</span>
                  <span className="ml-2 text-gray-600">{project.timeline}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Categoria:</span>
                  <span className="ml-2 text-gray-600 capitalize">{project.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Organização:</span>
                  <span className="ml-2 text-gray-600">{project.organization}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Fazer Doação</h2>

              {/* Step 1: Amount */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha o valor</h3>
                  
                  {/* Quick amounts */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {donationAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleAmountSelect(amount)}
                        className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                          donationData.amount === amount.toString()
                            ? 'border-gray-600 bg-gray-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        R$ {amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ou digite um valor personalizado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        value={donationData.customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder="0,00"
                        className="input-modern pl-8"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Recurring donation */}
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={donationData.isRecurring}
                        onChange={(e) => setDonationData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Doação recorrente</span>
                    </label>
                    {donationData.isRecurring && (
                      <select
                        value={donationData.frequency}
                        onChange={(e) => setDonationData(prev => ({ ...prev, frequency: e.target.value }))}
                        className="input-modern mt-2"
                      >
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="yearly">Anual</option>
                      </select>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!getFinalAmount()}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Doação</h3>
                  
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Valor da doação:</div>
                    <div className="text-xl font-bold text-gray-900">
                      R$ {getFinalAmount()}
                      {donationData.isRecurring && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({donationData.frequency === 'monthly' ? 'mensal' : 
                            donationData.frequency === 'quarterly' ? 'trimestral' : 'anual'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={donationData.name}
                        onChange={(e) => setDonationData(prev => ({ ...prev, name: e.target.value }))}
                        className="input-modern"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={donationData.email}
                        onChange={(e) => setDonationData(prev => ({ ...prev, email: e.target.value }))}
                        className="input-modern"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem (opcional)
                      </label>
                      <textarea
                        value={donationData.message}
                        onChange={(e) => setDonationData(prev => ({ ...prev, message: e.target.value }))}
                        className="input-modern"
                        rows={3}
                        placeholder="Deixe uma mensagem de apoio ao projeto..."
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={donationData.anonymous}
                          onChange={(e) => setDonationData(prev => ({ ...prev, anonymous: e.target.checked }))}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Doação anônima</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleBack}
                      className="flex-1 btn-secondary"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 btn-primary"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Finalizar Doação</h3>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Resumo da doação:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Projeto:</span>
                        <span className="font-medium">{project.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor:</span>
                        <span className="font-medium">R$ {getFinalAmount()}</span>
                      </div>
                      {donationData.isRecurring && (
                        <div className="flex justify-between">
                          <span>Frequência:</span>
                          <span className="font-medium">
                            {donationData.frequency === 'monthly' ? 'Mensal' : 
                             donationData.frequency === 'quarterly' ? 'Trimestral' : 'Anual'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Doador:</span>
                        <span className="font-medium">
                          {donationData.anonymous ? 'Anônimo' : donationData.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Forma de pagamento:</h4>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="payment" value="pix" className="mr-3" defaultChecked />
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold text-sm">PIX</span>
                          </div>
                          <div>
                            <div className="font-medium">PIX</div>
                            <div className="text-sm text-gray-600">Aprovação imediata</div>
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="payment" value="card" className="mr-3" />
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">Cartão de Crédito</div>
                            <div className="text-sm text-gray-600">Visa, Mastercard, Elo</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 btn-secondary"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleDonate}
                      disabled={processing}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {processing ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </div>
                      ) : (
                        'Finalizar Doação'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
