import React, { useCallback, useMemo } from 'react';
import { useVirtualizedList, VirtualizedItem } from '@/hooks/useVirtualizedList';
import { OptimizedProductGrid } from './OptimizedProductGrid';
import type { Product } from '@shared/schema';

interface VirtualizedProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  onAddToCart,
  itemHeight = 320,
  containerHeight = 600,
  className = '',
}) => {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    offsetY,
    handleScroll,
    isVirtualized,
  } = useVirtualizedList(products, { itemHeight, containerHeight });

  // For VirtualizedProductList, use the proper OptimizedProductGrid directly
  // instead of trying to virtualize individual items
  if (!isVirtualized) {
    return (
      <div className={className}>
        <OptimizedProductGrid
          products={products}
          onAddToCart={onAddToCart}
          enableVirtualization={false}
        />
      </div>
    );
  }

  // For large lists, disable VirtualizedProductList and use OptimizedProductGrid's own virtualization
  return (
    <div className={className}>
      <OptimizedProductGrid
        products={products}
        onAddToCart={onAddToCart}
        enableVirtualization={true}
        itemsPerRow={4}
      />
    </div>
  );

};