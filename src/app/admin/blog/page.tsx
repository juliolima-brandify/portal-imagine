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

const ADMIN_PAGE_SIZE = 24

interface AdminBlogStats {
  total: number
  published: number
  draft: number
  archived: number
}

async function safeReadJson(res: Response): Promise<Record<string, unknown>> {
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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<DbBlogPostRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<AdminBlogStats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  })
  const [projects, setProjects] = useState<AdminProjectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'accountability'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<DbBlogPostRow | undefined>(undefined)
  const [postToDelete, setPostToDelete] = useState<DbBlogPostRow | undefined>(undefined)
  const [postToUnpublish, setPostToUnpublish] = useState<DbBlogPostRow | undefined>(undefined)
  const [operationLoading, setOperationLoading] = useState(false)

  const { toasts, removeToast, success, error, warning } = useToast()
  const toastRef = useRef({ success, error, warning })
  toastRef.current = { success, error, warning }
  const loadSeqRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const projectsRes = await adminFetch('/api/admin/projects')
        const projectsJson = await safeReadJson(projectsRes)
        if (!active) return
        if (projectsRes.ok) {
          const rawProjects =
            (projectsJson.data as Array<{ id: string; title: string; slug?: string | null }>) || []
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
        if (active) {
          toastRef.current.warning(
            'Lista de projetos indisponível',
            'Não foi possível carregar os projetos vinculados.'
          )
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const loadPosts = useCallback(async () => {
    const seq = ++loadSeqRef.current
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ADMIN_PAGE_SIZE),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('post_type', typeFilter)
      if (debouncedSearch) params.set('q', debouncedSearch)

      const postsRes = await adminFetch(`/api/admin/blog?${params.toString()}`)
      const postsJson = await safeReadJson(postsRes)
      if (seq !== loadSeqRef.current) return

      if (postsRes.ok) {
        const list = (postsJson.data as DbBlogPostRow[]) || []
        const nextTotal = typeof postsJson.total === 'number' ? postsJson.total : list.length
        setPosts(list)
        setTotal(nextTotal)

        if (postsJson.stats && typeof postsJson.stats === 'object') {
          const s = postsJson.stats as Partial<AdminBlogStats>
          setStats({
            total: typeof s.total === 'number' ? s.total : nextTotal,
            published: typeof s.published === 'number' ? s.published : 0,
            draft: typeof s.draft === 'number' ? s.draft : 0,
            archived: typeof s.archived === 'number' ? s.archived : 0,
          })
        }

        const totalPages = Math.max(1, Math.ceil(nextTotal / ADMIN_PAGE_SIZE))
        if (nextTotal > 0 && page > totalPages) {
          setPage(totalPages)
        }
      } else {
        setPosts([])
        setTotal(0)
        toastRef.current.error(
          'Erro ao carregar publicações',
          String(postsJson.error || 'Tente novamente.')
        )
      }
    } catch {
      if (seq !== loadSeqRef.current) return
      toastRef.current.error('Erro de conexão', 'Não foi possível carregar as publicações.')
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoading(false)
      }
    }
  }, [page, statusFilter, typeFilter, debouncedSearch])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const projectMap = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((p) => map.set(p.id, p.title))
    return map
  }, [projects])

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || debouncedSearch !== ''

  const handleOpenNew = () => {
    if (operationLoading) return
    setEditingPost(undefined)
    setShowForm(true)
  }

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
          await loadPosts()
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
    await loadPosts()
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
          setPostToUnpublish(undefined)
          await loadPosts()
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
      await loadPosts()
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
          await loadPosts()
        }
        return
      }
      toastRef.current.success('Publicação excluída', 'A publicação foi removida com sucesso.')
      setPostToDelete(undefined)
      await loadPosts()
    } catch {
      toastRef.current.error('Erro de conexão', 'Não foi possível excluir a publicação.')
    } finally {
      setOperationLoading(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setSearchTerm('')
    setDebouncedSearch('')
    setPage(1)
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
              <Link
                href="/blog"
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                /blog
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            disabled={operationLoading}
            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | BlogPostStatus)
                setPage(1)
              }}
              className="input-modern h-12"
            >
              <option value="all">Todos ({stats.total})</option>
              <option value="published">Publicados ({stats.published})</option>
              <option value="draft">Rascunhos ({stats.draft})</option>
              <option value="archived">Arquivados ({stats.archived})</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'news' | 'accountability')
                setPage(1)
              }}
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
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="input-modern h-12"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary w-full h-12 !py-0 flex items-center justify-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        {!isLoading && total > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            Exibindo {posts.length} de {total} publicações{hasActiveFilters ? ' neste filtro' : ''}
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
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma publicação encontrada
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              {stats.total === 0 && !hasActiveFilters
                ? 'Crie a primeira notícia ou prestação de contas para aparecer em /blog.'
                : 'Ajuste os filtros acima para localizar outras publicações.'}
            </p>
            {stats.total === 0 && !hasActiveFilters ? (
              <button
                type="button"
                onClick={handleOpenNew}
                disabled={operationLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Criar primeira publicação
              </button>
            ) : hasActiveFilters ? (
              <button type="button" onClick={clearFilters} className="btn-secondary">
                Limpar Filtros
              </button>
            ) : null}
          </div>
        ) : (
          <>
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
                  {posts.map((post) => {
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
                                prefetch={false}
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
                              className="inline-flex items-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {post.status === 'published' ? 'Ocultar' : 'Publicar'}
                            </button>
                            {post.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => void applyStatusChange(post, 'archived')}
                                disabled={operationLoading}
                                className="inline-flex items-center text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Arquivar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleOpenEdit(post)}
                              disabled={operationLoading}
                              className="inline-flex items-center text-xs font-medium text-gray-900 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPostToDelete(post)}
                              disabled={operationLoading}
                              className="inline-flex items-center text-xs font-medium text-red-700 hover:bg-red-50 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="btn-secondary text-sm !py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-medium text-gray-600 tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="btn-secondary text-sm !py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <BlogPostForm
          key={editingPost?.id ?? 'new'}
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
