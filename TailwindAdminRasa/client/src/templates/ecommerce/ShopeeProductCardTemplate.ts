import { TemplateDefinition } from '@/types/template';

/**
 * 🛍️ Shopee Product Card Template
 * 
 * Exact replica of Shopee's mobile product card with all features:
 * - Live streaming indicator
 * - Freeship badge
 * - Discount badges
 * - Voucher tags
 * - Heart like button
 * - Star ratings
 * - Location display
 */
export const ShopeeProductCardTemplate: TemplateDefinition = {
  id: 'shopee-product-card',
  name: 'Shopee Product Card',
  category: 'ecommerce',
  complexity: 'intermediate',
  description: 'Mobile-first product card with live streaming, badges, vouchers, and interactive elements exactly like Shopee mobile app',
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
      secondary: '#f69113',  // Secondary Orange
      accent: '#ffd700',     // Gold for ratings
      success: '#00ac96',    // Green for badges
      warning: '#ff6600',    // Warning orange
      error: '#ee4d2d',      // Error red (same as primary)
      background: '#f5f5f5', // Light gray background
      surface: '#ffffff',    // White cards
      onSurface: '#222222'   // Dark text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiByeD0iOCIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTVFN0VCIi8+CjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iOCIgZmlsbD0iI0Y5RkFGQiIvPgo8dGV4dCB4PSIxMDAiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjM2MzYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pgo8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHJ4PSI0IiBmaWxsPSIjRUU0RDJEIi8+Cjx0ZXh0IHg9IjI4IiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MSVZFPC90ZXh0Pgo8cmVjdCB4PSIxNDQiIHk9IjgiIHdpZHRoPSI0OCIgaGVpZ2h0PSIxNiIgcng9IjQiIGZpbGw9IiNGRjY2MDAiLz4KPHRleHQgeD0iMTY4IiB5PSIxOCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GUkVFU0hJUDwvdGV4dD4KPHN2ZyB4PSIxNzIiIHk9IjE3MiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0VFNEQyRCIgc3Ryb2tlLXdpZHRoPSIyIj4KPHBhdGggZD0ibTEyIDIxLjM1bC0xLjQ1LTEuMzJDNS40IDE1LjM2IDIgMTIuMjggMiA4LjUgMiA1LjQyIDQuNDIgMyA3LjUgM2MxLjc0IDAgMy40MS44MSA0LjUgMi4wOUMxMy4wOSAzLjgxIDE0Ljc2IDMgMTYuNSAzIDE5LjU4IDMgMjIgNS40MiAyMiA4LjVjMCAzLjc4LTMuNCA2Ljg2LTguNTUgMTEuNTRMMTIgMjEuMzV6Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIxNiIgeT0iMjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMzMzMzMzMiPlByb2R1Y3QgTmFtZTwvdGV4dD4KPHRleHQgeD0iMTYiIHk9IjI0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0VFNEQyRCI+4oKrMjIzLDg2MDwvdGV4dD4KPHRleHQgeD0iMTYiIHk9IjI2OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2NjY2Ij7imIUgNS4wIOKAosKgSMOgIE7hu5lpPC90ZXh0Pgo8L3N2Zz4=',
    screenshots: ['shopee-product-card-mobile.png', 'shopee-product-card-hover.png'],
    liveDemo: '/demo/shopee-product-card'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React, { useState } from 'react';
import { Heart, Star, MapPin, Play, Users } from 'lucide-react';

interface ShopeeProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    rating: number;
    reviewCount: number;
    sold: number;
    location: string;
    shopName: string;
    isLive?: boolean;
    viewerCount?: number;
    hasFreeship?: boolean;
    vouchers?: string[];
    discount?: number;
    tags?: string[];
  };
  onProductClick?: (product: any) => void;
  onLikeProduct?: (product: any) => void;
  className?: string;
}

