'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateCheckoutUrl, generateEmbedUrl } from '@/lib/urls'
import { Modal } from './ConfirmDialog'

interface Project {
  id: string
  title: string
  description: string
  category: 'educacao' | 'saude' | 'meio-ambiente' | 'esporte' | 'social'
  target_amount: number
  current_amount: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  location?: string
  image_url?: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  framer_project_url?: string
  checkout_tracking_url?: string
  has_funding_goal?: boolean
}

interface ProjectFormProps {
  project?: Project
  onSave: (project: Project) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export default function ProjectForm({ project, onSave, onCancel, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<Project>({
    id: '',
    title: '',
    description: '',
    category: 'educacao',
    target_amount: 0,
    current_amount: 0,
    location: '',
    image_url: '',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    framer_project_url: '',
    has_funding_goal: true,
    ...project
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { value: 'educacao', label: 'Educação' },
    { value: 'saude', label: 'Saúde' },
    { value: 'meio-ambiente', label: 'Meio Ambiente' },
    { value: 'esporte', label: 'Esporte' },
    { value: 'social', label: 'Social' }
  ]

  const statuses = [
    { value: 'active', label: 'Ativo' },
    { value: 'paused', label: 'Pausado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' }
  ]

  const brazilianStates = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ]

  const [locationInput, setLocationInput] = useState(formData.location || '')
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [filteredStates, setFilteredStates] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações básicas
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório')
      }
      if (!formData.description.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      if (formData.has_funding_goal && formData.target_amount <= 0) {
        throw new Error('Valor da meta deve ser maior que zero quando meta está habilitada')
      }

      // Preparar dados para salvar
      const projectId = project?.id || crypto.randomUUID()
      const projectData = {
        ...formData,
        id: projectId,
        target_amount: Number(formData.target_amount),
        current_amount: project?.current_amount || 0,
        checkout_tracking_url: generateCheckoutUrl(projectId, formData.title),
        created_at: project?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      onSave(projectData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLocationChange = (value: string) => {
    setLocationInput(value)
    setFormData(prev => ({
      ...prev,
      location: value
    }))

    if (value.length > 0) {
      const filtered = brazilianStates.filter(state =>
        state.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredStates(filtered)
      setShowLocationSuggestions(filtered.length > 0)
    } else {
      setShowLocationSuggestions(false)
      setFilteredStates([])
    }
  }

  const selectState = (state: string) => {
    setLocationInput(state)
    setFormData(prev => ({
      ...prev,
      location: state
    }))
    setShowLocationSuggestions(false)
  }

  const handleFundingGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasGoal = e.target.checked
    setFormData(prev => ({
      ...prev,
      has_funding_goal: hasGoal,
      target_amount: hasGoal ? prev.target_amount : 0
    }))
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Editar Projeto' : 'Novo Projeto'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="project-form"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar Projeto' : 'Criar Projeto')}
          </button>
        </div>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título do Projeto *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-modern"
                placeholder="Digite o título do projeto"
                required
              />
            </div>


            {/* Descrição Detalhada */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-modern"
                placeholder="Descrição completa do projeto"
                rows={5}
                required
              />
            </div>

            {/* Categoria e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meta de Arrecadação */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="has_funding_goal"
                  checked={formData.has_funding_goal}
                  onChange={handleFundingGoalChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="has_funding_goal" className="ml-2 block text-sm font-medium text-gray-700">
                  Definir meta de arrecadação
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {formData.has_funding_goal 
                  ? 'Quando habilitada, a meta será exibida no checkout do projeto'
                  : 'Quando desabilitada, a meta ficará oculta no checkout do projeto'
                }
              </p>
              
              {formData.has_funding_goal && (
                <div>
                  <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta de Arrecadação (R$) *
                  </label>
                  <input
                    type="number"
                    id="target_amount"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              )}
            </div>

            {/* Localização */}
            <div className="relative">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={locationInput}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => {
                  if (filteredStates.length > 0) {
                    setShowLocationSuggestions(true)
                  }
                }}
                onBlur={() => {
                  // Delay para permitir clique nas sugestões
                  setTimeout(() => setShowLocationSuggestions(false), 200)
                }}
                className="input-modern"
                placeholder="Digite o estado (ex: São Paulo)"
                autoComplete="off"
              />
              
              {/* Sugestões de Estados */}
              {showLocationSuggestions && filteredStates.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredStates.map((state, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectState(state)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {state}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Digite para buscar estados brasileiros automaticamente
              </p>
            </div>


            {/* URL da Imagem */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="input-modern"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            {/* URL do Projeto Framer */}
            <div>
              <label htmlFor="framer_project_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL do Projeto Framer *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="framer_project_url"
                  name="framer_project_url"
                  value={formData.framer_project_url}
                  onChange={handleChange}
                  className="input-modern flex-1"
                  placeholder="https://imagineinstituto.com/projetos/ID_DO_PROJETO"
                  required
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.framer_project_url) {
                        window.open(formData.framer_project_url, '_blank')
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ir para"
                    disabled={!formData.framer_project_url}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.framer_project_url) {
                        navigator.clipboard.writeText(formData.framer_project_url)
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar"
                    disabled={!formData.framer_project_url}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Link para a página detalhada do projeto no site principal (Framer)
              </p>
            </div>

            {/* URL do Checkout com Tracking (Automática) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Checkout com Tracking
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.id ? generateCheckoutUrl(formData.id, formData.title) : 'Salve o projeto primeiro para gerar a URL'}
                  className="input-modern flex-1 bg-gray-50"
                  readOnly
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = formData.id ? generateCheckoutUrl(formData.id, formData.title) : ''
                      if (url) {
                        window.open(url, '_blank')
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ir para"
                    disabled={!formData.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = formData.id ? generateCheckoutUrl(formData.id, formData.title) : ''
                      if (url) {
                        navigator.clipboard.writeText(url)
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar"
                    disabled={!formData.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL gerada automaticamente baseada no ID do projeto
              </p>
            </div>

            {/* Código Embed do Checkout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Embed do Checkout
              </label>
              <div className="space-y-2">
                <textarea
                  value={formData.id ? `<iframe src="${generateEmbedUrl(formData.id, formData.title)}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>` : 'Salve o projeto primeiro para gerar o código embed'}
                  className="input-modern w-full h-24 bg-gray-50 text-sm font-mono resize-none"
                  readOnly
                  placeholder="Código embed será gerado automaticamente..."
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const embedCode = formData.id ? `<iframe src="${generateEmbedUrl(formData.id, formData.title)}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>` : ''
                      if (embedCode) {
                        navigator.clipboard.writeText(embedCode)
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar"
                    disabled={!formData.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.id) {
                        const previewUrl = generateEmbedUrl(formData.id, formData.title)
                        window.open(previewUrl, '_blank')
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizar"
                    disabled={!formData.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Código iframe para incorporar o checkout em sites externos
              </p>
            </div>

          </form>
    </Modal>
  )
}
