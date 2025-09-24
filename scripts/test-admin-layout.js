const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3000';
const DEMO_EMAIL = 'admin@institutoimagine.org';

// URLs para testar o layout
const testUrls = [
  {
    name: 'Admin - Usuários',
    url: `${BASE_URL}/admin/usuarios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['sidebar', 'Sidebar', 'ml-64', 'ml-16', 'Gerenciar Usuários']
  },
  {
    name: 'Admin - Projetos', 
    url: `${BASE_URL}/admin/projetos?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['sidebar', 'Sidebar', 'ml-64', 'ml-16', 'Gerenciar Projetos']
  },
  {
    name: 'Admin - Doações',
    url: `${BASE_URL}/admin/doacoes?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedContent: ['sidebar', 'Sidebar', 'ml-64', 'ml-16', 'Gerenciar Doações']
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
async function testAdminLayout() {
  console.log('🔍 Testando Layout Admin e Sidebar');
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
        
        // Verificar se o layout está sendo aplicado
        const hasLayout = response.body.includes('ml-64') || response.body.includes('ml-16');
        const hasSidebar = response.body.includes('sidebar') || response.body.includes('Sidebar');
        
        console.log(`   📊 Layout aplicado: ${hasLayout ? '✅' : '❌'}`);
        console.log(`   📊 Sidebar presente: ${hasSidebar ? '✅' : '❌'}`);
        
        // Verificar estrutura HTML básica
        const hasMinHeight = response.body.includes('min-h-screen');
        const hasContainer = response.body.includes('max-w-7xl') || response.body.includes('container');
        
        console.log(`   📊 Estrutura HTML: ${hasMinHeight && hasContainer ? '✅' : '❌'}`);
        
      } else {
        console.log(`   ❌ Erro HTTP: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 Teste concluído!');
}

// Executar teste
testAdminLayout().catch(console.error);
