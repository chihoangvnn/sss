'use client'

import React from 'react';
import { ShoppingCart, Search, User, LogIn, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { HorizontalCategoryBar } from './HorizontalCategoryBar';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface DesktopHeaderProps {
  storeName: string;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCartClick: () => void;
  onProfileClick?: () => void;
  onBlogClick?: () => void;
  // Category bar props
  categories?: Category[];
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  showCategoryBar?: boolean;
}

export function DesktopHeader({
  storeName,
  cartCount,
  searchQuery,
  onSearchChange,
  onCartClick,
  onProfileClick,
  onBlogClick,
  categories = [],
  selectedCategory,
  onCategorySelect,
  showCategoryBar = true
}: DesktopHeaderProps) {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  
  return (
    <header className="bg-green-600 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Store Logo/Name */}
          <div className="flex items-center space-x-6">
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              {storeName}
            </h1>
            
            {/* Blog Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBlogClick}
              className="hidden lg:flex text-white hover:bg-white/10 hover:text-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Blog
            </Button>
          </div>

          {/* Desktop Search Bar - More Compact */}
          <div className="flex-1 max-w-xs mx-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-4 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCartClick}
              className="relative bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              <ShoppingCart className="h-4 w-4" />
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
                className="hidden lg:flex bg-white/10 border-white/20 text-white"
              >
                <User className="h-4 w-4 animate-pulse" />
                <span className="ml-2">...</span>
              </Button>
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileClick}
                className="hidden lg:flex bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
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
                className="hidden lg:flex bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <LogIn className="h-4 w-4" />
                <span className="ml-2">Đăng nhập</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Horizontal Category Bar */}
      {showCategoryBar && categories.length > 0 && onCategorySelect && (
        <HorizontalCategoryBar
          categories={categories}
          selectedCategory={selectedCategory || 'all'}
          onCategorySelect={onCategorySelect}
        />
      )}
    </header>
  );
}