'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

// Mock data para demonstração
const mockProjects = [
  {
    id: '1',
    title: 'Educação Digital',
    description: 'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: '2',
    title: 'Saúde Comunitária',
    description: 'Clínicas móveis levando saúde básica, exames e vacinação para regiões remotas.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: '3',
    title: 'Meio Ambiente',
    description: 'Reflorestamento e conscientização ambiental em escolas públicas.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  }
]

export default function PrototypeEmbedPage() {
  const params = useParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento do projeto
    const foundProject = mockProjects.find(p => p.id === params.id)
    if (foundProject) {
      setProject(foundProject)
    } else {
      setProject(mockProjects[0])
    }
    setLoading(false)
  }, [params.id])

  const handleDonateClick = () => {
    console.log('Botão Doar Agora clicado!')
    
    // URL do checkout one-page
    const checkoutUrl = `https://portal.imagineinstituto.com/prototype/checkout/${params.id}`
    console.log('URL de checkout:', checkoutUrl)
    
    // Tentar enviar mensagem para parent (se estiver em iframe)
    if (window.parent && window.parent !== window) {
      console.log('Enviando mensagem para parent...')
      window.parent.postMessage({ 
        type: "REDIRECT_TO_CHECKOUT", 
        data: {
          checkoutUrl: checkoutUrl,
          projectId: params.id
        }, 
        source: "portal-embed-prototype" 
      }, "*")
      console.log('Mensagem enviada para parent. Aguardando redirecionamento...')
      
      // Fallback: se não receber resposta em 2 segundos, abrir em nova aba
      setTimeout(() => {
        console.log('Timeout: abrindo checkout em nova aba...')
        window.open(checkoutUrl, '_blank')
      }, 2000)
    } else {
      // Se não estiver em iframe, redirecionar diretamente
      console.log('Não está em iframe, redirecionando diretamente...')
      window.location.href = checkoutUrl
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <p className="text-gray-600">Verifique o ID do projeto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header com Logo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="Instituto Imagine" 
              className="h-8 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          {/* Project Image */}
          <div className="mb-6">
            <img 
              src={project.imageUrl} 
              alt={project.title}
              className="w-full max-w-md mx-auto rounded-xl shadow-lg"
            />
          </div>

          {/* Project Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              {project.description}
            </p>
            <p className="text-sm text-gray-500">
              {project.organization}
            </p>
          </div>

          {/* Call to Action */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Faça a diferença hoje!
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Sua doação pode transformar vidas e criar um impacto real na comunidade. 
              Junte-se a nós nesta missão de fazer o bem.
            </p>
          </div>

          {/* Donate Button */}
          <div className="mb-8">
            <button
              onClick={handleDonateClick}
              className="btn-primary text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              💚 Doar Agora
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Seguro</h3>
              <p className="text-sm text-gray-600">Pagamento 100% seguro</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Rápido</h3>
              <p className="text-sm text-gray-600">Processo em 2 minutos</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Transparente</h3>
              <p className="text-sm text-gray-600">Acompanhe o impacto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 Instituto Imagine. Todos os direitos reservados.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Protótipo de Embed Simplificado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

