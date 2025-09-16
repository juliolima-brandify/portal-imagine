import { supabase } from './supabase'
import { sendWelcomeEmail } from './resend'

// =============================================
// TIPOS
// =============================================

export interface Profile {
  id: string
  email: string
  name?: string
  phone?: string
  cpf?: string
  address?: any
  preferences?: any
  role: 'donor' | 'admin'
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
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  user_id: string
  project_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  stripe_payment_intent_id?: string
  is_recurring: boolean
  recurring_frequency?: string
  message?: string
  anonymous: boolean
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
        upsert: true
      })

    if (uploadError) {
      console.error('Erro ao fazer upload do avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Atualizar URL do avatar no perfil
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar projetos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
    return []
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Erro ao buscar projeto:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar projeto:', error)
    return null
  }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar projeto:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return null
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar projeto:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE DOAÇÕES
// =============================================

export async function getDonations(userId?: string): Promise<Donation[]> {
  try {
    let query = supabase
      .from('donations')
      .select(`
        *,
        projects:project_id (
          title,
          image_url
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

    return data || []
  } catch (error) {
    console.error('Erro ao buscar doações:', error)
    return []
  }
}

export async function createDonation(donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert(donation)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar doação:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao criar doação:', error)
    return null
  }
}

export async function updateDonationStatus(donationId: string, status: Donation['status'], stripePaymentIntentId?: string): Promise<Donation | null> {
  try {
    const updates: any = { status }
    if (stripePaymentIntentId) {
      updates.stripe_payment_intent_id = stripePaymentIntentId
    }

    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', donationId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status da doação:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao atualizar status da doação:', error)
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
// FUNÇÕES DE ESTATÍSTICAS
// =============================================

export async function getUserStats(userId: string): Promise<any> {
  try {
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('amount, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (donationsError) {
      console.error('Erro ao buscar estatísticas:', donationsError)
      return null
    }

    const totalDonated = donations?.reduce((sum, donation) => sum + donation.amount, 0) || 0
    const totalDonations = donations?.length || 0

    return {
      totalDonated,
      totalDonations,
      lastDonation: donations?.[0]?.created_at || null
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }
}

export async function getProjectStats(projectId: string): Promise<any> {
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

    const totalRaised = donations?.reduce((sum, donation) => sum + donation.amount, 0) || 0
    const totalDonors = new Set(donations?.map(d => d.user_id)).size

    return {
      totalRaised,
      totalDonors,
      totalDonations: donations?.length || 0
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do projeto:', error)
    return null
  }
}

// =============================================
// FUNÇÕES DE AUTENTICAÇÃO
// =============================================

export async function createUserFromDonation(
  email: string, 
  name: string, 
  donationAmount: number = 0,
  projectTitle?: string
): Promise<string | null> {
  try {
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return existingUser.id
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-12)

    // Criar novo usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
          role: 'donor'
        }
      }
    })

    if (authError || !authData.user) {
      console.error('Erro ao criar usuário no auth:', authError)
      return null
    }

    // Criar perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'donor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      return null
    }

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail({
        name,
        email,
        tempPassword,
        donationAmount,
        projectTitle
      })
      console.log(`Email de boas-vindas enviado para: ${email}`)
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError)
      // Não falhar a criação do usuário por causa do email
    }

    return profileData.id
  } catch (error) {
    console.error('Erro ao criar usuário da doação:', error)
    return null
  }
}

