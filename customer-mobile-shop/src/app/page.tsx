'use client'

import React, { useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ShoppingCart, User, ArrowLeft, Plus, Minus, Store, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorefrontBottomNav } from '@/components/StorefrontBottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { AutoHideSearchBar } from '@/components/AutoHideSearchBar';
import { HiddenSearchBar } from '@/components/HiddenSearchBar';
import { FullScreenLunarCalendar } from '@/components/FullScreenLunarCalendar';
import { MediaViewer } from '@/components/MediaViewer';
import { ImageSlider } from '@/components/ImageSlider';
import { ProfileTab } from '@/components/ProfileTab';
import { BlogTab } from '@/components/BlogTab';
import { BlogPost } from '@/components/BlogPost';
import DesktopChatBot from '@/components/DesktopChatBot';
import DesktopFooter from '@/components/DesktopFooter';
import { useResponsive } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { formatVietnamPrice } from '@/utils/currency';

// API base URL from environment or default  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

// Banner images for slider
const BANNER_IMAGES = [
  '/images/modern_e-commerce_ba_70f9ff6e.jpg',
  '/images/modern_e-commerce_ba_a5ed4b23.jpg',
  '/images/modern_e-commerce_ba_9f23a27c.jpg'
];


interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  media?: string; // Support both image and video URLs
  category_id: string;
  stock: number;
  short_description?: string;
  status: string;
  benefits?: string | string[];
  // Badge properties
  isNew?: boolean;
  isTopseller?: boolean;
  isFreeshipping?: boolean;
  isBestseller?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  readingTime: number;
  isNew?: boolean;
  isFeatured?: boolean;
  views?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export default function MobileStorefront() {
  // Responsive hooks
  const { isMobile, isTablet } = useResponsive();
  
  // Authentication
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSelectedCategory, setBlogSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Responsive layout configurations
  const layoutConfig = {
    gridCols: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4 xl:grid-cols-5',
    containerClass: isMobile ? 'w-full' : 'max-w-7xl mx-auto',
    contentPadding: isMobile ? 'p-4' : 'p-6 lg:p-8',
    gridGap: isMobile ? 'gap-3' : 'gap-4 lg:gap-6',
    showBottomNav: isMobile
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

  // Demo products with badges for testing (when API fails)
  const demoProducts: Product[] = [
    {
      id: 'demo-1',
      name: 'Nhang Trầm Hương Cao Cấp',
      price: 150000,
      image: '/images/modern_e-commerce_ba_70f9ff6e.jpg',
      category_id: 'incense',
      stock: 50,
      short_description: 'Nhang trầm hương thượng hạng từ Huế',
      status: 'active',
      benefits: ['Thanh tịnh tâm hồn', 'Thơm dịu nhẹ'],
      isNew: true,
      isTopseller: true
    },
    {
      id: 'demo-2', 
      name: 'Nhang Sandalwood Premium',
      price: 200000,
      image: '/images/modern_e-commerce_ba_a5ed4b23.jpg',
      category_id: 'incense',
      stock: 30,
      short_description: 'Nhang gỗ đàn hương nguyên chất',
      status: 'active',
      benefits: ['Thư giãn', 'Thiền định'],
      isFreeshipping: true,
      isBestseller: true
    },
    {
      id: 'demo-3',
      name: 'Nhang Que Truyền Thống',
      price: 80000,
      image: '/images/modern_e-commerce_ba_9f23a27c.jpg',
      category_id: 'incense',
      stock: 100,
      short_description: 'Nhang que làm thủ công theo phương pháp cổ truyền',
      status: 'active',
      benefits: ['Tôn giáo', 'Gia đình'],
      isNew: true,
      isFreeshipping: true
    },
    {
      id: 'demo-4',
      name: 'Bộ Nhang Ngũ Hành',
      price: 350000,
      image: '/images/modern_e-commerce_ba_70f9ff6e.jpg',
      category_id: 'incense',
      stock: 20,
      short_description: 'Bộ nhang 5 loại theo ngũ hành kim, mộc, thủy, hỏa, thổ',
      status: 'active',
      benefits: ['Cân bằng năng lượng', 'Phong thủy'],
      isTopseller: true,
      isBestseller: true,
      isFreeshipping: true
    }
  ];

  // Use demo products when API fails or returns empty
  const displayProducts = (products.length > 0 || productsLoading) ? products : demoProducts;
  
  // Force demo products for testing (temporary)
  const finalProducts = productsError || products.length === 0 ? demoProducts : displayProducts;

  // Fetch real categories with loading states
  const { 
    data: allCategories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/categories/filter?frontendId=frontend-a`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });
  
  // Create simplified category list with real IDs
  const categories = categoriesLoading ? [] : [
    { id: 'all', name: 'Tất cả', icon: '🛍️' },
    ...allCategories.map(cat => ({
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
    setSelectedProduct(null); // Always clear product view when changing tabs
    setActiveTab(tab);
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

  const handleProfileClick = () => {
    setActiveTab('profile');
  };

  // Helper function to render product badges
  const renderProductBadges = (product: Product) => {
    const badges = [];
    
    if (product.isNew) {
      badges.push(
        <Badge key="new" variant="new" className="text-xs">
          🆕 MỚI
        </Badge>
      );
    }
    
    if (product.isTopseller) {
      badges.push(
        <Badge key="topseller" variant="topseller" className="text-xs">
          🏆 BÁN CHẠY
        </Badge>
      );
    }
    
    if (product.isFreeshipping) {
      badges.push(
        <Badge key="freeshipping" variant="freeshipping" className="text-xs">
          🚚 FREESHIP
        </Badge>
      );
    }
    
    if (product.isBestseller) {
      badges.push(
        <Badge key="bestseller" variant="bestseller" className="text-xs">
          ⭐ YÊU THÍCH
        </Badge>
      );
    }
    
    return badges;
  };

  const renderContent = () => {
    // If a product is selected, show full page product view
    if (selectedProduct) {
      return (
        <div className="bg-white min-h-screen">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 relative">
            <MediaViewer
              src={selectedProduct.media || selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
              isHomepage={false} // Product detail view is not homepage
            />
            {/* Back Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white/90 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-6 space-y-4">
            {/* Name & Price */}
            <div>
              {/* Product Name and Badges - inline layout */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedProduct.name}
                </h1>
                {/* Product Badges - displayed next to product name */}
                {renderProductBadges(selectedProduct).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {renderProductBadges(selectedProduct)}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-green-600">
                  {formatVietnamPrice(selectedProduct.price)}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-gray-200 text-gray-200" />
                  <span className="text-sm text-gray-600 ml-1">(4.0)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.short_description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedProduct.short_description}
                </p>
              </div>
            )}

            {/* Benefits */}
            {selectedProduct.benefits && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Công dụng</h3>
                <ul className="space-y-1">
                  {(typeof selectedProduct.benefits === 'string' 
                    ? selectedProduct.benefits.split(',').map(b => b.trim()).filter(b => b.length > 0)
                    : selectedProduct.benefits
                  ).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tình trạng:</span>
              {selectedProduct.stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">
                  Còn hàng ({selectedProduct.stock} sản phẩm)
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">Hết hàng</span>
              )}
            </div>

            {/* Quantity in Cart */}
            {cart.find(item => item.product.id === selectedProduct.id) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Đã có {cart.find(item => item.product.id === selectedProduct.id)?.quantity} sản phẩm trong giỏ hàng
                  </span>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <div className="pt-4">
              <Button
                onClick={() => addToCart(selectedProduct)}
                disabled={selectedProduct.stock === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>
            </div>
          </div>
        </div>
      );
    }

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
                      <MediaViewer
                        src={item.product.media || item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        isHomepage={false} // Cart view is not homepage
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-green-600 font-bold">
                          {formatVietnamPrice(item.product.price)}
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
                      {formatVietnamPrice(getTotalPrice())}
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
        return <ProfileTab />;

      case 'blog':
        // If a blog post is selected, show blog post detail
        if (selectedBlogPost) {
          return (
            <BlogPost
              post={selectedBlogPost}
              onBack={() => setSelectedBlogPost(null)}
              onTagClick={(tag) => {
                // Filter blog posts by tag (use search for tags)
                setBlogSearchQuery(tag);
                setSelectedBlogPost(null);
                setActiveTab('blog');
              }}
              onCategoryClick={(category) => {
                // Filter blog posts by category
                setBlogSelectedCategory(category);
                setBlogSearchQuery(''); // Clear search when filtering by category
                setSelectedBlogPost(null);
                setActiveTab('blog');
              }}
            />
          );
        }
        // Otherwise show blog list
        return (
          <BlogTab
            onPostClick={(post) => setSelectedBlogPost(post)}
            searchQuery={blogSearchQuery}
            selectedCategory={blogSelectedCategory}
            onSearchChange={setBlogSearchQuery}
            onCategorySelect={setBlogSelectedCategory}
            cartCount={getTotalItems()}
            onCartClick={() => setActiveTab('cart')}
            onHomeClick={() => setActiveTab('home')}
          />
        );

      default: // 'home'
        return (
          <div className={layoutConfig.containerClass}>
            {/* Banner Slider */}
            <ImageSlider 
              images={BANNER_IMAGES}
              className="mb-6"
              autoplay={true}
              autoplayDelay={4000}
            />
            
            {/* ProductCatalog removed - categories now shown in DesktopHeader */}
            
            {/* Product Grid */}
            <div className={layoutConfig.contentPadding}>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {productsLoading && !productsError ? (
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
                ) : false ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <p className="text-gray-600 mb-4">Không thể tải sản phẩm - hiển thị demo</p>
                    <Button onClick={() => window.location.reload()}>
                      Thử lại
                    </Button>
                  </div>
                ) : finalProducts.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-600">Không tìm thấy sản phẩm</p>
                  </div>
                ) : (
                  finalProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div 
                        className="aspect-square bg-gray-100 cursor-pointer relative"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <MediaViewer
                          src={product.media || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          isHomepage={activeTab === 'home'} // Use dynamic homepage detection
                        />
                        {/* Product Badges - positioned at top of image */}
                        {renderProductBadges(product).length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {renderProductBadges(product)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">
                          {product.name}
                        </h3>
                        <div className="mb-3">
                          <span className="text-green-600 font-bold text-lg">
                            {formatVietnamPrice(product.price)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                            className="flex-1 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Tìm hiểu Thêm
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="bg-green-500 hover:bg-green-600 w-10 h-8 p-0"
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
    <div className="min-h-screen bg-white">
      {/* Desktop Header - Show on tablet and desktop */}
      {!isMobile && (
        <DesktopHeader
          storeName="NhangSach.Net"
          cartCount={getTotalItems()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCartClick={handleHeaderCartClick}
          onProfileClick={handleProfileClick}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          showCategoryBar={true}
        />
      )}

      {/* Mobile Header - Show on mobile only */}
      {isMobile && (
        <MobileHeader
          onSearchClick={handleHeaderSearchClick}
          onCartClick={handleHeaderCartClick}
          onProfileClick={handleProfileClick}
          cartCount={getTotalItems()}
          storeName="Nhang Sạch .Net"
        />
      )}

      {/* Auto Hide Search Bar - Mobile only */}
      {isMobile && activeTab === 'home' && (
        <AutoHideSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm kiếm sản phẩm..."
        />
      )}

      {/* Hidden Search Bar - Desktop only */}
      {!isMobile && (
        <HiddenSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm kiếm sản phẩm..."
        />
      )}

      <main className={isMobile ? "pb-20 pt-8" : "pt-6"}>
        {renderContent()}
      </main>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <StorefrontBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Desktop ChatBot - Show on desktop only */}
      {!isMobile && <DesktopChatBot />}

      {/* Desktop Footer - Show on desktop only */}
      {!isMobile && <DesktopFooter />}

    </div>
  );
}