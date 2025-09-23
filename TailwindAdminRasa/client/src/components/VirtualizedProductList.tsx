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

  // Render virtual item
  const renderVirtualItem = useCallback((virtualItem: VirtualizedItem<Product>) => {
    const { data: product, index, isVisible } = virtualItem;
    
    return (
      <div
        key={product.id}
        style={{
          height: itemHeight,
          padding: '8px',
        }}
      >
        <OptimizedProductGrid
          products={[product]}
          onAddToCart={onAddToCart}
          enableVirtualization={false} // Individual items don't need virtualization
        />
      </div>
    );
  }, [onAddToCart, itemHeight]);

  if (!isVirtualized) {
    // Use regular grid for small lists
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

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {virtualItems.map(renderVirtualItem)}
        </div>
      </div>
    </div>
  );
};