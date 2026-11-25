'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isInstitutionalPath } from '@/lib/imagine-site'

export default function ConditionalChat() {
  const pathname = usePathname()

  // Páginas onde o chat NÃO deve aparecer (inclui site institucional que já tem botão flutuante do WhatsApp)
  const excludePaths = [
    '/admin',
    '/embed/checkout',
    '/prototype/checkout',
    '/doacao-sucesso',
    '/auth',
    '/entrar',
  ]

  const shouldShowChat = !isInstitutionalPath(pathname) && !excludePaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!shouldShowChat) {
      if (typeof window.Tawk_API?.hideWidget === 'function') {
        try {
          window.Tawk_API.hideWidget()
        } catch {}
      }
      document.querySelectorAll<HTMLElement>('[id*="tawk"], .widget-visible').forEach((el) => {
        el.style.display = 'none'
      })
      return
    }

    if (typeof window.Tawk_API?.showWidget === 'function') {
      try {
        window.Tawk_API.showWidget()
      } catch {}
    }

    if (!document.querySelector('script[src*="embed.tawk.to"]')) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.innerHTML = `
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
      document.body.appendChild(script)
    }
  }, [pathname, shouldShowChat])

  return null
}

declare global {
  interface Window {
    Tawk_API: any
  }
}
