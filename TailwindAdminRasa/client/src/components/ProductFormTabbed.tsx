import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Wand2, Loader2, Eye, EyeOff, Copy, QrCode, HelpCircle, Target, AlertTriangle, Users, MessageCircle, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "./ImageUploader";
import { QRScanner } from "./QRScanner";
import { RichTextEditor } from "./RichTextEditor";
import { FAQManagement } from "./FAQManagement";
import { 
  UrgencyDataForm, 
  SocialProofDataForm, 
  PersonalizationDataForm, 
  LeadingQuestionsDataForm, 
  ObjectionHandlingDataForm,
  SalesModuleSection
} from "./admin/SalesModuleComponents";
import type { 
  CloudinaryImage, 
  CloudinaryVideo, 
  RasaDescriptions,
  UrgencyData,
  SocialProofData, 
  PersonalizationData,
  LeadingQuestionsData,
  ObjectionHandlingData
} from "@shared/schema";

// Types remain the same as original
interface Industry {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  itemCode?: string;
  isbn?: string; // New field
  price: string;
  stock: number;
  categoryId?: string;
  status: "active" | "inactive" | "out-of-stock";
  image?: string;
  images?: CloudinaryImage[];
  videos?: CloudinaryVideo[];
  descriptions?: RasaDescriptions;
  defaultImageIndex?: number;
  urgencyData?: UrgencyData | null;
  socialProofData?: SocialProofData | null;
  personalizationData?: PersonalizationData | null;
  leadingQuestionsData?: LeadingQuestionsData | null;
  objectionHandlingData?: ObjectionHandlingData | null;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  shortDescription?: string;
  productStory?: any;
  ingredients?: string[];
  benefits?: string[];
  usageInstructions?: string;
  specifications?: any;
  ogImageUrl?: string;
  // Unit fields
  unitType?: "weight" | "count" | "volume";
  unit?: string;
  allowDecimals?: boolean;
  minQuantity?: string;
  quantityStep?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  industryId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  consultationConfig?: any;
  consultationTemplates?: any;
  salesAdviceTemplate?: any;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductFormTabbed({ product, onClose, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'seo' | 'ai'>('basic');
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic fields
    name: "",
    description: "",
    sku: "",
    itemCode: "",
    isbn: "",
    price: "",
    stock: "0",
    industryId: "",
    categoryId: "",
    status: "active" as "active" | "inactive" | "out-of-stock",
    images: [] as CloudinaryImage[],
    videos: [] as CloudinaryVideo[],
    unitType: "count" as "weight" | "count" | "volume",
    unit: "cái",
    allowDecimals: false,
    minQuantity: "1",
    quantityStep: "1",
    
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    slug: "",
    shortDescription: "",
    productStory: {},
    ingredients: [] as string[],
    benefits: [] as string[],
    usageInstructions: "",
    specifications: {},
    ogImageUrl: "",
  });
  
  // AI & Sales data state
  const [generatedDescriptions, setGeneratedDescriptions] = useState<RasaDescriptions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  
  // Default sales data factory - matches exact shared schema
  const createDefaultSalesData = () => ({
    urgencyData: {
      low_stock_threshold: 10,
      is_limited_edition: false,
      sales_velocity: 0,
      urgency_messages: [],
      flash_sale_end: undefined,
      demand_level: "medium" as "low" | "medium" | "high",
      trending_platforms: []
    },
    socialProofData: {
      total_sold: 0,
      total_reviews: 0,
      average_rating: 0,
      featured_reviews: [],
      expert_endorsements: [],
      celebrity_users: [],
      awards_certifications: [],
      media_mentions: [],
      repurchase_rate: 0,
      trending_hashtags: []
    },
    personalizationData: {
      target_demographics: {
        primary: {
          age_range: "",
          gender: [],
          income_level: "middle" as "low" | "middle" | "high" | "premium",
          lifestyle: [],
          location: []
        },
        secondary: {
          age_range: "",
          concerns: []
        }
      },
      skin_types: [],
      lifestyle_tags: [],
      personality_match: [],
      usage_scenarios: [],
      problem_solving: [],
      seasonal_relevance: [],
      profession_fit: [],
      income_bracket: "500k-1m"
    },
    leadingQuestionsData: {
      pain_point_questions: [],
      desire_questions: [],
      discovery_prompts: [],
      comparison_triggers: [],
      emotional_hooks: [],
      closing_questions: [],
      objection_anticipation: []
    },
    objectionHandlingData: {
      common_objections: [],
      price_justification: {
        daily_cost: "",
        comparison_points: [],
        value_proposition: ""
      },
      quality_proof_points: [],
      safety_assurance: [],
      effectiveness_guarantee: {
        guarantee_text: "",
        timeline: "",
        success_rate: ""
      },
      competitor_advantages: [],
      risk_mitigation: [],
      trust_builders: []
    }
  });

