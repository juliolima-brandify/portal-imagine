'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ConditionalChat() {
  const pathname = usePathname()

  // Páginas onde o chat NÃO deve aparecer
  const excludePaths = [
    '/admin',
    '/embed/checkout',
    '/prototype/checkout',
    '/doacao-sucesso',
    '/auth'
  ]

  // Verificar se a página atual deve ter chat
  const shouldShowChat = !excludePaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Se não deve mostrar chat, remover se já existir
    if (!shouldShowChat) {
      // Remover script do Tawk.to se existir
      const existingScript = document.querySelector('script[src*="embed.tawk.to"]')
      if (existingScript) {
        existingScript.remove()
      }

      // Esconder widget se existir
      const tawkWidget = document.querySelector('#tawk-widget') as HTMLElement
      if (tawkWidget) {
        tawkWidget.style.display = 'none'
      }

      // Parar Tawk.to se estiver rodando
      if (window.Tawk_API) {
        window.Tawk_API.hideWidget()
      }

      return
    }

    // Se deve mostrar chat, carregar o script
    if (shouldShowChat && !document.querySelector('script[src*="embed.tawk.to"]')) {
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

  // Este componente não renderiza nada visualmente
  return null
}

// Declaração global para TypeScript
declare global {
  interface Window {
    Tawk_API: any
  }
}
