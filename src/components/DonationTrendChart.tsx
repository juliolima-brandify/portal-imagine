'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface DonationTrendChartProps {
  labels: string[]
  values: number[]
  title?: string
  className?: string
  onChartReady?: (getImageDataUrl: () => string | undefined) => void
}

export default function DonationTrendChart({ labels, values, title = 'Evolução de Arrecadação', className = '', onChartReady }: DonationTrendChartProps) {
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!onChartReady) return
    const getter = () => chartRef.current?.toBase64Image?.()
    onChartReady(getter)
  }, [onChartReady, labels, values])

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Arrecadação',
        data: values,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }), [labels, values])

  const options = useMemo(() => ({
    responsive: true as const,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: false },
      title: { display: !!title, text: title }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
        }
      }
    }
  }), [title])

  return (
    <div className={className} style={{ height: 280 }}>
      <Line ref={chartRef} data={data} options={options as any} />
    </div>
  )
}


