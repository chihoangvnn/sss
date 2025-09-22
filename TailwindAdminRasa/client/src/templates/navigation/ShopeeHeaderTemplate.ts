import { TemplateDefinition } from '@/types/template';

/**
 * 📱 Shopee Mobile Header Template
 * 
 * Complete mobile header with status bar, search functionality, and cart icon
 * exactly matching Shopee's mobile app interface
 */
export const ShopeeHeaderTemplate: TemplateDefinition = {
  id: 'shopee-mobile-header',
  name: 'Shopee Mobile Header',
  category: 'navigation',
  complexity: 'intermediate', 
  description: 'Mobile-first header with status bar simulation, search bar, camera icon, and shopping cart with badge counter',
  version: '1.0.0',
  
  // Targeting
  frameworks: ['react', 'vue', 'all'],
  platforms: ['mobile', 'web'],
  
  // Theme Compatibility
  compatibleThemes: ['all'],
  requiresTheme: false,
  themeOverrides: {
    colorPalette: {
      primary: '#ee4d2d',    // Shopee Orange
      onPrimary: '#ffffff',  // White text
      surface: '#ffffff',    // White input background
      onSurface: '#333333'   // Dark input text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc1IiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDM3NSAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNzUiIGhlaWdodD0iMTAwIiBmaWxsPSIjRUU0RDJEIi8+Cjx0ZXh0IHg9IjE2IiB5PSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjRkZGRkZGIj4yMTo1NDwvdGV4dD4KPHN2ZyB4PSIzMjAiIHk9IjEwIiB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCA0MCAyMCIgZmlsbD0ibm9uZSI+CjxyZWN0IHg9IjAiIHk9IjgiIHdpZHRoPSIyIiBoZWlnaHQ9IjEyIiByeD0iMSIgZmlsbD0iI0ZGRkZGRiIvPgo8cmVjdCB4PSI0IiB5PSI2IiB3aWR0aD0iMiIgaGVpZ2h0PSIxNCIgcng9IjEiIGZpbGw9IiNGRkZGRkYiLz4KPHN2ZyB4PSIzNDAiIHk9IjEyIiB3aWR0aD0iMjQiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAxNiIgZmlsbD0ibm9uZSI+Cjx0ZXh0IHg9IjAiIHk9IjEyIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNGRkZGRkYiPjVHPC90ZXh0Pgo8L3N2Zz4KPC9zdmc+CjxyZWN0IHg9IjE2IiB5PSI0MCIgd2lkdGg9IjI4MCIgaGVpZ2h0PSI0MCIgcng9IjgiIGZpbGw9IiNGRkZGRkYiLz4KPHN2ZyB4PSIyNzQiIHk9IjU0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxIDMgM0wyMSA0SDE1bC0zLTN6bTAgMHY1SDE0TTIzIDNWN2EuOTcuOTcgMCAwIDEtLjc1Ljk2TDIyIDh2OGE0IDQgMCAwIDEtNCAzSDYgNCA0IDEgMSAwIDEtNC00VjhsLS4yNS0uMDRhLjk3Ljk3IDAgMCAxLS43NS0uOTZWM3oiLz4KPHN2ZyB4PSIzMjQiIHk9IjEwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAyMiAzLThoNGwzIDhoLTEweiIvPgo8cGF0aCBkPSJNNiAyaDEydjZINnoiLz4KPC9zdmc+CjxjaXJjbGUgY3g9IjMzNSIgY3k9IjE4IiByPSI4IiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjMzNSIgeT0iMjEiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj45OSs8L3RleHQ+Cjx0ZXh0IHg9IjI0IiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2NjY2Ij5Db29sbWF0ZTwvdGV4dD4KPC9zdmc+',
    screenshots: ['shopee-header-mobile.png'],
    liveDemo: '/demo/shopee-header'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React from 'react';
import { Camera, ShoppingCart } from 'lucide-react';

interface ShopeeHeaderProps {
  searchPlaceholder?: string;
  cartCount?: number;
  onSearchChange?: (value: string) => void;
  onCameraClick?: () => void;
  onCartClick?: () => void;
  className?: string;
}

export function ShopeeHeader({
  searchPlaceholder = "Coolmate",
  cartCount = 0,
  onSearchChange,
  onCameraClick,
  onCartClick,
  className = ""
}: ShopeeHeaderProps) {
  return (
    <div className={\`bg-orange-500 text-white p-4 sticky top-0 z-40 \${className}\`}>
      {/* Status Bar Mock */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium">21:54</div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-sm">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-white rounded"></div>
            <div className="w-1 h-3 bg-white rounded"></div>
            <div className="w-1 h-3 bg-white/60 rounded"></div>
            <div className="w-1 h-3 bg-white/30 rounded"></div>
          </div>
          <span className="ml-2">5G</span>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mt-3 relative">
        <input 
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full h-10 pl-4 pr-12 bg-white text-gray-800 rounded-md text-sm border-0 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button 
          onClick={onCameraClick}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 p-1 rounded"
        >
          <Camera className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Cart Icon */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onCartClick}
          className="relative hover:bg-orange-600 p-2 rounded-full transition-colors"
        >
          <ShoppingCart className="h-6 w-6 text-white" />
          {cartCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px] px-1">
              {cartCount > 99 ? '99+' : cartCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}`,
      typescript: `export interface ShopeeHeaderProps {
  searchPlaceholder?: string;
  cartCount?: number;
  onSearchChange?: (value: string) => void;
  onCameraClick?: () => void;
  onCartClick?: () => void;
  className?: string;
}`,
      dependencies: ['react', 'lucide-react'],
      devDependencies: ['@types/react', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'bg-orange-500', 'text-white', 'p-4', 'sticky', 'top-0', 'z-40'
    ],
    themeAwareClasses: [
      'bg-orange-500', 'text-white', 'bg-white', 'text-gray-800'
    ],
    responsiveClasses: {
      mobile: ['p-4', 'text-sm'],
      tablet: ['p-6', 'text-base'],
      desktop: ['p-8', 'text-lg']
    },
    cssVariables: [
      '--header-bg', '--header-text', '--search-bg', '--search-text'
    ]
  },
  
  // Template Assets
  assets: [
    {
      type: 'icon',
      url: 'lucide-react/camera',
      description: 'Camera icon for search bar',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/shopping-cart',
      description: 'Shopping cart icon',
      required: true
    }
  ],
  
  // Template Props
  props: [
    {
      name: 'searchPlaceholder',
      type: 'string',
      description: 'Placeholder text for search input',
      required: false,
      defaultValue: 'Coolmate'
    },
    {
      name: 'cartCount',
      type: 'number',
      description: 'Number of items in cart (shows badge)',
      required: false,
      defaultValue: 0
    },
    {
      name: 'onSearchChange',
      type: 'function',
      description: 'Callback when search input changes',
      required: false
    },
    {
      name: 'onCameraClick',
      type: 'function',
      description: 'Callback when camera button is clicked',
      required: false
    },
    {
      name: 'onCartClick',
      type: 'function',
      description: 'Callback when cart icon is clicked',
      required: false
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Mobile-first header component replicating Shopee mobile app interface with status bar, search functionality, and shopping cart.',
    usage: 'Use as main navigation header for mobile e-commerce applications.',
    examples: [
      {
        title: 'Basic Header',
        description: 'Simple header with default settings',
        code: `<ShopeeHeader />`
      },
      {
        title: 'Interactive Header',
        description: 'Header with search and cart functionality',
        code: `<ShopeeHeader 
  searchPlaceholder="Search products..."
  cartCount={5}
  onSearchChange={(value) => handleSearch(value)}
  onCartClick={() => openCart()}
/>`
      }
    ]
  },
  
  // Metadata
  metadata: {
    author: 'Shopee Template Library',
    license: 'MIT',
    tags: ['navigation', 'header', 'mobile', 'search', 'cart', 'shopee'],
    industry: ['ecommerce', 'mobile-commerce'],
    useCase: ['mobile-header', 'navigation', 'search-bar', 'shopping-cart'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: true
  }
};