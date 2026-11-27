'use client'

import { useState } from 'react'
import { generateCheckoutUrl, generateEmbedUrl } from '@/lib/urls'
import {
  normalizeSlug,
  type ProjectCategory,
  type ProjectColorClass,
  type ProjectSiteData,
  type ProjectStatus,
} from '@/lib/site-projects'
import { Modal } from './ConfirmDialog'

export interface AdminProject {
  id: string
  title: string
  description: string
  long_description?: string
  category: ProjectCategory
  target_amount: number
  current_amount: number
  status: ProjectStatus
  location?: string
  image_url?: string
  slug?: string | null
  show_on_site?: boolean
  site_order?: number
  site_data?: ProjectSiteData
  created_at?: string
  updated_at?: string
}

interface ProjectFormProps {
  project?: AdminProject
  onSave: (project: Partial<AdminProject>) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

const CATEGORIES: { value: ProjectCategory; label: string; defaultCausa: string; defaultCor: ProjectColorClass }[] = [
  { value: 'cultura', label: 'Cultura e Artes', defaultCausa: 'Cultura e Artes', defaultCor: 'cor-magenta' },
  { value: 'educacao', label: 'Educação', defaultCausa: 'Educação', defaultCor: 'cor-verde' },
  { value: 'esporte', label: 'Esporte', defaultCausa: 'Esporte', defaultCor: 'cor-azul' },
  { value: 'social', label: 'Assistência Social', defaultCausa: 'Assistência Social', defaultCor: 'cor-laranja' },
  { value: 'saude', label: 'Saúde', defaultCausa: 'Saúde', defaultCor: 'cor-magenta' },
  { value: 'meio-ambiente', label: 'Meio Ambiente', defaultCausa: 'Meio Ambiente', defaultCor: 'cor-verde' },
]

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
]

const COLOR_OPTIONS: { value: ProjectColorClass; label: string }[] = [
  { value: 'cor-magenta', label: 'Magenta (Artes / Saúde)' },
  { value: 'cor-verde', label: 'Verde (Educação)' },
  { value: 'cor-azul', label: 'Azul (Esporte)' },
  { value: 'cor-laranja', label: 'Laranja (Ação Social)' },
]

