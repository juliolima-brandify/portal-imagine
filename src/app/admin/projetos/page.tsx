'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProjectForm from '@/components/ProjectForm'
import ConfirmDialog, { Modal } from '@/components/ConfirmDialog'
import { generateCheckoutUrl, generateEmbedUrl } from '@/lib/urls'
import { ToastContainer, useToast } from '@/components/Toast'

interface Project {
  id: string
  title: string
  description: string
  category: 'educacao' | 'saude' | 'meio-ambiente' | 'esporte' | 'social'
  target_amount: number
  current_amount: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  location: string
  image_url: string
  framer_project_url?: string
  checkout_tracking_url?: string
  has_funding_goal?: boolean
  created_at: string
  updated_at: string
}

export default function AdminProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados para modais
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | undefined>(undefined)
  
  // Estados para operações
  const [operationLoading, setOperationLoading] = useState(false)
  const { toasts, removeToast, success, error, warning, info } = useToast()

  // Função para carregar projetos via API
  const loadProjectsForAdmin = async () => {
    console.log('🔄 [PROJETOS] Iniciando carregamento via API...')
    setIsLoading(true)
    try {
      console.log('📡 [PROJETOS] Fazendo requisição para /api/admin/projects...')
      const response = await fetch('/api/admin/projects')
      const result = await response.json()
      
      console.log('📥 [PROJETOS] Resposta da API:', { 
        status: response.status, 
        ok: response.ok, 
        dataLength: result.data?.length 
      })
      
      if (!response.ok) {
        console.error('❌ [PROJETOS] Erro na API:', result.error)
        setProjects([])
      } else {
        console.log(`✅ [PROJETOS] ${result.data?.length || 0} projetos carregados`)
        console.log('📋 [PROJETOS] Projetos recebidos:', result.data?.map((p: any) => `${p.id}: ${p.title}`))
        console.log('📊 [PROJETOS] Chamando setProjects com:', result.data?.length || 0, 'projetos')
        setProjects(result.data || [])
        console.log('📊 [PROJETOS] setProjects executado')
      }
    } catch (err) {
      console.error('❌ [PROJETOS] Erro ao conectar com API:', err)
      setProjects([])
    }
    setIsLoading(false)
  }

  // Função para recarregar projetos
  const reloadProjectsFromSupabase = async () => {
    try {
      console.log('🔄 Recarregando projetos via API...')
      const response = await fetch('/api/admin/projects')
      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ Erro ao recarregar projetos:', result.error)
        return false
      }
      
      console.log(`✅ ${result.data?.length || 0} projetos recarregados`)
      setProjects(result.data || [])
      return true
    } catch (err) {
      console.error('❌ Erro ao recarregar projetos:', err)
      return false
    }
  }

  useEffect(() => {
    // Carregar projetos - autenticação gerenciada pelo layout
    console.log('🎯 [PROJETOS] useEffect executado - carregando projetos...')
    console.log('🎯 [PROJETOS] Estado inicial de projects:', projects.length)
    loadProjectsForAdmin()
  }, [])

  // Monitorar mudanças no estado de projetos
  useEffect(() => {
    console.log('📊 [PROJETOS] Estado de projects mudou:', projects.length, 'projetos')
  }, [projects])

  // Funções CRUD
  const handleCreateProject = () => {
    setEditingProject(undefined)
    setShowProjectForm(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  const handleDuplicateProject = async (project: Project) => {
    setOperationLoading(true)
    try {
      const duplicatedProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        title: `${project.title} (Cópia)`,
        current_amount: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Salvar no Supabase
      try {
        console.log('📡 Salvando projeto duplicado via API...')
        const response = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(duplicatedProject),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('❌ Erro ao salvar projeto duplicado:', result.error)
          error('Erro ao Duplicar', result.error)
          return
        }

        console.log('✅ Projeto duplicado salvo com sucesso')
        success('Projeto Duplicado', 'Projeto duplicado com sucesso!')
        
        // Recarregar lista
        await reloadProjectsFromSupabase()
      } catch (apiError) {
        console.error('❌ Erro ao salvar projeto duplicado no Supabase:', apiError)
        error('Erro ao Duplicar', 'Erro ao salvar projeto duplicado')
      }
    } catch (err) {
      console.error('❌ Erro ao duplicar projeto:', err)
      error('Erro ao Duplicar', 'Erro inesperado ao duplicar projeto')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleSaveProject = async (projectData: any) => {
    setOperationLoading(true)
    try {
      if (editingProject) {
        // Atualizar projeto existente
        const updatedProject = { ...projectData, id: editingProject.id }
        
        try {
          console.log('📡 Atualizando projeto via API...')
          const response = await fetch('/api/admin/projects', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProject),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('❌ Erro ao atualizar projeto:', result.error)
            error('Erro ao Atualizar', result.error)
            return
          }

          console.log('✅ Projeto atualizado com sucesso')
          success('Projeto Atualizado', 'Projeto atualizado com sucesso!')
          
          // Recarregar lista
          await reloadProjectsFromSupabase()
          setShowProjectForm(false)
          setEditingProject(undefined)
        } catch (apiError) {
          console.error('❌ Erro ao atualizar projeto no Supabase:', apiError)
          error('Erro ao Atualizar', 'Erro ao atualizar projeto')
        }
      } else {
        // Criar novo projeto
        const newProject = {
          ...projectData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        try {
          console.log('📡 Criando projeto via API...')
          const response = await fetch('/api/admin/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProject),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('❌ Erro ao criar projeto:', result.error)
            error('Erro ao Criar', result.error)
            return
          }

          console.log('✅ Projeto criado com sucesso')
          success('Projeto Criado', 'Projeto criado com sucesso!')
          
          // Recarregar lista
          await reloadProjectsFromSupabase()
          setShowProjectForm(false)
          setEditingProject(undefined)
        } catch (apiError) {
          console.error('❌ Erro ao criar projeto no Supabase:', apiError)
          error('Erro ao Criar', 'Erro ao criar projeto')
        }
      }
    } catch (err) {
      console.error('❌ Erro ao salvar projeto:', err)
      error('Erro ao Salvar', 'Erro inesperado ao salvar projeto')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    
    setOperationLoading(true)
    try {
      // Deletar do Supabase
      try {
        console.log('📡 Deletando projeto via API...')
        const response = await fetch(`/api/admin/projects?id=${projectToDelete.id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('❌ Erro ao deletar projeto:', result.error)
          error('Erro ao Excluir', result.error)
          return
        }

        console.log('✅ Projeto deletado com sucesso')
        success('Projeto Excluído', `Projeto "${projectToDelete.title}" excluído com sucesso!`)
        
        // Recarregar lista
        await reloadProjectsFromSupabase()
        setShowDeleteDialog(false)
        setProjectToDelete(undefined)
      } catch (apiError) {
        console.error('❌ Erro ao deletar projeto no Supabase:', apiError)
        error('Erro ao Excluir', 'Erro ao excluir projeto')
      }
    } catch (err) {
      console.error('❌ Erro ao excluir projeto:', err)
      error('Erro ao Excluir', 'Erro inesperado ao excluir projeto')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleToggleStatus = async (project: Project) => {
    setOperationLoading(true)
    try {
      const newStatus = project.status === 'active' ? 'paused' : 'active'
      
      // Atualizar no Supabase
      try {
        console.log('🔄 Alterando status via API...')
        const response = await fetch('/api/admin/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: project.id,
            status: newStatus
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('❌ Erro ao alterar status:', result.error)
          error('Erro ao Alterar Status', result.error)
          return
        }

        console.log('✅ Status alterado com sucesso')
        success('Status Alterado', `Projeto ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso!`)
        
        // Recarregar lista
        await reloadProjectsFromSupabase()
      } catch (apiError) {
        console.error('❌ Erro ao alterar status no Supabase:', apiError)
        error('Erro ao Alterar Status', 'Erro ao alterar status do projeto')
      }
    } catch (err) {
      console.error('❌ Erro ao alterar status:', err)
      error('Erro ao Alterar Status', 'Erro inesperado ao alterar status')
    } finally {
      setOperationLoading(false)
    }
  }

  // Filtros
  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Debug: Log do estado dos projetos
  console.log('📊 [PROJETOS] Estado atual:', { 
    projects: projects.length, 
    filtered: filteredProjects.length, 
    filter, 
    searchTerm 
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'paused':
        return 'bg-orange-100 text-orange-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'paused':
        return 'Pausado'
      case 'completed':
        return 'Concluído'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconhecido'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'educacao':
        return 'Educação'
      case 'saude':
        return 'Saúde'
      case 'meio-ambiente':
        return 'Meio Ambiente'
      case 'esporte':
        return 'Esporte'
      case 'social':
        return 'Social'
      default:
        return 'Outro'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const [shareProject, setShareProject] = useState<Project | null>(null)

  return (
    <div className="max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gerenciar Projetos
            </h1>
            <p className="text-gray-600">
              Crie, edite e gerencie projetos do Instituto Imagine.
            </p>
          </div>
          <button 
            onClick={handleCreateProject}
            className="btn-primary"
          >
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-modern"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all')
                setSearchTerm('')
              }}
              className="btn-secondary w-full"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Projetos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
              <div className="w-full h-48 bg-gray-200 rounded mb-4" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
              <div className="h-2 bg-gray-200 rounded w-full mb-2" />
              <div className="h-2 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card p-6">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Toggle de Status */}
                <button
                  onClick={() => handleToggleStatus(project)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    project.status === 'active' 
                      ? 'bg-green-500' 
                      : 'bg-orange-500'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      project.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
            </div>

            {/* Imagem do Projeto */}
            <div className="mb-4">
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Informações do Projeto */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{getCategoryText(project.category)}</span>
                <span>{project.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Meta: {formatCurrency(project.target_amount)}</span>
                <span>Arrecadado: {formatCurrency(project.current_amount)}</span>
              </div>
            </div>

            {/* Barra de Progresso - apenas quando há meta */}
            {project.has_funding_goal !== false && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round((project.current_amount / (project.target_amount || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((project.current_amount / (project.target_amount || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ações do Projeto */}
            <div className="space-y-2">
              {/* Primeira linha - Ver/Editar */}
              <button
                onClick={() => handleEditProject(project)}
                className="w-full btn-primary text-sm"
              >
                Ver/Editar
              </button>
              
              {/* Segunda linha - Ações com ícones monocromáticos */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDuplicateProject(project)}
                  className="flex-1 flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Duplicar Projeto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => { window.location.href = `/projetos/${project.id}/relatorios` }}
                  className="flex-1 flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Relatórios do Projeto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShareProject(project)}
                  className="flex-1 flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Compartilhar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteProject(project)}
                  className="flex-1 flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Excluir Projeto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Estado Vazio - apenas quando não está carregando */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filter !== 'all' 
              ? 'Tente ajustar os filtros ou termo de busca.' 
              : 'Comece criando seu primeiro projeto.'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <button
              onClick={handleCreateProject}
              className="btn-primary"
            >
              Criar Primeiro Projeto
            </button>
          )}
        </div>
      )}

      {/* Modais */}
      {shareProject && (
        <Modal
          isOpen={true}
          onClose={() => setShareProject(null)}
          title="Compartilhar"
          size="md"
        >
          <div className="space-y-4 p-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projeto URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareProject.framer_project_url || ''}
                  className="input-modern flex-1 bg-gray-50"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => shareProject.framer_project_url && window.open(shareProject.framer_project_url, '_blank')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Abrir no navegador"
                  disabled={!shareProject.framer_project_url}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => shareProject.framer_project_url && navigator.clipboard.writeText(shareProject.framer_project_url)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copiar URL"
                  disabled={!shareProject.framer_project_url}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checkout URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateCheckoutUrl(shareProject.id, shareProject.title)}
                  className="input-modern flex-1 bg-gray-50"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => window.open(generateCheckoutUrl(shareProject.id, shareProject.title), '_blank')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Abrir no navegador"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(generateCheckoutUrl(shareProject.id, shareProject.title))}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copiar URL"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Embed do Checkout
              </label>
              <div className="space-y-2">
                <textarea
                  className="input-modern w-full h-24 bg-gray-50 text-sm font-mono resize-none"
                  readOnly
                  value={`<iframe src="${generateEmbedUrl(shareProject.id, shareProject.title)}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`<iframe src="${generateEmbedUrl(shareProject.id, shareProject.title)}" width=\"100%\" height=\"800\" frameborder=\"0\" style=\"border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);\"></iframe>`)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Copiar código
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(generateEmbedUrl(shareProject.id, shareProject.title), '_blank')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Visualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleSaveProject}
          onCancel={() => {
            setShowProjectForm(false)
            setEditingProject(undefined)
          }}
        />
      )}

      {showDeleteDialog && projectToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onCancel={() => {
            setShowDeleteDialog(false)
            setProjectToDelete(undefined)
          }}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o projeto "${projectToDelete.title}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  )
}