import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, Heart, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category_id: string;
  stock: number;
  short_description?: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

function MobileStorefront() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['mobile-products', selectedCategory, searchQuery],
    queryFn: async () => {
      let url = '/api/products?limit=50';
      if (selectedCategory !== 'all') {
        url += `&categoryId=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = products.filter(product => 
    product.status === 'active' && product.stock > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white sticky top-0 z-50 border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <h1 className="text-lg font-bold text-gray-900">NHANGSACH.NET</h1>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-gray-600" />
              <User className="h-5 w-5 text-gray-600" />
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-xs flex items-center justify-center p-0">
                    {getTotalItems()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' 
              ? 'bg-green-500 hover:bg-green-600 text-white rounded-full px-4 whitespace-nowrap' 
              : 'text-gray-600 rounded-full px-4 whitespace-nowrap'
            }
          >
            Tất cả
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id 
                ? 'bg-green-500 hover:bg-green-600 text-white rounded-full px-4 whitespace-nowrap' 
                : 'text-gray-600 rounded-full px-4 whitespace-nowrap'
              }
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 pb-24">
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">
                    {product.name}
                  </h3>
                  {product.short_description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {product.short_description}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="text-lg font-bold text-green-600">
                      {product.price.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/64/64';
                      }}
                    />
                  )}
                  <Button
                    onClick={() => addToCart(product)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Bottom Cart */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-3 font-medium"
            onClick={() => {
              // Navigate to cart page (implement later)
              console.log('Navigate to cart:', cart);
            }}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <div className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-sm font-bold">{getTotalItems()}</span>
                </div>
                Xem giỏ hàng
              </span>
              <span className="font-bold">
                {getTotalPrice().toLocaleString('vi-VN')}₫
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

export default MobileStorefront;