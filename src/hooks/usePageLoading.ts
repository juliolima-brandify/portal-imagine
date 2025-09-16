'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname])

  return isLoading
}

