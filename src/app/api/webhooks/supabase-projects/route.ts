import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

/**
 * Rota mantida apenas para compatibilidade enquanto o trigger antigo
 * `framer_sync_projects` no Supabase não é removido. A dependência `framer-api`
 * foi removida na unificação do site institucional + portal na Cloudflare.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET
  const secret = request.headers.get('x-webhook-secret')
  if (!expected || !secret || !safeEqual(secret, expected)) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      deprecated: true,
      message: 'Sincronização Framer desativada após unificação na Cloudflare.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
