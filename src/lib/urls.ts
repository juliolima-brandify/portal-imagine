/**
 * Utilitários para geração de URLs
 */

/**
 * Obtém a URL base do portal baseada no ambiente
 */
export function getPortalBaseUrl(): string {
  // Se estivermos no servidor, usar a variável de ambiente
  if (typeof window === 'undefined') {
    return process.env.NEXTAUTH_URL || 'https://portal.imagineinstituto.com'
  }
  
  // Se estivermos no cliente, usar a URL atual
  const { protocol, hostname } = window.location
  
  // Detectar ambiente baseado na URL
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${window.location.port || '3000'}` // Usar a porta atual
  } else if (hostname.includes('vercel.app')) {
    return `https://${hostname}`
  } else {
    return 'https://portal.imagineinstituto.com'
  }
}

/**
 * Gera URL completa do checkout com tracking (versão híbrida)
 */
export function generateCheckoutUrl(projectId: string, projectTitle: string, baseUrl?: string): string {
  const domain = baseUrl || getPortalBaseUrl()
  const campaign = projectTitle.toLowerCase().replace(/\s+/g, '-')
  return `${domain}/embed/checkout/checkout-stripe?project=${projectId}&source=portal&utm_campaign=${campaign}`
}

/**
 * Gera URL do checkout embed para sites externos
 */
export function generateEmbedUrl(projectId: string, projectTitle: string, baseUrl?: string): string {
  const domain = baseUrl || getPortalBaseUrl()
  const campaign = projectTitle.toLowerCase().replace(/\s+/g, '-')
  return `${domain}/embed/checkout/checkout-stripe?project=${projectId}&source=embed&utm_campaign=${campaign}`
}

/**
 * Gera URL do projeto Framer
 */
export function generateFramerUrl(projectId: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://imagineinstituto.com'
  return `${domain}/projetos/${projectId}`
}

/**
 * Converte título para slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') // Remove caracteres especiais
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') // Remove hífens do início e fim
}
