const http = require('http');

// Configuração - PORTA CORRETA
const BASE_URL = 'http://localhost:3001';
const DEMO_EMAIL = 'admin@institutoimagine.org';

// URLs para testar
const testUrls = [
  {
    name: 'Admin - Usuários',
    url: `${BASE_URL}/admin/usuarios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['ml-64', 'Admin funcionando', 'Sidebar', 'Gerenciar Usuários']
  },
  {
    name: 'Admin - Projetos',
    url: `${BASE_URL}/admin/projetos?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['ml-64', 'Admin funcionando', 'Sidebar', 'Gerenciar Projetos']
  },
  {
    name: 'Admin - Doações',
    url: `${BASE_URL}/admin/doacoes?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['ml-64', 'Admin funcionando', 'Sidebar', 'Gerenciar Doações']
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
async function testSidebarPort3001() {
  console.log('🎯 TESTE SIDEBAR - PORTA 3001');
  console.log('=============================');
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
        
        // Verificar conteúdo esperado
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
        
        // Análise detalhada
        const hasLayout = response.body.includes('ml-64') || response.body.includes('ml-16');
        const hasSidebar = response.body.includes('sidebar') || response.body.includes('Sidebar') || response.body.includes('Admin');
        const hasContent = response.body.includes('Gerenciar') || response.body.includes('usuários') || response.body.includes('projetos') || response.body.includes('doações');
        
        console.log('');
        console.log('   📊 ANÁLISE DETALHADA:');
        console.log(`      Layout aplicado: ${hasLayout ? '✅' : '❌'}`);
        console.log(`      Sidebar presente: ${hasSidebar ? '✅' : '❌'}`);
        console.log(`      Conteúdo da página: ${hasContent ? '✅' : '❌'}`);
        
        // Status geral
        const isWorking = hasLayout && hasSidebar && hasContent && !isLoading;
        console.log('');
        console.log(`   🎯 STATUS: ${isWorking ? '✅ FUNCIONANDO' : '❌ PROBLEMA'}`);
        
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
  console.log('📋 INSTRUÇÕES PARA O USUÁRIO:');
  console.log('1. Acesse: http://localhost:3001/admin/usuarios?demo_email=admin@institutoimagine.org');
  console.log('2. Verifique se o sidebar aparece à esquerda');
  console.log('3. Teste a navegação entre as páginas admin');
  console.log('4. Verifique se não há erros no console do navegador');
}

// Executar teste
testSidebarPort3001().catch(console.error);
