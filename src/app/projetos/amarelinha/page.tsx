import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Projeto Amarelinha | Instituto Imagine',
  description: 'Contraturno escolar como tempo de convivência, cuidado e descoberta. Cada atividade tem uma intenção. Doe pelo Pix para o projeto Projeto Amarelinha do Instituto Imagine, em Uberlândia-MG.',
}

export default function AmarelinhaPage() {
  return <ImagineSitePage page="amarelinha" />
}
