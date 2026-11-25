import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import ImagineSitePage from '@/components/site/ImagineSitePage'
import { getPublicSiteProjectBySlug } from '@/lib/site-projects-server'

export const dynamic = 'force-dynamic'

interface ProjetoPublicoPageProps {
  params: { id: string } | Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjetoPublicoPageProps): Promise<Metadata> {
  const { id } = await Promise.resolve(params)
  const { project } = await getPublicSiteProjectBySlug(id)

  if (!project) {
    return {
      title: 'Projeto não encontrado | Instituto Imagine',
    }
  }

  return {
    title: `${project.titulo} | Instituto Imagine`,
    description: project.resumo
      ? `${project.resumo} Doe pelo Pix para o projeto ${project.titulo} do Instituto Imagine, em Uberlândia-MG.`
      : `Conheça e apoie o projeto ${project.titulo} do Instituto Imagine, em Uberlândia-MG.`,
  }
}

export default async function ProjetoPublicoPage({ params }: ProjetoPublicoPageProps) {
  const { id } = await Promise.resolve(params)
  const { project, allProjects } = await getPublicSiteProjectBySlug(id)

  if (!project) {
    notFound()
  }

  // Canonicaliza URLs com maiúsculas, acentos, underscores ou UUID para /projetos/<slug>
  if (id !== project.id) {
    redirect(`/projetos/${project.id}`)
  }

  return (
    <ImagineSitePage
      page="projeto"
      projects={allProjects}
      activeProject={project}
    />
  )
}
