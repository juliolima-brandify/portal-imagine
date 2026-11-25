import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { jsonNoStore, verifyAdminMutationOrigin } from '@/lib/admin-http'
import { deleteBlogCoverIfOrphan } from '@/lib/blog-media'
import {
  ALLOWED_BLOG_POST_STATUSES,
  ALLOWED_BLOG_POST_TYPES,
  isValidBlogUuid,
  sanitizeAdminBlogPostPayload,
} from '@/lib/blog-posts'

const MAX_ADMIN_BLOG_PAGE = 10000
const DEFAULT_ADMIN_PAGE_SIZE = 24
const MAX_ADMIN_PAGE_SIZE = 100

const ADMIN_LIST_COLUMNS =
  'id,slug,title,excerpt,post_type,project_id,cover_image_url,cover_alt,status,seo_title,seo_description,reading_time_minutes,author_id,published_at,created_at,updated_at'

const ADMIN_DETAIL_COLUMNS = `${ADMIN_LIST_COLUMNS},content`

function mapDbError(error: { code?: string; message?: string }) {
  if (error?.code === '23505') {
    return jsonNoStore(
      { error: 'Já existe uma publicação com este slug. Escolha outro identificador de URL.' },
      { status: 409 }
    )
  }
  if (error?.code === '23503') {
    return jsonNoStore(
      { error: 'O projeto vinculado não foi encontrado no banco de dados.' },
      { status: 422 }
    )
  }
  if (error?.code === '22P02') {
    return jsonNoStore({ error: 'Formato de dado ou identificador inválido.' }, { status: 400 })
  }
  if (error?.code === '23502' || error?.code === '23514') {
    return jsonNoStore(
      { error: 'Os dados informados violam as regras de validação da publicação.' },
      { status: 422 }
    )
  }
  if (error?.code === '42P01') {
    return jsonNoStore(
      { error: 'Tabela blog_posts ainda não criada no Supabase. Aplique a migração SQL primeiro.' },
      { status: 503 }
    )
  }
  return jsonNoStore({ error: 'Erro ao persistir publicação no banco de dados.' }, { status: 500 })
}

