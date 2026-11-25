'use client'

import { useEffect } from 'react'

export default function AuthRedirectPage() {
  useEffect(() => {
    const search = window.location.search || ''
    window.location.replace(`/entrar${search}`)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-600 text-sm">Redirecionando para o login...</div>
    </div>
  )
}
