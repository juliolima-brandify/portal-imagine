/**
 * Utilitários para geração de URLs do Portal e Site Institucional
 */

export function getPortalBaseUrl(): string {
  if (typeof window === 'undefined') {
    const configured = (process.env.NEXT_PUBLIC_BASE_URL || '').trim()
    if (configured.startsWith('https://')) {
      return configured.replace(/\/+$/, '')
    }
    return 'https://portal.imagineinstituto.com'
  }

  const { hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port || '3000'}`
  }
  return `${window.location.protocol}//${window.location.host}`
}

export function generateCheckoutUrl(projectId: string, projectTitle: string, baseUrl?: string): string {
  const domain = baseUrl || getPortalBaseUrl()
  const campaign = encodeURIComponent(titleToSlug(projectTitle) || 'projeto')
  return `${domain}/embed/checkout?project=${encodeURIComponent(projectId)}&source=portal&utm_campaign=${campaign}`
}

export function generateEmbedUrl(projectId: string, projectTitle: string, baseUrl?: string): string {
  const domain = baseUrl || getPortalBaseUrl()
  const campaign = encodeURIComponent(titleToSlug(projectTitle) || 'projeto')
  return `${domain}/embed/checkout?project=${encodeURIComponent(projectId)}&source=embed&utm_campaign=${campaign}`
}

export function generateFramerUrl(projectId: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://imagineinstituto.com'
  return `${domain}/projetos/${projectId}`
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
