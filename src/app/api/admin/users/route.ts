import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    console.log('🔄 [API] Carregando usuários do Supabase...')
    
    // Carregar perfis dos usuários
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ [API] Erro ao carregar perfis:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ [API] Perfis carregados do Supabase:', profiles.length)
      
      // Transformar dados do Supabase para o formato esperado
      const transformedUsers = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || 'email@exemplo.com',
        name: profile.name || 'Usuário',
        role: profile.role || 'donor',
        status: 'active', // Status padrão já que a coluna não existe
        totalDonations: 0, // Será calculado separadamente
        donationsCount: 0, // Será calculado separadamente
        lastLogin: profile.last_login || new Date().toISOString().split('T')[0],
        createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
      
      return NextResponse.json({ data: transformedUsers }, { status: 200 })
    } else {
      console.log('⚠️ [API] Nenhum perfil encontrado no Supabase')
      return NextResponse.json({ data: [] }, { status: 200 })
    }
  } catch (error: any) {
    console.error('❌ [API] Erro inesperado ao carregar usuários:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userData = await request.json()
    console.log('🔄 [API] Atualizando usuário:', userData.id)
    
    // Atualizar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: userData.name,
        role: userData.role
      })
      .eq('id', userData.id)

    if (profileError) {
      console.error('❌ [API] Erro ao atualizar perfil:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    console.log('✅ [API] Usuário atualizado com sucesso')
    return NextResponse.json({ message: 'Usuário atualizado com sucesso' }, { status: 200 })
    
  } catch (error: any) {
    console.error('❌ [API] Erro inesperado ao atualizar usuário:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log('🔄 [API] Criando usuário:', userData.email)
    
    // Validar dados obrigatórios
    if (!userData.email || !userData.name || !userData.password) {
      return NextResponse.json({ error: 'Email, nome e senha são obrigatórios' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ [API] Erro ao criar usuário no Auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Criar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'donor'
      })

    if (profileError) {
      console.error('❌ [API] Erro ao criar perfil:', profileError)
      // Tentar limpar o usuário criado no Auth se o perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    console.log('✅ [API] Usuário criado com sucesso')
    return NextResponse.json({ 
      message: 'Usuário criado com sucesso',
      user: {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'donor'
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ [API] Erro inesperado ao criar usuário:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }
    
    console.log('🔄 [API] Excluindo usuário:', userId)
    
    // Excluir perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('❌ [API] Erro ao excluir perfil:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Tentar excluir também do Auth (opcional, pode falhar se não for possível)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch (authError) {
      console.log('⚠️ [API] Não foi possível excluir do Auth (normal se já foi excluído):', authError)
    }

    console.log('✅ [API] Usuário excluído com sucesso')
    return NextResponse.json({ message: 'Usuário excluído com sucesso' }, { status: 200 })
    
  } catch (error: any) {
    console.error('❌ [API] Erro inesperado ao excluir usuário:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
