'use client'

import React from 'react';
import { Home, Search, ShoppingCart, Bell } from 'lucide-react';
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
            <Home size={20} />
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
            <Search size={20} />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-2"
          >
            <Bell size={20} />
          </Button>

          {/* Cart with count */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCartClick}
            className="text-white hover:bg-white/20 p-2 relative"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0">
                {cartCount > 99 ? '99+' : cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search section */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-9 pr-3 py-2 bg-white/90 border border-white/20 rounded-lg text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white"
              onClick={onSearchClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}