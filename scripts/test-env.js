// Script para testar variáveis de ambiente
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

console.log('🔍 Verificando variáveis de ambiente...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('📋 Variáveis encontradas:')
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ Não encontrada'}`)
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurada' : '❌ Não encontrada'}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada'}`)

if (supabaseUrl) {
  console.log(`\n🔗 URL: ${supabaseUrl}`)
}

if (supabaseAnonKey) {
  console.log(`\n🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
}

if (supabaseServiceKey) {
  console.log(`\n🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`)
} else {
  console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!')
  console.log('💡 Configure no arquivo .env.local:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui')
}
