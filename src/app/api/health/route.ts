import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar se a aplicação está funcionando
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected', // Aqui você pode adicionar verificação real do Supabase
        stripe: 'connected',   // Aqui você pode adicionar verificação real do Stripe
      }
    }

    return NextResponse.json(healthCheck, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

