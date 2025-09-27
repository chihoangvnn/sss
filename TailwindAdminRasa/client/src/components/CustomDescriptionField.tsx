/**
 * 🎯 APPROACH 2: DYNAMIC PRODUCT FIELDS
 * Shared Components for Custom Description Fields
 * Used across Admin Panel, Storefront, and Preview modes
 */

import React from 'react';
import { cn } from '../lib/utils';
import type { CustomDescriptionField, FieldType, FieldCategory } from '../../../shared/schema';

interface CustomDescriptionFieldProps {
  field: CustomDescriptionField & { key?: string };
  mode: 'display' | 'edit' | 'preview';
  onChange?: (value: string | string[]) => void;
  className?: string;
}

interface CustomDescriptionGroupProps {
  category: FieldCategory;
  fields: (CustomDescriptionField & { key?: string })[];
  mode: 'display' | 'edit' | 'preview';
  onFieldChange?: (key: string, value: string | string[]) => void;
  className?: string;
}

/**
 * Individual Custom Description Field Component
 */
export const CustomDescriptionFieldComponent: React.FC<CustomDescriptionFieldProps> = ({
  field,
  mode,
  onChange,
  className
}) => {
  const getCategoryStyles = (category: FieldCategory) => {
    switch (category) {
      case 'spiritual':
        return 'border-red-200 bg-red-50 text-red-900';
      case 'cultural':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      case 'main':
        return 'border-blue-200 bg-blue-50 text-blue-900';
      case 'technical':
        return 'border-gray-200 bg-gray-50 text-gray-700';
      case 'sales':
        return 'border-green-200 bg-green-50 text-green-900';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const renderFieldValue = () => {
    if (mode === 'edit') {
      return renderEditMode();
    }

    // Display mode
    if (Array.isArray(field.value)) {
      return (
        <ul className="space-y-1">
          {field.value.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (field.type === 'rich_text') {
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: field.value as string }}
        />
      );
    }

    return <p className="whitespace-pre-wrap">{field.value as string}</p>;
  };

  const renderEditMode = () => {
    const commonClasses = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:border-amber-300";

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={field.value as string}
            onChange={(e) => onChange?.(e.target.value)}
            className={commonClasses}
            placeholder={`Nhập ${field.label.toLowerCase()}...`}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={field.value as string}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${commonClasses} min-h-[100px] resize-y`}
            placeholder={`Nhập ${field.label.toLowerCase()}...`}
            rows={4}
          />
        );

      case 'list':
        const listValue = Array.isArray(field.value) ? field.value : [];
        return (
          <div className="space-y-2">
            {listValue.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newList = [...listValue];
                    newList[index] = e.target.value;
                    onChange?.(newList);
                  }}
                  className={commonClasses}
                  placeholder={`${field.label} ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newList = listValue.filter((_, i) => i !== index);
                    onChange?.(newList);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange?.([...listValue, ''])}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              + Thêm mục
            </button>
          </div>
        );

      case 'rich_text':
        return (
          <textarea
            value={field.value as string}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${commonClasses} min-h-[120px] resize-y font-mono text-sm`}
            placeholder="Nhập HTML hoặc Markdown..."
            rows={6}
          />
        );

      default:
        return null;
    }
  };

  if (mode === 'display' && (!field.value || 
    (Array.isArray(field.value) && field.value.length === 0) ||
    (typeof field.value === 'string' && field.value.trim() === ''))) {
    return null; // Don't render empty fields in display mode
  }

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all duration-200',
      getCategoryStyles(field.category),
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        {field.icon && (
          <span className="text-lg" role="img" aria-label={field.label}>
            {field.icon}
          </span>
        )}
        <h4 className="font-semibold text-sm">
          {field.label}
          {field.required && mode === 'edit' && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h4>
      </div>
      
      <div className="text-sm">
        {renderFieldValue()}
      </div>

      {mode === 'preview' && (
        <div className="mt-2 text-xs opacity-60">
          {field.category} • {field.type} • Order: {field.displayOrder}
        </div>
      )}
    </div>
  );
};

/**
 * Custom Description Group Component
 * Groups fields by category with proper styling
 */
export const CustomDescriptionGroup: React.FC<CustomDescriptionGroupProps> = ({
  category,
  fields,
  mode,
  onFieldChange,
  className
}) => {
  const getCategoryInfo = (category: FieldCategory) => {
    switch (category) {
      case 'spiritual':
        return { 
          title: 'Ý Nghĩa Tâm Linh', 
          icon: '🙏',
          description: 'Thông tin về công dụng tâm linh và văn hóa'
        };
      case 'cultural':
        return { 
          title: 'Văn Hóa Truyền Thống', 
          icon: '🏛️',
          description: 'Câu chuyện xuất xứ và truyền thống'
        };
      case 'main':
        return { 
          title: 'Thông Tin Chính', 
          icon: '📋',
          description: 'Mô tả chính về sản phẩm'
        };
      case 'technical':
        return { 
          title: 'Thông Số Kỹ Thuật', 
          icon: '⚙️',
          description: 'Chi tiết kỹ thuật và quy cách'
        };
      case 'sales':
        return { 
          title: 'Điểm Bán Hàng', 
          icon: '💎',
          description: 'Ưu điểm và lợi ích nổi bật'
        };
      default:
        return { 
          title: 'Khác', 
          icon: '📄',
          description: 'Thông tin bổ sung'
        };
    }
  };

  const categoryInfo = getCategoryInfo(category);
  const sortedFields = fields.sort((a, b) => a.displayOrder - b.displayOrder);

  if (sortedFields.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Category Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <span className="text-2xl">{categoryInfo.icon}</span>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{categoryInfo.title}</h3>
          {mode !== 'display' && (
            <p className="text-sm text-gray-600">{categoryInfo.description}</p>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {sortedFields.map((field) => (
          <CustomDescriptionFieldComponent
            key={field.key || `field-${field.displayOrder}`}
            field={field}
            mode={mode}
            onChange={field.key && onFieldChange ? 
              (value) => onFieldChange(field.key!, value) : 
              undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Full Custom Descriptions Display Component
 * Renders all categories with proper grouping
 */
interface CustomDescriptionsDisplayProps {
  descriptions: { [category: string]: (CustomDescriptionField & { key?: string })[] };
  mode?: 'display' | 'edit' | 'preview';
  onFieldChange?: (key: string, value: string | string[]) => void;
  className?: string;
}

export const CustomDescriptionsDisplay: React.FC<CustomDescriptionsDisplayProps> = ({
  descriptions,
  mode = 'display',
  onFieldChange,
  className
}) => {
  const categoryOrder: FieldCategory[] = ['main', 'spiritual', 'cultural', 'technical', 'sales'];
  
  // Filter and sort categories
  const orderedCategories = categoryOrder.filter(cat => 
    descriptions[cat] && descriptions[cat].length > 0
  );

  if (orderedCategories.length === 0) {
    if (mode === 'display') return null;
    
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-4 block">📝</span>
        <p>Chưa có mô tả tùy chỉnh nào</p>
        {mode === 'edit' && (
          <p className="text-sm mt-2">Hãy thêm các trường mô tả cho sản phẩm</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {orderedCategories.map((category) => (
        <CustomDescriptionGroup
          key={category}
          category={category}
          fields={descriptions[category]}
          mode={mode}
          onFieldChange={onFieldChange}
        />
      ))}
    </div>
  );
};

export default CustomDescriptionsDisplay;