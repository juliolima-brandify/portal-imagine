const fs = require('fs')
const path = require('path')

// Páginas que devem ter sidebar (autenticadas)
const pagesToUpdate = [
  'src/app/projetos/page.tsx',
  'src/app/doacoes/page.tsx', 
  'src/app/perfil/page.tsx',
  'src/app/historico/page.tsx',
  'src/app/admin/doacoes/page.tsx',
  'src/app/admin/projetos/page.tsx',
  'src/app/admin/usuarios/page.tsx',
  'src/app/admin/relatorios/page.tsx'
]

function updatePageWithGlobalLayout(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  
  // Verificar se já tem GlobalLayout
  if (content.includes('GlobalLayout')) {
    console.log(`✅ ${filePath} já tem GlobalLayout`)
    return
  }

  // Adicionar import do GlobalLayout
  if (content.includes("import { useState, useEffect } from 'react'")) {
    content = content.replace(
      "import { useState, useEffect } from 'react'",
      "import { useState, useEffect } from 'react'\nimport GlobalLayout from '@/components/GlobalLayout'"
    )
  } else if (content.includes("import { useState } from 'react'")) {
    content = content.replace(
      "import { useState } from 'react'",
      "import { useState } from 'react'\nimport GlobalLayout from '@/components/GlobalLayout'"
    )
  } else if (content.includes("import { useEffect, useState } from 'react'")) {
    content = content.replace(
      "import { useEffect, useState } from 'react'",
      "import { useEffect, useState } from 'react'\nimport GlobalLayout from '@/components/GlobalLayout'"
    )
  }

  // Encontrar o return principal e envolver com GlobalLayout
  const returnMatch = content.match(/return\s*\(\s*<div[^>]*className="min-h-screen[^"]*"[^>]*>/)
  if (returnMatch) {
    const startIndex = returnMatch.index
    const beforeReturn = content.substring(0, startIndex)
    const afterReturn = content.substring(startIndex)
    
    // Encontrar o fechamento correspondente
    let braceCount = 0
    let endIndex = startIndex
    let inString = false
    let stringChar = ''
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i]
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && content[i-1] !== '\\') {
        inString = false
      } else if (!inString) {
        if (char === '<') braceCount++
        if (char === '>') braceCount--
        if (braceCount === 0 && char === ')') {
          endIndex = i + 1
          break
        }
      }
    }
    
    const returnContent = content.substring(startIndex, endIndex)
    const afterReturnContent = content.substring(endIndex)
    
    // Envolver o return com GlobalLayout
    const newReturn = `return (
    <GlobalLayout>
      ${returnContent.replace(/^return\s*\(\s*/, '').replace(/\s*\)$/, '')}
    </GlobalLayout>
  )`
    
    content = beforeReturn + newReturn + afterReturnContent
  }

  // Salvar arquivo
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ ${filePath} atualizado com GlobalLayout`)
}

// Atualizar todas as páginas
console.log('🚀 Atualizando páginas com GlobalLayout...\n')

pagesToUpdate.forEach(page => {
  updatePageWithGlobalLayout(page)
})

console.log('\n✅ Todas as páginas foram atualizadas!')
