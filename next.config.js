/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração mínima para debug
  images: {
    domains: ['imagineinstituto.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig