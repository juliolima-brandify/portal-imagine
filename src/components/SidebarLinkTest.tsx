'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Componente para testar como os links estão sendo renderizados
export default function SidebarLinkTest() {
  const pathname = usePathname()
  
  const testLinks = [
    { href: '/dashboard', label: 'Início' },
    { href: '/projetos', label: 'Projetos' },
    { href: '/doacoes', label: 'Doações' },
    { href: '/perfil', label: 'Perfil' }
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Teste de Links do Sidebar</h2>
      <p className="text-sm text-gray-600 mb-4">
        Pathname atual: <code className="bg-gray-100 px-2 py-1 rounded">{pathname}</code>
      </p>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Links de Teste:</h3>
        
        {testLinks.map((link) => {
          const isActive = pathname === link.href
          
          return (
            <div key={link.href} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{link.label}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <strong>href:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{link.href}</code>
              </div>
              
              <Link
                href={link.href}
                className={`inline-block px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
              
              <div className="mt-2 text-xs text-gray-500">
                <strong>URL completa:</strong> {typeof window !== 'undefined' ? window.location.origin + link.href : 'N/A'}
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Informações do Navegador:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
          <div><strong>Pathname:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
          <div><strong>Host:</strong> {typeof window !== 'undefined' ? window.location.host : 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}

