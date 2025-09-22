import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Eye, 
  Download, 
  Code,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { TemplateDefinition } from '@/types/template';

interface TemplatePreviewProps {
  template: TemplateDefinition | null;
  customization?: any;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  onExport?: () => void;
}

// Sample template preview data based on built-in templates
const getPreviewContent = (template: TemplateDefinition | null, customization: any) => {
  if (!template) return null;

  const { colors, typography, layout } = customization;

  // Dynamic styles based on customization
  const previewStyles = {
    '--primary-color': colors.primary,
    '--secondary-color': colors.secondary,
    '--accent-color': colors.accent,
    '--background-color': colors.background,
    '--font-family': typography.headingFont,
    '--container-width': layout.containerWidth === 'full' ? '100%' : 
                        layout.containerWidth === 'wide' ? '1200px' :
                        layout.containerWidth === 'medium' ? '800px' : '600px',
    '--border-radius': layout.borderRadius === 'none' ? '0' :
                       layout.borderRadius === 'small' ? '4px' :
                       layout.borderRadius === 'medium' ? '8px' : '16px',
    '--spacing': layout.spacing === 'compact' ? '0.5rem' :
                 layout.spacing === 'normal' ? '1rem' : '1.5rem'
  } as React.CSSProperties;

  // Generate preview based on template category
  switch (template.category) {
    case 'ecommerce':
      return (
        <div style={previewStyles} className="p-6 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: colors.primary }}>
              Premium Product Name
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              High-quality product description with key features and benefits that attract customers.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: colors.accent }}>
                $299.99
              </span>
              <Button 
                size="sm" 
                style={{ backgroundColor: colors.primary, color: colors.background }}
              >
                Add to Cart
              </Button>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-sm text-gray-500 ml-1">(24 reviews)</span>
            </div>
          </div>
        </div>
      );

    case 'content':
      return (
        <div style={previewStyles} className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold" style={{ color: colors.primary, fontFamily: typography.headingFont }}>
              Beautiful Hero Section
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: typography.bodyFont }}>
              Create stunning hero sections that capture attention and drive conversions with customizable layouts and styling.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Button size="lg" style={{ backgroundColor: colors.primary, color: colors.background }}>
                Get Started
              </Button>
              <Button variant="outline" size="lg" style={{ borderColor: colors.secondary, color: colors.secondary }}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      );

    case 'navigation':
      return (
        <div style={previewStyles}>
          <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                  Brand Logo
                </h2>
                <div className="hidden md:flex space-x-6">
                  {['Home', 'Products', 'About', 'Contact'].map(item => (
                    <a key={item} href="#" className="text-gray-700 hover:text-gray-900 font-medium">
                      {item}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm" style={{ backgroundColor: colors.primary, color: colors.background }}>
                  Sign Up
                </Button>
              </div>
            </div>
          </nav>
        </div>
      );

    case 'form':
      return (
        <div style={previewStyles} className="p-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>
              Contact Form
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderRadius: layout.borderRadius === 'none' ? '0' :
                                  layout.borderRadius === 'small' ? '4px' :
                                  layout.borderRadius === 'medium' ? '8px' : '16px'
                  } as React.CSSProperties}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderRadius: layout.borderRadius === 'none' ? '0' :
                                  layout.borderRadius === 'small' ? '4px' :
                                  layout.borderRadius === 'medium' ? '8px' : '16px'
                  } as React.CSSProperties}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderRadius: layout.borderRadius === 'none' ? '0' :
                                  layout.borderRadius === 'small' ? '4px' :
                                  layout.borderRadius === 'medium' ? '8px' : '16px'
                  } as React.CSSProperties}
                  placeholder="Your message here..."
                />
              </div>
              <Button 
                className="w-full" 
                style={{ backgroundColor: colors.primary, color: colors.background }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div style={previewStyles} className="p-6 text-center">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-12">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {template.name} Preview
            </h3>
            <p className="text-gray-500">
              Preview will be generated based on template customization
            </p>
          </div>
        </div>
      );
  }
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  customization, 
  previewMode,
  onExport 
}) => {
  const previewContent = getPreviewContent(template, customization);

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-6xl';
    }
  };

  const getPreviewIcon = () => {
    switch (previewMode) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (!template) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Select a Template
          </h3>
          <p className="text-gray-400">
            Choose a template from the sidebar to see its preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Preview Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getPreviewIcon()}
              <h2 className="font-medium text-gray-900">
                {template.name}
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {template.complexity}
            </Badge>
            {(template as any).featured && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-2" />
              View Code
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-8 bg-gray-50 overflow-auto">
        <div className={`mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${getPreviewSize()} transition-all duration-300`}>
          {previewContent}
        </div>
      </div>

      {/* Preview Footer */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Framework: {template.frameworks.join(', ')}</span>
            <span>•</span>
            <span>Platform: {template.platforms.join(', ')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>{(template as any).rating || 4.5}/5</span>
            <span>•</span>
            <span>{(template as any).downloads || 128} downloads</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;