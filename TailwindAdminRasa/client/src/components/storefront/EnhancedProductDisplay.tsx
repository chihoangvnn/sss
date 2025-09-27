/**
 * 🎯 APPROACH 2: DYNAMIC PRODUCT FIELDS
 * Enhanced Product Display with Custom Descriptions
 * Specialized for Vietnamese incense business - spiritual & cultural context
 */

import React from 'react';
import { useDisplayDescriptions } from '../../hooks/useCustomDescriptions';
import { CustomDescriptionFieldComponent } from '../CustomDescriptionField';
import type { Product, CustomDescriptionField as CustomDescriptionFieldData } from '../../../../shared/schema';

interface EnhancedProductDisplayProps {
  product: Product;
  context?: 'mobile' | 'desktop' | 'admin';
  showCategories?: string[]; // Filter which categories to show
  className?: string;
}

/**
 * Vietnamese incense business category priorities for mobile display
 */
const MOBILE_CATEGORY_ORDER = ['spiritual', 'main', 'cultural', 'technical', 'sales'];
const DESKTOP_CATEGORY_ORDER = ['main', 'spiritual', 'cultural', 'technical', 'sales'];

const CATEGORY_ICONS = {
  spiritual: '🙏',
  cultural: '🏛️', 
  main: '📋',
  technical: '⚙️',
  sales: '💎'
};

const CATEGORY_LABELS = {
  spiritual: 'Tâm linh',
  cultural: 'Văn hóa',
  main: 'Thông tin chính',
  technical: 'Kỹ thuật',
  sales: 'Bán hàng'
};

export function EnhancedProductDisplay({
  product,
  context = 'mobile',
  showCategories,
  className = ''
}: EnhancedProductDisplayProps) {
  // Fetch custom descriptions optimized for display
  const { 
    data: customFields = [], 
    isLoading, 
    error 
  } = useDisplayDescriptions(product.id, {
    context,
    includeEmpty: false
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <span className="text-yellow-500">⚠️</span> Không thể tải thông tin bổ sung
      </div>
    );
  }

  if (!customFields.length) {
    return (
      <div className={`text-gray-400 text-sm italic ${className}`}>
        Chưa có thông tin bổ sung cho sản phẩm này
      </div>
    );
  }

  // Group fields by category and sort by priority
  const fieldsByCategory = customFields.reduce((acc, field) => {
    const category = field.category || 'main';
    if (!acc[category]) acc[category] = [];
    acc[category].push(field);
    return acc;
  }, {} as Record<string, CustomDescriptionFieldData[]>);

  // Filter categories if specified
  const allowedCategories = showCategories || Object.keys(fieldsByCategory);
  const categoryOrder = context === 'mobile' ? MOBILE_CATEGORY_ORDER : DESKTOP_CATEGORY_ORDER;
  
  const sortedCategories = categoryOrder
    .filter(cat => allowedCategories.includes(cat) && fieldsByCategory[cat])
    .concat(
      Object.keys(fieldsByCategory).filter(
        cat => !categoryOrder.includes(cat) && allowedCategories.includes(cat)
      )
    );

  if (context === 'mobile') {
    return (
      <div className={`space-y-4 ${className}`}>
        {sortedCategories.map(category => {
          const fields = fieldsByCategory[category];
          const sortedFields = fields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          
          return (
            <div key={category} className="bg-white rounded-lg border border-gray-100 p-4">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <span className="text-lg">
                  {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📋'}
                </span>
                <h3 className="font-semibold text-gray-800">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h3>
                <span className="text-xs text-gray-500 ml-auto">
                  {fields.length} mục
                </span>
              </div>
              
              {/* Fields */}
              <div className="space-y-3">
                {sortedFields.map((field, index) => (
                  <CustomDescriptionFieldComponent
                    key={`${category}-${index}`}
                    field={field}
                    mode="display"
                    className="text-sm"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop layout - more compact
  return (
    <div className={`grid gap-4 ${context === 'desktop' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} ${className}`}>
      {sortedCategories.map(category => {
        const fields = fieldsByCategory[category];
        const sortedFields = fields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        return (
          <div key={category} className="bg-white rounded-lg border border-gray-100 p-3">
            {/* Compact Category Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">
                {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📋'}
              </span>
              <h4 className="font-medium text-gray-700 text-sm">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              </h4>
            </div>
            
            {/* Compact Fields */}
            <div className="space-y-2">
              {sortedFields.map((field, index) => (
                <CustomDescriptionFieldComponent
                  key={`${category}-${index}`}
                  field={field}
                  mode="display"
                  className="text-xs"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Specialized component for Vietnamese incense spiritual information
 */
export function SpiritualInfoDisplay({ product }: { product: Product }) {
  return (
    <EnhancedProductDisplay
      product={product}
      context="mobile"
      showCategories={['spiritual', 'cultural']}
      className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg"
    />
  );
}

/**
 * Quick info display for product cards
 */
export function QuickInfoDisplay({ product }: { product: Product }) {
  return (
    <EnhancedProductDisplay
      product={product}
      context="mobile"
      showCategories={['main']}
      className="text-xs"
    />
  );
}

/**
 * Comprehensive display for product detail modal
 */
export function ComprehensiveDisplay({ product }: { product: Product }) {
  return (
    <EnhancedProductDisplay
      product={product}
      context="desktop"
      className="mt-4"
    />
  );
}