import { TemplateDefinition } from '@/types/template';

/**
 * 📊 Business Dashboard Card Template
 * 
 * Professional card component for corporate dashboards and business applications
 * Features clean design, data visualization ready, and enterprise-grade functionality
 */
export const BusinessDashboardCardTemplate: TemplateDefinition = {
  id: 'business-dashboard-card',
  name: 'Business Dashboard Card',
  category: 'data',
  complexity: 'intermediate',
  description: 'Professional dashboard card with metrics, charts, and corporate design for business applications',
  version: '1.0.0',
  
  // Targeting
  frameworks: ['react'],
  platforms: ['web', 'desktop'],
  
  // Theme Compatibility
  compatibleThemes: ['all'],
  requiresTheme: false,
  themeOverrides: {
    colorPalette: {
      primary: '#2563eb',        // Professional blue
      secondary: '#64748b',      // Slate gray
      accent: '#0ea5e9',         // Sky blue
      background: '#ffffff',     // White background
      surface: '#f8fafc',        // Light gray surface
      onSurface: '#1e293b'       // Dark slate text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiByeD0iOCIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjRTJFOEYwIi8+CjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjI4OCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0Y4RkFGQyIvPgo8dGV4dCB4PSIyNCIgeT0iMzIiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzFFMjkzQiI+UmV2ZW51ZSBPdmVydmlldzwvdGV4dD4KPHN2ZyB4PSIyNzYiIHk9IjI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz4KPC9zdmc+Cjx0ZXh0IHg9IjI0IiB5PSI4NCIgZm9udC1mYW1pbHk9IkludGVyIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMUUyOTNCIj4kMjM0LDU2NzwvdGV4dD4KPHN2ZyB4PSIxNDQiIHk9IjcyIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtNyAxMSA1LTUgNSA1Ii8+CjxwYXRoIGQ9Im0xMiA2IDAgMTAiLz4KPC9zdmc+Cjx0ZXh0IHg9IjE2OCIgeT0iODAiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzA1OTY2OSI+KzEyLjMlPC90ZXh0Pgo8dGV4dCB4PSIyNCIgeT0iMTA0IiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NDc0OEIiPnZzIGxhc3QgbW9udGg8L3RleHQ+Cjx0ZXh0IHg9IjI0IiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0iIzFBMUExQSI+VGhpcyBNb250aDwvdGV4dD4KPHN2ZyB4PSIyNCIgeT0iMTQ4IiB3aWR0aD0iMjcyIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjcyIDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTggMjJIMjY0VjIyIiBzdHJva2U9IiNFMkU4RjAiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNOCAyMkwyNCAyMEw0MCAyMkw1NiAyMEw3MiAyMkw4OCAyMEwxMDQgMjJMMTIwIDIwTDEzNiAyMkwxNTIgMjBMMTY4IDIyTDE4NCAyMEwyMDAgMjJMMjE2IDIwTDIzMiAyMkwyNDggMjBMMjY0IDIyIiBzdHJva2U9IiMyNTYzRUIiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4KPC9zdmc+',
    screenshots: ['business-dashboard-card.png'],
    liveDemo: '/demo/business-dashboard-card'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React, { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';

interface BusinessMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  period?: string;
}

interface BusinessDashboardCardProps {
  title: string;
  metric: BusinessMetric;
  chart?: {
    data: number[];
    labels?: string[];
    type?: 'line' | 'bar' | 'area';
  };
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  loading?: boolean;
  error?: string;
  className?: string;
}

// Format business metrics
const formatMetricValue = (value: string | number): string => {
  if (typeof value === 'number') {
    if (value >= 1000000) {
      return \`$\${(value / 1000000).toFixed(1)}M\`;
    } else if (value >= 1000) {
      return \`$\${(value / 1000).toFixed(1)}K\`;
    } else {
      return \`$\${value.toLocaleString()}\`;
    }
  }
  return value;
};

// Simple line chart component
const MiniChart = ({ data, type = 'line' }: { data: number[]; type?: 'line' | 'bar' | 'area' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80;
    return \`\${x},\${y}\`;
  }).join(' ');

  return (
    <div className="h-16 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        {type === 'area' && (
          <polygon
            points={\`\${points} 100,100 0,100\`}
            fill="url(#gradient)"
            opacity="0.2"
          />
        )}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export function BusinessDashboardCard({
  title,
  metric,
  chart,
  actions,
  loading = false,
  error,
  className = ""
}: BusinessDashboardCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className={\`bg-white rounded-lg border border-gray-200 p-6 \${className}\`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={\`bg-white rounded-lg border border-red-200 p-6 \${className}\`}>
        <div className="text-red-600 text-sm">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className={\`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 \${className}\`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {actions && (
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <ChevronDown className={\`w-4 h-4 transform transition-transform \${isExpanded ? 'rotate-180' : ''}\`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Primary Metric */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatMetricValue(metric.value)}
          </span>
          
          {metric.change !== undefined && (
            <div className={\`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium \${
              metric.trend === 'up' 
                ? 'bg-emerald-50 text-emerald-700' 
                : metric.trend === 'down'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-700'
            }\`}>
              {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </div>
          )}
        </div>

        {/* Period/Context */}
        {metric.period && (
          <p className="text-sm text-gray-600 mb-4">{metric.period}</p>
        )}

        {/* Chart Section */}
        {chart && chart.data && (
          <div className="mt-6">
            <div className="text-xs font-medium text-gray-700 mb-2">This Month</div>
            <MiniChart data={chart.data} type={chart.type} />
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Target</div>
                <div className="font-semibold text-gray-900">$250K</div>
              </div>
              <div>
                <div className="text-gray-600">Achievement</div>
                <div className="font-semibold text-gray-900">93.8%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,
      typescript: `export interface BusinessMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  period?: string;
}

export interface BusinessDashboardCardProps {
  title: string;
  metric: BusinessMetric;
  chart?: {
    data: number[];
    labels?: string[];
    type?: 'line' | 'bar' | 'area';
  };
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  loading?: boolean;
  error?: string;
  className?: string;
}`,
      dependencies: ['react', 'lucide-react'],
      devDependencies: ['@types/react', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'bg-white', 'rounded-lg', 'border', 'border-gray-200', 'hover:border-gray-300',
      'transition-colors', 'duration-200'
    ],
    themeAwareClasses: [
      'bg-white', 'border-gray-200', 'text-gray-900', 'text-gray-600'
    ],
    responsiveClasses: {
      mobile: ['p-4', 'text-sm'],
      tablet: ['p-5', 'text-base'],
      desktop: ['p-6', 'text-lg']
    },
    cssVariables: [
      '--business-primary', '--business-secondary', '--business-surface'
    ]
  },
  
  // Template Assets
  assets: [
    {
      type: 'icon',
      url: 'lucide-react/chevron-down',
      description: 'Chevron down for expand/collapse',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/trending-up',
      description: 'Trending up icon for positive metrics',
      required: true
    },
    {
      type: 'icon',
      url: 'lucide-react/trending-down',
      description: 'Trending down icon for negative metrics',
      required: true
    }
  ],
  
  // Template Props
  props: [
    {
      name: 'title',
      type: 'string',
      description: 'Card title/heading',
      required: true
    },
    {
      name: 'metric',
      type: 'object',
      description: 'Primary business metric with value, change, and trend',
      required: true
    },
    {
      name: 'chart',
      type: 'object',
      description: 'Optional chart data for visualization',
      required: false
    },
    {
      name: 'loading',
      type: 'boolean',
      description: 'Loading state indicator',
      required: false,
      defaultValue: false
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Professional dashboard card component designed for business applications with metrics, charts, and corporate styling.',
    usage: 'Use in business dashboards, analytics panels, and corporate applications to display key metrics.',
    examples: [
      {
        title: 'Revenue Card',
        description: 'Basic revenue metric card',
        code: `<BusinessDashboardCard 
  title="Revenue Overview"
  metric={{
    label: "Total Revenue",
    value: 234567,
    change: 12.3,
    trend: "up",
    period: "vs last month"
  }}
/>`
      },
      {
        title: 'Card with Chart',
        description: 'Dashboard card with trend visualization',
        code: `<BusinessDashboardCard 
  title="Sales Performance"
  metric={{
    label: "Monthly Sales",
    value: 156789,
    change: -3.2,
    trend: "down"
  }}
  chart={{
    data: [45, 52, 48, 61, 55, 67, 69],
    type: "area"
  }}
/>`
      }
    ]
  },
  
  // Metadata
  metadata: {
    author: 'Business Template Library',
    license: 'MIT',
    tags: ['business', 'dashboard', 'metrics', 'analytics', 'corporate'],
    industry: ['corporate', 'enterprise', 'business-intelligence'],
    useCase: ['dashboard', 'analytics', 'metrics', 'kpi-display'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: false
  }
};