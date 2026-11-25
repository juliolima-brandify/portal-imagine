import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  jsonNoStore,
  readBoundedFormData,
  verifyAdminMutationOrigin,
} from '@/lib/admin-http'
import { uploadBlogCoverBytes } from '@/lib/blog-media'
import { MAX_BLOG_COVER_BYTES } from '@/lib/blog-posts'

const MAX_MULTIPART_ENVELOPE_BYTES = MAX_BLOG_COVER_BYTES + 64 * 1024

export async function POST(request: NextRequest) {
  if (!verifyAdminMutationOrigin(request)) {
    return jsonNoStore({ error: 'Origem não autorizada para upload.' }, { status: 403 })
  }

  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const bodyResult = await readBoundedFormData(request, MAX_MULTIPART_ENVELOPE_BYTES)
    if (!bodyResult.ok) {
      return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status })
    }

    const file = bodyResult.formData.get('file')
    if (
      !file ||
      typeof file === 'string' ||
      typeof (file as Blob).arrayBuffer !== 'function' ||
      typeof (file as Blob).size !== 'number'
    ) {
      return jsonNoStore({ error: 'Nenhum arquivo enviado no campo "file".' }, { status: 400 })
    }

    const blob = file as Blob
    if (blob.size <= 0) {
      return jsonNoStore({ error: 'Arquivo de imagem vazio.' }, { status: 400 })
    }
    if (blob.size > MAX_BLOG_COVER_BYTES) {
      return jsonNoStore(
        { error: 'A imagem excede o limite de 5 MB. Reduza o arquivo e tente novamente.' },
        { status: 413 }
      )
    }

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const result = await uploadBlogCoverBytes(bytes)

    if (!result.ok) {
      return jsonNoStore({ error: result.error }, { status: result.status })
    }

    return jsonNoStore({ data: result.data }, { status: 201 })
  } catch (err) {
    console.error('❌ API Blog Upload: Erro interno:', err)
    return jsonNoStore({ error: 'Erro interno ao enviar imagem de capa.' }, { status: 500 })
  }
}
