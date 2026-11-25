import { supabaseAdmin } from './supabase-admin'
import {
  MAX_BLOG_COVER_BYTES,
  detectImageMimeFromBytes,
  extensionForImageMime,
  extractBlogStoragePath,
} from './blog-posts'

const BLOG_STORAGE_BUCKET = 'blog'

export interface BlogMediaUploadResult {
  url: string
  path: string
  contentType: string
  size: number
}

/**
 * Adapter de storage de mídia do Blog.
 * Hoje grava no Supabase Storage (bucket público 'blog', cache longo).
 * Isolado aqui para permitir eventual migração para Cloudflare R2 sem alterar API nem UI.
 */
export async function uploadBlogCoverBytes(
  bytes: Uint8Array
): Promise<{ ok: true; data: BlogMediaUploadResult } | { ok: false; status: number; error: string }> {
  if (!bytes || bytes.length === 0) {
    return { ok: false, status: 400, error: 'Arquivo de imagem vazio.' }
  }

  if (bytes.length > MAX_BLOG_COVER_BYTES) {
    return {
      ok: false,
      status: 413,
      error: 'A imagem excede o limite de 5 MB. Reduza o arquivo e tente novamente.',
    }
  }

  const detectedMime = detectImageMimeFromBytes(bytes)
  if (!detectedMime) {
    return {
      ok: false,
      status: 415,
      error: 'Formato não suportado. Envie uma imagem válida em WebP, JPG ou PNG.',
    }
  }

  const ext = extensionForImageMime(detectedMime)
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const filePath = `covers/${yyyy}/${mm}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BLOG_STORAGE_BUCKET)
    .upload(filePath, bytes, {
      contentType: detectedMime,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    console.error('❌ Storage: Erro ao enviar capa do blog:', uploadError)
    return {
      ok: false,
      status: 500,
      error: 'Não foi possível salvar a imagem no storage. Verifique se o bucket "blog" está ativo.',
    }
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BLOG_STORAGE_BUCKET)
    .getPublicUrl(filePath)

  return {
    ok: true,
    data: {
      url: urlData.publicUrl,
      path: filePath,
      contentType: detectedMime,
      size: bytes.length,
    },
  }
}

function resolveSupabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

/**
 * Remove capa antiga do bucket 'blog' apenas se nenhum outro post a referenciar.
 * Falhas de limpeza são logadas sem bloquear a resposta da API.
 */
export async function deleteBlogCoverIfOrphan(
  coverUrl: string | null | undefined,
  ignorePostId?: string
): Promise<void> {
  const storagePath = extractBlogStoragePath(coverUrl, resolveSupabaseOrigin())
  if (!storagePath || !coverUrl) return

  try {
    let query = supabaseAdmin
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .like('cover_image_url', `%${storagePath}%`)

    if (ignorePostId) {
      query = query.neq('id', ignorePostId)
    }

    const { count, error } = await query
    if (error || count === null || count > 0) return

    const { error: removeError } = await supabaseAdmin.storage
      .from(BLOG_STORAGE_BUCKET)
      .remove([storagePath])

    if (removeError) {
      console.warn('⚠️ Storage: Falha ao remover capa órfã do blog:', removeError.message)
    }
  } catch (err) {
    console.warn('⚠️ Storage: Erro inesperado ao limpar capa órfã:', err)
  }
}
