import { TemplateDefinition } from '@/types/template';

/**
 * 📱 Shopee Bottom Navigation Template
 * 
 * Mobile bottom navigation bar with 5 tabs and home indicator
 * exactly matching Shopee's mobile app navigation
 */
export const ShopeeBottomNavTemplate: TemplateDefinition = {
  id: 'shopee-bottom-nav',
  name: 'Shopee Bottom Navigation',
  category: 'navigation',
  complexity: 'basic',
  description: 'Mobile bottom navigation with 5 tabs (Home, Mall, Live & Video, Notifications, Profile) and iOS-style home indicator',
  version: '1.0.0',
  
  // Targeting
  frameworks: ['react', 'vue', 'all'],
  platforms: ['mobile', 'web'],
  
  // Theme Compatibility
  compatibleThemes: ['all'],
  requiresTheme: false,
  themeOverrides: {
    colorPalette: {
      primary: '#ee4d2d',      // Shopee Orange for active
      surface: '#ffffff',      // White background
      onSurface: '#666666',    // Gray for inactive
      onPrimary: '#ee4d2d'     // Orange for active text
    }
  },
  
  // Visual Representation
  preview: {
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzc1IiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMzc1IDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMzc1IiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiIHN0cm9rZS13aWR0aD0iMSIvPgo8IS0tIEhvbWUgVGFiIC0tPgo8Y2lyY2xlIGN4PSIzNyIgY3k9IjIwIiByPSI2IiBmaWxsPSIjRUU0RDJEIi8+Cjx0ZXh0IHg9IjM3IiB5PSIzOCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjRUU0RDJEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Ib21lPC90ZXh0Pgo8IS0tIE1hbGwgVGFiIC0tPgo8Y2lyY2xlIGN4PSIxMTIiIGN5PSIyMCIgcj0iNiIgZmlsbD0iI0JCQkJCQiIvPgo8dGV4dCB4PSIxMTIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1hbGw8L3RleHQ+CjwhLS0gTGl2ZSAmIFZpZGVvIFRhYiAtLT4KPHN2ZyB4PSIxNzQiIHk9IjE0IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0JCQkJCQiI+CjxwYXRoIGQ9Ik04IDV2MTRsOC03LTgtN3oiLz4KPC9zdmc+Cjx0ZXh0IHg9IjE4NyIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGl2ZSAmIFZpZGVvPC90ZXh0Pgo8IS0tIE5vdGlmaWNhdGlvbnMgVGFiIC0tPgo8Y2lyY2xlIGN4PSIyODciIGN5PSIyMCIgcj0iNiIgZmlsbD0iI0JCQkJCQiIvPgo8dGV4dCB4PSIyODciIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRow7RuZyBiw6FvPC90ZXh0Pgo8IS0tIFByb2ZpbGUgVGFiIC0tPgo8Y2lyY2xlIGN4PSIzMzciIGN5PSIyMCIgcj0iNiIgZmlsbD0iI0JCQkJCQiIvPgo8dGV4dCB4PSIzMzciIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlTDtGk8L3RleHQ+CjwhLS0gSG9tZSBJbmRpY2F0b3IgLS0+CjxyZWN0IHg9IjE3MSIgeT0iNjQiIHdpZHRoPSIzMiIgaGVpZ2h0PSI0IiByeD0iMiIgZmlsbD0iIzAwMDAwMCIvPgo8L3N2Zz4=',
    screenshots: ['shopee-bottom-nav.png'],
    liveDemo: '/demo/shopee-bottom-nav'
  },
  
  // Template Code
  code: {
    react: {
      jsx: `import React, { useState } from 'react';

interface NavigationTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface ShopeeBottomNavProps {
  tabs?: NavigationTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

const defaultTabs: NavigationTab[] = [
  { id: 'home', label: 'Home', isActive: true },
  { id: 'mall', label: 'Mall', isActive: false },
  { id: 'live', label: 'Live & Video', isActive: false },
  { id: 'notifications', label: 'Thông báo', isActive: false },
  { id: 'profile', label: 'Tôi', isActive: false }
];

export function ShopeeBottomNav({
  tabs = defaultTabs,
  activeTab = 'home',
  onTabChange,
  className = ""
}: ShopeeBottomNavProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={\`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 \${className}\`}>
      <div className="flex items-center justify-between">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="flex flex-col items-center gap-1 flex-1 py-1 transition-colors"
          >
            {/* Tab Icon */}
            <div className={\`w-6 h-6 rounded transition-colors \${
              currentTab === tab.id 
                ? 'bg-orange-500' 
                : 'bg-gray-300'
            }\`}>
              {tab.icon}
            </div>
            
            {/* Tab Label */}
            <span className={\`text-xs transition-colors \${
              currentTab === tab.id
                ? 'text-orange-500 font-medium'
                : 'text-gray-500'
            }\`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* iOS-style Home Indicator */}
      <div className="w-32 h-1 bg-black rounded-full mx-auto mt-2"></div>
    </div>
  );
}`,
      typescript: `export interface NavigationTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export interface ShopeeBottomNavProps {
  tabs?: NavigationTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}`,
      dependencies: ['react'],
      devDependencies: ['@types/react', 'typescript']
    }
  },
  
  // Template Styling
  styles: {
    baseClasses: [
      'fixed', 'bottom-0', 'left-0', 'right-0', 'bg-white', 
      'border-t', 'border-gray-200', 'px-4', 'py-2', 'z-40'
    ],
    themeAwareClasses: [
      'bg-orange-500', 'text-orange-500', 'bg-gray-300', 'text-gray-500'
    ],
    responsiveClasses: {
      mobile: ['px-4', 'py-2', 'text-xs'],
      tablet: ['px-6', 'py-3', 'text-sm'],
      desktop: ['px-8', 'py-4', 'text-base']
    },
    cssVariables: [
      '--nav-bg', '--nav-border', '--active-color', '--inactive-color'
    ]
  },
  
  // Template Assets
  assets: [],
  
  // Template Props
  props: [
    {
      name: 'tabs',
      type: 'array',
      description: 'Array of navigation tab objects',
      required: false,
      defaultValue: 'Default Shopee tabs'
    },
    {
      name: 'activeTab',
      type: 'string',
      description: 'ID of currently active tab',
      required: false,
      defaultValue: 'home'
    },
    {
      name: 'onTabChange',
      type: 'function',
      description: 'Callback when tab is changed',
      required: false
    }
  ],
  
  // Documentation
  documentation: {
    description: 'Fixed bottom navigation component with 5 tabs and iOS-style home indicator, matching Shopee mobile app.',
    usage: 'Use as main navigation for mobile applications. Automatically handles active state and tab switching.',
    examples: [
      {
        title: 'Default Navigation',
        description: 'Basic bottom navigation with default Shopee tabs',
        code: `<ShopeeBottomNav />`
      },
      {
        title: 'Custom Navigation',
        description: 'Custom tabs with navigation handler',
        code: `<ShopeeBottomNav 
  tabs={customTabs}
  activeTab="profile"
  onTabChange={(tabId) => navigateTo(tabId)}
/>`
      }
    ]
  },
  
  // Metadata
  metadata: {
    author: 'Shopee Template Library',
    license: 'MIT',
    tags: ['navigation', 'bottom-nav', 'mobile', 'tabs', 'shopee'],
    industry: ['ecommerce', 'mobile-commerce'],
    useCase: ['mobile-navigation', 'tab-navigation', 'bottom-bar'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    rating: 5.0,
    downloads: 0,
    featured: true
  }
};