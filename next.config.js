/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para CapRover - standalone output
  output: 'standalone',
  
  // Configurações para o subdomínio
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/auth',
  //       permanent: false,
  //     },
  //   ]
  // },
  
  // Configurações de imagem para otimização
  images: {
    domains: ['imagineinstituto.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

