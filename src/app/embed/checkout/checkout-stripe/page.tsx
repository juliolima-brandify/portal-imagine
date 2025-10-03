'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getProject } from '@/lib/database'
import DonationEmbed from '@/components/DonationEmbed'
import type { Project } from '@/lib/database'

export default function EmbedCheckoutPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header minimalista para embed */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Instituto Imagine</span>
        </div>
      </div>

      {/* Componente de doação */}
      <DonationEmbed project={{
        id: project.id,
        title: project.title,
        description: project.description || project.long_description || 'Projeto do Instituto Imagine',
        targetAmount: project.target_amount || 10000,
        currentAmount: project.current_amount || 0,
        imageUrl: project.image_url
      }} />

      {/* Footer minimalista */}
      <div className="text-center mt-8">
        <p className="text-xs text-gray-500">
          Doação processada com segurança via Stripe
        </p>
      </div>
    </div>
  )
}
