#!/usr/bin/env node

/**
 * Script para adicionar conta de voluntário na autenticação
 */

const fs = require('fs')
const path = require('path')

const authFilePath = path.join(__dirname, '..', 'src', 'app', 'auth', 'page.tsx')

console.log('🔧 Atualizando autenticação para incluir voluntário...')

try {
  // Ler o arquivo atual
  let content = fs.readFileSync(authFilePath, 'utf8')
  
  // Encontrar a linha onde adicionar o código do voluntário
  const adminLoginEnd = content.indexOf('        }')
  const insertPosition = content.indexOf('        // Validar dados de login', adminLoginEnd)
  
  if (insertPosition === -1) {
    console.error('❌ Não foi possível encontrar a posição para inserir o código do voluntário')
    process.exit(1)
  }
  
  // Código do voluntário para inserir
  const volunteerCode = `
        if (email === 'volunteer@institutoimagine.org' && password === 'volunteer123456') {
          setMessage('Login voluntário realizado com sucesso! (Modo de demonstração)')
          setLoading(false)
          clearTimeout(timeoutId)
          setTimeout(() => {
            window.location.href = \`/dashboard?demo_email=\${encodeURIComponent(email)}&role=volunteer\`
          }, 1500)
          return
        }

`
  
  // Inserir o código
  const newContent = content.slice(0, insertPosition) + volunteerCode + content.slice(insertPosition)
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(authFilePath, newContent, 'utf8')
  
  console.log('✅ Conta de voluntário adicionada com sucesso!')
  console.log('📧 Email: volunteer@institutoimagine.org')
  console.log('🔑 Senha: volunteer123456')
  
} catch (error) {
  console.error('❌ Erro ao atualizar autenticação:', error.message)
  process.exit(1)
}
