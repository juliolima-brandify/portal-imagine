'use client'

import { useState, useRef, useEffect } from 'react'
import { exportReport } from '@/lib/export'

interface ExportDropdownProps {
  data: any
  filename: string
  className?: string
  disabled?: boolean
  onError?: (message: string) => void
}

export default function ExportDropdown({
  data,
  filename,
  className = '',
  disabled = false,
  onError,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (exporting) return
    setExporting(true)
    setExportError('')
    try {
      await exportReport(data, filename, { format })
      setIsOpen(false)
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível exportar o relatório.'
      setExportError(msg)
      onError?.(msg)
      setIsOpen(false)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || exporting}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {exporting ? 'Exportando...' : 'Exportar'}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            type="button"
            role="menuitem"
            disabled={exporting}
            onClick={() => void handleExport('pdf')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar PDF
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={exporting}
            onClick={() => void handleExport('excel')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={exporting}
            onClick={() => void handleExport('csv')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Exportar CSV
          </button>
        </div>
      )}

      {exportError && !onError && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {exportError}
        </p>
      )}
    </div>
  )
}

