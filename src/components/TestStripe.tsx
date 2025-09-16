'use client'

import { useState } from 'react'

export default function TestStripe() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testStripeKey = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      // Verificar se a chave está definida
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      
      if (!stripeKey) {
        setTestResult('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definida')
        return
      }
      
      if (stripeKey === 'pk_test_placeholder') {
        setTestResult('⚠️ Usando chave placeholder - configure a chave real')
        return
      }
      
      setTestResult(`✅ Chave Stripe encontrada: ${stripeKey.substring(0, 20)}...`)
      
      // Testar carregamento do Stripe
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(stripeKey)
      
      if (stripe) {
        setTestResult(prev => prev + '\n✅ Stripe carregado com sucesso')
      } else {
        setTestResult(prev => prev + '\n❌ Falha ao carregar Stripe')
      }
      
    } catch (error: any) {
      setTestResult(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAPI = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const response = await fetch('/api/health')
      const result = await response.json()
      
      if (response.ok) {
        setTestResult('✅ API Health funcionando')
      } else {
        setTestResult(`❌ API Health falhou: ${result.error}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Erro na API: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Teste de Configuração Stripe
      </h3>
      
      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={testStripeKey}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Stripe'}
          </button>
          
          <button
            onClick={testAPI}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar API'}
          </button>
        </div>
        
        {testResult && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p><strong>Variáveis de ambiente necessárias:</strong></p>
          <ul className="list-disc list-inside mt-1">
            <li>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</li>
            <li>STRIPE_SECRET_KEY</li>
            <li>STRIPE_WEBHOOK_SECRET</li>
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
