/**
 * Consultation Template Rendering System with Vietnamese Support
 * Merges consultation templates with dynamic data for RASA chatbot responses
 */

import { normalizeVietnamese, vietnameseMatch, vietnameseHighlight } from './vietnameseSearch';

// Consultation data structures
export interface ConsultationData {
  [field: string]: string;
  // Dynamic fields based on category config, examples:
  // "cách_thoa": "Thoa đều lên mặt, massage nhẹ 2-3 phút"
  // "lưu_ý_an_toàn": "Không dùng cho da kích ứng"
  // "bảo_quản": "Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp"
}

export interface CategoryConsultationConfig {
  enabled_types: string[];
  required_fields: string[];
  optional_fields: string[];
  auto_prompts: string[];
}

export interface CategoryConsultationTemplates {
  usage_guide_template?: string;
  safety_template?: string;
  recipe_template?: string;
  technical_template?: string;
  benefits_template?: string;
  care_template?: string;
  storage_template?: string;
  health_benefits_template?: string;
  skin_benefits_template?: string;
  care_instructions_template?: string;
  troubleshooting_template?: string;
  compatibility_template?: string;
}

export interface ConsultationContext {
  productId: string;
  productName: string;
  categoryName?: string;
  industryName?: string;
  customerName?: string;
  customerContext?: string; // Previous conversation context
  consultationType: keyof CategoryConsultationTemplates;
  consultationData: ConsultationData;
  templates: CategoryConsultationTemplates;
  language: 'vietnamese' | 'english';
}

export interface RenderedConsultation {
  content: string;
  templateUsed: string;
  placeholders: string[];
  metadata: {
    productId: string;
    consultationType: string;
    renderTime: Date;
    language: string;
  };
}

/**
 * Consultation Template Renderer - Merges templates with Vietnamese data
 */
