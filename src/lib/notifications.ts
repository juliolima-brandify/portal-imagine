import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// =============================================
// TIPOS
// =============================================

export interface Notification {
  id: string
  user_id: string
  type: 'donation' | 'project_update' | 'system' | 'achievement'
  title: string
  message: string
  read: boolean
  data?: any
  created_at: string
}

export interface NotificationSubscription {
  unsubscribe: () => void
}

// =============================================
// FUNÇÕES DE NOTIFICAÇÕES
// =============================================

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return false
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error)
    return false
  }
}

export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: any
): Promise<Notification | null> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar notificação:', error)
      return null
    }

    return notification
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return null
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Erro ao deletar notificação:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao deletar notificação:', error)
    return false
  }
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): NotificationSubscription {
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const notification = payload.new as Notification
        callback(notification)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    }
  }
}

// =============================================
// NOTIFICAÇÕES AUTOMÁTICAS
// =============================================

export async function notifyDonationSuccess(
  userId: string,
  donationData: {
    amount: number
    projectTitle: string
    projectId: string
  }
): Promise<void> {
  await createNotification(
    userId,
    'donation',
    'Doação Realizada com Sucesso! 🎉',
    `Sua doação de R$ ${donationData.amount.toLocaleString('pt-BR')} para o projeto "${donationData.projectTitle}" foi processada com sucesso.`,
    {
      projectId: donationData.projectId,
      amount: donationData.amount
    }
  )
}

export async function notifyProjectUpdate(
  userId: string,
  projectData: {
    projectTitle: string
    projectId: string
    updateType: 'milestone' | 'completion' | 'new_info'
  }
): Promise<void> {
  let title = ''
  let message = ''

  switch (projectData.updateType) {
    case 'milestone':
      title = 'Marco Alcançado! 🎯'
      message = `O projeto "${projectData.projectTitle}" alcançou um novo marco importante!`
      break
    case 'completion':
      title = 'Projeto Concluído! ✅'
      message = `O projeto "${projectData.projectTitle}" foi concluído com sucesso!`
      break
    case 'new_info':
      title = 'Nova Atualização! 📢'
      message = `O projeto "${projectData.projectTitle}" tem uma nova atualização.`
      break
  }

  await createNotification(
    userId,
    'project_update',
    title,
    message,
    {
      projectId: projectData.projectId,
      updateType: projectData.updateType
    }
  )
}

export async function notifyAchievement(
  userId: string,
  achievementData: {
    title: string
    description: string
    type: 'first_donation' | 'milestone_donor' | 'recurring_donor'
  }
): Promise<void> {
  await createNotification(
    userId,
    'achievement',
    `Conquista Desbloqueada: ${achievementData.title} 🏆`,
    achievementData.description,
    {
      achievementType: achievementData.type
    }
  )
}

// =============================================
// UTILITÁRIOS
// =============================================

export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'donation':
      return '💰'
    case 'project_update':
      return '📢'
    case 'system':
      return '⚙️'
    case 'achievement':
      return '🏆'
    default:
      return '📬'
  }
}

export function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'donation':
      return 'text-green-600'
    case 'project_update':
      return 'text-blue-600'
    case 'system':
      return 'text-gray-600'
    case 'achievement':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Agora mesmo'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h atrás`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} dias atrás`
  }
}

