'use client'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export default function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-white"
    >
      {children}
    </a>
  )
}

