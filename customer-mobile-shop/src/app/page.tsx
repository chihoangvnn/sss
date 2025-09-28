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
import { BookModal } from '@/components/ProductModal';
import { BookCatalog } from '@/components/ProductCatalog';
import DesktopChatBot from '@/components/DesktopChatBot';
import DesktopFooter from '@/components/DesktopFooter';
import { useResponsive } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { formatVietnamPrice } from '@/utils/currency';
import { VipTierCard } from '@/components/VipTierCard';
import { calculateVipStatus } from '@/utils/vipCalculator';

// API base URL from environment or default  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

// Book genres with Vietnamese names and icons
const BOOK_GENRES = [
  { id: 'all', name: 'Tất cả', icon: '📚' },
  { id: 'literature', name: 'Văn học', icon: '✍️' },
  { id: 'business', name: 'Kinh tế - Kinh doanh', icon: '💼' },
  { id: 'science', name: 'Khoa học - Công nghệ', icon: '🔬' },
  { id: 'children', name: 'Thiếu nhi', icon: '🧸' },
  { id: 'self-help', name: 'Kỹ năng sống', icon: '🎯' },
  { id: 'history', name: 'Lịch sử', icon: '📜' },
  { id: 'psychology', name: 'Tâm lý học', icon: '🧠' },
  { id: 'cooking', name: 'Nấu ăn', icon: '👨‍🍳' },
  { id: 'art', name: 'Nghệ thuật', icon: '🎨' },
  { id: 'health', name: 'Sức khỏe', icon: '💪' },
  { id: 'education', name: 'Giáo dục', icon: '🎓' }
];

// Banner images for bookstore slider - using placeholder images for now
const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=400&fit=crop'
];


interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  genre_id: string;
  stock: number;
  description?: string;
  rating?: number;
  status: string;
  // Badge properties
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
}

interface BookGenre {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface CartItem {
  book: Book;
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
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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
  
  
  

