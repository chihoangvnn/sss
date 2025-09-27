'use client'

import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface HorizontalCategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export function HorizontalCategoryBar({
  categories,
  selectedCategory,
  onCategorySelect
}: HorizontalCategoryBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  // Auto-scroll to selected category
  useEffect(() => {
    if (selectedCategory && scrollContainerRef.current) {
      const selectedButton = scrollContainerRef.current.querySelector(
        `[data-category-id="${selectedCategory}"]`
      ) as HTMLElement;
      
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedCategory]);

  if (!categories.length) return null;

  return (
    <div className="relative bg-green-600 border-t border-green-700/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex items-center py-3">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-4 z-10 flex items-center justify-center w-8 h-8 bg-green-700/80 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Category buttons container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-10 md:px-8 lg:px-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                data-category-id={category.id}
                onClick={() => onCategorySelect(category.id)}
                variant="ghost"
                size="sm"
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    selectedCategory === category.id
                      ? 'bg-white text-green-700 shadow-md hover:bg-gray-50'
                      : 'text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/40'
                  }
                `}
              >
                {category.icon && (
                  <span className="mr-1.5 text-sm">{category.icon}</span>
                )}
                <span className="text-sm">{category.name}</span>
              </Button>
            ))}
          </div>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-4 z-10 flex items-center justify-center w-8 h-8 bg-green-700/80 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-hide {
          -webkit-overflow-scrolling: touch;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}