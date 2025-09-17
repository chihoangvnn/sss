import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LandingPageSettings {
  id?: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  heroText?: string;
  isActive: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    zalo?: string;
  };
}

interface LandingPageProduct {
  id: string;
  productId: string;
  variantId?: string;
  displayOrder: number;
  isActive: boolean;
  showPrice: boolean;
  showStock: boolean;
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  product: any;
  variant?: any;
  inventory?: any;
  availableStock: number;
  displayPrice: number;
  displayName: string;
  displayDescription: string;
  displayImage?: string;
}

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export default function LandingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch landing page settings
  const { data: settings } = useQuery<LandingPageSettings>({
    queryKey: ['/api/product-landing-pages', 'settings'],
    queryFn: () => fetch('/api/product-landing-pages').then(res => res.json()).then(data => data[0] || {}),
    enabled: false, // Disable for now since this page is for public view
  });

  // Fetch landing page products
  const { data: products = [], isLoading } = useQuery<LandingPageProduct[]>({
    queryKey: ['/api/product-landing-pages', 'products'],
    queryFn: () => fetch('/api/product-landing-pages').then(res => res.json()),
  });

  // Cart functions
  const addToCart = (product: LandingPageProduct) => {
    const existingItem = cart.find(item => 
      item.productId === product.productId && 
      item.variantId === product.variantId
    );

    if (existingItem) {
      if (existingItem.quantity < product.availableStock) {
        setCart(cart.map(item =>
          item.productId === product.productId && item.variantId === product.variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        toast({
          title: "Đã thêm vào giỏ hàng",
          description: `Tăng số lượng ${product.displayName}`,
        });
      } else {
        toast({
          title: "Không đủ hàng",
          description: `Chỉ còn ${product.availableStock} sản phẩm`,
          variant: "destructive",
        });
      }
    } else {
      setCart([...cart, {
        productId: product.productId,
        variantId: product.variantId,
        name: product.displayName,
        price: product.displayPrice,
        quantity: 1,
        maxStock: product.availableStock
      }]);
      toast({
        title: "Đã thêm vào giỏ hàng",
        description: product.displayName,
      });
    }
  };

  const updateCartQuantity = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
      ));
    } else {
      setCart(cart.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Order submission mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        throw new Error("Failed to create order");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đặt hàng thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.",
      });
      setCart([]);
      setIsCheckoutOpen(false);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi đặt hàng",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên và số điện thoại.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerInfo,
      items: cart,
      total: getCartTotal(),
      source: 'landing_page'
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header với giỏ hàng */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {settings?.title || "Cửa hàng Online"}
              </h1>
              {settings?.subtitle && (
                <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
              )}
            </div>

            <Button
              onClick={() => setIsCartOpen(!isCartOpen)}
              variant="outline"
              size="sm"
              className="relative"
              data-testid="button-cart-toggle"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Giỏ hàng
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {getCartItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {settings?.heroText && (
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              {settings.heroText}
            </h2>
            {settings.subtitle && (
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                {settings.subtitle}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
            Sản phẩm nổi bật
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                {product.displayImage && (
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={product.displayImage}
                      alt={product.displayName}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${product.id}`}
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">
                    {product.displayName}
                  </CardTitle>
                  {product.displayDescription && (
                    <CardDescription className="line-clamp-3">
                      {product.displayDescription}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mb-3">
                    {product.showPrice && (
                      <span className="text-xl font-bold text-primary">
                        {product.displayPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    {product.showStock && (
                      <Badge variant={product.availableStock > 0 ? "default" : "destructive"}>
                        {product.availableStock > 0 ? `Còn ${product.availableStock}` : "Hết hàng"}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.availableStock <= 0}
                    className="w-full"
                    data-testid={`button-add-cart-${product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Thêm vào giỏ
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có sản phẩm nào được thiết lập.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      {settings?.contactInfo && (
        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
              Liên hệ với chúng tôi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {settings.contactInfo.phone && (
                <div className="text-center">
                  <Phone className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Điện thoại</h3>
                  <p className="text-muted-foreground">{settings.contactInfo.phone}</p>
                </div>
              )}

              {settings.contactInfo.email && (
                <div className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">{settings.contactInfo.email}</p>
                </div>
              )}

              {settings.contactInfo.address && (
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Địa chỉ</h3>
                  <p className="text-muted-foreground">{settings.contactInfo.address}</p>
                </div>
              )}
            </div>

            {/* Social Links */}
            {settings.socialLinks && (
              <div className="flex justify-center space-x-4 mt-8">
                {settings.socialLinks.facebook && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {settings.socialLinks.instagram && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-lg">
            <CartContent
              cart={cart}
              updateCartQuantity={updateCartQuantity}
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

      {/* Desktop Cart */}
      <div className="hidden lg:block">
        {isCartOpen && (
          <div className="fixed right-4 top-20 w-96 z-40">
            <CartContent
              cart={cart}
              updateCartQuantity={updateCartQuantity}
              getCartTotal={getCartTotal}
              onCheckout={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCheckoutOpen(false)} />
          <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Thông tin đặt hàng</CardTitle>
              <CardDescription>
                Vui lòng nhập thông tin để hoàn tất đặt hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Họ tên *</label>
                <Input
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Nhập họ tên"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Số điện thoại *</label>
                <Input
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  data-testid="input-customer-phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="Nhập email (không bắt buộc)"
                  data-testid="input-customer-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Địa chỉ</label>
                <Textarea
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Nhập địa chỉ giao hàng"
                  data-testid="textarea-customer-address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ghi chú</label>
                <Textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="Ghi chú thêm (không bắt buộc)"
                  data-testid="textarea-customer-notes"
                />
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-medium">Tổng cộng: {getCartTotal().toLocaleString('vi-VN')}đ</p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
                data-testid="button-cancel-order"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? "Đang xử lý..." : "Đặt hàng"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Cart component
interface CartContentProps {
  cart: CartItem[];
  updateCartQuantity: (productId: string, variantId: string | undefined, newQuantity: number) => void;
  getCartTotal: () => number;
  onCheckout: () => void;
  onClose: () => void;
}

function CartContent({ cart, updateCartQuantity, getCartTotal, onCheckout, onClose }: CartContentProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Giỏ hàng</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-cart">
          ✕
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Giỏ hàng trống
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex justify-between items-center p-3 border rounded">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                    data-testid={`button-decrease-${item.productId}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    data-testid={`button-increase-${item.productId}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {cart.length > 0 && (
        <CardFooter className="border-t pt-4">
          <div className="w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Tổng cộng:</span>
              <span className="font-bold text-lg">{getCartTotal().toLocaleString('vi-VN')}đ</span>
            </div>
            <Button 
              onClick={onCheckout} 
              className="w-full"
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