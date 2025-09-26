/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static export for SEO pages
  output: 'export',
  trailingSlash: true,
  
  // Image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Base path for deployment (có thể thay đổi sau)
  basePath: process.env.NODE_ENV === 'production' ? '/lich-van-nien' : '',
  
  // Environment variables
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  },
  
  // Optimize builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Static generation configuration
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig