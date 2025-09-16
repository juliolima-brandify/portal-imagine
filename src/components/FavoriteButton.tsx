'use client'

import { useState, useEffect } from 'react'
import { 
  addFavorite, 
  removeFavorite, 
  isFavorite,
  type Favorite 
} from '@/lib/favorites'

interface FavoriteButtonProps {
  userId: string
  projectId: string
  projectTitle: string
  onToggle?: (isFavorite: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function FavoriteButton({ 
  userId, 
  projectId, 
  projectTitle,
  onToggle,
  size = 'md',
  showText = false
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkFavorite = async () => {
      if (!userId || !projectId) return
      
      try {
        setChecking(true)
        const favorited = await isFavorite(userId, projectId)
        setIsFavorited(favorited)
      } catch (error) {
        console.error('Erro ao verificar favorito:', error)
      } finally {
        setChecking(false)
      }
    }

    checkFavorite()
  }, [userId, projectId])

  const handleToggle = async () => {
    if (!userId || !projectId || loading) return

    try {
      setLoading(true)
      
      if (isFavorited) {
        const success = await removeFavorite(userId, projectId)
        if (success) {
          setIsFavorited(false)
          onToggle?.(false)
        }
      } else {
        const favorite = await addFavorite(userId, projectId)
        if (favorite) {
          setIsFavorited(true)
          onToggle?.(true)
        }
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  if (checking) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} text-gray-400 cursor-not-allowed`}
      >
        <svg className={`${iconSizes[size]} animate-pulse`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]} 
        ${isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        }
        transition-colors duration-200
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isFavorited ? `Remover "${projectTitle}" dos favoritos` : `Adicionar "${projectTitle}" aos favoritos`}
    >
      {loading ? (
        <svg className={`${iconSizes[size]} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) : (
        <svg 
          className={iconSizes[size]} 
          fill={isFavorited ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
      
      {showText && (
        <span className="ml-2 text-sm">
          {isFavorited ? 'Favorito' : 'Favoritar'}
        </span>
      )}
    </button>
  )
}

