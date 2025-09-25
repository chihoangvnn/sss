import React, { useMemo, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VirtualizedList } from '@/hooks/useVirtualizedList';
import { useRenderPerformance, useInteractionPerformance } from '@/hooks/usePerformanceMonitor';
import { Package, Plus, AlertCircle, Star } from 'lucide-react';
import type { Product } from '@shared/schema';

interface OptimizedProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  selectedCategoryId?: string | null;
  searchTerm?: string;
  className?: string;
  itemsPerRow?: number;
  enableVirtualization?: boolean;
}

// Optimized product card component with memoization
const ProductCard = React.memo(({ 
  product, 
  onAddToCart, 
  isVisible 
}: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
  isVisible: boolean;
}) => {
  const { measureInteraction } = useInteractionPerformance();
  
  // Memoized price formatting
  const formattedPrice = useMemo(() => {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }, [product.price]);

  // Optimized stock status calculation
  const stockStatus = useMemo(() => {
    const stock = product.stock || 0;
    if (stock <= 0) {
      return { color: "destructive" as const, label: "Hết hàng", icon: AlertCircle };
    } else if (stock <= 10) {
      return { color: "secondary" as const, label: "Sắp hết", icon: AlertCircle };
    } else {
      return { color: "default" as const, label: "Còn hàng", icon: Package };
    }
  }, [product.stock]);

  // Performance optimized click handler
  const handleAddToCart = useCallback(() => {
    const measure = measureInteraction('add-to-cart', { 
      productId: product.id, 
      productName: product.name 
    });
    
    onAddToCart(product);
    measure.end();
  }, [product, onAddToCart, measureInteraction]);

  // Lazy loading for images - only load when visible
  const shouldLoadImage = isVisible;
  const imageUrl = shouldLoadImage ? product.image : undefined;

  const StockIcon = stockStatus.icon;

  const isOutOfStock = product.status === 'out-of-stock' || (product.stock || 0) <= 0;
  
  return (
    <Card 
      className={`h-80 hover:shadow-md transition-shadow duration-200 ${
        isOutOfStock ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
      }`}
      onClick={isOutOfStock ? undefined : handleAddToCart}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Image section - fixed size */}
        <div className="aspect-square mb-2 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {shouldLoadImage && imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder on image error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            // Placeholder while not visible or loading
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Content section - flexible but with minimum space for price */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Product name and status */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-medium text-sm leading-tight line-clamp-2 flex-1 mr-2" title={product.name}>
              {product.name}
            </h3>
            <Badge variant={stockStatus.color} className="text-xs flex-shrink-0">
              <StockIcon className="h-3 w-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>
          
          {/* Product description - limited height */}
          {product.description && (
            <div className="text-xs text-gray-600 line-clamp-1 mb-2" 
                 title={product.description.replace(/<[^>]*>/g, '')}>
              {product.description.replace(/<[^>]*>/g, '')}
            </div>
          )}
          
          {/* Push content to bottom with flex-grow spacer */}
          <div className="flex-1"></div>
          
          {/* Price section - always visible at bottom */}
          <div className="mt-auto space-y-1">
            <div className="text-lg font-bold text-green-600 truncate" title={formattedPrice}>
              {formattedPrice}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="truncate mr-2">Mã: {product.sku || product.id.slice(-8)}</span>
              <span className="flex-shrink-0">Còn: {product.stock || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

// Main optimized product grid component
export const OptimizedProductGrid: React.FC<OptimizedProductGridProps> = ({
  products,
  onAddToCart,
  selectedCategoryId,
  searchTerm,
  className = '',
  itemsPerRow = 4,
  enableVirtualization = true,
}) => {
  useRenderPerformance('OptimizedProductGrid');
  
  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => product.status === 'active');
    
    // Category filtering
    if (selectedCategoryId) {
      filtered = filtered.filter(product => product.categoryId === selectedCategoryId);
    }
    
    // Search filtering
    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.itemCode?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [products, selectedCategoryId, searchTerm]);

  // Memoized grid configuration
  const gridConfig = useMemo(() => {
    const itemHeight = 320; // Height of each product card
    const containerHeight = 600; // Height of the virtualized container
    
    return { itemHeight, containerHeight };
  }, []);

  // Optimized render function for virtualized list
  const renderProduct = useCallback((product: Product, index: number, isVisible: boolean) => (
    <div
      key={product.id}
      className={`p-2`}
      style={{ 
        width: `${100 / itemsPerRow}%`,
        display: 'inline-block',
        verticalAlign: 'top'
      }}
    >
      <ProductCard 
        product={product} 
        onAddToCart={onAddToCart}
        isVisible={isVisible}
      />
    </div>
  ), [onAddToCart, itemsPerRow]);

  // Grid layout for non-virtualized rendering (small lists)
  const renderGrid = useCallback(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          isVisible={true}
        />
      ))}
    </div>
  ), [filteredProducts, onAddToCart]);

  // Determine if virtualization should be used
  const shouldVirtualize = enableVirtualization && filteredProducts.length > 20;

  // Loading state component
  const LoadingGrid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="h-80 animate-pulse">
          <CardContent className="p-4">
            <div className="aspect-square mb-3 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ), []);

  // Empty state component
  const EmptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
      </h3>
      <p className="text-gray-600 max-w-md">
        {searchTerm 
          ? `Không có sản phẩm nào phù hợp với "${searchTerm}". Thử tìm kiếm với từ khóa khác.`
          : 'Danh mục này chưa có sản phẩm nào.'
        }
      </p>
    </div>
  ), [searchTerm]);

  // Performance metrics display (development only)
  const PerformanceInfo = useMemo(() => {
    if (!import.meta.env.DEV) return null;
    
    return (
      <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
        📊 Products: {filteredProducts.length} | 
        Virtualized: {shouldVirtualize ? 'Yes' : 'No'} | 
        Layout: {shouldVirtualize ? 'Virtual' : 'Grid'}
      </div>
    );
  }, [filteredProducts.length, shouldVirtualize]);

  if (filteredProducts.length === 0) {
    return (
      <div className={className}>
        {import.meta.env.DEV && PerformanceInfo}
        {EmptyState}
      </div>
    );
  }

  return (
    <div className={className}>
      {import.meta.env.DEV && PerformanceInfo}
      
      {shouldVirtualize ? (
        <VirtualizedList
          items={filteredProducts}
          itemHeight={gridConfig.itemHeight}
          containerHeight={gridConfig.containerHeight}
          renderItem={renderProduct}
          className="border border-gray-200 rounded-lg"
        />
      ) : (
        renderGrid()
      )}
    </div>
  );
};

// Skeleton loading component for better perceived performance
export const ProductGridSkeleton: React.FC<{ itemsPerRow?: number }> = ({ 
  itemsPerRow = 4 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: itemsPerRow * 2 }).map((_, index) => (
        <Card key={index} className="h-80 animate-pulse">
          <CardContent className="p-4">
            <div className="aspect-square mb-3 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};