#!/usr/bin/env node

/**
 * Script para atualizar outras páginas para usar o sidebar
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Atualizando páginas para usar sidebar...')

// Páginas que precisam do sidebar
const pagesToUpdate = [
  'src/app/projetos/page.tsx',
  'src/app/perfil/page.tsx',
  'src/app/admin/projetos/page.tsx',
  'src/app/admin/doacoes/page.tsx',
  'src/app/admin/usuarios/page.tsx'
]

pagesToUpdate.forEach(pagePath => {
  const fullPath = path.join(__dirname, '..', pagePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${pagePath}`)
    return
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Adicionar import do LayoutWithSidebar se não existir
    if (!content.includes('LayoutWithSidebar')) {
      const importMatch = content.match(/import.*from.*@\/components\/Header/)
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          `${importMatch[0]}\nimport LayoutWithSidebar from '@/components/LayoutWithSidebar'`
        )
      }
    }
    
    // Determinar userRole baseado no caminho
    let userRole = 'donor'
    if (pagePath.includes('admin')) {
      userRole = 'admin'
    }
    
    // Envolver o conteúdo principal com LayoutWithSidebar
    const mainContentMatch = content.match(/(<div className="min-h-screen bg-gray-50">[\s\S]*?<\/div>)/)
    if (mainContentMatch) {
      const oldContent = mainContentMatch[1]
      const newContent = `<LayoutWithSidebar userRole="${userRole}" isDemoMode={isDemoMode}>
        ${oldContent.replace('<div className="min-h-screen bg-gray-50">', '').replace('</div>', '')}
      </LayoutWithSidebar>`
      
      content = content.replace(oldContent, newContent)
    }
    
    // Escrever arquivo atualizado
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ ${pagePath} atualizado`)
    
  } catch (error) {
    console.log(`❌ Erro ao atualizar ${pagePath}:`, error.message)
  }
})

console.log('🎯 Páginas atualizadas com sidebar!')
