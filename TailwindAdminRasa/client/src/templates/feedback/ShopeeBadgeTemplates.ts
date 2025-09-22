import { TemplateDefinition } from '@/types/template';

/**
 * 🏷️ Shopee Badge Templates Collection
 * 
 * Collection of badge components extracted from Shopee interface:
 * - Live Badge (streaming indicator)
 * - Freeship Badge 
 * - Voucher Badge
 * - Discount Badge
 */

export const ShopeeLiveBadgeTemplate: TemplateDefinition = {
  id: 'shopee-live-badge',
  name: 'Shopee Live Badge',
  category: 'feedback',
  complexity: 'basic',
  description: 'Live streaming indicator badge with viewer count',
  version: '1.0.0',
  
  frameworks: ['react', 'vue', 'all'],
  platforms: ['mobile', 'web'],
  compatibleThemes: ['all'],
  requiresTheme: false,
  
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCA4MCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjMwIiByeD0iNCIgZmlsbD0iI0VGNDQ0NCIvPgo8dGV4dCB4PSI0MCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TElWRSAxLjJrPC90ZXh0Pgo8L3N2Zz4=',
    screenshots: [],
    liveDemo: '/demo/shopee-live-badge'
  },
  
  code: {
    react: {
      jsx: `import React from 'react';
import { Play, Users } from 'lucide-react';

interface LiveBadgeProps {
  viewerCount?: number;
  className?: string;
}

export function ShopeeLiveBadge({ viewerCount, className = "" }: LiveBadgeProps) {
  return (
    <div className={\`absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md \${className}\`}>
      <Play className="h-3 w-3 fill-white" />
      LIVE
      {viewerCount && (
        <span className="flex items-center gap-1 ml-1">
          <Users className="h-3 w-3" />
          {viewerCount > 1000 ? \`\${(viewerCount/1000).toFixed(1)}k\` : viewerCount}
        </span>
      )}
    </div>
  );
}`,
      dependencies: ['react', 'lucide-react'],
      devDependencies: ['@types/react']
    }
  },
  
  styles: {
    baseClasses: ['absolute', 'top-2', 'left-2', 'flex', 'items-center', 'gap-1', 'bg-red-500', 'text-white', 'px-2', 'py-1', 'rounded', 'text-xs', 'font-medium', 'shadow-md'],
    themeAwareClasses: ['bg-red-500', 'text-white'],
    responsiveClasses: {
      mobile: ['text-xs', 'px-2', 'py-1'],
      tablet: ['text-sm', 'px-3', 'py-1.5'],
      desktop: ['text-base', 'px-4', 'py-2']
    },
    cssVariables: ['--live-bg-color', '--live-text-color']
  },
  
  assets: [
    { type: 'icon', url: 'lucide-react/play', description: 'Play icon', required: true },
    { type: 'icon', url: 'lucide-react/users', description: 'Users icon', required: true }
  ],
  
  props: [
    {
      name: 'viewerCount',
      type: 'number',
      description: 'Number of viewers watching the live stream',
      required: false
    }
  ],
  
  documentation: {
    description: 'Live streaming indicator badge showing LIVE status and viewer count',
    usage: 'Use to indicate live streaming content with optional viewer count',
    examples: [
      {
        title: 'Basic Live Badge',
        description: 'Simple live indicator',
        code: '<ShopeeLiveBadge />'
      },
      {
        title: 'With Viewer Count',
        description: 'Live badge with viewer count',
        code: '<ShopeeLiveBadge viewerCount={11700} />'
      }
    ]
  },
  
  dependencies: [],
  variants: [],
  
  metadata: {
    author: 'Shopee Template Library',
    license: 'MIT',
    tags: ['badge', 'live', 'streaming', 'indicator'],
    industry: ['ecommerce', 'streaming', 'social'],
    useCase: ['live-streaming', 'product-showcase', 'real-time-indicator'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: false
  }
};

export const ShopeeFreeshipBadgeTemplate: TemplateDefinition = {
  id: 'shopee-freeship-badge',
  name: 'Shopee Freeship Badge',
  category: 'feedback',
  complexity: 'basic',
  description: 'Free shipping indicator badge',
  version: '1.0.0',
  
  frameworks: ['react', 'vue', 'all'],
  platforms: ['mobile', 'web'],
  compatibleThemes: ['all'],
  requiresTheme: false,
  
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA3MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0ZGNjYwMCIvPgo8dGV4dCB4PSIzNSIgeT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RlJFRVNISVA8L3RleHQ+Cjwvc3ZnPg==',
    screenshots: [],
    liveDemo: '/demo/shopee-freeship-badge'
  },
  
  code: {
    react: {
      jsx: `import React from 'react';

interface FreeshipBadgeProps {
  text?: string;
  className?: string;
}

export function ShopeeFreeshipBadge({ 
  text = "FREESHIP", 
  className = "" 
}: FreeshipBadgeProps) {
  return (
    <div className={\`absolute top-2 right-2 bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-md \${className}\`}>
      {text}
    </div>
  );
}`,
      dependencies: ['react'],
      devDependencies: ['@types/react']
    }
  },
  
  styles: {
    baseClasses: ['absolute', 'top-2', 'right-2', 'bg-orange-500', 'text-white', 'px-1.5', 'py-0.5', 'rounded', 'text-xs', 'font-medium', 'shadow-md'],
    themeAwareClasses: ['bg-orange-500', 'text-white'],
    responsiveClasses: {
      mobile: ['text-xs', 'px-1.5', 'py-0.5'],
      tablet: ['text-sm', 'px-2', 'py-1'],
      desktop: ['text-base', 'px-3', 'py-1.5']
    },
    cssVariables: ['--freeship-bg-color', '--freeship-text-color']
  },
  
  assets: [],
  
  props: [
    {
      name: 'text',
      type: 'string',
      description: 'Badge text content',
      required: false,
      defaultValue: 'FREESHIP'
    }
  ],
  
  documentation: {
    description: 'Free shipping badge indicator for products',
    usage: 'Use to highlight free shipping offers on products',
    examples: [
      {
        title: 'Default Freeship Badge',
        description: 'Standard freeship indicator',
        code: '<ShopeeFreeshipBadge />'
      },
      {
        title: 'Custom Text Badge',
        description: 'Badge with custom text',
        code: '<ShopeeFreeshipBadge text="FREE DELIVERY" />'
      }
    ]
  },
  
  dependencies: [],
  variants: [],
  
  metadata: {
    author: 'Shopee Template Library',
    license: 'MIT',
    tags: ['badge', 'freeship', 'delivery', 'promotion'],
    industry: ['ecommerce', 'retail'],
    useCase: ['product-promotion', 'shipping-indicator', 'offer-badge'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: false
  }
};