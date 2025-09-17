import { useState, useRef, useEffect } from "react";
import { Search, Package, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
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

export function ProductSearchInput({ 
  onSelect, 
  placeholder = "Gõ tên sản phẩm để tìm...",
  className,
  categoryFilter
}: ProductSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
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
      
      const response = await apiRequest('GET', `/api/products?${params}`);
      const results = (await response.json()) as Product[];
      
      // Filter active products only
      const activeProducts = (results || []).filter(product => 
        product.status === 'active'
      );
      
      setSuggestions(activeProducts);
    } catch (error) {
      console.error('Product search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setShowSuggestions(true);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSearchTerm("");
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect(product);
    
    // Clear input for next search
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Handle focus
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  // Handle blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow click
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

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
            {searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
              <div className="p-3 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <div className="text-sm">Không tìm thấy sản phẩm</div>
                <div className="text-xs">Thử từ khóa khác hoặc kiểm tra chính tả</div>
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