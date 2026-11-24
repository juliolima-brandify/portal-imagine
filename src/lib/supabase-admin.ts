import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { supabaseUrl, supabaseServiceKey }
}

let cachedClient: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  const { supabaseUrl, supabaseServiceKey } = getSupabaseCredentials()

  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada')
  }
  if (!supabaseServiceKey || supabaseServiceKey === 'placeholder-key') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
  return cachedClient
}

// Cliente Supabase com Service Role Key (lazy para compatibilidade com build e Cloudflare Workers)
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getAdminClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Verificar se as credenciais são válidas
export const isSupabaseAdminConfigured = () => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseCredentials()
  return (
    supabaseUrl.startsWith('https://') &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseServiceKey !== 'placeholder-key' &&
    supabaseServiceKey.startsWith('eyJ')
  )
}
