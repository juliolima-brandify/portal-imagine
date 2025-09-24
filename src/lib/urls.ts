/**
 * Utilitários para geração de URLs
 */

/**
 * Gera URL completa do checkout com tracking
 */
export function generateCheckoutUrl(projectId: string, projectTitle: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://portal.imagineinstituto.com'
  const campaign = projectTitle.toLowerCase().replace(/\s+/g, '-')
  return `${domain}/prototype/checkout/${projectId}?source=portal&utm_campaign=${campaign}`
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
