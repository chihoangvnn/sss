import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Wand2, Loader2, Eye, EyeOff, Copy, QrCode, HelpCircle, Target } from "lucide-react";
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
  ObjectionHandlingDataForm 
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
}

interface CategoryConsultationConfig {
  enabled_types: string[];
  required_fields: string[];
  optional_fields: string[];
  auto_prompts: string[];
}

interface CategoryConsultationTemplates {
  usage_guide_template?: string;
  safety_template?: string;
  recipe_template?: string;
  technical_template?: string;
  benefits_template?: string;
  care_template?: string;
  storage_template?: string;
  health_benefits_template?: string;
  skin_benefits_template?: string;
  care_instructions_template?: string;
  troubleshooting_template?: string;
  compatibility_template?: string;
}

interface CategorySalesTemplate {
  template?: string;
  target_customer_prompts?: string[];
  selling_point_prompts?: string[];
  objection_handling?: string[];
  cross_sell_suggestions?: string[];
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
  consultationConfig?: CategoryConsultationConfig;
  consultationTemplates?: CategoryConsultationTemplates;
  salesAdviceTemplate?: CategorySalesTemplate;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// Sales Techniques Management Component
interface SalesTechniquesManagementProps {
  productId: string;
  initialData: {
    urgencyData: UrgencyData | null;
    socialProofData: SocialProofData | null;
    personalizationData: PersonalizationData | null;
    leadingQuestionsData: LeadingQuestionsData | null;
    objectionHandlingData: ObjectionHandlingData | null;
  };
}

function SalesTechniquesManagement({ productId, initialData }: SalesTechniquesManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createDefaultData = () => ({
    urgencyData: {
      low_stock_threshold: 10,
      is_limited_edition: false,
      sales_velocity: 0,
      urgency_messages: [],
      demand_level: "medium" as const,
      trending_platforms: [] as string[]
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
          income_level: "middle" as const,
          lifestyle: [],
          location: []
        }
      },
      skin_types: [],
      lifestyle_tags: [],
      personality_match: [],
      usage_scenarios: [],
      problem_solving: [],
      seasonal_relevance: [],
      profession_fit: [],
      income_bracket: ""
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

  const [salesData, setSalesData] = useState(() => {
    const defaults = createDefaultData();
    return {
      urgencyData: { 
        ...defaults.urgencyData, 
        ...(initialData.urgencyData || {}),
        trending_platforms: initialData.urgencyData?.trending_platforms ?? []
      },
      socialProofData: { ...defaults.socialProofData, ...(initialData.socialProofData || {}) },
      personalizationData: { ...defaults.personalizationData, ...(initialData.personalizationData || {}) },
      leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(initialData.leadingQuestionsData || {}) },
      objectionHandlingData: { ...defaults.objectionHandlingData, ...(initialData.objectionHandlingData || {}) }
    };
  });

  useEffect(() => {
    const defaults = createDefaultData();
    setSalesData({
      urgencyData: { 
        ...defaults.urgencyData, 
        ...(initialData.urgencyData || {}),
        trending_platforms: initialData.urgencyData?.trending_platforms ?? []
      },
      socialProofData: { ...defaults.socialProofData, ...(initialData.socialProofData || {}) },
      personalizationData: { ...defaults.personalizationData, ...(initialData.personalizationData || {}) },
      leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(initialData.leadingQuestionsData || {}) },
      objectionHandlingData: { ...defaults.objectionHandlingData, ...(initialData.objectionHandlingData || {}) }
    });
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof salesData) => {
      const response = await apiRequest('PUT', `/api/products/${productId}/sales-techniques`, data);
      if (!response.ok) {
        throw new Error('Failed to save sales techniques');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu dữ liệu sales techniques"
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu dữ liệu",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(salesData);
  };

  return (
    <Card className="w-full max-w-2xl mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">🚀 Sales Techniques Management</CardTitle>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            variant="default"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Quản lý dữ liệu sales techniques nâng cao cho sản phẩm
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <UrgencyDataForm
          data={salesData.urgencyData}
          onChange={(data) => setSalesData(prev => ({ ...prev, urgencyData: { ...data, trending_platforms: data.trending_platforms ?? [] } }))}
        />

        <SocialProofDataForm
          data={salesData.socialProofData}
          onChange={(data) => setSalesData(prev => ({ ...prev, socialProofData: data }))}
        />

        <PersonalizationDataForm
          data={salesData.personalizationData}
          onChange={(data) => setSalesData(prev => ({ ...prev, personalizationData: data }))}
        />

        <LeadingQuestionsDataForm
          data={salesData.leadingQuestionsData}
          onChange={(data) => setSalesData(prev => ({ ...prev, leadingQuestionsData: data }))}
        />

        <ObjectionHandlingDataForm
          data={salesData.objectionHandlingData}
          onChange={(data) => setSalesData(prev => ({ ...prev, objectionHandlingData: data }))}
        />

      </CardContent>
    </Card>
  );
}

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);

