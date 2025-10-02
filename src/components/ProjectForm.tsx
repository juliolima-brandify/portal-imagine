'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
      if (formData.target_amount <= 0) {
        throw new Error('Valor da meta deve ser maior que zero')
      }

      // Preparar dados para salvar
      const projectId = project?.id || crypto.randomUUID()
      const projectData = {
        ...formData,
        id: projectId,
        target_amount: Number(formData.target_amount),
        current_amount: project?.current_amount || 0,
        checkout_tracking_url: `https://portal.imagineinstituto.com/prototype/checkout/${projectId}?source=portal&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}`,
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

            {/* Localização */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-modern"
                placeholder="Cidade, Estado"
              />
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
                <button
                  type="button"
                  onClick={() => {
                    if (formData.framer_project_url) {
                      navigator.clipboard.writeText(formData.framer_project_url)
                      // Aqui você pode adicionar um toast de confirmação
                    }
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  title="Copiar link"
                >
                  📋
                </button>
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
                  value={formData.id ? `https://portal.imagineinstituto.com/prototype/checkout/${formData.id}?source=portal&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}` : 'Salve o projeto primeiro para gerar a URL'}
                  className="input-modern flex-1 bg-gray-50"
                  readOnly
                />
                <button
                  type="button"
                onClick={() => {
                  const url = formData.id ? `https://portal.imagineinstituto.com/prototype/checkout/${formData.id}?source=portal&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}` : ''
                  if (url) {
                    navigator.clipboard.writeText(url)
                    // Aqui você pode adicionar um toast de confirmação
                  }
                }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  title="Copiar link"
                  disabled={!formData.id}
                >
                  📋
                </button>
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
                  value={formData.id ? `<iframe src="https://portal.imagineinstituto.com/prototype/checkout/${formData.id}?source=embed&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>` : 'Salve o projeto primeiro para gerar o código embed'}
                  className="input-modern w-full h-24 bg-gray-50 text-sm font-mono resize-none"
                  readOnly
                  placeholder="Código embed será gerado automaticamente..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const embedCode = formData.id ? `<iframe src="https://portal.imagineinstituto.com/prototype/checkout/${formData.id}?source=embed&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>` : ''
                      if (embedCode) {
                        navigator.clipboard.writeText(embedCode)
                        // Aqui você pode adicionar um toast de confirmação
                      }
                    }}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                    title="Copiar código embed"
                    disabled={!formData.id}
                  >
                    📋 Copiar Código
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.id) {
                        const previewUrl = `https://portal.imagineinstituto.com/prototype/checkout/${formData.id}?source=embed&utm_campaign=${formData.title.toLowerCase().replace(/\s+/g, '-')}`
                        window.open(previewUrl, '_blank')
                      }
                    }}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium text-green-700 transition-colors"
                    title="Visualizar embed"
                    disabled={!formData.id}
                  >
                    👁️ Visualizar
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
