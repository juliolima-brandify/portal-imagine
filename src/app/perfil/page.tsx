'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ImageUpload from '@/components/ImageUpload'

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'donor' | 'volunteer'>('donor')
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        // 1) Priorizar usuário autenticado real
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)

          // Buscar role e dados do perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setProfile(profileData)
            setFormData(profileData)
            setUserRole(profileData.role === 'volunteer' ? 'volunteer' : 'donor')
            
            if (profileData.avatar_url) {
              setProfileImage(profileData.avatar_url)
            }
          } else {
            // Perfil padrão se não existir
            const defaultProfile = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || '',
              phone: '',
              role: 'donor',
              preferences: {
                notifications: true,
                newsletter: true
              },
              stats: {
                totalDonated: 0,
                totalDonations: 0,
                memberSince: new Date().toISOString().split('T')[0]
              }
            }
            setProfile(defaultProfile)
            setFormData(defaultProfile)
            setUserRole('donor')
          }
          return
        }

        // 2) Sem sessão real: modo demo via URL
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        if (demoEmail === 'demo@doador.com' || demoEmail === 'volunteer@institutoimagine.org') {
          const isDonor = demoEmail === 'demo@doador.com'
          
          setUser({
            id: '00000000-0000-0000-0000-000000000001',
            email: demoEmail,
            user_metadata: { 
              name: isDonor ? 'Doador Demo' : 'Voluntário Demo'
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User)
          
          setUserRole(isDonor ? 'donor' : 'volunteer')
          
          const defaultProfile = {
            id: '00000000-0000-0000-0000-000000000001',
            email: demoEmail,
            name: isDonor ? 'Doador Demo' : 'Voluntário Demo',
            phone: '(11) 99999-9999',
            role: isDonor ? 'donor' : 'volunteer',
            preferences: {
              notifications: true,
              newsletter: true
            },
            stats: isDonor ? {
              totalDonated: 475,
              totalDonations: 4,
              memberSince: '2024-01-15'
            } : {
              totalHours: 52,
              projectsCompleted: 2,
              projectsInProgress: 1,
              memberSince: '2024-01-15'
            }
          }
          setProfile(defaultProfile)
          setFormData(defaultProfile)
        } else {
          window.location.href = '/auth'
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        window.location.href = '/auth'
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name.includes('.')) {
        const [parent, child] = name.split('.')
        setFormData((prev: any) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked
          }
        }))
      } else {
        setFormData((prev: any) => ({
          ...prev,
          [name]: checked
        }))
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSave = async () => {
    try {
      // Salvar no Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          email: user?.email,
          name: formData.name,
          phone: formData.phone,
          preferences: formData.preferences
        })
      
      if (error) {
        console.error('Erro ao salvar perfil:', error)
        alert('Erro ao salvar perfil. Tente novamente.')
        return
      }
      
      setProfile(formData)
      setIsEditing(false)
      alert('Perfil salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil. Tente novamente.')
    }
  }

  const handleCancel = () => {
    setFormData(profile)
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
      
      console.log('Imagem enviada:', file.name)
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      alert('Erro ao fazer upload da imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeProfileImage = () => {
    setProfileImage('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando perfil...</div>
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
      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais e preferências</p>
            </div>
          </div>
        </div>

        {/* Profile Stats - Dinâmico por Role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {userRole === 'donor' ? (
            <>
              <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Doado</p>
                    <p className="text-lg font-semibold text-gray-900">
                      R$ {profile?.stats?.totalDonated?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Doações</p>
                    <p className="text-lg font-semibold text-gray-900">{profile?.stats?.totalDonations || 0}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total de Horas</p>
                    <p className="text-lg font-semibold text-gray-900">{profile?.stats?.totalHours || 0}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Projetos Concluídos</p>
                    <p className="text-lg font-semibold text-gray-900">{profile?.stats?.projectsCompleted || 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Membro desde</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.stats?.memberSince ? new Date(profile.stats.memberSince).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {/* Header do Formulário */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Informações Pessoais</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Editar Perfil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Photo Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  src={profileImage}
                  alt="Foto do perfil"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Foto do Perfil</h3>
                <p className="text-xs text-gray-500">Adicione uma foto para personalizar seu perfil</p>
              </div>
              <div className="flex-1">
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

          {/* Form Fields */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData?.name || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    placeholder="Seu email"
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
                  name="phone"
                  value={formData?.phone || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Preferências de Notificação */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Preferências de Notificação</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  checked={formData?.preferences?.notifications || false}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Receber notificações por email</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="preferences.newsletter"
                  checked={formData?.preferences?.newsletter || false}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Receber newsletter</span>
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
