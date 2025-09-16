import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const success = await handleWebhook(body, signature)

    if (success) {
      return NextResponse.json({ received: true })
    } else {
      return NextResponse.json({ error: 'Webhook handling failed' }, { status: 400 })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
