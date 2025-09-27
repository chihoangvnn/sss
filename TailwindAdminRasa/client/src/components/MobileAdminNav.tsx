import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  Store,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface MobileAdminNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBackToStorefront: () => void;
  unreadNotifications?: number;
}

export function MobileAdminNav({ 
  activeTab, 
  onTabChange, 
  onBackToStorefront,
  unreadNotifications = 0 
}: MobileAdminNavProps) {
  const [, setLocation] = useLocation();

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null,
      route: '/'
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      icon: Package,
      badge: null,
      route: '/products'
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      icon: ShoppingBag,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      route: '/orders'
    },
    {
      id: 'customers',
      label: 'Khách hàng',
      icon: Users,
      badge: null,
      route: '/customers'
    },
    {
      id: 'analytics',
      label: 'Thống kê',
      icon: BarChart3,
      badge: null,
      route: '/analytics'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-700 border-t border-blue-600 z-[70] shadow-lg">
      {/* Admin mode indicator */}
      <div className="absolute top-0 left-0 right-0 bg-blue-800 text-white text-xs py-1 text-center">
        <span className="flex items-center justify-center gap-2">
          <Settings className="h-3 w-3" />
          Chế độ Quản trị
          <button
            onClick={onBackToStorefront}
            className="ml-2 text-blue-200 hover:text-white flex items-center gap-1"
          >
            <Store className="h-3 w-3" />
            Về Cửa hàng
          </button>
        </span>
      </div>
      
      {/* Navigation tabs */}
      <div className="flex items-center justify-around py-2 pb-safe-area mt-6">
        {adminTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setLocation(tab.route);
              }}
              className={`
                flex flex-col items-center justify-center py-2 px-2 min-w-0 flex-1 relative
                transition-all duration-200 ease-in-out
                ${isActive ? 'text-white' : 'text-blue-200 hover:text-white'}
              `}
            >
              <div className="relative">
                <IconComponent 
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`} 
                />
                {tab.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0 shadow-md"
                    style={{ fontSize: '9px' }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </div>
              
              <span 
                className={`
                  text-xs mt-1 transition-all duration-200 truncate max-w-full
                  ${isActive ? 'font-semibold text-white' : 'font-normal text-blue-200'}
                `}
              >
                {tab.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}