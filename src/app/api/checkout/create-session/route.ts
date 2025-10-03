import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      projectId,
      projectTitle,
      options = {}
    } = body

    // Validar dados obrigatórios
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valor inválido' },
        { status: 400 }
      )
    }

    if (!projectId || !projectTitle) {
      return NextResponse.json(
        { success: false, error: 'Dados do projeto inválidos' },
        { status: 400 }
      )
    }

    // Obter URL base do ambiente
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // Criar sessão do Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Doação - ${projectTitle}`,
              description: `Doação para o projeto "${projectTitle}" do Instituto Imagine`,
              images: ['https://portal.imagineinstituto.com/images/logo.png'],
            },
            unit_amount: Math.round(amount * 100), // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/doacao-sucesso?session_id={CHECKOUT_SESSION_ID}&project_id=${projectId}`,
      cancel_url: `${baseUrl}/projeto/${projectId}?cancelled=true`,
      metadata: {
        projectId,
        projectTitle,
        amount: amount.toString(),
        isRecurring: options.isRecurring?.toString() || 'false',
        frequency: options.frequency || '',
        anonymous: options.anonymous?.toString() || 'false',
        message: options.message || '',
        source: 'embed'
      },
      billing_address_collection: 'auto',
      locale: 'pt-BR',
      // Configurações específicas para o Brasil
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    })

    console.log('✅ Stripe Checkout Session criada:', {
      sessionId: session.id,
      projectId,
      projectTitle,
      amount,
      options: {
        isRecurring: options.isRecurring,
        frequency: options.frequency,
        anonymous: options.anonymous,
        message: options.message
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('❌ Erro ao criar sessão do Stripe Checkout:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao processar pagamento' 
      },
      { status: 500 }
    )
  }
}
