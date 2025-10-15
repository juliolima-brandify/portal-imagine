'use client'

import { useState } from 'react'
import Link from 'next/link'

interface VolunteerStats {
  activeProjects: number
  hoursThisWeek: number
  totalHours: number
  upcomingEvents: number
}

export default function VolunteerDashboard() {
  const [stats, setStats] = useState<VolunteerStats>({
    activeProjects: 5,
    hoursThisWeek: 12,
    totalHours: 45,
    upcomingEvents: 3
  })

  const [projects] = useState([])

  return (
    <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Início do Voluntário 👋
          </h1>
          <p className="text-gray-600">
            Gerencie suas atividades de voluntariado e contribua para a comunidade.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.activeProjects}
            </div>
            <div className="text-sm text-gray-600">
              Projetos Ativos
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.hoursThisWeek}h
            </div>
            <div className="text-sm text-gray-600">
              Esta Semana
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.totalHours}h
            </div>
            <div className="text-sm text-gray-600">
              Total Contribuído
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats.upcomingEvents}
            </div>
            <div className="text-sm text-gray-600">
              Próximos Eventos
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/volunteer/projects" className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projetos Disponíveis</h3>
            <p className="text-gray-600 text-sm mb-4">
              Descubra oportunidades de voluntariado em projetos ativos.
            </p>
            <span className="text-blue-600 text-sm font-medium">Explorar →</span>
          </Link>

          <Link href="/volunteer/availability" className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Disponibilidade</h3>
            <p className="text-gray-600 text-sm mb-4">
              Configure seus horários disponíveis para voluntariado.
            </p>
            <span className="text-green-600 text-sm font-medium">Configurar →</span>
          </Link>

          <Link href="/volunteer/contributions" className="card card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Minhas Contribuições</h3>
            <p className="text-gray-600 text-sm mb-4">
              Veja o histórico das suas atividades e impacto.
            </p>
            <span className="text-purple-600 text-sm font-medium">Ver Histórico →</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Participou do projeto Educação Digital
                </p>
                <p className="text-xs text-gray-500">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Configurou disponibilidade para próxima semana
                </p>
                <p className="text-xs text-gray-500">Há 1 dia</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Completou 8 horas de voluntariado
                </p>
                <p className="text-xs text-gray-500">Há 3 dias</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
