import { 
  sendWelcomeEmail, 
  sendDonationConfirmation, 
  sendProjectUpdate, 
  sendAdminNotification, 
  sendRecurringReminder,
  type WelcomeEmailData,
  type DonationConfirmationData,
  type ProjectUpdateData,
  type AdminNotificationData,
  type RecurringReminderData
} from './resend'

// =============================================
// SERVIÇO DE EMAIL CENTRALIZADO
// =============================================

export class EmailService {
  
  // =============================================
  // EMAILS PARA DOADORES
  // =============================================

  /**
   * Envia email de boas-vindas para novos doadores
   */
  static async sendWelcome(data: WelcomeEmailData): Promise<boolean> {
    try {
      console.log(`📧 Enviando email de boas-vindas para: ${data.email}`)
      return await sendWelcomeEmail(data)
    } catch (error) {
      console.error('Erro no serviço de email de boas-vindas:', error)
      return false
    }
  }

  /**
   * Envia confirmação de doação
   */
  static async sendDonationConfirmation(data: DonationConfirmationData): Promise<boolean> {
    try {
      console.log(`📧 Enviando confirmação de doação para: ${data.email}`)
      return await sendDonationConfirmation(data)
    } catch (error) {
      console.error('Erro no serviço de confirmação de doação:', error)
      return false
    }
  }

  /**
   * Envia atualização de projeto
   */
  static async sendProjectUpdate(data: ProjectUpdateData): Promise<boolean> {
    try {
      console.log(`📧 Enviando atualização de projeto para: ${data.email}`)
      return await sendProjectUpdate(data)
    } catch (error) {
      console.error('Erro no serviço de atualização de projeto:', error)
      return false
    }
  }

  /**
   * Envia lembrete de doação recorrente
   */
  static async sendRecurringReminder(data: RecurringReminderData): Promise<boolean> {
    try {
      console.log(`📧 Enviando lembrete recorrente para: ${data.email}`)
      return await sendRecurringReminder(data)
    } catch (error) {
      console.error('Erro no serviço de lembrete recorrente:', error)
      return false
    }
  }

  // =============================================
  // EMAILS PARA ADMINISTRADORES
  // =============================================

  /**
   * Envia notificação para administradores
   */
  static async sendAdminNotification(data: AdminNotificationData): Promise<boolean> {
    try {
      console.log(`📧 Enviando notificação admin para: ${data.adminEmail}`)
      return await sendAdminNotification(data)
    } catch (error) {
      console.error('Erro no serviço de notificação admin:', error)
      return false
    }
  }

  // =============================================
  // FUNÇÕES AUXILIARES
  // =============================================

  /**
   * Envia múltiplos emails em lote
   */
  static async sendBatch(emails: Array<{
    type: 'welcome' | 'confirmation' | 'update' | 'reminder' | 'admin'
    data: any
  }>): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const email of emails) {
      try {
        let result = false
        
        switch (email.type) {
          case 'welcome':
            result = await this.sendWelcome(email.data)
            break
          case 'confirmation':
            result = await this.sendDonationConfirmation(email.data)
            break
          case 'update':
            result = await this.sendProjectUpdate(email.data)
            break
          case 'reminder':
            result = await this.sendRecurringReminder(email.data)
            break
          case 'admin':
            result = await this.sendAdminNotification(email.data)
            break
        }

        if (result) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Erro no envio em lote:', error)
        failed++
      }
    }

    return { success, failed }
  }

  /**
   * Valida dados do email antes do envio
   */
  static validateEmailData(type: string, data: any): boolean {
    const requiredFields = {
      welcome: ['name', 'email', 'tempPassword', 'donationAmount'],
      confirmation: ['name', 'email', 'amount', 'donationId'],
      update: ['name', 'email', 'projectTitle', 'updateMessage'],
      reminder: ['name', 'email', 'projectTitle', 'amount', 'frequency'],
      admin: ['adminEmail', 'type', 'title', 'message']
    }

    const fields = requiredFields[type as keyof typeof requiredFields]
    if (!fields) return false

    return fields.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '')
  }

  /**
   * Formatar dados para envio seguro
   */
  static sanitizeEmailData(data: any): any {
    const sanitized = { ...data }
    
    // Remover campos sensíveis se necessário
    if (sanitized.tempPassword) {
      sanitized.tempPassword = sanitized.tempPassword.substring(0, 8) // Limitar tamanho da senha
    }
    
    // Limitar tamanho de strings
    if (sanitized.message && sanitized.message.length > 1000) {
      sanitized.message = sanitized.message.substring(0, 1000) + '...'
    }
    
    return sanitized
  }

  /**
   * Log de emails enviados para auditoria
   */
  static logEmailSent(type: string, recipient: string, success: boolean, error?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      recipient,
      success,
      error: error || null
    }
    
    console.log('📧 Email Log:', JSON.stringify(logEntry, null, 2))
    
    // Aqui você pode adicionar lógica para salvar em banco de dados se necessário
  }
}

