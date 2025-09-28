'use client'

import React from 'react';
import { Star, ShoppingCart, User, Calendar, BookOpen } from 'lucide-react';
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
  // Badge properties
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
}

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onAddToCart: (book: Book) => void;
  className?: string;
}

export function BookCard({ book, onSelect, onAddToCart, className = '' }: BookCardProps) {
  const handleCardClick = () => {
    onSelect(book);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(book);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'fill-gray-200 text-gray-200'
        }`} 
      />
    ));
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-green-200 ${className}`}
    >
      {/* Book Cover */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
        {book.cover_image ? (
          <img 
            src={book.cover_image}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-blue-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.isNew && (
            <Badge className="bg-green-500 text-white text-xs px-2 py-1">Mới</Badge>
          )}
          {book.isBestseller && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-1">Bán chạy</Badge>
          )}
          {book.isRecommended && (
            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">Đề xuất</Badge>
          )}
          {book.isFeatured && (
            <Badge className="bg-purple-500 text-white text-xs px-2 py-1">Nổi bật</Badge>
          )}
        </div>

        {/* Stock status */}
        {book.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Hết hàng
            </span>
          </div>
        )}

        {/* Quick add to cart */}
        {book.stock > 0 && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {book.title}
        </h3>

        {/* Author */}
        <div className="flex items-center gap-1 text-gray-600">
          <User className="h-3 w-3" />
          <span className="text-xs truncate">{book.author}</span>
        </div>

        {/* Publisher & Year */}
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          {book.publisher && (
            <span className="truncate">{book.publisher}</span>
          )}
          {book.publication_year && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{book.publication_year}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {book.rating && (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {renderStars(book.rating)}
            </div>
            <span className="text-xs text-gray-600">({book.rating})</span>
          </div>
        )}

        {/* Price */}
        <div className="pt-2">
          <span className="text-lg font-bold text-green-600">
            {formatVietnamPrice(book.price)}
          </span>
        </div>

        {/* Stock info */}
        <div className="text-xs text-gray-500">
          {book.stock > 0 ? (
            <span>Còn {book.stock} cuốn</span>
          ) : (
            <span className="text-red-500">Hết hàng</span>
          )}
        </div>
      </div>
    </div>
  );
}