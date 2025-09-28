'use client'

import React, { useState } from 'react';
import { BookOpen, Star, Shield, Heart, LogIn, ArrowRight, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { BookCard } from './BookCard';

// API base URL from environment or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  priceRegions?: {
    USD: number;
    EUR: number;
    GBP: number;
    AUD: number;
    CAD: number;
  };
  targetMarkets?: string[];
}

interface LandingPageProps {
  onBrowseCatalog?: () => void;
}

// Featured Books Component
const FeaturedBooksSection = ({ onBookSelect, onAddToCart }: {
  onBookSelect: (book: Book) => void;
  onAddToCart: (book: Book) => void;
}) => {
  const { data: featuredBooks, isLoading: featuredLoading } = useQuery<Book[]>({
    queryKey: ['featured-books'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products?limit=8`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching featured books:', error);
        return [];
      }
    },
  });

  if (featuredLoading) {
    return (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Featured Books
          </h2>
          <div className="text-center text-gray-600">Loading featured books...</div>
        </div>
      </div>
    );
  }

  if (!featuredBooks || featuredBooks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Featured Books
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onBookSelect}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={() => {}}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            View All Books
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export function LandingPage({ onBrowseCatalog }: LandingPageProps = {}) {
  const { login, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Handle login-guarded actions
  const handleAddToCart = (book: Book) => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      login();
      return;
    }
    // TODO: Implement actual add to cart logic
    console.log('Adding to cart:', book);
  };

  const handleAddToWishlist = (book: Book) => {
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      login();
      return;
    }
    // TODO: Implement actual add to wishlist logic
    console.log('Adding to wishlist:', book);
  };

  // Search Results Component (inline)
  const SearchResults = ({ searchQuery, onBookSelect, onAddToCart }: {
    searchQuery: string;
    onBookSelect: (book: Book) => void;
    onAddToCart: (book: Book) => void;
  }) => {
    const { data: searchBooks, isLoading: searchLoading, error: searchError } = useQuery<Book[]>({
      queryKey: ['search-books', searchQuery],
      queryFn: async () => {
        if (!searchQuery.trim()) return [];
        
        let url = `${API_BASE_URL}/products?limit=12&search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          // Return demo books if API fails
          return demoBooks.filter(book => 
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return response.json();
      },
      enabled: !!searchQuery.trim(),
    });

    // Demo books for fallback
    const demoBooks: Book[] = [
      {
        id: 'demo-1',
        title: 'The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
        author: 'Eric Ries',
        price: 28.99,
        cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
        genre_id: 'business',
        stock: 45,
        description: 'Transform your startup approach with validated learning and iterative product development.',
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
        title: 'Think Like a Programmer: An Introduction to Creative Problem Solving',
        author: 'V. Anton Spraul',
        price: 32.95,
        cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
        genre_id: 'science',
        stock: 60,
        description: 'Develop systematic problem-solving skills through structured programming exercises.',
        rating: 4.5,
        publisher: 'No Starch Press',
        publication_year: 2020,
        pages: 260,
        language: 'English',
        isbn: '978-1-59327-424-5',
        status: 'active',
        isRecommended: true
      },
      {
        id: 'demo-3',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin (Uncle Bob)',
        price: 45.99,
        cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        genre_id: 'science',
        stock: 35,
        description: 'Transform your coding practices with software craftsmanship principles.',
        rating: 4.8,
        publisher: 'Prentice Hall',
        publication_year: 2019,
        pages: 464,
        language: 'English',
        isbn: '978-0-13-235088-4',
        status: 'active',
        isBestseller: true
      }
    ];

    const books = searchBooks || demoBooks;

    if (searchLoading) {
      return (
        <div className="mt-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="mt-2 text-gray-600">Searching books...</p>
          </div>
        </div>
      );
    }

    if (books.length === 0) {
      return (
        <div className="mt-8 text-center">
          <p className="text-gray-600">No books found for "{searchQuery}"</p>
          <p className="text-sm text-gray-500 mt-2">Try different keywords or browse our categories</p>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Search Results for "{searchQuery}"
          </h3>
          <p className="text-gray-600">Found {books.length} books</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.slice(0, 12).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onBookSelect}
              onAddToCart={onAddToCart}
              className="hover:scale-105 transition-transform"
            />
          ))}
        </div>
        
        {books.length > 12 && (
          <div className="text-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Please login to view full catalog');
                  login();
                  return;
                }
                // TODO: Navigate to full search results page
              }}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              View All {books.length} Results
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-green-100 p-4 rounded-full">
              <BookOpen className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-green-600">BookStore.Net</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover thousands of books across all genres. From bestselling novels to academic texts, 
            find your next great read in our comprehensive online bookstore.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={login}
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Login to Start Shopping
            </Button>
            
            <Button 
              onClick={onBrowseCatalog}
              variant="outline" 
              size="lg"
              className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg"
            >
              Browse Catalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Find Your Next Great Read
            </h2>
            <p className="text-gray-600">
              Search through thousands of books across all categories
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for books, authors, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg leading-6 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm"
            />
          </div>
          
          {searchQuery && (
            <div className="mt-4 text-center">
              <Button 
                onClick={() => setShowSearchResults(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                Search Books
              </Button>
            </div>
          )}
        </div>

        {/* Search Results Section */}
        {showSearchResults && searchQuery && (
          <SearchResults 
            searchQuery={searchQuery} 
            onBookSelect={setSelectedBook}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Featured Books Section */}
        <FeaturedBooksSection onBookSelect={setSelectedBook} onAddToCart={handleAddToCart} />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Vast Collection</h3>
            <p className="text-gray-600">
              Explore thousands of books across all genres, from fiction to academic texts.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-yellow-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Curated Selection</h3>
            <p className="text-gray-600">
              Handpicked books with ratings and reviews to help you find your perfect read.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Shopping</h3>
            <p className="text-gray-600">
              Safe and secure checkout with multiple payment options and buyer protection.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Categories
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Literature', icon: '📚', count: '1,200+' },
              { name: 'Business', icon: '💼', count: '800+' },
              { name: 'Science', icon: '🔬', count: '600+' },
              { name: 'Children\'s', icon: '🧸', count: '900+' }
            ].map((category, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} books</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Reading?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of book lovers who have found their favorite reads with us.
          </p>
          
          <Button 
            onClick={login}
            size="lg" 
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            <Heart className="mr-2 h-5 w-5" />
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}