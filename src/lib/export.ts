// =============================================
// FUNÇÕES DE EXPORTAÇÃO DE DADOS
// =============================================

import { exportToCSV, todayInSaoPaulo } from './export-csv'
import {
  SAO_PAULO_TIME_ZONE,
  getDonationDestinationLabel,
  getDonationStatusLabelPTBR,
  getRecognizedDonationAmountBrl,
  normalizePaymentMethodLabel,
  sanitizeSpreadsheetCell,
} from './payments'

export { exportToCSV, todayInSaoPaulo }

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel'
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: {
    status?: string[]
    projectId?: string[]
    userId?: string[]
  }
  // Opcional: imagem do gráfico para incluir no PDF (data URL base64)
  chartImage?: string
}

function sanitizeRowForSpreadsheet(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'string' ? sanitizeSpreadsheetCell(value) : value
  }
  return out
}

// =============================================
// EXPORTAÇÃO PDF (Dynamic Import)
// =============================================

export async function exportToPDF(
  data: any[],
  filename: string,
  title: string,
  opts?: { chartImage?: string; chartCaption?: string }
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado disponível para exportar.')
  }

  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(title, 14, 15)

    doc.setFontSize(10)
    doc.text(
      `Data de geração: ${new Date().toLocaleDateString('pt-BR', { timeZone: SAO_PAULO_TIME_ZONE })}`,
      14,
      25
    )
    doc.text(`Total de registros: ${data.length}`, 14, 30)

    let tableStartY = 35

    if (opts?.chartImage) {
      try {
        const pageWidth = doc.internal.pageSize.getWidth()
        const left = 14
        const right = 14
        const width = pageWidth - left - right
        const height = 60
        doc.addImage(opts.chartImage, 'PNG', left, 35, width, height)
        if (opts.chartCaption) {
          doc.text(opts.chartCaption, left, 35 + height + 6)
        }
        tableStartY = 35 + height + 12
      } catch {
        // ignora erro de imagem e continua com tabela
      }
    }

    const headers = Object.keys(data[0])
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        if (typeof value === 'number') {
          return value.toLocaleString('pt-BR')
        }
        return value !== null && value !== undefined ? String(value) : ''
      })
    )

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: tableStartY },
    })

    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw new Error('Não foi possível gerar o arquivo PDF. Tente novamente.')
  }
}

// =============================================
// EXPORTAÇÃO EXCEL (Dynamic Import)
// =============================================

export async function exportToExcel(data: any[], filename: string): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado disponível para exportar.')
  }

  try {
    const XLSX = await import('xlsx')
    const safeRows = data.map((row) => sanitizeRowForSpreadsheet(row))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(safeRows)

    const cols = Object.keys(safeRows[0]).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...safeRows.map((row) => String(row[key] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    ws['!cols'] = cols

    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    throw new Error('Não foi possível gerar o arquivo Excel. Tente novamente.')
  }
}

// =============================================
// EXPORTAÇÃO DE DOAÇÕES
// =============================================

export async function exportDonations(donations: any[], options: ExportOptions): Promise<void> {
  const filename = `doacoes_${todayInSaoPaulo()}`

  let filteredData = donations

  if (options.filters) {
    if (options.filters.status) {
      filteredData = filteredData.filter((d) => options.filters!.status!.includes(d.status))
    }
    if (options.filters.projectId) {
      filteredData = filteredData.filter((d) => options.filters!.projectId!.includes(d.project_id))
    }
    if (options.filters.userId) {
      filteredData = filteredData.filter((d) => options.filters!.userId!.includes(d.user_id))
    }
  }

  if (options.dateRange) {
    filteredData = filteredData.filter((d) => {
      const donationDate = new Date(d.created_at)
      return donationDate >= options.dateRange!.start && donationDate <= options.dateRange!.end
    })
  }

  const exportData = filteredData.map((donation) => ({
    'ID': sanitizeSpreadsheetCell(donation.id),
    'Data': new Date(donation.created_at).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
    }),
    'Destino': sanitizeSpreadsheetCell(
      getDonationDestinationLabel({
        projectTitle: donation.projects?.title || donation.projectTitle || null,
        campaignSlug: donation.campaign_slug || null,
        projectId: donation.project_id || null,
      })
    ),
    'Valor': donation.amount,
    'Estornado': Number(donation.refunded_amount) || 0,
    'Líquido': getRecognizedDonationAmountBrl(donation),
    'Moeda': donation.currency || 'BRL',
    'Status': sanitizeSpreadsheetCell(getDonationStatusLabelPTBR(donation.status)),
    'Método de Pagamento': sanitizeSpreadsheetCell(
      normalizePaymentMethodLabel(donation.payment_method)
    ),
    'Recorrente': donation.is_recurring ? 'Sim' : 'Não',
    'Anônima': donation.anonymous ? 'Sim' : 'Não',
    'ID Transação': sanitizeSpreadsheetCell(
      donation.asaas_payment_id ||
        donation.asaas_checkout_id ||
        ''
    ),
    'Mensagem': sanitizeSpreadsheetCell(donation.message || ''),
  }))

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      await exportToPDF(exportData, filename, 'Relatório de Doações')
      break
    case 'excel':
      await exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE PROJETOS
// =============================================

