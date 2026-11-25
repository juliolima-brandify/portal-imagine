'use client'

import { useRef, useState } from 'react'
import { Modal } from './ConfirmDialog'
import { adminFetch } from '@/lib/admin-api'
import {
  MAX_BLOG_COVER_BYTES,
  deriveExcerpt,
  hasReadableBlogContent,
  isValidBlogSlug,
  normalizeBlogSlug,
  sanitizeBlogCoverUrl,
  type BlogPostStatus,
  type BlogPostType,
  type DbBlogPostRow,
} from '@/lib/blog-posts'

export interface AdminProjectOption {
  id: string
  title: string
  slug?: string | null
}

interface BlogPostFormProps {
  post?: DbBlogPostRow
  projects: AdminProjectOption[]
  onSave: (payload: Record<string, unknown>, targetStatus: BlogPostStatus) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

async function compressImageToWebP(
  file: File
): Promise<{ blob: Blob; originalKB: number; finalKB: number }> {
  const originalKB = Math.max(1, Math.round(file.size / 1024))
  if (typeof window === 'undefined' || !('createImageBitmap' in window)) {
    return { blob: file, originalKB, finalKB: originalKB }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const maxWidth = 1600
    const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1
    const targetW = Math.max(1, Math.round(bitmap.width * scale))
    const targetH = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return { blob: file, originalKB, finalKB: originalKB }
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close()

    const qualities = [0.82, 0.72, 0.62]
    let bestBlob: Blob | null = null

    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/webp', q)
      )
      if (!blob) break
      bestBlob = blob
      if (blob.size <= 250 * 1024) break
    }

    if (bestBlob && bestBlob.size < file.size) {
      return {
        blob: bestBlob,
        originalKB,
        finalKB: Math.max(1, Math.round(bestBlob.size / 1024)),
      }
    }
    return { blob: file, originalKB, finalKB: originalKB }
  } catch {
    return { blob: file, originalKB, finalKB: originalKB }
  }
}

