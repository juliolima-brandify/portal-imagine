'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/database'
import type { User } from '@supabase/supabase-js'
import ImageUpload from '@/components/ImageUpload'

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
      // Primeiro, verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
        if (demoEmail === 'demo@doador.com' || demoEmail === 'volunteer@institutoimagine.org') {
        setUser({
            id: '00000000-0000-0000-0000-000000000001', // UUID válido para demo
          email: demoEmail,
            user_metadata: { 
              name: demoEmail === 'volunteer@institutoimagine.org' ? 'Voluntário Demo' : 'Doador Demo' 
            },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User)
          
          // Carregar perfil real do Supabase para demo
          try {
            const profileData = await getProfile('00000000-0000-0000-0000-000000000001')
            if (profileData) {
              setProfile(profileData)
              setFormData(profileData)
            } else {
              // Criar perfil padrão se não existir
              const defaultProfile = {
                id: '00000000-0000-0000-0000-000000000001',
                email: demoEmail,
                name: demoEmail === 'volunteer@institutoimagine.org' ? 'Voluntário Demo' : 'Doador Demo',
                phone: '',
                cpf: '',
                address: {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: ''
                },
                preferences: {
                  notifications: true,
                  newsletter: true,
                  sms: false,
                  privacy: 'public',
                  receiptEmail: true,
                  anonymousDefault: false,
                  recurringReminders: true,
                  projectUpdates: true,
                  defaultPaymentMethod: 'card',
                  monthlyLimit: 1000
                },
                stats: {
                  totalDonated: 0,
                  totalDonations: 0,
                  favoriteCategory: 'Educação',
                  memberSince: new Date().toISOString().split('T')[0],
                  lastDonation: null
                }
              }
              setProfile(defaultProfile)
              setFormData(defaultProfile)
            }
          } catch (error) {
            console.log('Erro ao carregar perfil do Supabase para demo:', error)
            // Fallback para perfil padrão
            const defaultProfile = {
              id: '00000000-0000-0000-0000-000000000001',
                email: demoEmail,
                name: demoEmail === 'volunteer@institutoimagine.org' ? 'Voluntário Demo' : 'Doador Demo',
              phone: '',
              cpf: '',
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: ''
              },
              preferences: {
                notifications: true,
                newsletter: true,
                sms: false,
                privacy: 'public',
                receiptEmail: true,
                anonymousDefault: false,
                recurringReminders: true,
                projectUpdates: true,
                defaultPaymentMethod: 'card',
                monthlyLimit: 1000
              },
              stats: {
                totalDonated: 0,
                totalDonations: 0,
                favoriteCategory: 'Educação',
                memberSince: new Date().toISOString().split('T')[0],
                lastDonation: null
              }
            }
            setProfile(defaultProfile)
            setFormData(defaultProfile)
          }
        } else {
          // Tentar obter usuário do Supabase
        const { data: { user } } = await supabase.auth.getUser()
          if (user) {
        setUser(user)
            
            // Carregar perfil do usuário
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (profileData) {
              setProfile(profileData)
              setFormData(profileData)
            } else {
              // Criar perfil padrão se não existir
              const defaultProfile = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || '',
                phone: '',
                cpf: '',
                address: {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: ''
                },
                preferences: {
                  notifications: true,
                  newsletter: true,
                  sms: false,
                  privacy: 'public',
                  receiptEmail: true,
                  anonymousDefault: false,
                  recurringReminders: true,
                  projectUpdates: true,
                  defaultPaymentMethod: 'card',
                  monthlyLimit: 1000
                },
                stats: {
                  totalDonated: 0,
                  totalDonations: 0,
                  favoriteCategory: 'Educação',
                  memberSince: new Date().toISOString().split('T')[0],
                  lastDonation: null
                }
              }
              setProfile(defaultProfile)
              setFormData(defaultProfile)
            }
          } else {
            // Se não conseguir obter usuário, redirecionar para login
            window.location.href = '/auth'
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev: any) => ({
        ...prev,
        [name]: checked
      }))
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
          ...formData
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
        {/* Page Header - Seguindo padrão Admin */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais e preferências</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'Nunca'}
                </p>
              </div>
            </div>
          </div>
        </div>

               {/* Profile Stats - Design Simplificado */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

                 <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
                     <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                       <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
                     <div className="ml-3">
                       <p className="text-sm text-gray-500">Categoria Favorita</p>
                       <p className="text-sm font-semibold text-gray-900">{profile?.stats?.favoriteCategory || 'N/A'}</p>
              </div>
            </div>
          </div>

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

        {/* Profile Form - Design Melhorado */}
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
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dados Básicos */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dados Básicos
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Informações pessoais essenciais</p>
                </div>
              
                <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                      value={formData?.cpf || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="000.000.000-00"
                />
                  </div>
              </div>
            </div>

            {/* Endereço */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Endereço
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Informações de localização</p>
                </div>
              
                <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua
                </label>
                <input
                  type="text"
                  name="address.street"
                      value={formData?.address?.street || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="Nome da rua, número"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="address.city"
                        value={formData?.address?.city || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="address.state"
                        value={formData?.address?.state || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        placeholder="SP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                      value={formData?.address?.zipCode || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
            </div>
          </div>

                 {/* Preferências de Doação */}
                 <div className="px-6 py-4 border-t border-gray-200">
                   <h3 className="text-sm font-medium text-gray-900 mb-4">Preferências de Doação</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-start space-x-3">
                       <input
                         type="checkbox"
                         name="preferences.receiptEmail"
                         checked={formData?.preferences?.receiptEmail || false}
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                       />
                       <div>
                         <span className="text-sm font-medium text-gray-900">Receber recibos por email</span>
                         <p className="text-xs text-gray-500">Receba comprovantes de suas doações por email</p>
                       </div>
                     </div>

                     <div className="flex items-start space-x-3">
                       <input
                         type="checkbox"
                         name="preferences.anonymousDefault"
                         checked={formData?.preferences?.anonymousDefault || false}
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                       />
                       <div>
                         <span className="text-sm font-medium text-gray-900">Doar anonimamente por padrão</span>
                         <p className="text-xs text-gray-500">Suas doações serão anônimas por padrão</p>
                       </div>
                     </div>

                     <div className="flex items-start space-x-3">
                       <input
                         type="checkbox"
                         name="preferences.recurringReminders"
                         checked={formData?.preferences?.recurringReminders || false}
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                       />
                       <div>
                         <span className="text-sm font-medium text-gray-900">Lembretes de doações recorrentes</span>
                         <p className="text-xs text-gray-500">Receba lembretes sobre suas doações recorrentes</p>
                       </div>
                     </div>

                     <div className="flex items-start space-x-3">
                       <input
                         type="checkbox"
                         name="preferences.projectUpdates"
                         checked={formData?.preferences?.projectUpdates || false}
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                       />
                       <div>
                         <span className="text-sm font-medium text-gray-900">Atualizações dos projetos apoiados</span>
                         <p className="text-xs text-gray-500">Receba notícias sobre os projetos que você apoia</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Preferências de Comunicação */}
                 <div className="px-6 py-4 border-t border-gray-200">
                   <h3 className="text-sm font-medium text-gray-900 mb-4">Preferências de Comunicação</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                     
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         name="preferences.sms"
                         checked={formData?.preferences?.sms || false}
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                       />
                       <span className="text-sm text-gray-700">Receber SMS</span>
                     </label>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Privacidade do Perfil
                       </label>
                       <select
                         name="preferences.privacy"
                         value={formData?.preferences?.privacy || 'public'}
                         onChange={(e) => setFormData((prev: any) => ({
                           ...prev,
                           preferences: { ...prev.preferences, privacy: e.target.value }
                         }))}
                         disabled={!isEditing}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                       >
                         <option value="public">Público</option>
                         <option value="private">Privado</option>
                         <option value="friends">Apenas Amigos</option>
                       </select>
                     </div>
                   </div>
                 </div>

                 {/* Configurações de Segurança */}
                 <div className="px-6 py-4 border-t border-gray-200">
                   <h3 className="text-sm font-medium text-gray-900 mb-4">Configurações de Segurança</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento Padrão
                </label>
                <select
                  name="preferences.defaultPaymentMethod"
                  value={formData?.preferences?.defaultPaymentMethod || 'card'}
                  onChange={(e) => setFormData((prev: any) => ({
                    ...prev,
                    preferences: { ...prev.preferences, defaultPaymentMethod: e.target.value }
                  }))}
                  disabled={!isEditing}
                  className="input-modern disabled:bg-gray-100"
                >
                  <option value="card">Cartão de Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Doação Mensal
                </label>
                <input
                  type="number"
                  name="preferences.monthlyLimit"
                  value={formData?.preferences?.monthlyLimit || 1000}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input-modern disabled:bg-gray-100"
                  placeholder="1000"
                />
              </div>
              </div>
            </div>
          </div>
        </div>

               {/* Quick Actions - Simplificado */}
               <div className="mt-6">
                 <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Link href="/doacoes" className="btn-secondary text-center">
                     Minhas Doações
                   </Link>
                   <Link href="/projetos" className="btn-secondary text-center">
                     Projetos
                   </Link>
                   <Link href="/comunidade" className="btn-secondary text-center">
                     Comunidade
                   </Link>
                 </div>
               </div>
      </main>
    </div>
  )
}