'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function VolunteerContributionsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      // Verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      const roleParam = urlParams.get('role')
      
      if (demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer') {
        setUser({
          id: 'demo-volunteer',
          email: demoEmail || 'volunteer@institutoimagine.org',
          user_metadata: { name: 'Voluntário Demo' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
        
        // Mock data para demonstração
        setContributions([
          {
            id: '1',
            project: 'Educação Digital',
            hours: 24,
            date: '2024-01-15',
            status: 'completed',
            description: 'Ajuda na configuração de laboratório de informática'
          },
          {
            id: '2',
            project: 'Saúde Comunitária',
            hours: 16,
            date: '2024-01-20',
            status: 'completed',
            description: 'Apoio em campanha de vacinação'
          },
          {
            id: '3',
            project: 'Alimentação Escolar',
            hours: 12,
            date: '2024-01-25',
            status: 'in_progress',
            description: 'Organização de distribuição de alimentos'
          }
        ])
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Carregar contribuições do Supabase
          // TODO: Implementar carregamento real
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    getUser()
  }, [])

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
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Acesso Negado</h1>
          <p className="mb-4 text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minhas Contribuições
        </h1>
        <p className="text-gray-600">
          Acompanhe suas contribuições voluntárias e o impacto que você está causando.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {contributions.reduce((total, c) => total + c.hours, 0)}h
          </div>
          <p className="text-sm text-gray-600">Total de Horas</p>
        </div>
        
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {contributions.filter(c => c.status === 'completed').length}
          </div>
          <p className="text-sm text-gray-600">Projetos Concluídos</p>
        </div>
        
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {contributions.filter(c => c.status === 'in_progress').length}
          </div>
          <p className="text-sm text-gray-600">Em Andamento</p>
        </div>
      </div>

      {/* Contributions List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Contribuições</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {contributions.map((contribution) => (
            <div key={contribution.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {contribution.project}
                  </h3>
                  <p className="text-gray-600 mt-1">{contribution.description}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span>{contribution.hours}h</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(contribution.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contribution.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {contribution.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
