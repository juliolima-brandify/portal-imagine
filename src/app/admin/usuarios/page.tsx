'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/Toast'

// Página simplificada - autenticação gerenciada pelo layout
export default function AdminUsuariosPage() {
  // Loading removido
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'volunteer' | 'admin'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: 'donor'
  })
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor'
  })
  
  // Hook useToast deve ser declarado após todos os estados
  const { toasts, removeToast, success, error, warning, info } = useToast()

  // Função otimizada para carregar usuários do Supabase via API
  const loadUsersFromSupabase = useCallback(async () => {
    try {
      console.log('🔄 [USUÁRIOS] Carregando usuários do Supabase via API...')
      
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [USUÁRIOS] Erro ao carregar usuários:', result.error)
        setUsers([])
        return
      }

      if (result.data && result.data.length > 0) {
        console.log('✅ [USUÁRIOS] Usuários carregados via API:', result.data.length)
        setUsers(result.data)
      } else {
        console.log('⚠️ [USUÁRIOS] Nenhum usuário encontrado')
        setUsers([])
      }
    } catch (loadError) {
      console.error('❌ [USUÁRIOS] Erro inesperado ao carregar usuários:', loadError)
      setUsers([])
    }
  }, [])

  useEffect(() => {
    // Carregamento inicial dos usuários
    loadUsersFromSupabase()
  }, [loadUsersFromSupabase])

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

  // Função para lidar com o clique do botão criar usuário
  const handleCreateUserClick = async () => {
    console.log('🔍 [DEBUG] createFormData atual:', createFormData)
    
    const userData = {
      name: createFormData.name,
      email: createFormData.email,
      password: createFormData.password,
      role: createFormData.role
    }
    
    console.log('🔍 [DEBUG] userData preparado:', userData)
    await handleCreateUser(userData)
  }

  // Função para criar usuário
  const handleCreateUser = async (userData: any) => {
    try {
      console.log('🔄 [USUÁRIOS] Criando usuário via API:', userData?.email)
      
      // Validar se userData é válido
      if (!userData || typeof userData !== 'object') {
        console.error('❌ [USUÁRIOS] userData inválido:', userData)
        error('Erro de Dados', 'Dados do usuário inválidos.')
        return
      }
      
      // Criar objeto limpo para evitar referências circulares
      const cleanUserData = {
        name: userData.name || '',
        email: userData.email || '',
        password: userData.password || '',
        role: userData.role || 'donor'
      }
      
      console.log('🔍 [DEBUG] cleanUserData:', cleanUserData)
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanUserData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [USUÁRIOS] Erro ao criar usuário:', result.error)
        error('Erro ao Criar Usuário', result.error)
        return
      }

      console.log('✅ [USUÁRIOS] Usuário criado com sucesso')
      success('Usuário Criado', 'O usuário foi criado com sucesso!')
      
      // Recarregar lista de usuários
      await loadUsersFromSupabase()
      setShowCreateModal(false)
      
      // Limpar formulário
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'donor'
      })
      
    } catch (createError) {
      console.error('❌ [USUÁRIOS] Erro inesperado ao criar usuário:', createError)
      error('Erro Inesperado', 'Ocorreu um erro ao criar o usuário.')
    }
  }

  // Função para editar usuário
  const handleEditUser = async (userData: any) => {
    try {
      console.log('🔄 [USUÁRIOS] Editando usuário via API:', userData.id)
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [USUÁRIOS] Erro ao atualizar usuário:', result.error)
        error('Erro ao Atualizar', result.error)
        return
      }

      console.log('✅ [USUÁRIOS] Usuário atualizado com sucesso')
      success('Usuário Atualizado', 'As alterações foram salvas com sucesso!')
      
      // Recarregar lista de usuários
      await loadUsersFromSupabase()
      setShowEditModal(false)
      setSelectedUser(null)
      
    } catch (editError) {
      console.error('❌ [USUÁRIOS] Erro inesperado ao editar usuário:', editError)
      error('Erro Inesperado', 'Ocorreu um erro ao editar o usuário.')
    }
  }

  // Função para excluir usuário com confirmação
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação não pode ser desfeita e removerá permanentemente:\n• O perfil do usuário\n• O acesso à conta\n• Todos os dados associados`
    )
    
    if (!confirmed) {
      info('Exclusão Cancelada', 'A exclusão do usuário foi cancelada.')
      return
    }

    try {
      console.log('🔄 [USUÁRIOS] Excluindo usuário via API:', userId)
      
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ [USUÁRIOS] Erro ao excluir usuário:', result.error)
        error('Erro ao Excluir', result.error)
        return
      }

      console.log('✅ [USUÁRIOS] Usuário excluído com sucesso')
      success('Usuário Excluído', `O usuário "${userName}" foi removido com sucesso!`)
      
      // Recarregar lista de usuários
      await loadUsersFromSupabase()
      
    } catch (deleteError) {
      console.error('❌ [USUÁRIOS] Erro inesperado ao excluir usuário:', deleteError)
      error('Erro Inesperado', 'Ocorreu um erro ao excluir o usuário.')
    }
  }

  // Função para ativar/desativar usuário (desabilitada - coluna status não existe)
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    info('Funcionalidade Indisponível', 'Ativar/desativar usuário não está disponível no momento.')
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
      case 'volunteer':
        return 'bg-blue-100 text-blue-700'
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
      case 'volunteer':
        return 'Voluntário'
      case 'donor':
        return 'Doador'
      default:
        return 'Desconhecido'
    }
  }

  // Loading removido - página carrega diretamente

  return (
    <div className="max-w-7xl mx-auto">
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
            onClick={() => setShowCreateModal(true)}
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
              <option value="all">Todas as Funções</option>
              <option value="admin">Administradores</option>
              <option value="volunteer">Voluntários</option>
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
                          onClick={() => {
                            setSelectedUser(user)
                            setEditFormData({
                              name: user.name,
                              role: user.role
                            })
                            setShowEditModal(true)
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleToggleUserStatus(user.id, user.status)}
                          className={`transition-colors ${
                            user.status === 'active' 
                              ? 'text-yellow-600 hover:text-yellow-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {user.status === 'active' ? 'Desativar' : 'Ativar'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)}
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar Usuário"
          size="md"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleEditUser({
                    id: selectedUser.id,
                    name: editFormData.name,
                    role: editFormData.role
                  })
                }}
                className="btn-primary flex-1"
              >
                Salvar
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={selectedUser.email}
                className="input-modern"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select 
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="input-modern"
              >
                <option value="donor">Doador</option>
                <option value="volunteer">Voluntário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setCreateFormData({ name: '', email: '', password: '', role: 'donor' })
          }}
          title="Novo Usuário"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  console.log('🔍 [DEBUG] Estado atual do createFormData:', createFormData)
                  console.log('🔍 [DEBUG] Campos obrigatórios preenchidos:', {
                    name: !!createFormData.name,
                    email: !!createFormData.email,
                    password: !!createFormData.password
                  })
                }}
                className="btn-secondary px-3 py-2 text-sm"
                type="button"
              >
                Debug
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateFormData({ name: '', email: '', password: '', role: 'donor' })
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUserClick}
                className="btn-primary px-4 py-2 text-sm"
                disabled={!createFormData.name || !createFormData.email || !createFormData.password}
              >
                Criar Usuário
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                placeholder="Nome completo"
                className="input-modern"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="input-modern"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="input-modern"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select 
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                className="input-modern"
              >
                <option value="donor">Doador</option>
                <option value="volunteer">Voluntário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}