export default function ProjectForm({
  project,
  onSave,
  onCancel,
  isEditing = false,
}: ProjectFormProps) {
  const initialSiteData: ProjectSiteData = project?.site_data || {}

  const initialCategory: ProjectCategory = project?.category || 'educacao'
  const initialCategoryMeta = CATEGORIES.find((c) => c.value === initialCategory)

  const [title, setTitle] = useState(project?.title || '')
  const [description, setDescription] = useState(project?.description || '')
  const [category, setCategory] = useState<ProjectCategory>(initialCategory)
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'active')
  const [targetAmount, setTargetAmount] = useState<string>(String(project?.target_amount ?? 0))
  const [location, setLocation] = useState(project?.location || 'Uberlândia, MG')
  const [imageUrl, setImageUrl] = useState(project?.image_url || '')

  // Campos do Site Institucional
  const [showOnSite, setShowOnSite] = useState<boolean>(project?.show_on_site ?? true)
  const [slug, setSlug] = useState<string>(project?.slug || '')
  const [slugTouched, setSlugTouched] = useState<boolean>(Boolean(project?.slug))
  const [siteOrder, setSiteOrder] = useState<string>(String(project?.site_order ?? 100))

  const [frente, setFrente] = useState(initialSiteData.frente || '')
  const [causa, setCausa] = useState(initialSiteData.causa || initialCategoryMeta?.defaultCausa || '')
  const [causaTouched, setCausaTouched] = useState<boolean>(Boolean(initialSiteData.causa))
  const [corClass, setCorClass] = useState<ProjectColorClass>(
    initialSiteData.corClass || initialCategoryMeta?.defaultCor || 'cor-verde'
  )
  const [copiedFeedback, setCopiedFeedback] = useState<string>('')
  const [heroImg, setHeroImg] = useState(initialSiteData.heroImg || '')
  const [altText, setAltText] = useState(initialSiteData.alt || '')
  const [resumo, setResumo] = useState(initialSiteData.resumo || '')
  const [intro, setIntro] = useState(initialSiteData.intro || project?.long_description || '')
  const [desafio, setDesafio] = useState(initialSiteData.desafio || '')
  const [fazemosText, setFazemosText] = useState(
    Array.isArray(initialSiteData.fazemos) ? initialSiteData.fazemos.join('\n') : ''
  )
  const [incentivoTag, setIncentivoTag] = useState(initialSiteData.incentivoTag || '')
  const [incentivoAviso, setIncentivoAviso] = useState(initialSiteData.incentivoAviso || '')

  const [activeLinksTab, setActiveLinksTab] = useState<'site' | 'checkout' | 'embed'>('site')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const normalizedSlugPreview = normalizeSlug(slug)
  const publicSiteUrl = normalizedSlugPreview
    ? `https://imagineinstituto.com/projetos/${normalizedSlugPreview}`
    : ''

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing && !slugTouched) {
      setSlug(normalizeSlug(val))
    }
  }

  const handleCategoryChange = (val: ProjectCategory) => {
    setCategory(val)
    const found = CATEGORIES.find((c) => c.value === val)
    if (found && !isEditing) {
      if (!causaTouched) setCausa(found.defaultCausa)
      setCorClass(found.defaultCor)
    }
  }

  const copyWithFeedback = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFeedback(label)
      setTimeout(() => setCopiedFeedback(''), 2000)
    } catch {
      setCopiedFeedback('Não foi possível copiar')
      setTimeout(() => setCopiedFeedback(''), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const parsedTarget = targetAmount === '' ? 0 : Number(targetAmount)
    const parsedOrder = siteOrder === '' ? 100 : Number(siteOrder)
    const cleanSlug = normalizeSlug(slug)

    if (!cleanTitle) {
      setError('Título do projeto é obrigatório.')
      return
    }
    if (!cleanDescription) {
      setError('Descrição é obrigatória.')
      return
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
      setError('Meta de arrecadação deve ser um número válido (>= 0).')
      return
    }
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0 || parsedOrder > 9999) {
      setError('Ordem no site deve ser um número inteiro entre 0 e 9999.')
      return
    }
    if (showOnSite && !cleanSlug) {
      setError('Informe um slug de URL para exibir o projeto no site institucional.')
      return
    }

    const fazemos = fazemosText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const siteData: ProjectSiteData = {
      ...(frente.trim() ? { frente: frente.trim() } : {}),
      ...(causa.trim() ? { causa: causa.trim() } : {}),
      corClass,
      ...(heroImg.trim() ? { heroImg: heroImg.trim() } : {}),
      ...(altText.trim() ? { alt: altText.trim() } : {}),
      ...(resumo.trim() ? { resumo: resumo.trim() } : {}),
      ...(intro.trim() ? { intro: intro.trim() } : {}),
      ...(desafio.trim() ? { desafio: desafio.trim() } : {}),
      ...(fazemos.length > 0 ? { fazemos } : {}),
      ...(incentivoTag.trim() ? { incentivoTag: incentivoTag.trim() } : {}),
      ...(incentivoAviso.trim() ? { incentivoAviso: incentivoAviso.trim() } : {}),
      ...(initialSiteData.beneficiarios ? { beneficiarios: initialSiteData.beneficiarios } : {}),
      ...(initialSiteData.metaTexto ? { metaTexto: initialSiteData.metaTexto } : {}),
      ...(initialSiteData.portalCampaignSlug
        ? { portalCampaignSlug: initialSiteData.portalCampaignSlug }
        : cleanSlug
          ? { portalCampaignSlug: cleanSlug }
          : {}),
    }

    const payload: Partial<AdminProject> = {
      title: cleanTitle,
      description: cleanDescription,
      long_description: intro.trim() || cleanDescription,
      category,
      status,
      target_amount: parsedTarget,
      location: location.trim(),
      image_url: imageUrl.trim(),
      slug: cleanSlug || null,
      show_on_site: showOnSite,
      site_order: parsedOrder,
      site_data: siteData,
    }

    setLoading(true)
    try {
      await onSave(payload)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Editar Projeto' : 'Novo Projeto'}
      size="lg"
      showCloseButton={!loading}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      footer={
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="project-form"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </div>
        </div>
      }
    >

      <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Dados básicos */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título do Projeto *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="input-modern"
            placeholder="Ex.: Artes e Expressão"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição Resumida *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-modern"
            placeholder="Resumo exibido nos cards do portal e como padrão no site"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ProjectCategory)}
              className="input-modern"
              required
            >
              {CATEGORIES.map((cat) => (
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
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="input-modern"
              required
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-2">
              Meta de Arrecadação (R$)
            </label>
            <input
              type="number"
              id="target_amount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input-modern"
              placeholder="0"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use 0 quando ainda não houver meta financeira definida.
            </p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Localização
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-modern"
              placeholder="Uberlândia, MG"
            />
          </div>
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
            Imagem do Cartão (caminho /img/... ou URL https://)
          </label>
          <input
            type="text"
            id="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input-modern"
            placeholder="/img/esporte.webp ou https://..."
          />
        </div>

        {/* Seção Site Institucional */}
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Site Institucional</h3>
              <p className="text-xs text-gray-500">
                Controla a exibição automática na Home (/) e em /projetos/[slug].
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnSite}
                onChange={(e) => setShowOnSite(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Exibir no site
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug da URL {showOnSite ? '*' : ''}
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                className="input-modern"
                placeholder="ex.: artes, esporte, musica-jovem"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL pública:{' '}
                <span className="font-mono">
                  {normalizedSlugPreview ? `/projetos/${normalizedSlugPreview}` : '—'}
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="site_order" className="block text-sm font-medium text-gray-700 mb-2">
                Ordem no site
              </label>
              <input
                type="number"
                id="site_order"
                value={siteOrder}
                onChange={(e) => setSiteOrder(e.target.value)}
                className="input-modern"
                min="0"
                max="9999"
                step="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="frente" className="block text-sm font-medium text-gray-700 mb-2">
                Subtítulo / Frente
              </label>
              <input
                type="text"
                id="frente"
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                className="input-modern"
                placeholder="Ex.: Ministério de Artes"
              />
            </div>

            <div>
              <label htmlFor="causa" className="block text-sm font-medium text-gray-700 mb-2">
                Causa (filtro da Home)
              </label>
              <input
                type="text"
                id="causa"
                value={causa}
                onChange={(e) => {
                  setCausaTouched(true)
                  setCausa(e.target.value)
                }}
                className="input-modern"
                placeholder="Ex.: Cultura e Artes"
              />
            </div>

            <div>
              <label htmlFor="corClass" className="block text-sm font-medium text-gray-700 mb-2">
                Cor do destaque
              </label>
              <select
                id="corClass"
                value={corClass}
                onChange={(e) => setCorClass(e.target.value as ProjectColorClass)}
                className="input-modern"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="heroImg" className="block text-sm font-medium text-gray-700 mb-2">
                Imagem de Capa / Banner (opcional)
              </label>
              <input
                type="text"
                id="heroImg"
                value={heroImg}
                onChange={(e) => setHeroImg(e.target.value)}
                className="input-modern"
                placeholder="Se vazio, usa a imagem do cartão"
              />
            </div>

            <div>
              <label htmlFor="altText" className="block text-sm font-medium text-gray-700 mb-2">
                Texto alternativo da imagem (alt)
              </label>
              <input
                type="text"
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="input-modern"
                placeholder="Descrição acessível da foto"
              />
            </div>
          </div>

          <div>
            <label htmlFor="resumo" className="block text-sm font-medium text-gray-700 mb-2">
              Resumo curto no site (opcional)
            </label>
            <textarea
              id="resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="input-modern"
              rows={2}
              placeholder="Se vazio, usa a Descrição Resumida"
            />
          </div>

          <div>
            <label htmlFor="intro" className="block text-sm font-medium text-gray-700 mb-2">
              Texto principal (&quot;O projeto&quot;)
            </label>
            <textarea
              id="intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="input-modern"
              rows={3}
              placeholder="Apresentação completa exibida na página do projeto"
            />
          </div>

          <div>
            <label htmlFor="desafio" className="block text-sm font-medium text-gray-700 mb-2">
              O desafio (opcional)
            </label>
            <textarea
              id="desafio"
              value={desafio}
              onChange={(e) => setDesafio(e.target.value)}
              className="input-modern"
              rows={2}
              placeholder="Contexto do problema que o projeto resolve"
            />
          </div>

          <div>
            <label htmlFor="fazemos" className="block text-sm font-medium text-gray-700 mb-2">
              O que fazemos (1 item por linha)
            </label>
            <textarea
              id="fazemos"
              value={fazemosText}
              onChange={(e) => setFazemosText(e.target.value)}
              className="input-modern"
              rows={3}
              placeholder={'Aulas regulares no tatame\nAcompanhamento das famílias'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="incentivoTag" className="block text-sm font-medium text-gray-700 mb-2">
                Tag de lei de incentivo (opcional)
              </label>
              <input
                type="text"
                id="incentivoTag"
                value={incentivoTag}
                onChange={(e) => setIncentivoTag(e.target.value)}
                className="input-modern"
                placeholder="Ex.: Pode ser incentivado · Cultura"
              />
            </div>

            <div>
              <label htmlFor="incentivoAviso" className="block text-sm font-medium text-gray-700 mb-2">
                Aviso de IR na página (opcional)
              </label>
              <input
                type="text"
                id="incentivoAviso"
                value={incentivoAviso}
                onChange={(e) => setIncentivoAviso(e.target.value)}
                className="input-modern"
                placeholder="Texto explicativo sobre destinação de IR"
              />
            </div>
          </div>
        </div>

        {/* Links e incorporações */}
        <div className="pt-4 border-t border-gray-200">
          <div className="border-b border-gray-200 mb-4">
            <div className="-mb-px flex flex-wrap items-center gap-4" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeLinksTab === 'site'}
                onClick={() => setActiveLinksTab('site')}
                className={`py-2 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeLinksTab === 'site'
                    ? 'border-green-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                URL no Site
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeLinksTab === 'checkout'}
                onClick={() => setActiveLinksTab('checkout')}
                className={`py-2 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeLinksTab === 'checkout'
                    ? 'border-green-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Checkout URL
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeLinksTab === 'embed'}
                onClick={() => setActiveLinksTab('embed')}
                className={`py-2 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeLinksTab === 'embed'
                    ? 'border-green-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Embed do Checkout
              </button>
            </div>
          </div>

          {copiedFeedback && (
            <p className="text-xs text-green-700 mb-2" role="status">
              {copiedFeedback}
            </p>
          )}

          {activeLinksTab === 'site' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={publicSiteUrl || 'Defina um slug para gerar a URL pública do projeto'}
                className="input-modern flex-1 bg-gray-50"
                readOnly
              />
              <button
                type="button"
                onClick={() => publicSiteUrl && copyWithFeedback(publicSiteUrl, 'URL do site copiada!')}
                className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!publicSiteUrl}
              >
                Copiar
              </button>
            </div>
          )}

          {activeLinksTab === 'checkout' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={
                  project?.id
                    ? generateCheckoutUrl(project.id, title || project.title)
                    : 'Salve o projeto primeiro para gerar a URL'
                }
                className="input-modern flex-1 bg-gray-50"
                readOnly
              />
              <button
                type="button"
                onClick={() => {
                  if (project?.id) {
                    copyWithFeedback(
                      generateCheckoutUrl(project.id, title || project.title),
                      'URL de checkout copiada!'
                    )
                  }
                }}
                className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!project?.id}
              >
                Copiar
              </button>
            </div>
          )}

          {activeLinksTab === 'embed' && (
            <div className="space-y-2">
              <textarea
                value={
                  project?.id
                    ? `<iframe src="${generateEmbedUrl(project.id, title || project.title)}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`
                    : 'Salve o projeto primeiro para gerar o código embed'
                }
                className="input-modern w-full h-24 bg-gray-50 text-sm font-mono resize-none"
                readOnly
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (project?.id) {
                      copyWithFeedback(
                        `<iframe src="${generateEmbedUrl(project.id, title || project.title)}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`,
                        'Código embed copiado!'
                      )
                    }
                  }}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!project?.id}
                >
                  Copiar código
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (project?.id) {
                      window.open(
                        generateEmbedUrl(project.id, title || project.title),
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  }}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!project?.id}
                >
                  Visualizar
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
