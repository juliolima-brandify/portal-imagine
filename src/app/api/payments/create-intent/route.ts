import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe-integration'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, projectId, isRecurring, recurringFrequency, message, anonymous } = body

    // Validar dados
    if (!amount || !projectId) {
      return NextResponse.json({ error: 'Amount and projectId are required' }, { status: 400 })
    }

    if (amount < 1) {
      return NextResponse.json({ error: 'Amount must be at least 1' }, { status: 400 })
    }

    // Verificar autenticação
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Criar Payment Intent
    const result = await createPaymentIntent({
      amount: parseFloat(amount),
      currency: 'BRL',
      projectId,
      userId: user.id,
      isRecurring,
      recurringFrequency,
      message,
      anonymous
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          donationId: result.donationId
        }
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}