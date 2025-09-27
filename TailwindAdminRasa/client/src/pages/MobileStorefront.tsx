import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, ArrowLeft, Plus, Minus, Heart, X, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Import hero images for incense business
const heroImage1 = '/incense-hero-1.png';
const heroImage2 = '/incense-hero-2.png';
const heroImage3 = '/incense-hero-3.png';

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
  
  // Hero carousel state for incense business
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  
  // Touch/swipe state for mobile gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Hero slides data for Vietnamese incense business
  const heroSlides = [
    {
      image: heroImage1,
      title: "Nhang Sạch Tự Nhiên",
      subtitle: "Thanh Tịnh Tâm Hồn",
      description: "100% thành phần tự nhiên, không hóa chất độc hại",
      cta: "Khám Phá Ngay",
      bgGradient: "from-amber-900/80 to-orange-800/80"
    },
    {
      image: heroImage2, 
      title: "Nhang Trầm Hương Cao Cấp",
      subtitle: "Hương Thơm Thiên Nhiên",
      description: "Từ cây trầm hương quý hiếm, mang đến không gian linh thiêng",
      cta: "Xem Sản Phẩm",
      bgGradient: "from-emerald-900/80 to-teal-800/80"
    },
    {
      image: heroImage3,
      title: "Thắp Hương Cúng Phật",
      subtitle: "Truyền Thống Việt Nam", 
      description: "Gìn giữ nét đẹp tâm linh, thể hiện lòng thành kính của người Việt",
      cta: "Tìm Hiểu Thêm",
      bgGradient: "from-red-900/80 to-orange-800/80"
    }
  ];
  
  // Auto-slide functionality for hero carousel
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearTimeout(autoSlideRef.current);
    autoSlideRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000); // 4 seconds per slide
  }, [heroSlides.length]);
  
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    startAutoSlide(); // Reset auto-slide timer
  }, [startAutoSlide]);
  
  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next slide
      goToSlide((currentSlide + 1) % heroSlides.length);
    } else if (isRightSwipe) {
      // Swipe right - previous slide  
      goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
    }
  };
  
  // Start auto-slide on component mount and cleanup on unmount
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) clearTimeout(autoSlideRef.current);
    };
  }, [startAutoSlide]);

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
            {/* Hero Carousel for Vietnamese Incense Business */}
            <div className="relative bg-gray-900 overflow-hidden">
              {/* Carousel Container */}
              <div 
                className="relative h-44 sm:h-56"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex transition-transform duration-500 ease-out h-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {heroSlides.map((slide, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient}`} />
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex items-center justify-center px-6">
                        <div className="text-center text-white max-w-md">
                          <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                            {slide.title}
                          </h2>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 text-yellow-200 drop-shadow-md">
                            {slide.subtitle}
                          </h3>
                          <p className="text-sm sm:text-base mb-4 opacity-90 drop-shadow-sm">
                            {slide.description}
                          </p>
                          <button 
                            onClick={() => {
                              // Navigate based on slide content
                              if (index === 0) setSelectedCategory('all');
                              else if (index === 1) setSelectedCategory('premium');
                              else setSelectedCategory('traditional');
                            }}
                            className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            {slide.cta}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Arrows */}
                <button
                  onClick={() => goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => goToSlide((currentSlide + 1) % heroSlides.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-200 ${
                        currentSlide === index 
                          ? 'w-8 h-3 bg-white rounded-full' 
                          : 'w-3 h-3 bg-white/60 rounded-full hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
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