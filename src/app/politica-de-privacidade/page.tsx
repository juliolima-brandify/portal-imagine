import type { Metadata } from 'next'
import ImagineSitePage from '@/components/site/ImagineSitePage'

export const metadata: Metadata = {
  title: 'Política de privacidade | Instituto Imagine',
  description: 'Como o Instituto Imagine coleta, usa e protege os dados de quem doa, é voluntário ou entra em contato.',
}

export default function PoliticaDePrivacidadePage() {
  return <ImagineSitePage page="privacidade" />
}
