// =============================================
// FUNÇÕES DE EXPORTAÇÃO DE DADOS
// =============================================

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

// =============================================
// EXPORTAÇÃO CSV
// =============================================

export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  // Converter dados para CSV
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escapar aspas e vírgulas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// =============================================
// EXPORTAÇÃO PDF
// =============================================

export function exportToPDF(data: any[], filename: string, title: string, opts?: { chartImage?: string, chartCaption?: string }): void {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    const doc = new jsPDF()
    
    // Título do relatório
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    
    // Informações do cabeçalho
    doc.setFontSize(10)
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25)
    doc.text(`Total de registros: ${data.length}`, 14, 30)
    
    let tableStartY = 35

    // Inserir imagem do gráfico se disponível
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
      } catch (e) {
        // ignora erro de imagem e continua com tabela
      }
    }

    // Extrair cabeçalhos e linhas
    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(header => {
      const value = row[header]
      // Formatar valores
      if (typeof value === 'number') {
        return value.toLocaleString('pt-BR')
      }
      return value !== null && value !== undefined ? String(value) : ''
    }))
    
    // Gerar tabela
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: tableStartY }
    })
    
    // Baixar PDF
    doc.save(`${filename}.pdf`)
    
    console.log('PDF gerado com sucesso:', {
      filename: `${filename}.pdf`,
      records: data.length
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Verifique o console para mais detalhes.')
  }
}

// =============================================
// EXPORTAÇÃO EXCEL
// =============================================

export function exportToExcel(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Ajustar largura das colunas automaticamente
    const cols = Object.keys(data[0]).map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    ws['!cols'] = cols
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    
    // Gerar e baixar arquivo Excel
    XLSX.writeFile(wb, `${filename}.xlsx`)
    
    console.log('Excel gerado com sucesso:', {
      filename: `${filename}.xlsx`,
      records: data.length
    })
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    alert('Erro ao gerar Excel. Verifique o console para mais detalhes.')
  }
}

// =============================================
// EXPORTAÇÃO DE DOAÇÕES
// =============================================

export function exportDonations(donations: any[], options: ExportOptions): void {
  const filename = `doacoes_${new Date().toISOString().split('T')[0]}`
  
  // Filtrar dados se necessário
  let filteredData = donations
  
  if (options.filters) {
    if (options.filters.status) {
      filteredData = filteredData.filter(d => options.filters!.status!.includes(d.status))
    }
    if (options.filters.projectId) {
      filteredData = filteredData.filter(d => options.filters!.projectId!.includes(d.project_id))
    }
    if (options.filters.userId) {
      filteredData = filteredData.filter(d => options.filters!.userId!.includes(d.user_id))
    }
  }
  
  // Filtrar por data se especificado
  if (options.dateRange) {
    filteredData = filteredData.filter(d => {
      const donationDate = new Date(d.created_at)
      return donationDate >= options.dateRange!.start && donationDate <= options.dateRange!.end
    })
  }
  
  // Mapear dados para formato de exportação
  const exportData = filteredData.map(donation => ({
    'ID': donation.id,
    'Data': new Date(donation.created_at).toLocaleDateString('pt-BR'),
    'Valor': donation.amount,
    'Moeda': donation.currency,
    'Status': donation.status,
    'Método de Pagamento': donation.payment_method,
    'ID do Projeto': donation.project_id,
    'ID do Usuário': donation.user_id,
    'Recorrente': donation.is_recurring ? 'Sim' : 'Não',
    'Anônima': donation.anonymous ? 'Sim' : 'Não',
    'ID Stripe': donation.stripe_payment_intent_id,
    'Mensagem': donation.message || ''
  }))
  
  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      exportToPDF(exportData, filename, 'Relatório de Doações')
      break
    case 'excel':
      exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE PROJETOS
// =============================================

export function exportProjects(projects: any[], options: ExportOptions): void {
  const filename = `projetos_${new Date().toISOString().split('T')[0]}`
  
  const exportData = projects.map(project => ({
    'ID': project.id,
    'Título': project.title,
    'Descrição': project.description,
    'Categoria': project.category,
    'Valor Alvo': project.target_amount,
    'Valor Atual': project.current_amount,
    'Progresso (%)': Math.round((project.current_amount / project.target_amount) * 100),
    'Status': project.status,
    'Localização': project.location,
    'Organização': project.organization,
    'Data de Criação': new Date(project.created_at).toLocaleDateString('pt-BR'),
    'Data de Atualização': new Date(project.updated_at).toLocaleDateString('pt-BR')
  }))
  
  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      exportToPDF(exportData, filename, 'Relatório de Projetos')
      break
    case 'excel':
      exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE USUÁRIOS
// =============================================

export function exportUsers(users: any[], options: ExportOptions): void {
  const filename = `usuarios_${new Date().toISOString().split('T')[0]}`
  
  const exportData = users.map(user => ({
    'ID': user.id,
    'Nome': user.name,
    'Email': user.email,
    'Telefone': user.phone || '',
    'CPF': user.cpf || '',
    'Role': user.role,
    'Data de Criação': new Date(user.created_at).toLocaleDateString('pt-BR'),
    'Data de Atualização': new Date(user.updated_at).toLocaleDateString('pt-BR')
  }))
  
  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      exportToPDF(exportData, filename, 'Relatório de Usuários')
      break
    case 'excel':
      exportToExcel(exportData, filename)
      break
  }
}

// =============================================
// EXPORTAÇÃO DE RELATÓRIOS
// =============================================

export function exportReport(reportData: any, filename: string, options: ExportOptions): void {
  // Processar dados complexos de relatórios
  let exportData: any[] = []
  
  if (Array.isArray(reportData)) {
    exportData = reportData
  } else if (typeof reportData === 'object' && reportData !== null) {
    // Processar estrutura de relatório complexa
    exportData = processComplexReportData(reportData)
  } else {
    exportData = [reportData]
  }
  
  if (exportData.length === 0) {
    alert('Nenhum dado disponível para exportar')
    return
  }
  
  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      exportToPDF(
        exportData,
        filename,
        'Relatório Completo - Instituto Imagine',
        {
          chartImage: (reportData && reportData.__chartImage) ? reportData.__chartImage : undefined,
          chartCaption: (reportData && reportData.__chartCaption) ? reportData.__chartCaption : 'Evolução de Arrecadação'
        }
      )
      break
    case 'excel':
      exportToExcel(exportData, filename)
      break
  }
}

