import { supabase } from './supabase'
import { sumDonationsBrl } from './payments'

// =============================================
// TIPOS (Client-Safe — Zero SDKs de Servidor)
// =============================================

export interface Profile {
  id: string
  email: string
  name?: string
  phone?: string
  cpf?: string
  address?: any
  preferences?: any
  role: 'donor' | 'admin' | 'volunteer'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  description?: string
  long_description?: string
  category: string
  target_amount: number
  current_amount: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  location?: string
  image_url?: string
  impact?: any
  timeline?: string
  organization?: string
  has_funding_goal?: boolean
  checkout_tracking_url?: string
  framer_project_url?: string
  slug?: string | null
  show_on_site?: boolean
  site_order?: number
  site_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  user_id: string | null
  project_id: string | null
  campaign_slug?: string | null
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  stripe_payment_intent_id?: string | null
  asaas_checkout_id?: string | null
  asaas_payment_id?: string | null
  asaas_subscription_id?: string | null
  is_recurring: boolean
  recurring_frequency?: string | null
  message?: string | null
  anonymous: boolean
  receipt_sent_at?: string | null
  projects?: {
    title?: string
    image_url?: string
    slug?: string | null
  } | null
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

// =============================================
// FUNÇÕES DE PERFIL
// =============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return null
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload do avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await updateProfile(userId, { avatar_url: data.publicUrl })

    return data.publicUrl
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE PROJETOS
// =============================================

export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('site_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data
  } catch {
    return []
  }
}

export async function getProject(projectIdOrSlug: string): Promise<Project | null> {
  const clean = (projectIdOrSlug || '').trim()
  if (!clean) return null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)

  try {
    const query = supabase.from('projects').select('*')
    const { data, error } = isUuid
      ? await query.eq('id', clean).maybeSingle()
      : await query.eq('slug', clean.toLowerCase()).maybeSingle()

    if (error || !data || !data.id || !data.title) {
      return null
    }

    return data
  } catch {
    return null
  }
}

// =============================================
// FUNÇÕES DE DOAÇÕES (Leitura Autenticada sob RLS)
// =============================================

export async function getDonations(userId?: string): Promise<Donation[]> {
  try {
    let query = supabase
      .from('donations')
      .select(`
        *,
        projects:project_id (
          title,
          image_url,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar doações:', error)
      return []
    }

    return (data as Donation[]) || []
  } catch (error) {
    console.error('Erro ao buscar doações:', error)
    return []
  }
}

export async function getUserDonationById(
  donationId: string,
  userId: string
): Promise<Donation | null> {
  if (!donationId || !userId) return null
  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        projects:project_id (
          title,
          image_url,
          slug
        )
      `)
      .eq('id', donationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return data as Donation
  } catch {
    return null
  }
}

// =============================================
// FUNÇÕES DE FAVORITOS
// =============================================

export async function getFavorites(userId: string): Promise<Favorite[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        projects:project_id (
          id,
          title,
          description,
          image_url,
          current_amount,
          target_amount,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar favoritos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error)
    return []
  }
}

export async function addFavorite(userId: string, projectId: string): Promise<Favorite | null> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, project_id: projectId })
      .select()
      .single()

    if (error) {
      console.error('Erro ao adicionar favorito:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error)
    return null
  }
}

export async function removeFavorite(userId: string, projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Erro ao remover favorito:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    return false
  }
}

// =============================================
// FUNÇÕES DE NOTIFICAÇÕES
// =============================================

export async function getNotifications(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

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

// =============================================
// FUNÇÕES DE ESTATÍSTICAS (Soma Exata em Centavos)
// =============================================

export async function getUserStats(userId: string): Promise<{
  totalDonated: number
  totalDonations: number
  lastDonation: string | null
} | null> {
  try {
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('amount, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Erro ao buscar estatísticas:', donationsError)
      return null
    }

    const totalDonated = sumDonationsBrl((donations || []).map((d) => d.amount))
    const totalDonations = donations?.length || 0

    return {
      totalDonated,
      totalDonations,
      lastDonation: donations?.[0]?.created_at || null,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }
}

export async function getProjectStats(projectId: string): Promise<{
  totalRaised: number
  totalDonors: number
  totalDonations: number
} | null> {
  try {
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('amount, status, user_id')
      .eq('project_id', projectId)
      .eq('status', 'completed')

    if (donationsError) {
      console.error('Erro ao buscar estatísticas do projeto:', donationsError)
      return null
    }

    const totalRaised = sumDonationsBrl((donations || []).map((d) => d.amount))
    const totalDonors = new Set((donations || []).map((d) => d.user_id).filter(Boolean)).size

    return {
      totalRaised,
      totalDonors,
      totalDonations: donations?.length || 0,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do projeto:', error)
    return null
  }
}
