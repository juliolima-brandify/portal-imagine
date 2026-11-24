import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Para empresas | Instituto Imagine',
  description: 'Patrocínio de projetos, cotas, doação de produtos, voluntariado corporativo e campanha de Imposto de Renda com colaboradores. Seja parceiro do Instituto Imagine em Uberlândia.',
}

export default function EmpresasPage() {
  return <ImagineSitePage page="empresas" />
}
