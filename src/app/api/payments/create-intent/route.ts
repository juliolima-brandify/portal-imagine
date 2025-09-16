import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe-integration'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, projectId, isRecurring, recurringFrequency, message, anonymous, userName, userEmail } = body

    // Validar dados
    if (!amount || !projectId) {
      return NextResponse.json({ error: 'Amount and projectId are required' }, { status: 400 })
    }

    if (amount < 1) {
      return NextResponse.json({ error: 'Amount must be at least 1' }, { status: 400 })
    }

    // Verificar autenticação ou dados do usuário
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let userId: string
    let finalUserName: string
    let finalUserEmail: string

    if (user) {
      // Usuário autenticado
      userId = user.id
      finalUserName = user.user_metadata?.name || 'Usuário'
      finalUserEmail = user.email || ''
    } else if (userEmail && userName) {
      // Doação anônima com dados do usuário
      userId = userEmail // Usar email como ID temporário
      finalUserName = userName
      finalUserEmail = userEmail
    } else {
      return NextResponse.json({ error: 'Unauthorized or missing user data' }, { status: 401 })
    }

    // Criar Payment Intent
    const result = await createPaymentIntent({
      amount: parseFloat(amount),
      currency: 'BRL',
      projectId,
      userId,
      userName: finalUserName,
      userEmail: finalUserEmail,
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