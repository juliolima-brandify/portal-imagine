import { Resend } from 'resend'
import { getLogoUrl } from './email-config'

// Inicializar Resend
export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

// =============================================
// TIPOS
// =============================================

export interface WelcomeEmailData {
  name: string
  email: string
  tempPassword: string
  donationAmount: number
  projectTitle?: string
}

export interface DonationConfirmationData {
  name: string
  email: string
  amount: number
  projectTitle?: string
  donationId: string
  paymentMethod?: string
}

export interface ProjectUpdateData {
  name: string
  email: string
  projectTitle: string
  projectId: string
  updateType: 'milestone' | 'completion' | 'new_info' | 'progress'
  updateMessage: string
  projectUrl: string
}

export interface AdminNotificationData {
  adminEmail: string
  type: 'new_donation' | 'project_goal_reached' | 'system_alert'
  title: string
  message: string
  data?: any
}

export interface RecurringReminderData {
  name: string
  email: string
  projectTitle: string
  amount: number
  frequency: string
  nextPaymentDate: string
  projectUrl: string
}

// =============================================
// FUNÇÕES DE EMAIL
// =============================================

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('Resend API key não configurada. Email não enviado.')
      console.log(`Email de boas-vindas para ${data.email}:`)
      console.log(`Nome: ${data.name}`)
      console.log(`Senha temporária: ${data.tempPassword}`)
      console.log(`Link: https://portal.imagineinstituto.com/auth?email=${data.email}`)
      return true // Retorna true para não falhar o processo
    }

    const { name, email, tempPassword, donationAmount, projectTitle } = data

    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@imagineinstituto.com>',
      to: [email],
      subject: '🎉 Obrigado pela sua doação! - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Obrigado pela sua doação!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 20px;
            }
            .subtitle {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            .donation-info {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
            }
            .login-info {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credentials {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 15px 0;
              font-family: monospace;
            }
            .button {
              display: inline-block;
              background: #059669;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px 5px;
            }
            .button:hover {
              background: #047857;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 15px 0;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Instituto Imagine" style="height: 60px; margin-bottom: 20px;">
              <h1 class="title">Obrigado pela sua doação!</h1>
              <p class="subtitle">Sua contribuição faz a diferença na vida de muitas pessoas.</p>
            </div>

            <p>Olá <strong>${name}</strong>,</p>

            <p>Recebemos sua doação e queremos agradecer de coração pelo seu apoio! Sua generosidade é fundamental para continuarmos nossa missão.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da sua doação:</h3>
              <p><strong>Valor:</strong> <span class="amount">R$ ${donationAmount.toFixed(2)}</span></p>
              ${projectTitle ? `<p><strong>Projeto:</strong> ${projectTitle}</p>` : ''}
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <div class="login-info">
              <h3>🔐 Acesso ao Portal</h3>
              <p>Criamos uma conta para você no nosso portal, onde você pode:</p>
              <ul>
                <li>Ver o histórico completo das suas doações</li>
                <li>Acompanhar o progresso dos projetos que você apoia</li>
                <li>Gerenciar doações recorrentes</li>
                <li>Receber atualizações sobre nossos projetos</li>
              </ul>

              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha temporária:</strong> ${tempPassword}</p>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="https://portal.imagineinstituto.com/auth" class="button">Acessar Portal</a>
                <a href="https://portal.imagineinstituto.com/auth?email=${email}" class="button">Redefinir Senha</a>
              </div>
            </div>

            <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>

            <p>Mais uma vez, obrigado por acreditar na nossa causa!</p>

            <p>Com gratidão,<br>
            <strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Erro ao enviar email de boas-vindas:', result.error)
      return false
    }

    console.log('Email de boas-vindas enviado com sucesso:', result.data?.id)
    return true
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error)
    return false
  }
}