  // Infinite scroll setup - fetch books with pagination
  const { 
    data: booksData,
    isLoading: booksLoading, 
    error: booksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: booksRefetching 
  } = useInfiniteQuery<Book[]>({
    queryKey: ['mobile-books', selectedGenre, searchQuery, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      let url = `${API_BASE_URL}/products?limit=20&offset=${pageParam}`;
      if (selectedGenre !== 'all') {
        url += `&categoryId=${selectedGenre}`;
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
  const books = booksData?.pages.flat() || [];

  // Demo books with badges for testing (when API fails)
  const demoBooks: Book[] = [
    {
      id: 'demo-1',
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      price: 89000,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'self-help',
      stock: 50,
      description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử',
      rating: 4.8,
      publisher: 'NXB Tổng Hợp TP.HCM',
      publication_year: 2020,
      pages: 320,
      language: 'Tiếng Việt',
      isbn: '978-604-2-12345-6',
      status: 'active',
      isNew: true,
      isBestseller: true
    },
    {
      id: 'demo-2', 
      title: 'Sapiens: Lược Sử Loài Người',
      author: 'Yuval Noah Harari',
      price: 145000,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'history',
      stock: 30,
      description: 'Câu chuyện về sự tiến hóa của loài người từ thời tiền sử đến hiện đại',
      rating: 4.6,
      publisher: 'NXB Thế Giới',
      publication_year: 2019,
      pages: 512,
      language: 'Tiếng Việt',
      isbn: '978-604-7-78910-1',
      status: 'active',
      isRecommended: true,
      isFeatured: true
    },
    {
      id: 'demo-3',
      title: 'Tôi Tài Giỏi, Bạn Cũng Thế',
      author: 'Adam Khoo',
      price: 75000,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'self-help',
      stock: 100,
      description: 'Phương pháp học tập hiệu quả và phát triển bản thân',
      rating: 4.5,
      publisher: 'NXB Trẻ',
      publication_year: 2021,
      pages: 256,
      language: 'Tiếng Việt',
      isbn: '978-604-1-11213-2',
      status: 'active',
      isNew: true,
      isRecommended: true
    },
    {
      id: 'demo-4',
      title: 'Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ',
      author: 'James Clear',
      price: 120000,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'self-help',
      stock: 20,
      description: 'Hướng dẫn xây dựng thói quen tốt và loại bỏ thói quen xấu',
      rating: 4.9,
      publisher: 'NXB Thế Giới',
      publication_year: 2020,
      pages: 368,
      language: 'Tiếng Việt',
      isbn: '978-604-7-14516-3',
      status: 'active',
      isBestseller: true,
      isFeatured: true
    }
  ];

  // Use demo books when API fails or returns empty
  const displayBooks = (books.length > 0 || booksLoading) ? books : demoBooks;
  
  // Force demo books for testing (temporary)
  const finalBooks = booksError || books.length === 0 ? demoBooks : displayBooks;

  // For now, use static book genres (can fetch from API later)
  const allGenres = BOOK_GENRES;
  
  // Use book genres
  const genres = allGenres;
  
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

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        return prev.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(prev => prev.filter(item => item.book.id !== bookId));
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCart(prev => 
      prev.map(item =>
        item.book.id === bookId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleTabChange = (tab: string) => {
    setSelectedBook(null); // Always clear book view when changing tabs
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

  // Helper function to render book badges
  const renderBookBadges = (book: Book) => {
    const badges = [];
    
    if (book.isNew) {
      badges.push(
        <Badge key="new" variant="new" className="text-xs">
          🆕 MỚI
        </Badge>
      );
    }
    
    if (book.isBestseller) {
      badges.push(
        <Badge key="bestseller" variant="bestseller" className="text-xs">
          🏆 BÁN CHẠY
        </Badge>
      );
    }
    
    if (book.isRecommended) {
      badges.push(
        <Badge key="recommended" variant="freeshipping" className="text-xs">
          🎩 ĐỀ XUẤT
        </Badge>
      );
    }
    
    if (book.isFeatured) {
      badges.push(
        <Badge key="featured" variant="bestseller" className="text-xs">
          ⭐ NỔI BẬT
        </Badge>
      );
    }
    
    return badges;
  };

  const renderContent = () => {
    // If a book is selected, we'll show the BookModal separately, not here
    // Continue with normal content rendering

    switch (activeTab) {
      case 'categories':
        return (
          <div className={`${layoutConfig.containerClass}`}>
            <div className={`${layoutConfig.contentPadding} pt-6`}>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Danh mục sản phẩm</h2>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      setSelectedGenre(genre.id);
                      setActiveTab('home');
                    }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{genre.icon}</div>
                      <h3 className="font-semibold text-gray-900">{genre.name}</h3>
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
                    <div key={item.book.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.book.cover_image ? (
                          <img 
                            src={item.book.cover_image} 
                            alt={item.book.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Store className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.book.title}</h3>
                        <p className="text-sm text-gray-600">{item.book.author}</p>
                        <p className="text-blue-600 font-bold">
                          {formatVietnamPrice(item.book.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
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
        return <ProfileTab addToCart={addToCart} setActiveTab={setActiveTab} />;


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

            {/* VIP Tier Demo Section */}
            <div className={`${layoutConfig.contentPadding} pb-0`}>
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🏆 Hệ Thống VIP Thành Viên
                  </h2>
                  <p className="text-gray-600">
                    Mua sắm nhiều hơn, nhận ưu đãi tốt hơn!
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Thành viên - 0đ */}
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <VipTierCard vipProgress={calculateVipStatus(0)} />
                  </div>
                  
                  {/* Bạc - 1M */}
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <VipTierCard vipProgress={calculateVipStatus(1500000)} />
                  </div>
                  
                  {/* Vàng - 3M */}
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <VipTierCard vipProgress={calculateVipStatus(4200000)} />
                  </div>
                  
                  {/* Kim Cương - 10M */}
                  <div className="transform hover:scale-105 transition-transform duration-300">
                    <VipTierCard vipProgress={calculateVipStatus(12000000)} />
                  </div>
                </div>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-500">
                    💡 <strong>Demo:</strong> Đăng nhập để xem cấp độ thực tế của bạn!
                  </p>
                </div>
              </div>
            </div>
            
            {/* ProductCatalog removed - categories now shown in DesktopHeader */}
            
            {/* Product Grid */}
            <div className={layoutConfig.contentPadding}>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {booksLoading && !booksError ? (
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
                ) : finalBooks.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-600">Không tìm thấy sách</p>
                  </div>
                ) : (
                  finalBooks.map((book) => (
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div 
                        className="aspect-[3/4] bg-gray-100 cursor-pointer relative"
                        onClick={() => setSelectedBook(book)}
                      >
                        {book.cover_image ? (
                          <img 
                            src={book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Store className="h-16 w-16" />
                          </div>
                        )}
                        {/* Book Badges - positioned at top of image */}
                        {renderBookBadges(book).length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {renderBookBadges(book)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate text-sm">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 truncate">{book.author}</p>
                        <div className="mb-3">
                          <span className="text-blue-600 font-bold text-lg">
                            {formatVietnamPrice(book.price)}
                          </span>
                          {book.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    i < Math.floor(book.rating!) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'fill-gray-200 text-gray-200'
                                  }`} 
                                />
                              ))}
                              <span className="text-xs text-gray-600 ml-1">({book.rating})</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBook(book)}
                            className="flex-1 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Chi tiết
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => addToCart(book)}
                            className="bg-blue-500 hover:bg-blue-600 w-10 h-8 p-0"
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
          storeName="NhaSach.Net"
          cartCount={getTotalItems()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCartClick={handleHeaderCartClick}
          onProfileClick={handleProfileClick}
          categories={genres}
          selectedCategory={selectedGenre}
          onCategorySelect={setSelectedGenre}
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
          storeName="NhaSach.Net"
        />
      )}

      {/* Auto Hide Search Bar - Mobile only */}
      {isMobile && activeTab === 'home' && (
        <AutoHideSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm kiếm sách..."
        />
      )}

      {/* Hidden Search Bar - Desktop only */}
      {!isMobile && (
        <HiddenSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm kiếm sách..."
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

      {/* Book Modal */}
      <BookModal 
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onAddToCart={addToCart}
        cart={cart}
      />

    </div>
  );
}