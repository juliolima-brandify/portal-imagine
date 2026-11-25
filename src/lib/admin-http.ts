import { NextRequest, NextResponse } from 'next/server'

const PROD_ALLOWED_HOSTNAMES = new Set([
  'portal.imagineinstituto.com',
  'imagineinstituto.com',
  'www.imagineinstituto.com',
])

export function jsonNoStore(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, private',
      ...(init?.headers ?? {}),
    },
  })
}

function isLocalhostHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function verifyAdminMutationOrigin(request: NextRequest): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site')?.trim().toLowerCase()
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site' && secFetchSite !== 'none') {
    return false
  }

  const originHeader = request.headers.get('origin')
  if (!originHeader) {
    // Clientes server-to-server ou curl já dependem do Bearer token validado em requireAdmin()
    return true
  }

  let parsedOrigin: URL
  try {
    parsedOrigin = new URL(originHeader)
  } catch {
    return false
  }

  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) {
    if (parsedOrigin.protocol !== 'https:') return false
  } else {
    if (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:') return false
    if (parsedOrigin.protocol === 'http:' && !isLocalhostHostname(parsedOrigin.hostname)) {
      return false
    }
  }

  if (!isProd && isLocalhostHostname(parsedOrigin.hostname)) {
    return true
  }

  if (PROD_ALLOWED_HOSTNAMES.has(parsedOrigin.hostname.toLowerCase())) {
    return true
  }

  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envSiteUrl) {
    try {
      const envOrigin = new URL(envSiteUrl)
      if ((!isProd || envOrigin.protocol === 'https:') && envOrigin.origin === parsedOrigin.origin) {
        return true
      }
    } catch {
      // ignora NEXT_PUBLIC_SITE_URL malformada
    }
  }

  const hostHeader = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase()

  if (hostHeader && parsedOrigin.host.toLowerCase() === hostHeader) {
    return true
  }

  return false
}

export async function readBoundedFormData(
  request: NextRequest,
  maxBytes: number
): Promise<{ ok: true; formData: FormData } | { ok: false; status: number; error: string }> {
  const contentLengthHeader = request.headers.get('content-length')
  if (contentLengthHeader !== null) {
    const parsedLength = Number(contentLengthHeader)
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: 'Arquivo muito grande. O limite máximo de upload é 5 MB.',
      }
    }
  }

  if (!request.body) {
    try {
      const formData = await request.formData()
      return { ok: true, formData }
    } catch {
      return { ok: false, status: 400, error: 'Corpo multipart inválido.' }
    }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return {
          ok: false,
          status: 413,
          error: 'Arquivo muito grande. O limite máximo de upload é 5 MB.',
        }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, status: 400, error: 'Falha ao ler o corpo do upload.' }
  }

  const combined = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const boundedRequest = new Request(request.url, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') || '',
      },
      body: combined,
    })
    const formData = await boundedRequest.formData()
    return { ok: true, formData }
  } catch {
    return { ok: false, status: 400, error: 'Corpo multipart inválido.' }
  }
}
