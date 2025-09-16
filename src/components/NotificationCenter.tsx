'use client'

import { useState, useEffect } from 'react'
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  type Notification,
  type NotificationSubscription
} from '@/lib/notifications'

interface NotificationCenterProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ userId, isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null)

  useEffect(() => {
    if (!userId) return

    // Carregar notificações iniciais
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications(userId)
        setNotifications(data)
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
      } finally {
        setLoading(false)
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

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead(userId)
    if (success) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    }
  }

  const handleDelete = async (notificationId: string) => {
    const success = await deleteNotification(notificationId)
    if (success) {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      )
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Notificações
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">📬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600">
                  Você não tem notificações no momento.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Marcar como lida
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

