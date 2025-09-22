import { TemplateDefinition } from '@/types/template';

/**
 * 🚀 Startup Feature Card Template
 * 
 * Modern and innovative feature card for tech startups and SaaS products
 * Features bold colors, modern typography, and growth-oriented design
 */
export const StartupFeatureCardTemplate: TemplateDefinition = {
  id: 'startup-feature-card',
  name: 'Startup Feature Card',
  category: 'content',
  complexity: 'intermediate',
  description: 'Bold and innovative feature card for tech startups with modern gradients and interactive elements',
  version: '1.0.0',
  
  // Targeting
  frameworks: ['react'],
  platforms: ['web', 'mobile'],
  
  // Theme Compatibility
  compatibleThemes: ['all'],
  requiresTheme: false,
  themeOverrides: {
    colorPalette: {
      primary: '#8b5cf6',        // Purple
      secondary: '#06b6d4',      // Cyan
      accent: '#f59e0b',         // Amber
      background: '#fafafa',     // Off-white
      surface: '#ffffff',        // White cards
      onSurface: '#1f2937'       // Dark gray text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InN0YXJ0dXBHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4QjVDRjYiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDZCNkQ0Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2ZyB4PSIwIiB5PSIwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiPgo8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgcng9IjEyIiBmaWxsPSJ1cmwoI3N0YXJ0dXBHcmFkaWVudCkiLz4KPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iMTYiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMyIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSIxMiIgZmlsbD0iI0ZGRkZGRiIvPgo8c3ZnIHg9IjU0IiB5PSI1NCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiM4QjVDRjYiPgo8cGF0aCBkPSJNMTIgMmw2IDkgNS0ybC01IDEwLTYtOUw3IDE1bDUtMTB6Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIxMDUiIHk9IjU0IiBmb250LWZhbWlseT0iU3BhY2UgR3JvdGVzayIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iI0ZGRkZGRiI+SW5ub3ZhdGlvbjwvdGV4dD4KPHN2ZyB4PSIyNjAiIHk9IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxOCA2LTYtNi02Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIxMDUiIHk9IjcyIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuOSI+U2NhbGUgeW91ciBidXNpbmVzcyB3aXRoPC90ZXh0Pgo8dGV4dCB4PSIxMDUiIHk9IjkwIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuOSI+Y3V0dGluZy1lZGdlIHNvbHV0aW9uczwvdGV4dD4KPHN2ZyB4PSI2MCIgeT0iMTIwIiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTgwIDQwIiBmaWxsPSJub25lIj4KPHN2ZyB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMiIgcng9IjgiLz4KPHN2ZyB4PSI1MCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjMiIHJ4PSI4Ii8+CjxzdmcgeD0iMTAwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNCIgcng9IjgiLz4KPHN2ZyB4PSIxNTAiIHk9IjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4yIiByeD0iOCIvPgo8L3N2Zz4KPC9zdmc+CjxzdmcgeD0iNjAiIHk9IjE3MCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDE4MCAyMCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjQiIGZpbGw9IiNGRkZGRkYiLz4KPHN2ZyB4PSIzMCIgeT0iNiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNyIgcng9IjQiLz4KPHN2ZyB4PSIxMzAiIHk9IjYiIHdpZHRoPSI1MCIgaGVpZ2h0PSI4IiBmaWxsPSIjRkY5RjQzIiByeD0iNCIvPgo8L3N2Zz4KPC9zdmc+Cjwvc3ZnPg==',
    screenshots: ['startup-feature-card.png'],
    liveDemo: '/demo/startup-feature-card'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React, { useState } from 'react';
import { ArrowRight, Check, Zap } from 'lucide-react';

interface StartupFeatureCardProps {
  feature: {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    benefits?: string[];
    cta?: {
      text: string;
      href?: string;
      onClick?: () => void;
    };
    gradient?: {
      from: string;
      to: string;
    };
    popular?: boolean;
    comingSoon?: boolean;
  };
  variant?: 'default' | 'compact' | 'highlight';
  className?: string;
}

export function StartupFeatureCard({
  feature,
  variant = 'default',
  className = ""
}: StartupFeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const gradientStyle = feature.gradient 
    ? { backgroundImage: \`linear-gradient(135deg, \${feature.gradient.from}, \${feature.gradient.to})\` }
    : { backgroundImage: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' };

  if (variant === 'compact') {
    return (
      <div 
        className={\`relative p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100 \${className}\`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            {feature.icon || <Zap className="w-6 h-6 text-white" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            
            {feature.cta && (
              <button className="mt-4 text-purple-600 font-semibold text-sm hover:text-purple-700 transition-colors inline-flex items-center gap-1">
                {feature.cta.text}
                <ArrowRight className={\`w-4 h-4 transition-transform \${isHovered ? 'translate-x-1' : ''}\`} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={\`relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 \${className}\`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0"
        style={gradientStyle}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={\`absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full transition-transform duration-700 \${isHovered ? 'scale-110 rotate-45' : ''}\`}></div>
        <div className={\`absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full transition-transform duration-1000 \${isHovered ? 'scale-125 rotate-12' : ''}\`}></div>
      </div>

      {/* Content */}
      <div className="relative p-8 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {feature.icon || <Zap className="w-7 h-7 text-white" />}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-1">{feature.title}</h3>
              {feature.popular && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">
                  ⭐ Popular
                </span>
              )}
              {feature.comingSoon && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  🚀 Coming Soon
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/90 leading-relaxed mb-6 text-lg">
          {feature.description}
        </p>

        {/* Benefits */}
        {feature.benefits && feature.benefits.length > 0 && (
          <div className="space-y-3 mb-8">
            {feature.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/90 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        {feature.cta && (
          <button 
            onClick={feature.cta.onClick}
            className={\`group w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 \${
              isHovered ? 'transform scale-105' : ''
            }\`}
            disabled={feature.comingSoon}
          >
            {feature.cta.text}
            <ArrowRight className={\`w-5 h-5 transition-transform duration-300 \${isHovered ? 'translate-x-1' : ''}\`} />
          </button>
        )}
      </div>
    </div>
  );
}`,
      typescript: `export interface StartupFeature {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  benefits?: string[];
  cta?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  gradient?: {
    from: string;
    to: string;
  };
  popular?: boolean;
  comingSoon?: boolean;
}

export interface StartupFeatureCardProps {
  feature: StartupFeature;
  variant?: 'default' | 'compact' | 'highlight';
  className?: string;
}`,
      dependencies: ['react', 'lucide-react'],
      devDependencies: ['@types/react', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'relative', 'overflow-hidden', 'rounded-2xl', 'transition-all', 
      'duration-500', 'hover:scale-105', 'hover:shadow-2xl'
    ],
    themeAwareClasses: [
      'bg-gradient-to-br', 'from-purple-500', 'to-cyan-500', 'text-white'
    ],
    responsiveClasses: {
      mobile: ['p-6', 'text-lg', 'rounded-xl'],
      tablet: ['p-7', 'text-xl', 'rounded-2xl'],
      desktop: ['p-8', 'text-2xl', 'rounded-2xl']
    },
    cssVariables: [
      '--startup-primary', '--startup-secondary', '--startup-accent'
    ],
    customCSS: `
      .hover\\:shadow-purple-500\\/25:hover {
        --tw-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
      }
      
      .bg-white\\/10 {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .backdrop-blur-sm {
        backdrop-filter: blur(4px);
      }
    `
  },
  
  // Template Assets
  assets: [
    {
      type: 'icon',
      url: 'lucide-react/arrow-right',
      description: 'Arrow right for CTA buttons',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/check',
      description: 'Check icon for benefits list',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/zap',
      description: 'Default icon for features',
      required: true
    }
  ],
  
  // Template Props
  props: [
    {
      name: 'feature',
      type: 'object',
      description: 'Feature data with title, description, benefits, and CTA',
      required: true
    },
    {
      name: 'variant',
      type: 'string',
      description: 'Card variant: default, compact, or highlight',
      required: false,
      defaultValue: 'default',
      options: ['default', 'compact', 'highlight']
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Modern feature card with bold gradients and interactive animations designed for tech startups and SaaS products.',
    usage: 'Use to showcase product features, capabilities, or services with an innovative and growth-focused design.',
    examples: [
      {
        title: 'Basic Feature Card',
        description: 'Simple feature with description and CTA',
        code: `<StartupFeatureCard 
  feature={{
    id: "ai-analytics",
    title: "AI Analytics",
    description: "Get insights powered by machine learning",
    benefits: ["Real-time analysis", "Predictive insights", "Smart recommendations"],
    cta: { text: "Learn More" }
  }}
/>`
      },
      {
        title: 'Popular Feature',
        description: 'Featured product highlight with custom gradient',
        code: `<StartupFeatureCard 
  feature={{
    id: "automation",
    title: "Smart Automation", 
    description: "Automate your workflow with intelligent triggers",
    popular: true,
    gradient: { from: "#f59e0b", to: "#ef4444" },
    cta: { text: "Start Free Trial" }
  }}
/>`
      }
    ]
  },
  
  // Metadata
  metadata: {
    author: 'Startup Template Library',
    license: 'MIT',
    tags: ['startup', 'modern', 'feature', 'gradient', 'saas', 'tech'],
    industry: ['technology', 'startup', 'saas', 'innovation'],
    useCase: ['feature-showcase', 'product-landing', 'saas-features'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: true
  }
};