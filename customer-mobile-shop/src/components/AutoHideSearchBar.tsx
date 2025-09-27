'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AutoHideSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

export function AutoHideSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  placeholder = "Tìm kiếm sản phẩm..."
}: AutoHideSearchBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show when focused or at top
      if (isSearchFocused || currentScrollY <= 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Hide/show based on scroll direction
      if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // Scrolling down - hide
          setIsVisible(false);
        } else {
          // Scrolling up - show
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSearchFocused]);

  return (
    <div 
      className={`
        sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
    >
      <div className="px-4 py-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // Delay hiding to allow for smooth interaction
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
          />
        </div>
      </div>
    </div>
  );
}