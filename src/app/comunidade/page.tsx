'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import type { User } from '@supabase/supabase-js'

// Mock data para demonstração
const mockCommunities = [
  {
    id: '1',
    name: 'Doadores Ativos',
    description: 'Comunidade principal para doadores que querem acompanhar projetos e impactos',
    members: 1250,
    category: 'Geral',
    isActive: true,
    joinLink: 'https://chat.whatsapp.com/ABC123',
    rules: [
      'Respeite todos os membros da comunidade',
      'Compartilhe apenas conteúdo relacionado aos projetos',
      'Não faça spam ou divulgação não autorizada',
      'Mantenha o foco no impacto social'
    ],
    recentActivity: [
      { user: 'Maria Santos', action: 'compartilhou uma atualização do projeto Educação Digital', time: '2h' },
      { user: 'João Silva', action: 'fez uma doação para o projeto Saúde Comunitária', time: '4h' },
      { user: 'Ana Costa', action: 'compartilhou fotos do projeto Meio Ambiente', time: '6h' }
    ]
  },
  {
    id: '2',
    name: 'Educação & Tecnologia',
    description: 'Foco em projetos educacionais e de inclusão digital',
    members: 450,
    category: 'Educação',
    isActive: true,
    joinLink: 'https://chat.whatsapp.com/DEF456',
    rules: [
      'Conteúdo específico sobre educação e tecnologia',
      'Compartilhe recursos educacionais',
      'Discuta impactos dos projetos educacionais'
    ],
    recentActivity: [
      { user: 'Carlos Mendes', action: 'compartilhou um tutorial de programação', time: '1h' },
      { user: 'Lucia Ferreira', action: 'relatou o progresso do laboratório de informática', time: '3h' }
    ]
  },
  {
    id: '3',
    name: 'Saúde & Bem-estar',
    description: 'Comunidade focada em projetos de saúde e bem-estar social',
    members: 320,
    category: 'Saúde',
    isActive: true,
    joinLink: 'https://chat.whatsapp.com/GHI789',
    rules: [
      'Foco em saúde comunitária',
      'Compartilhe dicas de bem-estar',
      'Discuta impactos dos projetos de saúde'
    ],
    recentActivity: [
      { user: 'Pedro Oliveira', action: 'compartilhou informações sobre vacinação', time: '5h' },
      { user: 'Fernanda Lima', action: 'relatou sobre a clínica móvel', time: '8h' }
    ]
  },
  {
    id: '4',
    name: 'Meio Ambiente',
    description: 'Comunidade dedicada a projetos ambientais e sustentabilidade',
    members: 280,
    category: 'Meio Ambiente',
    isActive: true,
    joinLink: 'https://chat.whatsapp.com/JKL012',
    rules: [
      'Foco em sustentabilidade',
      'Compartilhe dicas ambientais',
      'Discuta impactos dos projetos verdes'
    ],
    recentActivity: [
      { user: 'Roberto Silva', action: 'compartilhou fotos do reflorestamento', time: '2h' },
      { user: 'Carla Santos', action: 'organizou uma ação de limpeza', time: '1d' }
    ]
  }
]

const mockUserStats = {
  communitiesJoined: 2,
  totalMessages: 45,
  helpfulPosts: 12,
  lastActive: '2 horas atrás'
}

export default function ComunidadePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [communities, setCommunities] = useState(mockCommunities)
  const [userStats, setUserStats] = useState(mockUserStats)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const getUser = async () => {
      // Primeiro, verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
      if (demoEmail === 'demo@doador.com') {
        setUser({
          id: 'demo-user',
          email: demoEmail,
          user_metadata: { name: 'Doador Demo' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/auth'
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const filteredCommunities = selectedCategory === 'all' 
    ? communities 
    : communities.filter(community => community.category === selectedCategory)

  const categories = ['all', 'Geral', 'Educação', 'Saúde', 'Meio Ambiente']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <Link href="/auth" className="btn-primary">
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user ? {
          id: user.id,
          name: user.user_metadata?.name,
          email: user.email,
          role: 'donor'
        } : undefined}
        onSignOut={() => {
          // Redirecionar para auth
          window.location.href = '/auth'
        }}
        showAuth={false}
        showBackToMain={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comunidade WhatsApp
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conecte-se com outros doadores, acompanhe o progresso dos projetos e faça parte de uma comunidade que transforma vidas.
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comunidades</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.communitiesJoined}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensagens</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Úteis</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.helpfulPosts}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Última Atividade</p>
                <p className="text-lg font-bold text-gray-900">{userStats.lastActive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comunidades Disponíveis</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category === 'all' ? 'Todas' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{community.name}</h3>
                  <p className="text-gray-600 mb-3">{community.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {community.members.toLocaleString()} membros
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {community.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${community.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
              </div>

              {/* Rules */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Regras da Comunidade:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {community.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent Activity */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Atividade Recente:</h4>
                <div className="space-y-2">
                  {community.recentActivity.map((activity, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                      <span className="text-gray-400 ml-2">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <a
                href={community.joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-primary text-center block"
              >
                <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Entrar no WhatsApp
              </a>
            </div>
          ))}
        </div>

        {/* Guidelines */}
        <div className="mt-12 card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Diretrizes da Comunidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ O que é permitido:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Compartilhar atualizações dos projetos
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fazer perguntas sobre doações
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sugerir melhorias
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apoiar outros doadores
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">❌ O que não é permitido:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Spam ou mensagens repetitivas
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Conteúdo ofensivo ou discriminatório
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Divulgação não autorizada
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Discussões políticas ou religiosas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
