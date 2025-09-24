'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import UnifiedSidebar from './UnifiedSidebar'

interface UnifiedLayoutProps {
  children: ReactNode
  variant: 'admin' | 'donor' | 'volunteer'
  user?: {
    name?: string
    email?: string
    role?: string
  }
  demoEmail?: string | null
}

export default function UnifiedLayout({ 
  children, 
  variant,
  user,
  demoEmail
}: UnifiedLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    // Carregar estado do sidebar do localStorage
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    }
  }

  // Aguardar mount para evitar hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Unificado */}
      <UnifiedSidebar
        variant={variant}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        user={user}
        demoEmail={demoEmail}
      />
      
      {/* Main Content - Margem dinâmica baseada no estado do sidebar */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="p-8">
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
