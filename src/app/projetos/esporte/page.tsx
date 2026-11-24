import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Esporte e Juventude | Instituto Imagine',
  description: 'Aulas de esporte e acompanhamento contínuo para formar disciplina, cooperação e confiança. Doe pelo Pix para o projeto Esporte e Juventude do Instituto Imagine, em Uberlândia-MG.',
}

export default function EsportePage() {
  return <ImagineSitePage page="esporte" />
}
