/**
 * React Hook for Consultation Template Rendering
 * Integrates ConsultationTemplateRenderer with React components and API calls
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ConsultationTemplateRenderer,
  ConsultationContext,
  RenderedConsultation,
  CategoryConsultationTemplates,
  ConsultationData,
  CategoryConsultationConfig
} from '@/utils/consultationTemplates';

interface ConsultationAPIData {
  product: {
    id: string;
    name: string;
    categoryId: string;
    consultationData: ConsultationData;
  };
  category: {
    id: string;
    name: string;
    industryId: string;
    consultationConfig: CategoryConsultationConfig;
    consultationTemplates: CategoryConsultationTemplates;
  };
  industry: {
    id: string;
    name: string;
  };
}

interface UseConsultationRendererOptions {
  productId: string;
  language?: 'vietnamese' | 'english';
  customerName?: string;
  customerContext?: string;
  autoRender?: boolean; // Auto-render when data loads
  enableCaching?: boolean;
}

interface UseConsultationRendererReturn {
  // Data
  consultationData: ConsultationAPIData | null;
  renderedConsultations: Record<string, RenderedConsultation>;
  
  // Loading states
  isLoading: boolean;
  isRendering: boolean;
  
  // Errors
  error: Error | null;
  renderErrors: Record<string, string>;
  
  // Actions
  renderConsultation: (type: keyof CategoryConsultationTemplates) => Promise<RenderedConsultation>;
  renderAllConsultations: () => Promise<Record<string, RenderedConsultation>>;
  refreshData: () => void;
  clearCache: () => void;
  
  // Utilities
  validateTemplate: (template: string) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  searchConsultations: (query: string) => RenderedConsultation[];
  getAvailableConsultationTypes: () => (keyof CategoryConsultationTemplates)[];
  
  // Stats
  renderStats: {
    totalRendered: number;
    templateUsage: Record<string, number>;
    averageContentLength: number;
    lastRenderTime: Date | null;
  };
}

export function useConsultationRenderer(
  options: UseConsultationRendererOptions
): UseConsultationRendererReturn {
  const {
    productId,
    language = 'vietnamese',
    customerName,
    customerContext,
    autoRender = true,
    enableCaching = true
  } = options;

  // State management
  const [renderedConsultations, setRenderedConsultations] = useState<Record<string, RenderedConsultation>>({});
  const [isRendering, setIsRendering] = useState(false);
  const [renderErrors, setRenderErrors] = useState<Record<string, string>>({});

  // Fetch consultation data from API
  const {
    data: consultationData,
    isLoading,
    error,
    refetch: refreshData
  } = useQuery({
    queryKey: ['consultation', productId],
    queryFn: async (): Promise<ConsultationAPIData> => {
      const response = await apiRequest(`/api/consultation/product/${productId}`, 'GET');
      if (!response.ok) {
        throw new Error('Failed to fetch consultation data');
      }
      const data = await response.json();
      if (!data.status || data.status !== 'success') {
        throw new Error(data.error || 'Failed to fetch consultation data');
      }
      return data.data;
    },
    enabled: !!productId,
    staleTime: enableCaching ? 5 * 60 * 1000 : 0, // 5 minutes cache
    retry: 2
  });

  // Create base consultation context
  const baseContext = useMemo(() => {
    if (!consultationData) return null;

    const { product, category, industry } = consultationData;
    
    return {
      productId: product.id,
      productName: product.name,
      categoryName: category.name,
      industryName: industry.name,
      customerName,
      customerContext,
      consultationData: product.consultationData,
      templates: category.consultationTemplates,
      language
    };
  }, [consultationData, customerName, customerContext, language]);

  // Get available consultation types
  const getAvailableConsultationTypes = useCallback((): (keyof CategoryConsultationTemplates)[] => {
    if (!consultationData) return [];
    
    const { consultationTemplates } = consultationData.category;
    return Object.keys(consultationTemplates).filter(
      key => consultationTemplates[key as keyof CategoryConsultationTemplates]
    ) as (keyof CategoryConsultationTemplates)[];
  }, [consultationData]);

  // Render single consultation
  const renderConsultation = useCallback(async (
    type: keyof CategoryConsultationTemplates
  ): Promise<RenderedConsultation> => {
    if (!baseContext) {
      throw new Error('Consultation data not loaded');
    }

    setIsRendering(true);
    setRenderErrors(prev => ({ ...prev, [type]: '' }));

    try {
      const context: ConsultationContext = {
        ...baseContext,
        consultationType: type
      };

      const result = ConsultationTemplateRenderer.render(context);
      
      setRenderedConsultations(prev => ({
        ...prev,
        [type]: result
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRenderErrors(prev => ({ ...prev, [type]: errorMessage }));
      throw error;
    } finally {
      setIsRendering(false);
    }
  }, [baseContext]);

  // Render all available consultations
  const renderAllConsultations = useCallback(async (): Promise<Record<string, RenderedConsultation>> => {
    if (!baseContext) {
      throw new Error('Consultation data not loaded');
    }

    setIsRendering(true);
    setRenderErrors({});

    try {
      const availableTypes = getAvailableConsultationTypes();
      const results = ConsultationTemplateRenderer.renderAll(baseContext, availableTypes);
      
      setRenderedConsultations(results);
      return results;
    } catch (error) {
      console.error('Failed to render all consultations:', error);
      throw error;
    } finally {
      setIsRendering(false);
    }
  }, [baseContext, getAvailableConsultationTypes]);

  // Auto-render when data loads
  useEffect(() => {
    if (autoRender && baseContext && Object.keys(renderedConsultations).length === 0) {
      renderAllConsultations().catch(console.error);
    }
  }, [autoRender, baseContext, renderedConsultations, renderAllConsultations]);

  // Template validation
  const validateTemplate = useCallback((template: string) => {
    if (!consultationData) {
      return {
        isValid: false,
        errors: ['Consultation data not loaded'],
        warnings: []
      };
    }

    const availableFields = Object.keys(consultationData.product.consultationData);
    return ConsultationTemplateRenderer.validateTemplate(template, availableFields);
  }, [consultationData]);

  // Search consultations
  const searchConsultations = useCallback((query: string): RenderedConsultation[] => {
    const consultations = Object.values(renderedConsultations);
    return ConsultationTemplateRenderer.searchConsultationContent(consultations, query);
  }, [renderedConsultations]);

  // Clear cache
  const clearCache = useCallback(() => {
    setRenderedConsultations({});
    setRenderErrors({});
  }, []);

  // Generate stats
  const renderStats = useMemo(() => {
    const consultations = Object.values(renderedConsultations);
    const stats = ConsultationTemplateRenderer.generateStats(consultations);
    
    return {
      totalRendered: stats.totalConsultations,
      templateUsage: stats.templateUsage,
      averageContentLength: stats.averageContentLength,
      lastRenderTime: stats.lastRenderTime
    };
  }, [renderedConsultations]);

  return {
    // Data
    consultationData: consultationData || null,
    renderedConsultations,
    
    // Loading states
    isLoading,
    isRendering,
    
    // Errors
    error: error as Error | null,
    renderErrors,
    
    // Actions
    renderConsultation,
    renderAllConsultations,
    refreshData,
    clearCache,
    
    // Utilities
    validateTemplate,
    searchConsultations,
    getAvailableConsultationTypes,
    
    // Stats
    renderStats
  };
}

/**
 * Hook for template preview in CategoryManager
 */
