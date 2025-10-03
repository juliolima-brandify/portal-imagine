'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/database'
import { getFavorites } from '@/lib/favorites'
import { getDonations } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { generateCheckoutUrl } from '@/lib/urls'
import type { Project } from '@/lib/database'
import type { Favorite } from '@/lib/favorites'
import type { Donation } from '@/lib/database'
import FavoriteButton from '@/components/FavoriteButton'

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'my-projects'>('all')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Buscar usuário autenticado
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          setUser(currentUser)
          
          try {
            const userFavorites = await getFavorites(currentUser.id)
            setFavorites(userFavorites)
            
            const userDonations = await getDonations(currentUser.id)
            setDonations(userDonations)
          } catch (error) {
            console.log('Erro ao carregar dados do usuário:', error)
            setFavorites([])
            setDonations([])
          }
        }
        
        // Carregar projetos reais do Supabase
        const projectsData = await getProjects()
        console.log('🔍 Projetos carregados:', projectsData.map(p => ({ id: p.id, title: p.title })))
        setProjects(projectsData)
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
      case 'my-projects':
        // Projetos que o usuário apoiou (doações concluídas) + projetos onde é voluntário
        const supportedProjectIds = donations
          .filter(donation => donation.status === 'completed')
          .map(donation => donation.project_id)
        const uniqueSupportedIds = Array.from(new Set(supportedProjectIds))
        
        const allMyProjectIds = Array.from(new Set([...uniqueSupportedIds]))
        return projects.filter(project => allMyProjectIds.includes(project.id))
      default:
        return projects
    }
  })()

  const filteredProjects = selectedCategory === 'all' 
    ? currentProjects 
    : currentProjects.filter(project => project.category === selectedCategory)

  const handleFavoriteToggle = async (projectId: string, isFavorited: boolean) => {
    if (!user) return

    try {
      if (isFavorited) {
        // Remover dos favoritos
        const favoriteToRemove = favorites.find(fav => fav.project_id === projectId)
        if (favoriteToRemove) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteToRemove.id)
          
          if (!error) {
            setFavorites(prev => prev.filter(fav => fav.id !== favoriteToRemove.id))
          }
        }
      } else {
        // Adicionar aos favoritos
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            project_id: projectId
          })
          .select()
          .single()
        
        if (!error && data) {
          setFavorites(prev => [...prev, data])
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error)
    }
  }

  const categoryLabels = {
    educacao: 'Educação',
    social: 'Social',
    meio_ambiente: 'Meio Ambiente',
    saude: 'Saúde',
    tecnologia: 'Tecnologia'
  }

  const statusLabels = {
    active: 'Ativo',
    completed: 'Concluído',
    paused: 'Pausado',
    cancelled: 'Cancelado'
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando projetos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header - Seguindo padrão Admin */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Projetos
          </h1>
              <p className="mt-1 text-sm text-gray-500">
            Transforme vidas com sua doação. Escolha um projeto e faça a diferença hoje mesmo!
          </p>
            </div>
          </div>
        </div>

        {/* Tabs - Seguindo padrão Admin */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Todos os Projetos ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('my-projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meus Projetos ({(() => {
                  if (!user) return 0
                  const supportedProjectIds = donations
                    .filter(d => d.status === 'completed')
                    .map(d => d.project_id)
                  const uniqueSupportedIds = Array.from(new Set(supportedProjectIds))
                  const volunteerProjectIds = ['2', '3'] // Projetos onde é voluntário
                  const allMyProjectIds = Array.from(new Set([...uniqueSupportedIds, ...volunteerProjectIds]))
                  return allMyProjectIds.length
                })()})
              </button>
            </nav>
          </div>
        </div>

        {/* Filters - Seguindo padrão Admin */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas as Categorias
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
            <button 
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedCategory === key 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
            </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'my-projects' ? 'Nenhum projeto ainda' : 'Nenhum projeto encontrado'}
                </h3>
                <p className="text-gray-600 mb-6">
              {activeTab === 'my-projects' 
                ? 'Faça sua primeira doação ou se inscreva como voluntário para ver seus projetos aqui.'
                : 'Tente ajustar os filtros de categoria ou explore outros projetos.'
              }
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="btn-primary"
                >
              {activeTab === 'my-projects' ? 'Ver Projetos Disponíveis' : 'Ver Todos os Projetos'}
                </button>
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
                      {activeTab === 'my-projects' && (
                        <>
                      {userDonatedToProject && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              💰 Você doou
                            </span>
                          )}
                          {['2', '3'].includes(project.id) && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              🤝 Você é voluntário
                            </span>
                          )}
                        </>
                      )}
                      {activeTab === 'all' && userDonatedToProject && (
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
                          onToggle={(isFavorite) => handleFavoriteToggle(project.id, isFavorite)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Project Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progresso</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>R$ {project.current_amount.toLocaleString('pt-BR')}</span>
                        <span>R$ {project.target_amount.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* User Status Info */}
                    {(() => {
                      const isVolunteerForProject = user && ['2', '3'].includes(project.id) // Projetos onde é voluntário
                      const userDonatedToProject = donations.some(d => d.project_id === project.id && d.status === 'completed')
                      const totalDonatedToProject = donations
                        .filter(d => d.project_id === project.id && d.status === 'completed')
                        .reduce((sum, d) => sum + d.amount, 0)

                      return (
                        <div className="mb-4 space-y-2">
                          {userDonatedToProject && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center text-green-800 text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                💰 Você doou R$ {totalDonatedToProject.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          )}
                          {isVolunteerForProject && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center text-blue-800 text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                🤝 Você é voluntário
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Project Details */}
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      {project.location && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {project.location}
                        </div>
                      )}
                    </div>

                    {/* Actions - Botões organizados por tipo de usuário */}
                    {(() => {
                      const isVolunteerForProject = user && ['2', '3'].includes(project.id) // Projetos onde é voluntário
                      
                      return (
                        <div className="space-y-3">
                          {/* Ver Detalhes - Sempre presente */}
                      <Link
                            href={`https://imagineinstituto.com/projetos/${project.id}`}
                            className="w-full btn-secondary text-center block"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver Detalhes
                      </Link>

                          {/* Ver Relatórios - Sempre presente */}
                          <Link
                            href={`/projetos/${project.id}/relatorios`}
                            className="w-full btn-secondary text-center block"
                          >
                            Ver Relatórios
                          </Link>

                          {/* Seja Voluntário - Apenas para doadores (não voluntários) */}
                          {!isVolunteerForProject && (
                            <Link
                              href={`https://imagineinstituto.com/projetos/${project.id}/voluntario`}
                              className="w-full btn-secondary text-center block"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Seja Voluntário
                            </Link>
                          )}

                          {/* Grupo do Projeto - Sempre presente */}
                          <Link
                            href={`https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o projeto ${project.title}`}
                            className="w-full btn-secondary text-center block flex items-center justify-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            Grupo do Projeto
                          </Link>

                          {/* Doar Agora - Sempre presente */}
                      <Link
                            href={generateCheckoutUrl(project.id, project.title)}
                            className="w-full btn-primary text-center block"
                      >
                        Doar Agora
                      </Link>
                    </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="card p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Não encontrou o projeto ideal?
            </h3>
            <p className="text-gray-600 mb-6">
              Entre em contato conosco e ajude-nos a criar novos projetos que façam a diferença.
            </p>
            <Link href="/contato" className="btn-primary">
              Entrar em Contato
              </Link>
          </div>
        </div>
      </main>
    </div>
  )
}