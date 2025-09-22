import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Grid3X3, 
  Eye, 
  Download, 
  Settings, 
  Palette, 
  Type, 
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Code,
  Save,
  Share2,
  Filter,
  Star,
  Heart,
  ShoppingBag,
  Building2,
  Crown,
  Briefcase
} from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';
import { TemplateDefinition, TemplateCategory, TargetFramework } from '@/types/template';

interface TemplateBuilderProps {
  className?: string;
}

interface TemplateFilters {
  category?: TemplateCategory;
  framework?: TargetFramework;
  search?: string;
  featured?: boolean;
  industry?: string;
  tags?: string;
}

interface CustomizationOptions {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  layout: {
    containerWidth: 'narrow' | 'medium' | 'wide' | 'full';
    spacing: 'compact' | 'normal' | 'relaxed';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
  responsive: {
    breakpoints: string[];
    mobileFirst: boolean;
  };
}

const CATEGORY_ICONS = {
  'ecommerce': ShoppingBag,
  'navigation': Building2,
  'content': Crown,
  'form': Building2,
  'layout': Grid3X3,
  'feedback': Star,
  'data': Briefcase,
  'social': Heart,
  'custom': Grid3X3
} as const;

const COMPLEXITY_COLORS = {
  'basic': 'bg-green-100 text-green-800',
  'intermediate': 'bg-yellow-100 text-yellow-800',
  'advanced': 'bg-orange-100 text-orange-800',
  'enterprise': 'bg-red-100 text-red-800'
} as const;

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ className }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [customization, setCustomization] = useState<CustomizationOptions>({
    colors: {
      primary: '#10b981',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#ffffff'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 'medium'
    },
    layout: {
      containerWidth: 'medium',
      spacing: 'normal',
      borderRadius: 'medium'
    },
    responsive: {
      breakpoints: ['640px', '768px', '1024px', '1280px'],
      mobileFirst: true
    }
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.framework) params.append('framework', filters.framework);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.tags) params.append('tags', filters.tags);
      
      const response = await fetch(`/api/templates?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: TemplateDefinition) => {
    setSelectedTemplate(template);
    setActiveTab('customize');
  };

  const handleCustomizationChange = (section: keyof CustomizationOptions, key: string, value: any) => {
    setCustomization(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleExportTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          framework: 'react',
          customizations: customization
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Handle download logic
        console.log('Template compiled successfully:', data);
      }
    } catch (error) {
      console.error('Failed to export template:', error);
    }
  };

  const renderTemplateCard = (template: TemplateDefinition) => {
    const CategoryIcon = CATEGORY_ICONS[template.category] || Grid3X3;
    const complexityColor = COMPLEXITY_COLORS[template.complexity] || 'bg-gray-100 text-gray-800';

    return (
      <Card 
        key={template.id}
        className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-0 ring-1 ring-gray-200 hover:ring-gray-300"
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-sm font-medium text-gray-900">
                {template.name}
              </CardTitle>
            </div>
            {template.metadata?.featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Preview Image */}
            <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className={`text-xs ${complexityColor}`}>
                {template.complexity}
              </Badge>
              {(template as any).businessType && (
                <Badge variant="outline" className="text-xs">
                  {(template as any).businessType}
                </Badge>
              )}
            </div>
            
            {/* Frameworks */}
            <div className="flex items-center space-x-1">
              <Code className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {template.frameworks.slice(0, 2).join(', ')}
                {template.frameworks.length > 2 && ` +${template.frameworks.length - 2}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`h-full bg-white ${className}`}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              🎨 Template Builder
            </h1>
            <p className="text-sm text-gray-600">
              Build và customize templates cho Landing Pages và Storefronts
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
              <TabsTrigger value="customize" className="text-xs">Customize</TabsTrigger>
              <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 flex flex-col px-6 py-4">
              {/* Search & Filters */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-10 text-sm"
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Select 
                    value={filters.category || ''} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as TemplateCategory }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="navigation">Navigation</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="layout">Layout</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filters.industry || ''} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template List */}
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : templates.length > 0 ? (
                    templates.map(renderTemplateCard)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No templates found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="customize" className="flex-1 px-6 py-4">
              {selectedTemplate ? (
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Colors</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Primary</Label>
                          <Input
                            type="color"
                            value={customization.colors.primary}
                            onChange={(e) => handleCustomizationChange('colors', 'primary', e.target.value)}
                            className="h-8 w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Secondary</Label>
                          <Input
                            type="color"
                            value={customization.colors.secondary}
                            onChange={(e) => handleCustomizationChange('colors', 'secondary', e.target.value)}
                            className="h-8 w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Typography</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600">Font Family</Label>
                          <Select 
                            value={customization.typography.headingFont}
                            onValueChange={(value) => handleCustomizationChange('typography', 'headingFont', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Font Size</Label>
                          <Select 
                            value={customization.typography.fontSize}
                            onValueChange={(value) => handleCustomizationChange('typography', 'fontSize', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Layout</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600">Container Width</Label>
                          <Select 
                            value={customization.layout.containerWidth}
                            onValueChange={(value) => handleCustomizationChange('layout', 'containerWidth', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="narrow">Narrow</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="wide">Wide</SelectItem>
                              <SelectItem value="full">Full Width</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Spacing</Label>
                          <Select 
                            value={customization.layout.spacing}
                            onValueChange={(value) => handleCustomizationChange('layout', 'spacing', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="relaxed">Relaxed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">Select a template to customize</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="flex-1 px-6 py-4">
              {selectedTemplate ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Export Options</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export your customized template as code
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button onClick={handleExportTemplate} className="w-full" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download React Component
                    </Button>
                    
                    <Button variant="outline" className="w-full" size="sm">
                      <Code className="h-4 w-4 mr-2" />
                      Copy HTML/CSS
                    </Button>
                    
                    <Button variant="outline" className="w-full" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">Select and customize a template to export</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Enhanced Preview Area */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="font-medium text-gray-900">
                  Template Preview
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <TemplatePreview
            template={selectedTemplate}
            customization={customization}
            previewMode={previewMode}
            onExport={handleExportTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;