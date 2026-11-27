'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserDonationById, type Donation } from '@/lib/database'
import {
  INSTITUTE_CNPJ,
  SAO_PAULO_TIME_ZONE,
  buildReceiptText,
  formatCurrencyBRL,
  getDonationDestinationLabel,
  getDonationStatusLabelPTBR,
  getFrequencyLabelPTBR,
  getRecognizedDonationAmountBrl,
  normalizePaymentMethodLabel,
} from '@/lib/payments'
import type { User } from '@supabase/supabase-js'

export default function DoacaoDetailPage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donation, setDonation] = useState<Donation | null>(null)

  useEffect(() => {
    let active = true
    const loadDetail = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!active) return
        if (!authUser) {
          setLoading(false)
          return
        }
        setUser(authUser)
        const donationId = typeof params?.id === 'string' ? params.id.trim() : ''
        const record = await getUserDonationById(donationId, authUser.id)
        if (active) {
          setDonation(record)
        }
      } catch {
        // tratado no estado vazio
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDetail()
    return () => {
      active = false
    }
  }, [params?.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'partially_refunded':
        return 'bg-amber-100 text-amber-800'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'refunded':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-gray-600">Carregando detalhes da doação...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3 text-gray-900">Acesso Restrito</h1>
          <p className="mb-5 text-gray-600">Faça login para acessar os detalhes da sua doação.</p>
          <Link href="/entrar" className="btn-primary">
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  if (!donation) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full card p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Doação não encontrada</h1>
          <p className="text-sm text-gray-600 mb-6">
            Este registro não existe ou pertence a outra conta.
          </p>
          <Link href="/doacoes" className="btn-primary inline-block">
            Voltar para Minhas Doações
          </Link>
        </div>
      </div>
    )
  }

  const destinationTitle = getDonationDestinationLabel({
    projectTitle: donation.projects?.title || null,
    campaignSlug: donation.campaign_slug || null,
    projectId: donation.project_id || null,
  })

  const txId =
    donation.asaas_payment_id ||
    donation.asaas_checkout_id ||
    donation.id

  const handleDownloadReceipt = () => {
    const content = buildReceiptText({
      donationId: donation.id,
      donorName: (user.user_metadata as any)?.name || user.email || 'Doador',
      donorEmail: user.email || null,
      anonymous: donation.anonymous,
      amount: Number(donation.amount) || 0,
      refundedAmount: Number(donation.refunded_amount) || 0,
      projectTitle: destinationTitle,
      status: donation.status,
      paymentMethod: donation.payment_method,
      createdAt: donation.created_at,
      transactionId: txId,
      isRecurring: donation.is_recurring,
      recurringFrequency: donation.recurring_frequency,
      message: donation.message,
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo_imagine_${donation.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const refundedAmount = Number(donation.refunded_amount) || 0
  const netAmount = getRecognizedDonationAmountBrl(donation)

  return (
    <div className="max-w-4xl mx-auto">
      <main>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Detalhes da Doação
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(donation.status)}`}
              >
                {getDonationStatusLabelPTBR(donation.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-mono">Protocolo: {donation.id}</p>
          </div>
          <Link href="/doacoes" className="btn-secondary">
            ← Voltar às Doações
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Financeiras
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Valor</span>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">
                    {formatCurrencyBRL(donation.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Data</span>
                  <p className="text-sm font-medium text-gray-900 tabular-nums mt-1">
                    {new Date(donation.created_at).toLocaleString('pt-BR', {
                      timeZone: SAO_PAULO_TIME_ZONE,
                    })}
                  </p>
                </div>
                {refundedAmount > 0 && (
                  <>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Valor Estornado
                      </span>
                      <p className="text-lg font-semibold text-amber-700 tabular-nums mt-0.5">
                        -{formatCurrencyBRL(refundedAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Valor Líquido Reconhecido
                      </span>
                      <p className="text-lg font-semibold text-green-700 tabular-nums mt-0.5">
                        {formatCurrencyBRL(netAmount)}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Meio de Pagamento
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {normalizePaymentMethodLabel(donation.payment_method)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Modalidade</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {donation.is_recurring
                      ? `Recorrente (${getFrequencyLabelPTBR(donation.recurring_frequency)})`
                      : 'Doação única'}
                  </p>
                </div>
                <div className="sm:col-span-2 pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Referência no Gateway
                  </span>
                  <p className="text-xs font-mono text-gray-700 break-all mt-1">{txId}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Destino Apoiado</h2>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{destinationTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Instituto Imagine · CNPJ {INSTITUTE_CNPJ} · Uberlândia-MG.
              </p>
              {donation.message && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    Sua mensagem de apoio
                  </span>
                  <p className="text-sm text-gray-800 mt-1">{donation.message}</p>
                </div>
              )}
              <Link href="/blog" className="text-sm text-blue-600 hover:underline font-medium">
                Acompanhar notícias e prestação de contas →
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Comprovante e Ações</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="btn-primary w-full"
                >
                  Baixar Recibo (.txt)
                </button>
                <Link href="/projetos" className="btn-secondary w-full block text-center">
                  Apoiar Outro Projeto
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Precisa de Ajuda?</h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Dúvidas sobre recibo ou recorrência? Nossa equipe atende diretamente pelo WhatsApp oficial do Instituto.
              </p>
              <a
                href="https://wa.me/5534996945150"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full block text-center text-sm"
              >
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
