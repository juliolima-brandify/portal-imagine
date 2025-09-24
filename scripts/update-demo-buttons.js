#!/usr/bin/env node

/**
 * Script para adicionar botão Demo Voluntário na página de auth
 */

const fs = require('fs')
const path = require('path')

const authFilePath = path.join(__dirname, '..', 'src', 'app', 'auth', 'page.tsx')

console.log('🔧 Adicionando botão Demo Voluntário...')

try {
  // Ler o arquivo atual
  let content = fs.readFileSync(authFilePath, 'utf8')
  
  // 1. Atualizar a função handleDemoLogin para incluir 'volunteer'
  const oldFunction = `  const handleDemoLogin = (role: 'donor' | 'admin') => {
    if (role === 'donor') {
      setEmail('demo@doador.com')
      setPassword('demo123456')
    } else {
      setEmail('admin@institutoimagine.org')
      setPassword('admin123456')
    }
    setIsLogin(true)
  }`
  
  const newFunction = `  const handleDemoLogin = (role: 'donor' | 'admin' | 'volunteer') => {
    if (role === 'donor') {
      setEmail('demo@doador.com')
      setPassword('demo123456')
    } else if (role === 'admin') {
      setEmail('admin@institutoimagine.org')
      setPassword('admin123456')
    } else {
      setEmail('volunteer@institutoimagine.org')
      setPassword('volunteer123456')
    }
    setIsLogin(true)
  }`
  
  content = content.replace(oldFunction, newFunction)
  
  // 2. Atualizar os botões demo para incluir o voluntário
  const oldButtons = `            <div className="flex space-x-3">
              <button
                onClick={() => handleDemoLogin('donor')}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Demo Doador
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Demo Admin
              </button>
            </div>`
  
  const newButtons = `            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleDemoLogin('donor')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Demo Doador
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Demo Admin
              </button>
              <button
                onClick={() => handleDemoLogin('volunteer')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Demo Voluntário
              </button>
            </div>`
  
  content = content.replace(oldButtons, newButtons)
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(authFilePath, content, 'utf8')
  
  console.log('✅ Botão Demo Voluntário adicionado com sucesso!')
  console.log('🎯 Agora você pode testar com:')
  console.log('   - Demo Doador: demo@doador.com')
  console.log('   - Demo Admin: admin@institutoimagine.org')
  console.log('   - Demo Voluntário: volunteer@institutoimagine.org')
  
} catch (error) {
  console.error('❌ Erro ao atualizar botões demo:', error.message)
  process.exit(1)
}
