// =============================================
// FUNÇÕES DE EXPORTAÇÃO DE DADOS
// =============================================

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
// EXPORTAÇÃO PDF (Simulada)
// =============================================

export function exportToPDF(data: any[], filename: string, title: string): void {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  // Simular geração de PDF
  const reportContent = generatePDFContent(data, title)
  
  // Em um cenário real, você usaria uma biblioteca como jsPDF ou Puppeteer
  // Por enquanto, vamos simular com um alert
  alert(`PDF "${filename}.pdf" seria gerado com ${data.length} registros.\n\nConteúdo:\n${reportContent.substring(0, 200)}...`)
  
  // Simular download
  console.log('PDF gerado:', {
    filename: `${filename}.pdf`,
    records: data.length,
    content: reportContent
  })
}

function generatePDFContent(data: any[], title: string): string {
  const headers = Object.keys(data[0])
  const content = [
    `RELATÓRIO: ${title}`,
    `Data de geração: ${new Date().toLocaleDateString('pt-BR')}`,
    `Total de registros: ${data.length}`,
    '',
    'DADOS:',
    headers.join(' | '),
    ...data.slice(0, 10).map(row => 
      headers.map(header => row[header]).join(' | ')
    ),
    data.length > 10 ? `... e mais ${data.length - 10} registros` : ''
  ].join('\n')
  
  return content
}

// =============================================
// EXPORTAÇÃO EXCEL (Simulada)
// =============================================

export function exportToExcel(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  // Simular geração de Excel
  alert(`Arquivo Excel "${filename}.xlsx" seria gerado com ${data.length} registros.`)
  
  // Em um cenário real, você usaria uma biblioteca como xlsx
  console.log('Excel gerado:', {
    filename: `${filename}.xlsx`,
    records: data.length,
    sheets: ['Dados', 'Resumo', 'Gráficos']
  })
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
  const exportData = Array.isArray(reportData) ? reportData : [reportData]
  
  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, filename)
      break
    case 'pdf':
      exportToPDF(exportData, filename, 'Relatório Avançado')
      break
    case 'excel':
      exportToExcel(exportData, filename)
      break
  }
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

