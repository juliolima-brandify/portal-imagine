'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getProject } from '@/lib/database'
import { resolveSpecialCampaign } from '@/lib/payments'
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

export default function EmbedCheckoutByIdPage() {
  const params = useParams()
  const [project, setProject] = useState<EmbedProjectView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadProject = async () => {
      const rawId = typeof params?.id === 'string' ? params.id.trim() : ''
      const lower = rawId.toLowerCase()

      const special = resolveSpecialCampaign(lower)
      if (special) {
        if (!active) return
        setProject({
          id: special.slug,
          title: special.title,
          description: 'Doação direta para o Instituto Imagine.',
          targetAmount: 0,
          currentAmount: 0,
          hasFundingGoal: false,
        })
        setLoading(false)
        return
      }

      try {
        const projectData = await getProject(rawId)
        if (!active) return

        if (projectData) {
          setProject({
            id: projectData.id,
            title: projectData.title,
            description:
              projectData.description ||
              projectData.long_description ||
              'Projeto social do Instituto Imagine',
            targetAmount: Number(projectData.target_amount) || 0,
            currentAmount: Number(projectData.current_amount) || 0,
            imageUrl: projectData.image_url,
            hasFundingGoal:
              projectData.has_funding_goal !== false && Number(projectData.target_amount) > 0,
          })
        } else {
          setError('Projeto não encontrado')
        }
      } catch {
        if (active) setError('Erro ao carregar projeto')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProject()
    return () => {
      active = false
    }
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Projeto não encontrado</h1>
          <p className="text-sm text-gray-600 mb-6">
            O projeto solicitado não foi encontrado ou não está disponível no momento.
          </p>
          <Link href="/#projetos" className="btn-primary inline-block">
            Ver projetos disponíveis
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

      <DonationEmbed project={project} source="embed" />

      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Doação processada com segurança via Asaas · Pix e Cartão de Crédito
        </p>
      </div>
    </div>
  )
}
