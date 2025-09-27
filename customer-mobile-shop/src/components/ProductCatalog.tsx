'use client'

import React from 'react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface ProductCatalogProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  isLoading?: boolean;
}

export function ProductCatalog({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  isLoading = false 
}: ProductCatalogProps) {
  if (isLoading || categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {/* Loading skeleton */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => onCategorySelect(category.id)}
              className={`
                h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200
                ${selectedCategory === category.id 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                  : 'bg-white hover:bg-green-50 text-gray-700 border-gray-200 hover:border-green-300'
                }
              `}
            >
              <div className="text-2xl">
                {category.icon || '📦'}
              </div>
              <span className="text-sm font-medium text-center leading-tight">
                {category.name}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}