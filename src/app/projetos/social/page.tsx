import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Ação Social e Comunidade | Instituto Imagine',
  description: 'Marmitas para quem está na rua, cestas básicas, Campanha do Agasalho e brinquedos novos no Natal Feliz. Doe pelo Pix para o projeto Ação Social e Comunidade do Instituto Imagine, em Uberlândia-MG.',
}

export default function SocialPage() {
  return <ImagineSitePage page="social" />
}
