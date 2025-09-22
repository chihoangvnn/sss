/**
 * 🧩 Template Library - Complete Component Templates
 * 
 * Reusable template definitions organized by business type and category
 * for use with the Theme Repository system.
 */

// ==========================================
// 🛍️ E-COMMERCE TEMPLATES (Shopee Style)
// ==========================================
export * from './ecommerce/ShopeeProductCardTemplate';
export * from './navigation/ShopeeHeaderTemplate';
export * from './navigation/ShopeeBottomNavTemplate';
export * from './feedback/ShopeeBadgeTemplates';
export * from './layout/ShopeeGridTemplate';

// ==========================================
// 💎 LUXURY TEMPLATES (Premium & Elegant)
// ==========================================
export * from './luxury/LuxuryProductCardTemplate';

// ==========================================
// 📊 BUSINESS TEMPLATES (Corporate & Professional)
// ==========================================
export * from './business/BusinessDashboardCardTemplate';

// ==========================================
// 🚀 STARTUP TEMPLATES (Modern & Innovative)
// ==========================================
export * from './startup/StartupFeatureCardTemplate';

// ==========================================
// TEMPLATE REGISTRY & SERVICES
// ==========================================
export { templateRegistry } from '@/services/TemplateRegistry';
export { templateCategoryManager } from '@/services/TemplateCategoryManager';

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export type { 
  TemplateDefinition, 
  TemplateCategory,
  TemplateCollection,
  BusinessType,
  CategoryFilterOptions
} from '@/types/template';