async function safeParseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text()
    if (!text) return {}
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function BlogPostForm({
  post,
  projects,
  onSave,
  onCancel,
  isEditing = false,
}: BlogPostFormProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [allowEditSlug, setAllowEditSlug] = useState(false)
  const [postType, setPostType] = useState<BlogPostType>(
    post?.post_type === 'accountability' ? 'accountability' : 'news'
  )
  const [projectId, setProjectId] = useState(post?.project_id || '')
  const [coverImageUrl, setCoverImageUrl] = useState(
    post?.cover_image_url ? sanitizeBlogCoverUrl(post.cover_image_url, '') : ''
  )
  const [coverAlt, setCoverAlt] = useState(post?.cover_alt || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [seoTitle, setSeoTitle] = useState(post?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(post?.seo_description || '')

  const [uploading, setUploading] = useState(false)
  const [uploadNote, setUploadNote] = useState('')
  const [submittingStatus, setSubmittingStatus] = useState<BlogPostStatus | null>(null)
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const uploadSeqRef = useRef(0)
  const manualAbortRef = useRef(false)
  const submitLockRef = useRef(false)

  const isBusy = submittingStatus !== null || uploading

  const effectiveSlug = isEditing
    ? allowEditSlug
      ? normalizeBlogSlug(slug)
      : post?.slug || ''
    : allowEditSlug
      ? normalizeBlogSlug(slug)
      : normalizeBlogSlug(title)

  const effectiveExcerpt = excerpt.trim() || deriveExcerpt(content, 155)
  const missingLinkedProject =
    Boolean(projectId) && !projects.some((p) => p.id === projectId)

  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    const el = textareaRef.current
    if (!el) {
      setContent((prev) => `${prev}${before}${placeholder}${after}`)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const selected = content.slice(start, end) || placeholder
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursorPos = start + before.length + selected.length + after.length
      el.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const handleCancelUpload = () => {
    manualAbortRef.current = true
    uploadSeqRef.current += 1
    uploadAbortRef.current?.abort()
    uploadAbortRef.current = null
    setUploading(false)
    setUploadNote('Envio cancelado.')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const seq = ++uploadSeqRef.current
    manualAbortRef.current = false
    setError('')
    setUploadNote('')
    setUploading(true)

    uploadAbortRef.current?.abort()
    const controller = new AbortController()
    uploadAbortRef.current = controller
    const timeoutId = window.setTimeout(() => controller.abort(), 30000)

    try {
      const { blob, originalKB, finalKB } = await compressImageToWebP(file)
      if (seq !== uploadSeqRef.current) return

      if (blob.size > MAX_BLOG_COVER_BYTES) {
        setError('A imagem excede o limite de 5 MB mesmo após otimização. Escolha um arquivo menor.')
        return
      }

      const formData = new FormData()
      const ext = blob.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg'
      formData.append('file', blob, `capa.${ext}`)

      const res = await adminFetch('/api/admin/blog/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      if (seq !== uploadSeqRef.current) return

      const json = await safeParseJson(res)
      if (!res.ok) {
        setError(String(json.error || 'Não foi possível enviar a imagem de capa.'))
        return
      }

      const uploadedData = json.data as { url?: string } | undefined
      if (!uploadedData?.url) {
        setError('Resposta inesperada ao salvar a capa.')
        return
      }

      setCoverImageUrl(sanitizeBlogCoverUrl(uploadedData.url, ''))
      if (!coverAlt.trim() && title.trim()) {
        setCoverAlt(title.trim())
      }
      setUploadNote(
        finalKB < originalKB
          ? `Capa otimizada: ${originalKB} KB → ${finalKB} KB`
          : `Capa enviada (${finalKB} KB)`
      )
    } catch (err: unknown) {
      if (seq !== uploadSeqRef.current || manualAbortRef.current) return
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setError(
        isAbort
          ? 'O envio da imagem demorou demais ou foi cancelado. Tente uma imagem menor.'
          : 'Erro de conexão ao enviar a capa. Tente novamente.'
      )
    } finally {
      window.clearTimeout(timeoutId)
      if (seq === uploadSeqRef.current) {
        uploadAbortRef.current = null
        setUploading(false)
      }
    }
  }

  const submitWithStatus = async (targetStatus: BlogPostStatus) => {
    if (submitLockRef.current || isBusy) return
    setError('')

    if (title.trim().length < 3) {
      setError('Informe um título com pelo menos 3 caracteres.')
      return
    }
    if (content.trim().length < 10) {
      setError('Escreva pelo menos 10 caracteres no texto da publicação.')
      return
    }
    if (!hasReadableBlogContent(content)) {
      setError('Escreva texto legível no conteúdo da publicação (não apenas marcadores vazios).')
      return
    }
    if (content.trim().length > 50000) {
      setError('O texto ultrapassa o limite máximo de 50.000 caracteres.')
      return
    }
    if (allowEditSlug && !slug.trim()) {
      setError('Informe a URL personalizada ou desmarque a opção de edição manual.')
      return
    }
    if (!isValidBlogSlug(effectiveSlug)) {
      setError(
        'URL inválida ou reservada. Ative "Personalizar URL" e use letras minúsculas, números e hífens.'
      )
      return
    }

    submitLockRef.current = true
    setSubmittingStatus(targetStatus)
    try {
      const safeCover = coverImageUrl.trim() ? sanitizeBlogCoverUrl(coverImageUrl, '') : ''
      const payload: Record<string, unknown> = {
        title: title.trim(),
        post_type: postType,
        project_id: projectId || null,
        cover_image_url: safeCover || null,
        cover_alt: safeCover ? coverAlt.trim() || title.trim() : '',
        content: content.trim(),
        excerpt: excerpt.trim(),
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        status: targetStatus,
      }

      if (isEditing && post?.id) {
        payload.id = post.id
        if (allowEditSlug) {
          payload.slug = normalizeBlogSlug(slug)
        }
      } else if (allowEditSlug) {
        payload.slug = normalizeBlogSlug(slug)
      }

      await onSave(payload, targetStatus)
      submitLockRef.current = false
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível salvar a publicação. Tente novamente.'
      setError(message)
      submitLockRef.current = false
      setSubmittingStatus(null)
    }
  }

  const secondaryLabel =
    submittingStatus === 'draft'
      ? 'Salvando...'
      : isEditing && post?.status === 'published'
        ? 'Mover para Rascunho'
        : 'Salvar Rascunho'

  const primaryLabel =
    submittingStatus === 'published'
      ? isEditing && post?.status === 'published'
        ? 'Salvando...'
        : 'Publicando...'
      : isEditing && post?.status === 'published'
        ? 'Salvar Alterações'
        : 'Publicar agora'

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (!isBusy) onCancel()
      }}
      title={isEditing ? 'Editar Publicação' : 'Nova Publicação'}
      size="xl"
      showCloseButton={!isBusy}
      closeOnOverlayClick={!isBusy}
      closeOnEscape={!isBusy}
      footer={
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="btn-secondary h-11 !py-0 px-4 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Cancelar
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {isEditing && post?.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => submitWithStatus('archived')}
                  disabled={isBusy}
                  className="btn-secondary h-11 !py-0 px-4 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submittingStatus === 'archived' ? 'Arquivando...' : 'Arquivar'}
                </button>
              )}
              <button
                type="button"
                onClick={() => submitWithStatus('draft')}
                disabled={isBusy}
                className="btn-secondary h-11 !py-0 px-4 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {secondaryLabel}
              </button>
              <button
                type="button"
                onClick={() => submitWithStatus('published')}
                disabled={isBusy}
                className="btn-primary h-11 !py-0 px-5 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. Título e URL */}
        <div>
          <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 mb-1.5">
            1. Título *
          </label>
          <input
            id="blog-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-modern"
            placeholder="Ex.: Entrega de 140 cestas básicas em novembro"
            maxLength={160}
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <span className="font-mono break-all min-w-0">
              URL: /blog/<strong className="text-gray-900">{effectiveSlug || 'url-automatica'}</strong>
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={allowEditSlug}
                onChange={(e) => {
                  const checked = e.target.checked
                  setAllowEditSlug(checked)
                  if (checked && !slug.trim()) {
                    setSlug(normalizeBlogSlug(post?.slug || title))
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              {isEditing
                ? 'Alterar URL manualmente (pode quebrar links antigos)'
                : 'Personalizar URL'}
            </label>
          </div>
          {allowEditSlug && (
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="input-modern mt-2 font-mono text-sm"
              placeholder="meu-slug-personalizado"
              maxLength={100}
            />
          )}
        </div>

        {/* 2 e 3. Tipo e Projeto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="blog-type" className="block text-sm font-medium text-gray-700 mb-1.5">
              2. Tipo *
            </label>
            <select
              id="blog-type"
              value={postType}
              onChange={(e) => setPostType(e.target.value as BlogPostType)}
              className="input-modern"
            >
              <option value="news">Notícia de Ação</option>
              <option value="accountability">Prestação de Contas</option>
            </select>
          </div>

          <div>
            <label htmlFor="blog-project" className="block text-sm font-medium text-gray-700 mb-1.5">
              3. Projeto vinculado
            </label>
            <select
              id="blog-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-modern"
            >
              <option value="">Institucional / Geral</option>
              {missingLinkedProject && (
                <option value={projectId}>Projeto vinculado (não listado)</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Foto de Capa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            4. Foto de Capa (otimizada automaticamente para WebP)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
            {coverImageUrl ? (
              <img
                src={sanitizeBlogCoverUrl(coverImageUrl)}
                alt={coverAlt || 'Prévia da capa'}
                className="w-28 h-16 object-cover rounded-md border border-gray-200 bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-28 h-16 rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                Sem capa
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="btn-secondary text-sm !py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {uploading ? 'Enviando...' : coverImageUrl ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {uploading && (
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="text-xs text-red-700 hover:underline font-medium px-2 py-1"
                  >
                    Cancelar envio
                  </button>
                )}
                {coverImageUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageUrl('')
                      setCoverAlt('')
                      setUploadNote('')
                    }}
                    disabled={isBusy}
                    className="text-xs text-red-700 hover:text-red-800 font-medium px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {uploadNote || 'JPG, PNG ou WebP até 5 MB. Recomendado 1200×630 para preview no WhatsApp.'}
              </p>
            </div>
          </div>

          {coverImageUrl && (
            <div className="mt-2">
              <label htmlFor="blog-cover-alt" className="block text-xs font-medium text-gray-700 mb-1">
                Descrição da foto (acessibilidade)
              </label>
              <input
                id="blog-cover-alt"
                type="text"
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                className="input-modern text-sm"
                placeholder="Ex.: Voluntários entregando cestas básicas"
                maxLength={200}
              />
            </div>
          )}
        </div>

        {/* 5. Texto da Publicação */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label htmlFor="blog-content" className="block text-sm font-medium text-gray-700">
              5. Texto da publicação *
            </label>
            <div className="flex items-center gap-1" role="toolbar" aria-label="Formatação de texto">
              <button
                type="button"
                aria-label="Inserir subtítulo H2"
                disabled={isBusy}
                onClick={() => insertMarkdown('\n## ', '\n', 'Subtítulo')}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                H2
              </button>
              <button
                type="button"
                aria-label="Inserir texto em negrito"
                disabled={isBusy}
                onClick={() => insertMarkdown('**', '**', 'destaque')}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Negrito
              </button>
              <button
                type="button"
                aria-label="Inserir item de lista"
                disabled={isBusy}
                onClick={() => insertMarkdown('\n- ', '', 'Item da lista')}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lista
              </button>
              <button
                type="button"
                aria-label="Inserir link"
                disabled={isBusy}
                onClick={() => insertMarkdown('[', '](https://imagineinstituto.com)', 'texto do link')}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Link
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="blog-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={50000}
            className="input-modern font-sans leading-relaxed"
            placeholder="Conte o que aconteceu na ação, quantas famílias foram atendidas ou como os recursos foram aplicados..."
          />
          <div className="mt-1 text-right text-xs text-gray-500 tabular-nums">
            {content.length.toLocaleString('pt-BR')} / 50.000 caracteres
          </div>
        </div>

        {/* Acordeão SEO opcional + Prévia WhatsApp */}
        <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <summary className="text-sm font-medium text-gray-800 cursor-pointer select-none">
            SEO e resumo avançado (opcional — gerado automaticamente se vazio)
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="blog-excerpt" className="block text-xs font-medium text-gray-700 mb-1">
                Resumo do card (até 300 caracteres)
              </label>
              <textarea
                id="blog-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                maxLength={300}
                className="input-modern !bg-white text-sm"
                placeholder={effectiveExcerpt || 'Preenchido automaticamente a partir do texto...'}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="blog-seo-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Título SEO (opcional)
                </label>
                <input
                  id="blog-seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={120}
                  className="input-modern !bg-white text-sm"
                  placeholder={title ? `${title} | Instituto Imagine` : 'Automático'}
                />
              </div>
              <div>
                <label htmlFor="blog-seo-desc" className="block text-xs font-medium text-gray-700 mb-1">
                  Descrição SEO (opcional)
                </label>
                <input
                  id="blog-seo-desc"
                  type="text"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={200}
                  className="input-modern !bg-white text-sm"
                  placeholder={effectiveExcerpt || 'Automática'}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Prévia no WhatsApp / Google: </span>
              <span className="text-gray-900 font-medium">
                {seoTitle.trim() ||
                  (title.trim() ? `${title.trim()} | Instituto Imagine` : 'Título da publicação')}
              </span>
              {' — '}
              <span>{seoDescription.trim() || effectiveExcerpt || 'Resumo automático aparecerá aqui.'}</span>
            </div>
          </div>
        </details>
      </div>
    </Modal>
  )
}
