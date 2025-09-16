'use client'

import { forwardRef } from 'react'

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, className = '', ...props }, ref) => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-400 active:scale-95 hover:shadow-sm',
      secondary: 'bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400 active:scale-95 hover:shadow-sm',
      accent: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 active:scale-95 hover:shadow-sm'
    }
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={loading || props.disabled}
        aria-disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Carregando...
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton

