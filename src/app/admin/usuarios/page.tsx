'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'

// Mock data para demonstração
const mockUsers = [
  {
    id: '1',
    email: 'joao@exemplo.com',
    name: 'João Silva',
    role: 'donor',
    status: 'active',
    totalDonations: 1250.00,
    donationsCount: 8,
    lastLogin: '2024-01-15',
    createdAt: '2023-06-15'
  },
  {
    id: '2',
    email: 'maria@exemplo.com',
    name: 'Maria Santos',
    role: 'donor',
    status: 'active',
    totalDonations: 850.50,
    donationsCount: 5,
    lastLogin: '2024-01-14',
    createdAt: '2023-08-20'
  },
  {
    id: '3',
    email: 'admin@institutoimagine.org',
    name: 'Admin Sistema',
    role: 'admin',
    status: 'active',
    totalDonations: 0,
    donationsCount: 0,
    lastLogin: '2024-01-15',
    createdAt: '2023-01-01'
  },
  {
    id: '4',
    email: 'pedro@exemplo.com',
    name: 'Pedro Costa',
    role: 'donor',
    status: 'inactive',
    totalDonations: 300.00,
    donationsCount: 2,
    lastLogin: '2023-12-10',
    createdAt: '2023-10-05'
  }
]

export default function AdminUsuariosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState(mockUsers)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'admin'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      // Primeiro, verificar se é modo demo via URL
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
      if (demoEmail === 'admin@institutoimagine.org') {
        setUser({
          id: 'demo-admin',
          email: demoEmail,
          user_metadata: { name: 'Admin Demo' },
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
        
        // Verificar se é admin
        if (user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (profile?.role !== 'admin') {
              window.location.href = '/dashboard'
              return
            }
          } catch (profileError) {
            // Se não conseguir buscar o perfil, assumir que não é admin
            console.log('Erro ao buscar perfil:', profileError)
            window.location.href = '/dashboard'
            return
          }
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error)
        window.location.href = '/dashboard'
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesStatusFilter = filter === 'all' || user.status === filter
    const matchesRoleFilter = roleFilter === 'all' || user.role === roleFilter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatusFilter && matchesRoleFilter && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'inactive':
        return 'Inativo'
      default:
        return 'Desconhecido'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gray-600 text-white'
      case 'donor':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'donor':
        return 'Doador'
      default:
        return 'Desconhecido'
    }
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ))
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
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
          role: 'admin'
        } : undefined}
        onSignOut={() => {
          // Redirecionar para auth
          window.location.href = '/auth'
        }}
        showAuth={false}
        showBackToMain={false}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gerenciar Usuários
              </h1>
              <p className="text-gray-600">
                Gerencie usuários, permissões e acompanhe a atividade da plataforma.
              </p>
            </div>
            <button 
              onClick={handleCreateUser}
              className="btn-primary"
            >
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {users.length}
            </div>
            <div className="text-sm text-gray-600">
              Total de Usuários
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">
              Usuários Ativos
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">
              Administradores
            </div>
          </div>
          <div className="card p-6">
            <div className="text-2xl font-bold text-gray-500 mb-1">
              {users.filter(u => u.role === 'donor').length}
            </div>
            <div className="text-sm text-gray-600">
              Doadores
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                className="input-modern"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="all">Todos os Roles</option>
                <option value="admin">Administradores</option>
                <option value="donor">Doadores</option>
              </select>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'inactive' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum usuário encontrado
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm || filter !== 'all' || roleFilter !== 'all'
                          ? 'Tente ajustar os filtros de busca.' 
                          : 'Nenhum usuário cadastrado ainda.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(user.totalDonations)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.donationsCount} doações
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`transition-colors ${
                              user.status === 'active' 
                                ? 'text-yellow-600 hover:text-yellow-800' 
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Desativar' : 'Ativar'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Usuário
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.name}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select className="input-modern">
                  <option value="donor" selected={selectedUser.role === 'donor'}>
                    Doador
                  </option>
                  <option value="admin" selected={selectedUser.role === 'admin'}>
                    Administrador
                  </option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aqui você implementaria a lógica de salvar
                  setShowEditModal(false)
                }}
                className="btn-primary flex-1"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Novo Usuário
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Senha temporária"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select className="input-modern">
                  <option value="donor">Doador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aqui você implementaria a lógica de criar usuário
                  setShowCreateModal(false)
                }}
                className="btn-primary flex-1"
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
