'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { 
  endOfDay, 
  endOfMonth, 
  endOfWeek,
  endOfQuarter,
  format, 
  startOfDay, 
  startOfMonth, 
  startOfWeek,
  startOfQuarter,
  subDays, 
  subMonths,
  subWeeks,
  subQuarters
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type PresetId = 'today' | 'yesterday' | 'lastWeek' | 'lastMonth' | 'lastQuarter' | 'custom'

interface DateRangePickerWithPresetsProps {
  start?: Date
  end?: Date
  onChange: (v: { start: Date; end: Date; presetId: PresetId }) => void
  className?: string
}

const PRESETS = [
  { id: 'today' as PresetId, label: 'Hoje' },
  { id: 'yesterday' as PresetId, label: 'Ontem' },
  { id: 'lastWeek' as PresetId, label: 'Última semana' },
  { id: 'lastMonth' as PresetId, label: 'Último mês' },
  { id: 'lastQuarter' as PresetId, label: 'Último trimestre' },
]

function getPresetRange(id: PresetId): { start: Date; end: Date } {
  const now = new Date()
  switch (id) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'yesterday': {
      const yesterday = subDays(now, 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    }
    case 'lastWeek': {
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      return { start: startOfDay(lastWeekStart), end: endOfDay(lastWeekEnd) }
    }
    case 'lastMonth': {
      const last = subMonths(now, 1)
      return { start: startOfMonth(last), end: endOfMonth(last) }
    }
    case 'lastQuarter': {
      const lastQ = subQuarters(now, 1)
      return { start: startOfQuarter(lastQ), end: endOfQuarter(lastQ) }
    }
    default:
      return { start: startOfDay(now), end: endOfDay(now) }
  }
}