  // Sales data state with proper initialization
  const [salesData, setSalesData] = useState(() => {
    const defaults = createDefaultSalesData();
    return {
      urgencyData: {
        ...defaults.urgencyData,
        ...(product?.urgencyData || {}),
        trending_platforms: product?.urgencyData?.trending_platforms || []
      },
      socialProofData: { ...defaults.socialProofData, ...(product?.socialProofData || {}) },
      personalizationData: { ...defaults.personalizationData, ...(product?.personalizationData || {}) },
      leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(product?.leadingQuestionsData || {}) },
      objectionHandlingData: { ...defaults.objectionHandlingData, ...(product?.objectionHandlingData || {}) }
    };
  });

  // Sync sales data with product changes
  useEffect(() => {
    if (product) {
      const defaults = createDefaultSalesData();
      setSalesData({
        urgencyData: {
          ...defaults.urgencyData,
          ...(product.urgencyData || {}),
          trending_platforms: product.urgencyData?.trending_platforms || []
        },
        socialProofData: { ...defaults.socialProofData, ...(product.socialProofData || {}) },
        personalizationData: { ...defaults.personalizationData, ...(product.personalizationData || {}) },
        leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(product.leadingQuestionsData || {}) },
        objectionHandlingData: { ...defaults.objectionHandlingData, ...(product.objectionHandlingData || {}) }
      });
    }
  }, [product?.id]);

  // Collapse state for Sales Technique modules
  const [moduleCollapseState, setModuleCollapseState] = useState({
    urgency: true, // First module open by default
    socialProof: false,
    personalization: false,
    leadingQuestions: false,
    objectionHandling: false
  });

  const toggleModuleCollapse = (moduleKey: string) => {
    setModuleCollapseState(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey as keyof typeof prev]
    }));
  };

  // Sales techniques save mutation
  const salesMutation = useMutation({
    mutationFn: async (data: typeof salesData) => {
      const response = await fetch(`/api/products/${product?.id}/sales-techniques`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save sales techniques');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu dữ liệu sales techniques",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSalesSave = () => {
    if (product?.id) {
      salesMutation.mutate(salesData);
    }
  };
  
  // Fetch industries and categories
  const { data: industries = [], isLoading: industriesLoading } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        itemCode: product.itemCode || "",
        isbn: product.isbn || "",
        price: product.price,
        stock: product.stock.toString(),
        industryId: "",
        categoryId: product.categoryId || "",
        status: product.status,
        images: product.images || [],
        videos: product.videos || [],
        unitType: product.unitType || "count",
        unit: product.unit || "cái",
        allowDecimals: product.allowDecimals || false,
        minQuantity: product.minQuantity || "1",
        quantityStep: product.quantityStep || "1",
        
        // SEO fields
        seoTitle: product.seoTitle || "",
        seoDescription: product.seoDescription || "",
        slug: product.slug || "",
        shortDescription: product.shortDescription || "",
        productStory: product.productStory || {},
        ingredients: product.ingredients || [],
        benefits: product.benefits || [],
        usageInstructions: product.usageInstructions || "",
        specifications: product.specifications || {},
        ogImageUrl: product.ogImageUrl || "",
      });
      
      // Load AI descriptions
      if (product.descriptions) {
        setGeneratedDescriptions(product.descriptions);
        setShowDescriptionPreview(true);
      }
    }
  }, [product]);

  // Auto-select industry when editing
  useEffect(() => {
    if (product && product.categoryId && categories.length > 0 && !formData.industryId) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        setFormData(prev => ({ ...prev, industryId: category.industryId }));
      }
    }
  }, [product, categories, formData.industryId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/products/${product?.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `Sản phẩm đã được ${isEditing ? 'cập nhật' : 'thêm'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      stock: parseInt(formData.stock),
      price: formData.price,
      descriptions: generatedDescriptions,
    };
    
    saveMutation.mutate(dataToSave);
  };

  // QR Scanner handler
  const handleQRScan = (result: string) => {
    setFormData(prev => ({ ...prev, itemCode: result }));
    setIsQRScannerOpen(false);
    toast({
      title: "Quét thành công",
      description: `Mã sản phẩm: ${result}`,
    });
  };

  // AI Description Generation
  const generateDescriptions = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm trước khi tạo mô tả",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const selectedIndustry = industries.find(i => i.id === formData.industryId);
      const selectedCategory = categories.find(c => c.id === formData.categoryId);

      const response = await fetch('/api/ai/generate-product-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          productDescription: formData.description,
          industryName: selectedIndustry?.name || '',
          categoryName: selectedCategory?.name || '',
          price: formData.price,
          features: [],
          consultationContext: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate descriptions');
      }

      const data = await response.json();
      setGeneratedDescriptions(data.descriptions);
      setShowDescriptionPreview(true);
      
      toast({
        title: "Thành công",
        description: "Đã tạo mô tả sản phẩm bằng AI",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo mô tả sản phẩm",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto py-8">
        
        {/* Main Form Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {isEditing ? '📝 Sửa sản phẩm' : '➕ Thêm sản phẩm'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 border-b mt-4">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'basic'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Cơ bản
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'seo'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏷️ SEO
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 AI Generate
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tab Content */}
              {activeTab === 'basic' && (
                <BasicTab 
                  formData={formData}
                  setFormData={setFormData}
                  industries={industries}
                  categories={categories}
                  isQRScannerOpen={isQRScannerOpen}
                  setIsQRScannerOpen={setIsQRScannerOpen}
                />
              )}
              
              {activeTab === 'seo' && (
                <SEOTab 
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              
              {activeTab === 'ai' && (
                <AITab 
                  formData={formData}
                  generatedDescriptions={generatedDescriptions}
                  showDescriptionPreview={showDescriptionPreview}
                  setShowDescriptionPreview={setShowDescriptionPreview}
                  isGenerating={isGenerating}
                  generateDescriptions={generateDescriptions}
                  copyToClipboard={copyToClipboard}
                  product={product}
                  salesData={salesData}
                  setSalesData={setSalesData}
                  handleSalesSave={handleSalesSave}
                  salesMutation={salesMutation}
                  moduleCollapseState={moduleCollapseState}
                  toggleModuleCollapse={toggleModuleCollapse}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  ❌ Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending 
                    ? 'Đang lưu...' 
                    : (isEditing ? '✅ Cập nhật' : '✅ Thêm sản phẩm')
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScan={handleQRScan}
        />
      </div>
    </div>
  );
}

// Tab Components (will implement these next)
function BasicTab({ formData, setFormData, industries, categories, isQRScannerOpen, setIsQRScannerOpen }: any) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Thông tin cơ bản của sản phẩm
      </div>
      
      {/* Row 1: Tên sản phẩm + SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tên sản phẩm *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
            placeholder="Nhập tên sản phẩm"
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">Mã SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, sku: e.target.value }))}
            placeholder="Auto-generated hoặc nhập thủ công"
          />
        </div>
      </div>

      {/* Row 2: Item Code + ISBN + QR Scanner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="itemCode">Mã sản phẩm (Item Code)</Label>
          <div className="flex gap-2">
            <Input
              id="itemCode"
              value={formData.itemCode}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, itemCode: e.target.value }))}
              placeholder="Nhập mã sản phẩm hoặc quét QR"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQRScannerOpen(true)}
              className="px-3"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="isbn">Mã ISBN</Label>
          <Input
            id="isbn"
            value={formData.isbn}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, isbn: e.target.value }))}
            placeholder="ISBN cho sách"
          />
        </div>
        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Kích hoạt</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
              <SelectItem value="out-of-stock">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Industry + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industryId">Ngành hàng</Label>
          <Select
            value={formData.industryId}
            onValueChange={(value) => {
              setFormData((prev: any) => ({ ...prev, industryId: value, categoryId: "" }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngành hàng" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry: Industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="categoryId">Danh mục</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, categoryId: value }))}
            disabled={!formData.industryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((cat: Category) => cat.industryId === formData.industryId)
                .map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Price + Stock + Units */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="price">Giá tiền (VND) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1000"
            value={formData.price}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, price: e.target.value }))}
            placeholder="0"
            required
          />
        </div>
        <div>
          <Label htmlFor="stock">Số lượng tồn kho</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, stock: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="unitType">Loại đơn vị</Label>
          <Select
            value={formData.unitType}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, unitType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Đếm (cái, hộp)</SelectItem>
              <SelectItem value="weight">Cân (kg, gram)</SelectItem>
              <SelectItem value="volume">Thể tích (lít, ml)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit">Đơn vị</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, unit: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formData.unitType === 'weight' && (
                <>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="gram">gram</SelectItem>
                </>
              )}
              {formData.unitType === 'volume' && (
                <>
                  <SelectItem value="lít">lít</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                </>
              )}
              {formData.unitType === 'count' && (
                <>
                  <SelectItem value="cái">cái</SelectItem>
                  <SelectItem value="hộp">hộp</SelectItem>
                  <SelectItem value="gói">gói</SelectItem>
                  <SelectItem value="thùng">thùng</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 5: Description */}
      <div>
        <Label htmlFor="description">Mô tả chi tiết</Label>
        <RichTextEditor
          id="description"
          value={formData.description}
          onChange={(value) => setFormData((prev: any) => ({ ...prev, description: value }))}
          placeholder="Nhập mô tả sản phẩm hoặc sử dụng AI Generate để tự động tạo"
          height="120px"
          className="w-full mt-2"
        />
      </div>

      {/* Row 6: Media Upload */}
      <div>
        <Label>Hình ảnh & Video sản phẩm</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Upload hình ảnh và video để giới thiệu sản phẩm
        </p>
        <ImageUploader
          value={[...formData.images, ...formData.videos]}
          onChange={(media) => {
            const images = media.filter((m): m is CloudinaryImage => m.resource_type === 'image');
            const videos = media.filter((m): m is CloudinaryVideo => m.resource_type === 'video');
            setFormData((prev: any) => ({ ...prev, images, videos }));
          }}
          maxFiles={8}
          maxFileSize={50}
          acceptImages={true}
          acceptVideos={true}
          folder="products"
          className="mt-2"
        />
      </div>
    </div>
  );
}

function SEOTab({ formData, setFormData }: any) {
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const { toast } = useToast();

  const handleAutoGenerateSEO = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Cần có tên sản phẩm để tạo SEO data",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingSEO(true);
    try {
      console.log('🔍 Generating SEO for:', formData.name);
      
      const response = await fetch('/api/ai/generate-seo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productName: formData.name,
          productDescription: formData.description || formData.shortDescription,
          category: formData.categoryId, // We'll try to get category name later
          options: {
            targetMarket: 'vietnam',
            includeLocalKeywords: true
          }
        })
      });

      const result = await response.json();

      if (result.seo_title && result.seo_description && result.slug) {
        // Update form data with generated SEO content
        setFormData((prev: any) => ({
          ...prev,
          seoTitle: result.seo_title,
          seoDescription: result.seo_description,
          slug: result.slug,
          ogImageUrl: result.og_title ? `https://og-image-generator.com/api?title=${encodeURIComponent(result.og_title)}` : prev.ogImageUrl
        }));

        toast({
          title: "✨ SEO đã được tạo!",
          description: `Tạo thành công SEO cho "${formData.name}" với ${result.keywords?.length || 0} keywords tối ưu`,
        });

        console.log('🔍 SEO generation successful:', result);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('SEO generation error:', error);
      toast({
        title: "Lỗi tạo SEO",
        description: error.message || 'Không thể tạo dữ liệu SEO. Vui lòng thử lại.',
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Tối ưu hóa SEO và marketing cho sản phẩm
        </div>
        <Button 
          onClick={handleAutoGenerateSEO}
          disabled={isGeneratingSEO || !formData.name.trim()}
          variant="outline" 
          size="sm"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          {isGeneratingSEO ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tạo SEO...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              ✨ Auto Generate SEO
            </>
          )}
        </Button>
      </div>
      
      {/* SEO Basic */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, seoTitle: e.target.value }))}
            placeholder="Tiêu đề SEO (50-60 ký tự)"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.seoTitle.length}/60 ký tự
          </p>
        </div>
        
        <div>
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Textarea
            id="seoDescription"
            value={formData.seoDescription}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, seoDescription: e.target.value }))}
            placeholder="Mô tả SEO (150-160 ký tự)"
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.seoDescription.length}/160 ký tự
          </p>
        </div>
        
        <div>
          <Label htmlFor="slug">Slug URL</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, slug: e.target.value }))}
            placeholder="url-thân-thiện-cho-sản-phẩm"
          />
        </div>
      </div>

      {/* Product Marketing */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-gray-900">Marketing Content</h4>
        
        <div>
          <Label htmlFor="shortDescription">Mô tả ngắn (1-2 câu highlight)</Label>
          <Textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, shortDescription: e.target.value }))}
            placeholder="Mô tả ngắn gọn về sản phẩm"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="usageInstructions">Hướng dẫn sử dụng</Label>
          <Textarea
            id="usageInstructions"
            value={formData.usageInstructions}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, usageInstructions: e.target.value }))}
            placeholder="Cách sử dụng sản phẩm chi tiết"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="ogImageUrl">Open Graph Image URL</Label>
          <Input
            id="ogImageUrl"
            value={formData.ogImageUrl}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, ogImageUrl: e.target.value }))}
            placeholder="URL hình ảnh cho social sharing"
          />
        </div>
      </div>

      {/* Arrays for ingredients and benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <Label>Thành phần</Label>
          <div className="space-y-2 mt-2">
            {formData.ingredients.map((ingredient: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={ingredient}
                  onChange={(e) => {
                    const newIngredients = [...formData.ingredients];
                    newIngredients[index] = e.target.value;
                    setFormData((prev: any) => ({ ...prev, ingredients: newIngredients }));
                  }}
                  placeholder="Thành phần"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newIngredients = formData.ingredients.filter((_: any, i: number) => i !== index);
                    setFormData((prev: any) => ({ ...prev, ingredients: newIngredients }));
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData((prev: any) => ({ ...prev, ingredients: [...prev.ingredients, ''] }));
              }}
            >
              ➕ Thêm thành phần
            </Button>
          </div>
        </div>

        <div>
          <Label>Lợi ích</Label>
          <div className="space-y-2 mt-2">
            {formData.benefits.map((benefit: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => {
                    const newBenefits = [...formData.benefits];
                    newBenefits[index] = e.target.value;
                    setFormData((prev: any) => ({ ...prev, benefits: newBenefits }));
                  }}
                  placeholder="Lợi ích"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newBenefits = formData.benefits.filter((_: any, i: number) => i !== index);
                    setFormData((prev: any) => ({ ...prev, benefits: newBenefits }));
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData((prev: any) => ({ ...prev, benefits: [...prev.benefits, ''] }));
              }}
            >
              ➕ Thêm lợi ích
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AITab({ 
  formData, 
  generatedDescriptions, 
  showDescriptionPreview, 
  setShowDescriptionPreview, 
  isGenerating, 
  generateDescriptions, 
  copyToClipboard, 
  product, 
  salesData,
  setSalesData,
  handleSalesSave,
  salesMutation,
  moduleCollapseState,
  toggleModuleCollapse
}: any) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        AI tự động tạo nội dung và quản lý sales techniques nâng cao
      </div>
      
      {/* AI Description Generation */}
      <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium">🤖 AI Description Generator</h4>
          </div>
          <Button
            type="button"
            onClick={generateDescriptions}
            disabled={isGenerating || !formData.name.trim()}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Đang tạo...' : '🪄 Tự động tạo mô tả'}
          </Button>
        </div>

        {!formData.name.trim() && (
          <p className="text-xs text-muted-foreground">
            💡 Nhập tên sản phẩm ở tab "Cơ bản" trước để AI có thể tạo mô tả phù hợp
          </p>
        )}

        {/* Generated Descriptions Preview */}
        {generatedDescriptions && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-green-700">✅ Mô tả đã tạo bởi AI</h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDescriptionPreview(!showDescriptionPreview)}
              >
                {showDescriptionPreview ? (
                  <EyeOff className="h-3 w-3 mr-1" />
                ) : (
                  <Eye className="h-3 w-3 mr-1" />
                )}
                {showDescriptionPreview ? 'Ẩn' : 'Xem'} chi tiết
              </Button>
            </div>

            {showDescriptionPreview && (
              <div className="space-y-3">
                {/* Primary Description */}
                <div className="bg-white rounded p-3 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-700">Mô tả chính:</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedDescriptions.primary)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                    {generatedDescriptions.primary}
                  </p>
                </div>

                {/* RASA Variations */}
                <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                  <span className="text-sm font-medium text-blue-700 mb-2 block">🤖 RASA Chat Variations:</span>
                  <div className="grid gap-2">
                    {Object.entries(generatedDescriptions.rasa_variations || {}).map(([index, description]: [string, any]) => {
                      const contextLabels = {
                        "0": "🛡️ An toàn",
                        "1": "⚡ Tiện lợi", 
                        "2": "⭐ Chất lượng",
                        "3": "💚 Sức khỏe"
                      };
                      return (
                        <div key={index} className="flex items-start gap-2 bg-blue-50 p-2 rounded">
                          <span className="text-xs font-medium text-blue-600 min-w-fit">
                            {contextLabels[index as keyof typeof contextLabels]}:
                          </span>
                          <span className="text-sm text-gray-700 flex-1">{description}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(description)}
                            className="h-5 w-5 p-0 flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-600 mt-2 italic">
                    💡 RASA sẽ tự động chọn ngẫu nhiên 1 trong {Object.keys(generatedDescriptions.rasa_variations || {}).length} mô tả này khi chat với khách hàng
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sales Techniques Management - Full Implementation */}
      {product?.id ? (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">🚀 Sales Techniques Management</h4>
            </div>
            <Button
              type="button"
              onClick={handleSalesSave}
              disabled={salesMutation.isPending}
              variant="outline"
              size="sm"
            >
              {salesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {salesMutation.isPending ? 'Đang lưu...' : 'Lưu Sales Data'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Quản lý dữ liệu sales techniques nâng cao cho sản phẩm này. 
            Bao gồm 5 modules: Urgency, Social Proof, Personalization, Leading Questions, và Objection Handling.
          </p>
          
          {/* Sales Techniques Forms */}
          <div className="space-y-6">
            {/* 1. Urgency Data */}
            <SalesModuleSection
              title="🚨 Urgency Data - Tạo Cảm Giác Khẩn Cấp"
              icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
              moduleKey="urgency"
              isOpen={moduleCollapseState.urgency}
              onToggle={toggleModuleCollapse}
            >
              <UrgencyDataForm
                data={salesData.urgencyData}
                onChange={(data) => setSalesData((prev: any) => ({ ...prev, urgencyData: data }))}
              />
            </SalesModuleSection>

            {/* 2. Social Proof Data */}
            <SalesModuleSection
              title="👥 Social Proof Data - Bằng Chứng Xã Hội"
              icon={<Users className="h-5 w-5 text-blue-600" />}
              moduleKey="socialProof"
              isOpen={moduleCollapseState.socialProof}
              onToggle={toggleModuleCollapse}
            >
              <SocialProofDataForm
                data={salesData.socialProofData}
                onChange={(data) => setSalesData((prev: any) => ({ ...prev, socialProofData: data }))}
              />
            </SalesModuleSection>

            {/* 3. Personalization Data */}
            <SalesModuleSection
              title="🎯 Personalization Data - Cá Nhân Hóa"
              icon={<Target className="h-5 w-5 text-green-600" />}
              moduleKey="personalization"
              isOpen={moduleCollapseState.personalization}
              onToggle={toggleModuleCollapse}
            >
              <PersonalizationDataForm
                data={salesData.personalizationData}
                onChange={(data) => setSalesData((prev: any) => ({ ...prev, personalizationData: data }))}
              />
            </SalesModuleSection>

            {/* 4. Leading Questions Data */}
            <SalesModuleSection
              title="❓ Leading Questions Data - Câu Hỏi Dẫn Dắt"
              icon={<MessageCircle className="h-5 w-5 text-purple-600" />}
              moduleKey="leadingQuestions"
              isOpen={moduleCollapseState.leadingQuestions}
              onToggle={toggleModuleCollapse}
            >
              <LeadingQuestionsDataForm
                data={salesData.leadingQuestionsData}
                onChange={(data) => setSalesData((prev: any) => ({ ...prev, leadingQuestionsData: data }))}
              />
            </SalesModuleSection>

            {/* 5. Objection Handling Data */}
            <SalesModuleSection
              title="🛡️ Objection Handling Data - Xử Lý Phản Đối"
              icon={<ShieldCheck className="h-5 w-5 text-red-600" />}
              moduleKey="objectionHandling"
              isOpen={moduleCollapseState.objectionHandling}
              onToggle={toggleModuleCollapse}
            >
              <ObjectionHandlingDataForm
                data={salesData.objectionHandlingData}
                onChange={(data) => setSalesData((prev: any) => ({ ...prev, objectionHandlingData: data }))}
              />
            </SalesModuleSection>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-400" />
            <h4 className="font-medium text-gray-600">🚀 Sales Techniques Management</h4>
          </div>
          <p className="text-sm text-gray-600">
            Sales techniques sẽ khả dụng sau khi lưu sản phẩm lần đầu. 
            Hãy điền thông tin cơ bản và lưu sản phẩm trước.
          </p>
        </div>
      )}
    </div>
  );
}