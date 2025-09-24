const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3001';
const DEMO_EMAIL = 'admin@institutoimagine.org';

// URLs para testar
const testUrls = [
  {
    name: 'Admin - Dashboard',
    url: `${BASE_URL}/admin/dashboard?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['Dashboard Admin', 'Projetos Ativos', 'Total Arrecadado']
  },
  {
    name: 'Admin - Usuários',
    url: `${BASE_URL}/admin/usuarios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['Gerenciar Usuários', 'usuários']
  },
  {
    name: 'Admin - Projetos',
    url: `${BASE_URL}/admin/projetos?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['Gerenciar Projetos', 'projetos']
  },
  {
    name: 'Admin - Doações',
    url: `${BASE_URL}/admin/doacoes?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['Gerenciar Doações', 'doações']
  },
  {
    name: 'Admin - Relatórios',
    url: `${BASE_URL}/admin/relatorios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['Relatórios', 'relatórios']
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
async function testAllAdminPages() {
  console.log('🎯 TESTE COMPLETO - TODAS AS PÁGINAS ADMIN');
  console.log('==========================================');
  console.log('📧 Email demo:', DEMO_EMAIL);
  console.log('🌐 Base URL:', BASE_URL);
  console.log('');

  const results = [];

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
        
        // Verificar sidebar
        const hasSidebar = response.body.includes('ml-64') || response.body.includes('Admin Panel');
        console.log(`   📊 Sidebar presente: ${hasSidebar ? '✅' : '❌'}`);
        
        // Verificar conteúdo específico
        const foundContent = [];
        const missingContent = [];
        
        test.expectedContent.forEach(content => {
          if (response.body.includes(content)) {
            foundContent.push(content);
          } else {
            missingContent.push(content);
          }
        });
        
        if (foundContent.length > 0) {
          console.log(`   ✅ Conteúdo encontrado: ${foundContent.join(', ')}`);
        }
        
        if (missingContent.length > 0) {
          console.log(`   ❌ Conteúdo ausente: ${missingContent.join(', ')}`);
        }
        
        // Status da página
        const isWorking = hasSidebar && !isLoading && foundContent.length > 0;
        console.log(`   🎯 Status: ${isWorking ? '✅ FUNCIONANDO' : '❌ PROBLEMA'}`);
        
        results.push({
          name: test.name,
          status: response.statusCode,
          working: isWorking,
          hasSidebar,
          isLoading,
          foundContent: foundContent.length,
          missingContent: missingContent.length
        });
        
      } else {
        console.log(`   ❌ Erro HTTP: ${response.statusCode}`);
        results.push({
          name: test.name,
          status: response.statusCode,
          working: false,
          hasSidebar: false,
          isLoading: false,
          foundContent: 0,
          missingContent: 0
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
      results.push({
        name: test.name,
        status: 'ERROR',
        working: false,
        hasSidebar: false,
        isLoading: false,
        foundContent: 0,
        missingContent: 0
      });
    }
    
    console.log('');
  }

  // Resumo final
  console.log('📊 RESUMO FINAL:');
  console.log('================');
  
  const working = results.filter(r => r.working).length;
  const total = results.length;
  
  console.log(`✅ Páginas funcionando: ${working}/${total}`);
  console.log(`📊 Taxa de sucesso: ${((working / total) * 100).toFixed(1)}%`);
  console.log('');
  
  // Detalhes por página
  results.forEach(result => {
    const status = result.working ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status} ${result.isLoading ? '(Loading)' : ''}`);
  });
  
  console.log('');
  console.log('🎯 INSTRUÇÕES PARA O USUÁRIO:');
  console.log('1. Acesse: http://localhost:3001/admin/dashboard?demo_email=admin@institutoimagine.org');
  console.log('2. Teste a navegação pelo sidebar');
  console.log('3. Verifique se todas as páginas carregam corretamente');
  console.log('4. Reporte qualquer problema encontrado');
}

// Executar teste
testAllAdminPages().catch(console.error);
