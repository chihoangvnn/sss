'use client'

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface HiddenSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function HiddenSearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Tìm kiếm sản phẩm..." 
}: HiddenSearchBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show search bar when scrolling down past 200px
      if (currentScrollY > 200 && currentScrollY > lastScrollY) {
        setIsVisible(true);
      } 
      // Hide when scrolling up or at top
      else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-[60] bg-white shadow-lg border-b border-gray-200
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        hidden lg:block
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Search Icon */}
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm"
              autoFocus={isVisible}
            />
          </div>
          
          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}