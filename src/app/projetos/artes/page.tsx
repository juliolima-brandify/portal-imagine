import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Artes e Expressão | Instituto Imagine',
  description: 'Aulas contínuas de ballet, jazz, contemporâneo, hip hop e circo, e espetáculos que já entraram no calendário da cidade. Doe pelo Pix para o projeto Artes e Expressão do Instituto Imagine, em Uberlândia-MG.',
}

export default function ArtesPage() {
  return <ImagineSitePage page="artes" />
}
