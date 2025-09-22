import { ThemeDefinition } from '@/types/theme';

/**
 * 🛒 ShopeeTheme - Exact replica of Shopee mobile app interface
 * 
 * This theme captures the complete visual identity and component styling
 * of Shopee's mobile application for Vietnamese e-commerce market.
 */
export const ShopeeTheme: ThemeDefinition = {
  id: 'shopee-mobile-2024',
  name: 'Shopee Mobile',
  category: 'ecommerce',
  description: 'Chính xác interface giống Shopee mobile app với màu cam đặc trưng, layout 2 cột, và Vietnamese UX patterns',
  version: '1.0.0',
  
  // Shopee Color Palette - Exact from brand guidelines
  colorPalette: {
    primary: '#EE4D2D',      // Shopee Orange
    secondary: '#FF6B35',     // Secondary Orange
    accent: '#FF8C42',       // Light Orange
    success: '#26AA99',      // Shopee Green
    warning: '#FFA726',      // Warning Orange
    danger: '#F44336',       // Error Red
    background: '#F5F5F5',   // Light Grey Background
    surface: '#FFFFFF',      // White Cards
    text: '#222222',         // Dark Text
    textMuted: '#757575',    // Muted Text
    border: '#E0E0E0',       // Light Border
  },
  
  // Typography - Roboto family like Shopee
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700'
    },
    fontSizes: {
      xs: '10px',    // Tiny labels
      sm: '12px',    // Small text, sold count
      base: '14px',  // Product names, main text
      lg: '16px',    // Prices
      xl: '18px',    // Headers
      '2xl': '24px', // Page titles
      '3xl': '32px'  // Hero titles
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  // Layout - Mobile-first như Shopee
  layout: {
    containerMaxWidth: '428px',     // iPhone 14 Pro Max width
    containerPadding: '8px',        // Tight mobile padding
    sectionSpacing: '12px',         // Compact spacing
    gridGap: '8px',                 // Small gaps between products
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    }
  },
  
  // Component Styles - Extracted from ShopeeProductGrid
  components: {
    // Product Grid như trong ShopeeProductGrid.tsx
    productGrid: {
      layout: '2-column',           // Exactly like Shopee mobile
      cardStyle: 'shopee',          // Shopee card design
      spacing: 'tight',             // Compact for mobile
      borderRadius: '8px',          // Rounded corners
      shadow: 'sm'                  // Subtle shadow
    },
    
    // Header như trong PublicMobileLayout
    header: {
      style: 'shopee',
      height: '56px',               // Standard mobile header
      backgroundColor: '#EE4D2D',   // Shopee orange
      position: 'sticky',
      searchStyle: 'prominent',     // Big search bar
      showCamera: true              // Camera icon for visual search
    },
    
    // Bottom Navigation
    navigation: {
      type: 'bottom',
      style: 'shopee',
      iconStyle: 'filled',
      backgroundColor: '#FFFFFF',
      activeColor: '#EE4D2D'        // Orange active state
    },
    
    // Buttons theo Shopee style
    buttons: {
      primary: {
        style: 'filled',
        borderRadius: '4px',
        shadow: false,
        animation: 'none'
      },
      secondary: {
        style: 'outlined',
        borderRadius: '4px'
      }
    },
    
    // Badges rất đặc trưng của Shopee
    badges: {
      live: {
        style: 'shopee',
        backgroundColor: '#FF4444',
        textColor: '#FFFFFF',
        animation: true               // Pulsing animation
      },
      freeship: {
        style: 'shopee',
        backgroundColor: '#26AA99',
        textColor: '#FFFFFF'
      },
      discount: {
        style: 'percentage',
        backgroundColor: '#FF6B35',
        textColor: '#FFFFFF'
      },
      voucher: {
        style: 'ticket',
        backgroundColor: '#FFA726',
        textColor: '#FFFFFF'
      }
    }
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: '428px',    // Mobile-first
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },
  
  // Animations theo Shopee UX
  animations: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  // Platform targeting
  platforms: ['landing-page', 'storefront', 'mobile-app'],
  
  // Metadata
  metadata: {
    author: 'Theme Repository System',
    tags: ['shopee', 'ecommerce', 'mobile', 'vietnamese', 'orange', '2-column'],
    industry: ['ecommerce', 'marketplace', 'retail'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    preview: '/themes/shopee-preview.jpg'
  }
};

/**
 * 🎨 Shopee CSS Variables Generator
 * Generates CSS custom properties from ShopeeTheme
 */
export const generateShopeeCSSVariables = () => {
  return {
    // Colors
    '--shopee-primary': ShopeeTheme.colorPalette.primary,
    '--shopee-primary-rgb': '238, 77, 45',
    '--shopee-secondary': ShopeeTheme.colorPalette.secondary,
    '--shopee-background': ShopeeTheme.colorPalette.background,
    '--shopee-surface': ShopeeTheme.colorPalette.surface,
    '--shopee-success': ShopeeTheme.colorPalette.success,
    
    // Typography
    '--shopee-font-family': ShopeeTheme.typography.fontFamily,
    '--shopee-font-size-sm': ShopeeTheme.typography.fontSizes.sm,
    '--shopee-font-size-base': ShopeeTheme.typography.fontSizes.base,
    '--shopee-font-size-lg': ShopeeTheme.typography.fontSizes.lg,
    
    // Layout
    '--shopee-container-padding': ShopeeTheme.layout.containerPadding,
    '--shopee-grid-gap': ShopeeTheme.layout.gridGap,
    '--shopee-border-radius': ShopeeTheme.layout.borderRadius.md,
    
    // Component specific
    '--shopee-header-height': ShopeeTheme.components.header.height,
    '--shopee-product-card-radius': ShopeeTheme.components.productGrid.borderRadius,
  };
};

/**
 * 🏷️ Shopee Component Classes
 * Pre-built CSS classes for common Shopee patterns
 */
export const ShopeeComponentClasses = {
  // Product Card Classes
  productCard: 'bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
  productImage: 'w-full aspect-square object-cover',
  productName: 'text-sm text-gray-800 font-normal line-clamp-2 h-10',
  productPrice: 'text-shopee-primary font-medium text-base',
  productLocation: 'text-xs text-gray-500',
  
  // Badge Classes
  liveBadge: 'bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse',
  freeshipBadge: 'bg-shopee-success text-white text-xs px-2 py-1 rounded',
  discountBadge: 'bg-shopee-secondary text-white text-xs px-1 rounded',
  voucherBadge: 'bg-orange-400 text-white text-xs px-2 py-1 rounded',
  
  // Layout Classes
  gridContainer: 'grid grid-cols-2 gap-2 p-2',
  mobileContainer: 'max-w-sm mx-auto bg-gray-50 min-h-screen',
  headerContainer: 'sticky top-0 bg-shopee-primary text-white h-14 flex items-center px-4 z-50',
  
  // Navigation Classes
  bottomNav: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2',
  navIcon: 'flex flex-col items-center text-xs',
  navIconActive: 'text-shopee-primary',
};

export default ShopeeTheme;