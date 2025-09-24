'use client'

import { useState } from 'react'
import Link from 'next/link'

// Componente para testar navegação do sidebar
export default function SidebarNavigationTest() {
  const [testResults, setTestResults] = useState<{
    admin: { [key: string]: boolean }
    donor: { [key: string]: boolean }
    volunteer: { [key: string]: boolean }
  }>({
    admin: {},
    donor: {},
    volunteer: {}
  })

  const testNavigation = async (variant: 'admin' | 'donor' | 'volunteer', href: string) => {
    try {
      const response = await fetch(href, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      return false
    }
  }

  const runTests = async () => {
    const results = {
      admin: {
        '/admin/dashboard': await testNavigation('admin', '/admin/dashboard'),
        '/admin/projetos': await testNavigation('admin', '/admin/projetos'),
        '/admin/doacoes': await testNavigation('admin', '/admin/doacoes'),
        '/admin/usuarios': await testNavigation('admin', '/admin/usuarios'),
        '/admin/relatorios': await testNavigation('admin', '/admin/relatorios'),
        '/admin/perfil': await testNavigation('admin', '/admin/perfil')
      },
      donor: {
        '/dashboard': await testNavigation('donor', '/dashboard'),
        '/projetos': await testNavigation('donor', '/projetos'),
        '/doacoes': await testNavigation('donor', '/doacoes'),
        '/perfil': await testNavigation('donor', '/perfil')
      },
      volunteer: {
        '/dashboard': await testNavigation('volunteer', '/dashboard'),
        '/projetos': await testNavigation('volunteer', '/projetos'),
        '/volunteer/contributions': await testNavigation('volunteer', '/volunteer/contributions'),
        '/volunteer/availability': await testNavigation('volunteer', '/volunteer/availability'),
        '/perfil': await testNavigation('volunteer', '/perfil')
      }
    }
    
    setTestResults(results)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Teste de Navegação do Sidebar</h2>
      
      <button 
        onClick={runTests}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Executar Testes
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">Admin</h3>
          <div className="space-y-2">
            {Object.entries(testResults.admin).map(([path, exists]) => (
              <div key={path} className="flex items-center justify-between">
                <span className="text-sm">{path}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {exists ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Doador */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Doador</h3>
          <div className="space-y-2">
            {Object.entries(testResults.donor).map(([path, exists]) => (
              <div key={path} className="flex items-center justify-between">
                <span className="text-sm">{path}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {exists ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Voluntário */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-green-600">Voluntário</h3>
          <div className="space-y-2">
            {Object.entries(testResults.volunteer).map(([path, exists]) => (
              <div key={path} className="flex items-center justify-between">
                <span className="text-sm">{path}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {exists ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

