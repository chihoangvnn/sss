/**
 * 🎯 APPROACH 2: DYNAMIC PRODUCT FIELDS
 * React Hook for Custom Descriptions
 * Integrates with ProductDescriptionService API for Vietnamese incense business
 */

import { useQuery } from '@tanstack/react-query';
import type { 
  CustomDescriptionField
} from '../../../shared/schema';

// Local types for options
interface DisplayDescriptionsOptions {
  context?: 'mobile' | 'desktop' | 'admin';
  category?: string;
  includeEmpty?: boolean;
}

// API Response types
interface DisplayDescriptionsResponse {
  success: boolean;
  data: CustomDescriptionField[];
}

interface EditableDescriptionsResponse {
  success: boolean;
  data: {
    current: {
      version: number;
      fields: Record<string, CustomDescriptionField>;
    };
    templates: Array<{
      templateName: string;
      fieldTemplate: Record<string, any>;
    }>;
  };
}

/**
 * Hook to fetch display-optimized custom descriptions for storefront
 */
export function useDisplayDescriptions(
  productId: string,
  options: DisplayDescriptionsOptions = { context: 'mobile' }
) {
  return useQuery({
    queryKey: ['custom-descriptions', 'display', productId, options],
    queryFn: async (): Promise<CustomDescriptionField[]> => {
      const params = new URLSearchParams();
      if (options.context) params.append('context', options.context);
      if (options.category) params.append('category', options.category);
      if (options.includeEmpty !== undefined) params.append('includeEmpty', String(options.includeEmpty));
      
      const response = await fetch(`/api/products/${productId}/descriptions/display?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch display descriptions');
      }
      
      const result: DisplayDescriptionsResponse = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data || [];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch raw custom descriptions for admin interface
 */
export function useRawDescriptions(productId: string) {
  return useQuery({
    queryKey: ['custom-descriptions', 'raw', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/descriptions/raw`);
      if (!response.ok) {
        throw new Error('Failed to fetch raw descriptions');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin
  });
}

/**
 * Hook to fetch editable descriptions with templates for admin
 */
export function useEditableDescriptions(productId: string) {
  return useQuery({
    queryKey: ['custom-descriptions', 'editable', productId],
    queryFn: async (): Promise<EditableDescriptionsResponse['data']> => {
      const response = await fetch(`/api/products/${productId}/descriptions/editable`);
      if (!response.ok) {
        throw new Error('Failed to fetch editable descriptions');
      }
      
      const result: EditableDescriptionsResponse = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin
  });
}

/**
 * Hook to fetch available templates
 */
export function useCustomDescriptionTemplates() {
  return useQuery({
    queryKey: ['custom-description-templates'],
    queryFn: async () => {
      const response = await fetch('/api/custom-description-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - templates don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to generate social media content from descriptions
 */
export function useSocialDescriptions(
  productId: string,
  platform: 'facebook' | 'instagram' | 'tiktok' = 'facebook'
) {
  return useQuery({
    queryKey: ['custom-descriptions', 'social', productId, platform],
    queryFn: async () => {
      const params = new URLSearchParams({ platform });
      const response = await fetch(`/api/products/${productId}/descriptions/social?${params}`);
      if (!response.ok) {
        throw new Error('Failed to generate social content');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to generate SEO content from descriptions
 */
export function useSEODescriptions(
  productId: string,
  type: 'meta_description' | 'schema_markup' | 'keywords' = 'meta_description'
) {
  return useQuery({
    queryKey: ['custom-descriptions', 'seo', productId, type],
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      const response = await fetch(`/api/products/${productId}/descriptions/seo?${params}`);
      if (!response.ok) {
        throw new Error('Failed to generate SEO content');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.data;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes - SEO content is stable
  });
}