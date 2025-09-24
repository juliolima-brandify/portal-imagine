const https = require('https');
const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3000';
const DEMO_EMAIL = 'admin@institutoimagine.org';

// URLs para testar
const testUrls = [
  {
    name: 'Dashboard',
    url: `${BASE_URL}/dashboard?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  },
  {
    name: 'Projetos',
    url: `${BASE_URL}/projetos?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  },
  {
    name: 'Admin - Doações',
    url: `${BASE_URL}/admin/doacoes?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  },
  {
    name: 'Admin - Usuários',
    url: `${BASE_URL}/admin/usuarios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  },
  {
    name: 'Admin - Relatórios',
    url: `${BASE_URL}/admin/relatorios?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  },
  {
    name: 'Admin - Projetos',
    url: `${BASE_URL}/admin/projetos?demo_email=${encodeURIComponent(DEMO_EMAIL)}`,
    expectedStatus: 200
  }
];

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + '...' // Primeiros 200 caracteres
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Função principal de teste
async function testSidebarNavigation() {
  console.log('🔍 Testando Navegação do Sidebar Admin');
  console.log('📧 Email demo:', DEMO_EMAIL);
  console.log('🌐 Base URL:', BASE_URL);
  console.log('');

  const results = [];

  for (const test of testUrls) {
    try {
      console.log(`🔄 Testando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      
      const success = response.statusCode === test.expectedStatus;
      const status = success ? '✅' : '❌';
      
      console.log(`   Status: ${response.statusCode} ${status}`);
      
      if (success) {
        console.log(`   ✅ ${test.name} - OK`);
      } else {
        console.log(`   ❌ ${test.name} - Erro (esperado: ${test.expectedStatus}, recebido: ${response.statusCode})`);
      }
      
      results.push({
        name: test.name,
        url: test.url,
        status: response.statusCode,
        success: success
      });
      
    } catch (error) {
      console.log(`   ❌ ${test.name} - Erro de conexão: ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }

  // Resumo dos resultados
  console.log('📊 Resumo dos Testes:');
  console.log('====================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${((successful / results.length) * 100).toFixed(1)}%`);
  console.log('');

  // Detalhes das falhas
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('❌ Falhas encontradas:');
    failures.forEach(failure => {
      console.log(`   • ${failure.name}: ${failure.status} - ${failure.error || 'Status inesperado'}`);
    });
  }

  // URLs que funcionaram
  const successes = results.filter(r => r.success);
  if (successes.length > 0) {
    console.log('');
    console.log('✅ URLs funcionando:');
    successes.forEach(success => {
      console.log(`   • ${success.name}: ${success.url}`);
    });
  }

  console.log('');
  console.log('🎯 Teste concluído!');
}

// Executar teste
testSidebarNavigation().catch(console.error);
