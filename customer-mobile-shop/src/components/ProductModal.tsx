'use client'

import React from 'react';
import { X, Plus, Minus, Star, ShoppingCart, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  // Badge properties
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
}

interface CartItem {
  book: Book;
  quantity: number;
}

interface BookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (book: Book) => void;
  cart: CartItem[];
}

export function BookModal({ book, isOpen, onClose, onAddToCart, cart }: BookModalProps) {
  if (!isOpen || !book) return null;

  // Get current quantity in cart
  const cartItem = cart.find(item => item.book.id === book.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    onAddToCart(book);
  };


  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Book Details</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Book Cover */}
            <div className="aspect-[3/4] bg-gray-100 relative max-w-md mx-auto">
              {book.cover_image ? (
                <img 
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Store className="h-16 w-16 mx-auto mb-2" />
                    <p className="text-sm">No cover image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="p-6 space-y-4">
              {/* Title & Author */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600 mb-3">
                  Author: <span className="font-medium">{book.author}</span>
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {formatVietnamPrice(book.price)}
                  </span>
                  {book.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < Math.floor(book.rating!) 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'fill-gray-200 text-gray-200'
                          }`} 
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">({book.rating})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
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
                {book.isbn && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">ISBN</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{book.isbn}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Book Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}


              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Availability:</span>
                {book.stock > 0 ? (
                  <span className="text-sm text-green-600 font-medium">
                    In Stock ({book.stock} copies)
                  </span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Quantity in Cart */}
              {quantityInCart > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {quantityInCart} books in cart
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={book.stock === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}