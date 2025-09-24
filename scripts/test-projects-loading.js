const fetch = require('node-fetch')

async function testProjectsLoading() {
  console.log('🧪 Testando carregamento de projetos...')
  
  try {
    console.log('📡 Fazendo requisição para /api/admin/projects...')
    const response = await fetch('http://localhost:3001/api/admin/projects')
    const result = await response.json()
    
    console.log('📥 Resposta da API:', {
      status: response.status,
      ok: response.ok,
      dataLength: result.data?.length
    })
    
    if (result.data && result.data.length > 0) {
      console.log('✅ Projetos encontrados:')
      result.data.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} (${project.status})`)
      })
    } else {
      console.log('❌ Nenhum projeto encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar carregamento:', error.message)
  }
}

testProjectsLoading()
