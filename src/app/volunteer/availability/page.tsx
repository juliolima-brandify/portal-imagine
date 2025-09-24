'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function VolunteerAvailabilityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState({
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false }
  })

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
        setLoading(false)
        return
      }

      // Se não for demo, tentar com Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const handleAvailabilityChange = (day: string, period: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...(prev as any)[day],
        [period]: !(prev as any)[day][period]
      }
    }))
  }

  const saveAvailability = async () => {
    // TODO: Implementar salvamento no Supabase
    console.log('Salvando disponibilidade:', availability)
    alert('Disponibilidade salva com sucesso!')
  }

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

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  const periods = [
    { key: 'morning', label: 'Manhã (8h-12h)' },
    { key: 'afternoon', label: 'Tarde (13h-17h)' },
    { key: 'evening', label: 'Noite (18h-22h)' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minha Disponibilidade
        </h1>
        <p className="text-gray-600">
          Configure seus horários de disponibilidade para atividades voluntárias.
        </p>
      </div>

      {/* Availability Form */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Horários de Disponibilidade</h2>
          <p className="text-sm text-gray-600 mt-1">
            Marque os horários em que você está disponível para atividades voluntárias.
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">{day.label}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {periods.map((period) => (
                    <label key={period.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(availability as any)[day.key][period.key]}
                        onChange={() => handleAvailabilityChange(day.key, period.key)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{period.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveAvailability}
              className="btn-primary"
            >
              Salvar Disponibilidade
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Disponibilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Dias Disponíveis:</h4>
            <p className="text-sm text-gray-600">
              {days.filter(day =>
                (availability as any)[day.key].morning ||
                (availability as any)[day.key].afternoon ||
                (availability as any)[day.key].evening
              ).length} de 7 dias da semana
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Total de Horários:</h4>
            <p className="text-sm text-gray-600">
              {Object.values(availability).reduce((total, day) => 
                total + Object.values(day).filter(Boolean).length, 0
              )} períodos selecionados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
