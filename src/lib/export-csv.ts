import { sanitizeSpreadsheetCell } from './payments'

/**
 * Data de hoje no fuso de São Paulo (evita nome de arquivo com dia errado por UTC).
 */
export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Exportação CSV leve (sem dependências de PDF/Excel) com proteção contra CSV Formula Injection.
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado disponível para exportar.')
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.map((h) => `"${sanitizeSpreadsheetCell(h).replace(/"/g, '""')}"`).join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const rawValue = row[header]
          if (rawValue === null || rawValue === undefined) return ''
          if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
            return String(rawValue)
          }
          const safe = sanitizeSpreadsheetCell(rawValue)
          return `"${safe.replace(/"/g, '""')}"`
        })
        .join(',')
    ),
  ].join('\n')

  // BOM UTF-8 para o Excel reconhecer acentos (correção da banca R3).
  const blob = new Blob(['﻿', csvContent], { type: 'text/csv;charset=utf-8;' })
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
