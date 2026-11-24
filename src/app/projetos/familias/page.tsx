import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Saúde Emocional e Famílias Atípicas | Instituto Imagine',
  description: 'Acompanhamento psicossocial e espaços de escuta para famílias atípicas e para quem atravessa desafios emocionais. Doe pelo Pix para o projeto Saúde Emocional e Famílias Atípicas do Instituto Imagine, em Uberlândia-MG.',
}

export default function FamiliasPage() {
  return <ImagineSitePage page="familias" />
}
