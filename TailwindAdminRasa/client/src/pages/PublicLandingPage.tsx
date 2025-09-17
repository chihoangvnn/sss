import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Check, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Shield,
  Truck,
  CreditCard
} from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";

interface OrderFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  quantity: number;
  paymentMethod: 'cod' | 'bank_transfer' | 'online';
  notes: string;
}

export default function PublicLandingPage() {
  const { slug } = useParams();
  const { toast } = useToast();

  const [orderForm, setOrderForm] = useState<OrderFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    quantity: 1,
    paymentMethod: 'cod',
    notes: ""
  });

  const [showOrderForm, setShowOrderForm] = useState(false);

  // Fetch landing page data
  const { data: landingPage, isLoading, error } = useQuery<any>({
    queryKey: ['/api/public-landing', slug],
  });

  // Create order mutation
  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/landing-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Đặt hàng thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
      });
      setShowOrderForm(false);
      setOrderForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        quantity: 1,
        paymentMethod: 'cod',
        notes: ""
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đặt hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleOrder = () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        variant: "destructive",
      });
      return;
    }

    const totalPrice = (landingPage.finalPrice || 0) * orderForm.quantity;

    const orderData = {
      landingPageId: landingPage.id,
      customerInfo: {
        name: orderForm.name,
        phone: orderForm.phone,
        email: orderForm.email,
        address: orderForm.address,
      },
      productInfo: {
        productId: landingPage.productId,
        variantId: landingPage.variantId,
        quantity: orderForm.quantity,
        unitPrice: landingPage.finalPrice,
        totalPrice: totalPrice,
      },
      paymentMethod: orderForm.paymentMethod,
      notes: orderForm.notes,
    };

    orderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy trang</h1>
          <p className="text-muted-foreground">Trang landing page không tồn tại hoặc đã bị tắt.</p>
        </div>
      </div>
    );
  }

  const finalPrice = landingPage.finalPrice || 0;
  const originalPrice = landingPage.originalPrice;
  const hasDiscount = originalPrice && originalPrice > finalPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              {landingPage.contactInfo?.businessName && (
                <h1 className="text-xl font-bold">{landingPage.contactInfo.businessName}</h1>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              {landingPage.contactInfo?.phone && (
                <a href={`tel:${landingPage.contactInfo.phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  {landingPage.contactInfo.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {landingPage.heroTitle || landingPage.title}
              </h1>
              {landingPage.heroSubtitle && (
                <p className="text-xl text-muted-foreground mb-8">
                  {landingPage.heroSubtitle}
                </p>
              )}
              
              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-primary">
                    {finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-2xl text-muted-foreground line-through">
                        {originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <Badge variant="destructive" className="text-lg px-3 py-1">
                        -{discountPercent}%
                      </Badge>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Tiết kiệm: {(originalPrice - finalPrice).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>

              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => setShowOrderForm(true)}
                data-testid="button-order-now"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {landingPage.callToAction || "Đặt hàng ngay"}
              </Button>
            </div>

            <div>
              {landingPage.displayImage && (
                <img
                  src={landingPage.displayImage}
                  alt={landingPage.displayName}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {landingPage.features && landingPage.features.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Điểm nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {landingPage.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {landingPage.testimonials && landingPage.testimonials.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Khách hàng nói gì</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {landingPage.testimonials.map((testimonial: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      {testimonial.avatar && (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.customerName}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.customerName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Giao hàng tận nơi</h3>
              <p className="text-muted-foreground">Giao hàng toàn quốc, nhanh chóng</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Bảo hành chính hãng</h3>
              <p className="text-muted-foreground">Cam kết chất lượng 100%</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Đa dạng thanh toán</h3>
              <p className="text-muted-foreground">COD, chuyển khoản, online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Liên hệ ngay để được tư vấn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {landingPage.contactInfo?.phone && (
                  <div className="flex items-center justify-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a 
                      href={`tel:${landingPage.contactInfo.phone}`}
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      {landingPage.contactInfo.phone}
                    </a>
                  </div>
                )}
                {landingPage.contactInfo?.email && (
                  <div className="flex items-center justify-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a 
                      href={`mailto:${landingPage.contactInfo.email}`}
                      className="text-primary hover:underline"
                    >
                      {landingPage.contactInfo.email}
                    </a>
                  </div>
                )}
              </div>
              <Separator className="my-6" />
              <div className="text-center">
                <Button 
                  size="lg" 
                  onClick={() => setShowOrderForm(true)}
                  className="text-lg px-8 py-4"
                  data-testid="button-order-contact"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {landingPage.callToAction || "Đặt hàng ngay"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">Đặt hàng: {landingPage.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{landingPage.displayName}</h3>
                    <p className="text-muted-foreground text-sm">
                      {landingPage.displayDescription}
                    </p>
                  </div>
                  {landingPage.displayImage && (
                    <img
                      src={landingPage.displayImage}
                      alt={landingPage.displayName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label>Số lượng:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderForm(prev => ({ 
                          ...prev, 
                          quantity: Math.max(1, prev.quantity - 1) 
                        }))}
                        data-testid="button-decrease-quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{orderForm.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderForm(prev => ({ 
                          ...prev, 
                          quantity: prev.quantity + 1 
                        }))}
                        data-testid="button-increase-quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {(finalPrice * orderForm.quantity).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin khách hàng</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderName">Họ và tên *</Label>
                    <Input
                      id="orderName"
                      value={orderForm.name}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      data-testid="input-order-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orderPhone">Số điện thoại *</Label>
                    <Input
                      id="orderPhone"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="0123456789"
                      data-testid="input-order-phone"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orderEmail">Email</Label>
                  <Input
                    id="orderEmail"
                    type="email"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    data-testid="input-order-email"
                  />
                </div>

                <div>
                  <Label htmlFor="orderAddress">Địa chỉ giao hàng *</Label>
                  <Textarea
                    id="orderAddress"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Số nhà, đường, phường, quận, thành phố"
                    rows={3}
                    data-testid="input-order-address"
                  />
                </div>

                <div>
                  <Label htmlFor="orderNotes">Ghi chú (không bắt buộc)</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi chú thêm về đơn hàng..."
                    rows={2}
                    data-testid="input-order-notes"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Phương thức thanh toán</h3>
                <div className="space-y-3">
                  {landingPage.paymentMethods?.cod && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={orderForm.paymentMethod === 'cod'}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        data-testid="radio-payment-cod"
                      />
                      <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                    </div>
                  )}
                  {landingPage.paymentMethods?.bankTransfer && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="bank_transfer"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={orderForm.paymentMethod === 'bank_transfer'}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        data-testid="radio-payment-bank"
                      />
                      <Label htmlFor="bank_transfer">Chuyển khoản ngân hàng</Label>
                    </div>
                  )}
                  {landingPage.paymentMethods?.online && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="online"
                        name="paymentMethod"
                        value="online"
                        checked={orderForm.paymentMethod === 'online'}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        data-testid="radio-payment-online"
                      />
                      <Label htmlFor="online">Thanh toán online</Label>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1"
                  data-testid="button-cancel-order"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleOrder}
                  disabled={orderMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-order"
                >
                  {orderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget 
        pageType="landing_page"
        pageContext={{
          featuredProduct: landingPage?.product ? {
            id: landingPage.product.id,
            name: landingPage.product.name,
            price: landingPage.product.price,
            description: landingPage.product.description
          } : undefined
        }}
        onAddToCart={(productId, quantity) => {
          // For landing page, add to order form directly
          setOrderForm(prev => ({
            ...prev,
            quantity: quantity
          }));
          setShowOrderForm(true);
        }}
        onCreateOrder={(orderData) => {
          // Convert chatbot order to landing page order format
          setOrderForm({
            name: orderData.customerName || '',
            phone: orderData.customerPhone || '',
            email: orderData.customerEmail || '',
            address: orderData.customerAddress || '',
            quantity: orderData.quantity || 1,
            paymentMethod: orderData.paymentMethod || 'cod',
            notes: orderData.notes || ''
          });
          setShowOrderForm(true);
        }}
      />
    </div>
  );
}