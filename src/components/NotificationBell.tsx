'use client'

import { useState, useEffect } from 'react'
import { 
  getNotifications, 
  subscribeToNotifications,
  type Notification,
  type NotificationSubscription
} from '@/lib/notifications'
import NotificationCenter from './NotificationCenter'

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null)

  useEffect(() => {
    if (!userId) return

    // Carregar notificações iniciais
    const loadNotifications = async () => {
      try {
        const data = await getNotifications(userId)
        setNotifications(data)
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
      }
    }

    loadNotifications()

    // Subscrever a novas notificações
    const newSubscription = subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev])
    })

    setSubscription(newSubscription)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        userId={userId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
