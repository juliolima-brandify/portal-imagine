'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getProject } from '@/lib/database'
import { SPECIAL_CAMPAIGNS } from '@/lib/payments'
import DonationEmbed from '@/components/DonationEmbed'

interface EmbedProjectView {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  imageUrl?: string
  hasFundingGoal: boolean
}

function EmbedCheckoutContent() {
  const searchParams = useSearchParams()
  const [project, setProject] = useState<EmbedProjectView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rawSource = searchParams.get('source')
  const checkoutSource: 'site' | 'portal' | 'embed' =
    rawSource === 'site' || rawSource === 'portal' ? rawSource : 'embed'

  useEffect(() => {
    let active = true
    const loadTarget = async () => {
      const requestedId = (searchParams.get('project') || 'geral').trim()
      const lower = requestedId.toLowerCase()

      if (SPECIAL_CAMPAIGNS[lower]) {
        if (!active) return
        setProject({
          id: SPECIAL_CAMPAIGNS[lower].slug,
          title: SPECIAL_CAMPAIGNS[lower].title,
          description:
            lower === 'natal'
              ? 'Campanha anual de arrecadação de brinquedos novos para crianças atendidas pelo Instituto Imagine.'
              : 'Sua contribuição é direcionada pelo Instituto Imagine para a frente social com maior necessidade imediata.',
          targetAmount: 0,
          currentAmount: 0,
          hasFundingGoal: false,
        })
        setLoading(false)
        return
      }

      try {
        const projectData = await getProject(requestedId)
        if (!active) return

        if (projectData) {
          setProject({
            id: projectData.id,
            title: projectData.title,
            description:
              projectData.description ||
              projectData.long_description ||
              'Projeto social do Instituto Imagine em Uberlândia-MG.',
            targetAmount: Number(projectData.target_amount) || 0,
            currentAmount: Number(projectData.current_amount) || 0,
            imageUrl: projectData.image_url,
            hasFundingGoal:
              projectData.has_funding_goal !== false && Number(projectData.target_amount) > 0,
          })
        } else {
          setError('O projeto selecionado não foi encontrado ou não está disponível no momento.')
        }
      } catch {
        if (active) {
          setError('Não foi possível carregar os dados do projeto agora.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTarget()
    return () => {
      active = false
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Carregando destino da doação...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Projeto indisponível</h1>
          <p className="text-sm text-gray-600 mb-6">
            {error || 'Não foi possível localizar o projeto solicitado.'}
          </p>
          <Link href="/#projetos" className="btn-primary inline-block">
            Ver projetos do Instituto Imagine
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Instituto Imagine
        </Link>
        <span className="text-xs text-gray-500">CNPJ 14.351.728/0001-72</span>
      </div>

      <DonationEmbed project={project} source={checkoutSource} />

      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Doação processada com segurança via Asaas · Pix e Cartão de Crédito
        </p>
      </div>
    </div>
  )
}

export default function EmbedCheckoutQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Carregando checkout...</p>
          </div>
        </div>
      }
    >
      <EmbedCheckoutContent />
    </Suspense>
  )
}