export async function sendDonationConfirmation(data: DonationConfirmationData): Promise<boolean> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('Resend API key não configurada. Email de confirmação não enviado.')
      console.log(`Confirmação de doação para ${data.email}:`)
      console.log(`Valor: R$ ${data.amount}`)
      console.log(`ID: ${data.donationId}`)
      return true // Retorna true para não falhar o processo
    }

    const { name, email, amount, projectTitle, donationId } = data

    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@imagineinstituto.com>',
      to: [email],
      subject: '✅ Confirmação de doação - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de doação</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 20px;
            }
            .donation-info {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Instituto Imagine" style="height: 60px; margin-bottom: 20px;">
              <h1 class="title">Doação Confirmada!</h1>
            </div>

            <p>Olá <strong>${name}</strong>,</p>

            <p>Sua doação foi processada com sucesso! Agradecemos muito pela sua contribuição.</p>

            <div class="donation-info">
              <h3>📋 Detalhes da doação:</h3>
              <p><strong>ID da doação:</strong> ${donationId}</p>
              <p><strong>Valor:</strong> <span class="amount">R$ ${amount.toFixed(2)}</span></p>
              ${projectTitle ? `<p><strong>Projeto:</strong> ${projectTitle}</p>` : ''}
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <p>Você receberá um email de boas-vindas em breve com instruções para acessar o portal.</p>

            <p>Obrigado por fazer a diferença!</p>

            <p>Com gratidão,<br>
            <strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Erro ao enviar confirmação de doação:', result.error)
      return false
    }

    console.log('Confirmação de doação enviada com sucesso:', result.data?.id)
    return true
  } catch (error) {
    console.error('Erro ao enviar confirmação de doação:', error)
    return false
  }
}

// =============================================
// EMAIL DE ATUALIZAÇÃO DE PROJETO
// =============================================

export async function sendProjectUpdate(data: ProjectUpdateData): Promise<boolean> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('Resend API key não configurada. Email de atualização não enviado.')
      console.log(`Atualização de projeto para ${data.email}:`)
      console.log(`Projeto: ${data.projectTitle}`)
      console.log(`Tipo: ${data.updateType}`)
      return true
    }

    const { name, email, projectTitle, updateType, updateMessage, projectUrl } = data

    // Mapear tipos de atualização para emojis e títulos
    const updateConfig = {
      milestone: { emoji: '🎯', title: 'Marco Atingido!' },
      completion: { emoji: '🎉', title: 'Projeto Concluído!' },
      new_info: { emoji: '📢', title: 'Nova Atualização!' },
      progress: { emoji: '📈', title: 'Progresso do Projeto' }
    }

    const config = updateConfig[updateType] || updateConfig.progress

    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@imagineinstituto.com>',
      to: [email],
      subject: `${config.emoji} ${config.title} - ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${config.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 20px;
            }
            .project-info {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .update-content {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #059669;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px 5px;
            }
            .button:hover {
              background: #047857;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Instituto Imagine" style="height: 60px; margin-bottom: 20px;">
              <h1 class="title">${config.emoji} ${config.title}</h1>
            </div>

            <p>Olá <strong>${name}</strong>,</p>

            <p>Queremos compartilhar uma atualização emocionante sobre um projeto que você apoia!</p>

            <div class="project-info">
              <h3>📋 Projeto:</h3>
              <p><strong>${projectTitle}</strong></p>
            </div>

            <div class="update-content">
              <h3>${config.emoji} ${config.title}</h3>
              <p>${updateMessage}</p>
            </div>

            <p>Seu apoio é fundamental para que possamos continuar fazendo a diferença. Obrigado por acreditar na nossa missão!</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${projectUrl}" class="button">Ver Projeto Completo</a>
              <a href="https://portal.imagineinstituto.com/projetos" class="button">Ver Outros Projetos</a>
            </div>

            <p>Com gratidão,<br>
            <strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Erro ao enviar email de atualização:', result.error)
      return false
    }

    console.log('Email de atualização enviado com sucesso:', result.data?.id)
    return true
  } catch (error) {
    console.error('Erro ao enviar email de atualização:', error)
    return false
  }
}

// =============================================
// EMAIL DE NOTIFICAÇÃO PARA ADMIN
// =============================================

export async function sendAdminNotification(data: AdminNotificationData): Promise<boolean> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('Resend API key não configurada. Email de notificação admin não enviado.')
      console.log(`Notificação admin para ${data.adminEmail}:`)
      console.log(`Tipo: ${data.type}`)
      console.log(`Título: ${data.title}`)
      return true
    }

    const { adminEmail, type, title, message, data: notificationData } = data

    // Mapear tipos de notificação para emojis e cores
    const notificationConfig = {
      new_donation: { emoji: '💰', color: '#059669', bgColor: '#f0fdf4' },
      project_goal_reached: { emoji: '🎯', color: '#dc2626', bgColor: '#fef2f2' },
      system_alert: { emoji: '⚠️', color: '#d97706', bgColor: '#fffbeb' }
    }

    const config = notificationConfig[type] || notificationConfig.system_alert

    const result = await resend.emails.send({
      from: 'Sistema Portal Imagine <noreply@imagineinstituto.com>',
      to: [adminEmail],
      subject: `${config.emoji} ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: ${config.color};
              margin-bottom: 20px;
            }
            .notification-content {
              background: ${config.bgColor};
              border: 1px solid ${config.color}33;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .admin-data {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 15px 0;
              font-family: monospace;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: ${config.color};
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px 5px;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Instituto Imagine" style="height: 60px; margin-bottom: 20px;">
              <h1 class="title">${config.emoji} ${title}</h1>
            </div>

            <p>Olá <strong>Administrador</strong>,</p>

            <div class="notification-content">
              <h3>${config.emoji} Notificação do Sistema</h3>
              <p>${message}</p>
            </div>

            ${notificationData ? `
              <div class="admin-data">
                <h4>📊 Dados Detalhados:</h4>
                <pre>${JSON.stringify(notificationData, null, 2)}</pre>
              </div>
            ` : ''}

            <p>Esta é uma notificação automática do sistema Portal Imagine.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://portal.imagineinstituto.com/admin/dashboard" class="button">Acessar Admin</a>
            </div>

            <p>Atenciosamente,<br>
            <strong>Sistema Portal Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Portal de Administração</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Erro ao enviar notificação admin:', result.error)
      return false
    }

    console.log('Notificação admin enviada com sucesso:', result.data?.id)
    return true
  } catch (error) {
    console.error('Erro ao enviar notificação admin:', error)
    return false
  }
}

