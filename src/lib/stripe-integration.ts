import { stripe } from './stripe'
import { createDonation, updateDonationStatus, createUserFromDonation } from './database'
import { sendDonationConfirmation, sendAdminNotification } from './resend'

// =============================================
// TIPOS
// =============================================

export interface CreatePaymentIntentData {
  amount: number
  currency: string
  projectId: string
  userId: string | null
  userName?: string
  userEmail?: string
  isRecurring?: boolean
  recurringFrequency?: string
  message?: string
  anonymous?: boolean
}

export interface PaymentIntentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  donationId?: string
  error?: string
}

// =============================================
// FUNÇÕES DO STRIPE
// =============================================

export async function createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult> {
  try {
    // Criar doação no banco primeiro
    const donation = await createDonation({
      user_id: data.userId,
      project_id: data.projectId,
      amount: data.amount,
      currency: data.currency,
      status: 'pending',
      is_recurring: data.isRecurring || false,
      recurring_frequency: data.recurringFrequency,
      message: data.message,
      anonymous: data.anonymous || false
    })

    if (!donation) {
      return {
        success: false,
        error: 'Erro ao criar doação no banco de dados'
      }
    }

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Converter para centavos
      currency: data.currency.toLowerCase(),
      metadata: {
        donationId: donation.id,
        projectId: data.projectId,
        userId: data.userId,
        userEmail: data.userEmail || data.userId,
        userName: data.userName || 'Usuário',
        projectTitle: 'Projeto Instituto Imagine', // Você pode buscar o título real do projeto
        isRecurring: data.isRecurring?.toString() || 'false',
        recurringFrequency: data.recurringFrequency || '',
        message: data.message || '',
        anonymous: data.anonymous?.toString() || 'false'
      },
      description: `Doação para projeto - ID: ${data.projectId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Atualizar doação com Payment Intent ID
    await updateDonationStatus(donation.id, 'pending', paymentIntent.id)

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
      donationId: donation.id
    }
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function confirmPayment(paymentIntentId: string): Promise<boolean> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status === 'succeeded') {
      const donationId = paymentIntent.metadata.donationId
      if (donationId) {
        await updateDonationStatus(donationId, 'completed', paymentIntentId)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error)
    return false
  }
}

export async function handleWebhook(payload: string, signature: string): Promise<boolean> {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurado')
      return false
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any
        const donationId = paymentIntent.metadata.donationId
        const userEmail = paymentIntent.metadata.userEmail
        const userName = paymentIntent.metadata.userName
        
        if (donationId) {
          await updateDonationStatus(donationId, 'completed', paymentIntent.id)
          
          // Enviar email de confirmação de doação
          try {
            const donationAmount = paymentIntent.amount / 100 // Converter de centavos
            const projectTitle = paymentIntent.metadata.projectTitle || 'Projeto'
            const paymentMethod = paymentIntent.charges?.data?.[0]?.payment_method_details?.type || 'N/A'
            
            if (userEmail && userName) {
              await sendDonationConfirmation({
                name: userName,
                email: userEmail,
                amount: donationAmount,
                projectTitle: projectTitle,
                donationId: donationId,
                paymentMethod: paymentMethod
              })
              console.log(`Email de confirmação enviado para: ${userEmail}`)
            }
          } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error)
          }
          
          // Enviar notificação para admin
          try {
            const donationAmount = paymentIntent.amount / 100
            const projectTitle = paymentIntent.metadata.projectTitle || 'Projeto'
            
            await sendAdminNotification({
              adminEmail: 'admin@institutoimagine.org', // Configurar email admin
              type: 'new_donation',
              title: 'Nova Doação Recebida!',
              message: `Uma nova doação de R$ ${donationAmount.toFixed(2)} foi recebida para o projeto "${projectTitle}".`,
              data: {
                donationId,
                amount: donationAmount,
                projectTitle,
                donorEmail: userEmail,
                donorName: userName,
                paymentMethod: paymentIntent.charges?.data?.[0]?.payment_method_details?.type,
                timestamp: new Date().toISOString()
              }
            })
            console.log('Notificação admin enviada')
          } catch (error) {
            console.error('Erro ao enviar notificação admin:', error)
          }
          
          // Criar usuário automaticamente se não existir
          if (userEmail && userName) {
            try {
              const donationAmount = paymentIntent.amount / 100 // Converter de centavos
              const projectTitle = paymentIntent.metadata.projectTitle || 'Projeto'
              
              const userId = await createUserFromDonation(
                userEmail, 
                userName, 
                donationAmount,
                projectTitle
              )
              if (userId) {
                console.log(`Usuário criado automaticamente: ${userEmail}`)
              }
            } catch (error) {
              console.error('Erro ao criar usuário automaticamente:', error)
            }
          }
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any
        const failedDonationId = failedPayment.metadata.donationId
        const failedUserEmail = failedPayment.metadata.userEmail
        const failedUserName = failedPayment.metadata.userName
        
        if (failedDonationId) {
          await updateDonationStatus(failedDonationId, 'failed', failedPayment.id)
          
          // Enviar notificação para admin sobre falha no pagamento
          try {
            const donationAmount = failedPayment.amount / 100
            const projectTitle = failedPayment.metadata.projectTitle || 'Projeto'
            
            await sendAdminNotification({
              adminEmail: 'admin@institutoimagine.org',
              type: 'system_alert',
              title: 'Falha no Pagamento Detectada',
              message: `Falha no processamento de uma doação de R$ ${donationAmount.toFixed(2)} para o projeto "${projectTitle}".`,
              data: {
                donationId: failedDonationId,
                amount: donationAmount,
                projectTitle,
                donorEmail: failedUserEmail,
                donorName: failedUserName,
                failureReason: failedPayment.last_payment_error?.message,
                timestamp: new Date().toISOString()
              }
            })
            console.log('Notificação de falha enviada para admin')
          } catch (error) {
            console.error('Erro ao enviar notificação de falha:', error)
          }
        }
        break

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return true
  } catch (error) {
    console.error('Erro no webhook:', error)
    return false
  }
}

// =============================================
// FUNÇÕES DE PRODUTOS E PREÇOS
// =============================================

export async function createStripeProduct(project: any): Promise<string | null> {
  try {
    const product = await stripe.products.create({
      name: project.title,
      description: project.description,
      metadata: {
        projectId: project.id,
        category: project.category
      }
    })

    return product.id
  } catch (error) {
    console.error('Erro ao criar produto no Stripe:', error)
    return null
  }
}

export async function createStripePrice(productId: string, amount: number, currency: string = 'brl'): Promise<string | null> {
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
    })

    return price.id
  } catch (error) {
    console.error('Erro ao criar preço no Stripe:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE CUSTOMER
// =============================================

export async function createStripeCustomer(user: any): Promise<string | null> {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id
      }
    })

    return customer.id
  } catch (error) {
    console.error('Erro ao criar customer no Stripe:', error)
    return null
  }
}

export async function getStripeCustomer(userId: string): Promise<string | null> {
  try {
    const customers = await stripe.customers.list({
      limit: 1,
      email: userId // Assumindo que userId é o email
    })

    return customers.data[0]?.id || null
  } catch (error) {
    console.error('Erro ao buscar customer no Stripe:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE DOAÇÃO RECORRENTE
// =============================================

export async function createSubscription(
  customerId: string,
  priceId: string,
  donationId: string
): Promise<string | null> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        donationId: donationId
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return subscription.id
  } catch (error) {
    console.error('Erro ao criar subscription:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE RELATÓRIOS
// =============================================

export async function getStripeBalance(): Promise<any> {
  try {
    const balance = await stripe.balance.retrieve()
    return balance
  } catch (error) {
    console.error('Erro ao buscar saldo do Stripe:', error)
    return null
  }
}

export async function getStripeCharges(limit: number = 100): Promise<any[]> {
  try {
    const charges = await stripe.charges.list({
      limit: limit,
      expand: ['data.customer']
    })

    return charges.data
  } catch (error) {
    console.error('Erro ao buscar charges do Stripe:', error)
    return []
  }
}

// =============================================
// FUNÇÕES DE UTILIDADE
// =============================================

export function formatAmount(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}

export function parseStripeAmount(amount: number): number {
  return amount / 100
}
