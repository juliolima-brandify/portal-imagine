import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjects } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Para empresas | Instituto Imagine',
  description: 'Patrocínio de projetos, cotas, doação de produtos, voluntariado corporativo e campanha de Imposto de Renda com colaboradores. Seja parceiro do Instituto Imagine em Uberlândia.',
}

export default async function EmpresasPage() {
  const projects = await getPublicSiteProjects()
  return <ImagineSitePage page="empresas" projects={projects} />
}
