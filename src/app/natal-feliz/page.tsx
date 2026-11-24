import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Natal Feliz 2026 | Instituto Imagine',
  description: 'Doe um brinquedo novo ou o valor dele pelo Pix para crianças de comunidades carentes de Uberlândia. Campanha Natal Feliz do Instituto Imagine.',
}

export default function NatalFelizPage() {
  return <ImagineSitePage page="natal-feliz" />
}
