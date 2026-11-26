import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Verificar se as credenciais são válidas
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' &&
         supabaseAnonKey !== 'placeholder-key' &&
         supabaseUrl.startsWith('https://') &&
         (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_'))
}

const REMEMBER_KEY = 'imagine.rememberMe'

function createRememberAwareStorage() {
  const safe = () => typeof window !== 'undefined'
  return {
    getItem(key: string) {
      if (!safe()) return null
      const remember = window.localStorage.getItem(REMEMBER_KEY)
      if (remember === 'false') return window.sessionStorage.getItem(key)
      return window.localStorage.getItem(key)
    },
    setItem(key: string, value: string) {
      if (!safe()) return
      const remember = window.localStorage.getItem(REMEMBER_KEY)
      if (remember === 'false') {
        window.sessionStorage.setItem(key, value)
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, value)
        window.sessionStorage.removeItem(key)
      }
    },
    removeItem(key: string) {
      if (!safe()) return
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    },
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // "Lembrar-me": quando ativo, a sessão fica no localStorage (padrão).
    // Quando desativado, fica só no sessionStorage e some ao fechar a aba.
    storage: createRememberAwareStorage(),
  },
})

export const isLocalEnvironment = () => {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

