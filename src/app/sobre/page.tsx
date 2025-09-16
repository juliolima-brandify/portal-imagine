'use client'

import Link from 'next/link'
import Header from '@/components/Header'

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAuth={true} showBackToMain={true} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sobre o Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Uma plataforma segura e transparente para doações e gestão de projetos sociais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Missão */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nossa Missão
            </h2>
            <p className="text-gray-600">
              Facilitar o processo de doação e conectar doadores com projetos que realmente fazem a diferença na sociedade. 
              Queremos tornar a solidariedade mais acessível e transparente.
            </p>
          </div>

          {/* Visão */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nossa Visão
            </h2>
            <p className="text-gray-600">
              Ser a principal plataforma de doações do Brasil, reconhecida pela transparência, 
              segurança e impacto social positivo em comunidades carentes.
            </p>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nossos Valores
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Transparência:</strong> Todas as doações são rastreadas e reportadas</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Segurança:</strong> Pagamentos protegidos com tecnologia de ponta</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Impacto:</strong> Foco em projetos com resultados mensuráveis</span>
              </li>
            </ul>
          </div>

          {/* Como Funciona */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full text-sm flex items-center justify-center mr-3 flex-shrink-0">1</span>
                <span>Escolha um projeto que deseja apoiar</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full text-sm flex items-center justify-center mr-3 flex-shrink-0">2</span>
                <span>Defina o valor e método de pagamento</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full text-sm flex items-center justify-center mr-3 flex-shrink-0">3</span>
                <span>Faça sua doação de forma segura</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full text-sm flex items-center justify-center mr-3 flex-shrink-0">4</span>
                <span>Acompanhe o impacto da sua doação</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Tecnologia */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Tecnologia e Segurança
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pagamentos Seguros</h3>
              <p className="text-gray-600 text-sm">
                Utilizamos o Stripe, líder mundial em processamento de pagamentos
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dados Protegidos</h3>
              <p className="text-gray-600 text-sm">
                Criptografia de ponta e conformidade com LGPD
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transparência Total</h3>
              <p className="text-gray-600 text-sm">
                Relatórios detalhados e acompanhamento em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Pronto para Fazer a Diferença?
          </h2>
          <p className="text-gray-600 mb-6">
            Junte-se a milhares de pessoas que já transformaram vidas através de doações.
          </p>
          <div className="space-x-4">
            <Link href="/projetos" className="btn-primary">
              Ver Projetos
            </Link>
            <Link href="/contato" className="btn-secondary">
              Entrar em Contato
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
