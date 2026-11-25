import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadBlogCoverBytes } from '@/lib/blog-media'
import { MAX_BLOG_COVER_BYTES } from '@/lib/blog-posts'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

const ALLOWED_UPLOAD_ORIGINS = new Set([
  'https://imagineinstituto.com',
  'https://www.imagineinstituto.com',
  'https://portal.imagineinstituto.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
])

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_UPLOAD_ORIGINS.has(origin)) {
    const host = (request.headers.get('host') || '').toLowerCase()
    try {
      const parsed = new URL(origin)
      if (!host || parsed.host.toLowerCase() !== host) {
        return jsonNoStore({ error: 'Origem não autorizada para upload.' }, 403)
      }
    } catch {
      return jsonNoStore({ error: 'Origem não autorizada para upload.' }, 403)
    }
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BLOG_COVER_BYTES + 1024 * 64) {
      return jsonNoStore(
        { error: 'A imagem excede o limite de 5 MB. Reduza o arquivo e tente novamente.' },
        413
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return jsonNoStore({ error: 'Envie o arquivo no formato multipart/form-data.' }, 400)
    }

    const file = formData.get('file')
    if (
      !file ||
      typeof file === 'string' ||
      typeof (file as Blob).arrayBuffer !== 'function'
    ) {
      return jsonNoStore({ error: 'Nenhum arquivo enviado no campo "file".' }, 400)
    }

    const blob = file as Blob
    if (blob.size === 0) {
      return jsonNoStore({ error: 'Arquivo de imagem vazio.' }, 400)
    }
    if (blob.size > MAX_BLOG_COVER_BYTES) {
      return jsonNoStore(
        { error: 'A imagem excede o limite de 5 MB. Reduza o arquivo e tente novamente.' },
        413
      )
    }

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const result = await uploadBlogCoverBytes(bytes)

    if (!result.ok) {
      return jsonNoStore({ error: result.error }, result.status)
    }

    return jsonNoStore({ data: result.data }, 201)
  } catch (err) {
    console.error('❌ API Blog Upload: Erro interno:', err)
    return jsonNoStore({ error: 'Erro interno ao enviar imagem de capa.' }, 500)
  }
}
