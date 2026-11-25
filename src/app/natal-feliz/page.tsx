import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjects } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Natal Feliz 2026 | Instituto Imagine',
  description: 'Doe um brinquedo novo ou o valor dele pelo Pix para crianças de comunidades carentes de Uberlândia. Campanha Natal Feliz do Instituto Imagine.',
}

export default async function NatalFelizPage() {
  const projects = await getPublicSiteProjects()
  return <ImagineSitePage page="natal-feliz" projects={projects} />
}
