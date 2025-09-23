import React from 'react';
import { Product } from '@/types';
import { OptimizedImage } from './OptimizedImage';
import { formatPrice, cn } from '@/lib/utils';
import { ShoppingCart, Star, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
  theme?: string;
  primaryColor?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  className = '',
  theme = 'organic',
  primaryColor = '#4ade80',
}: ProductCardProps) {
  const hasStock = product.inventory ? product.inventory.currentStock > 0 : true;
  const isLowStock = product.inventory 
    ? product.inventory.currentStock <= product.inventory.lowStockThreshold 
    : false;

  const handleAddToCart = () => {
    if (onAddToCart && hasStock) {
      onAddToCart(product);
    }
  };

  // Use first image or fallback to the main image field
  const productImage = product.images?.[0]?.secure_url || product.image || '/placeholder-product.jpg';

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group',
        theme === 'modern' && 'shadow-xl hover:shadow-2xl',
        theme === 'elegant' && 'border border-gray-200 hover:border-gray-300',
        className
      )}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <OptimizedImage
          src={productImage}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        
        {/* Stock badges */}
        {!hasStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Hết hàng
            </span>
          </div>
        )}
        
        {isLowStock && hasStock && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Sắp hết
            </span>
          </div>
        )}

        {/* Quick add to cart overlay */}
        {hasStock && onAddToCart && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={handleAddToCart}
              className="bg-white text-gray-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:shadow-lg"
              style={{ 
                backgroundColor: primaryColor,
                color: 'white'
              }}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span 
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">(4.8)</span>
          </div>
        </div>

        {/* Stock info */}
        {product.inventory && (
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Còn {product.inventory.currentStock} sản phẩm
            </span>
          </div>
        )}

        {/* Add to cart button */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={!hasStock}
            className={cn(
              'w-full py-2 px-4 rounded-lg font-medium text-white transition-colors duration-200',
              hasStock
                ? 'hover:opacity-90 active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            )}
            style={{
              backgroundColor: hasStock ? primaryColor : undefined,
            }}
          >
            {hasStock ? (
              <span className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Thêm vào giỏ
              </span>
            ) : (
              'Hết hàng'
            )}
          </button>
        )}
      </div>
    </div>
  );
}