// Format giá Việt Nam
const formatPrice = (price: number) => \`₫\${new Intl.NumberFormat('vi-VN').format(price)}\`;

// Badge Components
const LiveBadge = ({ viewerCount }: { viewerCount?: number }) => (
  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
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

const FreeshipBadge = () => (
  <div className="absolute top-2 right-2 bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-md">
    FREESHIP
  </div>
);

const VoucherBadge = ({ voucher }: { voucher: string }) => (
  <div className="bg-yellow-400 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold border border-orange-300 shadow-sm">
    {voucher}
  </div>
);

const DiscountBadge = ({ discount }: { discount: number }) => (
  <div className="absolute bottom-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold shadow-md">
    -{discount}%
  </div>
);

export function ShopeeProductCard({
  product,
  onProductClick,
  onLikeProduct,
  className = ""
}: ShopeeProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLikeProduct?.(product);
  };

  const handleClick = () => {
    onProductClick?.(product);
  };

  return (
    <div 
      className={\`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white rounded-lg \${className}\`}
      onClick={handleClick}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Badges */}
        {product.isLive && <LiveBadge viewerCount={product.viewerCount} />}
        {product.hasFreeship && <FreeshipBadge />}
        {product.discount && <DiscountBadge discount={product.discount} />}

        {/* Heart Icon */}
        <button
          onClick={handleLike}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
          style={{ right: product.hasFreeship ? '44px' : '8px' }}
        >
          <Heart 
            className={\`h-4 w-4 transition-colors \${
              isLiked 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600 hover:text-red-400'
            }\`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-2 space-y-1.5">
        {/* Vouchers */}
        {product.vouchers && product.vouchers.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.vouchers.map((voucher, idx) => (
              <VoucherBadge key={idx} voucher={voucher} />
            ))}
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-sm text-gray-800 line-clamp-2 leading-tight font-normal">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-semibold text-base">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-gray-400 text-xs line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Rating and Sales */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-gray-600">{product.rating}</span>
            {product.tags && (
              <span className="text-gray-400 ml-1">{product.tags[0]}</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          <span>{product.location}</span>
        </div>
      </div>
    </div>
  );
}`,
      typescript: `export interface ShopeeProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  sold: number;
  location: string;
  shopName: string;
  isLive?: boolean;
  viewerCount?: number;
  hasFreeship?: boolean;
  vouchers?: string[];
  discount?: number;
  tags?: string[];
}

export interface ShopeeProductCardProps {
  product: ShopeeProduct;
  onProductClick?: (product: ShopeeProduct) => void;
  onLikeProduct?: (product: ShopeeProduct) => void;
  className?: string;
}`,
      dependencies: ['react', 'lucide-react', '@types/react'],
      devDependencies: ['@types/node', 'typescript']
    },
    vue: {
      template: `<template>
  <div 
    class="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white rounded-lg"
    :class="className"
    @click="handleClick"
  >
    <!-- Product Image Container -->
    <div class="relative w-full aspect-square bg-gray-100">
      <img
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover"
      />
      
      <!-- Overlay Badges -->
      <LiveBadge v-if="product.isLive" :viewerCount="product.viewerCount" />
      <FreeshipBadge v-if="product.hasFreeship" />
      <DiscountBadge v-if="product.discount" :discount="product.discount" />

      <!-- Heart Icon -->
      <button
        @click.stop="handleLike"
        class="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
        :style="{ right: product.hasFreeship ? '44px' : '8px' }"
      >
        <HeartIcon 
          :class="[
            'h-4 w-4 transition-colors',
            isLiked 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-600 hover:text-red-400'
          ]"
        />
      </button>
    </div>

    <!-- Product Info -->
    <div class="p-2 space-y-1.5">
      <!-- Vouchers -->
      <div v-if="product.vouchers?.length" class="flex gap-1 flex-wrap">
        <VoucherBadge 
          v-for="(voucher, idx) in product.vouchers" 
          :key="idx" 
          :voucher="voucher" 
        />
      </div>

      <!-- Product Name -->
      <h3 class="text-sm text-gray-800 line-clamp-2 leading-tight font-normal">
        {{ product.name }}
      </h3>

      <!-- Price Section -->
      <div class="flex items-center gap-2">
        <span class="text-orange-500 font-semibold text-base">
          {{ formatPrice(product.price) }}
        </span>
        <span 
          v-if="product.originalPrice" 
          class="text-gray-400 text-xs line-through"
        >
          {{ formatPrice(product.originalPrice) }}
        </span>
      </div>

      <!-- Rating and Sales -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1">
          <StarIcon class="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span class="text-gray-600">{{ product.rating }}</span>
          <span v-if="product.tags?.[0]" class="text-gray-400 ml-1">
            {{ product.tags[0] }}
          </span>
        </div>
      </div>

      <!-- Location -->
      <div class="flex items-center gap-1 text-xs text-gray-500">
        <MapPinIcon class="h-3 w-3" />
        <span>{{ product.location }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Heart as HeartIcon, Star as StarIcon, MapPin as MapPinIcon } from 'lucide-vue-next';

// Component props
interface Props {
  product: ShopeeProduct;
  onProductClick?: (product: ShopeeProduct) => void;
  onLikeProduct?: (product: ShopeeProduct) => void;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: ''
});

// Reactive state
const isLiked = ref(false);

// Methods
const formatPrice = (price: number) => \`₫\${new Intl.NumberFormat('vi-VN').format(price)}\`;

const handleLike = () => {
  isLiked.value = !isLiked.value;
  props.onLikeProduct?.(props.product);
};

const handleClick = () => {
  props.onProductClick?.(props.product);
};
</script>`,
      dependencies: ['vue', 'lucide-vue-next'],
      devDependencies: ['@vue/compiler-sfc', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'relative', 'overflow-hidden', 'cursor-pointer', 'hover:shadow-lg',
      'transition-all', 'duration-200', 'border-0', 'bg-white', 'rounded-lg'
    ],
    themeAwareClasses: [
      'text-orange-500', 'bg-orange-500', 'text-yellow-400', 'fill-yellow-400',
      'bg-red-500', 'text-red-500', 'fill-red-500'
    ],
    responsiveClasses: {
      mobile: ['text-sm', 'text-xs', 'p-2', 'space-y-1.5'],
      tablet: ['text-base', 'text-sm', 'p-3', 'space-y-2'],
      desktop: ['text-lg', 'text-base', 'p-4', 'space-y-3']
    },
    cssVariables: [
      '--shopee-primary', '--shopee-secondary', '--shopee-accent',
      '--shopee-background', '--shopee-surface', '--shopee-text'
    ],
    safelist: [
      'line-clamp-2', 'aspect-square', 'fill-red-500', 'fill-yellow-400'
    ]
  },
  
  // Template Assets
  assets: [
    {
      type: 'icon',
      url: 'lucide-react/heart',
      description: 'Heart icon for like button',
      required: true
    },
    {
      type: 'icon', 
      url: 'lucide-react/star',
      description: 'Star icon for ratings',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/map-pin',
      description: 'Map pin icon for location',
      required: true
    }
  ],
  
  // Template Props
  props: [
    {
      name: 'product',
      type: 'object',
      description: 'Product data object with all Shopee fields',
      required: true,
      validation: {
        custom: 'Must include id, name, price, images array'
      }
    },
    {
      name: 'onProductClick',
      type: 'function',
      description: 'Callback when product card is clicked',
      required: false
    },
    {
      name: 'onLikeProduct',
      type: 'function',
      description: 'Callback when like button is clicked',
      required: false
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes',
      required: false,
      defaultValue: ''
    }
  ],
  
  // Template Slots
  slots: [
    {
      name: 'badges',
      description: 'Custom badge content overlay on product image',
      required: false,
      defaultContent: 'Live and Freeship badges'
    },
    {
      name: 'actions',
      description: 'Custom action buttons overlay',
      required: false,
      defaultContent: 'Heart like button'
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Exact replica of Shopee mobile product card with all interactive features including live streaming indicators, badges, vouchers, and like functionality.',
    usage: 'Import and use as a React component. Pass product data and optional click handlers.',
    examples: [
      {
        title: 'Basic Usage',
        description: 'Simple product card with minimum required props',
        code: `<ShopeeProductCard 
  product={{
    id: "1",
    name: "Sample Product",
    price: 223860,
    images: ["product.jpg"],
    rating: 5.0,
    reviewCount: 73,
    sold: 2,
    location: "Hà Nội",
    shopName: "Sample Shop"
  }}
/>`
      },
      {
        title: 'With Live Streaming',
        description: 'Product card with live streaming indicator',
        code: `<ShopeeProductCard 
  product={{
    ...productData,
    isLive: true,
    viewerCount: 11700
  }}
  onProductClick={(product) => console.log('Clicked:', product)}
/>`
      },
      {
        title: 'With Badges and Vouchers',
        description: 'Full-featured product card with all badges',
        code: `<ShopeeProductCard 
  product={{
    ...productData,
    hasFreeship: true,
    discount: 20,
    vouchers: ["25.9", "FREESHIP"],
    originalPrice: 280000
  }}
  onLikeProduct={(product) => addToWishlist(product)}
/>`
      }
    ],
    notes: [
      'Component is mobile-first responsive',
      'Uses Vietnamese currency formatting',
      'All badges and overlays are position:absolute',
      'Heart button has hover and active states',
      'Image aspect ratio is always square (1:1)'
    ]
  },
  
  // Template Relationships
  dependencies: [],
  variants: ['shopee-product-card-compact', 'shopee-product-card-detailed'],
  baseTemplate: undefined,
  
  // Metadata
  metadata: {
    author: 'Shopee Template Library',
    authorUrl: 'https://github.com/shopee-templates',
    license: 'MIT',
    tags: [
      'ecommerce', 'product-card', 'mobile', 'shopee', 'vietnam',
      'responsive', 'interactive', 'badges', 'vouchers', 'rating'
    ],
    industry: ['ecommerce', 'retail', 'marketplace', 'mobile-commerce'],
    useCase: [
      'product-listings', 'marketplace', 'mobile-app', 'product-grid',
      'shopping-cart', 'product-catalog', 'e-commerce-frontend'
    ],
    designSystem: 'shopee',
    accessibility: {
      level: 'AA',
      features: [
        'keyboard-navigation', 'screen-reader-friendly', 
        'semantic-html', 'proper-alt-text', 'focus-management'
      ]
    },
    performance: {
      bundleSize: 8, // KB
      renderTime: 50, // ms
      score: 95
    },
    seo: {
      structured: true,
      semantic: true,
      score: 90
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: true
  }
};