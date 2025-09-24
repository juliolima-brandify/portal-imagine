import { createClient } from '@supabase/supabase-js'

// Função para obter as credenciais (funciona tanto no servidor quanto no cliente)
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  
  console.log('🔑 Credenciais Supabase Admin:', {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NÃO ENCONTRADA'
  })
  
  return { supabaseUrl, supabaseServiceKey }
}

// Cliente Supabase com Service Role Key (bypassa RLS)
export const supabaseAdmin = (() => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseCredentials()
  
  if (!supabaseServiceKey || supabaseServiceKey === 'placeholder-key') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
})()

// Verificar se as credenciais são válidas
export const isSupabaseAdminConfigured = () => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseCredentials()
  return supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseServiceKey !== 'placeholder-key' &&
         supabaseUrl.startsWith('https://') &&
         supabaseServiceKey.startsWith('eyJ')
}
