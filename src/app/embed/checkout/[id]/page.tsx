'use client'

import { useState } from "react"
import { useParams } from "next/navigation"

export default function EmbedCheckoutPage() {
  const params = useParams()
  const [donationData, setDonationData] = useState({
    amount: 50
  })

  console.log('Embed carregado! Params:', params)

  const handleAmountChange = (amount: number) => {
    setDonationData(prev => ({ ...prev, amount }))
  }

  const handleContinue = () => {
    console.log('Botão clicado! Valor:', donationData.amount)
    
    // Validar se tem valor
    if (!donationData.amount || donationData.amount <= 0) {
      alert('Por favor, escolha um valor para a doação.')
      return
    }

    console.log('Valor válido, redirecionando...')
    
    // Sempre redirecionar diretamente para o checkout
    const checkoutUrl = `https://portal.imagineinstituto.com/doar/${params.id}?amount=${donationData.amount}`
    console.log('URL de checkout:', checkoutUrl)
    
    // Tentar enviar mensagem para parent (se estiver em iframe)
    if (window.parent && window.parent !== window) {
      console.log('Enviando mensagem para parent...')
      window.parent.postMessage({ 
        type: "REDIRECT_TO_CHECKOUT", 
        data: {
          amount: donationData.amount,
          checkoutUrl: checkoutUrl
        }, 
        source: "portal-embed" 
      }, "*")
      console.log('Mensagem enviada para parent. Aguardando redirecionamento...')
    } else {
      // Se não estiver em iframe, redirecionar imediatamente
      console.log('Redirecionando diretamente...')
      window.location.href = checkoutUrl
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Fazer Doação</h2>
        
        {/* Valor da doação */}
        <div className="mb-6">
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


        {/* Botão continuar */}
        <button
          onClick={handleContinue}
          className="w-full text-white py-3 px-4 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#22C55E' }}
          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#16A34A'}
          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#22C55E'}
        >
          Continuar Doação
        </button>
      </div>
    </div>
  )
}
