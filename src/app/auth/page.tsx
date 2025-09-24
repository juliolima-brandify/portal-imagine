'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { loginSchema, createUserSchema } from '@/lib/validations'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setMessage('❌ Timeout: A conexão está demorando muito. Tente novamente ou use as contas demo.')
      }
    }, 10000) // 10 segundos

    try {
      // Verificar se Supabase está configurado
      if (!isSupabaseConfigured()) {
        setMessage('⚠️ Supabase não configurado. Use as contas demo para testar o sistema!')
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      if (isLogin) {
        // Verificar se é uma conta demo PRIMEIRO
        if (email === 'demo@doador.com' && password === 'demo123456') {
          setMessage('Login demo realizado com sucesso! (Modo de demonstração)')
          setLoading(false)
          clearTimeout(timeoutId)
          setTimeout(() => {
            window.location.href = `/dashboard?demo_email=${encodeURIComponent(email)}`
          }, 1500)
          return
        }
        
        if (email === 'admin@institutoimagine.org' && password === 'admin123456') {
          setMessage('Login admin realizado com sucesso! (Modo de demonstração)')
          setLoading(false)
          clearTimeout(timeoutId)
          setTimeout(() => {
            window.location.href = `/admin/dashboard?demo_email=${encodeURIComponent(email)}`
          }, 1500)
          return
        }


        if (email === 'volunteer@institutoimagine.org' && password === 'volunteer123456') {
          setMessage('Login voluntário realizado com sucesso! (Modo de demonstração)')
          setLoading(false)
          clearTimeout(timeoutId)
          setTimeout(() => {
            window.location.href = `/dashboard?demo_email=${encodeURIComponent(email)}&role=volunteer`
          }, 1500)
          return
        }

        // Validar dados de login
        const validatedData = loginSchema.parse({ email, password })
        
        // Para outras contas, tentar com Supabase com timeout
        const authPromise = supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        })

        const { error } = await Promise.race([
          authPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na autenticação')), 8000)
          )
        ]) as any

        if (error) throw error
        setMessage('Login realizado com sucesso!')
        setLoading(false)
        clearTimeout(timeoutId)
        // Redirecionar para dashboard após login
        window.location.href = '/dashboard'
      } else {
        // Validar dados de registro
        const validatedData = createUserSchema.parse({ email, password, name })
        
        const signupPromise = supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              name: validatedData.name,
              role: 'donor'
            },
          },
        })

        const { error } = await Promise.race([
          signupPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout no registro')), 8000)
          )
        ]) as any

        if (error) throw error
        setMessage('Conta criada com sucesso! Verifique seu email.')
        setLoading(false)
        clearTimeout(timeoutId)
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error)
      clearTimeout(timeoutId)
      
      if (error.message?.includes('Timeout')) {
        setMessage('❌ Timeout: A conexão está demorando muito. Verifique sua internet ou tente as contas demo.')
      } else if (error.message?.includes('supabaseUrl is required') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('placeholder') ||
          error.message?.includes('NetworkError')) {
        setMessage('⚠️ Problema de conexão. Use as contas demo para testar o sistema!')
      } else if (error.message?.includes('Invalid login credentials')) {
        setMessage('❌ Email ou senha incorretos. Verifique suas credenciais.')
      } else if (error.message?.includes('User already registered')) {
        setMessage('❌ Este email já está cadastrado. Tente fazer login.')
      } else if (error.message?.includes('Password should be at least')) {
        setMessage('❌ A senha deve ter pelo menos 6 caracteres.')
      } else if (error.message?.includes('Invalid email')) {
        setMessage('❌ Email inválido. Verifique o formato do email.')
      } else {
        setMessage(`❌ Erro: ${error.message || 'Falha na conexão. Verifique sua internet e tente novamente.'}`)
      }
    } finally {
      setLoading(false)
      clearTimeout(timeoutId)
    }
  }

  const handleDemoLogin = (role: 'donor' | 'admin' | 'volunteer') => {
    console.log('Demo login clicked:', role) // Debug log
    let email = ''
    if (role === 'donor') {
      email = 'demo@doador.com'
      setEmail(email)
      setPassword('demo123456')
    } else if (role === 'admin') {
      email = 'admin@institutoimagine.org'
      setEmail(email)
      setPassword('admin123456')
    } else {
      email = 'volunteer@institutoimagine.org'
      setEmail(email)
      setPassword('volunteer123456')
    }
    setIsLogin(true)
    
    // Salvar dados de demo no localStorage
    localStorage.setItem('demo-user', JSON.stringify({ email, role }))
    console.log('Demo login set:', { role, email }) // Debug log
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Instituto Imagine" 
                className="h-10 w-auto"
              />
            </Link>
            <Link
              href="https://imagineinstituto.com"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Voltar ao site principal
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {isLogin ? 'Fazer Login' : 'Criar Conta'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Portal Instituto Imagine - Transformando vidas
            </p>
          </div>

          {/* Status da Configuração */}
          <div className={`card p-4 ${isSupabaseConfigured() ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className={`text-sm font-medium ${isSupabaseConfigured() ? 'text-green-700' : 'text-yellow-700'}`}>
                {isSupabaseConfigured() ? 'Sistema configurado' : 'Modo demonstração'}
              </p>
            </div>
            <p className={`text-xs mt-1 ${isSupabaseConfigured() ? 'text-green-600' : 'text-yellow-600'}`}>
              {isSupabaseConfigured() 
                ? 'Conexão com Supabase ativa - Criação de contas disponível' 
                : 'Supabase não configurado - Use as contas demo para testar'
              }
            </p>
          </div>

          {/* Demo Buttons */}
          <div className="card p-6">
            <p className="text-sm text-gray-600 mb-4 text-center font-medium">Teste com contas demo:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleDemoLogin('donor')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Demo Doador
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Demo Admin
              </button>
              <button
                onClick={() => handleDemoLogin('volunteer')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Demo Voluntário
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Clique nos botões acima para preencher automaticamente os dados de login
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    className="input-modern"
                    placeholder="Digite seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-modern"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-modern"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
                {message.includes('Timeout') && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMessage('')
                        setLoading(false)
                      }}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Fazer login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}