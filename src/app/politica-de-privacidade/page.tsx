import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjects } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Política de privacidade | Instituto Imagine',
  description: 'Como o Instituto Imagine coleta, usa e protege os dados de quem doa, é voluntário ou entra em contato.',
}

export default async function PoliticaDePrivacidadePage() {
  const projects = await getPublicSiteProjects()
  return <ImagineSitePage page="privacidade" projects={projects} />
}
