'use client'

import React, { useState } from 'react';
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Plus, Minus, Package, Truck, Book, Globe, Calendar, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnamPrice } from '@/utils/currency';
import { addToWishlist, isInWishlist, removeFromWishlist } from '@/components/WishlistTab';

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

interface CartItem {
  book: Book;
  quantity: number;
}

interface FullProductViewProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (book: Book) => void;
  cart: CartItem[];
  isMobile?: boolean;
}

// Format USD price for US bookstore
const formatUSDPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export function FullProductView({ book, isOpen, onClose, onAddToCart, cart, isMobile = false }: FullProductViewProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isInWishlistState, setIsInWishlistState] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Update wishlist state when book changes
  React.useEffect(() => {
    if (book) {
      setIsInWishlistState(isInWishlist(book.id));
    }
  }, [book]);

  if (!isOpen || !book) return null;

  // Get current quantity in cart
  const cartItem = cart.find(item => item.book.id === book.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < selectedQuantity; i++) {
      onAddToCart(book);
    }
    // Reset quantity selector
    setSelectedQuantity(1);
  };

  const handleWishlistToggle = () => {
    if (isInWishlistState) {
      removeFromWishlist(book.id);
      setIsInWishlistState(false);
    } else {
      addToWishlist(book);
      setIsInWishlistState(true);
    }
    // Dispatch custom event to update wishlist count
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const renderBookBadges = () => {
    const badges = [];
    
    if (book.isNew) {
      badges.push(
        <Badge key="new" className="bg-blue-100 text-blue-800">
          🆕 NEW
        </Badge>
      );
    }
    
    if (book.isBestseller) {
      badges.push(
        <Badge key="bestseller" className="bg-yellow-100 text-yellow-800">
          🏆 BESTSELLER
        </Badge>
      );
    }
    
    if (book.isRecommended) {
      badges.push(
        <Badge key="recommended" className="bg-purple-100 text-purple-800">
          🎩 FEATURED
        </Badge>
      );
    }
    
    if (book.isFeatured) {
      badges.push(
        <Badge key="featured" className="bg-green-100 text-green-800">
          ⭐ POPULAR
        </Badge>
      );
    }
    
    return badges;
  };

  // Use USD pricing for international bookstore
  const displayPrice = book.priceRegions?.USD || book.price;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWishlistToggle}
              className={`p-2 ${isInWishlistState ? 'text-red-500' : 'text-gray-400'}`}
            >
              <Heart className={`h-5 w-5 ${isInWishlistState ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMobile ? 'pb-32' : 'pb-8'}`}>
        {isMobile ? (
          // Mobile Layout - Horizontal Layout
          <div className="p-4">
            <div className="flex gap-4">
              {/* Book Cover - Left Side */}
              <div className="flex-shrink-0 w-32">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                  {book.cover_image ? (
                    <img 
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Book className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs">No cover</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info - Right Side */}
              <div className="flex-1 min-w-0">
                {/* Badges */}
                {renderBookBadges().length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {renderBookBadges()}
                  </div>
                )}
                
                {/* Title */}
                <h1 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                  {book.title}
                </h1>
                
                {/* Author */}
                <p className="text-sm text-gray-600 mb-2">
                  by <span className="font-medium">{book.author}</span>
                </p>
                
                {/* Price & Rating */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl font-bold text-green-600">
                    {formatUSDPrice(displayPrice)}
                  </span>
                  {book.rating && (
                    <div className="flex items-center gap-1">
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
                      <span className="text-xs text-gray-600">({book.rating})</span>
                    </div>
                  )}
                </div>

                {/* ISBN */}
                {book.isbn && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">ISBN</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{book.isbn}</p>
                  </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2 mb-3">
                  <Package className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-xs font-medium text-green-800">Availability:</span>
                    {book.stock > 0 ? (
                      <span className="text-xs text-green-600 ml-1">
                        In Stock ({book.stock})
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 ml-1">Out of Stock</span>
                    )}
                  </div>
                </div>

                {/* Quantity in Cart */}
                {quantityInCart > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <ShoppingCart className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {quantityInCart} in cart
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Controls - Mobile */}
                <div className="space-y-2">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">Qty:</span>
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                        disabled={selectedQuantity <= 1}
                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 py-1 text-xs font-medium min-w-[2rem] text-center">
                        {selectedQuantity}
                      </span>
                      <button
                        onClick={() => setSelectedQuantity(Math.min(book.stock, selectedQuantity + 1))}
                        disabled={selectedQuantity >= book.stock}
                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddToCart}
                      disabled={book.stock === 0}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 h-8 text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleWishlistToggle}
                      className={`h-8 px-2 ${isInWishlistState ? 'border-red-200 text-red-600 hover:bg-red-50' : ''}`}
                    >
                      <Heart className={`h-3 w-3 ${isInWishlistState ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Below - Collapsible */}
            <div className="mt-6 space-y-4">
              {/* Book Details Grid */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Book Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {book.publisher && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Publisher</span>
                      <p className="text-sm font-medium text-gray-900">{book.publisher}</p>
                    </div>
                  )}
                  {book.publication_year && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Year</span>
                      <p className="text-sm font-medium text-gray-900">{book.publication_year}</p>
                    </div>
                  )}
                  {book.pages && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Pages</span>
                      <p className="text-sm font-medium text-gray-900">{book.pages}</p>
                    </div>
                  )}
                  {book.language && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Language</span>
                      <p className="text-sm font-medium text-gray-900">{book.language}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">About This Book</h3>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    <p className={showFullDescription ? '' : 'line-clamp-4'}>
                      {book.description}
                    </p>
                    {book.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="p-0 h-auto mt-2 text-green-600 underline hover:text-green-700 transition-colors"
                      >
                        {showFullDescription ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop Layout - Two Columns
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Column - Book Cover */}
              <div className="flex justify-center">
                <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden max-w-md w-full shadow-xl">
                  {book.cover_image ? (
                    <img 
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Book className="h-24 w-24 mx-auto mb-4" />
                        <p>No cover image</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Book Info */}
              <div className="space-y-8">
                {/* Badges */}
                {renderBookBadges().length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {renderBookBadges()}
                  </div>
                )}

                {/* Title & Author */}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {book.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">
                    by <span className="font-medium text-gray-900">{book.author}</span>
                  </p>
                  
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-bold text-green-600">
                      {formatUSDPrice(displayPrice)}
                    </span>
                    {book.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${
                              i < Math.floor(book.rating!) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'fill-gray-200 text-gray-200'
                            }`} 
                          />
                        ))}
                        <span className="text-lg text-gray-600 ml-2">({book.rating})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Book</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {book.description}
                    </p>
                  </div>
                )}

                {/* Book Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Book Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {book.publisher && (
                      <div>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Publisher</span>
                        <p className="text-lg font-medium text-gray-900">{book.publisher}</p>
                      </div>
                    )}
                    {book.publication_year && (
                      <div>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Publication Year</span>
                        <p className="text-lg font-medium text-gray-900">{book.publication_year}</p>
                      </div>
                    )}
                    {book.pages && (
                      <div>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Pages</span>
                        <p className="text-lg font-medium text-gray-900">{book.pages}</p>
                      </div>
                    )}
                    {book.language && (
                      <div>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Language</span>
                        <p className="text-lg font-medium text-gray-900">{book.language}</p>
                      </div>
                    )}
                  </div>
                  {book.isbn && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500 uppercase tracking-wide">ISBN</span>
                      <p className="text-lg font-medium text-gray-900 font-mono">{book.isbn}</p>
                    </div>
                  )}
                </div>

                {/* Stock & Cart Status */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-green-50 rounded-lg p-4">
                    <Package className="h-6 w-6 text-green-600" />
                    <div>
                      <span className="text-lg font-medium text-green-800">Availability:</span>
                      {book.stock > 0 ? (
                        <span className="text-lg text-green-600 ml-2">
                          In Stock ({book.stock} copies available)
                        </span>
                      ) : (
                        <span className="text-lg text-red-600 ml-2">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  {quantityInCart > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 text-blue-800">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-lg font-medium">
                          {quantityInCart} {quantityInCart === 1 ? 'copy' : 'copies'} in your cart
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Actions - Desktop Only */}
      {!isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    disabled={selectedQuantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-1 text-center min-w-[3rem] font-medium">
                    {selectedQuantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(Math.min(book.stock, selectedQuantity + 1))}
                    disabled={selectedQuantity >= book.stock}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-1">
                <Button
                  onClick={handleAddToCart}
                  disabled={book.stock === 0}
                  className="bg-green-600 hover:bg-green-700 text-white h-10"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add {selectedQuantity > 1 ? `${selectedQuantity} ` : ''}to Cart
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className={`h-10 ${isInWishlistState ? 'border-red-200 text-red-600 hover:bg-red-50' : ''}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isInWishlistState ? 'fill-current' : ''}`} />
                  {isInWishlistState ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}