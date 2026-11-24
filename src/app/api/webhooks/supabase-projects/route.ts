import { NextRequest, NextResponse } from 'next/server'

/**
 * Rota mantida apenas para compatibilidade enquanto o trigger antigo
 * `framer_sync_projects` no Supabase não é removido. A dependência `framer-api`
 * foi removida na unificação do site institucional + portal na Cloudflare.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    deprecated: true,
    message: 'Sincronização Framer desativada após unificação na Cloudflare.',
  })
}
