import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Phone, Mail, MapPin, Star, Heart, X, Trash2, Truck, Package, Clock } from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StorefrontData {
  name: string;
  theme: string;
  primaryColor: string;
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
    address?: string;
  };
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    image: string;
    category: string;
  }>;
  storefrontConfigId: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  deliveryType: "local_delivery" | "cod_shipping";
}

interface SearchResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  recentAddress: string | null;
}

export default function PublicStorefront() {
  const { name } = useParams<{ name: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    deliveryType: 'local_delivery'
  });
  
  // Member search states
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [cartNotification, setCartNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  // Fetch storefront data
  const { data: storefrontData, isLoading, error } = useQuery({
    queryKey: ['/api/storefront/public', name],
    enabled: !!name
  });

  // Cart functions
  const addToCart = (product: StorefrontData["products"][0]) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: Math.round((item.quantity + 0.1) * 100) / 100 }
          : item
      ));
      // Show top notification instead of toast
      setCartNotification({
        show: true, 
        message: `Tăng ${product.name} lên ${Math.round((existingItem.quantity + 0.1) * 100) / 100}kg`
      });
      setTimeout(() => setCartNotification({show: false, message: ''}), 3000);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 0.1,
        image: product.image,
        category: product.category
      }]);
      // Show top notification instead of toast
      setCartNotification({
        show: true, 
        message: `Đã thêm ${product.name} - 0.1kg vào giỏ hàng`
      });
      setTimeout(() => setCartNotification({show: false, message: ''}), 3000);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0.01) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }
    
    const roundedQuantity = Math.round(newQuantity * 100) / 100;
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: roundedQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast({
      title: "Đã xóa khỏi giỏ hàng",
      description: "Sản phẩm đã được xóa khỏi giỏ hàng",
    });
  };

  const getCartTotal = () => {
    return Math.round(cart.reduce((total, item) => total + (item.price * item.quantity), 0) * 100) / 100;
  };

  const getCartItemCount = () => {
    return Math.round(cart.reduce((total, item) => total + item.quantity, 0) * 100) / 100;
  };

  // Time-based free shipping logic
  const isFreeShippingTime = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour === 11 || hour === 17;
  };

  const getDeliveryInfo = (deliveryType: string) => {
    const isFreeTime = isFreeShippingTime();
    
    if (deliveryType === 'local_delivery') {
      return {
        title: '🚚 Giao hàng quanh thị trần',
        description: 'Giao hàng trong ngày, khu vực thị trần và lân cận',
        timeInfo: isFreeTime ? '🆓 FREE SHIP hiện tại!' : 'FREE SHIP vào lúc 11:00 và 17:00',
        isFree: isFreeTime,
        estimatedTime: '2-4 giờ'
      };
    } else {
      return {
        title: '📦 Ship COD toàn quốc',
        description: 'Giao hàng toàn quốc, thanh toán khi nhận hàng',
        timeInfo: 'Phí ship theo khoảng cách',
        isFree: false,
        estimatedTime: '1-3 ngày'
      };
    }
  };

  // Customer search functionality
  const searchCustomers = async (phoneDigits: string) => {
    if (phoneDigits.length < 3) {
      setSearchResults([]);
      setSelectedMember(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/customers/search?phone=${phoneDigits}`);
      const results: SearchResult[] = await response.json();
      setSearchResults(results);
      
      // Auto-select if exactly one result
      if (results.length === 1) {
        setSelectedMember(results[0]);
        setCustomerInfo({
          ...customerInfo,
          name: results[0].name,
          email: results[0].email,
          phone: results[0].phone,
          address: results[0].recentAddress || customerInfo.address
        });
      } else if (results.length === 0) {
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSelectedMember(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced phone input handler
  const handlePhoneChange = (value: string) => {
    setCustomerInfo({...customerInfo, phone: value});
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Reset member selection when phone changes
    if (selectedMember && selectedMember.phone !== value) {
      setSelectedMember(null);
      setSearchResults([]);
    }
    
    // Normalize phone to digits only
    const phoneDigits = value.replace(/\D/g, '');
    
    // Set new debounced timer
    const timer = setTimeout(() => {
      if (phoneDigits.length >= 3) {
        searchCustomers(phoneDigits);
      } else {
        setSearchResults([]);
        setSelectedMember(null);
      }
    }, 300);
    
    setSearchDebounceTimer(timer);
  };

  // Create order mutation
  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch(`/api/storefront/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontConfigId: (storefrontData as StorefrontData)?.storefrontConfigId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          customerAddress: orderData.customerAddress,
          deliveryType: orderData.deliveryType,
          notes: orderData.notes,
          items: orderData.items,
          total: orderData.total
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }
      
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Đặt hàng thành công!",
        description: result.message || "Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.",
      });
      setCart([]);
      setIsCheckoutOpen(false);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        deliveryType: 'local_delivery'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đặt hàng",
        description: error.message || "Có lỗi xảy ra khi đặt hàng",
        variant: "destructive",
      });
    }
  });

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Thông tin chưa đầy đủ",
        description: "Vui lòng điền đầy đủ họ tên và số điện thoại",
        variant: "destructive",
      });
      return;
    }

    if (!customerInfo.address) {
      toast({
        title: "Thiếu địa chỉ giao hàng",
        description: "Vui lòng nhập địa chỉ giao hàng để hoàn tất đơn hàng",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      customerAddress: customerInfo.address,
      deliveryType: customerInfo.deliveryType,
      notes: customerInfo.notes,
      items: cart,
      total: getCartTotal()
    };

    orderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-700">Đang tải cửa hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !storefrontData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="text-red-500 mb-4">
              <Heart className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Cửa hàng không tồn tại</h2>
            <p className="text-gray-600">
              Không thể tìm thấy cửa hàng "{name}" hoặc cửa hàng đã ngừng hoạt động.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-green-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-green-800" data-testid="text-storefront-name">
                {(storefrontData as StorefrontData).contactInfo.businessName}
              </h1>
              <p className="text-sm text-green-600">Thực phẩm organic tươi ngon</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                data-testid="button-contact"
              >
                <Phone className="w-4 h-4 mr-1" />
                {(storefrontData as StorefrontData).contactInfo.phone}
              </Button>
              <Button
                onClick={() => setIsCartOpen(!isCartOpen)}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50 relative"
                data-testid="button-cart-toggle"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Giỏ hàng
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-green-600">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-hero-title">
            🌱 Thực phẩm Organic tươi ngon mỗi ngày
          </h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Chúng tôi cung cấp những sản phẩm organic chất lượng cao, 
            an toàn cho sức khỏe và thân thiện với môi trường.
          </p>
        </div>
      </section>

      {/* Cart Notification - Top */}
      {cartNotification.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">{cartNotification.message}</span>
          </div>
        </div>
      )}

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-semibold text-green-800 mb-6" data-testid="text-products-title">
            Sản phẩm nổi bật
          </h3>
          
          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(storefrontData as StorefrontData).products.map((product) => (
              <Card 
                key={product.id}
                className="hover:shadow-lg transition-shadow border-green-100 hover-elevate"
                data-testid={`card-product-${product.id}`}
              >
                <CardContent className="p-4">
                  <div className="aspect-square mb-4 bg-green-50 rounded-lg overflow-hidden">
                    <img
                      src={product.image || '/placeholder-organic.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${product.id}`}
                    />
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className="mb-2 bg-green-100 text-green-800"
                    data-testid={`badge-category-${product.id}`}
                  >
                    {product.category}
                  </Badge>
                  
                  <h4 className="font-semibold text-gray-800 mb-2" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-green-600" data-testid={`text-product-price-${product.id}`}>
                      {parseInt(product.price).toLocaleString('vi-VN')}đ/kg
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm ml-1">4.8</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    data-testid={`button-add-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Thêm vào giỏ hàng
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg lg:max-w-lg">
            <CartContent
              cart={cart}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              getCartTotal={getCartTotal}
              onCheckout={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCheckoutOpen(false)} />
          <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-green-800" data-testid="text-checkout-title">
                Thông tin đặt hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Đơn hàng của bạn</h4>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}kg</span>
                      <span>{Math.round(item.price * item.quantity * 100) / 100}đ</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-green-800">
                    <span>Tổng cộng:</span>
                    <span data-testid="text-checkout-total">
                      {getCartTotal().toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-3">
                {/* Phone Input - Always visible */}
                <div>
                  <Label htmlFor="customerPhone">Số điện thoại *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={customerInfo.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Nhập số điện thoại (3 số cuối để tìm member)"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-testid="input-customer-phone"
                  />
                  {isSearching && (
                    <p className="text-xs text-blue-600 mt-1" data-testid="text-searching">Đang tìm kiếm...</p>
                  )}
                  {selectedMember && (
                    <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm" data-testid="card-member-found">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">★</span>
                            </div>
                            <div>
                              <p className="text-base font-bold text-blue-800">
                                Chào {selectedMember.name}!
                              </p>
                              <p className="text-xs text-blue-600">Thành viên VIP</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">SĐT:</span> {selectedMember.phone}
                            </p>
                            
                            {selectedMember.recentAddress && (
                              <p className="text-xs text-blue-700">
                                <span className="font-medium">Địa chỉ:</span> ...{selectedMember.recentAddress.slice(-20)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {selectedMember.recentAddress && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs ml-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => setIsEditingAddress(!isEditingAddress)}
                            data-testid="button-edit-address"
                          >
                            {isEditingAddress ? "Hủy" : "Sửa địa chỉ"}
                          </Button>
                        )}
                      </div>
                      
                      {!selectedMember.recentAddress && (
                        <p className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded">
                          Chưa có địa chỉ - vui lòng nhập địa chỉ giao hàng bên dưới
                        </p>
                      )}
                    </div>
                  )}
                  {searchResults.length > 1 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200" data-testid="text-multiple-members">
                      <p className="text-sm text-yellow-800">
                        Tìm thấy {searchResults.length} member. Nhập thêm số để chính xác hơn.
                      </p>
                    </div>
                  )}
                  {searchResults.length === 0 && customerInfo.phone.replace(/\D/g, '').length >= 3 && !isSearching && (
                    <div className="mt-2 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 shadow-sm" data-testid="card-new-customer">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-800">
                            Chào mừng khách hàng mới!
                          </p>
                          <p className="text-sm text-emerald-700 mt-1 font-medium">
                            Điền thông tin để trở thành thành viên VIP
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            Tự động tạo tài khoản thành viên sau khi hoàn tất đơn hàng
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name and Phone - Only show for new customers */}
                {(searchResults.length === 0 && customerInfo.phone.replace(/\D/g, '').length >= 3 && !isSearching) && (
                  <>
                    <div>
                      <Label htmlFor="customerName">Họ và tên *</Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Nhập họ và tên"
                        autoComplete="name"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-customer-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Số điện thoại *</Label>
                      <Input
                        id="customerPhoneFull"
                        name="customerPhoneFull"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Nhập số điện thoại đầy đủ"
                        autoComplete="tel"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-customer-phone-full"
                      />
                    </div>
                  </>
                )}

                {/* Address - Show if new customer OR member is editing OR member has no address */}
                {((searchResults.length === 0 && customerInfo.phone.replace(/\D/g, '').length >= 3 && !isSearching) || 
                  (selectedMember && (isEditingAddress || !selectedMember.recentAddress))) && (
                  <div>
                    <Label htmlFor="customerAddress">
                      {selectedMember && selectedMember.recentAddress ? 'Nếu thay đổi địa chỉ vui lòng nhập thêm địa chỉ' : 'Địa chỉ giao hàng *'}
                    </Label>
                    <Textarea
                      id="customerAddress"
                      name="customerAddress"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      placeholder={selectedMember ? "Nhập địa chỉ giao hàng mới" : "Nhập địa chỉ giao hàng"}
                      rows={2}
                      autoComplete="street-address"
                      autoCorrect="off"
                      spellCheck={false}
                      data-testid="input-customer-address"
                    />
                    {selectedMember && isEditingAddress && (
                      <p className="text-xs text-gray-500 mt-1">
                        Địa chỉ cũ: {selectedMember.recentAddress}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="notes"
                    name="orderNotes"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                    placeholder="Ghi chú đặc biệt..."
                    rows={2}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-testid="input-order-notes"
                  />
                </div>
              </div>

              <Separator />

              {/* Delivery Type Selection */}
              <div>
                <Label>Hình thức giao hàng</Label>
                <div className="mt-3 space-y-3">
                  {/* Local Delivery Option */}
                  <div
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all hover-elevate ${
                      customerInfo.deliveryType === 'local_delivery'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setCustomerInfo({...customerInfo, deliveryType: 'local_delivery'})}
                    data-testid="button-delivery-local"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          customerInfo.deliveryType === 'local_delivery'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {customerInfo.deliveryType === 'local_delivery' && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-800">
                            {getDeliveryInfo('local_delivery').title}
                          </span>
                          {getDeliveryInfo('local_delivery').isFree && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1">
                              FREE SHIP
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getDeliveryInfo('local_delivery').description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="w-3 h-3" />
                            <span>Thời gian: {getDeliveryInfo('local_delivery').estimatedTime}</span>
                          </div>
                          <div className={`${
                            getDeliveryInfo('local_delivery').isFree ? 'text-green-600 font-semibold' : 'text-gray-500'
                          }`}>
                            {getDeliveryInfo('local_delivery').timeInfo}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COD Shipping Option */}
                  <div
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all hover-elevate ${
                      customerInfo.deliveryType === 'cod_shipping'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setCustomerInfo({...customerInfo, deliveryType: 'cod_shipping'})}
                    data-testid="button-delivery-cod"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          customerInfo.deliveryType === 'cod_shipping'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {customerInfo.deliveryType === 'cod_shipping' && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-800">
                            {getDeliveryInfo('cod_shipping').title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getDeliveryInfo('cod_shipping').description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Thời gian: {getDeliveryInfo('cod_shipping').estimatedTime}</span>
                          </div>
                          <div className="text-gray-500">
                            {getDeliveryInfo('cod_shipping').timeInfo}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCheckoutOpen(false)}
                data-testid="button-cancel-checkout"
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleCheckout}
                disabled={orderMutation.isPending}
                data-testid="button-submit-order"
              >
                {orderMutation.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Contact Section */}
      <section className="bg-green-600 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4" data-testid="text-contact-title">
              Liên hệ với chúng tôi
            </h3>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span data-testid="text-contact-phone">{(storefrontData as StorefrontData).contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span data-testid="text-contact-email">{(storefrontData as StorefrontData).contactInfo.email}</span>
              </div>
              {(storefrontData as StorefrontData).contactInfo.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span data-testid="text-contact-address">{(storefrontData as StorefrontData).contactInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Widget */}
      <ChatbotWidget 
        pageType="storefront"
        pageContext={{
          storefrontName: (storefrontData as StorefrontData).name,
          products: (storefrontData as StorefrontData).products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category
          })),
          cartItems: cart.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity
          }))
        }}
        onAddToCart={(productId, quantity) => {
          const product = (storefrontData as StorefrontData).products.find(p => p.id === productId);
          if (product) {
            addToCart(product);
          }
        }}
        onCreateOrder={(orderData) => {
          // Convert chatbot order to storefront order format
          setCustomerInfo({
            name: orderData.customerName || '',
            phone: orderData.customerPhone || '',
            email: orderData.customerEmail || '',
            address: orderData.customerAddress || '',
            notes: orderData.notes || '',
            deliveryType: orderData.deliveryType || 'local_delivery'
          });
          
          // Open checkout modal
          setIsCheckoutOpen(true);
        }}
      />
    </div>
  );
}

// Cart component
interface CartContentProps {
  cart: CartItem[];
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
  onCheckout: () => void;
  onClose: () => void;
}

function CartContent({ cart, updateCartQuantity, removeFromCart, getCartTotal, onCheckout, onClose }: CartContentProps) {
  return (
    <Card className="h-full flex flex-col rounded-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-green-100">
        <CardTitle className="text-lg text-green-800">Giỏ hàng</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-cart">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Giỏ hàng trống</p>
            <p className="text-sm text-gray-400">Thêm sản phẩm để bắt đầu mua sắm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="bg-green-50 p-3 rounded-lg" data-testid={`cart-item-${item.productId}`}>
                <div className="flex gap-3 mb-3">
                  <img
                    src={item.image || '/placeholder-organic.jpg'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {item.category}
                    </Badge>
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      {item.price.toLocaleString('vi-VN')}đ/kg
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-remove-${item.productId}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCartQuantity(item.productId, Math.max(0.01, item.quantity - 0.1))}
                    className="h-8 w-8 p-0"
                    data-testid={`button-decrease-${item.productId}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = Math.round((parseFloat(e.target.value) || 0.01) * 100) / 100;
                        updateCartQuantity(item.productId, newQty);
                      }}
                      className="w-16 h-8 text-center text-sm"
                      data-testid={`input-quantity-${item.productId}`}
                    />
                    <span className="text-xs text-gray-500">kg</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 0.1)}
                    className="h-8 w-8 p-0"
                    data-testid={`button-increase-${item.productId}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-600">Thành tiền:</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(item.price * item.quantity * 100) / 100}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {cart.length > 0 && (
        <CardFooter className="border-t border-green-100 p-4">
          <div className="w-full">
            <div className="bg-green-600 text-white p-3 rounded-lg mb-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Tổng cộng:</span>
                <span className="font-bold text-lg" data-testid="text-cart-total">
                  {getCartTotal().toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
            <Button 
              onClick={onCheckout} 
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-checkout"
            >
              Tiến hành đặt hàng
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}