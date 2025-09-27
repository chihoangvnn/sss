'use client'

import React from 'react';
import { X, Plus, Minus, Star, ShoppingCart, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVietnamPrice } from '@/utils/currency';

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
  // Badge properties
  isNew?: boolean;
  isTopseller?: boolean;
  isFreeshipping?: boolean;
  isBestseller?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  cart: CartItem[];
}

export function ProductModal({ product, isOpen, onClose, onAddToCart, cart }: ProductModalProps) {
  if (!isOpen || !product) return null;

  // Get current quantity in cart
  const cartItem = cart.find(item => item.product.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const formatBenefits = (benefits: string | string[] | undefined) => {
    if (!benefits) return [];
    if (typeof benefits === 'string') {
      return benefits.split(',').map(b => b.trim()).filter(b => b.length > 0);
    }
    return benefits;
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
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết sản phẩm</h2>
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
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 relative">
              {product.image ? (
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Store className="h-20 w-20" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 space-y-4">
              {/* Name & Price */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {formatVietnamPrice(product.price)}
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
              {product.short_description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.short_description}
                  </p>
                </div>
              )}

              {/* Benefits */}
              {product.benefits && formatBenefits(product.benefits).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Công dụng</h3>
                  <ul className="space-y-1">
                    {formatBenefits(product.benefits).map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
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
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600 font-medium">
                    Còn hàng ({product.stock} sản phẩm)
                  </span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">Hết hàng</span>
                )}
              </div>

              {/* Quantity in Cart */}
              {quantityInCart > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Đã có {quantityInCart} sản phẩm trong giỏ hàng
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
                Đóng
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm vào giỏ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}