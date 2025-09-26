import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

// Base skeleton component with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  rounded = false 
}) => (
  <div 
    className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width, height }}
  />
);

// Product card skeleton for mobile storefront
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-4">
      {/* Left side - Product info */}
      <div className="flex-1 space-y-2">
        <Skeleton height="20px" className="w-3/4" />
        <Skeleton height="14px" className="w-full" />
        <Skeleton height="14px" className="w-2/3" />
        <div className="flex items-baseline gap-2 mt-3">
          <Skeleton height="24px" className="w-20" />
          <Skeleton height="12px" className="w-16" />
        </div>
      </div>
      
      {/* Right side - Image and buttons */}
      <div className="flex flex-col items-center gap-3">
        <Skeleton width="80px" height="80px" className="rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton width="40px" height="40px" rounded />
          <Skeleton width="40px" height="40px" rounded />
        </div>
      </div>
    </div>
  </div>
);

// Loading skeleton for product list
export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

// Category pills skeleton
export const CategorySkeleton: React.FC = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton 
        key={index}
        height="32px" 
        className="min-w-[80px] rounded-full"
      />
    ))}
  </div>
);

// Search bar skeleton  
export const SearchSkeleton: React.FC = () => (
  <div className="relative">
    <Skeleton height="44px" className="w-full rounded-xl" />
  </div>
);

// Header skeleton for mobile
export const HeaderSkeleton: React.FC = () => (
  <div className="bg-white shadow-sm border-b border-gray-100 p-4">
    <div className="flex items-center gap-3">
      <Skeleton width="32px" height="32px" rounded />
      <div className="flex-1">
        <Skeleton height="20px" className="w-2/3" />
      </div>
      <Skeleton width="32px" height="32px" rounded />
    </div>
  </div>
);

// Image skeleton with error state
interface ImageSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  showError?: boolean;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ 
  width = "100%", 
  height = "200px", 
  className = "",
  showError = false 
}) => (
  <div 
    className={`bg-gray-100 flex items-center justify-center ${className}`}
    style={{ width, height }}
  >
    {showError ? (
      <div className="text-center text-gray-400">
        <div className="text-3xl mb-2">🖼️</div>
        <p className="text-sm">Không thể tải hình</p>
      </div>
    ) : (
      <div className="animate-pulse">
        <div className="text-3xl text-gray-300">📦</div>
      </div>
    )}
  </div>
);

export default {
  Skeleton,
  ProductCardSkeleton,
  ProductListSkeleton,
  CategorySkeleton,
  SearchSkeleton,
  HeaderSkeleton,
  ImageSkeleton
};