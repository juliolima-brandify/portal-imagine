import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjects } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Instituto Imagine | Doe para projetos sociais em Uberlândia',
  description: 'Arte, esporte, educação, saúde emocional e ação social para crianças e famílias de Uberlândia-MG. Doe pelo Pix, simule a destinação do seu Imposto de Renda e acompanhe cada projeto.',
}

export default async function HomePage() {
  const projects = await getPublicSiteProjects()
  return <ImagineSitePage page="home" projects={projects} />
}
