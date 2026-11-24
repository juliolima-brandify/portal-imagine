import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Educação | Instituto Imagine',
  description: 'Reforço escolar, oficinas, cursos de capacitação e incentivo à leitura para abrir portas. Doe pelo Pix para o projeto Educação do Instituto Imagine, em Uberlândia-MG.',
}

export default function EducacaoPage() {
  return <ImagineSitePage page="educacao" />
}
