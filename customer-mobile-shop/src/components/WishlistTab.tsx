'use client'

import React, { useState, useEffect } from 'react';
import { Heart, Star, ShoppingCart, Trash2, Book, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnamPrice } from '@/utils/currency';

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
  // SEO metadata fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // International support
  priceRegions?: {
    USD: number;
    EUR: number;
    GBP: number;
    AUD: number;
    CAD: number;
  };
  targetMarkets?: string[];
}

interface WishlistTabProps {
  addToCart?: (book: Book) => void;
  onBookClick?: (book: Book) => void;
}

const WISHLIST_STORAGE_KEY = 'bookstore_wishlist';

export function WishlistTab({ addToCart, onBookClick }: WishlistTabProps) {
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from localStorage on component mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist);
        setWishlistBooks(wishlist);
      } catch (error) {
        console.error('Error parsing wishlist from localStorage:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistBooks));
    }
  }, [wishlistBooks, isLoading]);

  const removeFromWishlist = (bookId: string) => {
    const updatedBooks = wishlistBooks.filter(book => book.id !== bookId);
    setWishlistBooks(updatedBooks);
    // Immediately update localStorage and dispatch event to keep count in sync
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedBooks));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const clearWishlist = () => {
    setWishlistBooks([]);
    // Immediately update localStorage and dispatch event to keep count in sync
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const shareWishlist = () => {
    if (navigator.share && wishlistBooks.length > 0) {
      const bookTitles = wishlistBooks.map(book => book.title).join(', ');
      navigator.share({
        title: 'My BookStore Wishlist',
        text: `Check out my reading wishlist: ${bookTitles}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 pt-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-16 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistBooks.length === 0) {
    return (
      <div className="p-4 pt-6">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your Wishlist is Empty
          </h2>
          
          <p className="text-gray-600 mb-6">
            Start building your reading list by adding books you love!
          </p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p className="flex items-center justify-center">
              <Heart className="w-4 h-4 mr-2 text-red-500" />
              Tap the heart icon on any book to add it here
            </p>
            <p className="flex items-center justify-center">
              <Share2 className="w-4 h-4 mr-2 text-blue-500" />
              Share your wishlist with friends and family
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600">{wishlistBooks.length} book{wishlistBooks.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="flex space-x-2">
          {wishlistBooks.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={shareWishlist}
                className="flex items-center space-x-1"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm" 
                onClick={clearWishlist}
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="space-y-4">
        {wishlistBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex space-x-4">
              {/* Book Cover */}
              <div 
                className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => onBookClick?.(book)}
              >
                {book.cover_image ? (
                  <img 
                    src={book.cover_image} 
                    alt={book.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 
                      className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() => onBookClick?.(book)}
                    >
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                    
                    {/* Rating */}
                    {book.rating && (
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={`${
                                i < Math.floor(book.rating!) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          ({book.rating})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWishlist(book.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">
                      ${book.priceRegions?.USD || book.price}
                    </span>
                    
                    {/* Badges */}
                    <div className="flex space-x-1">
                      {book.isNew && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                      )}
                      {book.isBestseller && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Bestseller</Badge>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    onClick={() => addToCart?.(book)}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Footer */}
      {wishlistBooks.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => wishlistBooks.forEach(book => addToCart?.(book))}
              className="flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add All to Cart</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={shareWishlist}
              className="flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Wishlist</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to add book to wishlist (can be called from other components)
export const addToWishlist = (book: Book) => {
  const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  let wishlist: Book[] = [];
  
  if (savedWishlist) {
    try {
      wishlist = JSON.parse(savedWishlist);
    } catch (error) {
      console.error('Error parsing wishlist:', error);
    }
  }
  
  // Check if book is already in wishlist
  if (!wishlist.find(item => item.id === book.id)) {
    wishlist.push(book);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    // Dispatch custom event to update wishlist count across components
    window.dispatchEvent(new Event('wishlistUpdated'));
    return true; // Added successfully
  }
  
  return false; // Already in wishlist
};

// Helper function to remove book from wishlist
export const removeFromWishlist = (bookId: string) => {
  const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (savedWishlist) {
    try {
      const wishlist = JSON.parse(savedWishlist);
      const updatedWishlist = wishlist.filter((book: Book) => book.id !== bookId);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      // Dispatch custom event to update wishlist count across components
      window.dispatchEvent(new Event('wishlistUpdated'));
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }
  return false;
};

// Helper function to check if book is in wishlist
export const isInWishlist = (bookId: string): boolean => {
  const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (savedWishlist) {
    try {
      const wishlist = JSON.parse(savedWishlist);
      return wishlist.some((book: Book) => book.id === bookId);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  }
  return false;
};

// Helper function to get wishlist count
export const getWishlistCount = (): number => {
  const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (savedWishlist) {
    try {
      const wishlist = JSON.parse(savedWishlist);
      return wishlist.length;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
    }
  }
  return 0;
};