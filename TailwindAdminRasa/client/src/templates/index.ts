/**
 * 🧩 Template Library - Extracted Shopee Components
 * 
 * Reusable template definitions extracted from the Shopee interface
 * for use with the Theme Repository system.
 */

export * from './ecommerce/ShopeeProductCardTemplate';
export * from './navigation/ShopeeHeaderTemplate';
export * from './navigation/ShopeeBottomNavTemplate';
export * from './feedback/ShopeeBadgeTemplates';
export * from './layout/ShopeeGridTemplate';

// Template registry imports
export { templateRegistry } from '@/services/TemplateRegistry';
export type { TemplateDefinition, TemplateCategory } from '@/types/template';