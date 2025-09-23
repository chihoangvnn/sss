import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import { Search, User, Loader2, Star, Users, Clock, TrendingUp, Plus, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCachedDebounceSearch } from "@/hooks/useDebounceSearch";
import type { Customer } from "@shared/schema";

interface CustomerWithAnalytics extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  recentAddress?: string;
}

interface CustomerSearchInputProps {
  value?: string;
  onSelect: (customer: CustomerWithAnalytics | null) => void;
  onAddNewCustomer?: () => void;
  placeholder?: string;
  className?: string;
}

export interface CustomerSearchInputRef {
  focus: () => void;
}

// Customer suggestion categories for smart prioritization
interface CustomerSuggestionGroup {
  type: 'vip' | 'recent' | 'frequent' | 'search';
  title: string;
  icon: React.ReactNode;
  customers: CustomerWithAnalytics[];
}

export const CustomerSearchInput = forwardRef<CustomerSearchInputRef, CustomerSearchInputProps>(
  function CustomerSearchInput({ 
    value, 
    onSelect,
    onAddNewCustomer, 
    placeholder = "Gõ tên hoặc SĐT khách hàng...",
    className 
  }, ref) {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [suggestionGroups, setSuggestionGroups] = useState<CustomerSuggestionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithAnalytics | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cachedSuggestions, setCachedSuggestions] = useState<CustomerSuggestionGroup[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  // Handle external value changes
  useEffect(() => {
    if (value === "retail" || !value) {
      setDisplayValue("");  
      setSelectedCustomer(null);
    }
  }, [value]);

  // Memoized format price function
  const formatPrice = useCallback((price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numPrice);
  }, []);

  // Enhanced customer search function with performance optimization
  const customerSearchFn = useMemo(() => async (query: string, signal: AbortSignal): Promise<CustomerWithAnalytics[]> => {
    if (query.length < 2) return [];
    
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=10`, { signal });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const searchResults = await response.json() as CustomerWithAnalytics[];
      
      if (import.meta.env.DEV) {
        console.log(`🔍 Found ${searchResults.length} customers for "${query}"`);
      }

      if (searchResults.length > 0) {
        // Smart prioritization: VIP first, then by order count, then alphabetical
        const sortedResults = searchResults.sort((a, b) => {
          // VIP customers first
          if (a.status === 'vip' && b.status !== 'vip') return -1;
          if (b.status === 'vip' && a.status !== 'vip') return 1;
          
          // Then by order count (frequent customers)
          if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
          
          // Finally alphabetical for Vietnamese names
          return a.name.localeCompare(b.name, 'vi-VN');
        });

        return sortedResults.slice(0, 10);
      }
      
      return [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      console.error('Customer search error:', error);
      throw new Error('Failed to search customers');
    }
  }, []);

  // Enhanced debounced search with caching
  const {
    results: searchResults,
    isSearching,
    error: searchError,
    search,
    clear,
    hasResults,
    isEmpty
  } = useCachedDebounceSearch(customerSearchFn, {
    delay: 300,
    minLength: 2,
    cacheSize: 50, // Cache up to 50 customer searches
    cacheTimeMs: 3 * 60 * 1000, // Cache for 3 minutes (customers change less frequently)
  });

  // Load initial suggestions when component mounts (for instant display)
  useEffect(() => {
    loadInitialSuggestions();
  }, []);

  // Load initial suggestions (VIP + Recent + Frequent) - cached for instant display
  const loadInitialSuggestions = useCallback(async () => {
    try {
      const [vipResponse, recentResponse, frequentResponse] = await Promise.all([
        fetch('/api/customers?vip=true&limit=5'),
        fetch('/api/customers?recent=true&limit=5'),
        fetch('/api/customers?frequent=true&limit=5')
      ]);

      const vipCustomers = await vipResponse.json() as CustomerWithAnalytics[];
      const recentCustomers = await recentResponse.json() as CustomerWithAnalytics[];
      const frequentCustomers = await frequentResponse.json() as CustomerWithAnalytics[];

      const groups: CustomerSuggestionGroup[] = [];

      // Add VIP customers (highest priority)
      if (vipCustomers.length > 0) {
        groups.push({
          type: 'vip',
          title: 'KHÁCH HÀNG VIP',
          icon: <Star className="h-3 w-3 text-yellow-500" />,
          customers: vipCustomers
        });
      }

      // Add recent customers
      if (recentCustomers.length > 0) {
        groups.push({
          type: 'recent',
          title: 'KHÁCH HÀNG GẦN ĐÂY',
          icon: <Clock className="h-3 w-3 text-green-500" />,
          customers: recentCustomers
        });
      }

      // Add frequent customers
      if (frequentCustomers.length > 0) {
        groups.push({
          type: 'frequent',
          title: 'KHÁCH HÀNG THÂN THIẾT',
          icon: <TrendingUp className="h-3 w-3 text-blue-500" />,
          customers: frequentCustomers
        });
      }

      setCachedSuggestions(groups);
    } catch (error) {
      console.error('Error loading initial suggestions:', error);
    }
  }, []);

  // Memoized suggestion groups - combines cached suggestions and search results
  const computedSuggestionGroups = useMemo(() => {
    if (searchTerm.length >= 2 && hasResults) {
      return [{
        type: 'search' as const,
        title: 'KẾT QUẢ TÌM KIẾM',
        icon: <Search className="h-3 w-3 text-gray-500" />,
        customers: searchResults
      }];
    }
    
    if (searchTerm.length < 2) {
      return cachedSuggestions;
    }
    
    return [];
  }, [searchTerm, hasResults, searchResults, cachedSuggestions]);

  // Handle input change with optimized debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setDisplayValue(query);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // Trigger enhanced debounced search
    search(query);
  }, [search]);

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerWithAnalytics) => {
    setSelectedCustomer(customer);
    setDisplayValue(`${customer.name} - ${customer.phone}`);
    setShowSuggestions(false);
    setSuggestionGroups([]);
    setSearchTerm("");
    onSelect(customer);
  };

  // Handle retail customer selection
  const handleRetailSelect = () => {
    setSelectedCustomer(null);
    setDisplayValue("");
    setShowSuggestions(false);
    setSuggestionGroups([]);
    setSearchTerm("");
    onSelect(null);
  };

  // Handle focus - show cached suggestions immediately
  const handleFocus = () => {
    setShowSuggestions(true);
    
    if (selectedCustomer) {
      setDisplayValue("");
      setSearchTerm("");
    }
    
    // Show cached suggestions immediately for instant display
    if (searchTerm.length < 2) {
      setSuggestionGroups(cachedSuggestions);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (selectedCustomer) {
        setDisplayValue(`${selectedCustomer.name} - ${selectedCustomer.phone}`);
      }
    }, 200);
  };

  // Get all customers in flat array for keyboard navigation
  const allCustomers = computedSuggestionGroups.flatMap(group => group.customers);
  const totalItems = allCustomers.length + 1 + (onAddNewCustomer ? 1 : 0); // +1 for retail option

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === 0) {
          handleRetailSelect();
        } else if (selectedIndex === totalItems - 1 && onAddNewCustomer) {
          onAddNewCustomer();
        } else if (selectedIndex > 0 && selectedIndex <= allCustomers.length) {
          handleCustomerSelect(allCustomers[selectedIndex - 1]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Get status badge for customer
  const getStatusBadge = (customer: CustomerWithAnalytics) => {
    if (customer.status === 'vip') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Star className="h-3 w-3 mr-1" />
          VIP
        </Badge>
      );
    }
    
    if (customer.totalOrders >= 10) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <Users className="h-3 w-3 mr-1" />
          Thân thiết
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Selected customer info */}
      {selectedCustomer && !showSuggestions && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                <div className="text-sm text-blue-600">{selectedCustomer.phone}</div>
                {selectedCustomer.email && (
                  <div className="text-sm text-blue-600">{selectedCustomer.email}</div>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-500">
                    {selectedCustomer.totalOrders} đơn hàng • {formatPrice(selectedCustomer.totalSpent)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              {getStatusBadge(selectedCustomer)}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Card ref={suggestionsRef} className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-2">
            {/* Retail option */}
            <Button
              variant="ghost"
              className={`w-full justify-start p-3 h-auto mb-1 ${selectedIndex === 0 ? 'bg-gray-100' : ''}`}
              onClick={handleRetailSelect}
            >
              <User className="h-4 w-4 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Khách lẻ</div>
                <div className="text-sm text-gray-600">Bán cho khách không có thông tin</div>
              </div>
            </Button>

            {/* Customer suggestion groups */}
            {computedSuggestionGroups.map((group, groupIndex) => (
              <div key={group.type}>
                <Separator className="my-2" />
                <div className="px-3 py-2 text-xs font-medium text-gray-500 flex items-center space-x-2">
                  {group.icon}
                  <span>{group.title}</span>
                </div>
                
                {group.customers.map((customer, customerIndex) => {
                  const flatIndex = computedSuggestionGroups
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.customers.length, 0) + customerIndex + 1;
                  
                  return (
                    <Button
                      key={customer.id}
                      variant="ghost"
                      className={`w-full justify-start p-3 h-auto mb-1 ${selectedIndex === flatIndex ? 'bg-gray-100' : ''}`}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-center w-full">
                        <User className={`h-4 w-4 mr-3 ${customer.status === 'vip' ? 'text-yellow-600' : 'text-blue-600'}`} />
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{customer.name}</div>
                            {getStatusBadge(customer)}
                          </div>
                          <div className="text-sm text-gray-600">{customer.phone}</div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>{customer.totalOrders} đơn</span>
                            <span>•</span>
                            <span>{formatPrice(customer.totalSpent)}</span>
                            {customer.totalOrders > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ))}

            {/* Add new customer option */}
            {onAddNewCustomer && (
              <>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className={`w-full justify-start p-3 h-auto text-green-700 hover:bg-green-50 ${selectedIndex === totalItems - 1 ? 'bg-green-100' : ''}`}
                  onClick={onAddNewCustomer}
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  <div>
                    <div className="font-medium">Thêm khách hàng mới</div>
                    <div className="text-sm text-green-600">Tạo hồ sơ khách hàng mới</div>
                  </div>
                </Button>
              </>
            )}

            {/* No results */}
            {searchTerm.length >= 2 && computedSuggestionGroups.length === 0 && !isSearching && (
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm font-medium">Không tìm thấy khách hàng</div>
                <div className="text-xs mt-1">Thử tìm kiếm với tên hoặc số điện thoại khác</div>
              </div>
            )}

            {/* Loading state */}
            {isSearching && (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                <div className="text-sm text-gray-500 mt-2">Đang tìm kiếm khách hàng...</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
  }
);