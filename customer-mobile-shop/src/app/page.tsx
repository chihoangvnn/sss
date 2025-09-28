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

// API base URL from environment or default  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

// Book genres with English names and icons
const BOOK_GENRES = [
  { id: 'all', name: 'All Books', icon: '📚' },
  { id: 'literature', name: 'Literature', icon: '✍️' },
  { id: 'business', name: 'Business & Economics', icon: '💼' },
  { id: 'science', name: 'Science & Technology', icon: '🔬' },
  { id: 'children', name: 'Children\'s Books', icon: '🧸' },
  { id: 'self-help', name: 'Self-Help & Personal Development', icon: '🎯' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'psychology', name: 'Psychology', icon: '🧠' },
  { id: 'cooking', name: 'Cooking & Food', icon: '👨‍🍳' },
  { id: 'art', name: 'Arts & Crafts', icon: '🎨' },
  { id: 'health', name: 'Health & Fitness', icon: '💪' },
  { id: 'education', name: 'Education', icon: '🎓' }
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

  // Professional book catalog with diverse categories
  const demoBooks: Book[] = [
    // Business & Economics Books
    {
      id: 'demo-1',
      title: 'The Lean Startup',
      author: 'Eric Ries',
      price: 28.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 45,
      description: 'How constant innovation creates radically successful businesses',
      rating: 4.7,
      publisher: 'Crown Business',
      publication_year: 2021,
      pages: 336,
      language: 'English',
      isbn: '978-0-307-88789-4',
      status: 'active',
      isNew: true,
      isBestseller: true
    },
    {
      id: 'demo-2',
      title: 'Think Like a Programmer',
      author: 'V. Anton Spraul',
      price: 32.95,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 60,
      description: 'An introduction to creative problem solving',
      rating: 4.5,
      publisher: 'No Starch Press',
      publication_year: 2020,
      pages: 260,
      language: 'English',
      isbn: '978-1-59327-424-5',
      status: 'active',
      isRecommended: true,
      isFeatured: true
    },
    {
      id: 'demo-3',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      price: 45.99,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 35,
      description: 'Essential techniques for writing clean, maintainable code',
      rating: 4.8,
      publisher: 'Prentice Hall',
      publication_year: 2019,
      pages: 464,
      language: 'English',
      isbn: '978-0-13-235088-4',
      status: 'active',
      isBestseller: true,
      isFeatured: true
    },
    {
      id: 'demo-4',
      title: 'Principles: Life and Work',
      author: 'Ray Dalio',
      price: 35.00,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 50,
      description: 'Fundamental principles for effective decision-making and success',
      rating: 4.6,
      publisher: 'Simon & Schuster',
      publication_year: 2020,
      pages: 592,
      language: 'English',
      isbn: '978-1-5011-2454-5',
      status: 'active',
      isNew: true,
      isRecommended: true
    },
    {
      id: 'demo-5',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma',
      price: 54.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 25,
      description: 'The classic reference for software design patterns',
      rating: 4.9,
      publisher: 'Addison-Wesley',
      publication_year: 2018,
      pages: 395,
      language: 'English',
      isbn: '978-0-201-63361-0',
      status: 'active',
      isBestseller: true,
      isFeatured: true
    },
    {
      id: 'demo-6',
      title: 'Good to Great: Why Some Companies Make the Leap... and Others Don\'t',
      author: 'Jim Collins',
      price: 29.99,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 40,
      description: 'What makes companies transition from good to great performance',
      rating: 4.4,
      publisher: 'HarperBusiness',
      publication_year: 2019,
      pages: 320,
      language: 'English',
      isbn: '978-0-06-662099-2',
      status: 'active',
      isRecommended: true
    },
    {
      id: 'demo-7',
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell',
      price: 78.99,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 15,
      description: 'Comprehensive introduction to artificial intelligence',
      rating: 4.7,
      publisher: 'Pearson',
      publication_year: 2021,
      pages: 1152,
      language: 'English',
      isbn: '978-0-13-461099-3',
      status: 'active',
      isNew: true,
      isFeatured: true
    },
    {
      id: 'demo-8',
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      price: 26.95,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'psychology',
      stock: 65,
      description: 'Timeless lessons on wealth, greed, and happiness',
      rating: 4.6,
      publisher: 'Harriman House',
      publication_year: 2020,
      pages: 252,
      language: 'English',
      isbn: '978-0-85719-757-2',
      status: 'active',
      isBestseller: true,
      isNew: true
    },
    {
      id: 'demo-9',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      price: 89.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 20,
      description: 'Comprehensive guide to algorithms and data structures',
      rating: 4.8,
      publisher: 'MIT Press',
      publication_year: 2019,
      pages: 1312,
      language: 'English',
      isbn: '978-0-262-03384-8',
      status: 'active',
      isBestseller: true,
      isFeatured: true
    },
    {
      id: 'demo-10',
      title: 'Zero to One: Notes on Startups, or How to Build the Future',
      author: 'Peter Thiel',
      price: 24.99,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 55,
      description: 'Essential reading for entrepreneurs and innovators',
      rating: 4.5,
      publisher: 'Crown Business',
      publication_year: 2020,
      pages: 224,
      language: 'English',
      isbn: '978-0-8041-3929-8',
      status: 'active',
      isRecommended: true
    },
    {
      id: 'demo-11',
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      price: 31.95,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'psychology',
      stock: 30,
      description: 'How the mind makes decisions and judgments',
      rating: 4.7,
      publisher: 'Farrar, Straus and Giroux',
      publication_year: 2018,
      pages: 499,
      language: 'English',
      isbn: '978-0-374-27563-1',
      status: 'active',
      isBestseller: true,
      isFeatured: true
    },
    {
      id: 'demo-12',
      title: 'The Innovator\'s Dilemma',
      author: 'Clayton M. Christensen',
      price: 33.99,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 40,
      description: 'Why good companies fail and how to avoid the same fate',
      rating: 4.4,
      publisher: 'Harvard Business Review Press',
      publication_year: 2019,
      pages: 286,
      language: 'English',
      isbn: '978-1-4221-9524-8',
      status: 'active',
      isRecommended: true
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
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
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
          🆕 NEW
        </Badge>
      );
    }
    
    if (book.isBestseller) {
      badges.push(
        <Badge key="bestseller" variant="bestseller" className="text-xs">
          🏆 BESTSELLER
        </Badge>
      );
    }
    
    if (book.isRecommended) {
      badges.push(
        <Badge key="recommended" variant="freeshipping" className="text-xs">
          🎩 FEATURED
        </Badge>
      );
    }
    
    if (book.isFeatured) {
      badges.push(
        <Badge key="featured" variant="bestseller" className="text-xs">
          ⭐ POPULAR
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
              <h2 className="text-xl font-bold mb-4 text-gray-900">Book Categories</h2>
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
            <h2 className="text-xl font-bold mb-4 text-gray-900">Shopping Cart ({getTotalItems()} items)</h2>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <p className="text-gray-400 text-sm">Add books to start shopping</p>
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
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatVietnamPrice(getTotalPrice())}
                    </span>
                  </div>
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold">
                    Checkout Now
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
                    <p className="text-gray-600 mb-4">Unable to load books - showing demo</p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : finalBooks.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-600">No books found</p>
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
                            Details
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
          storeName="BookStore.Net"
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
          storeName="BookStore.Net"
        />
      )}

      {/* Auto Hide Search Bar - Mobile only */}
      {isMobile && activeTab === 'home' && (
        <AutoHideSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search books..."
        />
      )}

      {/* Hidden Search Bar - Desktop only */}
      {!isMobile && (
        <HiddenSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search books..."
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