// Processar estrutura complexa de relatórios
function processComplexReportData(reportData: any): any[] {
  const exportData: any[] = []
  
  // Se tiver overview, adicionar métricas gerais
  if (reportData.overview) {
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total Arrecadado',
      'Valor': formatCurrencyForExport(reportData.overview.totalDonations || 0)
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total de Doadores',
      'Valor': reportData.overview.totalDonors || 0
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Projetos Ativos',
      'Valor': reportData.overview.activeProjects || 0
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Projetos Concluídos',
      'Valor': reportData.overview.completedProjects || 0
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Total de Voluntários',
      'Valor': reportData.overview.totalVolunteers || 0
    })
    exportData.push({
      'Seção': 'MÉTRICAS GERAIS',
      'Métrica': 'Doação Média',
      'Valor': formatCurrencyForExport(reportData.overview.averageDonation || 0)
    })
  }
  
  // Adicionar dados mensais
  if (reportData.monthlyData && Array.isArray(reportData.monthlyData)) {
    reportData.monthlyData.forEach((item: any) => {
      exportData.push({
        'Seção': 'ARRECADAÇÃO MENSAL',
        'Mês': item.month,
        'Valor': formatCurrencyForExport(item.donations || 0)
      })
    })
  }
  
  // Adicionar top projetos
  if (reportData.topProjects && Array.isArray(reportData.topProjects)) {
    reportData.topProjects.forEach((project: any) => {
      exportData.push({
        'Seção': 'TOP PROJETOS',
        'Projeto': project.name,
        'Valor Arrecadado': formatCurrencyForExport(project.amount || 0),
        'Doadores': project.donors || 0,
        'Progresso': `${project.progress || 0}%`
      })
    })
  }
  
  // Adicionar doações recentes
  if (reportData.recentDonations && Array.isArray(reportData.recentDonations)) {
    reportData.recentDonations.forEach((donation: any) => {
      exportData.push({
        'Seção': 'DOAÇÕES RECENTES',
        'Doador': donation.donor || 'N/A',
        'Projeto': donation.project || 'N/A',
        'Valor': formatCurrencyForExport(donation.amount || 0),
        'Data': donation.date ? new Date(donation.date).toLocaleDateString('pt-BR') : 'N/A'
      })
    })
  }
  
  return exportData
}

// =============================================
// UTILITÁRIOS
// =============================================

export function formatDateForExport(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

export function generateFilename(prefix: string, type: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}_${type}_${date}`
}

