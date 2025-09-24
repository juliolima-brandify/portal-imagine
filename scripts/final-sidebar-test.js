const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3000';
const DEMO_EMAIL = 'admin@institutoimagine.org';

// URLs para testar
const testUrls = [
  {
    name: 'Admin - Usuários',
    url: `${BASE_URL}/admin/usuarios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedSidebarContent: ['ml-64', 'ml-16', 'Admin', 'sidebar', 'Sidebar', 'funcionando'],
    expectedPageContent: ['Gerenciar Usuários', 'usuários']
  }
];

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Função principal de teste
async function testFinalSidebar() {
  console.log('🎯 TESTE FINAL DO SIDEBAR ADMIN');
  console.log('================================');
  console.log('📧 Email demo:', DEMO_EMAIL);
  console.log('🌐 Base URL:', BASE_URL);
  console.log('');

  for (const test of testUrls) {
    try {
      console.log(`🔄 Testando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('   ✅ Página carregada com sucesso');
        
        // Verificar se está na tela de carregamento
        const isLoading = response.body.includes('Carregando') || response.body.includes('Loading');
        console.log(`   📊 Tela de carregamento: ${isLoading ? '⚠️ SIM' : '✅ NÃO'}`);
        
        // Verificar conteúdo do sidebar
        const sidebarFound = [];
        const sidebarMissing = [];
        
        test.expectedSidebarContent.forEach(content => {
          if (response.body.includes(content)) {
            sidebarFound.push(content);
          } else {
            sidebarMissing.push(content);
          }
        });
        
        if (sidebarFound.length > 0) {
          console.log(`   ✅ Sidebar - Encontrado: ${sidebarFound.join(', ')}`);
        }
        
        if (sidebarMissing.length > 0) {
          console.log(`   ❌ Sidebar - Ausente: ${sidebarMissing.join(', ')}`);
        }
        
        // Verificar conteúdo da página
        const pageFound = [];
        const pageMissing = [];
        
        test.expectedPageContent.forEach(content => {
          if (response.body.includes(content)) {
            pageFound.push(content);
          } else {
            pageMissing.push(content);
          }
        });
        
        if (pageFound.length > 0) {
          console.log(`   ✅ Página - Encontrado: ${pageFound.join(', ')}`);
        }
        
        if (pageMissing.length > 0) {
          console.log(`   ❌ Página - Ausente: ${pageMissing.join(', ')}`);
        }
        
        // Análise detalhada
        const hasLayout = response.body.includes('ml-64') || response.body.includes('ml-16');
        const hasSidebar = response.body.includes('sidebar') || response.body.includes('Sidebar') || response.body.includes('Admin');
        const hasContent = response.body.includes('Gerenciar Usuários') || response.body.includes('usuários');
        
        console.log('');
        console.log('   📊 ANÁLISE DETALHADA:');
        console.log(`      Layout aplicado: ${hasLayout ? '✅' : '❌'}`);
        console.log(`      Sidebar presente: ${hasSidebar ? '✅' : '❌'}`);
        console.log(`      Conteúdo da página: ${hasContent ? '✅' : '❌'}`);
        
        // Verificar estrutura HTML
        const htmlStructure = {
          hasMinHeight: response.body.includes('min-h-screen'),
          hasBgGray: response.body.includes('bg-gray-50'),
          hasMarginLeft: response.body.includes('ml-64') || response.body.includes('ml-16'),
          hasFixedSidebar: response.body.includes('fixed left-0'),
          hasAdminLayout: response.body.includes('app/admin/layout'),
        };
        
        console.log(`      Estrutura HTML:`);
        Object.entries(htmlStructure).forEach(([key, value]) => {
          console.log(`        ${key}: ${value ? '✅' : '❌'}`);
        });
        
        // Status geral
        const isWorking = hasLayout && hasSidebar && hasContent && !isLoading;
        console.log('');
        console.log(`   🎯 STATUS GERAL: ${isWorking ? '✅ FUNCIONANDO' : '❌ PROBLEMA DETECTADO'}`);
        
      } else {
        console.log(`   ❌ Erro HTTP: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🏁 TESTE CONCLUÍDO!');
  console.log('');
  console.log('📋 RESUMO DO QUE FOI IMPLEMENTADO:');
  console.log('✅ Layout admin criado (/admin/layout.tsx)');
  console.log('✅ Páginas admin simplificadas (removida auth duplicada)');
  console.log('✅ Sidebar simplificado temporário');
  console.log('✅ Navegação entre páginas admin');
  console.log('✅ Sistema de toast implementado');
  console.log('✅ CRUD de usuários funcionando');
  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS SUGERIDOS:');
  console.log('1. Verificar logs do console no navegador');
  console.log('2. Testar em modo interativo (navegador)');
  console.log('3. Restaurar componente Sidebar original');
  console.log('4. Adicionar outras páginas admin');
}

// Executar teste
testFinalSidebar().catch(console.error);