export class ConsultationTemplateRenderer {
  private static readonly PLACEHOLDER_PATTERN = /\{([^}]+)\}/g;
  private static readonly VIETNAMESE_PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

  /**
   * Main template rendering method
   */
  static render(context: ConsultationContext): RenderedConsultation {
    const { consultationType, templates, consultationData, language } = context;
    
    // Get the specific template for this consultation type
    const template = templates[consultationType];
    if (!template) {
      throw new Error(`Template not found for consultation type: ${consultationType}`);
    }

    // Merge template with consultation data
    const renderedContent = this.mergeTemplate(template, consultationData, language);
    
    // Extract placeholders used
    const placeholders = this.extractPlaceholders(template);

    return {
      content: renderedContent,
      templateUsed: template,
      placeholders,
      metadata: {
        productId: context.productId,
        consultationType,
        renderTime: new Date(),
        language
      }
    };
  }

  /**
   * Generate preview for template editor
   */
  static generatePreview(context: ConsultationContext): string {
    try {
      const result = this.render(context);
      return result.content;
    } catch (error) {
      return `⚠️ Lỗi template: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Merge template with consultation data using Vietnamese-aware placeholder replacement
   */
  private static mergeTemplate(
    template: string, 
    consultationData: ConsultationData, 
    language: 'vietnamese' | 'english'
  ): string {
    let result = template;

    // Replace double-brace Vietnamese placeholders first {{field_name}}
    result = result.replace(this.VIETNAMESE_PLACEHOLDER_PATTERN, (match, fieldName) => {
      const value = consultationData[fieldName.trim()];
      if (value) {
        return this.formatVietnameseText(value, language);
      }
      return `[Chưa có thông tin: ${fieldName}]`;
    });

    // Replace single-brace placeholders {field_name}
    result = result.replace(this.PLACEHOLDER_PATTERN, (match, fieldName) => {
      const value = consultationData[fieldName.trim()];
      if (value) {
        return this.formatVietnameseText(value, language);
      }
      return `[Missing: ${fieldName}]`;
    });

    // Apply Vietnamese text formatting and normalization
    return this.postProcessVietnameseText(result, language);
  }

  /**
   * Format Vietnamese text with proper punctuation and spacing
   */
  private static formatVietnameseText(text: string, language: 'vietnamese' | 'english'): string {
    if (!text) return '';

    if (language === 'vietnamese') {
      // Vietnamese-specific formatting
      return text
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/([.!?])\s*$/, '$1') // Ensure proper sentence ending
        .replace(/^([a-z])/, (match) => match.toUpperCase()); // Capitalize first letter
    } else {
      // English formatting
      return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/([.!?])\s*$/, '$1')
        .replace(/^([a-z])/, (match) => match.toUpperCase());
    }
  }

  /**
   * Post-process Vietnamese text for readability and consistency
   */
  private static postProcessVietnameseText(text: string, language: 'vietnamese' | 'english'): string {
    if (language === 'vietnamese') {
      return text
        // Fix common Vietnamese spacing issues
        .replace(/\s+([,.!?])/g, '$1')
        // Add proper spacing after punctuation
        .replace(/([.!?])([A-ZÁÀẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÉÈẺẼẸÊỀẾỂỄỆÍÌỈĨỊÓÒỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÚÙỦŨỤƯỪỨỬỮỰÝỲỶỸỴĐ])/g, '$1 $2')
        // Normalize multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
    }
    return text.trim();
  }

  /**
   * Extract all placeholders from a template
   */
  private static extractPlaceholders(template: string): string[] {
    const placeholders = new Set<string>();
    
    // Extract Vietnamese placeholders {{field}}
    let match;
    while ((match = this.VIETNAMESE_PLACEHOLDER_PATTERN.exec(template)) !== null) {
      placeholders.add(match[1].trim());
    }
    
    // Reset regex and extract regular placeholders {field}
    this.PLACEHOLDER_PATTERN.lastIndex = 0;
    while ((match = this.PLACEHOLDER_PATTERN.exec(template)) !== null) {
      placeholders.add(match[1].trim());
    }

    return Array.from(placeholders);
  }

  /**
   * Validate template syntax and placeholders
   */
  static validateTemplate(template: string, availableFields: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    placeholders: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const placeholders = this.extractPlaceholders(template);

    // Check for unmatched braces
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Template có cặp ngoặc nhọn không khớp');
    }

    // Check for missing fields
    placeholders.forEach(placeholder => {
      if (!availableFields.includes(placeholder)) {
        warnings.push(`Trường '${placeholder}' không có trong dữ liệu consultation`);
      }
    });

    // Check for empty template
    if (!template.trim()) {
      errors.push('Template không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      placeholders
    };
  }

  /**
   * Create consultation context from product and category data
   */
  static createContext(
    productId: string,
    productName: string,
    consultationType: keyof CategoryConsultationTemplates,
    consultationData: ConsultationData,
    templates: CategoryConsultationTemplates,
    options: {
      categoryName?: string;
      industryName?: string;
      customerName?: string;
      customerContext?: string;
      language?: 'vietnamese' | 'english';
    } = {}
  ): ConsultationContext {
    return {
      productId,
      productName,
      categoryName: options.categoryName,
      industryName: options.industryName,
      customerName: options.customerName,
      customerContext: options.customerContext,
      consultationType,
      consultationData,
      templates,
      language: options.language || 'vietnamese'
    };
  }

  /**
   * Batch render multiple consultation types for a product
   */
  static renderAll(
    baseContext: Omit<ConsultationContext, 'consultationType'>,
    consultationTypes: (keyof CategoryConsultationTemplates)[]
  ): Record<string, RenderedConsultation> {
    const results: Record<string, RenderedConsultation> = {};

    consultationTypes.forEach(type => {
      try {
        const context: ConsultationContext = {
          ...baseContext,
          consultationType: type
        };
        results[type] = this.render(context);
      } catch (error) {
        console.error(`Failed to render consultation type ${type}:`, error);
        results[type] = {
          content: `Lỗi tạo nội dung tư vấn: ${error instanceof Error ? error.message : 'Unknown error'}`,
          templateUsed: '',
          placeholders: [],
          metadata: {
            productId: baseContext.productId,
            consultationType: type,
            renderTime: new Date(),
            language: baseContext.language
          }
        };
      }
    });

    return results;
  }

  /**
   * Search consultation content with Vietnamese support
   */
  static searchConsultationContent(
    consultations: RenderedConsultation[],
    query: string
  ): RenderedConsultation[] {
    if (!query.trim()) return consultations;

    return consultations.filter(consultation => 
      vietnameseMatch(consultation.content, query) ||
      vietnameseMatch(consultation.metadata.consultationType, query)
    );
  }

  /**
   * Highlight search terms in consultation content
   */
  static highlightSearchTerms(
    content: string,
    query: string,
    className: string = 'bg-yellow-200'
  ): string {
    return vietnameseHighlight(content, query, className);
  }

  /**
   * Generate summary statistics for consultation templates
   */
  static generateStats(consultations: RenderedConsultation[]): {
    totalConsultations: number;
    templateUsage: Record<string, number>;
    averageContentLength: number;
    languageDistribution: Record<string, number>;
    lastRenderTime: Date | null;
  } {
    const templateUsage: Record<string, number> = {};
    const languageDistribution: Record<string, number> = {};
    let totalContentLength = 0;
    let lastRenderTime: Date | null = null;

    consultations.forEach(consultation => {
      // Count template usage
      templateUsage[consultation.metadata.consultationType] = 
        (templateUsage[consultation.metadata.consultationType] || 0) + 1;

      // Count language distribution
      languageDistribution[consultation.metadata.language] = 
        (languageDistribution[consultation.metadata.language] || 0) + 1;

      // Sum content length
      totalContentLength += consultation.content.length;

      // Track latest render time
      if (!lastRenderTime || consultation.metadata.renderTime > lastRenderTime) {
        lastRenderTime = consultation.metadata.renderTime;
      }
    });

    return {
      totalConsultations: consultations.length,
      templateUsage,
      averageContentLength: consultations.length > 0 ? Math.round(totalContentLength / consultations.length) : 0,
      languageDistribution,
      lastRenderTime
    };
  }
}

/**
 * Helper utilities for consultation templates
 */
export const ConsultationUtils = {
  /**
   * Format consultation field names for display
   */
  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  },

  /**
   * Get default templates for common consultation types
   */
  getDefaultTemplates(): CategoryConsultationTemplates {
    return {
      usage_guide_template: "Cách sử dụng {productName}:\n\n{{cách_thoa}}\n\n💡 Lưu ý: {{lưu_ý_an_toàn}}",
      safety_template: "⚠️ Lưu ý an toàn khi sử dụng {productName}:\n\n{{lưu_ý_an_toàn}}\n\n🔍 Kiểm tra: {{kiểm_tra_da}}",
      recipe_template: "🍳 Công thức với {productName}:\n\n{{công_thức}}\n\n⏰ Thời gian: {{thời_gian}}",
      storage_template: "📦 Bảo quản {productName}:\n\n{{bảo_quản}}\n\n🌡️ Điều kiện: {{điều_kiện}}",
      benefits_template: "✨ Lợi ích của {productName}:\n\n{{lợi_ích}}\n\n🎯 Kết quả: {{kết_quả}}",
      care_template: "💚 Chăm sóc với {productName}:\n\n{{cách_chăm_sóc}}\n\n📅 Tần suất: {{tần_suất}}"
    };
  },

  /**
   * Create sample consultation data for testing
   */
  createSampleData(): ConsultationData {
    return {
      cách_thoa: "Thoa đều lên mặt đã làm sạch, massage nhẹ nhàng theo chuyển động tròn",
      lưu_ý_an_toàn: "Không dùng cho da bị kích ứng, tránh vùng mắt",
      bảo_quản: "Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp",
      lợi_ích: "Cung cấp độ ẩm, làm mềm da, giảm lão hóa",
      cách_chăm_sóc: "Sử dụng 2 lần/ngày, sáng và tối sau khi làm sạch da",
      tần_suất: "Hàng ngày, đều đặn để đạt hiệu quả tốt nhất"
    };
  }
};