// =============================================
// FUNÇÕES DE CONVENIÊNCIA
// =============================================

/**
 * Envia email de boas-vindas para novo doador
 */
export async function welcomeNewDonor(
  name: string, 
  email: string, 
  tempPassword: string, 
  donationAmount: number, 
  projectTitle?: string
): Promise<boolean> {
  const data = EmailService.sanitizeEmailData({
    name,
    email,
    tempPassword,
    donationAmount,
    projectTitle
  })

  if (!EmailService.validateEmailData('welcome', data)) {
    console.error('Dados inválidos para email de boas-vindas')
    return false
  }

  const result = await EmailService.sendWelcome(data)
  EmailService.logEmailSent('welcome', email, result)
  return result
}

/**
 * Envia confirmação de doação
 */
export async function confirmDonation(
  name: string,
  email: string,
  amount: number,
  donationId: string,
  projectTitle?: string,
  paymentMethod?: string
): Promise<boolean> {
  const data = EmailService.sanitizeEmailData({
    name,
    email,
    amount,
    donationId,
    projectTitle,
    paymentMethod
  })

  if (!EmailService.validateEmailData('confirmation', data)) {
    console.error('Dados inválidos para confirmação de doação')
    return false
  }

  const result = await EmailService.sendDonationConfirmation(data)
  EmailService.logEmailSent('confirmation', email, result)
  return result
}

/**
 * Notifica admin sobre nova doação
 */
export async function notifyAdminNewDonation(
  donorName: string,
  donorEmail: string,
  amount: number,
  projectTitle: string,
  donationId: string
): Promise<boolean> {
  const data = {
    adminEmail: 'admin@institutoimagine.org',
    type: 'new_donation' as const,
    title: 'Nova Doação Recebida!',
    message: `Uma nova doação de R$ ${amount.toFixed(2)} foi recebida para o projeto "${projectTitle}".`,
    data: {
      donationId,
      amount,
      projectTitle,
      donorEmail,
      donorName,
      timestamp: new Date().toISOString()
    }
  }

  const result = await EmailService.sendAdminNotification(data)
  EmailService.logEmailSent('admin', 'admin@institutoimagine.org', result)
  return result
}

/**
 * Envia atualização de projeto para doadores
 */
export async function notifyProjectUpdate(
  donorName: string,
  donorEmail: string,
  projectTitle: string,
  projectId: string,
  updateType: 'milestone' | 'completion' | 'new_info' | 'progress',
  updateMessage: string
): Promise<boolean> {
  const data = EmailService.sanitizeEmailData({
    name: donorName,
    email: donorEmail,
    projectTitle,
    projectId,
    updateType,
    updateMessage,
    projectUrl: `https://portal.imagineinstituto.com/projetos/${projectId}`
  })

  if (!EmailService.validateEmailData('update', data)) {
    console.error('Dados inválidos para atualização de projeto')
    return false
  }

  const result = await EmailService.sendProjectUpdate(data)
  EmailService.logEmailSent('update', donorEmail, result)
  return result
}

/**
 * Envia lembrete de doação recorrente
 */
export async function remindRecurringDonation(
  donorName: string,
  donorEmail: string,
  projectTitle: string,
  amount: number,
  frequency: string,
  nextPaymentDate: string
): Promise<boolean> {
  const data = EmailService.sanitizeEmailData({
    name: donorName,
    email: donorEmail,
    projectTitle,
    amount,
    frequency,
    nextPaymentDate,
    projectUrl: 'https://portal.imagineinstituto.com/projetos'
  })

  if (!EmailService.validateEmailData('reminder', data)) {
    console.error('Dados inválidos para lembrete recorrente')
    return false
  }

  const result = await EmailService.sendRecurringReminder(data)
  EmailService.logEmailSent('reminder', donorEmail, result)
  return result
}

