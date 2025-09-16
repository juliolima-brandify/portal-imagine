'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
  isLast?: boolean
}

interface BreadcrumbsProps {
  className?: string
  customItems?: BreadcrumbItem[]
}

export default function Breadcrumbs({ className = '', customItems }: BreadcrumbsProps) {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  useEffect(() => {
    if (customItems) {
      setBreadcrumbs(customItems)
      return
    }

    const generateBreadcrumbs = () => {
      const pathSegments = pathname.split('/').filter(segment => segment !== '')
      const breadcrumbItems: BreadcrumbItem[] = []

      // Home sempre como primeiro item
      // Se estamos em modo demo ou em páginas autenticadas, "Início" deve ir para o dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const demoEmail = urlParams.get('demo_email')
      
      let inicioHref = '/'
      if (demoEmail || pathSegments.length > 0) {
        inicioHref = '/dashboard'
        if (demoEmail) {
          inicioHref += `?demo_email=${demoEmail}`
        }
      }
      
      breadcrumbItems.push({
        label: 'Início',
        href: inicioHref
      })

      // Incluir Dashboard se necessário
      if (shouldIncludeDashboard(pathSegments)) {
        // Verificar se estamos em modo demo e preservar os parâmetros
        const urlParams = new URLSearchParams(window.location.search)
        const demoEmail = urlParams.get('demo_email')
        
        let dashboardHref = '/dashboard'
        if (demoEmail) {
          dashboardHref += `?demo_email=${demoEmail}`
        }
        
        breadcrumbItems.push({
          label: 'Dashboard',
          href: dashboardHref
        })
      }

      let currentPath = ''
      
      pathSegments.forEach((segment, index) => {
        // Para páginas admin, pular o segmento "admin" e ir direto para a página
        if (pathSegments[0] === 'admin' && index === 0) {
          return // Pular o segmento "admin"
        }
        
        currentPath += `/${segment}`
        
        // Para páginas admin, usar labels diretos
        let label: string
        if (pathSegments[0] === 'admin' && index === 1) {
          label = getAdminPageLabel(segment)
        } else {
          label = getSegmentLabel(segment, pathSegments)
        }
        
        breadcrumbItems.push({
          label,
          href: currentPath,
          isLast: index === pathSegments.length - 1
        })
      })

      setBreadcrumbs(breadcrumbItems)
    }

    generateBreadcrumbs()
  }, [pathname, customItems])

  const getSegmentLabel = (segment: string, allSegments: string[]): string => {
    // Mapear segmentos para labels amigáveis
    const labelMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'projetos': 'Projetos',
      'doacoes': 'Doações',
      'historico': 'Histórico',
      'perfil': 'Perfil',
      'comunidade': 'Comunidade',
      'doar': 'Doar',
      'admin': 'Administração',
      'usuarios': 'Usuários',
      'relatorios': 'Relatórios',
      'projetos-admin': 'Projetos',
      'doacoes-admin': 'Doações',
      'auth': 'Autenticação',
      'sobre': 'Sobre',
      'contato': 'Contato'
    }

    // Se for um ID (UUID ou número), tentar obter contexto
    if (segment.match(/^[0-9a-f-]{36}$/i) || segment.match(/^\d+$/)) {
      const context = allSegments[allSegments.indexOf(segment) - 1]
      if (context === 'projetos') return 'Detalhes do Projeto'
      if (context === 'doar') return 'Doação'
      if (context === 'usuarios') return 'Usuário'
      return 'Detalhes'
    }

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  const shouldIncludeDashboard = (pathSegments: string[]): boolean => {
    // Incluir Dashboard se não estivermos na home ou no próprio dashboard
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return false
    }
    
    // Incluir Dashboard para páginas principais do usuário
    const userPages = ['projetos', 'doacoes', 'historico', 'perfil', 'comunidade']
    const adminPages = ['admin']
    
    return userPages.includes(pathSegments[0]) || adminPages.includes(pathSegments[0])
  }

  const getAdminPageLabel = (segment: string): string => {
    // Para páginas admin, usar labels diretos sem "Administração"
    const adminLabels: { [key: string]: string } = {
      'usuarios': 'Usuários',
      'relatorios': 'Relatórios',
      'projetos': 'Projetos',
      'doacoes': 'Doações'
    }
    
    return adminLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <svg 
                className="w-4 h-4 text-gray-400 mx-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.isLast ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
