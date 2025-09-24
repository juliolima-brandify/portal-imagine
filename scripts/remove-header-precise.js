const fs = require('fs');

// Páginas que usam GlobalLayout e não devem ter Header
const pagesToFix = [
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
    
    // Remover import do Header
    content = content.replace(/import Header from '@\/components\/Header'\n?/g, '');
    
    // Remover uso do Header (multilinha)
    content = content.replace(/<Header[\s\S]*?\/>/g, '');
    
    // Remover linhas vazias extras
    const lines = content.split('\n');
    const cleanedLines = [];
    let prevEmpty = false;
    
    for (const line of lines) {
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

console.log('✅ All Header usages removed precisely');
