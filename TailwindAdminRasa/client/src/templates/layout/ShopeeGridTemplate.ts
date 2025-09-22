import { TemplateDefinition } from '@/types/template';

/**
 * 📱 Shopee Grid Layout Template
 * 
 * 2-column responsive grid layout for product display
 * exactly matching Shopee's mobile product grid
 */
export const ShopeeGridTemplate: TemplateDefinition = {
  id: 'shopee-grid-layout',
  name: 'Shopee Grid Layout',
  category: 'layout',
  complexity: 'basic',
  description: '2-column responsive grid layout optimized for mobile product display',
  version: '1.0.0',
  
  frameworks: ['react', 'vue', 'all'],
  platforms: ['mobile', 'web'],
  compatibleThemes: ['all'],
  requiresTheme: false,
  
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDIwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI5MiIgaGVpZ2h0PSIxMTYiIHJ4PSI0IiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHN2ZyB4PSI0NCIgeT0iNTIiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRDFENU5CIj4KPHBhdGggZD0ibTEyIDIgNy4wOSA0djhsLTcuMDkgNEw0LjkxIDE0VjZMMTIgMnoiLz4KPC9zdmc+CjxyZWN0IHg9IjEwNCIgeT0iNCIgd2lkdGg9IjkyIiBoZWlnaHQ9IjExNiIgcng9IjQiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0U1RTdFQiIvPgo8c3ZnIHg9IjE0NCIgeT0iNTIiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRDFENURCIj4KPHBhdGggZD0ibTEyIDIgNy4wOSA0djhsLTcuMDkgNEw0LjkxIDE0VjZMMTIgMnoiLz4KPC9zdmc+CjxyZWN0IHg9IjQiIHk9IjEyNCIgd2lkdGg9IjkyIiBoZWlnaHQ9IjExNiIgcng9IjQiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0U1RTdFQiIvPgo8c3ZnIHg9IjQ0IiB5PSIxNzIiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRDFENURCIj4KPHBhdGggZD0ibTEyIDIgNy4wOSA0djhsLTcuMDkgNEw0LjkxIDE0VjZMMTIgMnoiLz4KPC9zdmc+CjxyZWN0IHg9IjEwNCIgeT0iMTI0IiB3aWR0aD0iOTIiIGhlaWdodD0iMTE2IiByeD0iNCIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTVFN0VCIi8+CjxzdmcgeD0iMTQ0IiB5PSIxNzIiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRDFENURCIj4KPHBhdGggZD0ibTEyIDIgNy4wOSA0djhsLTcuMDkgNEw0LjkxIDE0VjZMMTIgMnoiLz4KPC9zdmc+Cjx0ZXh0IHg9IjEwMCIgeT0iMjU2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjItQ29sdW1uIEdyaWQ8L3RleHQ+Cjwvc3ZnPg==',
    screenshots: ['shopee-grid-layout.png'],
    liveDemo: '/demo/shopee-grid'
  },
  
  code: {
    react: {
      jsx: `import React from 'react';

interface ShopeeGridProps {
  children: React.ReactNode;
  gap?: number;
  padding?: number;
  className?: string;
}

export function ShopeeGrid({
  children,
  gap = 1,
  padding = 2,
  className = ""
}: ShopeeGridProps) {
  return (
    <div 
      className={\`grid grid-cols-2 gap-\${gap} p-\${padding} bg-gray-50 min-h-screen \${className}\`}
      style={{
        gap: \`\${gap * 0.25}rem\`,
        padding: \`\${padding * 0.5}rem\`
      }}
    >
      {children}
    </div>
  );
}`,
      dependencies: ['react'],
      devDependencies: ['@types/react']
    }
  },
  
  styles: {
    baseClasses: ['grid', 'grid-cols-2', 'gap-1', 'p-2', 'bg-gray-50', 'min-h-screen'],
    themeAwareClasses: ['bg-gray-50'],
    responsiveClasses: {
      mobile: ['grid-cols-2', 'gap-1', 'p-2'],
      tablet: ['grid-cols-3', 'gap-2', 'p-4'],
      desktop: ['grid-cols-4', 'gap-4', 'p-6']
    },
    cssVariables: ['--grid-gap', '--grid-padding', '--grid-bg']
  },
  
  assets: [],
  
  props: [
    {
      name: 'children',
      type: 'node',
      description: 'Grid items to display',
      required: true
    },
    {
      name: 'gap',
      type: 'number',
      description: 'Gap between grid items',
      required: false,
      defaultValue: 1
    },
    {
      name: 'padding',
      type: 'number',
      description: 'Padding around the grid',
      required: false,
      defaultValue: 2
    }
  ],
  
  documentation: {
    description: '2-column responsive grid layout optimized for mobile product display, matching Shopee design',
    usage: 'Wrap product cards or other items in this grid for mobile-optimized layout',
    examples: [
      {
        title: 'Product Grid',
        description: 'Basic product grid layout',
        code: `<ShopeeGrid>
  <ProductCard product={product1} />
  <ProductCard product={product2} />
  <ProductCard product={product3} />
</ShopeeGrid>`
      }
    ]
  },
  
  dependencies: [],
  variants: [],
  
  metadata: {
    author: 'Shopee Template Library',
    license: 'MIT',
    tags: ['layout', 'grid', 'responsive', 'mobile'],
    industry: ['ecommerce', 'retail'],
    useCase: ['product-listing', 'grid-layout', 'mobile-layout'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: false
  }
};