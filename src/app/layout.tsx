import type { Metadata } from 'next'
import './globals.css'
import GlobalLayout from '@/components/GlobalLayout'

export const metadata: Metadata = {
  title: 'Instituto Imagine - Transformando vidas através da educação e solidariedade',
  description: 'Conectamos pessoas que querem ajudar com projetos que precisam de apoio, garantindo transparência total e impacto mensurável.',
  keywords: 'ONG, doações, educação, solidariedade, impacto social, projetos sociais',
  authors: [{ name: 'Instituto Imagine' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/favicon.png',
  },
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
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
      <body 
        style={{ fontFamily: 'Instrument Sans, sans-serif' }}
        suppressHydrationWarning={true}
      >
        <GlobalLayout>{children}</GlobalLayout>
        
        {/* Tawk.to Chat Widget */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/68e24c4c3d75f81955bf6194/1j6pvk2tb';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `
          }}
        />
      </body>
    </html>
  )
}