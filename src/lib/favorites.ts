import { supabase } from './supabase'

// =============================================
// TIPOS
// =============================================

export interface Favorite {
  id: string
  user_id: string
  project_id: string
  created_at: string
  project?: {
    id: string
    title: string
    description: string
    image_url: string
    current_amount: number
    target_amount: number
    status: string
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

export async function isFavorite(userId: string, projectId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      return false
    }

    return !!data
  } catch (error) {
    return false
  }
}

export async function getFavoriteCount(projectId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (error) {
      console.error('Erro ao contar favoritos:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Erro ao contar favoritos:', error)
    return 0
  }
}

// =============================================
// UTILITÁRIOS
// =============================================

export function formatProgress(current: number, target: number): number {
  return Math.round((current / target) * 100)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'completed':
      return 'text-blue-600 bg-blue-100'
    case 'paused':
      return 'text-yellow-600 bg-yellow-100'
    case 'cancelled':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'completed':
      return 'Concluído'
    case 'paused':
      return 'Pausado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Desconhecido'
  }
}

