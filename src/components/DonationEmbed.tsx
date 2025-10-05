'use client'

import { useState } from 'react'
import { generateCheckoutUrl } from '@/lib/urls'

interface DonationEmbedProps {
  project: {
    id: string
    title: string
    description: string
    targetAmount: number
    currentAmount: number
    imageUrl?: string
    hasFundingGoal?: boolean
  }
}

const donationAmounts = [25, 50, 100, 200, 500, 1000]

export default function DonationEmbed({ project }: DonationEmbedProps) {
  const [donationData, setDonationData] = useState({
    amount: '50',
    customAmount: '',
    isRecurring: false,
    frequency: 'monthly',
    anonymous: false,
    message: ''
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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


  const getDonationAmount = () => {
    if (donationData.amount === 'custom') {
      return parseFloat(donationData.customAmount) || 0
    }
    return parseFloat(donationData.amount) || 0
  }

  const validateForm = () => {
    const amount = getDonationAmount()
    if (amount <= 0) {
      setError('Valor deve ser maior que zero')
      return false
    }
    return true
  }

  const handleContinue = async () => {
    setError(null)
    setProcessing(true)
    
    if (!validateForm()) {
      setProcessing(false)
      return
    }
    
    try {
      const amount = getDonationAmount()
      
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          projectId: project.id,
          projectTitle: project.title,
          options: {
            isRecurring: donationData.isRecurring,
            frequency: donationData.frequency,
            anonymous: donationData.anonymous,
            message: donationData.message
          }
        }),
      })

      const result = await response.json()

      if (result.success && result.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = result.url
      } else {
        setError(result.error || 'Erro ao processar pagamento')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      setError('Erro ao processar pagamento. Tente novamente.')
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Project Info */}
      <div className="p-6 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.title}</h1>
        
        {/* Mostrar barra de progresso apenas se tem meta de arrecadação */}
        {project.hasFundingGoal !== false && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Arrecadado</span>
              <span className="text-sm font-medium text-gray-900">
                R$ {(project.currentAmount || 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${((project.currentAmount || 0) / (project.targetAmount || 10000)) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Meta: R$ {(project.targetAmount || 10000).toLocaleString('pt-BR')}</span>
              <span className="text-xs text-gray-500">
                {Math.round(((project.currentAmount || 0) / (project.targetAmount || 10000)) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Mostrar apenas valor arrecadado se não tem meta */}
        {project.hasFundingGoal === false && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Arrecadado</span>
              <span className="text-lg font-bold text-green-600">
                R$ {(project.currentAmount || 0).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Donation Form */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Escolha o valor da doação</h2>
        
        {/* Amount Selection */}
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ou digite um valor personalizado
          </label>
          <input
            type="text"
            value={donationData.customAmount ? `R$ ${donationData.customAmount}` : ''}
            onChange={(e) => {
              const value = e.target.value.replace('R$ ', '').replace(/[^0-9,]/g, '')
              handleCustomAmountChange(value)
            }}
            placeholder="R$ 0,00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6">
          {/* Recurring Donation */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Doação recorrente</span>
              <p className="text-xs text-gray-500">Repetir automaticamente</p>
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

          {/* Frequency Selector */}
          {donationData.isRecurring && (
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
              <select
                value={donationData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}

          {/* Anonymous Donation */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Doação anônima</span>
              <p className="text-xs text-gray-500">Não exibir meu nome</p>
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

          {/* Message */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Adicionar mensagem</span>
              <p className="text-xs text-gray-500">Deixar uma mensagem de apoio</p>
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

          {/* Message Field */}
          {donationData.message && (
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sua mensagem</label>
              <textarea
                value={donationData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Deixe uma mensagem de apoio ao projeto..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          )}
        </div>


        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={processing}
          className="w-full mb-4 px-6 py-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processando...
            </div>
          ) : (
            `Continuar para Pagamento - R$ ${getDonationAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          )}
        </button>

        {/* Security Seal */}
        <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Pagamento seguro via Stripe</span>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
