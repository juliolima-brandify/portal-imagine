import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ 
  href = '/', 
  size = 'md', 
  showText = false,
  className = ''
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto', 
    lg: 'h-12 w-auto'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const LogoContent = () => (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src="/images/logo.png" 
        alt="Instituto Imagine" 
        className={sizeClasses[size]}
        onError={(e) => {
          // Fallback se o logo não estiver disponível
          e.currentTarget.style.display = 'none'
          const nextElement = e.currentTarget.nextElementSibling as HTMLElement
          if (nextElement) {
            nextElement.style.display = 'block'
          }
        }}
      />
      {showText && (
        <span className={`font-semibold text-gray-900 ${textSizeClasses[size]} hidden`}>
          Instituto Imagine
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
