import 'server-only'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { normalizeDonorEmail } from '@/lib/payments'
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
    // 1) Identificar a conta pelo e-mail de auth.users (só e-mail confirmado, comparação exata
    // normalizada). Nunca por profiles.email: o próprio usuário pode alterá-lo na tabela de perfis.
    const { data: matches, error: lookupError } = await supabaseAdmin.rpc(
      'find_confirmed_auth_user_ids_by_email',
      { p_email: cleanEmail }
    )

    if (lookupError) {
      console.error('[DonorProvision] Erro ao buscar conta por e-mail; abortando provisionamento:', lookupError)
      return {
        userId: null,
        isNewAccount: false,
        portalAccessUrl: defaultLoginUrl,
      }
    }

    if (Array.isArray(matches) && matches.length > 1) {
      // Ambiguidade: não escolhe conta no escuro. Devolve sem vínculo para não
      // creditar a doação no histórico de outra pessoa (R5/R6).
      console.error('[DonorProvision] Mais de uma conta casou com o e-mail; vínculo ignorado.')
      return {
        userId: null,
        isNewAccount: false,
        portalAccessUrl: defaultLoginUrl,
      }
    }

    const existingUserId = Array.isArray(matches) ? (matches[0]?.user_id as string | undefined) : undefined

    if (existingUserId) {
      await linkOrphanDonationsByEmail(cleanEmail, existingUserId)
      return {
        userId: existingUserId,
        isNewAccount: false,
        portalAccessUrl: defaultLoginUrl,
      }
    }

    // 2) Criar novo usuário no Supabase Auth (sem senha exposta — uma entropia interna forte é definida apenas no Auth)
    const internalBootstrapSecret = `${crypto.randomUUID()}Aa1!${crypto.randomUUID()}`

    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: internalBootstrapSecret,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        role: 'donor',
      },
    })

    // Falha fechada (R6): se createUser falhar (ex.: usuário já existente em auth.users
    // sem linha em profiles), NUNCA gera link PASSWORD_RECOVERY.
    if (createErr || !createdAuth?.user?.id) {
      if (createErr) {
        console.warn('[DonorProvision] createUser não criou nova conta; mantendo login padrão:', createErr.message)
      }
      return {
        userId: null,
        isNewAccount: false,
        portalAccessUrl: defaultLoginUrl,
      }
    }

    const authUserId = createdAuth.user.id

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

    // 3) Gerar link seguro de definição de senha exclusivamente para conta recém-criada
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${portalBase}/entrar?reset=true`,
      },
    })

    const actionLink =
      !linkErr &&
      typeof linkData?.properties?.action_link === 'string' &&
      linkData.properties.action_link.startsWith('https://')
        ? linkData.properties.action_link
        : defaultLoginUrl

    return {
      userId: authUserId,
      isNewAccount: true,
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
    // Igualdade exata: e-mails são gravados normalizados (lower/trim) pela migração 20261128.
    await supabaseAdmin
      .from('donations')
      .update({ user_id: userId })
      .eq('donor_email', normalizeDonorEmail(email) ?? '')
      .is('user_id', null)
  } catch {
    // Caso a migração ainda não tenha sido aplicada no ambiente local, ignora sem falhar
  }
}