// =============================================
// EMAIL DE LEMBRETE DE DOAÇÃO RECORRENTE
// =============================================

export async function sendRecurringReminder(data: RecurringReminderData): Promise<boolean> {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      console.log('Resend API key não configurada. Email de lembrete não enviado.')
      console.log(`Lembrete para ${data.email}:`)
      console.log(`Projeto: ${data.projectTitle}`)
      console.log(`Próximo pagamento: ${data.nextPaymentDate}`)
      return true
    }

    const { name, email, projectTitle, amount, frequency, nextPaymentDate, projectUrl } = data

    const result = await resend.emails.send({
      from: 'Instituto Imagine <noreply@imagineinstituto.com>',
      to: [email],
      subject: '⏰ Lembrete: Próxima doação recorrente - Instituto Imagine',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Doação Recorrente</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #d97706;
              margin-bottom: 20px;
            }
            .reminder-info {
              background: #fffbeb;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
            }
            .button {
              display: inline-block;
              background: #059669;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px 5px;
            }
            .button:hover {
              background: #047857;
            }
            .button.secondary {
              background: #6b7280;
            }
            .button.secondary:hover {
              background: #4b5563;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Instituto Imagine" style="height: 60px; margin-bottom: 20px;">
              <h1 class="title">⏰ Lembrete de Doação</h1>
            </div>

            <p>Olá <strong>${name}</strong>,</p>

            <p>Este é um lembrete amigável sobre sua doação recorrente que está programada para acontecer em breve.</p>

            <div class="reminder-info">
              <h3>📋 Detalhes da sua doação recorrente:</h3>
              <p><strong>Projeto:</strong> ${projectTitle}</p>
              <p><strong>Valor:</strong> <span class="amount">R$ ${amount.toFixed(2)}</span></p>
              <p><strong>Frequência:</strong> ${frequency}</p>
              <p><strong>Próximo pagamento:</strong> ${nextPaymentDate}</p>
            </div>

            <p>Seu apoio contínuo é fundamental para que possamos manter nossos projetos ativos e fazer ainda mais diferença na vida das pessoas.</p>

            <p>Se você deseja modificar ou cancelar sua doação recorrente, pode fazê-lo a qualquer momento através do seu portal.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${projectUrl}" class="button">Ver Projeto</a>
              <a href="https://portal.imagineinstituto.com/doacoes" class="button secondary">Gerenciar Doações</a>
            </div>

            <p>Obrigado por sua generosidade contínua!</p>

            <p>Com gratidão,<br>
            <strong>Equipe Instituto Imagine</strong></p>

            <div class="footer">
              <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
              <p>Instituto Imagine - Transformando vidas através da educação e solidariedade</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Erro ao enviar lembrete recorrente:', result.error)
      return false
    }

    console.log('Lembrete recorrente enviado com sucesso:', result.data?.id)
    return true
  } catch (error) {
    console.error('Erro ao enviar lembrete recorrente:', error)
    return false
  }
}
