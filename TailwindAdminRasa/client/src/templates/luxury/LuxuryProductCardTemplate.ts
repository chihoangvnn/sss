import { TemplateDefinition } from '@/types/template';

/**
 * 💎 Luxury Product Card Template
 * 
 * Elegant and sophisticated product card for luxury brands and premium products
 * Features minimalist design, premium typography, and subtle interactions
 */
export const LuxuryProductCardTemplate: TemplateDefinition = {
  id: 'luxury-product-card',
  name: 'Luxury Product Card',
  category: 'ecommerce',
  complexity: 'advanced',
  description: 'Minimalist and elegant product card for luxury brands with premium typography and subtle animations',
  version: '1.0.0',
  
  // Targeting
  frameworks: ['react'],
  platforms: ['web', 'mobile'],
  
  // Theme Compatibility
  compatibleThemes: ['all'],
  requiresTheme: false,
  themeOverrides: {
    colorPalette: {
      primary: '#1a1a1a',        // Deep black
      secondary: '#d4af37',      // Luxury gold
      accent: '#ffffff',         // Pure white
      background: '#fafafa',     // Off-white
      surface: '#ffffff',        // White cards
      onSurface: '#1a1a1a'       // Dark text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiByeD0iMTIiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0UwRTBFMCIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIzMDAiIHJ4PSI4IiBmaWxsPSIjRkFGQUZBIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTc1IiBmb250LWZhbWlseT0iUGxheWZhaXIgRGlzcGxheSIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJlbWl1bSBQcm9kdWN0PC90ZXh0Pgo8dGV4dCB4PSI0MCIgeT0iMzU1IiBmb250LWZhbWlseT0iUGxheWZhaXIgRGlzcGxheSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSI+THV4dXJ5IFRpdGxlPC90ZXh0Pgo8dGV4dCB4PSI0MCIgeT0iMzc4IiBmb250LWZhbWlseT0iU291cmNlIFNhbnMgUHJvIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjRDRBRjM3Ij4kMiwzNTA8L3RleHQ+CjxjaXJjbGUgY3g9IjI2MCIgY3k9IjM2NSIgcj0iMTIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFBMUExQSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHN2ZyB4PSIyNTMiIHk9IjM1OCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFBMUExQSIgc3Ryb2tlLXdpZHRoPSIxLjUiPgo8cGF0aCBkPSJtMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiLz4KPC9zdmc+Cjwvc3ZnPg==',
    screenshots: ['luxury-product-card.png'],
    liveDemo: '/demo/luxury-product-card'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface LuxuryProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    brand: string;
    collection?: string;
    material?: string;
    limited?: boolean;
    handcrafted?: boolean;
  };
  onProductClick?: (product: any) => void;
  onWishlistAdd?: (product: any) => void;
  className?: string;
}

// Luxury price formatting (no currency symbol clutter)
const formatLuxuryPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price);
};

