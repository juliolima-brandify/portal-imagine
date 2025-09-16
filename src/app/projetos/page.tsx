'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/database'
import { getFavorites } from '@/lib/favorites'
import { getDonations } from '@/lib/database'
import type { Project } from '@/lib/database'
import type { Favorite } from '@/lib/favorites'
import type { Donation } from '@/lib/database'
import FavoriteButton from '@/components/FavoriteButton'
import Header from '@/components/Header'

const categoryLabels = {
  'educacao': 'Educação',
  'saude': 'Saúde',
  'meio-ambiente': 'Meio Ambiente',
  'esporte': 'Esporte',
  'social': 'Social'
}

const statusLabels = {
  'active': 'Ativo',
  'completed': 'Concluído',
  'paused': 'Pausado',
  'cancelled': 'Cancelado'
}

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-blue-100 text-blue-800',
  'paused': 'bg-yellow-100 text-yellow-800',
  'cancelled': 'bg-red-100 text-red-800'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'supported' | 'favorites'>('all')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'demo@doador.com') {
          setUser({
            id: 'demo-user',
            email: demoEmail,
            user_metadata: { name: 'Doador Demo' }
          })
          
          // Carregar favoritos mock para demo
          setFavorites([
            {
              id: '1',
              user_id: 'demo-user',
              project_id: '1',
              created_at: '2024-01-15T10:00:00Z',
              project: {
                id: '1',
                title: 'Educação Digital',
                description: 'Levando tecnologia e educação para comunidades carentes através de laboratórios de informática.',
                image_url: '/api/placeholder/400/300',
                current_amount: 45000,
                target_amount: 60000,
                status: 'active'
              }
            },
            {
              id: '2',
              user_id: 'demo-user',
              project_id: '2',
              created_at: '2024-01-10T10:00:00Z',
              project: {
                id: '2',
                title: 'Saúde Comunitária',
                description: 'Clínicas móveis levando saúde básica, exames e vacinação para regiões remotas.',
                image_url: '/api/placeholder/400/300',
                current_amount: 32000,
                target_amount: 50000,
                status: 'active'
              }
            }
          ] as Favorite[])

          // Carregar doações mock para demo
          setDonations([
            {
              id: '1',
              user_id: 'demo-user',
              project_id: '1',
              amount: 150.00,
              currency: 'BRL',
              status: 'completed',
              payment_method: 'Cartão de Crédito',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_001',
              message: 'Doação de teste para educação.'
            },
            {
              id: '2',
              user_id: 'demo-user',
              project_id: '2',
              amount: 75.50,
              currency: 'BRL',
              status: 'completed',
              payment_method: 'PIX',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-10T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_002',
              message: 'Doação para saúde comunitária.'
            },
            {
              id: '3',
              user_id: 'demo-user',
              project_id: '3',
              amount: 200.00,
              currency: 'BRL',
              status: 'completed',
              payment_method: 'Boleto',
              is_recurring: false,
              anonymous: false,
              created_at: '2024-01-20T10:00:00Z',
              updated_at: '2024-01-20T10:00:00Z',
              stripe_payment_intent_id: 'pi_demo_003',
              message: 'Doação para meio ambiente.'
            }
          ] as Donation[])
        } else if (user) {
          // Carregar favoritos e doações reais se não for demo
          const userFavorites = await getFavorites(user.id)
          setFavorites(userFavorites)
          
          const userDonations = await getDonations(user.id)
          setDonations(userDonations)
        }
        
        const data = await getProjects()
        setProjects(data)
      } catch (err) {
        setError('Erro ao carregar projetos')
        console.error('Erro ao carregar projetos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Determinar quais projetos mostrar baseado na aba ativa
  const currentProjects = (() => {
    switch (activeTab) {
      case 'favorites':
        return favorites.map(fav => fav.project).filter(Boolean) as Project[]
      case 'supported':
        // Projetos únicos que o usuário apoiou (doações concluídas)
        const supportedProjectIds = donations
          .filter(donation => donation.status === 'completed')
          .map(donation => donation.project_id)
        const uniqueSupportedIds = Array.from(new Set(supportedProjectIds))
        return projects.filter(project => uniqueSupportedIds.includes(project.id))
      default:
        return projects
    }
  })()

  const filteredProjects = selectedCategory === 'all' 
    ? currentProjects 
    : currentProjects.filter(project => project.category === selectedCategory)

  const handleFavoriteToggle = (isFavorited: boolean) => {
    // Esta função será chamada pelo FavoriteButton, mas precisamos do projectId
    // Vamos usar uma abordagem diferente - o FavoriteButton já gerencia isso
    console.log('Favorite toggled:', isFavorited)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar projetos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user ? {
          id: user.id,
          name: user.user_metadata?.name,
          email: user.email,
          role: 'donor'
        } : undefined}
        onSignOut={user ? () => {
          // Redirecionar para auth
          window.location.href = '/auth'
        } : undefined}
        showAuth={!user}
        showBackToMain={false}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Projetos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça os projetos que estão transformando vidas e faça parte dessa mudança.
            Cada doação faz a diferença!
          </p>
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos os Projetos ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('supported')}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'supported'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Meus Projetos ({donations.filter(d => d.status === 'completed').length > 0 ? Array.from(new Set(donations.filter(d => d.status === 'completed').map(d => d.project_id))).length : 0})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'favorites'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Meus Favoritos ({favorites.length})
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              className={selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </button>
            <button 
              className={selectedCategory === 'educacao' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('educacao')}
            >
              Educação
            </button>
            <button 
              className={selectedCategory === 'saude' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('saude')}
            >
              Saúde
            </button>
            <button 
              className={selectedCategory === 'meio-ambiente' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('meio-ambiente')}
            >
              Meio Ambiente
            </button>
            <button 
              className={selectedCategory === 'esporte' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('esporte')}
            >
              Esporte
            </button>
            <button 
              className={selectedCategory === 'social' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setSelectedCategory('social')}
            >
              Social
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'favorites' ? (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum favorito ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Explore os projetos disponíveis e marque seus favoritos para acompanhar de perto.
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="btn-primary"
                >
                  Ver Todos os Projetos
                </button>
              </div>
            ) : activeTab === 'supported' ? (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum projeto apoiado ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Faça sua primeira doação e veja aqui os projetos que você está apoiando.
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="btn-primary"
                >
                  Ver Projetos Disponíveis
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum projeto encontrado
                </h3>
                <p className="text-gray-600">
                  {selectedCategory === 'all' 
                    ? 'Não há projetos disponíveis no momento.' 
                    : `Não há projetos na categoria "${categoryLabels[selectedCategory as keyof typeof categoryLabels] || selectedCategory}".`
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const progress = (project.current_amount / project.target_amount) * 100
              const userDonatedToProject = donations.some(d => d.project_id === project.id && d.status === 'completed')
              const totalDonatedToProject = donations
                .filter(d => d.project_id === project.id && d.status === 'completed')
                .reduce((sum, d) => sum + d.amount, 0)
              
              return (
                <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Project Image */}
                  <div className="h-48 bg-gradient-to-r from-gray-400 to-gray-600 relative">
                    {project.image_url && (
                      <img 
                        src={project.image_url} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                        {statusLabels[project.status as keyof typeof statusLabels]}
                      </span>
                      {userDonatedToProject && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Você apoiou
                        </span>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <span className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                        {categoryLabels[project.category as keyof typeof categoryLabels]}
                      </span>
                      {user && (
                        <FavoriteButton
                          userId={user.id}
                          projectId={project.id}
                          projectTitle={project.title}
                          size="sm"
                          onToggle={handleFavoriteToggle}
                        />
                      )}
                    </div>
                  </div>

                  {/* Project Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    {/* User's contribution info */}
                    {userDonatedToProject && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            Você doou: R$ {totalDonatedToProject.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Location */}
                    {project.location && (
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location}
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          R$ {project.current_amount.toLocaleString('pt-BR')} / R$ {project.target_amount.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm font-semibold text-gray-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                          style={{width: `${Math.min(progress, 100)}%`}}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Link
                        href={`/projetos/${project.id}`}
                        className="flex-1 btn-secondary text-center"
                      >
                        Ver Detalhes
                      </Link>
                      <Link
                        href={`/doar/${project.id}?demo_email=demo@doador.com`}
                        className="flex-1 btn-primary text-center"
                      >
                        Doar Agora
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gray-900 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Não encontrou o projeto ideal?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Entre em contato conosco e vamos conversar sobre como você pode ajudar.
          </p>
          <Link
            href="/contato"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Entrar em Contato
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Instituto Imagine</h3>
            <p className="text-gray-400 mb-4">
              Transformando vidas através da educação e solidariedade
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/sobre" className="text-gray-400 hover:text-white">
                Sobre
              </Link>
              <Link href="/contato" className="text-gray-400 hover:text-white">
                Contato
              </Link>
              <Link href="/transparencia" className="text-gray-400 hover:text-white">
                Transparência
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}