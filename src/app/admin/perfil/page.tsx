'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ToastContainer, useToast } from '@/components/Toast'
import type { User } from '@supabase/supabase-js'

export default function AdminPerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(true)
  
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Verificar se é modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'admin@institutoimagine.org') {
          setUser({
            id: '00000000-0000-0000-0000-000000000001',
            email: demoEmail,
            user_metadata: { name: 'Admin Demo' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          
          setFormData({
            name: 'Admin Demo',
            email: demoEmail,
            phone: '(11) 99999-9999',
            bio: 'Administrador do Instituto Imagine',
            avatar: ''
          })
        } else {
          // Usuário real - autenticação com Supabase
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUser(user)
            setFormData({
              name: user.user_metadata?.name || '',
              email: user.email || '',
              phone: user.user_metadata?.phone || '',
              bio: user.user_metadata?.bio || '',
              avatar: user.user_metadata?.avatar || ''
            })
          } else {
            // Se não conseguir obter usuário, redirecionar para login
            window.location.href = '/auth'
            return
          }
        }
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        // Não redirecionar automaticamente, deixar o layout admin lidar com isso
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleSave = async () => {
    try {
      if (!user) return

      // Atualizar dados do usuário no Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          avatar: formData.avatar
        }
      })

      if (error) throw error

      success('Perfil Atualizado', 'Suas informações foram salvas com sucesso!')
      setIsEditing(false)
    } catch (err) {
      error('Erro', 'Não foi possível salvar as alterações')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e configurações da conta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Editar Perfil
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="input-modern"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografia
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    className="input-modern"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Nome Completo
                    </label>
                    <p className="text-gray-900">{formData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{formData.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Telefone
                  </label>
                  <p className="text-gray-900">{formData.phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Biografia
                  </label>
                  <p className="text-gray-900">{formData.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar e Informações Adicionais */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto do Perfil</h3>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button className="btn-secondary text-sm">
                Alterar Foto
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Projetos Gerenciados</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usuários Ativos</span>
                <span className="font-semibold text-gray-900">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doações Processadas</span>
                <span className="font-semibold text-gray-900">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Membro desde</span>
                <span className="font-semibold text-gray-900">Jan 2024</span>
              </div>
            </div>
          </div>

          {/* Configurações de Segurança */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Alterar Senha</div>
                <div className="text-sm text-gray-500">Última alteração há 30 dias</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Autenticação 2FA</div>
                <div className="text-sm text-gray-500">Não configurado</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
