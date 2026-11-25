'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/admin-api'
import BlogPostForm, { type AdminProjectOption } from '@/components/BlogPostForm'
import ConfirmDialog from '@/components/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/Toast'
import {
  formatBlogDatePTBR,
  getBlogPostTypeLabel,
  sanitizeBlogCoverUrl,
  type BlogPostStatus,
  type DbBlogPostRow,
} from '@/lib/blog-posts'

async function safeReadJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text()
    if (!text) return {}
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<DbBlogPostRow[]>([])
  const [projects, setProjects] = useState<AdminProjectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'accountability'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<DbBlogPostRow | undefined>(undefined)
  const [postToDelete, setPostToDelete] = useState<DbBlogPostRow | undefined>(undefined)
  const [postToUnpublish, setPostToUnpublish] = useState<DbBlogPostRow | undefined>(undefined)
  const [operationLoading, setOperationLoading] = useState(false)

  const { toasts, removeToast, success, error, warning } = useToast()
  const toastRef = useRef({ success, error, warning })
  toastRef.current = { success, error, warning }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [postsRes, projectsRes] = await Promise.all([
        adminFetch('/api/admin/blog?pageSize=200'),
        adminFetch('/api/admin/projects'),
      ])
      const [postsJson, projectsJson] = await Promise.all([
        safeReadJson(postsRes),
        safeReadJson(projectsRes),
      ])

      if (postsRes.ok) {
        setPosts((postsJson.data as DbBlogPostRow[]) || [])
      } else {
        setPosts([])
        toastRef.current.error(
          'Erro ao carregar publicações',
          String(postsJson.error || 'Tente novamente.')
        )
      }

      if (projectsRes.ok) {
        const rawProjects = (projectsJson.data as Array<{ id: string; title: string; slug?: string | null }>) || []
        setProjects(
          rawProjects.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
          }))
        )
      } else {
        toastRef.current.warning(
          'Lista de projetos indisponível',
          'Os nomes dos projetos não puderam ser carregados agora.'
        )
      }
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível carregar as publicações.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const projectMap = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((p) => map.set(p.id, p.title))
    return map
  }, [projects])

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return posts.filter((post) => {
      const matchStatus = statusFilter === 'all' || post.status === statusFilter
      const matchType = typeFilter === 'all' || post.post_type === typeFilter
      const matchQuery =
        !q ||
        (post.title || '').toLowerCase().includes(q) ||
        (post.slug || '').toLowerCase().includes(q) ||
        (post.excerpt || '').toLowerCase().includes(q)
      return matchStatus && matchType && matchQuery
    })
  }, [posts, statusFilter, typeFilter, searchTerm])

  const handleOpenEdit = async (post: DbBlogPostRow) => {
    if (operationLoading) return
    setOperationLoading(true)
    try {
      const res = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(post.id)}`)
      const json = await safeReadJson(res)
      if (!res.ok || !json.data) {
        toastRef.current.error(
          'Erro ao abrir publicação',
          String(json.error || 'Publicação não encontrada.')
        )
        if (res.status === 404) {
          await loadData()
        }
        return
      }
      setEditingPost(json.data as DbBlogPostRow)
      setShowForm(true)
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível carregar o texto da publicação.')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleSavePost = async (
    payload: Record<string, unknown>,
    targetStatus: BlogPostStatus
  ): Promise<void> => {
    const isEdit = Boolean(editingPost?.id)
    const bodyPayload =
      isEdit && editingPost?.updated_at
        ? { ...payload, expected_updated_at: editingPost.updated_at }
        : payload

    const res = await adminFetch('/api/admin/blog', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    })
    const json = await safeReadJson(res)
    if (!res.ok) {
      throw new Error(String(json.error || 'Verifique os campos informados e tente novamente.'))
    }

    const toastMsg =
      targetStatus === 'published'
        ? 'A publicação já está disponível em imagineinstituto.com/blog.'
        : targetStatus === 'archived'
          ? 'Publicação movida para o arquivo.'
          : 'Salvo como rascunho no painel.'

    toastRef.current.success(
      targetStatus === 'published'
        ? 'Publicação no ar'
        : targetStatus === 'archived'
          ? 'Arquivado'
          : 'Rascunho salvo',
      toastMsg
    )
    setShowForm(false)
    setEditingPost(undefined)
    await loadData()
  }

  const applyStatusChange = async (post: DbBlogPostRow, nextStatus: BlogPostStatus) => {
    if (operationLoading) return
    setOperationLoading(true)
    try {
      const res = await adminFetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          status: nextStatus,
          expected_updated_at: post.updated_at,
        }),
      })
      const json = await safeReadJson(res)
      if (!res.ok) {
        toastRef.current.error('Erro ao alterar status', String(json.error || 'Tente novamente.'))
        if (res.status === 404 || res.status === 409) {
          await loadData()
        }
        return
      }
      toastRef.current.success(
        nextStatus === 'published'
          ? 'Publicado'
          : nextStatus === 'archived'
            ? 'Arquivado'
            : 'Movido para rascunho',
        nextStatus === 'published'
          ? 'Publicação visível no site institucional.'
          : 'Publicação ocultada do site público.'
      )
      setPostToUnpublish(undefined)
      await loadData()
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível alterar o status.')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete || operationLoading) return
    setOperationLoading(true)
    try {
      const res = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(postToDelete.id)}`, {
        method: 'DELETE',
      })
      const json = await safeReadJson(res)
      if (!res.ok) {
        toastRef.current.error('Erro ao excluir', String(json.error || 'Tente novamente.'))
        if (res.status === 404) {
          setPostToDelete(undefined)
          await loadData()
        }
        return
      }
      toastRef.current.success('Publicação excluída', 'A publicação foi removida com sucesso.')
      setPostToDelete(undefined)
      await loadData()
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível excluir a publicação.')
    } finally {
      setOperationLoading(false)
    }
  }

  const statusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'published':
        return { label: 'Publicado', cls: 'bg-green-100 text-green-700' }
      case 'archived':
        return { label: 'Arquivado', cls: 'bg-gray-200 text-gray-700' }
      default:
        return { label: 'Rascunho', cls: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || searchTerm.trim() !== ''

  return (
    <div className="max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header — gabarito Tela Irmã (/admin/projetos) */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notícias e Prestação de Contas
            </h1>
            <p className="text-gray-600">
              Publique atualizações dos projetos e prestações de contas diretamente em{' '}
              <Link href="/blog" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                /blog
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPost(undefined)
              setShowForm(true)
            }}
            className="btn-primary whitespace-nowrap"
          >
            Nova Publicação
          </button>
        </div>
      </div>

      {/* Filtros e Busca — alinhamento uniforme */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | BlogPostStatus)}
              className="input-modern h-12"
            >
              <option value="all">Todos os Status</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'news' | 'accountability')}
              className="input-modern h-12"
            >
              <option value="all">Todos os Tipos</option>
              <option value="news">Notícias de Ação</option>
              <option value="accountability">Prestação de Contas</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              id="filter-search"
              type="text"
              placeholder="Buscar por título ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern h-12"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setTypeFilter('all')
                setSearchTerm('')
              }}
              className="btn-secondary w-full h-12 !py-0 flex items-center justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        {!isLoading && posts.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            Exibindo {filteredPosts.length} de {posts.length} publicações
          </div>
        )}
      </div>

      {/* Lista de Publicações */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="animate-pulse flex items-center gap-4">
                <div className="w-14 h-10 bg-gray-200 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma publicação encontrada
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              {posts.length === 0
                ? 'Crie a primeira notícia ou prestação de contas para aparecer em /blog.'
                : 'Ajuste os filtros acima para localizar outras publicações.'}
            </p>
            {posts.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPost(undefined)
                  setShowForm(true)
                }}
                className="btn-primary"
              >
                Criar primeira publicação
              </button>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setSearchTerm('')
                }}
                className="btn-secondary"
              >
                Limpar Filtros
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publicação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo / Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => {
                  const badge = statusBadge(post.status)
                  const typeLabel = getBlogPostTypeLabel(
                    post.post_type === 'accountability' ? 'accountability' : 'news'
                  )
                  const projectName = post.project_id
                    ? projectMap.get(post.project_id) || 'Projeto vinculado'
                    : 'Institucional / Geral'
                  const formattedDate = formatBlogDatePTBR(
                    post.published_at || post.updated_at || post.created_at
                  )

                  return (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <img
                            src={sanitizeBlogCoverUrl(post.cover_image_url)}
                            alt={post.cover_alt || post.title}
                            className="w-14 h-10 rounded object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {post.title}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                              /blog/{post.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="text-xs font-medium text-gray-900">{typeLabel}</div>
                        <div className="text-xs text-gray-500">{projectName}</div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left text-xs text-gray-600 whitespace-nowrap tabular-nums">
                        {formattedDate || '—'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {post.status === 'published' && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 transition-colors"
                            >
                              Ver
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (post.status === 'published') {
                                setPostToUnpublish(post)
                              } else {
                                void applyStatusChange(post, 'published')
                              }
                            }}
                            disabled={operationLoading}
                            className="inline-flex items-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {post.status === 'published' ? 'Ocultar' : 'Publicar'}
                          </button>
                          {post.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => void applyStatusChange(post, 'archived')}
                              disabled={operationLoading}
                              className="inline-flex items-center text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                            >
                              Arquivar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleOpenEdit(post)}
                            disabled={operationLoading}
                            className="inline-flex items-center text-xs font-medium text-gray-900 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setPostToDelete(post)}
                            disabled={operationLoading}
                            className="inline-flex items-center text-xs font-medium text-red-700 hover:bg-red-50 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <BlogPostForm
          post={editingPost}
          projects={projects}
          isEditing={Boolean(editingPost)}
          onSave={handleSavePost}
          onCancel={() => {
            setShowForm(false)
            setEditingPost(undefined)
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(postToUnpublish)}
        title="Ocultar publicação do site"
        message={`A publicação "${postToUnpublish?.title || ''}" (/blog/${postToUnpublish?.slug || ''}) está no ar e voltará para rascunho, saindo do site público. Deseja continuar?`}
        confirmText="Mover para rascunho"
        cancelText="Cancelar"
        type="warning"
        isLoading={operationLoading}
        onConfirm={() => {
          if (postToUnpublish) void applyStatusChange(postToUnpublish, 'draft')
        }}
        onCancel={() => setPostToUnpublish(undefined)}
      />

      <ConfirmDialog
        isOpen={Boolean(postToDelete)}
        title="Excluir publicação"
        message={`Tem certeza que deseja excluir "${postToDelete?.title || ''}" (status: ${statusBadge(postToDelete?.status).label}, URL: /blog/${postToDelete?.slug || ''})? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={operationLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(undefined)}
      />
    </div>
  )
}
