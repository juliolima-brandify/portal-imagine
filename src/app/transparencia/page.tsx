'use client'

import Link from 'next/link'
import Header from '@/components/Header'

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAuth={true} showBackToMain={true} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transparência
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acreditamos que a transparência é fundamental para construir confiança. 
            Aqui você encontra todas as informações sobre como utilizamos os recursos.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">R$ 2.5M</div>
            <div className="text-gray-600">Total Arrecadado</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
            <div className="text-gray-600">Doadores Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">23</div>
            <div className="text-gray-600">Projetos Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
            <div className="text-gray-600">Taxa de Aplicação</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Relatórios Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Relatórios Financeiros
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Relatório Anual 2023</h3>
                  <p className="text-sm text-gray-600">Demonstrativo completo de receitas e despesas</p>
                </div>
                <Link 
                  href="/relatorios/2023.pdf" 
                  className="btn-secondary text-sm"
                  target="_blank"
                >
                  Baixar PDF
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Relatório Trimestral Q4 2023</h3>
                  <p className="text-sm text-gray-600">Último trimestre de 2023</p>
                </div>
                <Link 
                  href="/relatorios/q4-2023.pdf" 
                  className="btn-secondary text-sm"
                  target="_blank"
                >
                  Baixar PDF
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Demonstrativo de Aplicação</h3>
                  <p className="text-sm text-gray-600">Como cada real foi aplicado nos projetos</p>
                </div>
                <Link 
                  href="/relatorios/aplicacao.pdf" 
                  className="btn-secondary text-sm"
                  target="_blank"
                >
                  Baixar PDF
                </Link>
              </div>
            </div>
          </div>

          {/* Impacto dos Projetos */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Impacto dos Projetos
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">Educação Digital</h3>
                <p className="text-sm text-gray-600 mb-2">Laboratórios de informática em comunidades carentes</p>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Impacto:</span> 1,200 crianças beneficiadas
                </div>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900">Saúde Comunitária</h3>
                <p className="text-sm text-gray-600 mb-2">Clínicas móveis e atendimento básico</p>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Impacto:</span> 3,500 atendimentos realizados
                </div>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900">Meio Ambiente</h3>
                <p className="text-sm text-gray-600 mb-2">Reflorestamento e conscientização ambiental</p>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Impacto:</span> 500 árvores plantadas
                </div>
              </div>
            </div>
          </div>

          {/* Governança */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Governança
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Conselho Diretor</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maria Silva - Presidente</li>
                  <li>• João Santos - Vice-presidente</li>
                  <li>• Ana Costa - Diretora Financeira</li>
                  <li>• Pedro Lima - Diretor de Projetos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Auditoria Externa</h3>
                <p className="text-sm text-gray-600">
                  Nossas contas são auditadas anualmente pela empresa 
                  <strong> Audit & Co</strong>, garantindo total transparência.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Certificações</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Certificado de Entidade Beneficente</li>
                  <li>• ISO 9001:2015 - Gestão da Qualidade</li>
                  <li>• Selo de Transparência - Instituto Doar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Uso dos Recursos */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Uso dos Recursos
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Aplicação Direta nos Projetos</span>
                <span className="font-semibold text-green-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Administração e Gestão</span>
                <span className="font-semibold text-blue-600">10%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '10%'}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Captação de Recursos</span>
                <span className="font-semibold text-purple-600">5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '5%'}}></div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>95% dos recursos</strong> são aplicados diretamente nos projetos ou em atividades 
                essenciais para sua execução, superando os padrões do setor.
              </p>
            </div>
          </div>
        </div>

        {/* Política de Transparência */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Política de Transparência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Nossos Compromissos:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Publicação mensal de relatórios financeiros</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Demonstrativo detalhado de aplicação de recursos</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Relatórios de impacto dos projetos</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Auditoria externa anual</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Como Acompanhar:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Relatórios disponíveis para download</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Dashboard em tempo real no portal</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Newsletter mensal com atualizações</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Canal direto para dúvidas e sugestões</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Dúvidas sobre Transparência?
          </h2>
          <p className="text-gray-600 mb-6">
            Nossa equipe está disponível para esclarecer qualquer questão sobre o uso dos recursos.
          </p>
          <Link href="/contato" className="btn-primary">
            Entrar em Contato
          </Link>
        </div>
      </main>
    </div>
  )
}
