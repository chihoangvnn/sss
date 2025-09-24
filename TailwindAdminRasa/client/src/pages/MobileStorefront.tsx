import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, Heart, ArrowLeft, Plus, Minus, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ChatbotWidget from '@/components/ChatbotWidget';

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

// We'll use real categories from API and limit to top 2-3

function MobileStorefront() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

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

  // Fetch real categories and limit to top 2-3 for simplified experience
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });
  
  // Create simplified category list with real IDs (limit to 2-3 categories)
  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🛍️' },
    ...allCategories.slice(0, 2).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: getCategoryIcon(cat.name)
    }))
  ];
  
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => 
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = products
    .filter(product => product.status === 'active' && product.stock > 0)
    .slice(0, 20); // Limit to 20 products for better mobile performance

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
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id 
                ? 'bg-green-500 hover:bg-green-600 text-white rounded-full px-4 whitespace-nowrap flex items-center gap-1' 
                : 'text-gray-600 rounded-full px-4 whitespace-nowrap flex items-center gap-1'
              }
            >
              <span>{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid - Reference Design Match */}
      <div className="p-4 pb-32">
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Product Info - Left Side */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                    {product.name}
                  </h3>
                  {product.short_description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 mb-2">
                      {product.short_description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600">
                      {product.price.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-xs text-gray-500">Còn {product.stock}</span>
                  </div>
                </div>
                
                {/* Image + Add Button - Right Side */}
                <div className="flex flex-col items-center gap-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/80/80';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  <Button
                    onClick={() => addToCart(product)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 p-0 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
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

      {/* Improved Bottom Cart + Chatbot */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl z-50">
        {getTotalItems() > 0 && (
          <div className="p-4 pb-2">
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-4 font-semibold text-lg shadow-lg"
              onClick={() => setShowCart(true)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-3">
                  <div className="bg-white text-green-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </div>
                  Xem giỏ hàng
                </span>
                <span className="font-bold text-xl">
                  {getTotalPrice().toLocaleString('vi-VN')}₫
                </span>
              </div>
            </Button>
          </div>
        )}
        
        {/* Chatbot Button */}
        <div className="absolute bottom-4 right-4">
          <ChatbotWidget 
            pageType="storefront"
            pageContext={{
              products: filteredProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price.toString(),
                category: selectedCategory
              })),
              cartItems: cart.map(item => ({
                productId: item.product.id,
                name: item.product.name,
                quantity: item.quantity
              }))
            }}
            onAddToCart={(productId, quantity) => {
              const product = filteredProducts.find(p => p.id === productId);
              if (product) {
                for(let i = 0; i < quantity; i++) {
                  addToCart(product);
                }
              }
            }}
          />
        </div>
      </div>
      
      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Giỏ hàng ({getTotalItems()} sản phẩm)</h2>
              <Button variant="ghost" onClick={() => setShowCart(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {item.product.image && (
                    <img 
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-green-600 font-bold">
                      {item.product.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-green-600">
                  {getTotalPrice().toLocaleString('vi-VN')}₫
                </span>
              </div>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold">
                Đặt hàng ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileStorefront;