/**
 * 🎯 APPROACH 2: DYNAMIC PRODUCT FIELDS
 * Admin Interface for Custom Description Management
 * Template + Custom Field Management for Vietnamese Incense Business
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  CustomDescriptionsDisplay,
  CustomDescriptionFieldComponent 
} from '../CustomDescriptionField';
import { cn } from '../../lib/utils';
import type { 
  CustomDescriptionData, 
  CustomDescriptionField, 
  FieldType, 
  FieldCategory,
  CustomDescriptionTemplate
} from '../../../../shared/schema';

interface CustomDescriptionManagerProps {
  productId: string;
  currentDescriptions: CustomDescriptionData;
  availableTemplates: CustomDescriptionTemplate[];
  onSave: (data: CustomDescriptionData) => Promise<boolean>;
  onPreview?: (data: CustomDescriptionData) => void;
}

interface NewFieldFormProps {
  onAdd: (field: CustomDescriptionField, key: string) => void;
  onCancel: () => void;
}

interface TemplateManagerProps {
  templates: CustomDescriptionTemplate[];
  onApplyTemplate: (template: CustomDescriptionTemplate) => void;
}

/**
 * Form for adding new custom fields
 */
const NewFieldForm: React.FC<NewFieldFormProps> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    type: 'text' as FieldType,
    category: 'main' as FieldCategory,
    icon: '',
    required: false,
    displayOrder: 1,
    contexts: ['storefront'] as ('storefront' | 'chatbot' | 'social' | 'seo')[],
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const [value, setValue] = useState<string | string[]>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key || !formData.label) return;

    const field: CustomDescriptionField = {
      label: formData.label,
      value: formData.type === 'list' ? (Array.isArray(value) ? value : []) : (value as string),
      type: formData.type,
      category: formData.category,
      displayOrder: formData.displayOrder,
      icon: formData.icon || undefined,
      required: formData.required,
      contexts: formData.contexts,
      priority: formData.priority
    };

    onAdd(field, formData.key);
    
    // Reset form
    setFormData({
      key: '',
      label: '',
      type: 'text',
      category: 'main',
      icon: '',
      required: false,
      displayOrder: 1,
      contexts: ['storefront'],
      priority: 'medium'
    });
    setValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Thêm Trường Mô Tả Mới</CardTitle>
        <CardDescription>
          Tạo trường mô tả tùy chỉnh cho sản phẩm nhang sạch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key and Label */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="field-key">Key (ID)</Label>
              <Input
                id="field-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="spiritual_meaning"
                pattern="[a-z_]+"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Chỉ chữ thường và dấu gạch dưới</p>
            </div>
            <div>
              <Label htmlFor="field-label">Nhãn hiển thị</Label>
              <Input
                id="field-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ý nghĩa tâm linh"
                required
              />
            </div>
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Loại trường</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: FieldType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text ngắn</SelectItem>
                  <SelectItem value="textarea">Text dài</SelectItem>
                  <SelectItem value="list">Danh sách</SelectItem>
                  <SelectItem value="rich_text">Rich Text/HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Danh mục</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: FieldCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">🔵 Thông tin chính</SelectItem>
                  <SelectItem value="spiritual">🙏 Tâm linh</SelectItem>
                  <SelectItem value="cultural">🏛️ Văn hóa</SelectItem>
                  <SelectItem value="technical">⚙️ Kỹ thuật</SelectItem>
                  <SelectItem value="sales">💎 Bán hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon and Order */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="field-icon">Icon (emoji)</Label>
              <Input
                id="field-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🔥"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="field-order">Thứ tự</Label>
              <Input
                id="field-order"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div>
              <Label>Ưu tiên</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'high' | 'medium' | 'low') => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contexts */}
          <div>
            <Label>Sử dụng cho</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { key: 'storefront', label: 'Storefront' },
                { key: 'chatbot', label: 'Chatbot' },
                { key: 'social', label: 'Social Media' },
                { key: 'seo', label: 'SEO' }
              ].map(({ key, label }) => (
                <Badge
                  key={key}
                  variant={formData.contexts.includes(key as any) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newContexts = formData.contexts.includes(key as any)
                      ? formData.contexts.filter(c => c !== key)
                      : [...formData.contexts, key as any];
                    setFormData({ ...formData, contexts: newContexts });
                  }}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <Label>Giá trị mặc định</Label>
            <CustomDescriptionFieldComponent
              field={{
                label: formData.label || 'Preview',
                value: value,
                type: formData.type,
                category: formData.category,
                displayOrder: formData.displayOrder,
                icon: formData.icon
              }}
              mode="edit"
              onChange={setValue}
            />
          </div>

          {/* Required */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="field-required"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="field-required">Bắt buộc</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="submit">
              Thêm trường
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

/**
 * Template Manager Component
 */
const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onApplyTemplate }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Templates cho Nhang Sạch</h3>
        <p className="text-sm text-gray-600 mb-4">
          Áp dụng template có sẵn để tạo nhanh các trường mô tả chuẩn
        </p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <span className="text-4xl mb-4 block">📝</span>
            <p className="text-gray-500">Chưa có template nào</p>
            <p className="text-sm text-gray-400 mt-2">
              Template sẽ được tạo tự động khi có dữ liệu mẫu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{template.templateName}</h4>
                    <p className="text-sm text-gray-600">
                      {Object.keys(template.fieldTemplate).length} trường
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onApplyTemplate(template)}
                    className="ml-4"
                  >
                    Áp dụng
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {Object.values(template.fieldTemplate).map((field, fieldIndex) => (
                    <Badge key={fieldIndex} variant="outline" className="text-xs">
                      {field.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Custom Description Manager Component
 */
export const CustomDescriptionManager: React.FC<CustomDescriptionManagerProps> = ({
  productId,
  currentDescriptions,
  availableTemplates,
  onSave,
  onPreview
}) => {
  const [descriptions, setDescriptions] = useState<CustomDescriptionData>(currentDescriptions);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');

  useEffect(() => {
    setDescriptions(currentDescriptions);
  }, [currentDescriptions]);

  const handleAddField = (field: CustomDescriptionField, key: string) => {
    setDescriptions(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: field
      }
    }));
    setShowNewFieldForm(false);
  };

  const handleFieldChange = (key: string, value: string | string[]) => {
    setDescriptions(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          value
        }
      }
    }));
  };

  const handleRemoveField = (key: string) => {
    setDescriptions(prev => {
      const newFields = { ...prev.fields };
      delete newFields[key];
      return {
        ...prev,
        fields: newFields
      };
    });
  };

  const handleApplyTemplate = (template: CustomDescriptionTemplate) => {
    const newFields: { [key: string]: CustomDescriptionField } = {};
    
    Object.entries(template.fieldTemplate).forEach(([key, fieldTemplate]) => {
      newFields[key] = {
        label: fieldTemplate.label,
        value: fieldTemplate.type === 'list' ? [] : (fieldTemplate.defaultValue || ''),
        type: fieldTemplate.type,
        category: fieldTemplate.category,
        displayOrder: Object.keys(newFields).length + 1,
        icon: fieldTemplate.icon,
        required: fieldTemplate.required,
        contexts: ['storefront', 'chatbot'],
        priority: 'medium'
      };
    });

    setDescriptions(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        ...newFields
      }
    }));

    setActiveTab('fields');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(descriptions);
      if (success) {
        // Show success feedback
        console.log('Custom descriptions saved successfully');
      }
    } catch (error) {
      console.error('Failed to save custom descriptions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    onPreview?.(descriptions);
  };

  // Group fields for display
  const groupedFields = Object.entries(descriptions.fields).reduce((acc, [key, field]) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push({ ...field, key });
    return acc;
  }, {} as { [category: string]: (CustomDescriptionField & { key: string })[] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản Lý Mô Tả Tùy Chỉnh</h2>
          <p className="text-gray-600 mt-1">
            Tạo và chỉnh sửa mô tả linh hoạt cho sản phẩm nhang sạch
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            👁️ Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : '💾 Lưu'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields">Trường hiện tại</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Current Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {Object.keys(descriptions.fields).length} trường đã tạo
            </p>
            <Button onClick={() => setShowNewFieldForm(true)}>
              ➕ Thêm trường
            </Button>
          </div>

          {showNewFieldForm && (
            <NewFieldForm
              onAdd={handleAddField}
              onCancel={() => setShowNewFieldForm(false)}
            />
          )}

          {Object.keys(descriptions.fields).length > 0 ? (
            <CustomDescriptionsDisplay
              descriptions={groupedFields}
              mode="edit"
              onFieldChange={handleFieldChange}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <span className="text-4xl mb-4 block">📝</span>
                <p className="text-gray-500">Chưa có trường mô tả nào</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowNewFieldForm(true)}
                >
                  Tạo trường đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <TemplateManager
            templates={availableTemplates}
            onApplyTemplate={handleApplyTemplate}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview - Storefront Display</CardTitle>
              <CardDescription>
                Xem trước cách hiển thị trên storefront di động
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                <CustomDescriptionsDisplay
                  descriptions={groupedFields}
                  mode="display"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomDescriptionManager;