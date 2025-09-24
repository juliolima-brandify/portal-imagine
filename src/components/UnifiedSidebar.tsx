'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMemo, memo, useState } from 'react'
import { Modal } from '@/components/ConfirmDialog'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

interface UnifiedSidebarProps {
  variant: 'admin' | 'donor' | 'volunteer'
  isCollapsed: boolean
  onToggle: () => void
  user?: {
    name?: string
    email?: string
    role?: string
  }
  demoEmail?: string | null
}

const UnifiedSidebar = memo(function UnifiedSidebar({
  variant,
  isCollapsed,
  onToggle,
  user,
  demoEmail
}: UnifiedSidebarProps) {
  const pathname = usePathname()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Função para adicionar parâmetros demo aos links
  const addDemoParams = (href: string) => {
    if (demoEmail) {
      return `${href}?demo_email=${demoEmail}`
    }
    return href
  }

  // Definir itens de menu baseados no variant
  const getMenuItems = (): SidebarItem[] => {
    const baseItems = [
      {
        label: 'Dashboard',
        href: addDemoParams(variant === 'admin' ? '/admin/dashboard' : '/dashboard'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
          </svg>
        )
      },
      {
        label: 'Projetos',
        href: addDemoParams(variant === 'admin' ? '/admin/projetos' : '/projetos'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      }
    ]

    if (variant === 'admin') {
      return [
        ...baseItems,
        {
          label: 'Doações',
          href: addDemoParams('/admin/doacoes'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          )
        },
        {
          label: 'Usuários',
          href: addDemoParams('/admin/usuarios'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        },
        {
          label: 'Relatórios',
          href: addDemoParams('/admin/relatorios'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        }
      ]
    }

    if (variant === 'volunteer') {
      return [
        ...baseItems,
        {
          label: 'Contribuições',
          href: addDemoParams('/volunteer/contributions'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          label: 'Disponibilidade',
          href: addDemoParams('/volunteer/availability'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    }

    // Doador (default)
    return [
      ...baseItems,
      {
        label: 'Minhas Doações',
        href: addDemoParams('/doacoes'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      }
    ]
  }

  // Memoizar as classes dos links para evitar re-renders desnecessários
  const linkClasses = useMemo(() => {
    const baseClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200"
    const activeClasses = "bg-gray-100 text-gray-900"
    const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    
    return getMenuItems().reduce((acc, item) => {
      const isActive = pathname === item.href || 
        (item.href !== '/dashboard' && item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
      
      acc[item.label.toLowerCase().replace(/\s+/g, '')] = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
      return acc
    }, {} as Record<string, string>)
  }, [pathname, variant])

  const handleLogout = () => {
    window.location.href = '/auth'
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Sidebar Fixo - Seguindo padrão Admin */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header com Logo e Botão de Colapsar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Instituto Imagine" 
                className="h-8 w-auto"
              />
            </div>
          )}
          
          {/* Botão de Colapsar */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <svg 
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Menu de Navegação */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={`${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Perfil e Logout na parte inferior */}
        <div className="border-t border-gray-100 p-4">
          {/* Perfil do Usuário */}
          <Link
            href={addDemoParams('/perfil')}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 mb-3"
            title={isCollapsed ? 'Meu Perfil' : ''}
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {!isCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email || ''}
                </p>
              </div>
            )}
          </Link>
          
          {/* Botão de Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200 text-gray-600"
            title={isCollapsed ? 'Sair' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Confirmar Saída"
        >
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tem certeza que deseja sair?</h3>
                <p className="text-gray-600">Você será redirecionado para a página de login.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
})

export default UnifiedSidebar
