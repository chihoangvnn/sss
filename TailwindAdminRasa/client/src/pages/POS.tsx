import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard,
  QrCode,
  User,
  Calculator
} from "lucide-react";
import { CustomerSearchInput } from "@/components/CustomerSearchInput";
import { QRPayment } from "@/components/QRPayment";
import type { Product, Customer, Order } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSProps {}

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

export default function POS({}: POSProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
  });

  // Filter products by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Cart calculations
  const cartTotal = cart.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.status === 'out-of-stock' || product.stock <= 0) {
      toast({
        title: "Hết hàng",
        description: "Sản phẩm này hiện đã hết hàng",
        variant: "destructive",
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Check if we have enough stock
        if (existingItem.quantity >= product.stock) {
          toast({
            title: "Không đủ hàng",
            description: `Chỉ còn ${product.stock} sản phẩm trong kho`,
            variant: "destructive",
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });

    toast({
      title: "Đã thêm vào giỏ",
      description: `${product.name} đã được thêm vào giỏ hàng`,
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = cart.find(item => item.product.id === productId)?.product;
    if (product && newQuantity > product.stock) {
      toast({
        title: "Không đủ hàng",
        description: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        variant: "destructive",
      });
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      setShowPayment(true);
      toast({
        title: "Đơn hàng đã tạo",
        description: `Đơn hàng ${order.id} đã được tạo thành công`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo đơn hàng",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });

  // Process checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerId: selectedCustomer?.id || null,
      total: cartTotal,
      status: 'pending',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
      })),
      source: 'pos', // Mark as POS order
    };

    createOrderMutation.mutate(orderData);
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    clearCart();
    setCurrentOrder(null);
    setShowPayment(false);
    
    toast({
      title: "Thanh toán thành công",
      description: "Đơn hàng đã được thanh toán",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bán Hàng</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartItemCount} sản phẩm
            </Badge>
            <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800">
              <Calculator className="h-4 w-4 mr-2" />
              {formatPrice(cartTotal)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-lg py-3"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image || (product.images && product.images.length > 0) ? (
                          <img
                            src={product.image || product.images![0].secure_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-4xl">📦</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(product.price)}
                          </span>
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {product.status === 'active' ? 'Còn hàng' : 'Hết hàng'}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500">
                          Kho: {product.stock}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Không tìm thấy sản phẩm</p>
                  <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart & Checkout */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Customer Selection */}
          <div className="p-4 border-b">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Khách hàng</label>
              <CustomerSearchInput
                onSelect={setSelectedCustomer}
                placeholder="Tìm khách hàng..."
                className="w-full"
              />
              {selectedCustomer && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  <User className="h-4 w-4" />
                  <span>{selectedCustomer.name}</span>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Giỏ hàng trống</p>
                  <p className="text-sm">Thêm sản phẩm để bắt đầu</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item) => (
                  <Card key={item.product.id} className="p-3">
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.product.image || (item.product.images && item.product.images.length > 0) ? (
                          <img
                            src={item.product.image || item.product.images![0].secure_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400">📦</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.product.name}
                        </h4>
                        <p className="text-blue-600 font-semibold text-sm">
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right mt-2 pt-2 border-t">
                      <span className="font-semibold text-green-600">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Tổng cộng:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {cartItemCount} sản phẩm
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {createOrderMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                </Button>

                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full"
                >
                  Xóa giỏ hàng
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thanh toán đơn hàng</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPayment(false)}
              >
                ✕
              </Button>
            </div>
            
            <QRPayment
              order={currentOrder}
              onPaymentCreated={(payment) => {
                toast({
                  title: "QR thanh toán đã tạo",
                  description: "Vui lòng quét mã QR để thanh toán",
                });
              }}
            />

            <div className="mt-4 flex space-x-2">
              <Button
                onClick={handlePaymentComplete}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Xác nhận đã thanh toán
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPayment(false)}
                className="flex-1"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}