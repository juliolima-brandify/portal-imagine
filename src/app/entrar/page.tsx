'use client'

import { useState } from 'react'
import { ZodError } from 'zod'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { loginSchema, createUserSchema } from '@/lib/validations'
import { Modal } from '@/components/ConfirmDialog'

export default function EntrarPage() {
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const timeoutId = setTimeout(() => {
      setLoading(false)
      setMessage('❌ Timeout: A conexão está demorando muito. Tente novamente.')
    }, 10000)

    try {
      if (!isSupabaseConfigured()) {
        setMessage('⚠️ Supabase não configurado. Sistema em manutenção.')
        setLoading(false)
        clearTimeout(timeoutId)
        return
      }

      if (isLogin) {
        const validatedData = loginSchema.parse({ email, password })

        const authPromise = supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        })

        const { data, error } = (await Promise.race([
          authPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout na autenticação')), 8000)
          ),
        ])) as any

        if (error) throw error
        setMessage('Login realizado com sucesso!')
        clearTimeout(timeoutId)

        try {
          const userId = data?.user?.id
          const { data: profile } = userId
            ? await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()
            : { data: null }

          if (profile?.role === 'admin') {
            window.location.href = '/admin/dashboard'
          } else if (profile?.role === 'volunteer') {
            window.location.href = '/volunteer/contributions'
          } else {
            window.location.href = '/dashboard'
          }
        } catch {
          window.location.href = '/dashboard'
        }
      } else {
        const validatedData = createUserSchema.parse({ email, password, name })

        const signupPromise = supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              name: validatedData.name,
              role: 'donor',
            },
          },
        })

        const { error } = (await Promise.race([
          signupPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout no registro')), 8000)
          ),
        ])) as any

        if (error) throw error
        setMessage('Conta criada com sucesso! Verifique seu email.')
        setLoading(false)
        clearTimeout(timeoutId)
      }
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error instanceof ZodError) {
        const firstIssue = error.issues[0]?.message || 'Verifique os dados informados.'
        setMessage(`❌ ${firstIssue}`)
      } else if (error?.message?.includes('Timeout')) {
        setMessage('❌ Timeout: A conexão está demorando muito. Verifique sua internet.')
      } else if (
        error?.message?.includes('supabaseUrl is required') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('placeholder') ||
        error?.message?.includes('NetworkError')
      ) {
        setMessage('⚠️ Problema de conexão. Tente novamente mais tarde.')
      } else if (error?.message?.includes('Invalid login credentials')) {
        setMessage('❌ Email ou senha incorretos. Verifique suas credenciais.')
      } else if (error?.message?.includes('User already registered')) {
        setMessage('❌ Este email já está cadastrado. Tente fazer login.')
      } else if (error?.message?.includes('Password should be at least')) {
        setMessage('❌ A senha deve ter pelo menos 8 caracteres.')
      } else if (error?.message?.includes('Invalid email')) {
        setMessage('❌ Email inválido. Verifique o formato do email.')
      } else {
        setMessage('❌ Não foi possível concluir a autenticação. Tente novamente.')
      }
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage('')

    try {
      if (!isSupabaseConfigured()) {
        setResetMessage('⚠️ Supabase não configurado. Sistema em manutenção.')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/entrar?reset=true`,
      })

      if (error) throw error
      setResetMessage('✅ Email de recuperação enviado! Verifique sua caixa de entrada.')
      setResetEmail('')
    } catch (error: any) {
      if (error?.message?.includes('Invalid email')) {
        setResetMessage('❌ Email inválido. Verifique o formato do email.')
      } else {
        setResetMessage('❌ Falha ao enviar email de recuperação. Tente novamente.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <a href="https://imagineinstituto.com/" className="flex items-center">
              <img src="/images/logo.png" alt="Instituto Imagine" className="h-10 w-auto" />
            </a>
            <a href="https://imagineinstituto.com/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Voltar ao site principal
            </a>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {isLogin ? 'Fazer Login' : 'Criar Conta'}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Portal Instituto Imagine - Transformando vidas
            </p>
          </div>

          {!isSupabaseConfigured() && (
            <div className="card p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <p className="text-sm font-medium text-yellow-700">Sistema em manutenção</p>
              </div>
              <p className="text-xs mt-1 text-yellow-600">
                Sistema temporariamente indisponível - Tente novamente mais tarde
              </p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                  <input id="name" name="name" type="text" required={!isLogin} className="input-modern" placeholder="Digite seu nome completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required className="input-modern" placeholder="Digite seu email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input id="password" name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required className="input-modern" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Lembrar-me</label>
                </div>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {message && (
              <div className={`text-sm p-3 rounded-lg ${message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setMessage('')
                }}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Fazer login'}
              </button>
            </div>
          </form>

          <Modal
            isOpen={showForgotPassword}
            onClose={() => {
              if (!resetLoading) {
                setShowForgotPassword(false)
                setResetEmail('')
                setResetMessage('')
              }
            }}
            title="Recuperar Senha"
            size="sm"
          >
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input id="reset-email" type="email" required className="input-modern" placeholder="Digite seu email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              </div>
              {resetMessage && (
                <div className={`text-sm p-3 rounded-lg ${resetMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {resetMessage}
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmail('')
                    setResetMessage('')
                  }}
                  className="btn-secondary flex-1"
                  disabled={resetLoading}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={resetLoading} className="btn-primary flex-1">
                  {resetLoading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  )
}
