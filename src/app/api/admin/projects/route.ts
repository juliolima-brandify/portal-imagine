import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log('🔍 API: Carregando projetos para admin...')
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ API: Erro ao carregar projetos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`✅ API: ${data?.length || 0} projetos carregados`)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ API: Erro na requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 API: Criando projeto:', body.title)
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([body])
      .select()
    
    if (error) {
      console.error('❌ API: Erro ao criar projeto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ API: Projeto criado:', data?.[0]?.title)
    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    console.error('❌ API: Erro na criação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 API: Atualizando projeto:', body.id)
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(body)
      .eq('id', body.id)
      .select()
    
    if (error) {
      console.error('❌ API: Erro ao atualizar projeto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ API: Projeto atualizado:', data?.[0]?.title)
    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    console.error('❌ API: Erro na atualização:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do projeto é obrigatório' }, { status: 400 })
    }
    
    console.log('🔍 API: Deletando projeto:', id)
    
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ API: Erro ao deletar projeto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ API: Projeto deletado:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API: Erro na deleção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
