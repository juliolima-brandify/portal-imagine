'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Simular transição de página
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 150) // Transição rápida e suave

    return () => clearTimeout(timer)
  }, [pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
}

