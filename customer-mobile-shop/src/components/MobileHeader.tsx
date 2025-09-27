'use client'

import React from 'react';
import { Home, Search, ShoppingCart, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileHeaderProps {
  onSearchClick?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  storeName?: string;
}

export function MobileHeader({ 
  onSearchClick, 
  onCartClick, 
  cartCount = 0, 
  storeName = "Nhang Trầm Hương" 
}: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
      <div className="flex items-center justify-between p-4 text-white">
        {/* Left: Home icon and Store name */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 p-2"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">{storeName}</h1>
            <p className="text-xs text-green-100">Sản phẩm tự nhiên</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            className="text-white hover:bg-white/20 p-2"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-2"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* Cart with count */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCartClick}
            className="text-white hover:bg-white/20 p-2 relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0">
                {cartCount > 99 ? '99+' : cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Breadcrumb or quick navigation */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-green-100">
          <Home className="h-4 w-4" />
          <span>/</span>
          <span>Trang chủ</span>
        </div>
      </div>
    </div>
  );
}