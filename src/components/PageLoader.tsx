'use client'

interface PageLoaderProps {
  message?: string
}

export default function PageLoader({ message = 'Carregando...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
        <p className="text-gray-600 text-sm animate-pulse">{message}</p>
      </div>
    </div>
  )
}

