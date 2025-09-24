import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Wand2, Loader2, Eye, EyeOff, Copy, QrCode, HelpCircle, Target, ChevronLeft, ChevronRight, Package, Image, Settings, Sparkles, CheckCircle } from "lucide-react";
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
  sku?: string; // Auto-generated SKU
  itemCode?: string; // QR/Barcode scanner input for inventory management
  price: string;
  stock: number;
  categoryId?: string;
  status: "active" | "inactive" | "out-of-stock";
  image?: string; // Deprecated - kept for backward compatibility
  images?: CloudinaryImage[];
  videos?: CloudinaryVideo[];
  // 🤖 AI-generated descriptions for RASA  
  descriptions?: RasaDescriptions;
  defaultImageIndex?: number;
  // 🚀 Advanced Sales Technique Data
  urgencyData?: UrgencyData | null;
  socialProofData?: SocialProofData | null;
  personalizationData?: PersonalizationData | null;
  leadingQuestionsData?: LeadingQuestionsData | null;
  objectionHandlingData?: ObjectionHandlingData | null;
}

// Consultation configuration types
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
  
  // Helper function to create default data structures
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

  // Initialize state with proper defaults and merge with actual data
  const [salesData, setSalesData] = useState(() => {
    const defaults = createDefaultData();
    return {
      urgencyData: { 
        ...defaults.urgencyData, 
        ...(initialData.urgencyData || {}),
        trending_platforms: initialData.urgencyData?.trending_platforms || []
      },
      socialProofData: { ...defaults.socialProofData, ...(initialData.socialProofData || {}) },
      personalizationData: { ...defaults.personalizationData, ...(initialData.personalizationData || {}) },
      leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(initialData.leadingQuestionsData || {}) },
      objectionHandlingData: { ...defaults.objectionHandlingData, ...(initialData.objectionHandlingData || {}) }
    };
  });

  // 🔄 CRITICAL FIX: Sync state with initialData when it changes
  useEffect(() => {
    const defaults = createDefaultData();
    setSalesData({
      urgencyData: { 
        ...defaults.urgencyData, 
        ...(initialData.urgencyData || {}),
        trending_platforms: initialData.urgencyData?.trending_platforms || []
      },
      socialProofData: { ...defaults.socialProofData, ...(initialData.socialProofData || {}) },
      personalizationData: { ...defaults.personalizationData, ...(initialData.personalizationData || {}) },
      leadingQuestionsData: { ...defaults.leadingQuestionsData, ...(initialData.leadingQuestionsData || {}) },
      objectionHandlingData: { ...defaults.objectionHandlingData, ...(initialData.objectionHandlingData || {}) }
    });
  }, [initialData]);

  // Save mutation
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
        
        {/* Urgency Data */}
        <UrgencyDataForm
          data={salesData.urgencyData}
          onChange={(data) => setSalesData(prev => ({ ...prev, urgencyData: data }))}
        />

        {/* Social Proof Data */}
        <SocialProofDataForm
          data={salesData.socialProofData}
          onChange={(data) => setSalesData(prev => ({ ...prev, socialProofData: data }))}
        />

        {/* Personalization Data */}
        <PersonalizationDataForm
          data={salesData.personalizationData}
          onChange={(data) => setSalesData(prev => ({ ...prev, personalizationData: data }))}
        />

        {/* Leading Questions Data */}
        <LeadingQuestionsDataForm
          data={salesData.leadingQuestionsData}
          onChange={(data) => setSalesData(prev => ({ ...prev, leadingQuestionsData: data }))}
        />

        {/* Objection Handling Data */}
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

  // 🔄 CRITICAL MEMOIZATION: Stabilize initialData to prevent unnecessary re-renders and state resets
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
    sku: "", // Will be auto-generated
    itemCode: "", // Manual input or QR scan
    price: "",
    stock: "0",
    industryId: "",
    categoryId: "",
    status: "active" as "active" | "inactive" | "out-of-stock",
    image: "", // Deprecated - kept for backward compatibility
    images: [] as CloudinaryImage[],
    videos: [] as CloudinaryVideo[],
  });
  
  // 🤖 Category-driven consultation fields state
  const [consultationFields, setConsultationFields] = useState<Record<string, string>>({});
  const [categoryConfig, setCategoryConfig] = useState<{
    config?: CategoryConsultationConfig;
    templates?: CategoryConsultationTemplates;
  }>({});
  const [requiredFieldsError, setRequiredFieldsError] = useState<string[]>([]);
  
  // 🔄 Track previous categoryId to prevent false category changes
  const prevCategoryIdRef = useRef<string | null>(null);

  // 🤖 AI Generated Descriptions State
  const [generatedDescriptions, setGeneratedDescriptions] = useState<RasaDescriptions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

  // 📱 QR Scanner State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // 🚀 UX Enhancement States
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [progressData, setProgressData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 🧙‍♂️ Modern Wizard State Management
  const [currentStep, setCurrentStep] = useState(0);
  
  // ✨ Wizard Steps Configuration
  const wizardSteps = [
    {
      id: 'basic',
      title: 'Thông tin cơ bản',
      icon: Package,
      description: 'Tên, giá và thông tin sản phẩm',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'details',
      title: 'Chi tiết & Media',
      icon: Image,
      description: 'Mô tả, hình ảnh và video',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'category',
      title: 'Phân loại & Tư vấn',
      icon: Target,
      description: 'Ngành hàng và thông tin tư vấn',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'advanced',
      title: 'Nâng cao',
      icon: Sparkles,
      description: 'Kỹ thuật bán hàng và SEO',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // 🎯 Step Navigation Functions
  const canGoNext = () => {
    if (currentStep === 0) {
      return formData.name.trim() && formData.price && parseFloat(formData.price) > 0;
    }
    if (currentStep === 1) {
      return formData.description.trim();
    }
    if (currentStep === 2) {
      return formData.categoryId && validateConsultationFields();
    }
    return true; // Final step
  };

  const nextStep = () => {
    if (canGoNext() && currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < wizardSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Fetch industries for dropdown
  const { data: industries = [], isLoading: industriesLoading, error: industriesError } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  // Fetch categories for dropdown
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
        sku: product.sku || "", // Load existing SKU
        itemCode: (product as any).itemCode || "", // Load existing itemCode
        price: product.price,
        stock: product.stock.toString(),
        industryId: "",
        categoryId: product.categoryId || "",
        status: product.status,
        image: product.image || "",
        images: product.images || [],
        videos: product.videos || [],
      });
      
      // 🤖 Load existing AI descriptions if available
      if (product.descriptions && typeof product.descriptions === 'object') {
        setGeneratedDescriptions(product.descriptions);
        setShowDescriptionPreview(true); // Show preview if descriptions exist
      } else {
        setGeneratedDescriptions(null);
        setShowDescriptionPreview(false);
      }
      
      // 🤖 Load existing consultation data if available (rehydration happens first)
      if ((product as any).consultationData && typeof (product as any).consultationData === 'object') {
        console.log('🔄 Rehydrating consultation fields from existing product:', (product as any).consultationData);
        setConsultationFields((product as any).consultationData);
        // Set initial categoryId ref to prevent false changes during rehydration
        prevCategoryIdRef.current = product.categoryId || null;
      }
    }
  }, [product]);

  // Auto-select industry when editing and categories are loaded
  useEffect(() => {
    if (product && product.categoryId && categories.length > 0 && !formData.industryId) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        setFormData(prev => ({ ...prev, industryId: category.industryId }));
      }
    }
  }, [product, categories, formData.industryId]);
  
  // 🤖 Auto-load consultation config when category changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (selectedCategory && selectedCategory.consultationConfig) {
        console.log('🤖 Auto-loading consultation config for category:', selectedCategory.name);
        
        // Set category consultation configuration
        setCategoryConfig({
          config: selectedCategory.consultationConfig,
          templates: selectedCategory.consultationTemplates || {}
        });
        
        // 🔄 Robust gating: Track actual category changes and prevent clobbering
        const hasExistingFields = Object.keys(consultationFields).length > 0;
        const actualCategoryChanged = prevCategoryIdRef.current !== formData.categoryId;
        const shouldInitialize = !hasExistingFields || actualCategoryChanged;
        
        console.log('🔄 Gating decision: hasExisting=', hasExistingFields, ', actualChanged=', actualCategoryChanged, ', shouldInit=', shouldInitialize, ', prev=', prevCategoryIdRef.current, ', current=', formData.categoryId);
        
        if (shouldInitialize) {
          console.log('🤖 Initializing consultation fields with templates');
          
          // Initialize consultation fields with template values and auto-prompts
          const newConsultationFields: Record<string, string> = {};
          const templates = selectedCategory.consultationTemplates || {};
          
          // Fill required fields with template content or auto-prompts
          selectedCategory.consultationConfig?.required_fields?.forEach(fieldId => {
            // Try to find matching template for this field
            const templateKey = `${fieldId}_template` as keyof CategoryConsultationTemplates;
            const templateContent = templates[templateKey];
            
            if (templateContent) {
              newConsultationFields[fieldId] = templateContent;
            } else if (selectedCategory.consultationConfig?.auto_prompts && selectedCategory.consultationConfig.auto_prompts.length > 0) {
              // Use first auto-prompt as default content
              newConsultationFields[fieldId] = selectedCategory.consultationConfig.auto_prompts[0];
            } else {
              newConsultationFields[fieldId] = '';
            }
          });
          
          // Fill optional fields with template content
          selectedCategory.consultationConfig?.optional_fields?.forEach(fieldId => {
            const templateKey = `${fieldId}_template` as keyof CategoryConsultationTemplates;
            const templateContent = templates[templateKey];
            newConsultationFields[fieldId] = templateContent || '';
          });
          
          setConsultationFields(newConsultationFields);
          setRequiredFieldsError([]); // Reset validation errors
        } else {
          console.log('🔄 Preserving existing consultation fields');
        }
        
        // Update previous categoryId reference
        prevCategoryIdRef.current = formData.categoryId;
        
        // Auto-fill description with first available template if description is empty
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
        // Clear consultation config if no category or no config
        setCategoryConfig({});
        setConsultationFields({});
        setRequiredFieldsError([]);
      }
    }
  }, [formData.categoryId, categories, toast]);

  // 🚀 UX ENHANCEMENTS: Auto-save functionality với debouncing (only when dirty)
  useEffect(() => {
    if (!isEditing && isDirty && Object.values(fieldTouched).some(Boolean)) {
      const timer = setTimeout(() => {
        setAutoSaveStatus('saving');
        // Safe auto-save với separated metadata
        const draftData = { 
          formData, 
          consultationFields, 
          currentStep,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('productFormDraft', JSON.stringify(draftData));
        
        setTimeout(() => {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        }, 500);
      }, 1500); // Auto-save after 1.5s of inactivity

      return () => clearTimeout(timer);
    }
  }, [formData, consultationFields, currentStep, isEditing, isDirty, fieldTouched]);

  // 🎯 Smart field validation với real-time feedback
  const validateField = (fieldName: string, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) error = 'Tên sản phẩm là bắt buộc';
        else if (value.length < 3) error = 'Tên sản phẩm phải ít nhất 3 ký tự';
        else if (value.length > 100) error = 'Tên sản phẩm không được quá 100 ký tự';
        break;
      case 'price':
        if (!value) error = 'Giá sản phẩm là bắt buộc';
        else if (parseFloat(value) <= 0) error = 'Giá phải lớn hơn 0';
        else if (parseFloat(value) > 1000000000) error = 'Giá không được quá 1 tỷ VNĐ';
        break;
      case 'stock':
        if (parseInt(value) < 0) error = 'Số lượng không được âm';
        break;
      case 'description':
        if (currentStep >= 1 && !value.trim()) error = 'Mô tả sản phẩm là bắt buộc';
        else if (value.length > 1000) error = 'Mô tả không được quá 1000 ký tự';
        break;
    }
    
    return error;
  };

  // 🔄 Handle field changes với validation
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    setIsDirty(true); // Mark form as dirty
    
    // Real-time validation
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // 💾 Load draft data on mount (progress persistence)
  useEffect(() => {
    if (!isEditing) {
      const draftData = localStorage.getItem('productFormDraft');
      if (draftData) {
        try {
          const parsed = JSON.parse(draftData);
          const age = new Date().getTime() - new Date(parsed.timestamp).getTime();
          
          // Only restore draft if less than 24 hours old
          if (age < 24 * 60 * 60 * 1000) {
            setProgressData(parsed);
            toast({
              title: "📄 Bản nháp được tìm thấy",
              description: "Bạn có dữ liệu chưa hoàn thành. Bấm để khôi phục bản nháp.",
              action: (
                <Button 
                  size="sm" 
                  onClick={() => {
                    // 🔧 SAFE: Only restore valid formData fields
                    setFormData(parsed.formData || parsed); // Handle both old and new format
                    setConsultationFields(parsed.consultationFields || {});
                    setCurrentStep(parsed.currentStep || 0);
                    setIsDirty(true); // Mark as dirty since we’re restoring data
                    setProgressData(null);
                    localStorage.removeItem('productFormDraft');
                    toast({
                      title: "✅ Đã khôi phục",
                      description: "Dữ liệu bản nháp đã được khôi phục thành công"
                    });
                  }}
                >
                  Khôi phục
                </Button>
              )
            });
          }
        } catch (e) {
          console.warn('Failed to parse draft data:', e);
          localStorage.removeItem('productFormDraft');
        }
      }
    }
  }, [isEditing, toast]);

  // Show error if data fetch fails
  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
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

  // 🤖 AI Content Generation Function
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
      // Get industry and category names
      const selectedIndustry = industries.find(i => i.id === formData.industryId);
      const selectedCategory = categories.find(c => c.id === formData.categoryId);

      // 🧠 Build intelligent consultation context
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
          consultationData: consultationFields, // 🤖 Pass structured consultation data
          options: {
            targetLanguage: 'vietnamese',
            customContext: consultationContext // 🧠 Include professional consultation context
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo mô tả');
      }

      const result = await response.json();
      setGeneratedDescriptions(result);
      
      // Auto-fill primary description
      setFormData(prev => ({
        ...prev,
        description: result.primary
      }));
      
      setShowDescriptionPreview(true);

      toast({
        title: "Thành công! 🎉",
        description: `Đã tạo 1 mô tả chính + ${Object.keys(result.rasa_variations || {}).length} biến thể RASA`,
      });

    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo mô tả tự động",
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

  // Copy description to clipboard
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
    
    // 🤖 Validate category-driven consultation fields
    if (!validateConsultationFields()) {
      return; // Validation failed, stop submission
    }

    const saveData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      itemCode: formData.itemCode.trim() || undefined,
      price: formData.price, // Send as string to match backend
      stock: parseInt(formData.stock) || 0,
      categoryId: formData.categoryId && formData.categoryId !== "none" ? formData.categoryId : undefined,
      status: formData.status,
      image: formData.image.trim() || undefined,
      images: formData.images || [],
      videos: formData.videos || [],
      // 🤖 Include AI generated descriptions for RASA (only if exists)
      descriptions: generatedDescriptions ?? undefined,
      defaultImageIndex: 0, // Default to first image
      // 🤖 Include category-driven consultation data (simple key-value as per schema)
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
    // Clear consultation config when industry changes
    setCategoryConfig({});
    setConsultationFields({});
    setRequiredFieldsError([]);
  };
  
  // Update consultation field values
  const updateConsultationField = (fieldId: string, value: string) => {
    setConsultationFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Remove from error list if field is now filled
    if (value.trim() && requiredFieldsError.includes(fieldId)) {
      setRequiredFieldsError(prev => prev.filter(f => f !== fieldId));
    }
  };
  
  // Validate required consultation fields
  const validateConsultationFields = (): boolean => {
    if (!categoryConfig.config?.required_fields) return true;
    
    const missingFields: string[] = [];
    categoryConfig.config.required_fields?.forEach(fieldId => {
      if (!consultationFields[fieldId] || !consultationFields[fieldId].trim()) {
        missingFields.push(fieldId);
      }
    });
    
    if (missingFields.length > 0) {
      setRequiredFieldsError(missingFields);
      toast({
        title: "Thiếu trường bắt buộc",
        description: `Vui lòng điền đầy đủ các trường được yêu cầu cho danh mục này`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Helper function to get Vietnamese field labels
  const getFieldLabel = (fieldId: string): string => {
    const fieldLabels: Record<string, string> = {
      "loại_da_phù_hợp": "Loại da phù hợp",
      "cách_thoa": "Cách thoa",
      "tần_suất_sử_dụng": "Tần suất sử dụng",
      "độ_tuổi_khuyến_nghị": "Độ tuổi khuyến nghị",
      "patch_test": "Patch test",
      "thành_phần_chính": "Thành phần chính",
      "liều_dùng": "Liều dùng",
      "thời_gian_sử_dụng": "Thời gian sử dụng",
      "đối_tượng_sử_dụng": "Đối tượng sử dụng",
      "chống_chỉ_định": "Chống chỉ định",
      "thông_số_kỹ_thuật": "Thông số kỹ thuật",
      "yêu_cầu_hệ_thống": "Yêu cầu hệ thống",
      "bảo_hành": "Bảo hành"
    };
    return fieldLabels[fieldId] || fieldId.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* 🎨 Modern Wizard Container */}
      <Card className="w-full max-w-4xl mx-auto max-h-[95vh] overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm
        sm:max-w-2xl md:max-w-3xl lg:max-w-4xl
        sm:mx-4 md:mx-6 lg:mx-8">
        {/* ✨ Stunning Header with Gradient */}
        <CardHeader className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 backdrop-blur-sm"></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {(() => {
                    const IconComponent = wizardSteps[currentStep].icon;
                    return IconComponent ? <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" /> : null;
                  })()}
                </div>
                <span className="truncate">{isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>
              </CardTitle>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                {wizardSteps[currentStep].description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] p-2"
              data-testid="button-close-form"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* 🌟 Beautiful Progress Indicator */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
          {/* 🚀 Auto-save Status Indicator */}
          {!isEditing && (
            <div className="flex items-center justify-center mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                autoSaveStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
                autoSaveStatus === 'saved' ? 'bg-green-100 text-green-700' :
                autoSaveStatus === 'error' ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-600'
              }`}>
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Đang lưu...
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Đã lưu tự động
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <X className="h-3 w-3" />
                    Lỗi lưu
                  </>
                )}
                {autoSaveStatus === 'idle' && (
                  <>
                    <Save className="h-3 w-3" />
                    Sẵn sàng
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* 📱 Mobile: Compact Progress Bar */}
          <div className="block sm:hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                bg-gradient-to-r ${wizardSteps[currentStep].gradient} text-white shadow-lg
              `}>
                {(() => {
                  const IconComponent = wizardSteps[currentStep].icon;
                  return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
                })()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{wizardSteps[currentStep].title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {currentStep + 1}/{wizardSteps.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🖥️ Desktop: Full Step Indicator */}
          <div className="hidden sm:flex items-center justify-between">
            {wizardSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isLast = index === wizardSteps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div 
                    className={`
                      relative flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full transition-all duration-300 cursor-pointer
                      ${isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                        : isActive 
                          ? `bg-gradient-to-r ${step.gradient} text-white shadow-lg scale-110` 
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }
                    `}
                    onClick={() => goToStep(index)}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (() => {
                      const IconComponent = step.icon;
                      return IconComponent ? <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" /> : null;
                    })()}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium transition-colors truncate ${
                      isActive ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  
                  {/* Progress Line */}
                  {!isLast && (
                    <div className="flex-1 mx-2 sm:mx-4 min-w-[20px]">
                      <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${
                          isCompleted ? 'w-full bg-gradient-to-r from-green-500 to-emerald-500' : 'w-0'
                        }`}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 📋 Dynamic Step Content with Smooth Animations */}
        <CardContent className="p-4 sm:p-6 min-h-[400px] sm:min-h-[500px] max-h-[65vh] overflow-y-auto">
          {/* ✨ Step Content Wrapper with Animation */}
          <div className="transition-all duration-500 ease-in-out">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 🚀 STEP 0: BASIC INFO */}
              {currentStep === 0 && (
                <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
                      <p className="text-sm text-gray-500">Thiết lập thông tin chính của sản phẩm</p>
                    </div>
                  </div>

                  {/* Product Name & SKU */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-red-500">*</span>
                        Tên sản phẩm
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Nhập tên sản phẩm..."
                        className={`mt-2 h-12 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${
                          fieldErrors.name && fieldTouched.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        data-testid="input-product-name"
                        required
                      />
                      {fieldErrors.name && fieldTouched.name && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          ⚠️ {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="sku" className="text-sm font-medium">Mã SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku || (isEditing ? "Chưa có SKU" : "Auto-gen")}
                        readOnly
                        disabled
                        className="mt-2 h-12 sm:h-11 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200"
                        data-testid="input-product-sku"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {isEditing ? "SKU đã được tạo" : "Tự động tạo khi lưu"}
                      </p>
                    </div>
                  </div>

                  {/* Item Code with QR Scanner */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="itemCode" className="text-sm font-medium">Mã sản phẩm (Item Code)</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        id="itemCode"
                        value={formData.itemCode}
                        onChange={(e) => handleFieldChange('itemCode', e.target.value)}
                        placeholder="Nhập mã sản phẩm hoặc quét QR..."
                        className="w-full sm:flex-1 h-12 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                        data-testid="input-product-itemcode"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsQRScannerOpen(true)}
                        className="w-full sm:w-auto h-12 sm:h-11 px-4 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group min-h-[48px] touch-manipulation"
                        data-testid="button-qr-scanner"
                      >
                        <QrCode className="h-4 w-4 mr-2 transition-transform group-hover:rotate-12" />
                        <span className="font-medium">Quét QR</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      📱 Mã để quản lý kho - có thể là barcode, QR code hoặc mã tự định nghĩa
                    </p>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-red-500">*</span>
                        Giá bán (VNĐ)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleFieldChange('price', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className={`mt-2 h-12 sm:h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 hover:border-gray-400 hover:shadow-sm ${
                          fieldErrors.price && fieldTouched.price ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        data-testid="input-product-price"
                        required
                      />
                      {fieldErrors.price && fieldTouched.price && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          ⚠️ {fieldErrors.price}
                        </p>
                      )}
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
                        className="mt-2 h-12 sm:h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                        data-testid="input-product-stock"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 🎨 More steps coming soon... */}
              {currentStep > 0 && (
                <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-4xl mb-4">🚧</div>
                    <p className="text-lg font-medium">Đang phát triển...</p>
                    <p className="text-sm">Các bước tiếp theo đang được hoàn thiện</p>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* 🎮 Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 h-12 sm:h-11 px-4 sm:px-6 disabled:opacity-50 border-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md group min-h-[48px] touch-manipulation w-full sm:w-auto justify-center"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Quay lại</span>
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500 order-first sm:order-none">
              Bước {currentStep + 1} / {wizardSteps.length}
            </div>

            {currentStep === wizardSteps.length - 1 ? (
              <Button
                type="submit"
                form="product-form"
                disabled={saveMutation.isPending || !canGoNext()}
                className="h-12 sm:h-11 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium min-h-[48px] touch-manipulation w-full sm:w-auto"
                onClick={handleSubmit}
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
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canGoNext()}
                className="flex items-center gap-2 h-12 sm:h-11 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 min-h-[48px] touch-manipulation w-full sm:w-auto justify-center"
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🎯 QR Scanner Modal */}
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

export default ProductForm;