  const memoizedSalesTechniquesData = useMemo(() => ({
    urgencyData: product?.urgencyData || null,
    socialProofData: product?.socialProofData || null,
    personalizationData: product?.personalizationData || null,
    leadingQuestionsData: product?.leadingQuestionsData || null,
    objectionHandlingData: product?.objectionHandlingData || null,
  }), [
    product?.id,
    product?.urgencyData,
    product?.socialProofData,
    product?.personalizationData,
    product?.leadingQuestionsData,
    product?.objectionHandlingData
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    itemCode: "",
    price: "",
    stock: "0",
    industryId: "",
    categoryId: "",
    status: "active" as "active" | "inactive" | "out-of-stock",
    image: "",
    images: [] as CloudinaryImage[],
    videos: [] as CloudinaryVideo[],
  });
  
  const [consultationFields, setConsultationFields] = useState<Record<string, string>>({});
  const [categoryConfig, setCategoryConfig] = useState<{
    config?: CategoryConsultationConfig;
    templates?: CategoryConsultationTemplates;
  }>({});
  const [requiredFieldsError, setRequiredFieldsError] = useState<string[]>([]);
  
  const prevCategoryIdRef = useRef<string | null>(null);

  const [generatedDescriptions, setGeneratedDescriptions] = useState<RasaDescriptions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Fetch industries and categories
  const { data: industries = [], isLoading: industriesLoading, error: industriesError } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const isLoading = industriesLoading || categoriesLoading;
  const fetchError = industriesError || categoriesError;

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        itemCode: (product as any).itemCode || "",
        price: product.price,
        stock: product.stock.toString(),
        industryId: "",
        categoryId: product.categoryId || "",
        status: product.status,
        image: product.image || "",
        images: product.images || [],
        videos: product.videos || [],
      });
      
      if (product.descriptions && typeof product.descriptions === 'object') {
        setGeneratedDescriptions(product.descriptions);
        setShowDescriptionPreview(true);
      } else {
        setGeneratedDescriptions(null);
        setShowDescriptionPreview(false);
      }
      
      if ((product as any).consultationData && typeof (product as any).consultationData === 'object') {
        setConsultationFields((product as any).consultationData);
        prevCategoryIdRef.current = product.categoryId || null;
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
  
  // Auto-load consultation config when category changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (selectedCategory && selectedCategory.consultationConfig) {
        setCategoryConfig({
          config: selectedCategory.consultationConfig,
          templates: selectedCategory.consultationTemplates || {}
        });
        
        const hasExistingFields = Object.keys(consultationFields).length > 0;
        const actualCategoryChanged = prevCategoryIdRef.current !== formData.categoryId;
        const shouldInitialize = !hasExistingFields || actualCategoryChanged;
        
        if (shouldInitialize) {
          const newConsultationFields: Record<string, string> = {};
          const templates = selectedCategory.consultationTemplates || {};
          
          selectedCategory.consultationConfig?.required_fields?.forEach(fieldId => {
            const templateKey = `${fieldId}_template` as keyof CategoryConsultationTemplates;
            const templateContent = templates[templateKey];
            
            if (templateContent) {
              newConsultationFields[fieldId] = templateContent;
            } else if (selectedCategory.consultationConfig?.auto_prompts && selectedCategory.consultationConfig.auto_prompts.length > 0) {
              newConsultationFields[fieldId] = selectedCategory.consultationConfig.auto_prompts[0];
            } else {
              newConsultationFields[fieldId] = '';
            }
          });
          
          selectedCategory.consultationConfig?.optional_fields?.forEach(fieldId => {
            const templateKey = `${fieldId}_template` as keyof CategoryConsultationTemplates;
            const templateContent = templates[templateKey];
            newConsultationFields[fieldId] = templateContent || '';
          });
          
          setConsultationFields(newConsultationFields);
          setRequiredFieldsError([]);
        }
        
        prevCategoryIdRef.current = formData.categoryId;
        
        if (selectedCategory.consultationTemplates && Object.keys(selectedCategory.consultationTemplates).length > 0 && !formData.description.trim()) {
          const templateKeys = Object.keys(selectedCategory.consultationTemplates) as (keyof CategoryConsultationTemplates)[];
          const firstTemplate = selectedCategory.consultationTemplates[templateKeys[0]];
          if (firstTemplate) {
            setFormData(prev => ({
              ...prev,
              description: firstTemplate
            }));
            toast({
              title: "✨ Template auto-loaded",
              description: `Đã tự động tải template từ category "${selectedCategory.name}" vào mô tả sản phẩm`
            });
          }
        }
      } else {
        setCategoryConfig({});
        setConsultationFields({});
        setRequiredFieldsError([]);
      }
    }
  }, [formData.categoryId, categories, toast]);

  // Validation function
  const validateConsultationFields = () => {
    if (!categoryConfig.config) return true;
    
    const { required_fields = [] } = categoryConfig.config;
    const emptyRequired = required_fields.filter(fieldId => !consultationFields[fieldId]?.trim());
    
    if (emptyRequired.length > 0) {
      setRequiredFieldsError(emptyRequired);
      const fieldLabels: Record<string, string> = {
        usage_guide: 'Hướng dẫn sử dụng',
        safety: 'Thông tin an toàn',
        recipe: 'Công thức / Recipe',
        technical: 'Thông số kỹ thuật',
        benefits: 'Lợi ích',
        care: 'Cách chăm sóc',
        storage: 'Bảo quản',
        health_benefits: 'Lợi ích sức khỏe',
        skin_benefits: 'Lợi ích cho da',
        care_instructions: 'Hướng dẫn chăm sóc',
        troubleshooting: 'Xử lý sự cố',
        compatibility: 'Tương thích'
      };
      
      const missingLabels = emptyRequired.map(field => fieldLabels[field] || field).join(', ');
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: `Vui lòng điền: ${missingLabels}`,
        variant: "destructive",
      });
      return false;
    }
    
    setRequiredFieldsError([]);
    return true;
  };

  // Save product mutation
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

  // Generate AI descriptions
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

      let consultationContext = '';
      if (Object.keys(consultationFields).length > 0) {
        const consultationEntries = Object.entries(consultationFields)
          .filter(([_, value]) => value && value.trim())
          .map(([key, value]) => `${getFieldLabel(key)}: ${value}`);
        
        if (consultationEntries.length > 0) {
          consultationContext = `THÔNG TIN TƯ VẤN CHUYÊN NGHIỆP:\n${consultationEntries.join('\n')}`;
        }
      }

      const response = await fetch('/api/ai/generate-product-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          industryName: selectedIndustry?.name,
          categoryName: selectedCategory?.name,
          consultationData: consultationFields,
          options: {
            targetLanguage: 'vietnamese',
            customContext: consultationContext
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo mô tả');
      }

      const result = await response.json();
      setGeneratedDescriptions(result.descriptions);
      setShowDescriptionPreview(true);
      
      toast({
        title: "🤖 AI đã tạo mô tả thành công!",
        description: "Đã tạo 5 phiên bản mô tả chuyên nghiệp cho sản phẩm",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tạo mô tả AI",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // QR Scanner handler
  const handleQRScan = (scannedData: string) => {
    setFormData(prev => ({ ...prev, itemCode: scannedData }));
    toast({
      title: "QR Code quét thành công!",
      description: `Mã sản phẩm: ${scannedData}`,
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Đã copy!",
        description: "Mô tả đã được copy vào clipboard",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể copy mô tả",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên sản phẩm không được để trống",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Lỗi", 
        description: "Giá sản phẩm phải lớn hơn 0",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateConsultationFields()) {
      return;
    }

    const saveData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      itemCode: formData.itemCode.trim() || undefined,
      price: formData.price,
      stock: parseInt(formData.stock) || 0,
      categoryId: formData.categoryId && formData.categoryId !== "none" ? formData.categoryId : undefined,
      status: formData.status,
      image: formData.image.trim() || undefined,
      images: formData.images || [],
      videos: formData.videos || [],
      descriptions: generatedDescriptions ?? undefined,
      defaultImageIndex: 0,
      consultationData: Object.keys(consultationFields).length > 0 ? consultationFields : undefined,
    };

    saveMutation.mutate(saveData);
  };

  // Filter categories based on selected industry
  const filteredCategories = categories.filter(category => {
    const industryMatch = formData.industryId ? category.industryId === formData.industryId : true;
    return category.isActive && industryMatch;
  });

  const activeIndustries = industries.filter(industry => industry.isActive);

  // Handle industry change - reset category selection
  const handleIndustryChange = (industryId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      industryId,
      categoryId: "" // Reset category when industry changes
    }));
    setConsultationFields({});
    setCategoryConfig({});
    setRequiredFieldsError([]);
  };

  // Get field label helper
  const getFieldLabel = (fieldId: string) => {
    const fieldLabels: Record<string, string> = {
      usage_guide: 'Hướng dẫn sử dụng',
      safety: 'Thông tin an toàn',
      recipe: 'Công thức / Recipe',
      technical: 'Thông số kỹ thuật',
      benefits: 'Lợi ích',
      care: 'Cách chăm sóc',
      storage: 'Bảo quản',
      health_benefits: 'Lợi ích sức khỏe',
      skin_benefits: 'Lợi ích cho da',
      care_instructions: 'Hướng dẫn chăm sóc',
      troubleshooting: 'Xử lý sự cố',
      compatibility: 'Tương thích'
    };
    return fieldLabels[fieldId] || fieldId.replace(/_/g, ' ');
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Lỗi khi tải dữ liệu</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onClose} variant="outline">Đóng</Button>
                <Button onClick={() => window.location.reload()}>Thử lại</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="max-h-[80vh] overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Tên sản phẩm
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên sản phẩm..."
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku" className="text-sm font-medium">Mã SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || (isEditing ? "Chưa có SKU" : "Auto-gen")}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isEditing ? "SKU đã được tạo" : "Tự động tạo khi lưu"}
                </p>
              </div>
            </div>

            {/* Item Code with QR Scanner */}
            <div className="space-y-2">
              <Label htmlFor="itemCode" className="text-sm font-medium">Mã sản phẩm (Item Code)</Label>
              <div className="flex gap-3">
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                  placeholder="Nhập mã sản phẩm hoặc quét QR..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQRScannerOpen(true)}
                  className="px-4 border-2 border-dashed border-purple-300 hover:border-purple-500"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Quét QR
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                📱 Mã để quản lý kho - có thể là barcode, QR code hoặc mã tự định nghĩa
              </p>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Giá bán (VNĐ)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock" className="text-sm font-medium">Số lượng tồn kho</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Industry & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry" className="text-sm font-medium">Ngành hàng</Label>
                <Select onValueChange={handleIndustryChange} value={formData.industryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn ngành hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeIndustries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Danh mục</Label>
                <Select 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} 
                  value={formData.categoryId}
                  disabled={!formData.industryId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có danh mục</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description" className="text-sm font-medium">Mô tả sản phẩm</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateDescriptions}
                  disabled={isGenerating || !formData.name.trim()}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Đang tạo...' : 'Tạo mô tả AI'}
                </Button>
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Nhập mô tả sản phẩm..."
              />
            </div>

            {/* AI Generated Descriptions Preview */}
            {generatedDescriptions && showDescriptionPreview && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg text-purple-800">🤖 Mô tả AI đã tạo</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDescriptionPreview(false)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {showDescriptionPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(generatedDescriptions).map(([key, description]) => (
                    <div key={key} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm capitalize text-gray-800">
                          {key.replace('_', ' ')}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(description)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Category-driven Consultation Fields */}
            {categoryConfig.config && categoryConfig.config.enabled_types.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg text-green-800">🤖 Thông tin tư vấn chuyên nghiệp</CardTitle>
                  </div>
                  <p className="text-sm text-green-700">
                    Điền thông tin chuyên nghiệp để AI tạo nội dung tư vấn chính xác
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Required Fields */}
                  {categoryConfig.config.required_fields?.map(fieldId => (
                    <div key={fieldId}>
                      <Label htmlFor={fieldId} className="text-sm font-medium text-green-800">
                        <span className="text-red-500">*</span> {getFieldLabel(fieldId)}
                      </Label>
                      <Textarea
                        id={fieldId}
                        value={consultationFields[fieldId] || ''}
                        onChange={(e) => setConsultationFields(prev => ({ ...prev, [fieldId]: e.target.value }))}
                        placeholder={`Nhập ${getFieldLabel(fieldId).toLowerCase()}...`}
                        className={`mt-1 ${requiredFieldsError.includes(fieldId) ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
                        rows={3}
                      />
                      {requiredFieldsError.includes(fieldId) && (
                        <p className="text-xs text-red-500 mt-1">Trường này là bắt buộc</p>
                      )}
                    </div>
                  ))}

                  {/* Optional Fields */}
                  {categoryConfig.config.optional_fields?.map(fieldId => (
                    <div key={fieldId}>
                      <Label htmlFor={fieldId} className="text-sm font-medium text-green-700">
                        {getFieldLabel(fieldId)} (Tuỳ chọn)
                      </Label>
                      <Textarea
                        id={fieldId}
                        value={consultationFields[fieldId] || ''}
                        onChange={(e) => setConsultationFields(prev => ({ ...prev, [fieldId]: e.target.value }))}
                        placeholder={`Nhập ${getFieldLabel(fieldId).toLowerCase()}...`}
                        className="mt-1 border-green-200 focus:border-green-400"
                        rows={2}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Hình ảnh sản phẩm</Label>
              <ImageUploader
                value={formData.images}
                onChange={(media: (CloudinaryImage | CloudinaryVideo)[]) => setFormData(prev => ({ ...prev, images: media.filter(m => 'width' in m) as CloudinaryImage[] }))}
                maxFiles={10}
                className="w-full"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium">Trạng thái</Label>
              <Select onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))} value={formData.status}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  <SelectItem value="out-of-stock">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cập nhật' : 'Tạo sản phẩm'}
                  </>
                )}
              </Button>
            </div>

          </form>

          {/* Sales Techniques Management */}
          {isEditing && product && (
            <SalesTechniquesManagement 
              productId={product.id} 
              initialData={memoizedSalesTechniquesData}
            />
          )}

        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {isQRScannerOpen && (
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScan={(result) => {
            setFormData(prev => ({ ...prev, itemCode: result }));
            setIsQRScannerOpen(false);
          }}
        />
      )}
    </div>
  );
};