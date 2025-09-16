'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { createPaymentIntent } from '@/lib/stripe-integration'

// Carregar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  amount: number
  projectId: string
  userId: string
  isRecurring?: boolean
  recurringFrequency?: string
  message?: string
  anonymous?: boolean
  onSuccess: (donationId: string) => void
  onError: (error: string) => void
}

// Componente interno do formulário de pagamento
function PaymentForm({
  amount,
  projectId,
  userId,
  isRecurring,
  recurringFrequency,
  message,
  anonymous,
  onSuccess,
  onError
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // 1. Criar Payment Intent via API
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          projectId,
          isRecurring,
          recurringFrequency,
          message,
          anonymous
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar Payment Intent')
      }

      // 2. Confirmar pagamento com Stripe Elements
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/doacao-sucesso?project=${projectId}&amount=${amount}&donation=${result.data.donationId}`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Erro no pagamento')
        onError(stripeError.message || 'Erro no pagamento')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(result.data.donationId)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar pagamento'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do Cartão
        </h3>
        
        <div className="mb-4">
          <CardElement
            options={cardElementOptions}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Valor da doação:</span>
            <span className="font-semibold text-gray-900">
              R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {isRecurring && (
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">Frequência:</span>
              <span className="font-semibold text-gray-900">
                {recurringFrequency === 'monthly' ? 'Mensal' : 'Anual'}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processando...
          </div>
        ) : (
          `Doar R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>Pagamento seguro processado pelo Stripe</p>
        <p>Suas informações estão protegidas e criptografadas</p>
      </div>
    </form>
  )
}

// Componente principal com provider do Stripe
export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
