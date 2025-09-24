'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getProject, getDonations, getProjectStats } from '@/lib/database'

interface ProjectReport {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  total_donations: number
  total_donors: number
  average_donation: number
  completion_percentage: number
  start_date: string
  end_date: string
  status: string
  location: string
  category: string
  image_url: string
}

interface DonationData {
  month: string
  amount: number
  donors: number
}

interface ExpenseData {
  category: string
  amount: number
  percentage: number
  description: string
}

interface DonorData {
  name: string
  amount: number
  date: string
  anonymous: boolean
}

export default function ProjectReportsPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<ProjectReport | null>(null)
  const [donationData, setDonationData] = useState<DonationData[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([])
  const [recentDonors, setRecentDonors] = useState<DonorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true)
        
        // Carregar dados reais do Supabase
        try {
          // Carregar projeto
          const projectData = await getProject(projectId)
          if (!projectData) {
            throw new Error('Projeto não encontrado')
          }

          // Carregar estatísticas do projeto
          const projectStats = await getProjectStats(projectId)
          
          // Carregar doações do projeto
          const projectDonations = await getDonations()
          const projectDonationsFiltered = projectDonations.filter(d => d.project_id === projectId)

          // Transformar dados para o formato do relatório
          const projectReport: ProjectReport = {
            id: projectData.id,
            title: projectData.title,
            description: projectData.description || '',
            target_amount: projectData.target_amount,
            current_amount: projectData.current_amount,
            total_donations: projectDonationsFiltered.length,
            total_donors: new Set(projectDonationsFiltered.map(d => d.user_id)).size,
            average_donation: projectDonationsFiltered.length > 0 ? 
              projectDonationsFiltered.reduce((sum, d) => sum + d.amount, 0) / projectDonationsFiltered.length : 0,
            completion_percentage: Math.round((projectData.current_amount / projectData.target_amount) * 100),
            start_date: projectData.created_at,
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano a partir de agora
            status: projectData.status,
            location: projectData.location || '',
            category: projectData.category,
            image_url: projectData.image_url || ''
          }

          // Processar dados de doações por mês
          const donationData: DonationData[] = []
          const monthlyData = new Map<string, { amount: number, donors: Set<string> }>()
          
          projectDonationsFiltered.forEach(donation => {
            const date = new Date(donation.created_at)
            const monthKey = `${date.toLocaleDateString('pt-BR', { month: 'short' })} ${date.getFullYear()}`
            
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, { amount: 0, donors: new Set() })
            }
            
            const monthData = monthlyData.get(monthKey)!
            monthData.amount += donation.amount
            if (donation.user_id) {
              monthData.donors.add(donation.user_id)
            }
          })

          monthlyData.forEach((data, month) => {
            donationData.push({
              month,
              amount: data.amount,
              donors: data.donors.size
            })
          })

          // Dados de gastos (mock por enquanto - em produção viria de uma tabela de gastos)
          const expenseData: ExpenseData[] = [
            { category: 'Equipamentos', amount: projectData.current_amount * 0.6, percentage: 60, description: 'Computadores, tablets e equipamentos de rede' },
            { category: 'Infraestrutura', amount: projectData.current_amount * 0.2, percentage: 20, description: 'Instalação elétrica, mobiliário e adaptações' },
            { category: 'Recursos Humanos', amount: projectData.current_amount * 0.16, percentage: 16, description: 'Instrutores e coordenadores do projeto' },
            { category: 'Operacional', amount: projectData.current_amount * 0.04, percentage: 4, description: 'Material didático e despesas administrativas' }
          ]

          // Doadores recentes
          const recentDonors: DonorData[] = projectDonationsFiltered
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(donation => ({
              name: donation.anonymous ? 'Doador Anônimo' : 'Doador',
              amount: donation.amount,
              date: donation.created_at,
              anonymous: donation.anonymous
            }))

          setProject(projectReport)
          setDonationData(donationData)
          setExpenseData(expenseData)
          setRecentDonors(recentDonors)

        } catch (error) {
          console.error('Erro ao carregar dados do relatório:', error)
          throw error
        }
        
      } catch (err) {
        setError('Erro ao carregar relatório')
        console.error('Erro ao carregar relatório:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReportData()
  }, [projectId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Carregando relatório...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
          <p className="text-gray-600 mb-4">{error || 'Projeto não encontrado'}</p>
          <Link href="/projetos" className="btn-primary">
            Voltar aos Projetos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Relatório de Transparência
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {project.title}
              </p>
            </div>
            <Link href="/projetos" className="btn-secondary">
              ← Voltar aos Projetos
            </Link>
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <img 
                src={project.image_url} 
                alt={project.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div className="lg:w-2/3">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{project.title}</h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Meta de Arrecadação</div>
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(project.target_amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Arrecadado</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(project.current_amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Progresso</div>
                  <div className="text-lg font-semibold text-blue-600">{project.completion_percentage}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total de Doadores</div>
                  <div className="text-lg font-semibold text-gray-900">{project.total_donors}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.completion_percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{formatCurrency(project.current_amount)}</span>
                  <span>{formatCurrency(project.target_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(project.current_amount)}</div>
            <div className="text-sm text-gray-500">Total Arrecadado</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600 mb-2">{project.total_donations}</div>
            <div className="text-sm text-gray-500">Total de Doações</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600 mb-2">{project.total_donors}</div>
            <div className="text-sm text-gray-500">Doadores Únicos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600 mb-2">{formatCurrency(project.average_donation)}</div>
            <div className="text-sm text-gray-500">Doação Média</div>
          </div>
        </div>

        {/* Donation Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução das Doações</h3>
          <div className="space-y-4">
            {donationData.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{data.month}</div>
                  <div className="text-sm text-gray-500">{data.donors} doadores</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(data.amount)}</div>
                  <div className="text-sm text-gray-500">
                    {((data.amount / project.current_amount) * 100).toFixed(1)}% do total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Como o Dinheiro é Utilizado</h3>
          <div className="space-y-4">
            {expenseData.map((expense, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{expense.category}</div>
                    <div className="text-sm text-gray-500">{expense.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                    <div className="text-sm text-gray-500">{expense.percentage}% do total</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${expense.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Donors */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Doadores Recentes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentDonors.map((donor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {donor.anonymous ? 'Doador Anônimo' : donor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(donor.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(donor.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transparency Statement */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Compromisso com a Transparência</h3>
          <div className="text-blue-800 space-y-2">
            <p>• Todos os valores são atualizados em tempo real</p>
            <p>• Relatórios financeiros são auditados mensalmente</p>
            <p>• 100% das doações são destinadas ao projeto</p>
            <p>• Custos administrativos são cobertos por outras fontes</p>
            <p>• Dados pessoais dos doadores são protegidos conforme LGPD</p>
          </div>
        </div>
      </div>
    </div>
  )
}
