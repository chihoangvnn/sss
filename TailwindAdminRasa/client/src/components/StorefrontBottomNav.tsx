import React from 'react';
import { Home, Grid3X3, ShoppingCart, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface StorefrontBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
  wishlistCount?: number;
}

export function StorefrontBottomNav({ activeTab, onTabChange, cartCount = 0, wishlistCount = 0 }: StorefrontBottomNavProps) {
  const [, setLocation] = useLocation();
  const tabs = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      badge: null
    },
    {
      id: 'categories',
      label: 'Danh mục',
      icon: Grid3X3,
      badge: null
    },
    {
      id: 'calendar',
      label: 'Lịch Âm',
      icon: Calendar,
      badge: null
    },
    {
      id: 'cart',
      label: 'Giỏ hàng',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null
    },
    {
      id: 'profile',
      label: 'Cá nhân',
      icon: User,
      badge: null
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-700 border-t border-green-600 z-[70] shadow-lg">
      <div className="flex items-center justify-around py-2 pb-safe-area">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'calendar') {
                  // Navigate to full screen calendar
                  setLocation('/calendar');
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`
                flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 relative
                transition-all duration-200 ease-in-out
                ${isActive ? 'text-white' : 'text-gray-200 hover:text-white'}
              `}
            >
              <div className="relative">
                <IconComponent 
                  className={`h-6 w-6 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`} 
                />
                {tab.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0 shadow-md"
                    style={{ fontSize: '10px' }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </div>
              
              <span 
                className={`
                  text-xs mt-1 transition-all duration-200 truncate max-w-full
                  ${isActive ? 'font-semibold text-white' : 'font-normal text-gray-200'}
                `}
              >
                {tab.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}