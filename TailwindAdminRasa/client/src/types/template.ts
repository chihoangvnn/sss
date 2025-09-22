import { ThemeDefinition } from './theme';

/**
 * 🧩 Component Template System Types
 * 
 * Provides reusable component templates that work with the Theme Repository
 * system for consistent UI across different platforms and applications.
 */

// Template Categories
export type TemplateCategory = 
  | 'ecommerce'       // Product cards, shopping carts, checkout
  | 'navigation'      // Headers, menus, breadcrumbs
  | 'content'         // Text blocks, media cards, hero sections
  | 'form'           // Input fields, buttons, validation
  | 'layout'         // Grids, containers, sidebars
  | 'feedback'       // Alerts, notifications, modals
  | 'data'           // Tables, lists, charts
  | 'social'         // Social media cards, sharing
  | 'custom';        // User-defined templates

// Target Frameworks
export type TargetFramework = 
  | 'react'          // React components
  | 'vue'            // Vue components  
  | 'angular'        // Angular components
  | 'vanilla'        // Plain HTML/CSS/JS
  | 'all';           // Framework agnostic

// Template Complexity Levels
export type TemplateComplexity = 
  | 'basic'          // Simple, single-purpose
  | 'intermediate'   // Multiple features
  | 'advanced'       // Complex with integrations
  | 'enterprise';    // Full-featured with customization

// Template Props Definition
export interface TemplateProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'node';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: any[]; // For enum-like props
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Custom validation function as string
  };
}

// Template Styling Configuration
export interface TemplateStyles {
  // CSS Classes that get applied
  baseClasses: string[];
  themeAwareClasses: string[]; // Classes that use theme variables
  responsiveClasses: Record<'mobile' | 'tablet' | 'desktop', string[]>;
  
  // CSS Variables used by this template
  cssVariables: string[];
  
  // Custom CSS if needed
  customCSS?: string;
  
  // Tailwind safelist (classes that shouldn't be purged)
  safelist?: string[];
}

// Template Assets
export interface TemplateAsset {
  type: 'image' | 'icon' | 'font' | 'css' | 'js';
  url: string;
  description?: string;
  required: boolean;
  size?: number; // File size in bytes
}

// Template Code Definition
export interface TemplateCode {
  // Framework-specific implementations
  react?: {
    jsx: string;
    typescript?: string;
    dependencies: string[]; // npm packages required
    devDependencies?: string[];
  };
  vue?: {
    template: string;
    script?: string;
    style?: string;
    dependencies: string[];
  };
  angular?: {
    component: string;
    template: string;
    styles?: string;
    dependencies: string[];
  };
  vanilla?: {
    html: string;
    css: string;
    javascript?: string;
  };
}

// Template Documentation
export interface TemplateDocumentation {
  description: string;
  usage: string; // How to use this template
  examples: {
    title: string;
    description: string;
    code: string;
    preview?: string; // Base64 image or URL
  }[];
  props?: TemplateProp[];
  notes?: string[];
  changelog?: {
    version: string;
    changes: string[];
    date: string;
  }[];
}

// Complete Template Definition
export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  description: string;
  version: string;
  
  // Targeting
  frameworks: TargetFramework[];
  platforms: ('web' | 'mobile' | 'desktop')[];
  
  // Theme Compatibility
  compatibleThemes: string[]; // Theme IDs, or 'all'
  requiresTheme: boolean;
  themeOverrides?: Partial<ThemeDefinition>; // Theme customizations for this template
  
  // Visual Representation
  preview: {
    thumbnail: string; // Base64 or URL to preview image
    screenshots: string[]; // Multiple views/states
    liveDemo?: string; // URL to live demo
  };
  
  // Template Code & Styling
  code: TemplateCode;
  styles: TemplateStyles;
  assets: TemplateAsset[];
  
  // Configuration
  props: TemplateProp[];
  slots?: { // For content injection
    name: string;
    description: string;
    required: boolean;
    defaultContent?: string;
  }[];
  
  // Documentation
  documentation: TemplateDocumentation;
  
  // Template Relationships
  dependencies: string[]; // Other template IDs this depends on
  variants: string[]; // Other template IDs that are variants
  baseTemplate?: string; // Template ID this extends from
  
  // Metadata
  metadata: {
    author: string;
    authorUrl?: string;
    license: string;
    tags: string[];
    industry: string[];
    useCase: string[];
    designSystem?: string; // 'material', 'antd', 'bootstrap', etc.
    accessibility: {
      level: 'A' | 'AA' | 'AAA';
      features: string[];
    };
    performance: {
      bundleSize?: number; // Estimated bundle impact in KB
      renderTime?: number; // Estimated render time in ms
      score?: number; // Performance score 1-100
    };
    seo: {
      structured: boolean; // Has structured data
      semantic: boolean; // Uses semantic HTML
      score?: number; // SEO score 1-100
    };
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    downloads: number;
    featured: boolean;
  };
}

// Template Application Context
export interface TemplateContext {
  template: TemplateDefinition;
  theme?: ThemeDefinition;
  props: Record<string, any>;
  slots?: Record<string, string>;
  framework: TargetFramework;
  platform: 'web' | 'mobile' | 'desktop';
}

// Template Registry Configuration
export interface TemplateRegistryConfig {
  templates: TemplateDefinition[];
  categories: TemplateCategory[];
  defaultCategory: TemplateCategory;
  fallbackTemplate: string;
}

// Template Search & Filter Options
export interface TemplateSearchOptions {
  query?: string;
  category?: TemplateCategory;
  framework?: TargetFramework;
  complexity?: TemplateComplexity;
  tags?: string[];
  industry?: string[];
  compatibility?: string; // Theme ID
  author?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created' | 'updated' | 'usage' | 'rating' | 'downloads';
  sortOrder?: 'asc' | 'desc';
}

// API Response Types
export interface TemplateListResponse {
  templates: TemplateDefinition[];
  totalCount: number;
  categories: TemplateCategory[];
  frameworks: TargetFramework[];
  filters: {
    complexities: TemplateComplexity[];
    tags: string[];
    industries: string[];
    authors: string[];
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TemplateCreateRequest {
  name: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  description: string;
  frameworks: TargetFramework[];
  baseTemplate?: string;
  template: Partial<TemplateDefinition>;
}

export interface TemplateUpdateRequest {
  template: Partial<TemplateDefinition>;
  version?: string;
}

// Template Builder Types
export interface TemplateBuilderState {
  currentTemplate: Partial<TemplateDefinition>;
  previewMode: boolean;
  selectedFramework: TargetFramework;
  activeTheme?: ThemeDefinition;
  isDirty: boolean;
  errors: Record<string, string>;
}

// Template Usage Analytics
export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  averageRating: number;
  frameworks: Record<TargetFramework, number>;
  platforms: Record<string, number>;
  industries: Record<string, number>;
  lastUsed: string;
  popularProps: Record<string, number>;
}

// Template Installation/Export Options
export interface TemplateExportOptions {
  framework: TargetFramework;
  includeAssets: boolean;
  includeDependencies: boolean;
  includeDocumentation: boolean;
  format: 'zip' | 'npm' | 'cdn' | 'embed';
  customizations?: Record<string, any>;
}

export interface TemplateInstallResult {
  success: boolean;
  files: {
    path: string;
    content: string;
    type: 'component' | 'style' | 'asset' | 'config';
  }[];
  dependencies: string[];
  instructions: string[];
  errors?: string[];
}