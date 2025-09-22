import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Plus, X, Palette, Sparkles } from "lucide-react";
import { Link } from "wouter";
import AdvancedThemeBuilder, { AdvancedThemeConfig } from "@/components/AdvancedThemeBuilder";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
}

interface ProductLandingPageForm {
  title: string;
  slug: string;
  description: string;
  productId: string;
  customPrice: string;
  originalPrice: string;
  heroTitle: string;
  heroSubtitle: string;
  callToAction: string;
  features: string[];
  isActive: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  contactPhone: string;
  contactEmail: string;
  contactBusinessName: string;
  paymentCod: boolean;
  paymentBankTransfer: boolean;
  paymentOnline: boolean;
}

export default function LandingPageEditor() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [newFeature, setNewFeature] = useState("");
  const [showAdvancedThemes, setShowAdvancedThemes] = useState(false);
  const [selectedThemeConfig, setSelectedThemeConfig] = useState<AdvancedThemeConfig | null>(null);

  const [formData, setFormData] = useState<ProductLandingPageForm>({
    title: "",
    slug: "",
    description: "",
    productId: "",
    customPrice: "",
    originalPrice: "",
    heroTitle: "",
    heroSubtitle: "",
    callToAction: "Đặt hàng ngay",
    features: [],
    isActive: true,
    theme: 'light',
    primaryColor: "#007bff",
    contactPhone: "",
    contactEmail: "",
    contactBusinessName: "",
    paymentCod: true,
    paymentBankTransfer: true,
    paymentOnline: false,
  });

  // Fetch products for selection
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch existing landing page if editing
  const { data: existingLandingPage, isLoading } = useQuery<any>({
    queryKey: ['/api/product-landing-pages', id],
    queryFn: () => isEditing ? fetch(`/api/product-landing-pages/${id}`).then(res => res.json()) : null,
    enabled: isEditing,
  });

  // Load existing data
  useEffect(() => {
    if (existingLandingPage && isEditing) {
      setFormData({
        title: existingLandingPage.title || "",
        slug: existingLandingPage.slug || "",
        description: existingLandingPage.description || "",
        productId: existingLandingPage.productId || "",
        customPrice: existingLandingPage.customPrice?.toString() || "",
        originalPrice: existingLandingPage.originalPrice?.toString() || "",
        heroTitle: existingLandingPage.heroTitle || "",
        heroSubtitle: existingLandingPage.heroSubtitle || "",
        callToAction: existingLandingPage.callToAction || "Đặt hàng ngay",
        features: existingLandingPage.features || [],
        isActive: existingLandingPage.isActive ?? true,
        theme: existingLandingPage.theme || 'light',
        primaryColor: existingLandingPage.primaryColor || "#007bff",
        contactPhone: existingLandingPage.contactInfo?.phone || "",
        contactEmail: existingLandingPage.contactInfo?.email || "",
        contactBusinessName: existingLandingPage.contactInfo?.businessName || "",
        paymentCod: existingLandingPage.paymentMethods?.cod ?? true,
        paymentBankTransfer: existingLandingPage.paymentMethods?.bankTransfer ?? true,
        paymentOnline: existingLandingPage.paymentMethods?.online ?? false,
      });
    }
  }, [existingLandingPage, isEditing]);

  // Load existing theme config when landing page data is available
  useEffect(() => {
    if (existingLandingPage?.advancedThemeConfig && !selectedThemeConfig) {
      setSelectedThemeConfig(existingLandingPage.advancedThemeConfig);
    }
  }, [existingLandingPage, selectedThemeConfig]);

  // Cross-system content sharing receiver logic
  useEffect(() => {
    const loadSharedContent = async () => {
      // Only load shared content if not editing existing landing page
      if (isEditing) return;

      // Check URL parameters for content ID
      const urlParams = new URLSearchParams(window.location.search);
      const contentId = urlParams.get('content');

      if (!contentId) return;

      try {
        // First try to get content from localStorage (immediate transfer)
        const storedContent = localStorage.getItem('landingPageContent');
        let sharedContent = null;

        if (storedContent) {
          const parsedContent = JSON.parse(storedContent);
          if (parsedContent.contentId === contentId) {
            sharedContent = parsedContent;
            // Clean up localStorage after consumption
            localStorage.removeItem('landingPageContent');
          }
        }

        // Fallback: fetch from API if localStorage is empty
        if (!sharedContent) {
          const response = await fetch(`/api/content/library/${contentId}`);
          if (response.ok) {
            const contentItem = await response.json();
            sharedContent = {
              title: contentItem.title,
              content: contentItem.baseContent,
              contentId: contentItem.id
            };
          }
        }

        // Pre-populate form with shared content
        if (sharedContent) {
          setFormData(prevData => ({
            ...prevData,
            title: sharedContent.title,
            heroTitle: sharedContent.title,
            description: sharedContent.content,
            heroSubtitle: sharedContent.content.length > 100 
              ? sharedContent.content.substring(0, 100) + "..."
              : sharedContent.content,
            slug: sharedContent.title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '')
          }));

          toast({
            title: "✅ Content loaded successfully!",
            description: `Content "${sharedContent.title}" has been pre-populated in the form.`,
          });
        }
      } catch (error) {
        console.error('Failed to load shared content:', error);
        toast({
          title: "❌ Failed to load content",
          description: "Could not load the shared content. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadSharedContent();
  }, [isEditing, toast]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, isEditing]);

  // Save landing page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/product-landing-pages/${id}` : '/api/product-landing-pages';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `Landing page đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products', 'landing'] });
      navigate('/landing-page-manager');
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title || !formData.slug || !formData.productId || !formData.contactPhone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    const saveData = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      productId: formData.productId,
      customPrice: formData.customPrice ? parseFloat(formData.customPrice) : undefined,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      heroTitle: formData.heroTitle,
      heroSubtitle: formData.heroSubtitle,
      callToAction: formData.callToAction,
      features: formData.features,
      isActive: formData.isActive,
      theme: formData.theme,
      primaryColor: formData.primaryColor,
      // Include advanced theme configuration if available (prevent null overwrite)
      advancedThemeConfig: selectedThemeConfig ?? existingLandingPage?.advancedThemeConfig ?? undefined,
      contactInfo: {
        phone: formData.contactPhone,
        email: formData.contactEmail,
        businessName: formData.contactBusinessName,
      },
      paymentMethods: {
        cod: formData.paymentCod,
        bankTransfer: formData.paymentBankTransfer,
        online: formData.paymentOnline,
      },
    };

    saveMutation.mutate(saveData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/landing-page-manager">
          <Button variant="outline" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Sửa Landing Page' : 'Tạo Landing Page mới'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Chỉnh sửa thông tin landing page' : 'Tạo landing page riêng cho sản phẩm'}
          </p>
        </div>
      </div>

      {/* Advanced Theme Builder Modal/Section */}
      {showAdvancedThemes && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Advanced Theme Builder
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedThemes(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdvancedThemeBuilder
                initialConfig={{
                  colorPalette: {
                    primary: formData.primaryColor,
                    secondary: "#6c757d",
                    accent: "#17a2b8",
                    success: "#28a745",
                    warning: "#ffc107",
                    danger: "#dc3545",
                    background: "#ffffff",
                    surface: "#f8f9fa",
                    text: "#212529",
                    textMuted: "#6c757d"
                  }
                }}
                onThemeChange={(config) => {
                  // Update the basic primaryColor when theme changes
                  setFormData(prev => ({
                    ...prev,
                    primaryColor: config.colorPalette.primary
                  }));
                  setSelectedThemeConfig(config);
                }}
                onSave={(config) => {
                  setSelectedThemeConfig(config);
                  setShowAdvancedThemes(false);
                  toast({
                    title: "Theme saved!",
                    description: "Advanced theme configuration has been applied to your landing page."
                  });
                }}
                isPreviewMode={false}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề Landing Page *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: iPhone 15 Pro Max - Giảm giá đặc biệt"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="iphone-15-pro-max-giam-gia"
                  data-testid="input-slug"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL sẽ là: {window.location.origin}/lp/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về landing page"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="product">Chọn sản phẩm *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {parseFloat(product.price).toLocaleString('vi-VN')}đ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Giá gốc: {parseFloat(selectedProduct.price).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Thiết lập giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customPrice">Giá bán (VND)</Label>
                  <Input
                    id="customPrice"
                    type="number"
                    value={formData.customPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPrice: e.target.value }))}
                    placeholder="Để trống để dùng giá gốc"
                    data-testid="input-custom-price"
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Giá gốc (để hiển thị giảm giá)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="Giá gốc cao hơn"
                    data-testid="input-original-price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Phần Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="heroTitle">Tiêu đề chính</Label>
                <Input
                  id="heroTitle"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                  placeholder="VD: Mua ngay iPhone 15 Pro Max"
                  data-testid="input-hero-title"
                />
              </div>
              <div>
                <Label htmlFor="heroSubtitle">Phụ đề</Label>
                <Input
                  id="heroSubtitle"
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  placeholder="VD: Giảm giá đặc biệt chỉ hôm nay"
                  data-testid="input-hero-subtitle"
                />
              </div>
              <div>
                <Label htmlFor="callToAction">Nút hành động</Label>
                <Input
                  id="callToAction"
                  value={formData.callToAction}
                  onChange={(e) => setFormData(prev => ({ ...prev, callToAction: e.target.value }))}
                  placeholder="Đặt hàng ngay"
                  data-testid="input-cta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Điểm nổi bật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Thêm điểm nổi bật"
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  data-testid="input-new-feature"
                />
                <Button onClick={addFeature} data-testid="button-add-feature">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature}
                    <button
                      onClick={() => removeFeature(index)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-feature-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactPhone">Số điện thoại *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="0123456789"
                  data-testid="input-contact-phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@store.com"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <Label htmlFor="contactBusinessName">Tên cửa hàng</Label>
                  <Input
                    id="contactBusinessName"
                    value={formData.contactBusinessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactBusinessName: e.target.value }))}
                    placeholder="Cửa hàng ABC"
                    data-testid="input-business-name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Kích hoạt</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-active"
                />
              </div>

              <div>
                <Label htmlFor="theme">Giao diện</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value: 'light' | 'dark') => setFormData(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Sáng</SelectItem>
                    <SelectItem value="dark">Tối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryColor">Màu chủ đạo</Label>
                <div className="space-y-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    data-testid="input-primary-color"
                  />
                  
                  {/* Advanced Theme Builder Toggle */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedThemes(!showAdvancedThemes)}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {showAdvancedThemes ? 'Ẩn' : 'Hiển thị'} Advanced Theme Builder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentCod">COD (Thanh toán khi nhận hàng)</Label>
                <Switch
                  id="paymentCod"
                  checked={formData.paymentCod}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentCod: checked }))}
                  data-testid="switch-payment-cod"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="paymentBankTransfer">Chuyển khoản</Label>
                <Switch
                  id="paymentBankTransfer"
                  checked={formData.paymentBankTransfer}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentBankTransfer: checked }))}
                  data-testid="switch-payment-bank"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="paymentOnline">Thanh toán online</Label>
                <Switch
                  id="paymentOnline"
                  checked={formData.paymentOnline}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentOnline: checked }))}
                  data-testid="switch-payment-online"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo Landing Page')}
              </Button>

              {formData.slug && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/lp/${formData.slug}`, '_blank')}
                  className="w-full"
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trước
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}