function sanitizePostgrestSearchTerm(raw: string | null): string {
  if (!raw) return ''
  return raw
    .trim()
    .slice(0, 80)
    .replace(/[%_\\(),."']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (id) {
      if (!isValidBlogUuid(id)) {
        return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select(ADMIN_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('❌ API Blog: Erro ao buscar detalhe:', error)
        return mapDbError(error)
      }
      if (!data) {
        return jsonNoStore({ error: 'Publicação não encontrada.' }, { status: 404 })
      }
      return jsonNoStore({ data })
    }

    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
    const pageSizeParam = Number.parseInt(
      searchParams.get('pageSize') || String(DEFAULT_ADMIN_PAGE_SIZE),
      10
    )
    const page =
      Number.isFinite(pageParam) && pageParam > 0
        ? Math.min(MAX_ADMIN_BLOG_PAGE, pageParam)
        : 1
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(MAX_ADMIN_PAGE_SIZE, pageSizeParam)
        : DEFAULT_ADMIN_PAGE_SIZE
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const statusFilter = searchParams.get('status')?.trim() || ''
    const postTypeFilter = searchParams.get('post_type')?.trim() || ''
    const searchTerm = sanitizePostgrestSearchTerm(searchParams.get('q'))

    let listQuery = supabaseAdmin
      .from('blog_posts')
      .select(ADMIN_LIST_COLUMNS, { count: 'exact' })

    if ((ALLOWED_BLOG_POST_STATUSES as readonly string[]).includes(statusFilter)) {
      listQuery = listQuery.eq('status', statusFilter)
    }

    if ((ALLOWED_BLOG_POST_TYPES as readonly string[]).includes(postTypeFilter)) {
      listQuery = listQuery.eq('post_type', postTypeFilter)
    }

    if (searchTerm) {
      listQuery = listQuery.or(
        `title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`
      )
    }

    const [listRes, totalAllRes, publishedRes, draftRes, archivedRes] = await Promise.all([
      listQuery
        .order('updated_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to),
      supabaseAdmin.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabaseAdmin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabaseAdmin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'archived'),
    ])

    if (listRes.error) {
      console.error('❌ API Blog: Erro ao listar publicações:', listRes.error)
      return mapDbError(listRes.error)
    }

    return jsonNoStore({
      data: listRes.data || [],
      total: listRes.count ?? listRes.data?.length ?? 0,
      page,
      pageSize,
      stats: {
        total: totalAllRes.count ?? 0,
        published: publishedRes.count ?? 0,
        draft: draftRes.count ?? 0,
        archived: archivedRes.count ?? 0,
      },
    })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no GET:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminMutationOrigin(request)) {
    return jsonNoStore({ error: 'Origem não autorizada para esta operação.' }, { status: 403 })
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return jsonNoStore({ error: 'Content-Type deve ser application/json.' }, { status: 415 })
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição.' }, { status: 400 })
    }

    const sanitized = sanitizeAdminBlogPostPayload(body, 'create', {
      authorId: auth.user?.id || null,
    })

    if (!sanitized.ok) {
      return jsonNoStore({ error: sanitized.error }, { status: sanitized.status })
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert([sanitized.data])
      .select(ADMIN_DETAIL_COLUMNS)

    if (error) {
      console.error('❌ API Blog: Erro ao criar publicação:', error)
      return mapDbError(error)
    }

    return jsonNoStore({ data: data?.[0] }, { status: 201 })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no POST:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminMutationOrigin(request)) {
    return jsonNoStore({ error: 'Origem não autorizada para esta operação.' }, { status: 403 })
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return jsonNoStore({ error: 'Content-Type deve ser application/json.' }, { status: 415 })
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonNoStore({ error: 'JSON inválido na requisição.' }, { status: 400 })
    }

    const rawRecord =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : null

    const rawId = rawRecord ? String(rawRecord.id || '').trim() : ''
    if (!isValidBlogUuid(rawId)) {
      return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, { status: 400 })
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('blog_posts')
      .select('id,published_at,content,cover_image_url,updated_at')
      .eq('id', rawId)
      .maybeSingle()

    if (fetchErr) {
      console.error('❌ API Blog: Erro ao buscar publicação existente:', fetchErr)
      return mapDbError(fetchErr)
    }
    if (!existing) {
      return jsonNoStore({ error: 'Publicação não encontrada.' }, { status: 404 })
    }

    const expectedUpdatedAt =
      typeof rawRecord?.expected_updated_at === 'string'
        ? rawRecord.expected_updated_at.trim()
        : ''
    if (
      expectedUpdatedAt &&
      existing.updated_at &&
      new Date(expectedUpdatedAt).getTime() !== new Date(existing.updated_at).getTime()
    ) {
      return jsonNoStore(
        {
          error:
            'Esta publicação foi alterada por outro administrador. Recarregue a lista antes de salvar.',
        },
        { status: 409 }
      )
    }

    const sanitized = sanitizeAdminBlogPostPayload(body, 'update', {
      existingPublishedAt: existing.published_at || null,
      existingContent: existing.content || null,
    })

    if (!sanitized.ok || !sanitized.id) {
      return jsonNoStore(
        { error: sanitized.ok ? 'ID da publicação é obrigatório.' : sanitized.error },
        { status: sanitized.ok ? 400 : sanitized.status }
      )
    }

    let updateQuery = supabaseAdmin
      .from('blog_posts')
      .update(sanitized.data)
      .eq('id', sanitized.id)

    if (existing.updated_at) {
      updateQuery = updateQuery.eq('updated_at', existing.updated_at)
    }

    const { data, error } = await updateQuery.select(ADMIN_DETAIL_COLUMNS)

    if (error) {
      console.error('❌ API Blog: Erro ao atualizar publicação:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore(
        {
          error:
            'Esta publicação foi alterada ou removida simultaneamente. Recarregue a lista antes de salvar.',
        },
        { status: 409 }
      )
    }

    if (
      sanitized.data.cover_image_url !== undefined &&
      existing.cover_image_url &&
      existing.cover_image_url !== sanitized.data.cover_image_url
    ) {
      await deleteBlogCoverIfOrphan(existing.cover_image_url, existing.id)
    }

    return jsonNoStore({ data: data[0] })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no PUT:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminMutationOrigin(request)) {
    return jsonNoStore({ error: 'Origem não autorizada para esta operação.' }, { status: 403 })
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (!isValidBlogUuid(id)) {
      return jsonNoStore({ error: 'ID da publicação inválido (esperado UUID).' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id as string)
      .select('id,cover_image_url')

    if (error) {
      console.error('❌ API Blog: Erro ao excluir publicação:', error)
      return mapDbError(error)
    }

    if (!data || data.length === 0) {
      return jsonNoStore({ error: 'Publicação não encontrada.' }, { status: 404 })
    }

    if (data[0]?.cover_image_url) {
      await deleteBlogCoverIfOrphan(data[0].cover_image_url, data[0].id)
    }

    return jsonNoStore({ success: true })
  } catch (err) {
    console.error('❌ API Blog: Erro interno no DELETE:', err)
    return jsonNoStore({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
