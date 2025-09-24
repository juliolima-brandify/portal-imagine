'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestMobilePage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Test Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img 
                  src="/images/logo.svg" 
                  alt="Instituto Imagine" 
                  className="h-8 md:h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden h-8 md:h-10 w-8 md:w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base">I</span>
                </div>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              📱 Mobile Test
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Test Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'projects', label: 'Projetos' },
              { id: 'donations', label: 'Doações' },
              { id: 'profile', label: 'Perfil' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Test */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Dashboard Mobile Test
            </h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  R$ 1.2K
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Total Doado
                </div>
              </div>
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
                  12
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Doações
                </div>
              </div>
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                  5
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Projetos
                </div>
              </div>
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                  3
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Meses
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              <Link href="/projetos" className="card card-hover p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Explorar Projetos
                </h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
                  Descubra novos projetos e veja o impacto das suas doações.
                </p>
                <span className="text-blue-600 text-xs md:text-sm font-medium">
                  Explorar →
                </span>
              </Link>

              <Link href="/doacoes" className="card card-hover p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Minhas Doações
                </h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
                  Acompanhe o histórico de suas doações e o impacto gerado.
                </p>
                <span className="text-green-600 text-xs md:text-sm font-medium">
                  Ver Doações →
                </span>
              </Link>

              <Link href="/perfil" className="card card-hover p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Meu Perfil
                </h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
                  Gerencie suas informações e preferências de doação.
                </p>
                <span className="text-purple-600 text-xs md:text-sm font-medium">
                  Ver Perfil →
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Projects Test */}
        {activeTab === 'projects' && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Projetos Mobile Test
            </h1>
            
            {/* Filter Buttons */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {['Todas', 'Educação', 'Saúde', 'Meio Ambiente', 'Social', 'Esporte'].map((category) => (
                  <button
                    key={category}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      category === 'Todas'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-6">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Imagem do Projeto {i}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Projeto de Exemplo {i}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Descrição do projeto que demonstra como o layout se comporta em diferentes tamanhos de tela.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary text-xs px-3 py-1">
                      Doar Agora
                    </button>
                    <button className="btn-secondary text-xs px-3 py-1">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Donations Test */}
        {activeTab === 'donations' && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Doações Mobile Test
            </h1>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  R$ 1.2K
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Total Doado
                </div>
              </div>
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                  8
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Concluídas
                </div>
              </div>
              <div className="card p-4 md:p-6">
                <div className="text-xl md:text-2xl font-bold text-yellow-600 mb-1">
                  2
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Pendentes
                </div>
              </div>
            </div>

            {/* Donations List */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Projeto de Exemplo {i}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        R$ {150 + (i * 50)} • {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Concluída
                      </span>
                      <button className="text-blue-600 text-sm font-medium">
                        Ver Recibo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Test */}
        {activeTab === 'profile' && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Perfil Mobile Test
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações Pessoais
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      className="input-modern w-full"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input-modern w-full"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      className="input-modern w-full"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Preferências
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-sm text-gray-700">
                      Receber recibos por email
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-sm text-gray-700">
                      Doar anonimamente por padrão
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-sm text-gray-700">
                      Receber atualizações dos projetos
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Test Info */}
        <div className="mt-12 card p-6 bg-blue-50">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            📱 Teste Mobile - Portal Imagine
          </h2>
          <p className="text-blue-800 text-sm mb-4">
            Esta página demonstra as otimizações mobile implementadas. Teste em diferentes tamanhos de tela:
          </p>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• <strong>Mobile (320px-640px):</strong> Layout em coluna única, textos menores</li>
            <li>• <strong>Tablet (641px-1024px):</strong> Layout em 2 colunas, tamanhos médios</li>
            <li>• <strong>Desktop (1025px+):</strong> Layout completo, tamanhos originais</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
