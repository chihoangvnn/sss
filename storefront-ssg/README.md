# Storefront SSG - Next.js Static Site Generation

## Overview

This is a high-performance storefront frontend built with Next.js and Static Site Generation (SSG) for optimal loading speed and SEO. It connects to the Replit backend API to fetch storefront data and generate static pages at build time.

## Features

- ⚡ **Static Site Generation (SSG)** - Pre-generated pages for lightning-fast loading
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🖼️ **Image Optimization** - Cloudinary integration with automatic WebP/AVIF conversion
- 🎨 **Dynamic Theming** - Custom colors and themes per storefront
- 🛒 **E-commerce Ready** - Product display, order forms, payment integration
- 🔄 **Incremental Static Regeneration (ISR)** - Automatic updates without rebuilds

## Architecture

### Build Time (SSG)
- `getStaticPaths` generates routes for all active storefronts
- `getStaticProps` fetches data and pre-renders pages
- Images are optimized and served via Cloudinary CDN

### Runtime (Client-side)
- Order form submissions via runtime API
- Dynamic features like cart and checkout
- RASA chatbot integration for customer support

## Development

### Prerequisites
- Node.js 18+ 
- Replit backend running on port 5000

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with your backend URL
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
```

### Export Static Files
```bash
npm run export
```

## Deployment

### Vercel (Recommended)
1. Connect your Git repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on Git push

### Manual Deployment
1. Run `npm run build && npm run export`
2. Upload `out/` directory to any static hosting

## Configuration

### API Integration
Configure backend URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.replit.dev
```

### Build Optimization
- Pages revalidate every hour (3600 seconds)
- Images are optimized with multiple formats and sizes
- CSS is automatically purged and minified

## Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.0s

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+