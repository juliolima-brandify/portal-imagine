const fs = require('fs');
const path = require('path');

// Páginas que usam GlobalLayout e não devem ter Header
const pagesToFix = [
  'src/app/doacoes/page.tsx',
  'src/app/perfil/page.tsx', 
  'src/app/historico/page.tsx',
  'src/app/admin/doacoes/page.tsx',
  'src/app/admin/projetos/page.tsx',
  'src/app/admin/usuarios/page.tsx',
  'src/app/admin/relatorios/page.tsx'
];

pagesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remover linhas que contêm <Header
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('<Header'));
    
    // Remover linhas vazias extras
    const cleanedLines = [];
    let prevEmpty = false;
    
    for (const line of filteredLines) {
      if (line.trim() === '') {
        if (!prevEmpty) {
          cleanedLines.push(line);
        }
        prevEmpty = true;
      } else {
        cleanedLines.push(line);
        prevEmpty = false;
      }
    }
    
    fs.writeFileSync(filePath, cleanedLines.join('\n'));
    console.log(`✅ Fixed ${filePath}`);
  }
});

console.log('✅ All Header usages removed from GlobalLayout pages');