export function useConsultationTemplatePreview(
  template: string,
  sampleData: ConsultationData,
  language: 'vietnamese' | 'english' = 'vietnamese'
) {
  const [preview, setPreview] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!template.trim()) {
      setPreview('');
      setIsValid(true);
      setErrors([]);
      return;
    }

    try {
      // Validate template
      const validation = ConsultationTemplateRenderer.validateTemplate(
        template, 
        Object.keys(sampleData)
      );
      
      setIsValid(validation.isValid);
      setErrors(validation.errors);

      if (validation.isValid) {
        // Generate preview with sample data
        const mockContext: ConsultationContext = {
          productId: 'preview',
          productName: 'Sản phẩm mẫu',
          categoryName: 'Danh mục mẫu',
          industryName: 'Ngành hàng mẫu',
          consultationType: 'usage_guide_template',
          consultationData: sampleData,
          templates: { usage_guide_template: template },
          language
        };

        const result = ConsultationTemplateRenderer.generatePreview(mockContext);
        setPreview(result);
      } else {
        setPreview('Template có lỗi, vui lòng kiểm tra lại');
      }
    } catch (error) {
      setIsValid(false);
      setErrors([error instanceof Error ? error.message : 'Unknown error']);
      setPreview('Lỗi khi tạo preview');
    }
  }, [template, sampleData, language]);

  return {
    preview,
    isValid,
    errors,
    hasWarnings: errors.length > 0
  };
}