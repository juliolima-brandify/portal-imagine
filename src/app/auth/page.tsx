'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, isSupabaseConfigured, isLocalEnvironment } from '@/lib/supabase'
import { loginSchema, createUserSchema } from '@/lib/validations'

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setMessage('❌ Timeout: A conexão está demorando muito. Tente novamente.')
      }
    }, 10000) // 10 segundos

    try {
      // Verificar se Supabase está configurado
      if (!isSupabaseConfigured()) {
        setMessage('⚠️ Supabase não configurado. Sistema em manutenção.')
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      if (isLogin) {

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
        
        // Redirecionar baseado no role do usuário
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', validatedData.email)
            .single()
          
          if (profile?.role === 'admin') {
            window.location.href = '/admin/dashboard'
          } else if (profile?.role === 'volunteer') {
            window.location.href = '/volunteer/contributions'
          } else {
            window.location.href = '/dashboard'
          }
        } catch (profileError) {
          // Se não conseguir determinar o role, vai para dashboard padrão
          window.location.href = '/dashboard'
        }
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
        setMessage('❌ Timeout: A conexão está demorando muito. Verifique sua internet.')
      } else if (error.message?.includes('supabaseUrl is required') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('placeholder') ||
          error.message?.includes('NetworkError')) {
        setMessage('⚠️ Problema de conexão. Tente novamente mais tarde.')
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage('')

    try {
      if (!isSupabaseConfigured()) {
        setResetMessage('⚠️ Supabase não configurado. Sistema em manutenção.')
        setResetLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      })

      if (error) throw error
      setResetMessage('✅ Email de recuperação enviado! Verifique sua caixa de entrada.')
      setResetEmail('')
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error)
      if (error.message?.includes('Invalid email')) {
        setResetMessage('❌ Email inválido. Verifique o formato do email.')
      } else {
        setResetMessage(`❌ Erro: ${error.message || 'Falha ao enviar email de recuperação.'}`)
      }
    } finally {
      setResetLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'donor' | 'volunteer') => {
    setLoading(true)
    setMessage('')
    
    try {
      // Verificar se Supabase está configurado
      if (!isSupabaseConfigured()) {
        setMessage('⚠️ Supabase não configurado. Sistema em manutenção.')
        setLoading(false)
        return
      }

      const demoCredentials = {
        admin: { email: 'admin@demo.com', password: 'demo123' },
        donor: { email: 'doador@demo.com', password: 'demo123' },
        volunteer: { email: 'voluntario@demo.com', password: 'demo123' }
      }
      
      const { email, password } = demoCredentials[role]
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      setMessage('Login demo realizado com sucesso!')
      
      // Redirecionar baseado no role
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else if (role === 'volunteer') {
          window.location.href = '/volunteer/contributions'
        } else {
          window.location.href = '/dashboard'
        }
      }, 1000)
    } catch (error: any) {
      console.error('Erro no login demo:', error)
      if (error.message?.includes('Invalid login credentials')) {
        setMessage('❌ Credenciais demo inválidas. Verifique se as contas demo existem no Supabase.')
      } else {
        setMessage(`❌ Erro no login demo: ${error.message || 'Tente novamente.'}`)
      }
    } finally {
      setLoading(false)
    }
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

          {/* Status da Configuração - exibido apenas quando indisponível */}
          {!isSupabaseConfigured() && (
            <div className="card p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <p className="text-sm font-medium text-yellow-700">
                  Sistema em manutenção
                </p>
              </div>
              <p className="text-xs mt-1 text-yellow-600">
                Sistema temporariamente indisponível - Tente novamente mais tarde
              </p>
            </div>
          )}

          {/* Botões Demo - Apenas no ambiente local */}
          {mounted && isLocalEnvironment() && isSupabaseConfigured() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-700 mb-3">🚀 Modo Demo (Local)</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('donor')}
                  disabled={loading}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Doador Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('volunteer')}
                  disabled={loading}
                  className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Voluntário Demo
                </button>
              </div>
            </div>
          )}

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

            {/* Opções de Login - Apenas no modo login */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Lembrar-me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

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

          {/* Modal Esqueceu a Senha */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recuperar Senha</h3>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      className="input-modern"
                      placeholder="Digite seu email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  
                  {resetMessage && (
                    <div className={`text-sm p-3 rounded-lg ${resetMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {resetMessage}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setResetEmail('')
                        setResetMessage('')
                      }}
                      className="btn-outline flex-1"
                      disabled={resetLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="btn-primary flex-1"
                    >
                      {resetLoading ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}