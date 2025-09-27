'use client'

import React from 'react';
import { ShoppingCart, Search, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface DesktopHeaderProps {
  storeName: string;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCartClick: () => void;
  onProfileClick?: () => void;
}

export function DesktopHeader({
  storeName,
  cartCount,
  searchQuery,
  onSearchChange,
  onCartClick,
  onProfileClick
}: DesktopHeaderProps) {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  return (
    <header className="bg-brand-white shadow-sm border-b border-brand-cream sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Store Logo/Name */}
          <div className="flex items-center">
            <h1 className="text-xl lg:text-2xl font-bold text-brand-forest">
              {storeName}
            </h1>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-brand-cream rounded-lg leading-5 bg-brand-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCartClick}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              <span className="ml-2 hidden lg:inline">Giỏ hàng</span>
            </Button>

            {/* Profile/Login Button */}
            {isLoading ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="hidden lg:flex"
              >
                <User className="h-5 w-5 animate-pulse" />
                <span className="ml-2">...</span>
              </Button>
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileClick}
                className="hidden lg:flex"
              >
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="ml-2">
                  {user?.firstName || user?.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'Tài khoản'
                  }
                </span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={login}
                className="hidden lg:flex text-green-600 border-green-200 hover:bg-green-50"
              >
                <LogIn className="h-5 w-5" />
                <span className="ml-2">Đăng nhập</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}