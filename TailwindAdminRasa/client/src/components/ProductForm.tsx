import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Wand2, Loader2, Eye, EyeOff, Copy, QrCode, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "./ImageUploader";
import { QRScanner } from "./QRScanner";
import { RichTextEditor } from "./RichTextEditor";
import { FAQManagement } from "./FAQManagement";
import type { CloudinaryImage, CloudinaryVideo, RasaDescriptions } from "@shared/schema";

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

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);

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
          selectedCategory.consultationConfig.required_fields.forEach(fieldId => {
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
    categoryConfig.config.required_fields.forEach(fieldId => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-form"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 🎯 OPTIMIZED LAYOUT - Row 1: Tên sản phẩm + Mã SKU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên sản phẩm"
                  data-testid="input-product-name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">Mã SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || (isEditing ? "Chưa có SKU" : "Auto-gen")}
                  readOnly
                  disabled
                  placeholder="Auto-generated SKU"
                  className="bg-muted text-muted-foreground text-sm"
                  data-testid="input-product-sku"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-4">
              {isEditing ? "SKU đã được tạo" : "SKU sẽ được tạo tự động: 2 chữ đầu ngành hàng + 4 số"}
            </p>

            {/* 🎯 Row 2: Mã sản phẩm (Item Code) */}
            <div>
              <Label htmlFor="itemCode">Mã sản phẩm (Item Code)</Label>
              <div className="flex gap-2">
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                  placeholder="Nhập mã sản phẩm hoặc quét QR"
                  data-testid="input-product-itemcode"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsQRScannerOpen(true)}
                  className="flex items-center gap-2 px-3"
                  data-testid="button-qr-scanner"
                >
                  <QrCode className="h-4 w-4" />
                  Quét QR
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                📱 Mã sản phẩm có thể là barcode, QR code hoặc mã tự định nghĩa để quản lý kho
              </p>
            </div>

            {/* 🎯 Row 3: Ngành hàng + Danh mục + Status (3 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="industry">Ngành hàng</Label>
                <Select
                  value={formData.industryId}
                  onValueChange={handleIndustryChange}
                >
                  <SelectTrigger data-testid="select-product-industry">
                    <SelectValue placeholder="Chọn ngành hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có ngành hàng</SelectItem>
                    {activeIndustries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  disabled={!formData.industryId}
                >
                  <SelectTrigger data-testid="select-product-category">
                    <SelectValue placeholder={formData.industryId ? "Chọn danh mục" : "Chọn ngành hàng trước"} />
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
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "out-of-stock") => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger data-testid="select-product-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                    <SelectItem value="out-of-stock">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 🤖 Category-driven Consultation Fields */}
            {categoryConfig.config && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <h3 className="font-semibold text-blue-800">
                    🤖 Thông tin tư vấn cho danh mục này
                  </h3>
                </div>
                <p className="text-sm text-blue-600 mb-4">
                  Danh mục "{categories.find(c => c.id === formData.categoryId)?.name}" yêu cầu các thông tin bổ sung sau:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required Fields */}
                  {categoryConfig.config.required_fields.map((fieldId) => {
                    const fieldLabel = getFieldLabel(fieldId);
                    const isError = requiredFieldsError.includes(fieldId);
                    
                    return (
                      <div key={fieldId} className="space-y-2">
                        <Label htmlFor={`consultation-${fieldId}`} className={`flex items-center gap-2 ${isError ? 'text-red-600' : ''}`}>
                          <span className="text-red-500">*</span>
                          {fieldLabel}
                          {isError && <span className="text-xs text-red-500">(Bắt buộc)</span>}
                        </Label>
                        <Textarea
                          id={`consultation-${fieldId}`}
                          value={consultationFields[fieldId] || ''}
                          onChange={(e) => updateConsultationField(fieldId, e.target.value)}
                          placeholder={`Nhập ${fieldLabel.toLowerCase()}...`}
                          rows={2}
                          className={`resize-none ${isError ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Optional Fields */}
                  {categoryConfig.config.optional_fields.map((fieldId) => {
                    const fieldLabel = getFieldLabel(fieldId);
                    
                    return (
                      <div key={fieldId} className="space-y-2">
                        <Label htmlFor={`consultation-${fieldId}`} className="flex items-center gap-2">
                          {fieldLabel}
                          <span className="text-xs text-muted-foreground">(Tùy chọn)</span>
                        </Label>
                        <Textarea
                          id={`consultation-${fieldId}`}
                          value={consultationFields[fieldId] || ''}
                          onChange={(e) => updateConsultationField(fieldId, e.target.value)}
                          placeholder={`Nhập ${fieldLabel.toLowerCase()}...`}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Auto Prompts Preview */}
                {categoryConfig.config.auto_prompts.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                    <Label className="text-sm font-semibold text-blue-700 mb-2 block">
                      💬 Câu hỏi gợi ý tự động cho khách hàng:
                    </Label>
                    <div className="space-y-1">
                      {categoryConfig.config.auto_prompts.slice(0, 3).map((prompt, index) => (
                        <p key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          {index + 1}. {prompt}
                        </p>
                      ))}
                      {categoryConfig.config.auto_prompts.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          ... và {categoryConfig.config.auto_prompts.length - 3} câu hỏi khác
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Consultation Templates Info */}
                {categoryConfig.templates && Object.keys(categoryConfig.templates).length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <Label className="text-sm font-semibold text-green-700 mb-2 block">
                      📝 Templates tư vấn có sẵn:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(categoryConfig.templates).map((templateKey) => (
                        <span key={templateKey} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {templateKey.replace('_template', '').replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🎯 Row 4: Giá + Số lượng + Tự động tạo mô tả (3 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Giá (VND) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  data-testid="input-product-price"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  data-testid="input-product-stock"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={generateDescriptions}
                  disabled={isGenerating || !formData.name.trim()}
                  className="gap-2 h-10"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Đang tạo...' : '🪄 Tự động tạo mô tả'}
                </Button>
              </div>
            </div>

            {/* 🎯 Row 5: Mô tả sản phẩm */}
            <div>
              <Label htmlFor="description">Mô tả sản phẩm</Label>
              <RichTextEditor
                id="description"
                data-testid="input-product-description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Nhập mô tả hoặc click 'Tự động tạo mô tả' để AI tạo giúp bạn"
                height="120px"
                className="w-full mt-2"
              />
              {!formData.name.trim() && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Nhập tên sản phẩm trước để AI có thể tạo mô tả phù hợp
                </p>
              )}
            </div>


            {/* 🎯 Row 7: Mô tả đã tạo bởi AI */}
            {generatedDescriptions && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-sm">🤖 Mô tả đã tạo bởi AI</h4>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDescriptionPreview(!showDescriptionPreview)}
                    className="gap-1"
                  >
                    {showDescriptionPreview ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {showDescriptionPreview ? 'Ẩn' : 'Xem'} chi tiết
                  </Button>
                </div>

                {showDescriptionPreview && (
                  <div className="space-y-3">
                    {/* Primary Description */}
                    <div className="bg-white rounded p-3 border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-green-700 font-medium">✅ Mô tả chính:</Label>
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
                      <Label className="text-blue-700 font-medium mb-2 block">🤖 RASA Chat Variations:</Label>
                      <div className="grid gap-2">
                        {Object.entries(generatedDescriptions.rasa_variations || {}).map(([index, description]) => {
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

            {/* Media Upload - Images and Videos */}
            <div>
              <Label>Hình ảnh & Video sản phẩm</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload hình ảnh và video để giới thiệu sản phẩm một cách sinh động
              </p>
              <ImageUploader
                value={[...formData.images, ...formData.videos]}
                onChange={(media) => {
                  const images = media.filter((m): m is CloudinaryImage => m.resource_type === 'image');
                  const videos = media.filter((m): m is CloudinaryVideo => m.resource_type === 'video');
                  setFormData(prev => ({ ...prev, images, videos }));
                }}
                maxFiles={8}
                maxFileSize={50}
                acceptImages={true}
                acceptVideos={true}
                folder="products"
                className="mt-2"
              />
            </div>

            {/* Backward compatibility - Legacy Image URL */}
            {formData.image && (
              <div>
                <Label htmlFor="image">URL hình ảnh (legacy)</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Chỉ hiển thị nếu có dữ liệu cũ. Khuyến nghị sử dụng upload ở trên.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1"
                data-testid="button-save-product"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending 
                  ? 'Đang lưu...' 
                  : (isEditing ? 'Cập nhật' : 'Thêm sản phẩm')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 🎯 FAQ Management - Outside form to avoid nested forms */}
      {isEditing && product?.id && (
        <Card className="w-full max-w-2xl mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Quản lý FAQ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FAQManagement 
              productId={product.id}
              className=""
            />
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}