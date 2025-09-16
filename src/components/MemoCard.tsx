'use client'

import { memo } from 'react'

interface MemoCardProps {
  title: string
  description: string
  onClick?: () => void
  className?: string
}

const MemoCard = memo(function MemoCard({ 
  title, 
  description, 
  onClick, 
  className = '' 
}: MemoCardProps) {
  return (
    <div 
      className={`card p-6 cursor-pointer hover:shadow-md transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
})

export default MemoCard

