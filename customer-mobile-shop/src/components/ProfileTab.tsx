'use client'

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogIn, LogOut, Mail, Shield, ArrowLeft, Package, Heart, MapPin, Bell } from 'lucide-react';
import { OrderHistory } from '@/components/OrderHistory';
import { VipTierCard } from '@/components/VipTierCard';
import { AddressManagement } from '@/components/AddressManagement';
import { calculateVipStatus } from '@/utils/vipCalculator';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/orderApi';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  genre_id: string;
  stock: number;
  description?: string;
  rating?: number;
  status: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
}

interface ProfileTabProps {
  addToCart?: (book: Book) => void;
  setActiveTab?: (tab: string) => void;
}

export function ProfileTab({ addToCart, setActiveTab }: ProfileTabProps = {}) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [activeView, setActiveView] = useState<'profile' | 'orders' | 'wishlist' | 'shipping' | 'notifications'>('profile');

  // Fetch real order history to calculate total spent - MUST be called before any conditional returns
  const { data: orders = [], isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
  });

  // Calculate real total spent from delivered orders
  const totalSpent = orders
    .filter(order => order.status === 'delivered') // Only count delivered orders
    .reduce((sum, order) => sum + order.total, 0);

  // Calculate VIP status based on real purchase history
  const vipProgress = calculateVipStatus(totalSpent);

  if (isLoading) {
    return (
      <div className="p-4 pt-6">
        <div className="bg-white rounded-xl p-6 mb-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 pt-6">
        <div className="bg-white rounded-xl p-6 mb-4 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chào mừng bạn!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Đăng nhập để trải nghiệm mua sắm tốt nhất và theo dõi đơn hàng của bạn.
          </p>
          
          <Button 
            onClick={login}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Đăng nhập với Replit
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="flex items-center justify-center">
              <Shield className="w-4 h-4 mr-1" />
              Đăng nhập an toàn với Google, GitHub, hoặc email
            </p>
          </div>
        </div>

        {/* Guest Features */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Tính năng khi đăng nhập
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Lưu giỏ hàng và sản phẩm yêu thích
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Theo dõi lịch sử đơn hàng
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Thanh toán nhanh với thông tin đã lưu
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Nhận thông báo về ưu đãi đặc biệt
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Authenticated user view
  if (!user) return null; // Type guard

  // Render different views based on activeView
  if (activeView === 'orders') {
    return (
      <div className="p-4 pt-6">
        {/* Back Button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setActiveView('profile')}
            className="p-2 mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Lịch sử đơn hàng</h1>
        </div>
        
        <OrderHistory addToCart={addToCart} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeView === 'shipping') {
    return (
      <AddressManagement onBack={() => setActiveView('profile')} />
    );
  }

  // Profile overview (default view)
  return (
    <div className="p-4 pt-6">
      {/* User Profile Card */}
      <div className="bg-white rounded-xl p-6 mb-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstName || user.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'Người dùng'
              }
            </h2>
            {user.email && (
              <p className="text-gray-600 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-1" />
                {user.email}
              </p>
            )}
          </div>
        </div>
        
        <Button 
          onClick={logout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Đăng xuất
        </Button>
      </div>

      {/* VIP Tier System */}
      {isLoadingOrders ? (
        <div className="bg-white rounded-xl p-6 mb-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : ordersError ? (
        <div className="bg-white rounded-xl p-6 mb-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-700 text-sm">
              Không thể tải thông tin cấp độ. Hãy thử lại sau.
            </p>
          </div>
        </div>
      ) : (
        <VipTierCard vipProgress={vipProgress} />
      )}

      {/* Account Features */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tài khoản của tôi
        </h3>
        
        <div className="space-y-3">
          <button 
            onClick={() => setActiveView('orders')}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
          >
            <Package className="h-5 w-5 text-green-600 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Lịch sử đơn hàng</div>
              <div className="text-sm text-gray-500">Xem các đơn hàng đã mua</div>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('wishlist')}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
          >
            <Heart className="h-5 w-5 text-red-500 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Sản phẩm yêu thích</div>
              <div className="text-sm text-gray-500">Quản lý danh sách yêu thích</div>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('shipping')}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
          >
            <MapPin className="h-5 w-5 text-blue-600 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Thông tin giao hàng</div>
              <div className="text-sm text-gray-500">Địa chỉ và thông tin liên lạc</div>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('notifications')}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
          >
            <Bell className="h-5 w-5 text-orange-600 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Cài đặt thông báo</div>
              <div className="text-sm text-gray-500">Quản lý thông báo qua email/SMS</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}