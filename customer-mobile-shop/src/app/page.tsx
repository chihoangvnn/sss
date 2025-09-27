'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, ArrowLeft, Plus, Minus, Heart, X, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight, Settings, Store, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { StorefrontBottomNav } from '@/components/StorefrontBottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { AutoHideSearchBar } from '@/components/AutoHideSearchBar';
import { FullScreenLunarCalendar } from '@/components/FullScreenLunarCalendar';
import { useResponsive } from '@/hooks/use-mobile';

// API base URL from environment or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

// Hero images for incense business
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
  benefits?: string | string[];
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MobileStorefront() {
  // Responsive hooks
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsive();
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [minRating, setMinRating] = useState(0);
  
  // Responsive layout configurations
  const layoutConfig = {
    gridCols: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4 xl:grid-cols-5',
    containerClass: isMobile ? 'w-full' : 'max-w-7xl mx-auto',
    heroHeight: isMobile ? 'h-44 sm:h-56' : 'h-64 lg:h-72 xl:h-80',
    contentPadding: isMobile ? 'p-4' : 'p-6 lg:p-8',
    gridGap: isMobile ? 'gap-3' : 'gap-4 lg:gap-6',
    showBottomNav: isMobile
  };
  
  // Auto-hide search bar state with focus protection
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Embla Carousel plugin for auto-play
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  
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
      title: "Nhang Sạch .Net Cao Cấp",
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
  
  // Hero carousel navigation handlers
  const handleSlideClick = (index: number) => {
    if (index === 0) setSelectedCategory('all');
    else if (index === 1) setSelectedCategory('premium');
    else setSelectedCategory('traditional');
  };

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
      let url = `${API_BASE_URL}/products?limit=20&offset=${pageParam}`;
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
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });
  
  // Create simplified category list with real IDs
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleTabChange = (tab: string) => {
    if (selectedProduct) {
      setSelectedProduct(null);
    }
    
    setActiveTab(tab);
    if (tab === 'cart') {
      setShowCart(true);
    }
  };

  const handleCloseCart = () => {
    setShowCart(false);
    setActiveTab('home');
  };

  const handleHeaderSearchClick = () => {
    setActiveTab('home');
    // Focus search input if it exists
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleHeaderCartClick = () => {
    setActiveTab('cart');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return (
          <div className={`${layoutConfig.containerClass}`}>
            <div className={`${layoutConfig.contentPadding} pt-6`}>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Danh mục sản phẩm</h2>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
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

      case 'calendar':
        return <FullScreenLunarCalendar />;

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
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setActiveTab('calendar')}
              >
                <Calendar className="h-5 w-5 mr-3" />
                Lịch vạn niên
              </Button>
            </div>
          </div>
        );

      default: // 'home'
        return (
          <div className={layoutConfig.containerClass}>
            {/* Hero Carousel for Vietnamese Incense Business */}
            <div className="relative bg-gray-900 overflow-hidden">
              <Carousel
                opts={{ 
                  align: "start", 
                  loop: true 
                }}
                plugins={[plugin.current]}
                className="w-full"
              >
                <CarouselContent className={layoutConfig.heroHeight}>
                  {heroSlides.map((slide, index) => (
                    <CarouselItem key={index} className="relative">
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
                            onClick={() => handleSlideClick(index)}
                            className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            {slide.cta}
                          </button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white border-white/20 hover:bg-white/30 hover:text-white" />
                <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white border-white/20 hover:bg-white/30 hover:text-white" />
              </Carousel>
            </div>

            {/* Categories Section */}
            <div className={`${layoutConfig.contentPadding} pb-4 pt-4`}>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className={layoutConfig.contentPadding}>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {productsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="aspect-square bg-gray-200 animate-pulse" />
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))
                ) : productsError ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <p className="text-gray-600 mb-4">Không thể tải sản phẩm</p>
                    <Button onClick={() => window.location.reload()}>
                      Thử lại
                    </Button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-600">Không tìm thấy sản phẩm</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div 
                        className="aspect-square bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.image ? (
                          <img 
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Store className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-bold">
                            {product.price.toLocaleString('vi-VN')}₫
                          </span>
                          <Button 
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Infinite Loading Indicator */}
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {layoutConfig.showBottomNav && (
        <MobileHeader
          onSearchClick={handleHeaderSearchClick}
          onCartClick={handleHeaderCartClick}
          cartCount={getTotalItems()}
          storeName="Nhang Sạch .Net"
        />
      )}


      <main className={layoutConfig.showBottomNav ? "pb-20" : ""}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {layoutConfig.showBottomNav && (
        <StorefrontBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          cartCount={getTotalItems()}
        />
      )}
    </div>
  );
}