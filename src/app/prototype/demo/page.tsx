'use client';

import Link from 'next/link';

// Projetos reais do CMS do Framer
const mockProjects = [
  {
    id: 'bdfd300b-9138-4def-bde1-9d769e1d9e30',
    title: 'Educação Transformadora',
    description: 'Projetos que transformam vidas através da educação, levando conhecimento e oportunidades para comunidades carentes.',
    category: 'educacao',
    targetAmount: 75000,
    currentAmount: 52000,
    status: 'ativo',
    location: 'São Paulo, SP',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: 'f9529225-4b6d-400b-b58a-3b7b32260450',
    title: 'Saúde e Bem Estar',
    description: 'Promovendo saúde e bem-estar através de atendimento médico, prevenção e conscientização em comunidades vulneráveis.',
    category: 'saude',
    targetAmount: 60000,
    currentAmount: 38000,
    status: 'ativo',
    location: 'Bahia, BA',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: 'eea882e5-cb66-4688-a1c9-58f939a4b65e',
    title: 'Arte que Transforma',
    description: 'Usando a arte como ferramenta de transformação social, desenvolvendo talentos e promovendo cultura em comunidades.',
    category: 'arte',
    targetAmount: 45000,
    currentAmount: 28000,
    status: 'ativo',
    location: 'Rio de Janeiro, RJ',
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Esporte e Cidadania',
    description: 'Desenvolvendo cidadania através do esporte, promovendo valores, disciplina e oportunidades para jovens.',
    category: 'esporte',
    targetAmount: 55000,
    currentAmount: 32000,
    status: 'ativo',
    location: 'Minas Gerais, MG',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  },
  {
    id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    title: 'Apoio Social e Comunitário',
    description: 'Fortalecendo comunidades através de apoio social, capacitação e desenvolvimento comunitário sustentável.',
    category: 'social',
    targetAmount: 80000,
    currentAmount: 45000,
    status: 'ativo',
    location: 'Pernambuco, PE',
    imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop&crop=center',
    organization: 'Instituto Imagine'
  }
];

export default function PrototypeDemoPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <img src="/images/logo.png" alt="Logo" className="h-8 w-auto" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Prototype Demo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Protótipo do Sistema de Doações
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Teste o checkout de doações com estes projetos. Escolha entre embed (iframe) ou link direto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src={project.imageUrl} 
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {project.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Arrecadado</span>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {project.currentAmount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(project.currentAmount / project.targetAmount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Meta: R$ {project.targetAmount.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{project.location}</span>
                  <span className="text-sm text-gray-500">{project.organization}</span>
                </div>

                {/* Action Button */}
                <div className="space-y-3">
                  {/* Main Checkout Button */}
                  <Link
                    href={`/prototype/checkout/${project.id}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-lg"
                  >
                    <span>💚</span>
                    <span>Doar Agora</span>
                  </Link>

                  {/* Project ID for Reference */}
                  <div className="text-xs text-gray-400 text-center">
                    ID: {project.id.substring(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            💚 Como Doar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎯 Processo Simples
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Clique em &quot;Doar Agora&quot; no projeto desejado</li>
                <li>• Escolha o valor da sua doação</li>
                <li>• Preencha seus dados pessoais</li>
                <li>• Complete o pagamento com segurança</li>
                <li>• Receba confirmação da sua doação</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔒 Segurança Garantida
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Pagamentos processados pelo Stripe</li>
                <li>• Dados protegidos com criptografia</li>
                <li>• Transparência total na aplicação</li>
                <li>• Suporte completo ao doador</li>
                <li>• Recibo automático por email</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Project IDs Reference */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            📋 IDs dos Projetos para Teste
          </h2>
          <div className="space-y-2">
            {mockProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <span className="font-medium text-gray-900">{project.title}</span>
                  <span className="text-sm text-gray-500 ml-2">({project.location})</span>
                </div>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {project.id}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            🧪 Como Testar o Sistema
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-green-800">
            <li>Clique em &quot;Doar Agora&quot; em qualquer projeto</li>
            <li>Teste o checkout completo com dados reais</li>
            <li>Use o script de preenchimento automático no console (F12)</li>
            <li>Verifique os logs no console para acompanhar o progresso</li>
            <li>Confirme que a doação é criada com sucesso no banco</li>
          </ol>
        </div>
      </div>
    </div>
  );
}