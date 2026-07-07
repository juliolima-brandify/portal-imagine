import { NextRequest, NextResponse } from 'next/server'
import { syncProjectToFramer, removeProjectFromFramer, type Project } from '@/lib/framer-sync'
import { supabaseAdmin } from '@/lib/supabase-admin'

// framer-api usa WebSocket → precisa do runtime Node, não Edge.
export const runtime = 'nodejs'
export const maxDuration = 60

// Colunas que a PRÓPRIA sincronização grava de volta. Se um UPDATE só mexeu
// nelas, ignoramos o evento para não entrar em loop infinito.
const FRAMER_COLS = ['framer_item_id', 'framer_synced_at', 'framer_sync_status']

function onlyFramerColsChanged(record: any, old: any): boolean {
  if (!record || !old) return false
  const keys = Object.keys(record).concat(Object.keys(old))
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (FRAMER_COLS.includes(k)) continue
    if (JSON.stringify(record[k]) !== JSON.stringify(old[k])) return false
  }
  return true
}

export async function POST(request: NextRequest) {
  // 1) autenticação por segredo compartilhado (Database Webhooks não assinam HMAC)
  const secret = request.headers.get('x-webhook-secret')
  if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const type: string = payload.type // INSERT | UPDATE | DELETE
  const record: Project | undefined = payload.record
  const old: Project | undefined = payload.old_record

  // 2) prevenção de loop: ignora write-back das colunas framer_*
  if (type === 'UPDATE' && onlyFramerColsChanged(record, old)) {
    return NextResponse.json({ skipped: 'apenas colunas framer_* mudaram' })
  }

  try {
    if (type === 'INSERT' || type === 'UPDATE') {
      if (!record?.id) return NextResponse.json({ error: 'record ausente' }, { status: 400 })
      const itemId = await syncProjectToFramer(record)
      return NextResponse.json({ ok: true, action: type, framer_item_id: itemId })
    }

    if (type === 'DELETE') {
      if (old?.framer_item_id) await removeProjectFromFramer(old.framer_item_id)
      return NextResponse.json({ ok: true, action: 'DELETE' })
    }

    return NextResponse.json({ skipped: `tipo não tratado: ${type}` })
  } catch (error: any) {
    console.error('❌ [webhook supabase-projects] erro:', error?.message || error)
    // marca erro no projeto para reconciliação posterior
    if (record?.id) {
      await supabaseAdmin
        .from('projects')
        .update({ framer_sync_status: 'error' })
        .eq('id', record.id)
        .then(() => {}, () => {})
    }
    return NextResponse.json({ error: error?.message || 'erro interno' }, { status: 500 })
  }
}
