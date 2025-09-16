'use client'

import { useState } from "react"
import { useParams } from "next/navigation"
import StripePaymentForm from "@/components/StripePaymentForm"

export default function EmbedCheckoutPage() {
  const params = useParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [donationData, setDonationData] = useState({
    amount: 50,
    isRecurring: false,
    frequency: 'monthly',
    message: '',
    anonymous: false
  })

  const handleAmountChange = (amount: number) => {
    setDonationData(prev => ({ ...prev, amount }))
  }

  const handleNext = () => {
    setCurrentStep(2)
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handlePaymentSuccess = (donationId: string) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ 
        type: "PAYMENT_SUCCESS", 
        data: { donationId, amount: donationData.amount }, 
        source: "portal-checkout" 
      }, "*")
    }
  }

  const handlePaymentError = (error: string) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ 
        type: "PAYMENT_ERROR", 
        data: { error }, 
        source: "portal-checkout" 
      }, "*")
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Fazer Doação</h2>
        
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Valor</span>
            <span>Pagamento</span>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Valor da doação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Valor da doação
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[25, 50, 100, 200, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountChange(amount)}
                    className={`p-3 text-center border rounded-lg font-medium transition-colors ${
                      donationData.amount === amount
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    R$ {amount}
                  </button>
                ))}
              </div>
              
              {/* Valor personalizado */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={donationData.amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Outro valor"
                  min="1"
                />
              </div>
            </div>

            {/* Doação recorrente */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={donationData.isRecurring}
                  onChange={(e) => setDonationData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Fazer doação recorrente</span>
              </label>
              
              {donationData.isRecurring && (
                <div className="mt-3">
                  <select
                    value={donationData.frequency}
                    onChange={(e) => setDonationData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              )}
            </div>

            {/* Mensagem personalizada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem (opcional)
              </label>
              <textarea
                value={donationData.message}
                onChange={(e) => setDonationData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Deixe uma mensagem de apoio..."
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {donationData.message.length}/200 caracteres
              </div>
            </div>

            {/* Doação anônima */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={donationData.anonymous}
                  onChange={(e) => setDonationData(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Fazer doação anônima</span>
              </label>
            </div>

            {/* Botão continuar */}
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continuar para Pagamento
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Resumo da doação */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Resumo da doação</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">R$ {donationData.amount}</span>
                </div>
                {donationData.isRecurring && (
                  <div className="flex justify-between">
                    <span>Frequência:</span>
                    <span className="font-medium">
                      {donationData.frequency === 'monthly' && 'Mensal'}
                      {donationData.frequency === 'quarterly' && 'Trimestral'}
                      {donationData.frequency === 'yearly' && 'Anual'}
                    </span>
                  </div>
                )}
                {donationData.anonymous && (
                  <div className="text-blue-600 font-medium">Doação anônima</div>
                )}
              </div>
            </div>

            {/* Botão voltar */}
            <button
              onClick={handleBack}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors mb-4"
            >
              ← Voltar
            </button>

            {/* Formulário de pagamento */}
            <StripePaymentForm
              projectId={params.id as string}
              amount={donationData.amount}
              userId="anonymous"
              isRecurring={donationData.isRecurring}
              recurringFrequency={donationData.frequency}
              message={donationData.message}
              anonymous={donationData.anonymous}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        )}
      </div>
    </div>
  )
}