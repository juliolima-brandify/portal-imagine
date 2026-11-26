'use client'

import { useRef, useState } from 'react'
import {
  MIN_DONATION_BRL,
  formatCurrencyBRL,
  getFrequencyLabelPTBR,
  validateCheckoutAmountBrl,
  type RecurringFrequency,
} from '@/lib/payments'
import { parseBRNumber } from '@/lib/imagine-site'

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
  source?: 'embed' | 'portal' | 'site'
}

const donationAmounts = [30, 50, 100, 200]

export default function DonationEmbed({ project, source = 'embed' }: DonationEmbedProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [anonymous, setAnonymous] = useState(false)
  const [showMessageField, setShowMessageField] = useState(false)
  const [message, setMessage] = useState('')
  const [donorName, setDonorName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitLockRef = useRef(false)

  const getDonationAmount = (): number => {
    if (selectedPreset === 'custom') {
      return parseBRNumber(customAmount)
    }
    return selectedPreset
  }

  const handleContinue = async () => {
    if (submitLockRef.current || processing) return
    setError(null)

    const amount = getDonationAmount()
    const validation = validateCheckoutAmountBrl(amount)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    submitLockRef.current = true
    setProcessing(true)

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: validation.valueBrl,
          projectId: project.id,
          projectTitle: project.title,
          source,
          options: {
            isRecurring,
            frequency,
            anonymous,
            message: showMessageField ? message.trim() : '',
            donorName: !anonymous && donorName.trim() ? donorName.trim() : undefined,
          },
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.success && typeof result.url === 'string' && result.url) {
        if (window.top && window.top !== window.self) {
          window.top.location.href = result.url
        } else {
          window.location.href = result.url
        }
        return
      }

      setError(result.error || 'Não foi possível iniciar o checkout seguro agora. Tente novamente.')
      submitLockRef.current = false
      setProcessing(false)
    } catch {
      setError('Falha de conexão ao iniciar o pagamento. Verifique sua internet e tente novamente.')
      submitLockRef.current = false
      setProcessing(false)
    }
  }

  const progressPct =
    project.targetAmount > 0
      ? Math.min(100, Math.round(((project.currentAmount || 0) / project.targetAmount) * 100))
      : 0

  const currentAmountFormatted = formatCurrencyBRL(project.currentAmount || 0)
  const targetAmountFormatted = formatCurrencyBRL(project.targetAmount || 0)
  const activeAmount = getDonationAmount()

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
        {project.description && (
          <p className="text-sm text-gray-600 mb-4">{project.description}</p>
        )}

        {project.hasFundingGoal !== false && project.targetAmount > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Arrecadado</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {currentAmountFormatted}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 tabular-nums">
                Meta: {targetAmountFormatted}
              </span>
              <span className="text-xs font-medium text-gray-600 tabular-nums">
                {progressPct}%
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Destino confirmado</span>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              CNPJ 14.351.728/0001-72
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Escolha o valor da doação
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {donationAmounts.map((amount) => {
            const selected = selectedPreset === amount
            return (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedPreset(amount)
                  setCustomAmount('')
                  setError(null)
                }}
                className={`py-3 px-4 rounded-lg border-2 text-center font-semibold tabular-nums transition-colors ${
                  selected
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50/50'
                }`}
              >
                R$ {amount}
              </button>
            )
          })}
        </div>

        <div className="mb-5">
          <label
            htmlFor="embed-custom-amount"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Ou digite outro valor (mínimo {formatCurrencyBRL(MIN_DONATION_BRL)})
          </label>
          <input
            id="embed-custom-amount"
            type="text"
            inputMode="decimal"
            value={customAmount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.,]/g, '')
              setCustomAmount(cleaned)
              setSelectedPreset('custom')
              setError(null)
            }}
            placeholder="Ex.: 75,00"
            className="input-modern tabular-nums"
          />
        </div>

        {!anonymous && (
          <div className="mb-5">
            <label
              htmlFor="embed-donor-name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Seu nome (opcional — você também poderá informar no checkout)
            </label>
            <input
              id="embed-donor-name"
              type="text"
              maxLength={120}
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Como deseja aparecer no recibo"
              className="input-modern"
            />
          </div>
        )}

        <div className="space-y-4 mb-6 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-gray-800">Doação recorrente</span>
              <p className="text-xs text-gray-500">
                {isRecurring
                  ? 'Assinatura automática no cartão de crédito via Asaas'
                  : 'Doação única via Pix ou Cartão de Crédito'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                isRecurring ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isRecurring && (
            <div className="pl-3 border-l-2 border-green-200">
              <label
                htmlFor="embed-frequency"
                className="block text-xs font-medium text-gray-700 mb-1.5"
              >
                Frequência da assinatura
              </label>
              <select
                id="embed-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="input-modern h-11 !py-0"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-gray-800">Doação anônima</span>
              <p className="text-xs text-gray-500">Ocultar meu nome em listagens públicas</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={anonymous}
              onClick={() => setAnonymous((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                anonymous ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  anonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-gray-800">Mensagem de apoio</span>
              <p className="text-xs text-gray-500">Deixar um recado opcional para a equipe</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showMessageField}
              onClick={() => setShowMessageField((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                showMessageField ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showMessageField ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {showMessageField && (
            <div>
              <label
                htmlFor="embed-message"
                className="block text-xs font-medium text-gray-700 mb-1.5"
              >
                Sua mensagem (máx. 500 caracteres)
              </label>
              <textarea
                id="embed-message"
                value={message}
                maxLength={500}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Deixe uma mensagem de apoio ao projeto..."
                rows={3}
                className="input-modern resize-none"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={processing}
          className="w-full mb-4 px-6 py-3.5 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="inline-flex items-center justify-center">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Redirecionando ao ambiente seguro...
            </span>
          ) : (
            `Continuar para pagamento · ${formatCurrencyBRL(activeAmount > 0 ? activeAmount : 0)}${
              isRecurring ? `/${getFrequencyLabelPTBR(frequency).toLowerCase()}` : ''
            }`
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs text-center">
          <svg className="w-4 h-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Ambiente seguro Asaas · Pix e Cartão · Recibo enviado por e-mail</span>
        </div>
      </div>
    </div>
  )
}
