import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { supabaseUrl, supabaseServiceKey }
}

const ADMIN_FETCH_TIMEOUT_MS = 8_000

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(ADMIN_FETCH_TIMEOUT_MS)
  const signalAny = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
  const signal =
    init?.signal && typeof signalAny === 'function'
      ? signalAny([init.signal, timeoutSignal])
      : init?.signal || timeoutSignal
  return fetch(input, { ...init, signal })
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
    global: {
      fetch: fetchWithTimeout,
    },
  })
  return cachedClient
}

// Cliente Supabase com Service Role Key (lazy para compatibilidade com build e Cloudflare Workers)
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
  has(_target, prop) {
    return prop in getAdminClient()
  },
})

// Verificar se as credenciais são válidas (JWT legado `eyJ` ou chave nova `sb_secret_`)
export const isSupabaseAdminConfigured = () => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseCredentials()
  return (
    supabaseUrl.startsWith('https://') &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseServiceKey !== 'placeholder-key' &&
    (supabaseServiceKey.startsWith('eyJ') || supabaseServiceKey.startsWith('sb_secret_'))
  )
}
