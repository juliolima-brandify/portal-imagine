import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase()
  const { pathname } = request.nextUrl

  // Quando acessado via portal.imagineinstituto.com na raiz (/), leva direto ao login (/entrar)
  if (host.startsWith('portal.') && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
