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
  Flame,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Package,
  Leaf,
  Info
} from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";

// Product interface with all SEO fields
interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: string;
  stock: number;
  categoryId?: string;
  categoryName?: string;
  status: "active" | "inactive" | "out-of-stock";
  image?: string;
  images?: Array<{
    public_id: string;
    secure_url: string;
    alt?: string;
  }>;
  
  // SEO & Enhanced Content Fields
  shortDescription?: string;
  slug: string;
  productStory?: {
    origin?: string;
    process?: string;
    tradition?: string;
    [key: string]: any;
  };
  ingredients?: string[];
  benefits?: string[];
  usageInstructions?: string;
  specifications?: {
    burnTime?: string;
    length?: string;
    quantity?: number;
    weight?: string;
    [key: string]: any;
  };
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFAQ {
  id: string;
  productId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

interface ProductPolicy {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type: 'warranty' | 'shipping' | 'return' | 'support' | 'general';
  isActive: boolean;
}

interface ProductReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

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

export default function ProductPage() {
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

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('product');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Fetch product by slug
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products/slug', slug],
    queryFn: () => fetch(`/api/products/slug/${slug}`).then(res => {
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    }),
    enabled: !!slug,
  });

  // Fetch product FAQs
  const { data: faqs = [] } = useQuery<ProductFAQ[]>({
    queryKey: ['/api/products/faqs', product?.id],
    queryFn: () => fetch(`/api/products/${product?.id}/faqs`).then(res => res.json()),
    enabled: !!product?.id,
  });

  // Fetch product policies (associated with this product)
  const { data: policies = [] } = useQuery<ProductPolicy[]>({
    queryKey: ['/api/products/policies', product?.id],
    queryFn: () => fetch(`/api/products/${product?.id}/policies`).then(res => res.json()),
    enabled: !!product?.id,
  });

  // Fetch product reviews
  const { data: reviewsData } = useQuery<{
    reviews: ProductReview[];
    averageRating: number;
    totalReviews: number;
    ratingCounts: { [key: number]: number };
  }>({
    queryKey: ['/api/products/reviews', product?.id],
    queryFn: () => fetch(`/api/products/${product?.id}/reviews`).then(res => res.json()),
    enabled: !!product?.id,
  });

  // Calculate final price
  const finalPrice = useMemo(() => {
    return product ? parseFloat(product.price) : 0;
  }, [product]);

  // SEO Meta Tags - Comprehensive optimization
  useEffect(() => {
    if (!product) return;

    const seoTitle = product.seoTitle || `${product.name} - Mua ngay với giá ${finalPrice.toLocaleString('vi-VN')}đ`;
    const seoDescription = product.seoDescription || product.shortDescription || product.description || 
      `Mua ${product.name} chính hãng, chất lượng cao. ${reviewsData ? `⭐ ${reviewsData.averageRating.toFixed(1)}/5 từ ${reviewsData.totalReviews} đánh giá.` : ''} Giao hàng nhanh, đổi trả dễ dàng.`;
    
    const seoKeywords = [
      product.name,
      `mua ${product.name}`,
      product.categoryName && `${product.categoryName}`,
      product.ingredients && product.ingredients.join(', '),
      'chính hãng', 'chất lượng', 'giao hàng nhanh'
    ].filter(Boolean).join(', ');

    // Update document title
    document.title = seoTitle;

    // Remove existing meta tags
    const existingMetaTags = document.querySelectorAll('meta[data-seo="product"]');
    existingMetaTags.forEach(tag => tag.remove());

    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"][data-seo="product"]');
    existingJsonLd.forEach(script => script.remove());

    const metaTags = [
      { name: 'description', content: seoDescription },
      { name: 'keywords', content: seoKeywords },
      { name: 'author', content: 'Nhang Sạch Store' },
      { name: 'robots', content: 'index, follow' },
      { name: 'language', content: 'vi-VN' },
      
      // Open Graph tags for Facebook
      { property: 'og:type', content: 'product' },
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:image', content: product.ogImageUrl || (product.images?.[0]?.secure_url) || product.image || '' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: 'Nhang Sạch Store' },
      { property: 'og:locale', content: 'vi_VN' },
      { property: 'product:price:amount', content: finalPrice.toString() },
      { property: 'product:price:currency', content: 'VND' },
      { property: 'product:availability', content: product.stock > 0 ? 'in stock' : 'out of stock' },
      { property: 'product:condition', content: 'new' },
      { property: 'product:brand', content: 'Nhang Sạch' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seoTitle },
      { name: 'twitter:description', content: seoDescription },
      { name: 'twitter:image', content: product.ogImageUrl || (product.images?.[0]?.secure_url) || product.image || '' },
      
      // Additional SEO tags
      { name: 'theme-color', content: '#22c55e' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'format-detection', content: 'telephone=yes' }
    ];

    // Add meta tags to document head
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement('meta');
      if (name) meta.name = name;
      if (property) meta.setAttribute('property', property);
      meta.content = content;
      meta.setAttribute('data-seo', 'product');
      document.head.appendChild(meta);
    });

    // Add canonical URL
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) existingCanonical.remove();
    
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href;
    document.head.appendChild(canonical);

  }, [product, finalPrice, reviewsData]);

  // JSON-LD Structured Data for Rich Snippets
  useEffect(() => {
    if (!product) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        // Product Schema
        {
          "@type": "Product",
          "@id": `${window.location.origin}/product/${product.slug}#product`,
          "name": product.name,
          "description": product.description || product.shortDescription,
          "image": product.images?.map(img => img.secure_url) || [product.image].filter(Boolean),
          "sku": product.sku,
          "brand": {
            "@type": "Brand",
            "name": "Nhang Sạch"
          },
          "category": product.categoryName,
          "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "VND",
            "price": finalPrice,
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Nhang Sạch Store"
            }
          },
          ...(reviewsData && {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": reviewsData.averageRating,
              "reviewCount": reviewsData.totalReviews,
              "bestRating": 5,
              "worstRating": 1
            }
          }),
          ...(reviewsData?.reviews && {
            "review": reviewsData.reviews.slice(0, 5).map(review => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": review.customerName
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating,
                "bestRating": 5,
                "worstRating": 1
              },
              "reviewBody": review.comment,
              "datePublished": review.createdAt
            }))
          })
        },
        
        // FAQ Schema
        ...(faqs.length > 0 ? [{
          "@type": "FAQPage",
          "@id": `${window.location.origin}/product/${product.slug}#faq`,
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        }] : []),
        
        // Organization Schema
        {
          "@type": "Organization",
          "@id": `${window.location.origin}#organization`,
          "name": "Nhang Sạch Store",
          "url": window.location.origin,
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/logo.png`
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+84-123-456-789",
            "contactType": "customer service",
            "areaServed": "VN",
            "availableLanguage": "Vietnamese"
          }
        },
        
        // WebPage Schema
        {
          "@type": "WebPage",
          "@id": `${window.location.origin}/product/${product.slug}#webpage`,
          "url": window.location.href,
          "name": product.seoTitle || `${product.name} - Nhang Sạch Store`,
          "description": product.seoDescription || product.shortDescription || product.description,
          "isPartOf": {
            "@type": "WebSite",
            "@id": `${window.location.origin}#website`,
            "name": "Nhang Sạch Store",
            "url": window.location.origin
          },
          "about": {
            "@id": `${window.location.origin}/product/${product.slug}#product`
          }
        }
      ]
    };

    // Add JSON-LD to document head
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.setAttribute('data-seo', 'product');
    jsonLdScript.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(jsonLdScript);

  }, [product, finalPrice, reviewsData, faqs]);

  // Order submission mutation
  const orderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          productId: product?.id,
          total: (finalPrice * orderData.quantity).toString(),
          items: [{
            productId: product?.id,
            name: product?.name,
            price: finalPrice.toString(),
            quantity: orderData.quantity
          }],
          source: 'product-page'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đặt hàng thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
      });
      // Reset form
      setOrderForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        quantity: 1,
        paymentMethod: 'cod',
        notes: ""
      });
      setCurrentStep('product');
    },
    onError: () => {
      toast({
        title: "Đặt hàng thất bại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  });

  // Form validation
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!orderForm.name.trim()) errors.name = "Vui lòng nhập họ tên";
    if (!orderForm.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10,11}$/.test(orderForm.phone.replace(/\s/g, ''))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
    if (!orderForm.email.trim()) errors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(orderForm.email)) {
      errors.email = "Email không hợp lệ";
    }
    if (!orderForm.address.trim()) errors.address = "Vui lòng nhập địa chỉ";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    orderMutation.mutate(orderForm);
  };

  // Navigate checkout steps
  const nextStep = () => {
    const stepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(CHECKOUT_STEPS[stepIndex + 1].id as CheckoutStep);
    }
  };

  const prevStep = () => {
    const stepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(CHECKOUT_STEPS[stepIndex - 1].id as CheckoutStep);
    }
  };

  // Social sharing functions
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = `${product?.name} - ${product?.shortDescription || product?.description}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Đã sao chép link!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (err) {
      setShareMessage('Không thể sao chép');
      setTimeout(() => setShareMessage(''), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800 font-medium">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-32 w-32 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-red-600">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section with Product Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="aspect-square relative bg-white">
                <img
                  src={product.images?.[selectedImageIndex]?.secure_url || product.image || '/placeholder-product.jpg'}
                  alt={product.images?.[selectedImageIndex]?.alt || product.name}
                  className="w-full h-full object-cover"
                />
                {product.stock <= 5 && product.stock > 0 && (
                  <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600">
                    <Flame className="w-3 h-3 mr-1" />
                    Chỉ còn {product.stock} sản phẩm
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">
                    Hết hàng
                  </Badge>
                )}
              </div>
            </Card>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.secure_url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title & Price */}
            <div>
              {product.categoryName && (
                <Badge variant="outline" className="mb-2">
                  {product.categoryName}
                </Badge>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-lg text-gray-600 mb-4">
                  {product.shortDescription}
                </p>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-green-600">
                  {finalPrice.toLocaleString('vi-VN')}đ
                </span>
                {product.sku && (
                  <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                )}
              </div>

              {/* Reviews */}
              {reviewsData && reviewsData.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= reviewsData.averageRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {reviewsData.averageRating.toFixed(1)} ({reviewsData.totalReviews} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Lợi ích chính
                </h3>
                <ul className="space-y-2">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Quick Order Form */}
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <h3 className="font-bold text-lg mb-4 text-green-800">Đặt hàng nhanh</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="quantity">Số lượng:</Label>
                  <div className="flex items-center border rounded-lg bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      disabled={orderForm.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 border-x">{orderForm.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                      disabled={orderForm.quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-lg font-semibold">
                  Tổng: {(finalPrice * orderForm.quantity).toLocaleString('vi-VN')}đ
                </div>

                <Button
                  onClick={nextStep}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.stock === 0 ? 'Hết hàng' : 'Đặt hàng ngay'}
                </Button>

                {/* Social Sharing */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-600">Chia sẻ:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareToFacebook}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareToTwitter}
                    className="text-blue-400 hover:bg-blue-50"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {shareMessage && (
                    <span className="text-sm text-green-600">{shareMessage}</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Description & Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Description */}
            {product.description && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Mô tả sản phẩm</h2>
                <div 
                  className="prose prose-green max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }}
                />
              </Card>
            )}

            {/* Product Story */}
            {product.productStory && Object.keys(product.productStory).length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-amber-600" />
                  Câu chuyện sản phẩm
                </h2>
                <div className="space-y-4">
                  {product.productStory.origin && (
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-2">Nguồn gốc</h3>
                      <p className="text-gray-700">{product.productStory.origin}</p>
                    </div>
                  )}
                  {product.productStory.process && (
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-2">Quy trình sản xuất</h3>
                      <p className="text-gray-700">{product.productStory.process}</p>
                    </div>
                  )}
                  {product.productStory.tradition && (
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-2">Truyền thống</h3>
                      <p className="text-gray-700">{product.productStory.tradition}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Leaf className="w-6 h-6 mr-2 text-green-600" />
                  Thành phần
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Usage Instructions */}
            {product.usageInstructions && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Info className="w-6 h-6 mr-2 text-blue-600" />
                  Hướng dẫn sử dụng
                </h2>
                <div 
                  className="prose prose-blue max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.usageInstructions.replace(/\n/g, '<br>') }}
                />
              </Card>
            )}

            {/* FAQs */}
            {faqs.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Câu hỏi thường gặp</h2>
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4 text-gray-700">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card className="p-4">
                <h3 className="font-bold mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Thông số kỹ thuật
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Policies */}
            {policies.length > 0 && (
              <Card className="p-4">
                <h3 className="font-bold mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Chính sách
                </h3>
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <div key={policy.id} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        {policy.icon ? (
                          <span className="text-sm">{policy.icon}</span>
                        ) : (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{policy.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{policy.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Trust Badges */}
            <Card className="p-4">
              <h3 className="font-bold mb-3">Cam kết chất lượng</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm">Bảo hành chính hãng</span>
                </div>
                <div className="flex items-center">
                  <Truck className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm">Giao hàng toàn quốc</span>
                </div>
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm">Thanh toán bảo mật</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm">Chất lượng đảm bảo</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {currentStep !== 'product' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Đặt hàng</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('product')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-4">
                {CHECKOUT_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      CHECKOUT_STEPS.findIndex(s => s.id === currentStep) >= index
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {index < CHECKOUT_STEPS.length - 1 && (
                      <div className={`w-8 h-1 mx-2 ${
                        CHECKOUT_STEPS.findIndex(s => s.id === currentStep) > index
                          ? 'bg-green-600'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {currentStep === 'customer' && (
                <>
                  <div>
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      value={orderForm.name}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))}
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={validationErrors.phone ? 'border-red-500' : ''}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Địa chỉ giao hàng *</Label>
                    <Textarea
                      id="address"
                      value={orderForm.address}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                      className={validationErrors.address ? 'border-red-500' : ''}
                    />
                    {validationErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </>
              )}

              {currentStep === 'payment' && (
                <div className="space-y-4">
                  <Label>Phương thức thanh toán</Label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        value="cod"
                        checked={orderForm.paymentMethod === 'cod'}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        className="text-green-600"
                      />
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span>Thanh toán khi nhận hàng (COD)</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        value="bank_transfer"
                        checked={orderForm.paymentMethod === 'bank_transfer'}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        className="text-green-600"
                      />
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 mr-2" />
                        <span>Chuyển khoản ngân hàng</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú đơn hàng</Label>
                    <Textarea
                      id="notes"
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Thời gian giao hàng mong muốn, yêu cầu đặc biệt..."
                    />
                  </div>
                </div>
              )}

              {currentStep === 'confirm' && (
                <div className="space-y-4">
                  <h3 className="font-bold">Xác nhận đơn hàng</h3>
                  
                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sản phẩm:</span>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số lượng:</span>
                        <span className="font-medium">{orderForm.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đơn giá:</span>
                        <span className="font-medium">{finalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Tổng cộng:</span>
                        <span>{(finalPrice * orderForm.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-2 text-sm">
                      <div><strong>Khách hàng:</strong> {orderForm.name}</div>
                      <div><strong>Điện thoại:</strong> {orderForm.phone}</div>
                      <div><strong>Email:</strong> {orderForm.email}</div>
                      <div><strong>Địa chỉ:</strong> {orderForm.address}</div>
                      <div><strong>Thanh toán:</strong> {
                        orderForm.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'
                      }</div>
                      {orderForm.notes && <div><strong>Ghi chú:</strong> {orderForm.notes}</div>}
                    </div>
                  </Card>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                {currentStep !== 'customer' && (
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Quay lại
                  </Button>
                )}
                
                {currentStep === 'confirm' ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={orderMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {orderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Tiếp tục
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget 
        pageType="landing_page"
        pageContext={{
          featuredProduct: product ? {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.shortDescription || product.description || ''
          } : undefined
        }}
        onAddToCart={(productId, quantity) => {
          setOrderForm(prev => ({ ...prev, quantity }));
          nextStep();
        }}
        onCreateOrder={(orderData) => {
          setOrderForm(prev => ({
            ...prev,
            name: orderData.customerName || '',
            phone: orderData.customerPhone || '',
            email: orderData.customerEmail || '',
            address: orderData.customerAddress || '',
            quantity: orderData.quantity || 1,
            paymentMethod: orderData.paymentMethod || 'cod',
            notes: orderData.notes || ''
          }));
          setCurrentStep('customer');
        }}
      />
    </div>
  );
}