'use client'

import { useState } from 'react'
import { createPaymentIntentSchema } from '@/lib/validations'

export default function PaymentsPage() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validar dados com Zod
      const validatedData = createPaymentIntentSchema.parse({
        amount: parseFloat(amount) * 100, // Converter para centavos
        currency: 'brl',
        description,
        customer_email: customerEmail,
      })

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Payment Intent criado com sucesso!')
        // Aqui você redirecionaria para o Stripe Checkout
        console.log('Payment Intent:', result.data)
      } else {
        throw new Error(result.error || 'Erro ao criar Payment Intent')
      }
    } catch (error: any) {
      setMessage(error.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Processar Pagamento
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Portal Imagine - Integração Stripe
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleCreatePayment}>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input-modern"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                className="input-modern"
                placeholder="Descrição do pagamento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email do Cliente
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                required
                className="input-modern"
                placeholder="cliente@exemplo.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Criar Payment Intent'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Informações</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Este é um exemplo de integração com Stripe usando Next.js, TypeScript e Zod para validação.
                <br />
                Configure suas chaves do Stripe no arquivo .env.local
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

