import 'server-only'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { escapeLikePattern } from '@/lib/payments'
import { getPortalOrigin } from './email'

export interface DonorProvisionResult {
  userId: string | null
  isNewAccount: boolean
  portalAccessUrl: string
}

/**
 * Decisão 3A: garante que o doador possua conta vinculada no Portal sem jamais enviar senha em texto plano.
 * - Se já existir perfil em public.profiles: preserva role existente (nunca rebaixa admin/volunteer) e vincula doações órfãs.
 * - Se for novo e-mail: cria usuário confirmado via supabaseAdmin + perfil donor + gera link seguro de definição de senha (/entrar?reset=true).
 */
export async function ensureDonorAccountAndAccessLink(input: {
  email?: string | null
  name?: string | null
}): Promise<DonorProvisionResult> {
  const portalBase = getPortalOrigin()
  const defaultLoginUrl = `${portalBase}/entrar`

  const cleanEmail = (input.email || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@') || !isSupabaseAdminConfigured()) {
    return {
      userId: null,
      isNewAccount: false,
      portalAccessUrl: defaultLoginUrl,
    }
  }

  const cleanName = (input.name || '').trim().slice(0, 100) || cleanEmail.split('@')[0]

  try {
    // 1) Checar se já existe perfil para este e-mail.
    // `ilike` com curingas escapados: `_` e `%` digitados pelo pagador não podem
    // virar padrão de busca (risco de vincular a doação à conta errada).
    const { data: matches, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role')
      .ilike('email', escapeLikePattern(cleanEmail))
      .limit(2)

    if (profileError) {
      console.error('[DonorProvision] Erro ao buscar perfil por e-mail:', profileError)
    }

    const existingProfile = matches?.[0]
    if (matches && matches.length > 1) {
      // Ambiguidade: não escolhe conta no escuro. Cria/segue sem vínculo.
      console.error('[DonorProvision] Mais de um perfil casou com o e-mail; vínculo ignorado.')
    }

    if (existingProfile?.id) {
      await linkOrphanDonationsByEmail(cleanEmail, existingProfile.id)
      return {
        userId: existingProfile.id,
        isNewAccount: false,
        portalAccessUrl: defaultLoginUrl,
      }
    }

    // 2) Criar novo usuário no Supabase Auth (sem senha exposta — uma entropia interna forte é definida apenas no Auth)
    const internalBootstrapSecret = `${crypto.randomUUID()}Aa1!${crypto.randomUUID()}`
    let authUserId: string | null = null

    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: internalBootstrapSecret,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        role: 'donor',
      },
    })

    if (!createErr && createdAuth?.user?.id) {
      authUserId = createdAuth.user.id
    }

    // 3) Gerar link seguro de definição de senha (também resolve user.id caso o usuário já existisse apenas em auth.users)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${portalBase}/entrar?reset=true`,
      },
    })

    if (!authUserId && linkData?.user?.id) {
      authUserId = linkData.user.id
    }

    if (authUserId) {
      // Garantir linha em public.profiles sem sobrescrever role caso o trigger on_auth_user_created já tenha criado
      await supabaseAdmin.from('profiles').upsert(
        {
          id: authUserId,
          email: cleanEmail,
          name: cleanName,
          role: 'donor',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      await linkOrphanDonationsByEmail(cleanEmail, authUserId)
    }

    const actionLink =
      !linkErr &&
      typeof linkData?.properties?.action_link === 'string' &&
      linkData.properties.action_link.startsWith('https://')
        ? linkData.properties.action_link
        : defaultLoginUrl

    return {
      userId: authUserId,
      isNewAccount: Boolean(createdAuth?.user?.id),
      portalAccessUrl: actionLink,
    }
  } catch (err) {
    console.error('[DonorProvision] Erro ao provisionar conta do doador:', err)
    return {
      userId: null,
      isNewAccount: false,
      portalAccessUrl: defaultLoginUrl,
    }
  }
}

async function linkOrphanDonationsByEmail(email: string, userId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('donations')
      .update({ user_id: userId })
      .ilike('donor_email', escapeLikePattern(email))
      .is('user_id', null)
  } catch {
    // Caso a migração ainda não tenha sido aplicada no ambiente local, ignora sem falhar
  }
}
