'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getProject } from '@/lib/database'
import DonationEmbed from '@/components/DonationEmbed'
import type { Project } from '@/lib/database'

function EmbedCheckoutContent() {
  const searchParams = useSearchParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      const projectId = searchParams.get('project') || 'mock-1'
      console.log('🔍 Carregando projeto para embed:', projectId)
      
      try {
        const projectData = await getProject(projectId)
        console.log('📋 Projeto carregado:', projectData)
        
        if (projectData) {
          setProject(projectData)
        } else {
          console.error('❌ Projeto não encontrado:', projectId)
          setError('Projeto não encontrado')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar projeto:', error)
        setError('Erro ao carregar projeto')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <p className="text-gray-600 mb-6">
            O projeto solicitado não foi encontrado ou não está disponível.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Se você acredita que isso é um erro, entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4" style={{ backgroundColor: '#ffffff' }}>

      {/* Componente de doação */}
      <DonationEmbed project={{
        id: project.id,
        title: project.title,
        description: project.description || project.long_description || 'Projeto do Instituto Imagine',
        targetAmount: Number(project.target_amount) || 0,
        currentAmount: Number(project.current_amount) || 0,
        imageUrl: project.image_url,
        hasFundingGoal: project.has_funding_goal !== false && Number(project.target_amount) > 0
      }} />

    </div>
  )
}

export default function EmbedCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{ backgroundColor: '#ffffff' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando projeto...</p>
          </div>
        </div>
      }
    >
      <EmbedCheckoutContent />
    </Suspense>
  )
}
