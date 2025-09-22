// Core Theme System Types - Foundation cho Theme Repository
export type ThemeCategory = 'ecommerce' | 'business' | 'luxury' | 'minimal' | 'custom';
export type TargetPlatform = 'landing-page' | 'storefront' | 'mobile-app' | 'admin' | 'all';

// Component Theme Definitions
export interface ComponentTheme {
  // Product Grids
  productGrid: {
    layout: '2-column' | '3-column' | '4-column' | 'list' | 'masonry';
    cardStyle: 'shopee' | 'minimal' | 'luxury' | 'business';
    spacing: 'tight' | 'normal' | 'loose';
    borderRadius: string;
    shadow: 'none' | 'sm' | 'md' | 'lg';
  };
  
  // Headers & Navigation
  header: {
    style: 'shopee' | 'minimal' | 'business' | 'luxury';
    height: string;
    backgroundColor: string;
    position: 'sticky' | 'fixed' | 'static';
    searchStyle: 'prominent' | 'subtle' | 'hidden';
    showCamera: boolean;
  };
  
  navigation: {
    type: 'bottom' | 'top' | 'sidebar' | 'tabs';
    style: 'shopee' | 'minimal' | 'business';
    iconStyle: 'filled' | 'outlined' | 'rounded';
    backgroundColor: string;
    activeColor: string;
  };
  
  // Buttons & CTAs
  buttons: {
    primary: {
      style: 'filled' | 'outlined' | 'ghost' | 'gradient';
      borderRadius: string;
      shadow: boolean;
      animation: 'none' | 'pulse' | 'bounce' | 'glow';
    };
    secondary: {
      style: 'filled' | 'outlined' | 'ghost';
      borderRadius: string;
    };
  };
  
  // Badges & Labels
  badges: {
    live: {
      style: 'shopee' | 'minimal' | 'modern';
      backgroundColor: string;
      textColor: string;
      animation: boolean;
    };
    freeship: {
      style: 'shopee' | 'minimal' | 'tag';
      backgroundColor: string;
      textColor: string;
    };
    discount: {
      style: 'percentage' | 'amount' | 'ribbon';
      backgroundColor: string;
      textColor: string;
    };
    voucher: {
      style: 'ticket' | 'rounded' | 'sharp';
      backgroundColor: string;
      textColor: string;
    };
  };
}

// Complete Theme Definition
export interface ThemeDefinition {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  version: string;
  
  // Visual Identity
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  
  // Typography System
  typography: {
    fontFamily: string;
    fontWeights: {
      light: string;
      normal: string;
      medium: string;
      bold: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    lineHeights: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  
  // Layout & Spacing
  layout: {
    containerMaxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
    gridGap: string;
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  
  // Component Configurations
  components: ComponentTheme;
  
  // Responsive Breakpoints
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  
  // Animation & Motion
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  
  // Platform Targeting
  platforms: TargetPlatform[];
  
  // Metadata
  metadata: {
    author: string;
    tags: string[];
    industry: string[];
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    preview: string; // Preview image URL
  };
}

// Theme Application Context
export interface ThemeContext {
  currentTheme: ThemeDefinition;
  platform: TargetPlatform;
  customizations?: Partial<ThemeDefinition>;
  isPreview?: boolean;
}

// Theme Provider Props
export interface ThemeProviderProps {
  theme: ThemeDefinition;
  children: React.ReactNode;
  customizations?: Partial<ThemeDefinition>;
  platform?: TargetPlatform;
}

// Theme Registry Types
export interface ThemeRegistryConfig {
  themes: ThemeDefinition[];
  defaultTheme: string;
  fallbackTheme: string;
}

export interface ThemeApplyOptions {
  platform: TargetPlatform;
  customizations?: Partial<ThemeDefinition>;
  persist?: boolean;
  preview?: boolean;
}

// API Response Types
export interface ThemeListResponse {
  themes: ThemeDefinition[];
  totalCount: number;
  categories: ThemeCategory[];
  platforms: TargetPlatform[];
}

export interface ThemeCreateRequest {
  name: string;
  category: ThemeCategory;
  description: string;
  baseTheme?: string; // Clone from existing theme
  theme: Partial<ThemeDefinition>;
}

export interface ThemeUpdateRequest {
  theme: Partial<ThemeDefinition>;
  version?: string;
}

export interface ThemeUsageStats {
  themeId: string;
  usageCount: number;
  averageRating: number;
  platforms: Record<TargetPlatform, number>;
  lastUsed: string;
}