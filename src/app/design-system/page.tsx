'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('colors')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design System</h1>
              <p className="text-sm text-gray-500">Portal Instituto Imagine</p>
            </div>
            <Link href="/" className="btn-secondary">
              Voltar ao Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'colors', label: 'Cores' },
              { id: 'typography', label: 'Tipografia' },
              { id: 'buttons', label: 'Botões' },
              { id: 'forms', label: 'Formulários' },
              { id: 'cards', label: 'Cards' },
              { id: 'navigation', label: 'Navegação' },
              { id: 'layout', label: 'Layout' },
              { id: 'components', label: 'Componentes' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'colors' && <ColorsSection />}
        {activeTab === 'typography' && <TypographySection />}
        {activeTab === 'buttons' && <ButtonsSection />}
        {activeTab === 'forms' && <FormsSection />}
        {activeTab === 'cards' && <CardsSection />}
        {activeTab === 'navigation' && <NavigationSection />}
        {activeTab === 'layout' && <LayoutSection />}
        {activeTab === 'components' && <ComponentsSection />}
      </div>
    </div>
  )
}

// Colors Section
function ColorsSection() {
  const colorPalette = [
    { name: 'Primary Blue', class: 'bg-blue-600', hex: '#2563eb', usage: 'Botões principais, links ativos' },
    { name: 'Secondary Gray', class: 'bg-gray-600', hex: '#4b5563', usage: 'Botões secundários, texto' },
    { name: 'Success Green', class: 'bg-green-600', hex: '#16a34a', usage: 'Sucesso, confirmações' },
    { name: 'Warning Orange', class: 'bg-orange-600', hex: '#ea580c', usage: 'Avisos, alertas' },
    { name: 'Error Red', class: 'bg-red-600', hex: '#dc2626', usage: 'Erros, exclusões' },
    { name: 'Info Purple', class: 'bg-purple-600', hex: '#9333ea', usage: 'Informações, badges' },
    { name: 'Background Gray', class: 'bg-gray-50', hex: '#f9fafb', usage: 'Fundo principal' },
    { name: 'Card White', class: 'bg-white', hex: '#ffffff', usage: 'Cards, modais' },
    { name: 'Border Gray', class: 'bg-gray-200', hex: '#e5e7eb', usage: 'Bordas, divisores' },
    { name: 'Text Dark', class: 'bg-gray-900', hex: '#111827', usage: 'Títulos, texto principal' },
    { name: 'Text Medium', class: 'bg-gray-600', hex: '#4b5563', usage: 'Texto secundário' },
    { name: 'Text Light', class: 'bg-gray-400', hex: '#9ca3af', usage: 'Texto auxiliar' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paleta de Cores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorPalette.map((color) => (
            <div key={color.name} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded ${color.class}`}></div>
                <div>
                  <h3 className="font-medium text-gray-900">{color.name}</h3>
                  <p className="text-sm text-gray-500">{color.hex}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">{color.usage}</p>
              <code className="text-xs text-gray-500 mt-1 block">{color.class}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gradientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-16 rounded-lg flex items-center justify-center text-white font-medium">
            Blue to Purple
          </div>
          <div className="bg-gradient-to-r from-green-500 to-blue-600 h-16 rounded-lg flex items-center justify-center text-white font-medium">
            Green to Blue
          </div>
        </div>
      </div>
    </div>
  )
}

// Typography Section
function TypographySection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tipografia</h2>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Heading 1</h1>
            <code className="text-sm text-gray-500">text-4xl font-bold</code>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Heading 2</h2>
            <code className="text-sm text-gray-500">text-3xl font-semibold</code>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Heading 3</h3>
            <code className="text-sm text-gray-500">text-2xl font-semibold</code>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Heading 4</h4>
            <code className="text-sm text-gray-500">text-xl font-semibold</code>
          </div>
          <div>
            <p className="text-lg text-gray-900 mb-2">Parágrafo grande</p>
            <code className="text-sm text-gray-500">text-lg</code>
          </div>
          <div>
            <p className="text-base text-gray-900 mb-2">Parágrafo normal</p>
            <code className="text-sm text-gray-500">text-base</code>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Texto pequeno</p>
            <code className="text-sm text-gray-500">text-sm text-gray-600</code>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Texto extra pequeno</p>
            <code className="text-sm text-gray-500">text-xs text-gray-500</code>
          </div>
        </div>
      </div>
    </div>
  )
}

// Buttons Section
function ButtonsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Botões</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Botões Primários</h3>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">Primário</button>
              <button className="btn-primary" disabled>Primário Desabilitado</button>
            </div>
            <code className="text-sm text-gray-500 mt-2 block">btn-primary</code>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Botões Secundários</h3>
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary">Secundário</button>
              <button className="btn-secondary" disabled>Secundário Desabilitado</button>
            </div>
            <code className="text-sm text-gray-500 mt-2 block">btn-secondary</code>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Botões de Status</h3>
            <div className="flex flex-wrap gap-3">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Sucesso
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Erro
              </button>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Aviso
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Info
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tamanhos</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary text-xs px-2 py-1">Pequeno</button>
              <button className="btn-primary text-sm px-3 py-2">Médio</button>
              <button className="btn-primary text-base px-4 py-2">Grande</button>
              <button className="btn-primary text-lg px-6 py-3">Extra Grande</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Forms Section
function FormsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Formulários</h2>
        
        <div className="max-w-2xl">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Selecione uma categoria</option>
                <option>Educação</option>
                <option>Saúde</option>
                <option>Meio Ambiente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite sua mensagem..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Aceito os termos e condições
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Enviar
              </button>
              <button type="button" className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Cards Section
function CardsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Total Doado</h3>
                <p className="text-sm text-gray-500">R$ 2.500,00</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Valor total das suas doações</p>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Doações</h3>
                <p className="text-sm text-gray-500">15 doações</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Número total de doações</p>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Favoritos</h3>
                <p className="text-sm text-gray-500">3 projetos</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Projetos favoritados</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Navigation Section
function NavigationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Navegação</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Sidebar</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center px-3 py-2 bg-blue-600 rounded-md">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  Dashboard
                </div>
                <div className="flex items-center px-3 py-2 hover:bg-gray-800 rounded-md">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Projetos
                </div>
                <div className="flex items-center px-3 py-2 hover:bg-gray-800 rounded-md">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Doações
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tabs</h3>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                  Ativo
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                  Inativo
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                  Outro
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Layout Section
function LayoutSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Layout</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Grid System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded text-center">Col 1</div>
              <div className="bg-blue-100 p-4 rounded text-center">Col 2</div>
              <div className="bg-blue-100 p-4 rounded text-center">Col 3</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Spacing</h3>
            <div className="space-y-2">
              <div className="bg-gray-200 h-2 w-4"></div>
              <code className="text-sm text-gray-500">space-y-2</code>
            </div>
            <div className="space-y-4 mt-4">
              <div className="bg-gray-200 h-2 w-8"></div>
              <div className="bg-gray-200 h-2 w-8"></div>
            </div>
            <code className="text-sm text-gray-500">space-y-4</code>
          </div>
        </div>
      </div>
    </div>
  )
}

// Components Section
function ComponentsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Componentes</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ativo
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Inativo
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pendente
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Novo
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Alerts</h3>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Operação realizada com sucesso!</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">Ocorreu um erro. Tente novamente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Progress Bars</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}







