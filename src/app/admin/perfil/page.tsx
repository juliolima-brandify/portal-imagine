'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ToastContainer, useToast } from '@/components/Toast'
import type { User } from '@supabase/supabase-js'
import ImageUpload from '@/components/ImageUpload'

export default function AdminPerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(true)
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
  const [isUploading, setIsUploading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
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
            avatar: ''
          })
          setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
        } else {
          // Usuário real - autenticação com Supabase
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUser(user)
            setFormData({
              name: user.user_metadata?.name || '',
              email: user.email || '',
              phone: user.user_metadata?.phone || '',
              avatar: user.user_metadata?.avatar || ''
            })
            
            // Carregar avatar do perfil
            const { data: profile } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .single()
            
            if (profile?.avatar_url) {
              setProfileImage(profile.avatar_url)
            }
          }
          // Remover redirecionamento - deixar o layout admin lidar com isso
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
          avatar: formData.avatar
        }
      })

      if (error) throw error

      // Atualizar também na tabela profiles
      await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id)

      success('Perfil Atualizado', 'Suas informações foram salvas com sucesso!')
      setIsEditing(false)
    } catch (err) {
      error('Erro', 'Não foi possível salvar as alterações')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfileImage(data.publicUrl)
      
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id)

      if (updateError) {
        console.error('Erro ao atualizar avatar:', updateError)
      }
      
      success('Foto Atualizada', 'Sua foto de perfil foi atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err)
      error('Erro', 'Não foi possível fazer upload da imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeProfileImage = () => {
    setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
  }

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        error('Erro', 'As senhas não coincidem')
        return
      }

      if (passwordData.newPassword.length < 6) {
        error('Erro', 'A senha deve ter no mínimo 6 caracteres')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) throw updateError

      success('Senha Alterada', 'Sua senha foi alterada com sucesso!')
      setShowPasswordModal(false)
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      error('Erro', 'Não foi possível alterar a senha')
    }
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

      {/* Perfil Simplificado */}
      <div className="card p-6 mb-6">
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

        {/* Foto de Perfil */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                src={profileImage}
                alt="Foto do perfil"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Foto do Perfil</h3>
              <p className="text-xs text-gray-500">Adicione uma foto para personalizar seu perfil</p>
            </div>
            <div>
              <ImageUpload
                currentImage={profileImage}
                onImageChange={handleImageUpload}
                onImageRemove={removeProfileImage}
                isUploading={isUploading}
                maxSize={5}
              />
            </div>
          </div>
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
                  placeholder="Digite seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
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
                placeholder="(11) 99999-9999"
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
                <p className="text-gray-900">{formData.name || 'Não informado'}</p>
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
              <p className="text-gray-900">{formData.phone || 'Não informado'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Segurança */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h3>
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Alterar Senha</div>
              <div className="text-sm text-gray-500">Mantenha sua conta segura</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="input-modern"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="input-modern"
                  placeholder="Digite a senha novamente"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  className="btn-primary flex-1"
                >
                  Alterar Senha
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ newPassword: '', confirmPassword: '' })
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
