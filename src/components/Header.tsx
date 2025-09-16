import Link from 'next/link'
import Breadcrumbs from './Breadcrumbs'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  showAuth?: boolean
  showBackToMain?: boolean
  user?: {
    id?: string
    name?: string
    email?: string
    role?: 'donor' | 'admin'
  }
  onSignOut?: () => void
  isDemoMode?: boolean
  showBreadcrumbs?: boolean
}

export default function Header({ 
  showAuth = true, 
  showBackToMain = true, 
  user,
  onSignOut,
  isDemoMode = false,
  showBreadcrumbs = true
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Instituto Imagine" 
                className="h-10 w-auto"
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 font-medium">
                  Olá, {user.name || user.email}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role === 'admin' ? 'Administrador' : 'Doador'}
                </span>
                {isDemoMode && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Demo
                  </span>
                )}
                
                {/* Notificações */}
                {user.id && (
                  <div className="animate-scale-in">
                    <NotificationBell userId={user.id} />
                  </div>
                )}
                
                {/* Meu Perfil */}
                {user.id && (
                  <Link
                    href={isDemoMode ? "/perfil?demo_email=" + encodeURIComponent(user.email || '') : "/perfil"}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-all duration-300 ease-out hover:bg-gray-100 rounded-lg animate-scale-in"
                    title="Meu Perfil"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                  </Link>
                )}
                
                {/* Botão de Sair */}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="btn-secondary animate-scale-in"
                  >
                    Sair
                  </button>
                )}
              </>
            ) : (
              <>
                {showBackToMain && (
                  <Link
                    href="https://imagineinstituto.com"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Voltar ao site principal
                  </Link>
                )}
                {showAuth && (
                  <Link
                    href="/auth"
                    className="btn-primary"
                  >
                    Entrar
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs />
          </div>
        </div>
      )}
    </header>
  )
}
