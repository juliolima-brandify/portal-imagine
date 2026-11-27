import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isAsaasConfigured } from '@/lib/server/asaas'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: isSupabaseConfigured() ? 'configured' : 'unconfigured',
        payments: isAsaasConfigured() ? 'configured' : 'unconfigured',
      },
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
