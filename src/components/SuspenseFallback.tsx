'use client'

import LoadingState from './LoadingState'

interface SuspenseFallbackProps {
  message?: string
}

export default function SuspenseFallback({ message = 'Carregando...' }: SuspenseFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingState message={message} size="lg" />
    </div>
  )
}

