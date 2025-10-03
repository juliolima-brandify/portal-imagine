import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }

    // Extrair dados da sessão
    const amount = session.amount_total ? session.amount_total / 100 : 0 // Converter de centavos
    const projectId = session.metadata?.projectId || ''
    const projectTitle = session.metadata?.projectTitle || 'Projeto'
    const donorEmail = session.customer_details?.email || session.customer_email || ''
    const donorName = session.customer_details?.name || session.metadata?.donorName || ''
    
    console.log('✅ Dados da sessão recuperados:', {
      sessionId,
      projectId,
      projectTitle,
      amount,
      donorEmail
    })

    return NextResponse.json({
      success: true,
      sessionId,
      projectId,
      projectTitle,
      amount: amount.toFixed(2),
      donorEmail,
      donorName,
      paymentStatus: session.payment_status,
      metadata: session.metadata
    })

  } catch (error) {
    console.error('❌ Erro ao buscar sessão do Stripe:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar dados da sessão' 
      },
      { status: 500 }
    )
  }
}
