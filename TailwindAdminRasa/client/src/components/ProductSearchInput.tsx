import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Package, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCachedDebounceSearch } from "@/hooks/useDebounceSearch";
import type { Product } from "@shared/schema";

interface ProductSearchInputProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  categoryFilter?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Memoized search function for products with enhanced error handling
const createProductSearchFn = (categoryFilter?: string) => async (query: string, signal: AbortSignal): Promise<Product[]> => {
  if (query.length < 2) return [];
  
  try {
    // Build search params
    const params = new URLSearchParams({
      search: query,
      limit: '10'
    });
    
    // Add category filter if provided
    if (categoryFilter) {
      params.set('categoryId', categoryFilter);
    }
    
    const response = await fetch(`/api/products?${params}`, { signal });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const results = await response.json();
    
    // Filter active products only and ensure type safety
    const activeProducts = (Array.isArray(results) ? results : []).filter((product: Product) => 
      product.status === 'active'
    );
    
    return activeProducts;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    console.error('Product search error:', error);
    throw new Error('Failed to search products');
  }
};

export function ProductSearchInput({ 
  onSelect, 
  placeholder = "Gõ tên sản phẩm để tìm...",
  className,
  categoryFilter
}: ProductSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized search function that updates when categoryFilter changes
  const searchFn = useMemo(() => createProductSearchFn(categoryFilter), [categoryFilter]);

  // Enhanced debounced search with caching and cancellation
  const {
    results: suggestions,
    isSearching: isLoading,
    error,
    search,
    clear,
    hasResults,
    isEmpty
  } = useCachedDebounceSearch(searchFn, {
    delay: 300,
    minLength: 2,
    cacheSize: 100, // Cache up to 100 search results
    cacheTimeMs: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle input change with enhanced debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setShowSuggestions(true);
    
    // Trigger enhanced debounced search
    search(query);
  };

  // Handle product selection with performance tracking
  const handleProductSelect = (product: Product) => {
    const startTime = performance.now();
    
    setSearchTerm("");
    setShowSuggestions(false);
    clear(); // Clear search results efficiently
    onSelect(product);
    
    // Clear input for next search
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    
    // Performance tracking in development
    if (import.meta.env.DEV) {
      const endTime = performance.now();
      console.log(`🛒 Product selection took ${(endTime - startTime).toFixed(2)}ms`);
    }
  };

  // Handle focus with performance optimization
  const handleFocus = () => {
    setShowSuggestions(true);
    
    // If there's already a search term, trigger search immediately
    if (searchTerm.length >= 2) {
      search(searchTerm);
    }
  };

  // Handle blur with cleanup
  const handleBlur = () => {
    // Delay hiding suggestions to allow click
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle keyboard navigation with performance optimization
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      clear(); // Cancel any pending searches
      inputRef.current?.blur();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear(); // Cancel any pending searches on unmount
    };
  }, [clear]);

  // Get stock status color and label
  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return { color: "destructive" as const, label: "Hết hàng", icon: AlertCircle };
    } else if (stock <= 10) {
      return { color: "secondary" as const, label: "Sắp hết", icon: AlertCircle };
    } else {
      return { color: "default" as const, label: "Còn hàng", icon: Package };
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          id="product-search-input"
          name="product-search-input"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg">
          <div className="p-2">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500">
                  SAN PHẨM TÌM THẤY ({suggestions.length})
                </div>
                {suggestions.map((product) => {
                  const stockStatus = getStockStatus(product.stock || 0);
                  const StockIcon = stockStatus.icon;
                  
                  return (
                    <Button
                      key={product.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto mb-1"
                      onClick={() => handleProductSelect(product)}
                      disabled={product.stock <= 0}
                    >
                      <Package className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{product.name}</div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={stockStatus.color} className="text-xs">
                              <StockIcon className="h-3 w-3 mr-1" />
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatPrice(parseFloat(product.price))}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            Mã: {product.id.slice(-8)}
                          </div>
                          <div className="text-xs font-medium">
                            Còn: {product.stock || 0}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </>
            )}

            {/* No results */}
            {isEmpty && (
              <div className="p-3 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">Không tìm thấy sản phẩm</div>
                <div className="text-xs">Thử từ khóa khác hoặc kiểm tra chính tả</div>
              </div>
            )}
            
            {/* Error state */}
            {error && (
              <div className="p-3 text-center text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto text-red-300 mb-2" />
                <div className="text-sm">Lỗi tìm kiếm</div>
                <div className="text-xs">{error}</div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="p-3 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
                <div className="text-sm text-gray-500 mt-1">Đang tìm kiếm sản phẩm...</div>
              </div>
            )}

            {/* Search hint */}
            {searchTerm.length === 0 && (
              <div className="p-3 text-center text-gray-400">
                <Search className="h-6 w-6 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">Gõ tên sản phẩm để tìm kiếm</div>
                <div className="text-xs">Tối thiểu 2 ký tự</div>
              </div>
            )}

            {searchTerm.length === 1 && (
              <div className="p-3 text-center text-gray-400">
                <div className="text-sm">Gõ thêm ký tự để tìm kiếm</div>
                <div className="text-xs">Cần tối thiểu 2 ký tự</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}