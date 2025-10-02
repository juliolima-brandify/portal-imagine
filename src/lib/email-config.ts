// =============================================
// CONFIGURAÇÃO DE EMAILS TRANSACIONAIS
// =============================================

export const EMAIL_CONFIG = {
  // Configurações gerais
  from: {
    default: 'Instituto Imagine <noreply@imagineinstituto.com>',
    admin: 'Sistema Portal Imagine <noreply@imagineinstituto.com>',
    support: 'Suporte Portal Imagine <suporte@imagineinstituto.com>'
  },

  // Emails de administradores
  adminEmails: {
    primary: 'admin@institutoimagine.org',
    secondary: 'contato@institutoimagine.org',
    support: 'suporte@institutoimagine.org'
  },

  // URLs do sistema
  urls: {
    portal: 'https://portal.imagineinstituto.com',
    admin: 'https://portal.imagineinstituto.com/admin',
    projetos: 'https://portal.imagineinstituto.com/projetos',
    doacoes: 'https://portal.imagineinstituto.com/doacoes',
    auth: 'https://portal.imagineinstituto.com/auth',
    perfil: 'https://portal.imagineinstituto.com/perfil'
  },

  // Configurações de templates
  templates: {
    // Configurações de cores por tipo
    colors: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb',
      primary: '#1f2937'
    },

    // Configurações de emojis
    emojis: {
      donation: '💰',
      welcome: '🎉',
      update: '📢',
      milestone: '🎯',
      completion: '🏆',
      reminder: '⏰',
      alert: '⚠️',
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    },

    // Configurações de layout
    layout: {
      maxWidth: '600px',
      borderRadius: '12px',
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  },

  // Configurações de rate limiting
  rateLimit: {
    maxEmailsPerHour: 100,
    maxEmailsPerDay: 1000,
    cooldownMinutes: 5
  },

  // Configurações de retry
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },

  // Configurações de monitoramento
  monitoring: {
    logAllEmails: true,
    trackOpens: true,
    trackClicks: true,
    saveToDatabase: false // Pode ser habilitado para auditoria
  }
}

// =============================================
// CONFIGURAÇÕES POR AMBIENTE
// =============================================

export const getEmailConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  const configs = {
    development: {
      ...EMAIL_CONFIG,
      from: {
        ...EMAIL_CONFIG.from,
        default: 'Instituto Imagine Dev <noreply@resend.dev>'
      },
      urls: {
        portal: 'http://localhost:3000',
        admin: 'http://localhost:3000/admin',
        projetos: 'http://localhost:3000/projetos',
        doacoes: 'http://localhost:3000/doacoes',
        auth: 'http://localhost:3000/auth',
        perfil: 'http://localhost:3000/perfil'
      },
      monitoring: {
        ...EMAIL_CONFIG.monitoring,
        logAllEmails: true
      }
    },

    production: {
      ...EMAIL_CONFIG,
      monitoring: {
        ...EMAIL_CONFIG.monitoring,
        logAllEmails: false,
        saveToDatabase: true
      }
    }
  }

  return configs[env as keyof typeof configs] || configs.development
}

// =============================================
// FUNÇÕES AUXILIARES PARA LOGOS
// =============================================

export const getLogoUrl = (): string => {
  // Sempre usar a URL de produção para garantir que funcione nos emails
  return 'https://portal.imagineinstituto.com/images/logo.png'
}

export const getFaviconUrl = (): string => {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'development') {
    return 'http://localhost:3000/images/favicon.png'
  }
  
  return 'https://portal.imagineinstituto.com/images/favicon.png'
}

// =============================================
// VALIDAÇÕES DE EMAIL
// =============================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

export const isValidAdminEmail = (email: string): boolean => {
  const adminEmails = Object.values(EMAIL_CONFIG.adminEmails)
  return adminEmails.includes(email.toLowerCase())
}

// =============================================
// CONFIGURAÇÕES DE TEMPLATE POR TIPO
// =============================================

export const getTemplateConfig = (type: string) => {
  const templates = {
    welcome: {
      subject: '🎉 Obrigado pela sua doação! - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.welcome,
      color: EMAIL_CONFIG.templates.colors.success
    },
    confirmation: {
      subject: '✅ Confirmação de doação - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.success,
      color: EMAIL_CONFIG.templates.colors.success
    },
    update: {
      subject: '📢 Atualização do Projeto - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.update,
      color: EMAIL_CONFIG.templates.colors.info
    },
    milestone: {
      subject: '🎯 Marco Atingido! - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.milestone,
      color: EMAIL_CONFIG.templates.colors.warning
    },
    completion: {
      subject: '🏆 Projeto Concluído! - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.completion,
      color: EMAIL_CONFIG.templates.colors.success
    },
    reminder: {
      subject: '⏰ Lembrete: Próxima doação recorrente - Instituto Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.reminder,
      color: EMAIL_CONFIG.templates.colors.warning
    },
    admin_notification: {
      subject: '💰 Nova Doação Recebida! - Portal Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.donation,
      color: EMAIL_CONFIG.templates.colors.success
    },
    admin_alert: {
      subject: '⚠️ Alerta do Sistema - Portal Imagine',
      emoji: EMAIL_CONFIG.templates.emojis.alert,
      color: EMAIL_CONFIG.templates.colors.error
    }
  }

  return templates[type as keyof typeof templates] || templates.update
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const generateEmailId = (): string => {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// =============================================
// CONFIGURAÇÕES DE DOMÍNIO
// =============================================

export const DOMAIN_CONFIG = {
  // Configurações SPF (para produção)
  spf: 'v=spf1 include:_spf.resend.com ~all',
  
  // Configurações DKIM (para produção)
  dkim: {
    selector: 'resend',
    publicKey: 'k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...'
  },
  
  // Configurações DMARC (para produção)
  dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@imagineinstituto.com'
}

// =============================================
// CONFIGURAÇÕES DE MONITORAMENTO
// =============================================

export const MONITORING_CONFIG = {
  // Métricas a serem coletadas
  metrics: [
    'emails_sent',
    'emails_delivered',
    'emails_opened',
    'emails_clicked',
    'emails_bounced',
    'emails_complained'
  ],

  // Alertas automáticos
  alerts: {
    highBounceRate: {
      threshold: 0.05, // 5%
      enabled: true
    },
    highComplaintRate: {
      threshold: 0.01, // 1%
      enabled: true
    },
    lowDeliveryRate: {
      threshold: 0.95, // 95%
      enabled: true
    }
  },

  // Dashboard de métricas
  dashboard: {
    refreshInterval: 300000, // 5 minutos
    retentionDays: 30
  }
}

