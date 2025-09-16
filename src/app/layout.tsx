import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Instituto Imagine - Transformando vidas através da educação e solidariedade',
  description: 'Conectamos pessoas que querem ajudar com projetos que precisam de apoio, garantindo transparência total e impacto mensurável.',
  keywords: 'ONG, doações, educação, solidariedade, impacto social, projetos sociais',
  authors: [{ name: 'Instituto Imagine' }],
  openGraph: {
    title: 'Instituto Imagine',
    description: 'Transformando vidas através da educação e solidariedade',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
