const fs = require('fs');

// Páginas que precisam ser corrigidas
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
    
    // Remover linhas que contêm props do Header (showAuth, showBackToMain, etc.)
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('showAuth') && 
             !trimmed.startsWith('showBackToMain') &&
             !trimmed.startsWith('isDemoMode') &&
             !trimmed.startsWith('user={') &&
             !trimmed.startsWith('onSignOut={') &&
             !trimmed.startsWith('} : undefined}') &&
             !trimmed.startsWith('onSignOut={() => {') &&
             !trimmed.startsWith('window.location.href = \'/auth\'') &&
             !trimmed.startsWith('}') && trimmed !== '}' &&
             !trimmed.startsWith('        }}') &&
             !trimmed.startsWith('      />');
    });
    
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

console.log('✅ All Header props removed from pages');