export async function exportProjects(projects: any[], options: ExportOptions): Promise<void> {
  const filename = `projetos_${todayInSaoPaulo()}`

  const exportData = projects.map((project) => ({
    'ID': sanitizeSpreadsheetCell(project.id),
    'Título': sanitizeSpreadsheetCell(project.title),
    'Descrição': sanitizeSpreadsheetCell(project.description || ''),
    'Categoria': sanitizeSpreadsheetCell(project.category || ''),
    'Valor Alvo': project.target_amount,
    'Valor Atual': project.current_amount,
    'Progresso (%)': project.target_amount
      ? Math.round((project.current_amount / project.target_amount) * 100)
      : 0,
    'Status': sanitizeSpreadsheetCell(project.status),
    'Localização': sanitizeSpreadsheetCell(project.location || ''),
    'Organização': sanitizeSpreadsheetCell(project.organization || ''),
    'Data de Criação': new Date(project.created_at).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
    }),
    'Data de Atualização': new Date(project.updated_at).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
    }),
  }))

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      await exportToPDF(exportData, filename, 'Relatório de Projetos')
      break
    case 'excel':
      await exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE USUÁRIOS
// =============================================

export async function exportUsers(users: any[], options: ExportOptions): Promise<void> {
  const filename = `usuarios_${todayInSaoPaulo()}`

  const exportData = users.map((user) => ({
    'ID': sanitizeSpreadsheetCell(user.id),
    'Nome': sanitizeSpreadsheetCell(user.name || ''),
    'Email': sanitizeSpreadsheetCell(user.email || ''),
    'Telefone': sanitizeSpreadsheetCell(user.phone || ''),
    'CPF': sanitizeSpreadsheetCell(user.cpf || ''),
    'Role': sanitizeSpreadsheetCell(user.role || ''),
    'Data de Criação': new Date(user.created_at).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
    }),
    'Data de Atualização': new Date(user.updated_at).toLocaleDateString('pt-BR', {
      timeZone: SAO_PAULO_TIME_ZONE,
    }),
  }))

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      await exportToPDF(exportData, filename, 'Relatório de Usuários')
      break
    case 'excel':
      await exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE RELATÓRIOS
// =============================================

export async function exportReport(reportData: any, filename: string, options: ExportOptions): Promise<void> {
  let exportData: any[] = []

  if (Array.isArray(reportData)) {
    exportData = reportData
  } else if (typeof reportData === 'object' && reportData !== null) {
    exportData = processComplexReportData(reportData)
  } else {
    exportData = [reportData]
  }

  if (exportData.length === 0) {
    throw new Error('Nenhum dado disponível para exportar.')
  }

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      await exportToPDF(exportData, filename, 'Relatório Completo - Instituto Imagine', {
        chartImage: reportData && reportData.__chartImage ? reportData.__chartImage : undefined,
        chartCaption:
          reportData && reportData.__chartCaption
            ? reportData.__chartCaption
            : 'Evolução de Arrecadação',
      })
      break
    case 'excel':
      await exportToExcel(exportData, filename)
      break
  }
}

function processComplexReportData(reportData: any): any[] {
  const exportData: any[] = []

  if (reportData.overview) {
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total Arrecadado',
      'Valor': formatCurrencyForExport(reportData.overview.totalDonations || 0),
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total de Doadores',
      'Valor': reportData.overview.totalDonors || 0,
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Projetos Ativos',
      'Valor': reportData.overview.activeProjects || 0,
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Projetos Concluídos',
      'Valor': reportData.overview.completedProjects || 0,
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total de Voluntários',
      'Valor': reportData.overview.totalVolunteers || 0,
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Doação Média',
      'Valor': formatCurrencyForExport(reportData.overview.averageDonation || 0),
    })
  }

  if (reportData.monthlyData && Array.isArray(reportData.monthlyData)) {
    reportData.monthlyData.forEach((item: any) => {
      exportData.push({
        'Seção': 'ARRECADAÇÃO MENSAL',
        'Mês': sanitizeSpreadsheetCell(item.month),
        'Valor': formatCurrencyForExport(item.donations || 0),
      })
    })
  }

  if (reportData.topProjects && Array.isArray(reportData.topProjects)) {
    reportData.topProjects.forEach((project: any) => {
      exportData.push({
        'Seção': 'TOP PROJETOS',
        'Projeto': sanitizeSpreadsheetCell(project.name),
        'Valor Arrecadado': formatCurrencyForExport(project.amount || 0),
        'Doadores': project.donors || 0,
        'Progresso': `${project.progress || 0}%`,
      })
    })
  }

  if (reportData.recentDonations && Array.isArray(reportData.recentDonations)) {
    reportData.recentDonations.forEach((donation: any) => {
      exportData.push({
        'Seção': 'DOAÇÕES RECENTES',
        'Doador': sanitizeSpreadsheetCell(donation.donor || 'N/A'),
        'Projeto': sanitizeSpreadsheetCell(donation.project || 'N/A'),
        'Valor': formatCurrencyForExport(donation.amount || 0),
        'Data': donation.date
          ? new Date(donation.date).toLocaleDateString('pt-BR', { timeZone: SAO_PAULO_TIME_ZONE })
          : 'N/A',
      })
    })
  }

  return exportData
}

// =============================================
// UTILITÁRIOS
// =============================================

export function formatDateForExport(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: SAO_PAULO_TIME_ZONE })
}

export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function generateFilename(prefix: string, type: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}_${type}_${date}`
}
