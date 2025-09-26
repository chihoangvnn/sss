import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, ArrowLeft, Plus, Minus, Heart, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ChatbotWidget from '@/components/ChatbotWidget';
import { StorefrontBottomNav } from '@/components/StorefrontBottomNav';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { VietnameseLunarCalendar } from '@/components/VietnameseLunarCalendar';
import { 
  ProductListSkeleton, 
  CategorySkeleton, 
  SearchSkeleton 
} from '@/components/LoadingSkeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category_id: string;
  stock: number;
  short_description?: string;
  status: string;
  benefits?: string | string[]; // Added benefits field for organic food business
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// We'll use real categories from API and limit to top 2-3

function MobileStorefront() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  // Wishlist functionality replaced with lunar calendar
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [minRating, setMinRating] = useState(0);
  
  // Auto-hide search bar state with focus protection
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll setup - fetch products with pagination
  const { 
    data: productsData,
    isLoading: productsLoading, 
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: productsRefetching 
  } = useInfiniteQuery<Product[]>({
    queryKey: ['mobile-products', selectedCategory, searchQuery, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      let url = `/api/products?limit=20&offset=${pageParam}`;
      if (selectedCategory !== 'all') {
        url += `&categoryId=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Add sorting parameters
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than limit, no more pages
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
  
  // Flatten pages into single array
  const products = productsData?.pages.flat() || [];

  // Fetch real categories with loading states
  const { 
    data: allCategories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });
  
  // Create simplified category list with real IDs (limit to 2-3 categories)
  const categories = categoriesLoading ? [] : [
    { id: 'all', name: 'Tất cả', icon: '🛍️' },
    ...allCategories.slice(0, 2).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: getCategoryIcon(cat.name)
    }))
  ];
  
  // Helper function to get category icons
  function getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('điện') || name.includes('phone') || name.includes('tech')) return '📱';
    if (name.includes('sách') || name.includes('book')) return '📚';
    if (name.includes('làm đẹp') || name.includes('beauty') || name.includes('cosmetic')) return '💄';
    if (name.includes('thời trang') || name.includes('fashion') || name.includes('clothes')) return '👕';
    if (name.includes('gia dụng') || name.includes('home')) return '🏠';
    if (name.includes('thể thao') || name.includes('sport')) return '⚽';
    return '📦';
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => 
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // toggleWishlist function removed - replaced with lunar calendar functionality

  const isInWishlist = (productId: string) => {
    // Calendar suggestion logic would go here
    return false;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Throttled scroll detection with focus protection - Fixed for scrollable container
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return; // Throttle scroll events
    
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
      
      // Get scroll position from the actual scrollable container
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const currentScrollY = container.scrollTop;
      
      // Auto-hide logic ONLY when search is not focused
      if (!isSearchFocused && Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
          // Scrolling down and past header - hide search bar
          setShowSearchBar(false);
        } else if (currentScrollY < lastScrollY.current || currentScrollY <= 40) {
          // Scrolling up or near top - show search bar
          setShowSearchBar(true);
        }
        lastScrollY.current = currentScrollY;
      }
      
      // Always show search bar when at very top or when focused
      if (currentScrollY <= 10 || isSearchFocused) {
        setShowSearchBar(true);
      }
      
      // Infinite loading logic for scrollable container
      const threshold = 100; // pixels from bottom to trigger load
      const currentScroll = container.scrollTop + container.clientHeight;
      const maxScroll = container.scrollHeight;
      
      if (currentScroll >= maxScroll - threshold && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, 16); // ~60fps throttling
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, scrollThreshold, isSearchFocused]);

  // Attach scroll listener to the admin layout's scrollable container
  useEffect(() => {
    const mainContainer = document.querySelector('main.flex-1.overflow-auto') || 
                         document.querySelector('main[class*="overflow-auto"]') ||
                         document.querySelector('main');
    
    if (mainContainer) {
      scrollContainerRef.current = mainContainer as HTMLDivElement;
      mainContainer.addEventListener('scroll', handleScroll);
      return () => mainContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Advanced filtering and sorting
  const filteredProducts = products
    .filter(product => {
      // Basic filters
      if (product.status !== 'active' || product.stock <= 0) return false;
      
      // Price range filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      
      // Rating filter - implemented with graceful fallback
      // When rating data is available, filter by minimum rating
      // For now, treat products without rating as 0-star (show when minRating is 0)
      if (minRating > 0) {
        const productRating = (product as any).rating || 0; // Future: add rating to Product interface
        if (productRating < minRating) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name, 'vi')
            : b.name.localeCompare(a.name, 'vi');
        case 'newest':
        default:
          // For newest sorting, rely on backend ordering from API
          // Backend already handles the sortOrder parameter correctly
          return 0; // Maintain API order (backend-sorted)
      }
    });

  // Centralized modal close function
  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const handleTabChange = (tab: string) => {
    // CRITICAL: Auto-close modal before navigation for professional UX
    if (selectedProduct) {
      closeProductModal();
    }
    
    setActiveTab(tab);
    if (tab === 'cart') {
      setShowCart(true);
    }
  };

  const handleCloseCart = () => {
    setShowCart(false);
    setActiveTab('home'); // Return to home tab when cart is closed
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return (
          <div className="p-4 pt-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setActiveTab('home');
                  }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="p-4 pt-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Giỏ hàng ({getTotalItems()} sản phẩm)</h2>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Giỏ hàng trống</p>
                <p className="text-gray-400 text-sm">Thêm sản phẩm để bắt đầu mua sắm</p>
              </div>
            ) : (
              <div>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      {item.product.image && (
                        <img 
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-green-600 font-bold">
                          {item.product.price.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {getTotalPrice().toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold">
                    Đặt hàng ngay
                  </Button>
                </div>
              </div>
            )}
          </div>
        );


      case 'profile':
        return (
          <div className="p-4 pt-6">
            <div className="bg-white rounded-xl p-6 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Khách hàng</h3>
                  <p className="text-gray-600">Thành viên từ hôm nay</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{cart.length}</div>
                  <div className="text-sm text-gray-600">Giỏ hàng</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">📅</div>
                  <div className="text-sm text-gray-600">Lịch âm</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-left">
                <User className="h-5 w-5 mr-3" />
                Thông tin cá nhân
              </Button>
              <Button variant="outline" className="w-full justify-start text-left">
                <ShoppingCart className="h-5 w-5 mr-3" />
                Lịch sử đơn hàng
              </Button>
              <Button variant="outline" className="w-full justify-start text-left" onClick={() => window.location.href = '/calendar'}>
                <Heart className="h-5 w-5 mr-3" />
                Lịch âm dương
              </Button>
            </div>
          </div>
        );

      default: // 'home'
        return (
          <div>
            {/* Professional Category Tabs */}
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {categoriesLoading ? (
                  <CategorySkeleton />
                ) : categoriesError ? (
                  <div className="text-red-500 text-sm px-4 py-2">
                    Lỗi tải danh mục
                  </div>
                ) : (
                  categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-200 flex-shrink-0 border
                      ${selectedCategory === category.id 
                        ? 'bg-green-500 text-white border-green-500 shadow-md transform scale-105' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                  ))
                )}
              </div>
            </div>

            {/* Professional Filter Bar */}
            <div className="bg-white border-b px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-semibold">Lọc</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'newest')}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white font-medium focus:ring-2 focus:ring-green-300 focus:border-green-300"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="name">Tên A-Z</option>
                    <option value="price">Giá thấp - cao</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2.5 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Filter Options */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Khoảng giá: {priceRange[0].toLocaleString('vi-VN')}₫ - {priceRange[1].toLocaleString('vi-VN')}₫
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Từ"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                        className="text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="number"
                        placeholder="Đến"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Đánh giá tối thiểu: {minRating} ⭐ trở lên
                    </label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            minRating === rating
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {rating === 0 ? 'Tất cả' : `${rating}⭐+`}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Lưu ý: Chức năng đánh giá sẽ hoạt động khi có dữ liệu đánh giá sản phẩm
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {productsLoading || productsRefetching ? (
                  <ProductListSkeleton count={8} />
                ) : productsError ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <p className="text-gray-500 mb-4">Lỗi tải sản phẩm</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Use react-query refetch instead of hard reload
                        window.location.reload();
                      }}
                      className="bg-white"
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : (
                  <>
                    {filteredProducts.map((product) => renderProductCard(product))}
                    
                    {/* Infinite Scroll Loading */}
                    {isFetchingNextPage && (
                      <div className="py-4">
                        <ProductListSkeleton count={3} />
                      </div>
                    )}
                    
                    {/* Load More Button for fallback */}
                    {hasNextPage && !isFetchingNextPage && (
                      <div className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={() => fetchNextPage()}
                          className="w-full"
                        >
                          Tải thêm sản phẩm
                        </Button>
                      </div>
                    )}
                    
                    {/* No More Items */}
                    {!hasNextPage && products.length > 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        🎉 Đã hiển thị tất cả sản phẩm
                      </div>
                    )}
                    
                    {filteredProducts.length === 0 && !productsLoading && (
                      <div className="text-center py-8">
                        <span className="text-4xl mb-4 block">🛍️</span>
                        <p className="text-gray-500">
                          {searchQuery || selectedCategory !== 'all' 
                            ? 'Không tìm thấy sản phẩm nào' 
                            : 'Chưa có sản phẩm nào'
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const renderProductCard = (product: Product) => (
    <div 
      key={product.id}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => setSelectedProduct(product)}
    >
      {/* Full-Width Placeholder Image Section */}
      <div className="aspect-square bg-white relative border-2 border-dashed border-gray-300 rounded-t-lg">
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          <span className="text-sm font-medium">[ Hình ảnh / video ]</span>
        </div>
        
        {/* Calendar Suggestion Indicator - Top Right */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500/90 backdrop-blur-sm shadow-md flex items-center justify-center">
          <span className="text-white text-xs">📅</span>
        </div>
      </div>
      
      {/* Compact Product Info */}
      <div className="px-3 py-2">
        {/* Product Name - Single Line with Ellipsis */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
          {product.name}
        </h3>
        
        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-yellow-400 text-xs">★</span>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">(45 đánh giá)</span>
        </div>
        
        {/* Price */}
        <div className="mb-1.5">
          <span className="text-base font-bold text-gray-900">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
        </div>
        
        {/* Compact Buttons Row */}
        <div className="flex items-center gap-1.5">
          {/* Learn More Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(product);
            }}
            className="flex-1 py-1.5 px-3 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200"
          >
            Tìm hiểu Thêm
          </button>
          
          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={product.stock === 0}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Professional Green Header with Auto-hide Search */}
      <div className="bg-green-600 sticky top-0 z-[10000] shadow-lg transition-transform duration-300 ease-in-out">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 
              className="text-lg font-bold text-white cursor-pointer hover:text-green-100 transition-colors"
              onClick={() => setActiveTab('home')}
            >
              NHANGSACH.NET
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('calendar')}
                className="relative text-white hover:text-green-100 transition-colors"
              >
                <Heart className={`h-6 w-6 ${activeTab === 'calendar' ? 'fill-current' : ''}`} />
                <span className="absolute -top-1 -right-1 text-xs">📅</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="text-white hover:text-green-100 transition-colors"
              >
                <User className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setShowCart(true)}
                className="relative text-white hover:text-green-100 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                    {getTotalItems()}
                  </Badge>
                )}
              </button>
            </div>
          </div>
          
          {/* Auto-hide Search Bar with Smooth Animation - Fixed Jump Issue */}
          {(activeTab === 'home' || activeTab === 'categories') && (
            <div 
              className={`relative transition-all duration-200 ease-out overflow-hidden ${
                showSearchBar 
                  ? 'max-h-16 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setShowSearchBar(true);
                }}
                onBlur={(e) => {
                  setIsSearchFocused(false);
                  // Keep search visible if there's text typed
                  if (!e.target.value.trim()) {
                    // Small delay to prevent flickering when switching between elements
                    setTimeout(() => {
                      const container = scrollContainerRef.current;
                      if (container && container.scrollTop > 80) setShowSearchBar(false);
                    }, 200);
                  }
                }}
                className="pl-10 rounded-lg bg-white border-0 focus:ring-2 focus:ring-green-300 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content */}
      {renderContent()}

      
      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Giỏ hàng ({getTotalItems()} sản phẩm)</h2>
              <Button variant="ghost" onClick={handleCloseCart}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {item.product.image && (
                    <img 
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-green-600 font-bold">
                      {item.product.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-green-600">
                  {getTotalPrice().toLocaleString('vi-VN')}₫
                </span>
              </div>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold">
                Đặt hàng ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <StorefrontBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={getTotalItems()}
        wishlistCount={0}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={closeProductModal}
          onAddToCart={(quantity) => {
            for(let i = 0; i < quantity; i++) {
              addToCart(selectedProduct);
            }
            closeProductModal();
          }}
          onToggleWishlist={() => setActiveTab('calendar')}
          isInWishlist={isInWishlist(selectedProduct.id)}
        />
      )}

      {/* Optimized Chat Widget - positioned above green bottom nav */}
      <div className="fixed bottom-24 right-4 z-30">
        <ChatbotWidget 
          pageType="storefront"
          pageContext={{
            products: filteredProducts.slice(0, 10).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price.toString(),
              category: selectedCategory
            })),
            cartItems: cart.slice(0, 5).map(item => ({
              productId: item.product.id,
              name: item.product.name,
              quantity: item.quantity
            }))
          }}
          onAddToCart={(productId, quantity) => {
            const product = filteredProducts.find(p => p.id === productId);
            if (product) {
              for(let i = 0; i < quantity; i++) {
                addToCart(product);
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default MobileStorefront;