'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  INSTITUTE_CNPJ,
  formatCurrencyBRL,
  getDonationStatusLabelPTBR,
  type DonationStatus,
} from '@/lib/payments'

interface PublicSessionState {
  loaded: boolean
  notFound: boolean
  donationId: string
  projectId: string
  projectTitle: string
  amountFormatted: string
  refundedAmountFormatted: string | null
  netAmountFormatted: string | null
  paymentStatus: DonationStatus
  paymentMethod: string
  isRecurring: boolean
  recurringFrequency: string | null
  receiptSentAt: string | null
}

function DoacaoSucessoContent() {
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [state, setState] = useState<PublicSessionState>({
    loaded: false,
    notFound: false,
    donationId: '',
    projectId: 'geral',
    projectTitle: 'Instituto Imagine',
    amountFormatted: '',
    refundedAmountFormatted: null,
    netAmountFormatted: null,
    paymentStatus: 'pending',
    paymentMethod: 'Pix / Cartão',
    isRecurring: false,
    recurringFrequency: null,
    receiptSentAt: null,
  })

  useEffect(() => {
    let active = true
    let pollTimer: number | null = null
    let attempts = 0

    const rawId = (
      searchParams.get('donation_id') ||
      searchParams.get('session_id') ||
      searchParams.get('donation') ||
      ''
    ).trim()

    if (!rawId) {
      // Sem ID de doação não há como confirmar nada. Não confiar em ?amount= da URL.
      setState((prev) => ({
        ...prev,
        loaded: true,
        notFound: true,
      }))
      return
    }

    const fetchSession = async () => {
      attempts += 1
      try {
        const res = await fetch(`/api/checkout/session/${encodeURIComponent(rawId)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        if (!active) return

        if (res.ok && data.success) {
          const nextStatus: DonationStatus =
            data.paymentStatus === 'completed' ||
            data.paymentStatus === 'failed' ||
            data.paymentStatus === 'refunded' ||
            data.paymentStatus === 'partially_refunded'
              ? data.paymentStatus
              : 'pending'

          setState({
            loaded: true,
            notFound: false,
            donationId: data.donationId || rawId,
            projectId: data.projectId || 'geral',
            projectTitle: data.projectTitle || 'Instituto Imagine',
            amountFormatted: data.amountFormatted || formatCurrencyBRL(Number(data.amount) || 0),
            refundedAmountFormatted:
              typeof data.refundedAmountFormatted === 'string'
                ? data.refundedAmountFormatted
                : null,
            // Valor líquido = doado - estornado (só quando há estorno parcial ou total registrado).
            netAmountFormatted:
              typeof data.refundedAmount === 'number' && data.refundedAmount > 0
                ? formatCurrencyBRL(Math.max((Number(data.amount) || 0) - data.refundedAmount, 0))
                : null,
            paymentStatus: nextStatus,
            paymentMethod: data.paymentMethod || 'Pix / Cartão',
            isRecurring: Boolean(data.isRecurring),
            recurringFrequency: data.recurringFrequency || null,
            receiptSentAt: typeof data.receiptSentAt === 'string' ? data.receiptSentAt : null,
          })

          if (nextStatus === 'pending' && attempts < 6) {
            pollTimer = window.setTimeout(() => {
              void fetchSession()
            }, 3000)
          }
        } else {
          setState((prev) => ({
            ...prev,
            loaded: true,
            notFound: true,
            donationId: rawId,
          }))
        }
      } catch {
        if (!active) return
        setState((prev) => ({
          ...prev,
          loaded: true,
          donationId: rawId,
        }))
      }
    }

    void fetchSession()

    return () => {
      active = false
      if (pollTimer) window.clearTimeout(pollTimer)
    }
  }, [searchParams])

  const isCompleted = state.paymentStatus === 'completed'
  const isPartiallyRefunded = state.paymentStatus === 'partially_refunded'
  const isFailedOrRefunded =
    state.paymentStatus === 'failed' ||
    state.paymentStatus === 'refunded'

  const shareText = `Acabei de apoiar o projeto "${state.projectTitle}" do Instituto Imagine em Uberlândia! Conheça e apoie também: https://imagineinstituto.com/#projetos`

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://imagineinstituto.com/#projetos').then(
        () => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2200)
        },
        () => undefined
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Instituto Imagine" className="h-9 w-auto" />
          </Link>
          <span className="text-xs text-gray-500 tabular-nums">CNPJ {INSTITUTE_CNPJ}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="max-w-2xl w-full card p-6 sm:p-8 text-center">
          {!state.loaded ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">Verificando o status da sua doação...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                {isCompleted ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isPartiallyRefunded ? (
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                  </div>
                ) : isFailedOrRefunded ? (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-9 h-9 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {isCompleted
                  ? 'Doação Confirmada!'
                  : isPartiallyRefunded
                    ? 'Doação Parcialmente Estornada'
                    : isFailedOrRefunded
                      ? 'Pagamento não concluído'
                      : 'Pagamento em Processamento'}
              </h1>

              <p className="text-base text-gray-600 mb-6">
                {isCompleted ? (
                  <>
                    Muito obrigado por apoiar <strong>{state.projectTitle}</strong>
                    {state.amountFormatted ? (
                      <>
                        {' '}
                        com <strong>{state.amountFormatted}</strong>
                      </>
                    ) : null}
                    {state.receiptSentAt
                      ? '! Seu recibo oficial e o link de acesso ao Portal do Doador já foram enviados para o seu e-mail.'
                      : '! Assim que o recibo for processado, ele e o link de acesso ao Portal do Doador chegarão no seu e-mail.'}
                  </>
                ) : isPartiallyRefunded ? (
                  <>
                    Esta doação para <strong>{state.projectTitle}</strong> foi confirmada e recebeu um estorno parcial
                    {state.refundedAmountFormatted ? (
                      <>
                        {' '}
                        de <strong>{state.refundedAmountFormatted}</strong>
                      </>
                    ) : null}
                    . Você pode consultar os valores detalhados e o recibo atualizado no Portal do Doador.
                  </>
                ) : isFailedOrRefunded ? (
                  <>
                    O pagamento desta tentativa não foi concluído, foi estornado ou expirou. Nenhuma cobrança indevida será mantida — você pode iniciar uma nova doação quando quiser.
                  </>
                ) : (
                  <>
                    Recebemos sua intenção de apoio para <strong>{state.projectTitle}</strong>
                    {state.amountFormatted ? (
                      <>
                        {' '}
                        no valor de <strong>{state.amountFormatted}</strong>
                      </>
                    ) : null}
                    . Assim que o Asaas confirmar a compensação do Pix ou Cartão, seu recibo oficial com CNPJ e o acesso ao Portal do Doador chegarão automaticamente no seu e-mail.
                  </>
                )}
              </p>

              {!state.notFound && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-left">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                    Resumo da Doação
                  </h2>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Destino:</dt>
                      <dd className="font-medium text-gray-900 text-right">{state.projectTitle}</dd>
                    </div>
                    {state.amountFormatted && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Valor:</dt>
                        <dd className="font-semibold text-gray-900 tabular-nums">
                          {state.amountFormatted}
                          {state.isRecurring && state.recurringFrequency
                            ? ` (${state.recurringFrequency})`
                            : ''}
                        </dd>
                      </div>
                    )}
                    {state.refundedAmountFormatted && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Valor estornado:</dt>
                        <dd className="font-semibold text-amber-700 tabular-nums">
                          -{state.refundedAmountFormatted}
                        </dd>
                      </div>
                    )}
                    {state.netAmountFormatted && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Valor líquido:</dt>
                        <dd className="font-semibold text-gray-900 tabular-nums">{state.netAmountFormatted}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Status atual:</dt>
                      <dd
                        className={`font-semibold ${
                          isCompleted
                            ? 'text-green-700'
                            : isPartiallyRefunded
                              ? 'text-amber-700'
                              : isFailedOrRefunded
                                ? 'text-red-700'
                                : 'text-amber-700'
                        }`}
                      >
                        {getDonationStatusLabelPTBR(state.paymentStatus)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Meio de pagamento:</dt>
                      <dd className="font-medium text-gray-900">{state.paymentMethod}</dd>
                    </div>
                    {state.donationId && (
                      <div className="flex justify-between gap-4 pt-2 border-t border-gray-200">
                        <dt className="text-gray-600">Protocolo:</dt>
                        <dd className="font-mono text-xs text-gray-500 break-all text-right">
                          {state.donationId}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {!state.notFound && !isFailedOrRefunded && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Acesso automático ao Portal do Doador
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    No mesmo e-mail do recibo, você recebe um botão seguro para definir sua senha (caso seja sua primeira doação) e acompanhar seu histórico de recibos e prestações de contas em um só lugar.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/#projetos" className="flex-1 btn-secondary text-center">
                  Voltar aos Projetos
                </Link>
                <Link href="/entrar" className="flex-1 btn-primary text-center">
                  Acessar Portal do Doador
                </Link>
              </div>

              {!isFailedOrRefunded && state.paymentStatus !== 'partially_refunded' && (
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">
                    Convide amigos e familiares para conhecerem o Instituto Imagine:
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
                    >
                      Compartilhar no WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {copied ? 'Link copiado!' : 'Copiar link dos projetos'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DoacaoSucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600 text-sm">Carregando confirmação...</div>
        </div>
      }
    >
      <DoacaoSucessoContent />
    </Suspense>
  )
}
