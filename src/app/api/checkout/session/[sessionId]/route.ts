import { NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { jsonNoStore } from '@/lib/admin-http'
import { isValidUuid, sanitizePublicSessionResponse } from '@/lib/payments'

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const rawId = (params?.sessionId || '').trim()
  if (!rawId || rawId.length > 120) {
    return jsonNoStore({ success: false, error: 'Identificador de doação inválido.' }, { status: 400 })
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ success: false, error: 'Serviço indisponível.' }, { status: 503 })
  }

  try {
    let row: any = null

    if (isValidUuid(rawId)) {
      const { data } = await supabaseAdmin
        .from('donations')
        .select('id, project_id, amount, status, payment_method, is_recurring, recurring_frequency, projects:project_id(title), *')
        .eq('id', rawId)
        .maybeSingle()
      row = data
    }

    if (!row) {
      const { data } = await supabaseAdmin
        .from('donations')
        .select('id, project_id, amount, status, payment_method, is_recurring, recurring_frequency, projects:project_id(title), *')
        .eq('asaas_checkout_id', rawId)
        .maybeSingle()
      row = data
    }

    if (!row) {
      return jsonNoStore({ success: false, error: 'Doação não encontrada.' }, { status: 404 })
    }

    const projectTitle =
      row.projects && typeof row.projects === 'object' && !Array.isArray(row.projects)
        ? (row.projects as { title?: string }).title || null
        : null

    return jsonNoStore(
      sanitizePublicSessionResponse({
        id: row.id,
        project_id: row.project_id,
        campaign_slug: row.campaign_slug,
        projectTitle,
        amount: row.amount,
        status: row.status,
        payment_method: row.payment_method,
        is_recurring: row.is_recurring,
        recurring_frequency: row.recurring_frequency,
      })
    )
  } catch (err) {
    console.error('[CheckoutSession] Erro ao consultar status público da doação:', err)
    return jsonNoStore(
      { success: false, error: 'Erro ao consultar status da doação.' },
      { status: 500 }
    )
  }
}