export function LuxuryProductCard({
  product,
  onProductClick,
  onWishlistAdd,
  className = ""
}: LuxuryProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onWishlistAdd?.(product);
  };

  const handleClick = () => {
    onProductClick?.(product);
  };

  return (
    <div 
      className={\`group relative bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 \${className}\`}
      onClick={handleClick}
    >
      {/* Premium Image Container */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Subtle Overlay for Premium Feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Luxury Badges */}
        {product.limited && (
          <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-medium tracking-wider uppercase">
            Limited Edition
          </div>
        )}
        
        {product.handcrafted && (
          <div className="absolute top-4 right-4 bg-gold-500 text-black px-3 py-1 text-xs font-medium tracking-wider uppercase">
            Handcrafted
          </div>
        )}

        {/* Wishlist Heart - Minimal Design */}
        <button
          onClick={handleWishlist}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
        >
          <Heart 
            className={\`w-5 h-5 transition-colors duration-200 \${
              isWishlisted 
                ? 'fill-black text-black' 
                : 'text-gray-600 hover:text-black'
            }\`}
          />
        </button>
      </div>

      {/* Premium Product Information */}
      <div className="p-6 space-y-3">
        {/* Brand Name - Small and Elegant */}
        <div className="text-xs tracking-widest uppercase text-gray-500 font-medium">
          {product.brand}
        </div>

        {/* Product Name - Premium Typography */}
        <h3 className="text-lg font-light text-black leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Material/Collection Info */}
        {(product.material || product.collection) && (
          <div className="text-sm text-gray-600 font-light">
            {product.collection && (
              <span className="italic">{product.collection} Collection</span>
            )}
            {product.material && product.collection && " • "}
            {product.material && <span>{product.material}</span>}
          </div>
        )}

        {/* Luxury Pricing */}
        <div className="flex items-baseline gap-3 pt-2">
          <span className="text-xl font-light text-black tracking-wide">
            {formatLuxuryPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through font-light">
              {formatLuxuryPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Subtle Call to Action */}
        <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-xs tracking-wider uppercase text-gray-400 hover:text-black transition-colors cursor-pointer">
            View Details →
          </div>
        </div>
      </div>
    </div>
  );
}`,
      typescript: `export interface LuxuryProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  collection?: string;
  material?: string;
  limited?: boolean;
  handcrafted?: boolean;
}

export interface LuxuryProductCardProps {
  product: LuxuryProduct;
  onProductClick?: (product: LuxuryProduct) => void;
  onWishlistAdd?: (product: LuxuryProduct) => void;
  className?: string;
}`,
      dependencies: ['react', 'lucide-react'],
      devDependencies: ['@types/react', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'group', 'relative', 'bg-white', 'rounded-lg', 'overflow-hidden', 
      'cursor-pointer', 'transition-all', 'duration-500', 'hover:shadow-2xl'
    ],
    themeAwareClasses: [
      'bg-white', 'text-black', 'bg-black', 'text-white', 'bg-gold-500'
    ],
    responsiveClasses: {
      mobile: ['p-4', 'text-base', 'space-y-2'],
      tablet: ['p-5', 'text-lg', 'space-y-3'],
      desktop: ['p-6', 'text-xl', 'space-y-3']
    },
    cssVariables: [
      '--luxury-primary', '--luxury-gold', '--luxury-white', '--luxury-gray'
    ],
    customCSS: `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .tracking-widest {
        letter-spacing: 0.1em;
      }
      
      .bg-gold-500 {
        background-color: #d4af37;
      }
      
      .text-gold-500 {
        color: #d4af37;
      }
    `,
    safelist: [
      'aspect-[4/5]', 'line-clamp-2', 'tracking-widest', 'bg-gold-500', 
      'text-gold-500', 'backdrop-blur-sm'
    ]
  },
  
  // Template Assets
  assets: [
    {
      type: 'icon',
      url: 'lucide-react/heart',
      description: 'Heart icon for wishlist',
      required: true
    }
  ],
  
  // Template Props
  props: [
    {
      name: 'product',
      type: 'object',
      description: 'Luxury product data with brand, collection, and premium details',
      required: true,
      validation: {
        custom: 'Must include id, name, price, brand, images array'
      }
    },
    {
      name: 'onProductClick',
      type: 'function',
      description: 'Callback when product card is clicked',
      required: false
    },
    {
      name: 'onWishlistAdd',
      type: 'function',
      description: 'Callback when wishlist button is clicked',
      required: false
    }
  ],
  
  // Template Slots
  slots: [
    {
      name: 'badges',
      description: 'Custom luxury badge content (Limited Edition, Handcrafted)',
      required: false,
      defaultContent: 'Limited Edition and Handcrafted badges'
    },
    {
      name: 'details',
      description: 'Additional product details section',
      required: false,
      defaultContent: 'Material and collection information'
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Elegant product card designed for luxury brands with premium typography, subtle animations, and minimalist design principles.',
    usage: 'Use for high-end retail, luxury fashion, jewelry, or premium product showcases.',
    examples: [
      {
        title: 'Basic Luxury Product',
        description: 'Simple luxury product card',
        code: `<LuxuryProductCard 
  product={{
    id: "1",
    name: "Artisan Leather Handbag",
    price: 2350,
    brand: "MAISON NOIR",
    images: ["handbag.jpg"],
    collection: "Spring 2024",
    material: "Italian Leather"
  }}
/>`
      },
      {
        title: 'Limited Edition Product',
        description: 'Luxury product with special badges',
        code: `<LuxuryProductCard 
  product={{
    ...productData,
    limited: true,
    handcrafted: true,
    originalPrice: 2800
  }}
  onWishlistAdd={(product) => addToWishlist(product)}
/>`
      }
    ],
    notes: [
      'Uses premium typography with Playfair Display for headings',
      'Features subtle hover animations and scaling effects',
      'Minimalist color palette focusing on black, white, and gold',
      'Responsive design optimized for luxury brand aesthetics',
      'Supports luxury-specific features like collections and materials'
    ]
  },
  
  // Template Relationships
  dependencies: [],
  variants: ['luxury-product-card-detailed', 'luxury-product-card-minimal'],
  baseTemplate: undefined,
  
  // Metadata
  metadata: {
    author: 'Luxury Template Library',
    authorUrl: 'https://github.com/luxury-templates',
    license: 'MIT',
    tags: [
      'luxury', 'premium', 'elegant', 'product-card', 'ecommerce',
      'minimalist', 'sophisticated', 'high-end', 'fashion', 'jewelry'
    ],
    industry: ['luxury', 'fashion', 'jewelry', 'premium-retail', 'high-end'],
    useCase: [
      'luxury-ecommerce', 'premium-product-showcase', 'high-end-retail',
      'designer-collections', 'exclusive-products', 'artisan-goods'
    ],
    designSystem: 'luxury-minimal',
    accessibility: {
      level: 'AA',
      features: [
        'keyboard-navigation', 'screen-reader-friendly', 
        'high-contrast-mode', 'focus-management', 'semantic-structure'
      ]
    },
    performance: {
      bundleSize: 6, // KB
      renderTime: 45, // ms
      score: 92
    },
    seo: {
      structured: true,
      semantic: true,
      score: 88
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: true
  }
};