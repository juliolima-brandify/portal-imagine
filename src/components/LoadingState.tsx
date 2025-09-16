'use client'

import LoadingSpinner from './LoadingSpinner'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingState({ 
  message = 'Carregando...', 
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size={size} className="mb-4" />
      <p className="text-gray-500 text-sm animate-pulse">{message}</p>
    </div>
  )
}

