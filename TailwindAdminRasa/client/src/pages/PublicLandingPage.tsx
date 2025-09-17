import { useState, useEffect, useMemo } from "react";
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
  CreditCard,
  Clock,
  Users,
  Heart,
  Zap,
  Award,
  Lock,
  Eye,
  TrendingUp
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
  const [viewersCount, setViewersCount] = useState(Math.floor(Math.random() * 20) + 5);
  const [recentPurchases, setRecentPurchases] = useState([
    "Anh Minh vừa mua 2 phút trước",
    "Chị Hương vừa mua 5 phút trước",
    "Anh Nam vừa mua 8 phút trước"
  ]);
  
  // Simulate dynamic viewers count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount(prev => Math.max(3, prev + Math.floor(Math.random() * 3) - 1));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Extract theme and color customization
  const isDarkTheme = landingPage.theme === 'dark';
  const primaryColor = landingPage.primaryColor || '#007bff';
  
  // Memoized color info calculation for performance
  const colorInfo = useMemo(() => {
    // Enhanced color normalization that handles all formats: hex, rgb(), hsl(), named colors
    const normalizeColor = (color: string) => {
      try {
        // Handle hex colors directly (most common case)
        if (color.startsWith('#')) {
          let hex = color.toLowerCase();
          // Handle shorthand hex (#abc -> #aabbcc)
          if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
          }
          
          if (hex.length === 7) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            // Validate RGB values
            if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
              return {
                hex,
                rgb: `${r}, ${g}, ${b}`
              };
            }
          }
        }
        
        // Handle rgb() format directly
        const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 10);
          const g = parseInt(rgbMatch[2], 10);
          const b = parseInt(rgbMatch[3], 10);
          
          if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            // Convert RGB to hex
            const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
            return {
              hex,
              rgb: `${r}, ${g}, ${b}`
            };
          }
        }
        
        // Use canvas to normalize named colors, hsl(), and other complex formats
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return { hex: '#007bff', rgb: '0, 123, 255' };
        
        // Clear and set the color - canvas will normalize it
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        const normalizedColor = context.fillStyle;
        
        // Parse canvas-normalized "rgb(r, g, b)" string format
        const canvasRgbMatch = normalizedColor.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (canvasRgbMatch) {
          const r = parseInt(canvasRgbMatch[1], 10);
          const g = parseInt(canvasRgbMatch[2], 10);
          const b = parseInt(canvasRgbMatch[3], 10);
          
          if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            // Convert RGB to hex
            const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
            return {
              hex,
              rgb: `${r}, ${g}, ${b}`
            };
          }
        }
        
        // Handle if canvas returns hex (for some browsers/inputs)
        if (normalizedColor.startsWith('#')) {
          let hex = normalizedColor.toLowerCase();
          if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
          }
          
          if (hex.length === 7) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
              return {
                hex,
                rgb: `${r}, ${g}, ${b}`
              };
            }
          }
        }
        
        // Final fallback to default blue if all parsing failed
        return { hex: '#007bff', rgb: '0, 123, 255' };
      } catch (error) {
        // Fallback to default blue on any error
        return { hex: '#007bff', rgb: '0, 123, 255' };
      }
    };
    
    return normalizeColor(primaryColor);
  }, [primaryColor]);
  
  // Generate CSS custom properties for dynamic theming
  const themeStyles = useMemo(() => ({
    '--theme-primary': colorInfo.hex,
    '--theme-primary-rgb': colorInfo.rgb,
    '--theme-primary-light': `rgba(${colorInfo.rgb}, 0.1)`,
    '--theme-primary-lighter': `rgba(${colorInfo.rgb}, 0.05)`,
    '--theme-primary-dark': `rgba(${colorInfo.rgb}, 0.9)`,
  } as React.CSSProperties), [colorInfo]);

  // Theme-aware CSS classes
  const themeClasses = useMemo(() => ({
    background: isDarkTheme ? 'bg-gray-900 text-white' : 'bg-background',
    card: isDarkTheme ? 'bg-gray-800 text-white' : 'bg-card',
    header: isDarkTheme ? 'bg-gray-800/95 border-gray-700' : 'bg-card/95 border-border',
    socialProof: isDarkTheme 
      ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700' 
      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
    textMuted: isDarkTheme ? 'text-gray-300' : 'text-muted-foreground',
  }), [isDarkTheme]);
  
  // Dynamic hero gradient style - brand-aware for both light and dark themes
  const heroGradientStyle = useMemo(() => {
    if (isDarkTheme) {
      // Dark theme: Use brand colors exclusively, no fixed gray colors
      return { 
        background: `linear-gradient(to right, var(--theme-primary-dark), rgba(${colorInfo.rgb}, 0.25), var(--theme-primary-light))` 
      };
    } else {
      // Light theme: Use lighter brand color variants
      return { 
        background: `linear-gradient(to right, var(--theme-primary-lighter), var(--theme-primary-light))` 
      };
    }
  }, [isDarkTheme, colorInfo.rgb]);

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}
      style={themeStyles}
    >
      {/* Mobile-First Sticky Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-sm transition-colors duration-300 ${themeClasses.header}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              {landingPage.contactInfo?.businessName && (
                <h1 className="text-xl font-bold">{landingPage.contactInfo.businessName}</h1>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-sm">
              {/* Live Viewers Count */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3 text-green-500 animate-pulse" />
                <span className="font-medium text-green-600">{viewersCount}</span>
                <span className="hidden sm:inline">đang xem</span>
              </div>
              {landingPage.contactInfo?.phone && (
                <a href={`tel:${landingPage.contactInfo.phone}`} className="flex items-center gap-2 transition-colors duration-300" style={{color: 'var(--theme-primary)'}}>
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">{landingPage.contactInfo.phone}</span>
                  <span className="sm:hidden">Gọi</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-12 transition-colors duration-300" 
        style={heroGradientStyle}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {landingPage.heroTitle || landingPage.title}
              </h1>
              {landingPage.heroSubtitle && (
                <p className={`text-xl mb-8 transition-colors duration-300 ${themeClasses.textMuted}`}>
                  {landingPage.heroSubtitle}
                </p>
              )}
              
              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold transition-colors duration-300" style={{color: 'var(--theme-primary)'}}>
                    {finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                  {hasDiscount && (
                    <>
                      <span className={`text-2xl line-through transition-colors duration-300 ${themeClasses.textMuted}`}>
                        {originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <Badge variant="destructive" className="text-lg px-3 py-1">
                        -{discountPercent}%
                      </Badge>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <p className={`text-sm mt-2 transition-colors duration-300 ${themeClasses.textMuted}`}>
                    Tiết kiệm: {(originalPrice - finalPrice).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>

              <Button 
                size="lg" 
                className="text-lg px-8 py-4 transition-colors duration-300"
                style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
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

      {/* Social Proof & Urgency Strip */}
      <section className={`py-4 border-y transition-colors duration-300 ${themeClasses.socialProof}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Recent Purchases */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className={`text-sm font-semibold transition-colors duration-300 ${isDarkTheme ? 'text-green-300' : 'text-green-800'}`}>🔥 Hoạt động gần đây:</span>
              <div className={`flex flex-col md:flex-row gap-1 md:gap-2 text-xs transition-colors duration-300 ${isDarkTheme ? 'text-green-400' : 'text-green-700'}`}>
                {recentPurchases.slice(0, 2).map((purchase, i) => (
                  <span key={i} className="flex items-center gap-1">
                    • {purchase} <Badge variant="outline" className="text-xs ml-1">✅</Badge>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Urgency Timer */}
            <div className={`flex items-center gap-2 transition-colors duration-300 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">⏰ Còn {Math.floor(Math.random() * 12) + 1}h!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {landingPage.features && landingPage.features.length > 0 && (
        <section className={`py-16 transition-colors duration-300 ${themeClasses.card}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Điểm nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {landingPage.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300" style={{backgroundColor: 'var(--theme-primary)'}}>
                      <Check className="h-4 w-4 text-white" />
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
                <Card key={index} className={`transition-colors duration-300 ${themeClasses.card}`}>
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
                    <p className={`mb-4 transition-colors duration-300 ${themeClasses.textMuted}`}>"{testimonial.content}"</p>
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
      <section className={`py-12 transition-colors duration-300 ${themeClasses.card}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300" style={{backgroundColor: 'var(--theme-primary-light)'}}>
                <Truck className="h-8 w-8 transition-colors duration-300" style={{color: 'var(--theme-primary)'}} />
              </div>
              <h3 className="font-semibold mb-2">Giao hàng tận nơi</h3>
              <p className={`transition-colors duration-300 ${themeClasses.textMuted}`}>Giao hàng toàn quốc, nhanh chóng</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300" style={{backgroundColor: 'var(--theme-primary-light)'}}>
                <Shield className="h-8 w-8 transition-colors duration-300" style={{color: 'var(--theme-primary)'}} />
              </div>
              <h3 className="font-semibold mb-2">Bảo hành chính hãng</h3>
              <p className={`transition-colors duration-300 ${themeClasses.textMuted}`}>Cam kết chất lượng 100%</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300" style={{backgroundColor: 'var(--theme-primary-light)'}}>
                <CreditCard className="h-8 w-8 transition-colors duration-300" style={{color: 'var(--theme-primary)'}} />
              </div>
              <h3 className="font-semibold mb-2">Đa dạng thanh toán</h3>
              <p className={`transition-colors duration-300 ${themeClasses.textMuted}`}>COD, chuyển khoản, online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className={`max-w-2xl mx-auto transition-colors duration-300 ${themeClasses.card}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Liên hệ ngay để được tư vấn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {landingPage.contactInfo?.phone && (
                  <div className="flex items-center justify-center gap-3">
                    <Phone className="h-5 w-5 transition-colors duration-300" style={{color: 'var(--theme-primary)'}} />
                    <a 
                      href={`tel:${landingPage.contactInfo.phone}`}
                      className="text-lg font-semibold hover:underline transition-colors duration-300"
                      style={{color: 'var(--theme-primary)'}}
                    >
                      {landingPage.contactInfo.phone}
                    </a>
                  </div>
                )}
                {landingPage.contactInfo?.email && (
                  <div className="flex items-center justify-center gap-3">
                    <Mail className="h-5 w-5 transition-colors duration-300" style={{color: 'var(--theme-primary)'}} />
                    <a 
                      href={`mailto:${landingPage.contactInfo.email}`}
                      className="hover:underline transition-colors duration-300"
                      style={{color: 'var(--theme-primary)'}}
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
                  className="text-lg px-8 py-4 transition-colors duration-300"
                  style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
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
          <Card className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${themeClasses.card}`}>
            <CardHeader>
              <CardTitle className="text-xl">Đặt hàng: {landingPage.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Summary */}
              <div className={`p-4 rounded-lg transition-colors duration-300 ${isDarkTheme ? 'bg-gray-700' : 'bg-muted'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{landingPage.displayName}</h3>
                    <p className={`text-sm transition-colors duration-300 ${themeClasses.textMuted}`}>
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
                        className="transition-colors duration-300"
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
                        className="transition-colors duration-300"
                        data-testid="button-increase-quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold transition-colors duration-300" style={{color: 'var(--theme-primary)'}}>
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
                  className="flex-1 transition-colors duration-300"
                  data-testid="button-cancel-order"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleOrder}
                  disabled={orderMutation.isPending}
                  className="flex-1 transition-colors duration-300"
                  style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
                  data-testid="button-confirm-order"
                >
                  {orderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky Mobile Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t p-4 md:hidden transition-colors duration-300 ${themeClasses.card}`}>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 transition-colors duration-300"
            onClick={() => landingPage.contactInfo?.phone && window.open(`tel:${landingPage.contactInfo.phone}`)}
          >
            <Phone className="h-4 w-4 mr-1" />
            Gọi
          </Button>
          <Button 
            size="sm" 
            className="flex-1 basis-2/3 transition-colors duration-300"
            style={{background: `linear-gradient(to right, var(--theme-primary), var(--theme-primary-dark))`}}
            onClick={() => setShowOrderForm(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Đặt hàng - {finalPrice.toLocaleString('vi-VN')}đ
          </Button>
        </div>
      </div>
      
      {/* Add bottom padding for mobile sticky bar */}
      <div className="h-20 md:h-0" />

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