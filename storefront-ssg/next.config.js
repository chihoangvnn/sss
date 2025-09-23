/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static export for deployment
  output: 'export',
  trailingSlash: true,
  
  // Image optimization for static export
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'], // Cloudinary domain
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  },
  
  // Optimize builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Static generation configuration
  experimental: {
    optimizeCss: true,
  },
  
  // Generate static paths at build time
  async generateBuildId() {
    return `storefront-ssg-${Date.now()}`;
  },
}

module.exports = nextConfig