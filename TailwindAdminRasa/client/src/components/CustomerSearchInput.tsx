import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Customer } from "@shared/schema";

interface CustomerWithAddress extends Customer {
  recentAddress?: string;
}

interface CustomerSearchInputProps {
  value?: string;
  onSelect: (customer: CustomerWithAddress | null) => void;
  placeholder?: string;
  className?: string;
}

export interface CustomerSearchInputRef {
  focus: () => void;
}

export const CustomerSearchInput = forwardRef<CustomerSearchInputRef, CustomerSearchInputProps>(({ 
  value, 
  onSelect, 
  placeholder = "Gõ tên hoặc SĐT khách hàng...",
  className 
}, ref) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [suggestions, setSuggestions] = useState<CustomerWithAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithAddress | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  // Handle external value changes - ✅ No more "Khách lẻ" text display
  useEffect(() => {
    if (value === "retail" || !value) {
      setDisplayValue(""); // ✅ Empty instead of "Khách lẻ"  
      setSelectedCustomer(null);
    }
  }, [value]);

  // ✅ Smart unified search function với better detection
  const searchCustomers = async (query: string) => {
    if (query.length < 1) { // ✅ Reduced from 2 to 1 character
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // 🧠 Better detection: if query is mostly digits (phone-like), search by phone
      const digitCount = (query.match(/\d/g) || []).length;
      const isPhoneSearch = digitCount > 0 && digitCount >= query.length * 0.5; // 50%+ digits = phone search
      
      const searchParam = isPhoneSearch 
        ? `phone=${encodeURIComponent(query)}` 
        : `q=${encodeURIComponent(query)}`;
      
      console.log(`🔍 Searching with: ${searchParam} (query: "${query}")`);
      
      // ✅ Single API call với proper error handling
      const response = await apiRequest('GET', `/api/customers/search?${searchParam}`);
      
      if (!response.ok) {
        console.error(`Search API failed: ${response.status} - ${searchParam}`);
        setSuggestions([]);
        return;
      }
      
      const results = await response.json() as CustomerWithAddress[];
      console.log(`📊 Search results: ${results.length} customers found`);
      setSuggestions((results || []).slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Customer search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setDisplayValue(query);
    setShowSuggestions(true);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // ⚡ Faster debounce for better UX
    debounceRef.current = setTimeout(() => {
      searchCustomers(query);
    }, 100); // ✅ Reduced from 300ms to 100ms
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerWithAddress) => {
    setSelectedCustomer(customer);
    setDisplayValue(`${customer.name} - ${customer.phone}`);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchTerm("");
    onSelect(customer);
  };

  // Handle retail customer selection - ✅ No more "Khách lẻ" display
  const handleRetailSelect = () => {
    setSelectedCustomer(null);
    setDisplayValue(""); // ✅ Empty instead of "Khách lẻ"
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchTerm("");
    onSelect(null);
  };

  // Handle focus - ✅ Clear any text khi click để ready for typing
  const handleFocus = () => {
    setShowSuggestions(true);
    
    // ✅ Clear any existing text for fresh typing experience
    if (selectedCustomer) {
      setDisplayValue("");
      setSearchTerm("");
    }
  };

  // Handle blur - ✅ No more "Khách lẻ" fallback  
  const handleBlur = () => {
    // Delay hiding suggestions to allow click
    setTimeout(() => {
      setShowSuggestions(false);
      if (selectedCustomer) {
        setDisplayValue(`${selectedCustomer.name} - ${selectedCustomer.phone}`);
      } 
      // ✅ If no customer selected, stay empty (defaults to retail internally)
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          id="customer-search-input"
          name="customer-search-input"
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
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Selected customer info */}
      {selectedCustomer && !showSuggestions && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
              <div className="text-sm text-blue-600">{selectedCustomer.phone}</div>
              {selectedCustomer.email && (
                <div className="text-sm text-blue-600">{selectedCustomer.email}</div>
              )}
              {selectedCustomer.recentAddress && (
                <div className="text-xs text-blue-500">Địa chỉ: {selectedCustomer.recentAddress}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg">
          <div className="p-2">
            {/* Retail option */}
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto mb-1"
              onClick={handleRetailSelect}
            >
              <User className="h-4 w-4 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Khách lẻ</div>
                <div className="text-sm text-gray-600">Bán cho khách không có thông tin</div>
              </div>
            </Button>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-t">
                  KHÁCH HÀNG HIỆN CÓ
                </div>
                {suggestions.map((customer) => (
                  <Button
                    key={customer.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto mb-1"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <User className="h-4 w-4 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                      {customer.recentAddress && (
                        <div className="text-xs text-gray-500">Địa chỉ: {customer.recentAddress}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </>
            )}

            {/* No results */}
            {searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
              <div className="p-3 text-center text-gray-500">
                <div className="text-sm">Không tìm thấy khách hàng</div>
                <div className="text-xs">Hệ thống sẽ tự động tạo "Khách lẻ"</div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="p-3 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
                <div className="text-sm text-gray-500 mt-1">Đang tìm kiếm...</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
});