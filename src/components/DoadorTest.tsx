'use client'

import { useState, useEffect } from 'react'

// Componente para testar especificamente a role doador
export default function DoadorTest() {
  const [testResults, setTestResults] = useState<{
    url: string
    demoEmail: string | null
    roleParam: string | null
    userRole: string
    isDemoMode: boolean
    user: any
  } | null>(null)

  useEffect(() => {
    const runTest = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      const roleParam = urlParams.get('role')
      
      let userRole = 'donor'
      let isDemoMode = false
      let user = null

      if (demoEmail === 'demo@doador.com' || demoEmail === 'admin@institutoimagine.org' || demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer') {
        isDemoMode = true
        user = {
          id: 'demo-user',
          email: demoEmail || 'demo@doador.com',
          user_metadata: { 
            name: demoEmail === 'admin@institutoimagine.org' ? 'Admin Demo' : 
                 demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer' ? 'Voluntário Demo' : 
                 'Doador Demo' 
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
        userRole = demoEmail === 'admin@institutoimagine.org' ? 'admin' : 
                  demoEmail === 'volunteer@institutoimagine.org' || roleParam === 'volunteer' ? 'volunteer' : 
                  'donor'
      }

      setTestResults({
        url: window.location.href,
        demoEmail,
        roleParam,
        userRole,
        isDemoMode,
        user
      })
    }

    runTest()
  }, [])

  if (!testResults) {
    return <div>Carregando teste...</div>
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Teste Específico - Role Doador</h2>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Informações da URL:</h3>
          <div className="text-sm space-y-1">
            <div><strong>URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.url}</code></div>
            <div><strong>demo_email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.demoEmail || 'null'}</code></div>
            <div><strong>role:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.roleParam || 'null'}</code></div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Resultado da Detecção:</h3>
          <div className="text-sm space-y-1">
            <div><strong>User Role:</strong> <span className={`px-2 py-1 rounded text-xs ${
              testResults.userRole === 'donor' ? 'bg-blue-100 text-blue-800' : 
              testResults.userRole === 'admin' ? 'bg-red-100 text-red-800' : 
              'bg-green-100 text-green-800'
            }`}>{testResults.userRole}</span></div>
            <div><strong>Demo Mode:</strong> <span className={`px-2 py-1 rounded text-xs ${
              testResults.isDemoMode ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>{testResults.isDemoMode ? 'Sim' : 'Não'}</span></div>
            <div><strong>User:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.user ? testResults.user.user_metadata?.name : 'null'}</code></div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Teste de URLs:</h3>
          <div className="space-y-2">
            <div>
              <strong>Doador:</strong> 
              <a 
                href="/dashboard?demo_email=demo@doador.com" 
                className="ml-2 text-blue-600 hover:underline"
                target="_blank"
              >
                /dashboard?demo_email=demo@doador.com
              </a>
            </div>
            <div>
              <strong>Admin:</strong> 
              <a 
                href="/dashboard?demo_email=admin@institutoimagine.org" 
                className="ml-2 text-red-600 hover:underline"
                target="_blank"
              >
                /dashboard?demo_email=admin@institutoimagine.org
              </a>
            </div>
            <div>
              <strong>Voluntário:</strong> 
              <a 
                href="/dashboard?demo_email=volunteer@institutoimagine.org" 
                className="ml-2 text-green-600 hover:underline"
                target="_blank"
              >
                /dashboard?demo_email=volunteer@institutoimagine.org
              </a>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Status dos Links:</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Dashboard</span>
              <span className={`px-2 py-1 rounded text-xs ${
                testResults.userRole === 'donor' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {testResults.userRole === 'donor' ? '✅ Deve funcionar' : '❌ Não é doador'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Projetos</span>
              <span className={`px-2 py-1 rounded text-xs ${
                testResults.userRole === 'donor' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {testResults.userRole === 'donor' ? '✅ Deve funcionar' : '❌ Não é doador'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Doações</span>
              <span className={`px-2 py-1 rounded text-xs ${
                testResults.userRole === 'donor' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {testResults.userRole === 'donor' ? '✅ Deve funcionar' : '❌ Não é doador'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

