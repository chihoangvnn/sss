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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  Flame
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

interface ValidationErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentMethod?: string;
}

type CheckoutStep = 'product' | 'customer' | 'payment' | 'confirm';

const CHECKOUT_STEPS = [
  { id: 'product', title: 'Sản phẩm', description: 'Xem lại sản phẩm' },
  { id: 'customer', title: 'Thông tin', description: 'Thông tin khách hàng' },
  { id: 'payment', title: 'Thanh toán', description: 'Phương thức thanh toán' },
  { id: 'confirm', title: 'Xác nhận', description: 'Xác nhận đơn hàng' }
] as const;

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
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('product');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [viewersCount, setViewersCount] = useState(Math.floor(Math.random() * 20) + 5);
  const [recentPurchases, setRecentPurchases] = useState([
    "Anh Minh vừa mua 2 phút trước",
    "Chị Hương vừa mua 5 phút trước",
    "Anh Nam vừa mua 8 phút trước"
  ]);
  
  // Stable social proof numbers (generated once per session)
  const [stableStats, setStableStats] = useState(() => ({
    bonusSales: Math.floor(Math.random() * 50) + 100,
    availableStock: Math.floor(Math.random() * 20) + 5,
    urgencyHours: Math.floor(Math.random() * 12) + 1
  }));
  
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
      resetCheckoutForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đặt hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Form validation functions
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Họ và tên là bắt buộc';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return '';
      case 'phone':
        if (!value.trim()) return 'Số điện thoại là bắt buộc';
        const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'Số điện thoại không hợp lệ (VD: 0123456789)';
        }
        return '';
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email không hợp lệ';
        }
        return '';
      case 'address':
        if (!value.trim()) return 'Địa chỉ giao hàng là bắt buộc';
        if (value.trim().length < 10) return 'Vui lòng nhập địa chỉ chi tiết';
        return '';
      default:
        return '';
    }
  };

  const validateCurrentStep = () => {
    const errors: ValidationErrors = {};
    
    if (currentStep === 'customer') {
      errors.name = validateField('name', orderForm.name);
      errors.phone = validateField('phone', orderForm.phone);
      errors.email = validateField('email', orderForm.email);
      errors.address = validateField('address', orderForm.address);
    }
    
    setValidationErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  const handleFieldChange = (field: string, value: string) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => new Set(prev).add(field));
    
    // Real-time validation for touched fields
    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      const stepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep);
      if (stepIndex < CHECKOUT_STEPS.length - 1) {
        setCurrentStep(CHECKOUT_STEPS[stepIndex + 1].id as CheckoutStep);
      }
    }
  };

  const handlePrevStep = () => {
    const stepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(CHECKOUT_STEPS[stepIndex - 1].id as CheckoutStep);
    }
  };

  const handleOrder = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin.",
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

  const resetCheckoutForm = () => {
    setShowOrderForm(false);
    setCurrentStep('product');
    setValidationErrors({});
    setTouchedFields(new Set());
    setOrderForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      quantity: 1,
      paymentMethod: 'cod',
      notes: ""
    });
  };

  // Define safe derived variables with fallbacks for when landingPage is undefined
  const isDarkTheme = (landingPage?.theme ?? 'light') === 'dark';
  const finalPrice = landingPage?.finalPrice ?? 0;
  const originalPrice = landingPage?.originalPrice ?? null;
  const hasDiscount = originalPrice != null && originalPrice > finalPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - finalPrice)/originalPrice)*100) : 0;

  // Memoized color info calculation for performance
  const colorInfo = useMemo(() => {
    const primaryColor = landingPage?.primaryColor || '#007bff';
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
  }, [landingPage?.primaryColor]);
  
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

  // SEO Meta Tags - Dynamic based on landing page data
  useEffect(() => {
    if (!landingPage) return;

    const product = landingPage.product;
    const reviews = landingPage.reviewsData;
    
    // Generate optimized title for SEO and social sharing
    const seoTitle = `${product?.name || landingPage.title} - Giá chỉ ${finalPrice.toLocaleString('vi-VN')}đ | Mua ngay`;
    const seoDescription = landingPage.description || product?.description || `Mua ${product?.name} chính hãng, giá tốt nhất thị trường. ⭐ ${reviews?.averageRating?.toFixed(1) || '4.8'}/5 từ ${reviews?.totalReviews || 0} đánh giá. Giao hàng miễn phí, đổi trả 30 ngày.`;
    const seoKeywords = `${product?.name}, mua ${product?.name}, ${product?.name} giá tốt, ${product?.name} chính hãng, đặt hàng online, giao hàng miễn phí`;
    
    // Basic SEO meta tags
    document.title = seoTitle;
    
    // Remove existing meta tags to avoid duplicates
    const existingMetaTags = document.querySelectorAll('meta[data-seo="true"]');
    existingMetaTags.forEach(tag => tag.remove());
    
    const metaTags = [
      { name: 'description', content: seoDescription },
      { name: 'keywords', content: seoKeywords },
      { name: 'author', content: landingPage.contactInfo?.businessName || 'Shop Online' },
      { name: 'robots', content: 'index, follow' },
      { name: 'language', content: 'vi-VN' },
      
      // Open Graph tags for Facebook
      { property: 'og:type', content: 'product' },
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:image', content: landingPage.displayImage || product?.image || '' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: landingPage.contactInfo?.businessName || 'Online Shop' },
      { property: 'og:locale', content: 'vi_VN' },
      { property: 'product:price:amount', content: finalPrice.toString() },
      { property: 'product:price:currency', content: 'VND' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seoTitle },
      { name: 'twitter:description', content: seoDescription },
      { name: 'twitter:image', content: landingPage.displayImage || product?.image || '' },
      
      // Additional SEO tags
      { name: 'theme-color', content: landingPage.primaryColor || '#007bff' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'format-detection', content: 'telephone=yes' }
    ];
    
    // Add meta tags to document head
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement('meta');
      if (name) meta.setAttribute('name', name);
      if (property) meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      meta.setAttribute('data-seo', 'true'); // Mark for easy removal
      document.head.appendChild(meta);
    });
    
    // Add canonical URL (remove query parameters)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    canonical.setAttribute('href', cleanUrl);
    
    // Get valid image URLs FIRST (before using in resource hints)
    const productImages = [];
    if (landingPage.displayImage) productImages.push(landingPage.displayImage);
    if (product?.image && product.image !== landingPage.displayImage) productImages.push(product.image);
    
    // Add critical resource hints for performance
    const addResourceHint = (rel: string, href: string, as?: string) => {
      const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        if (as) {
          link.setAttribute('as', as); // Use the actual 'as' parameter
          if (as === 'font') {
            link.setAttribute('crossorigin', 'anonymous');
          }
        }
        // Critical: Add crossorigin for fonts.gstatic.com preconnect regardless of 'as'
        if (rel === 'preconnect' && href.includes('fonts.gstatic.com')) {
          link.setAttribute('crossorigin', 'anonymous');
        }
        document.head.appendChild(link);
      }
    };
    
    // Preconnect to Google Fonts for faster font loading
    addResourceHint('preconnect', 'https://fonts.googleapis.com');
    addResourceHint('preconnect', 'https://fonts.gstatic.com');
    
    // JSON-LD Structured Data for Google Rich Snippets
    const existingJsonLd = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        // Product Schema
        {
          "@type": "Product",
          "@id": cleanUrl + "#product",
          "name": product?.name || landingPage.title,
          "description": product?.description || landingPage.description,
          // Only include image if we have valid URLs
          ...(productImages.length > 0 && { "image": productImages }),
          "brand": {
            "@type": "Brand",
            "name": landingPage.contactInfo?.businessName || "Online Shop"
          },
          "offers": {
            "@type": "Offer",
            "url": cleanUrl,
            "priceCurrency": "VND",
            "price": finalPrice.toString(), // Google prefers string format
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
            // Only include availability if we have real stock data
            ...(typeof landingPage.availableStock === 'number' && {
              "availability": landingPage.availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }),
            "seller": {
              "@type": "Organization",
              "name": landingPage.contactInfo?.businessName || "Online Shop"
            }
          },
          "aggregateRating": reviews && reviews.totalReviews > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": reviews.averageRating,
            "reviewCount": reviews.totalReviews,
            "bestRating": 5,
            "worstRating": 1
          } : undefined
        },
        // Organization Schema
        {
          "@type": "Organization",
          "@id": cleanUrl + "#organization", 
          "name": landingPage.contactInfo?.businessName || "Online Shop",
          "url": cleanUrl,
          // Only include logo if we have a valid image URL
          ...(productImages.length > 0 && { "logo": productImages[0] }),
          "contactPoint": landingPage.contactInfo?.phone ? {
            "@type": "ContactPoint",
            "telephone": landingPage.contactInfo.phone,
            "contactType": "Customer Service"
          } : undefined,
          "address": landingPage.contactInfo?.address ? {
            "@type": "PostalAddress",
            "streetAddress": landingPage.contactInfo.address
          } : undefined
        },
        // WebPage Schema
        {
          "@type": "WebPage",
          "@id": cleanUrl + "#webpage",
          "url": cleanUrl,
          "name": seoTitle,
          "description": seoDescription,
          "isPartOf": {
            "@type": "WebSite",
            "name": landingPage.contactInfo?.businessName || "Online Shop",
            "url": window.location.origin
          },
          "about": {
            "@id": cleanUrl + "#product"
          },
          "potentialAction": {
            "@type": "BuyAction",
            "target": cleanUrl,
            "object": {
              "@id": cleanUrl + "#product"
            }
          }
        }
      ]
    };
    
    // Remove undefined fields for cleaner JSON-LD
    const cleanStructuredData = JSON.parse(JSON.stringify(structuredData, (key, value) => 
      value === undefined ? undefined : value
    ));
    
    // Add JSON-LD script to head
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.setAttribute('data-seo', 'true');
    jsonLdScript.textContent = JSON.stringify(cleanStructuredData, null, 2);
    document.head.appendChild(jsonLdScript);
    
  }, [landingPage, finalPrice, stableStats]);

  // Early returns for loading and error states (after all hooks are defined)
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
              {/* Phone number (clickable) */}
              {landingPage.contactInfo?.phone && (
                <a href={`tel:${landingPage.contactInfo.phone}`} className="flex items-center gap-2 transition-colors duration-300 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">{landingPage.contactInfo.phone}</span>
                  <span className="sm:hidden text-sm">Gọi</span>
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

              {/* Trust Badges & Guarantees */}
              <div className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <span className={`${themeClasses.textMuted} text-xs`}>Bảo hành<br/>chính hãng</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className={`${themeClasses.textMuted} text-xs`}>Giao hàng<br/>miễn phí</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span className={`${themeClasses.textMuted} text-xs`}>Đổi trả<br/>30 ngày</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className={`${themeClasses.textMuted} text-xs`}>Thanh toán<br/>bảo mật</span>
                  </div>
                </div>
                
                {/* Review Summary Badge */}
                {landingPage.reviewsData && landingPage.reviewsData.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(landingPage.reviewsData.averageRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="font-semibold text-amber-700 ml-1">
                        {landingPage.reviewsData.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-amber-600">
                      ({landingPage.reviewsData.totalReviews} đánh giá)
                    </span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                      Được tin tưởng
                    </Badge>
                  </div>
                )}
              </div>

              <Button 
                size="lg" 
                className="text-lg px-8 py-4 transition-colors duration-300 w-full md:w-auto"
                style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
                onClick={() => setShowOrderForm(true)}
                data-testid="button-order-now"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {landingPage.callToAction || "Đặt hàng ngay"}
              </Button>
              
              {/* Shopee-Style Social Proof */}
              <div className="mt-6">
                {/* Sales & Rating Stats */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
                      <span className="font-bold text-orange-600 text-lg">
                        {landingPage.reviewsData?.averageRating?.toFixed(1) || '4.8'}
                      </span>
                    </div>
                    <div className="text-xs text-orange-600">
                      ({landingPage.reviewsData?.totalReviews || 0} đánh giá)
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <div className="font-bold text-green-700">{(landingPage.orderCount || 0) + stableStats.bonusSales}</div>
                      <div className="text-xs text-green-600">Đã bán</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="text-sm">
                      <div className="font-bold text-blue-700">{landingPage.viewCount || 0}+</div>
                      <div className="text-xs text-blue-600">Lượt xem</div>
                    </div>
                  </div>
                </div>
                
                {/* Trust Badges Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-200">
                    <Flame className="h-3 w-3" />
                    <span className="font-medium">Bán chạy nhất</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full border border-purple-200">
                    <Award className="h-3 w-3" />
                    <span className="font-medium">Top đánh giá</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="font-medium">Còn {landingPage.availableStock || stableStats.availableStock}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {landingPage.displayImage && (
                <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={landingPage.displayImage}
                    alt={landingPage.displayName}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    width="600"
                    height="337"
                  />
                </div>
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
              <span className="text-sm font-medium">⏰ Còn {stableStats.urgencyHours}h!</span>
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

      {/* Customer Reviews - Real Data */}
      {landingPage.reviewsData && landingPage.reviewsData.reviews.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Khách hàng nói gì về sản phẩm</h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.round(landingPage.reviewsData.averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-2xl font-bold" style={{color: 'var(--theme-primary)'}}>
                    {landingPage.reviewsData.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className={`text-lg ${themeClasses.textMuted}`}>
                  ({landingPage.reviewsData.totalReviews} đánh giá)
                </div>
              </div>
              
              {/* Rating Distribution */}
              <div className="max-w-md mx-auto mb-8">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = landingPage.reviewsData.ratingCounts[rating] || 0;
                  const percentage = landingPage.reviewsData.totalReviews > 0 
                    ? Math.round((count / landingPage.reviewsData.totalReviews) * 100) 
                    : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all duration-500"
                          style={{width: `${percentage}%`}}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Shopee-Style Review Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {landingPage.reviewsData.reviews.map((review: any, index: number) => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 p-6">
                  {/* Header with Avatar and Rating */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      {review.customerAvatar ? (
                        <img
                          src={review.customerAvatar}
                          alt={review.customerName}
                          className="w-12 h-12 rounded-full border-3 border-orange-200 shadow-sm"
                          loading="lazy"
                          decoding="async"
                          width="48"
                          height="48"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg">
                          {review.customerName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-base">{review.customerName}</h4>
                        {review.isVerified && (
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã mua hàng</span>
                          </div>
                        )}
                      </div>
                      {/* Large Stars Like Shopee */}
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating 
                                ? 'text-orange-400 fill-orange-400' 
                                : 'text-gray-200 fill-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-orange-500">{review.rating}/5</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Review Title */}
                  {review.title && (
                    <h5 className="font-semibold text-gray-800 mb-3 text-base">{review.title}</h5>
                  )}
                  
                  {/* Review Content */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-4 text-sm">
                      {review.content}
                    </p>
                  </div>
                  
                  {/* Footer with Helpful Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors text-sm">
                        <Heart className="h-4 w-4" />
                        <span>Hữu ích ({review.helpfulCount || 0})</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Eye className="h-3 w-3" />
                      <span>Đánh giá được xác thực</span>
                    </div>
                  </div>
                </div>
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

      {/* Multi-Step Checkout Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className={`w-full max-w-lg max-h-[95vh] overflow-hidden transition-all duration-300 transform ${themeClasses.card}`}>
            {/* Header with Progress */}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg md:text-xl">Đặt hàng</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCheckoutForm}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                  data-testid="button-close-checkout"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  {CHECKOUT_STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = CHECKOUT_STEPS.findIndex(s => s.id === currentStep) > index;
                    return (
                      <div key={step.id} className={`flex-1 text-center transition-colors duration-200 ${
                        isActive ? 'text-primary font-medium' : isCompleted ? 'text-green-600' : ''
                      }`}>
                        {step.title}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {CHECKOUT_STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = CHECKOUT_STEPS.findIndex(s => s.id === currentStep) > index;
                    return (
                      <div
                        key={step.id}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          isActive ? 'bg-primary' : isCompleted ? 'bg-green-500' : 'bg-muted'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Step 1: Product Review */}
              {currentStep === 'product' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Xem lại sản phẩm</h3>
                    <p className="text-sm text-muted-foreground">Kiểm tra thông tin sản phẩm và số lượng</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-muted/50 border-border'}`}>
                    <div className="flex gap-4 items-start">
                      {landingPage.displayImage && (
                        <img
                          src={landingPage.displayImage}
                          alt={landingPage.displayName}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          loading="lazy"
                          decoding="async"
                          width="80"
                          height="80"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 truncate">{landingPage.displayName}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {landingPage.displayDescription}
                        </p>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-bold text-primary">
                            {finalPrice.toLocaleString('vi-VN')}đ
                          </span>
                          {hasDiscount && (
                            <span className="text-sm line-through text-muted-foreground">
                              {originalPrice.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector - Touch Optimized */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Số lượng</Label>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setOrderForm(prev => ({ 
                          ...prev, 
                          quantity: Math.max(1, prev.quantity - 1) 
                        }))}
                        className="h-12 w-12 rounded-full transition-colors duration-300"
                        disabled={orderForm.quantity <= 1}
                        data-testid="button-decrease-quantity"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      
                      <div className="bg-muted rounded-lg px-6 py-3 min-w-[80px] text-center">
                        <span className="text-2xl font-bold">{orderForm.quantity}</span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setOrderForm(prev => ({ 
                          ...prev, 
                          quantity: prev.quantity + 1 
                        }))}
                        className="h-12 w-12 rounded-full transition-colors duration-300"
                        data-testid="button-increase-quantity"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-primary/5 border-primary/20'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-primary">
                        {(finalPrice * orderForm.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Information */}
              {currentStep === 'customer' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng</h3>
                    <p className="text-sm text-muted-foreground">Điền thông tin để chúng tôi giao hàng</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="orderName" className="text-base font-medium">
                        Họ và tên <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="orderName"
                        name="orderName"
                        value={orderForm.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onBlur={() => setTouchedFields(prev => new Set(prev).add('name'))}
                        placeholder="Nguyễn Văn A"
                        className={`h-12 text-base transition-colors duration-300 ${
                          validationErrors.name && touchedFields.has('name') ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        autoComplete="name"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-order-name"
                      />
                      {validationErrors.name && touchedFields.has('name') && (
                        <div className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.name}
                        </div>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <Label htmlFor="orderPhone" className="text-base font-medium">
                        Số điện thoại <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="orderPhone"
                        name="orderPhone"
                        type="tel"
                        value={orderForm.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={() => setTouchedFields(prev => new Set(prev).add('phone'))}
                        placeholder="0123 456 789"
                        className={`h-12 text-base transition-colors duration-300 ${
                          validationErrors.phone && touchedFields.has('phone') ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        autoComplete="tel"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-order-phone"
                      />
                      {validationErrors.phone && touchedFields.has('phone') && (
                        <div className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.phone}
                        </div>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="orderEmail" className="text-base font-medium">Email</Label>
                      <Input
                        id="orderEmail"
                        name="orderEmail"
                        type="email"
                        value={orderForm.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => setTouchedFields(prev => new Set(prev).add('email'))}
                        placeholder="email@example.com"
                        className={`h-12 text-base transition-colors duration-300 ${
                          validationErrors.email && touchedFields.has('email') ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        autoComplete="email"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-order-email"
                      />
                      {validationErrors.email && touchedFields.has('email') && (
                        <div className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.email}
                        </div>
                      )}
                    </div>

                    {/* Address Field */}
                    <div className="space-y-2">
                      <Label htmlFor="orderAddress" className="text-base font-medium">
                        Địa chỉ giao hàng <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="orderAddress"
                        name="orderAddress"
                        value={orderForm.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        onBlur={() => setTouchedFields(prev => new Set(prev).add('address'))}
                        placeholder="Số nhà, đường, phường, quận, thành phố"
                        rows={3}
                        className={`text-base transition-colors duration-300 resize-none ${
                          validationErrors.address && touchedFields.has('address') ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        autoComplete="street-address"
                        autoCorrect="off"
                        spellCheck={false}
                        data-testid="input-order-address"
                      />
                      {validationErrors.address && touchedFields.has('address') && (
                        <div className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {validationErrors.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 'payment' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Phương thức thanh toán</h3>
                    <p className="text-sm text-muted-foreground">Chọn cách thức thanh toán phù hợp</p>
                  </div>
                  
                  <div className="space-y-3">
                    {landingPage.paymentMethods?.cod && (
                      <label 
                        htmlFor="cod" 
                        className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:bg-muted/50 ${
                          orderForm.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          id="cod"
                          name="paymentMethod"
                          value="cod"
                          checked={orderForm.paymentMethod === 'cod'}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="mt-1 w-4 h-4"
                          data-testid="radio-payment-cod"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-5 w-5 text-primary" />
                            <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Thanh toán bằng tiền mặt khi nhận được hàng
                          </p>
                        </div>
                      </label>
                    )}
                    
                    {landingPage.paymentMethods?.bankTransfer && (
                      <label 
                        htmlFor="bank_transfer"
                        className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:bg-muted/50 ${
                          orderForm.paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          id="bank_transfer"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={orderForm.paymentMethod === 'bank_transfer'}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="mt-1 w-4 h-4"
                          data-testid="radio-payment-bank"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <span className="font-medium">Chuyển khoản ngân hàng</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Chuyển khoản trước khi giao hàng
                          </p>
                        </div>
                      </label>
                    )}
                    
                    {landingPage.paymentMethods?.online && (
                      <label 
                        htmlFor="online"
                        className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:bg-muted/50 ${
                          orderForm.paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          id="online"
                          name="paymentMethod"
                          value="online"
                          checked={orderForm.paymentMethod === 'online'}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                          className="mt-1 w-4 h-4"
                          data-testid="radio-payment-online"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="font-medium">Thanh toán online</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Thanh toán an toàn qua cổng thanh toán
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                  
                  {/* Notes Field */}
                  <div className="space-y-2">
                    <Label htmlFor="orderNotes" className="text-base font-medium">Ghi chú</Label>
                    <Textarea
                      id="orderNotes"
                      name="orderNotes"
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)..."
                      rows={3}
                      className="text-base resize-none"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-testid="input-order-notes"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Xác nhận đặt hàng</h3>
                    <p className="text-sm text-muted-foreground">Kiểm tra lại thông tin trước khi đặt hàng</p>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="space-y-4">
                    {/* Product Info */}
                    <div className={`p-4 border rounded-lg space-y-3 transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <span className="font-medium">Sản phẩm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{landingPage.displayName} x {orderForm.quantity}</span>
                        <span className="font-semibold">{(finalPrice * orderForm.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div className={`p-4 border rounded-lg space-y-3 transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium">Thông tin khách hàng</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Tên:</strong> {orderForm.name}</div>
                        <div><strong>SĐT:</strong> {orderForm.phone}</div>
                        {orderForm.email && <div><strong>Email:</strong> {orderForm.email}</div>}
                        <div><strong>Địa chỉ:</strong> {orderForm.address}</div>
                      </div>
                    </div>
                    
                    {/* Payment Info */}
                    <div className={`p-4 border rounded-lg space-y-3 transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-medium">Thanh toán</span>
                      </div>
                      <div className="text-sm">
                        {orderForm.paymentMethod === 'cod' && 'Thanh toán khi nhận hàng (COD)'}
                        {orderForm.paymentMethod === 'bank_transfer' && 'Chuyển khoản ngân hàng'}
                        {orderForm.paymentMethod === 'online' && 'Thanh toán online'}
                      </div>
                    </div>
                    
                    {orderForm.notes && (
                      <div className={`p-4 border rounded-lg space-y-3 transition-colors duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-muted/30 border-border'}`}>
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-primary" />
                          <span className="font-medium">Ghi chú</span>
                        </div>
                        <p className="text-sm">{orderForm.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Navigation Buttons */}
            <div className="border-t p-4 space-y-3">
              {currentStep === 'product' && (
                <Button
                  onClick={handleNextStep}
                  className="w-full h-12 text-base font-medium transition-colors duration-300"
                  style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
                  data-testid="button-next-step"
                >
                  Tiếp tục
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              )}
              
              {(currentStep === 'customer' || currentStep === 'payment') && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-12 text-base transition-colors duration-300"
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 h-12 text-base font-medium transition-colors duration-300"
                    style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
                    data-testid="button-next-step"
                  >
                    Tiếp tục
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              )}
              
              {currentStep === 'confirm' && (
                <div className="space-y-3">
                  <Button
                    onClick={handleOrder}
                    disabled={orderMutation.isPending}
                    className="w-full h-12 text-base font-medium transition-colors duration-300"
                    style={{backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)'}}
                    data-testid="button-confirm-order"
                  >
                    {orderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Xác nhận đặt hàng
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={orderMutation.isPending}
                    className="w-full h-12 text-base transition-colors duration-300"
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Quay lại chỉnh sửa
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Sticky Mobile Bottom Bar - Full Width Purchase */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t p-4 md:hidden transition-colors duration-300 ${themeClasses.card}`}>
        <div className="flex flex-col gap-2">
          {/* Price and Call Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{landingPage.contactInfo?.phone || 'Hotline'}</span>
            </div>
            <div className="font-bold text-lg" style={{color: 'var(--theme-primary)'}}>
              {finalPrice.toLocaleString('vi-VN')}đ
            </div>
          </div>
          {/* Full Width Purchase Button */}
          <Button 
            size="lg"
            className="w-full h-12 text-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
            style={{background: `linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))`}}
            onClick={() => setShowOrderForm(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Đặt hàng ngay
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