export default function DateRangePickerWithPresets({ start, end, onChange, className = '' }: DateRangePickerWithPresetsProps) {
  // Inicializar sem data selecionada
  const defaultRange = useMemo(() => {
    if (start && end) return { from: start, to: end }
    return { from: undefined, to: undefined }
  }, [start, end])

  const [range, setRange] = useState<{ from?: Date; to?: Date }>(defaultRange)
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>(defaultRange)
  const [presetId, setPresetId] = useState<PresetId>('custom')
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'left' | 'right'>('left')
  const rootRef = useRef<HTMLDivElement>(null)

  // Sincronizar com props externas
  useEffect(() => {
    if (start && end) {
      setRange({ from: start, to: end })
      setTempRange({ from: start, to: end })
    }
  }, [start, end])

  // Formato: "28 Dez 22 – 10 Jan 23"
  const label = useMemo(() => {
    if (!range.from || !range.to) return 'Selecione um período'
    const s = format(range.from, 'dd MMM yy', { locale: ptBR })
    const e = format(range.to, 'dd MMM yy', { locale: ptBR })
    return `${s} – ${e}`
  }, [range.from, range.to])

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(ev.target as Node)) {
        setIsOpen(false)
        setTempRange(range) // Restaurar ao fechar
      }
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsOpen(false)
        setTempRange(range) // Restaurar ao fechar
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [range])

  const applyPreset = (id: PresetId) => {
    const { start, end } = getPresetRange(id)
    setPresetId(id)
    setRange({ from: start, to: end })
    setTempRange({ from: start, to: end })
    onChange({ start, end, presetId: id })
    setIsOpen(false)
  }

  const onSelect = (sel: any) => {
    setTempRange(sel)
    setPresetId('custom')
    // NÃO fechar - deixar usuário clicar em "Aplicar"
  }

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tempRange?.from && tempRange?.to) {
      setRange(tempRange)
      onChange({ start: startOfDay(tempRange.from), end: endOfDay(tempRange.to), presetId: 'custom' })
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPresetId('custom')
    setRange({ from: undefined, to: undefined })
    setTempRange({ from: undefined, to: undefined })
    // NÃO fechar - deixar popover aberto para usuário selecionar novas datas
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTempRange(range)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {/* Botão Principal */}
      <button
        type="button"
        className="
          w-full px-4 py-2.5 
          bg-white 
          border border-gray-300 
          rounded-xl 
          shadow-sm hover:shadow-md 
          transition-all duration-200
          flex items-center justify-between gap-3
          text-sm font-medium text-gray-700
          hover:border-[#2EB87E] hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-[#2EB87E] focus:ring-offset-2
        "
        onClick={(e) => {
          e.stopPropagation()
          
          // Calcular posição do popover
          if (rootRef.current && !isOpen) {
            const rect = rootRef.current.getBoundingClientRect()
            const spaceOnRight = window.innerWidth - rect.right
            const spaceOnLeft = rect.left
            
            // Popover tem ~720px de largura
            const popoverWidth = 720
            
            // Se não cabe à direita, abre à esquerda
            if (spaceOnRight < popoverWidth && spaceOnLeft > spaceOnRight) {
              setPosition('right')
            } else {
              setPosition('left')
            }
          }
          
          setIsOpen(o => !o)
          if (!isOpen) {
            setTempRange(range)
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left">{label}</span>
        <svg 
          className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown / Popover */}
      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-2
            bg-white 
            border border-gray-200 
            rounded-2xl 
            shadow-2xl 
            overflow-hidden
            w-full sm:w-[600px] md:w-[720px] max-w-[95vw]
            ${position === 'left' ? 'left-0' : 'right-0'}
          `}
          style={{
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row">
            {/* Coluna Esquerda: Atalhos */}
            <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 p-4 flex flex-col">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Atalhos Rápidos
              </h3>
              <div className="flex flex-col gap-1.5 flex-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      applyPreset(preset.id)
                    }}
                    className={`
                      px-3 py-2 rounded-lg text-left text-sm font-medium
                      transition-all duration-150
                      ${presetId === preset.id 
                        ? 'bg-[#2EB87E] text-white shadow-md' 
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                      }
                    `}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Botão Limpar */}
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleClear}
                className="
                  mt-4 px-3 py-2 
                  border border-gray-300 
                  rounded-lg 
                  text-sm font-medium text-gray-600
                  hover:bg-white hover:border-gray-400 hover:shadow-sm
                  transition-all duration-150
                "
              >
                Limpar
              </button>
            </div>

            {/* Coluna Direita: Calendário */}
            <div 
              className="flex-1 p-6 flex flex-col" 
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <style jsx global>{`
                .rdp-premium {
                  --rdp-cell-size: 40px;
                  font-family: 'Inter', 'Sora', system-ui, -apple-system, sans-serif;
                }
                
                .rdp-premium .rdp-months {
                  display: flex;
                  gap: 2rem;
                }
                
                .rdp-premium .rdp-month {
                  flex: 1;
                }
                
                .rdp-premium .rdp-caption {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding: 0.5rem 0 1rem 0;
                }
                
                .rdp-premium .rdp-caption_label {
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: #1F2937;
                }
                
                .rdp-premium .rdp-head_cell {
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: #6B7280;
                  text-transform: uppercase;
                }
                
                .rdp-premium .rdp-cell {
                  padding: 2px;
                }
                
                .rdp-premium .rdp-button {
                  border-radius: 0.5rem;
                  font-size: 0.875rem;
                  font-weight: 500;
                  transition: all 150ms ease-in-out;
                  border: none !important;
                  background: transparent;
                  cursor: pointer;
                  position: relative;
                }
                
                /* Hover em datas não selecionadas - IMPORTANTE */
                .rdp-premium .rdp-button:not([disabled]):not(.rdp-day_selected):not(.rdp-day_range_start):not(.rdp-day_range_end):not(.rdp-day_range_middle):hover {
                  background-color: #F3F4F6 !important;
                  color: #1F2937 !important;
                  transform: scale(1.05);
                }
                
                /* Dias selecionados (início e fim) */
                .rdp-premium .rdp-day_selected,
                .rdp-premium .rdp-day_range_start,
                .rdp-premium .rdp-day_range_end {
                  background-color: #2EB87E !important;
                  color: white !important;
                  font-weight: 700;
                }
                
                .rdp-premium .rdp-day_selected:hover,
                .rdp-premium .rdp-day_range_start:hover,
                .rdp-premium .rdp-day_range_end:hover {
                  background-color: #26A269 !important;
                  transform: scale(1.05);
                }
                
                /* Intervalo (dias do meio) */
                .rdp-premium .rdp-day_range_middle {
                  background-color: #E8F5F0 !important;
                  color: #047857 !important;
                  font-weight: 500;
                }
                
                .rdp-premium .rdp-day_range_middle:hover {
                  background-color: #D1F4E8 !important;
                  transform: scale(1.05);
                }
                
                /* Dia de hoje */
                .rdp-premium .rdp-day_today:not(.rdp-day_selected):not(.rdp-day_range_start):not(.rdp-day_range_end) {
                  font-weight: 700;
                  color: #2EB87E;
                  background-color: transparent;
                  box-shadow: inset 0 0 0 2px #2EB87E;
                }
                
                .rdp-premium .rdp-day_today:not(.rdp-day_selected):not(.rdp-day_range_start):not(.rdp-day_range_end):hover {
                  background-color: #F0FDF4 !important;
                  transform: scale(1.05);
                }
                
                /* Dias fora do mês */
                .rdp-premium .rdp-day_outside {
                  color: #D1D5DB;
                }
                
                .rdp-premium .rdp-day_outside:hover:not([disabled]) {
                  background-color: #F9FAFB !important;
                  transform: scale(1.05);
                }
                
                /* Dias desabilitados */
                .rdp-premium .rdp-day_disabled {
                  color: #E5E7EB !important;
                  cursor: not-allowed !important;
                  opacity: 0.4;
                }
                
                .rdp-premium .rdp-day_disabled:hover {
                  background-color: transparent !important;
                  transform: none !important;
                }
                
                /* Botões de navegação */
                .rdp-premium .rdp-nav_button {
                  width: 2rem;
                  height: 2rem;
                  border-radius: 0.5rem;
                  transition: all 150ms;
                  border: none;
                  background: transparent;
                }
                
                .rdp-premium .rdp-nav_button:hover:not([disabled]) {
                  background-color: #F3F4F6 !important;
                  transform: scale(1.1);
                }
                
                .rdp-premium .rdp-nav_button[disabled] {
                  opacity: 0.3;
                  cursor: not-allowed;
                }
                
                /* Remover outline padrão azul */
                .rdp-premium .rdp-button:focus-visible {
                  outline: 2px solid #2EB87E !important;
                  outline-offset: 2px;
                }
                
                .rdp-premium .rdp-button:focus {
                  outline: none !important;
                }
                
                /* Garantir que não há azul/roxo */
                .rdp-premium * {
                  accent-color: #2EB87E !important;
                }
              `}</style>
              
              <div className="flex-1">
                <DayPicker
                  mode="range"
                  selected={tempRange?.from && tempRange?.to ? { from: tempRange.from, to: tempRange.to } : undefined}
                  onSelect={onSelect}
                  locale={ptBR}
                  numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                  weekStartsOn={1}
                  showOutsideDays
                  className="rdp-premium"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleCancel}
                  className="
                    px-5 py-2.5 
                    text-sm font-medium text-gray-700
                    hover:bg-gray-100
                    rounded-lg
                    transition-all duration-150
                  "
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleApply}
                  disabled={!tempRange?.from || !tempRange?.to}
                  className="
                    px-5 py-2.5 
                    bg-[#2EB87E] text-white
                    text-sm font-semibold
                    rounded-lg
                    hover:bg-[#26A269]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150
                    shadow-sm hover:shadow-md
                  "
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
