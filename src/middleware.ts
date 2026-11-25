import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (pathname.startsWith('/embed/checkout')) {
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://imagineinstituto.com https://www.imagineinstituto.com"
    )
  } else {
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")
    response.headers.set('X-Frame-Options', 'DENY')
  }

  return response
}

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase()
  const { pathname } = request.nextUrl
  const isSafeMethod = request.method === 'GET' || request.method === 'HEAD'

  // Quando acessado via portal.imagineinstituto.com na raiz (/), leva direto ao login (/entrar)
  if (hostname === 'portal.imagineinstituto.com' && pathname === '/' && isSafeMethod) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    return applySecurityHeaders(NextResponse.redirect(url), '/entrar')
  }

  return applySecurityHeaders(NextResponse.next(), pathname)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|img/|images/|favicon.ico).*)'],
}
