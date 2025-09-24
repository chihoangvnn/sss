import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Trash2, Save, X, ArrowUp, ArrowDown, Settings, Eye, Wand2 } from "lucide-react";

interface Industry {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
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

interface CategoryFormData {
  name: string;
  description: string;
  industryId: string;
  isActive: boolean;
  sortOrder: number;
  consultationConfig: CategoryConsultationConfig;
  consultationTemplates: CategoryConsultationTemplates;
  salesAdviceTemplate: CategorySalesTemplate;
}

export default function CategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("basic");
  
  // Available consultation types for Vietnamese retail
  const consultationTypes = [
    { id: "usage_guide", label: "Hướng dẫn sử dụng", icon: "✨" },
    { id: "safety_profile", label: "An toàn & lưu ý", icon: "⚠️" },
    { id: "storage", label: "Bảo quản", icon: "🏪" },
    { id: "health_benefits", label: "Lợi ích sức khỏe", icon: "💊" },
    { id: "skin_benefits", label: "Lợi ích da", icon: "✨" },
    { id: "care_instructions", label: "Chăm sóc", icon: "🌟" },
    { id: "technical_guide", label: "Kỹ thuật", icon: "🔧" },
    { id: "troubleshooting", label: "Khắc phục lỗi", icon: "🛠️" },
    { id: "compatibility", label: "Tương thích", icon: "🔌" },
    { id: "recipes", label: "Công thức", icon: "📝" }
  ];
  
  // Available required fields for products
  const availableFields = [
    { id: "loại_da_phù_hợp", label: "Loại da phù hợp" },
    { id: "cách_thoa", label: "Cách thoa" },
    { id: "tần_suất_sử_dụng", label: "Tần suất sử dụng" },
    { id: "độ_tuổi_khuyến_nghị", label: "Độ tuổi khuyến nghị" },
    { id: "patch_test", label: "Patch test" },
    { id: "thành_phần_chính", label: "Thành phần chính" },
    { id: "liều_dùng", label: "Liều dùng" },
    { id: "thời_gian_sử_dụng", label: "Thời gian sử dụng" },
    { id: "đối_tượng_sử_dụng", label: "Đối tượng sử dụng" },
    { id: "chống_chỉ_định", label: "Chống chỉ định" },
    { id: "thông_số_kỹ_thuật", label: "Thông số kỹ thuật" },
    { id: "yêu_cầu_hệ_thống", label: "Yêu cầu hệ thống" },
    { id: "bảo_hành", label: "Bảo hành" },
    // 🍲 Food & beverage specific fields
    { id: "cách_bảo_quản", label: "Cách bảo quản" },
    { id: "hạn_sử_dụng", label: "Hạn sử dụng" },
    { id: "nguyên_liệu", label: "Nguyên liệu" },
    { id: "xuất_xứ", label: "Xuất xứ" },
    { id: "chứng_nhận", label: "Chứng nhận" },
    // 🔧 General purpose fields
    { id: "cách_sử_dụng_cơ_bản", label: "Cách sử dụng cơ bản" },
    { id: "lưu_ý_đặc_biệt", label: "Lưu ý đặc biệt" },
    { id: "điều_kiện_bảo_quản", label: "Điều kiện bảo quản" },
    { id: "khuyến_nghị_chuyên_gia", label: "Khuyến nghị chuyên gia" }
  ];
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    industryId: "",
    isActive: true,
    sortOrder: 0,
    consultationConfig: {
      enabled_types: [],
      required_fields: [],
      optional_fields: [],
      auto_prompts: []
    },
    consultationTemplates: {},
    salesAdviceTemplate: {}
  });

  // Fetch industries
  const { data: industries = [], isLoading: industriesLoading, error: industriesError } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const isLoading = industriesLoading || categoriesLoading;
  const error = industriesError || categoriesError;

  // Save category mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save category');
        } catch {
          throw new Error('Failed to save category');
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `Danh mục đã được ${editingCategory ? 'cập nhật' : 'thêm'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      // Handle 204 No Content or empty response
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
      }
      try {
        return await response.json();
      } catch {
        return null; // Fallback for empty/non-JSON responses
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Danh mục đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa danh mục",
        variant: "destructive",
      });
    },
  });

  // Update sort order mutation
  const updateSortMutation = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: string; sortOrder: number }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder }),
      });
      if (!response.ok) throw new Error('Failed to update sort order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể di chuyển danh mục",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      industryId: "",
      isActive: true,
      sortOrder: 0,
      consultationConfig: {
        enabled_types: [],
        required_fields: [],
        optional_fields: [],
        auto_prompts: []
      },
      consultationTemplates: {},
      salesAdviceTemplate: {}
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    // Get max sort order for the selected industry filter or all categories
    const relevantCategories = selectedIndustryFilter !== 'all' 
      ? categories.filter(c => c.industryId === selectedIndustryFilter)
      : categories;
    const maxSortOrder = Math.max(...relevantCategories.map(c => c.sortOrder), -1);
    
    setFormData({
      name: "",
      description: "",
      industryId: selectedIndustryFilter !== 'all' ? selectedIndustryFilter : "",
      isActive: true,
      sortOrder: maxSortOrder + 1,
      consultationConfig: {
        enabled_types: [],
        required_fields: [],
        optional_fields: [],
        auto_prompts: []
      },
      consultationTemplates: {},
      salesAdviceTemplate: {}
    });
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      industryId: category.industryId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      consultationConfig: category.consultationConfig || {
        enabled_types: [],
        required_fields: [],
        optional_fields: [],
        auto_prompts: []
      },
      consultationTemplates: category.consultationTemplates || {},
      salesAdviceTemplate: category.salesAdviceTemplate || {}
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục không được để trống",
        variant: "destructive",
      });
      return;
    }

    if (!formData.industryId || !industries.some(i => i.id === formData.industryId)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngành hàng hợp lệ",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
  };

  const moveCategoryUp = (category: Category, index: number) => {
    if (index === 0) return;
    const prevCategory = filteredCategories[index - 1];
    updateSortMutation.mutate({ id: category.id, sortOrder: prevCategory.sortOrder });
    updateSortMutation.mutate({ id: prevCategory.id, sortOrder: category.sortOrder });
  };

  const moveCategoryDown = (category: Category, index: number) => {
    if (index === filteredCategories.length - 1) return;
    const nextCategory = filteredCategories[index + 1];
    updateSortMutation.mutate({ id: category.id, sortOrder: nextCategory.sortOrder });
    updateSortMutation.mutate({ id: nextCategory.id, sortOrder: category.sortOrder });
  };
  
  // Consultation configuration helpers
  const toggleConsultationType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      consultationConfig: {
        ...prev.consultationConfig,
        enabled_types: (prev.consultationConfig.enabled_types || []).includes(typeId)
          ? (prev.consultationConfig.enabled_types || []).filter(t => t !== typeId)
          : [...(prev.consultationConfig.enabled_types || []), typeId]
      }
    }));
  };
  
  const toggleRequiredField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      consultationConfig: {
        ...prev.consultationConfig,
        required_fields: (prev.consultationConfig.required_fields || []).includes(fieldId)
          ? (prev.consultationConfig.required_fields || []).filter(f => f !== fieldId)
          : [...(prev.consultationConfig.required_fields || []), fieldId]
      }
    }));
  };
  
  const updateTemplate = (templateKey: keyof CategoryConsultationTemplates, value: string) => {
    setFormData(prev => ({
      ...prev,
      consultationTemplates: {
        ...prev.consultationTemplates,
        [templateKey]: value
      }
    }));
  };
  
  const addAutoPrompt = () => {
    const newPrompt = prompt("Nhập câu hỏi gợi ý tự động:");
    if (newPrompt && newPrompt.trim()) {
      setFormData(prev => ({
        ...prev,
        consultationConfig: {
          ...prev.consultationConfig,
          auto_prompts: [...(prev.consultationConfig.auto_prompts || []), newPrompt.trim()]
        }
      }));
    }
  };
  
  const removeAutoPrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      consultationConfig: {
        ...prev.consultationConfig,
        auto_prompts: (prev.consultationConfig.auto_prompts || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => selectedIndustryFilter && selectedIndustryFilter !== "all" ? category.industryId === selectedIndustryFilter : true)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get industry name helper
  const getIndustryName = (industryId: string) => {
    const industry = industries.find(i => i.id === industryId);
    return industry ? industry.name : 'Không xác định';
  };

  // 🤖 Smart Defaults: Industry-specific consultation configuration
  const getIndustrySmartDefaults = (industryId: string) => {
    const industry = industries.find(i => i.id === industryId);
    const industryName = industry?.name?.toLowerCase() || '';
    
    // Vietnamese retail industry patterns
    if (industryName.includes('mỹ phẩm') || industryName.includes('làm đẹp') || industryName.includes('beauty')) {
      return {
        enabled_types: ['usage_guide', 'safety_profile', 'skin_benefits', 'care_instructions'],
        required_fields: ['loại_da_phù_hợp', 'cách_thoa', 'tần_suất_sử_dụng', 'patch_test'],
        optional_fields: ['độ_tuổi_khuyến_nghị', 'thành_phần_chính'],
        auto_prompts: [
          'Làn da bạn thuộc loại nào? (da dầu, da khô, da hỗn hợp, da nhạy cảm)',
          'Bạn đã từng dị ứng với sản phẩm chăm sóc da nào chưa?',
          'Hiện tại bạn đang sử dụng routine chăm sóc da như thế nào?'
        ],
        templates: {
          usage_guide_template: '✨ **HƯỚNG DẪN SỬ DỤNG:**\n1. Làm sạch da mặt\n2. {cách_thoa}\n3. Sử dụng {tần_suất_sử_dụng}\n4. Thoa kem chống nắng nếu dùng ban ngày',
          safety_template: '⚠️ **AN TOÀN & LƯU Ý:**\n- Phù hợp cho: {loại_da_phù_hợp}\n- {patch_test}\n- Ngưng sử dụng nếu có dấu hiệu kích ứng',
          skin_benefits_template: '✨ **LỢI ÍCH CHO DA:**\n- Cải thiện tình trạng da\n- Phù hợp với {loại_da_phù_hợp}\n- {thành_phần_chính} giúp nuôi dưỡng da'
        }
      };
    }
    
    if (industryName.includes('sức khỏe') || industryName.includes('thực phẩm chức năng') || industryName.includes('health')) {
      return {
        enabled_types: ['usage_guide', 'safety_profile', 'health_benefits'],
        required_fields: ['liều_dùng', 'thời_gian_sử_dụng', 'đối_tượng_sử_dụng', 'chống_chỉ_định'],
        optional_fields: ['thành_phần_chính'],
        auto_prompts: [
          'Bạn có đang dùng thuốc gì khác không?',
          'Bạn có tiền sử bệnh lý gì cần lưu ý?',
          'Mục tiêu sức khỏe của bạn là gì?'
        ],
        templates: {
          usage_guide_template: '💊 **HƯỚNG DẪN SỬ DỤNG:**\n- Liều dùng: {liều_dùng}\n- Thời gian: {thời_gian_sử_dụng}\n- Uống cùng với nước hoặc sau bữa ăn',
          safety_template: '⚠️ **AN TOÀN & LƯU Ý:**\n- Đối tượng: {đối_tượng_sử_dụng}\n- Chống chỉ định: {chống_chỉ_định}\n- Tham khảo ý kiến bác sĩ nếu có bất thường',
          health_benefits_template: '💊 **LỢI ÍCH SỨC KHỎE:**\n- {thành_phần_chính}\n- Hỗ trợ sức khỏe tổng thể\n- Phù hợp cho: {đối_tượng_sử_dụng}'
        }
      };
    }
    
    if (industryName.includes('điện tử') || industryName.includes('công nghệ') || industryName.includes('electronics')) {
      return {
        enabled_types: ['usage_guide', 'technical_guide', 'troubleshooting', 'compatibility'],
        required_fields: ['thông_số_kỹ_thuật', 'yêu_cầu_hệ_thống', 'bảo_hành'],
        optional_fields: [],
        auto_prompts: [
          'Bạn sử dụng thiết bị này để làm gì?',
          'Thiết bị hiện tại của bạn có tương thích không?',
          'Bạn đã có kinh nghiệm sử dụng sản phẩm tương tự chưa?'
        ],
        templates: {
          usage_guide_template: '🔧 **HƯỚNG DẪN SỬ DỤNG:**\n1. Kiểm tra {yêu_cầu_hệ_thống}\n2. Kết nối và cài đặt\n3. Cấu hình theo {thông_số_kỹ_thuật}',
          technical_template: '⚙️ **THÔNG SỐ KỸ THUẬT:**\n- {thông_số_kỹ_thuật}\n- {yêu_cầu_hệ_thống}\n- Bảo hành: {bảo_hành}',
          troubleshooting_template: '🛠️ **KHẮC PHỤC LỖI:**\n1. Kiểm tra kết nối\n2. Khởi động lại thiết bị\n3. Liên hệ bộ phận kỹ thuật nếu vẫn gặp lỗi'
        }
      };
    }
    
    if (industryName.includes('thực phẩm') || industryName.includes('food') || industryName.includes('gia vị')) {
      return {
        enabled_types: ['usage_guide', 'recipes', 'storage', 'health_benefits'],
        required_fields: ['thành_phần_chính', 'cách_bảo_quản', 'hạn_sử_dụng'],
        optional_fields: ['liều_dùng'],
        auto_prompts: [
          'Bạn có dị ứng thực phẩm nào không?',
          'Bạn thường nấu ăn theo phong cách nào?',
          'Gia đình bạn có thành viên nào ăn chay không?'
        ],
        templates: {
          usage_guide_template: '🍽️ **HƯỚNG DẪN SỬ DỤNG:**\n- Thành phần: {thành_phần_chính}\n- Cách dùng: {liều_dùng}\n- Bảo quản: {cách_bảo_quản}',
          recipes_template: '📝 **CÔNG THỨC GỢI Ý:**\n- Nguyên liệu chính: {thành_phần_chính}\n- Phù hợp cho các món: [món ăn phù hợp]\n- Lưu ý: Nêm nếm theo khẩu vị',
          storage_template: '🏪 **CÁCH BẢO QUẢN:**\n- {cách_bảo_quản}\n- Hạn sử dụng: {hạn_sử_dụng}\n- Tránh ánh nắng trực tiếp'
        }
      };
    }
    
    // Default fallback for other industries
    return {
      enabled_types: ['usage_guide', 'safety_profile'],
      required_fields: ['cách_sử_dụng_cơ_bản'],
      optional_fields: [],
      auto_prompts: [
        'Bạn đã sử dụng sản phẩm tương tự chưa?',
        'Mục đích sử dụng của bạn là gì?'
      ],
      templates: {
        usage_guide_template: '✨ **HƯỚNG DẪN SỬ DỤNG:**\n1. {cách_sử_dụng_cơ_bản}\n2. Thực hiện theo chỉ dẫn\n3. Liên hệ nếu cần hỗ trợ'
      }
    };
  };

  // 🚀 Auto-populate consultation config when industry changes (for new categories only)
  const handleIndustryChange = (industryId: string) => {
    // Update industry in form data
    setFormData(prev => ({ ...prev, industryId }));
    
    // Auto-populate consultation config ONLY for new categories (not when editing)
    if (!editingCategory && industryId) {
      const smartDefaults = getIndustrySmartDefaults(industryId);
      
      setFormData(prev => ({
        ...prev,
        consultationConfig: {
          enabled_types: smartDefaults.enabled_types,
          required_fields: smartDefaults.required_fields,
          optional_fields: smartDefaults.optional_fields,
          auto_prompts: smartDefaults.auto_prompts
        },
        consultationTemplates: smartDefaults.templates || {}
      }));
      
      // Switch to consultation tab to show the auto-populated config
      setActiveTab('consultation');
      
      // Show success toast
      toast({
        title: "🤖 Smart Defaults",
        description: `Đã tự động cấu hình tư vấn cho ngành "${getIndustryName(industryId)}". Bạn có thể chỉnh sửa thêm nếu cần.`,
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">Lỗi khi tải dữ liệu</p>
              <Button 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
                }}
                variant="outline"
              >
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="page-categories">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-muted-foreground">
            Quản lý danh mục sản phẩm và thứ tự hiển thị
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedIndustryFilter} onValueChange={setSelectedIndustryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo ngành hàng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ngành hàng</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} data-testid="button-add-category">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-2">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Chưa có danh mục nào</h3>
                <p className="text-muted-foreground mb-4">
                  Thêm danh mục đầu tiên để phân loại sản phẩm
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm danh mục đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category, index) => (
                <Card key={category.id} className="hover-elevate" data-testid={`card-category-${category.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                          <Badge variant="outline">
                            {getIndustryName(category.industryId)}
                          </Badge>
                        </div>
                        {category.description && (
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryUp(category, index)}
                          disabled={index === 0 || updateSortMutation.isPending}
                          data-testid={`button-move-up-${category.id}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryDown(category, index)}
                          disabled={index === filteredCategories.length - 1 || updateSortMutation.isPending}
                          data-testid={`button-move-down-${category.id}`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          data-testid={`button-edit-${category.id}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Thứ tự: {category.sortOrder}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Category Form */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    data-testid="button-close-form"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                    <TabsTrigger value="consultation" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Cấu hình tư vấn
                    </TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <TabsContent value="basic" className="space-y-4">
                      <div>
                        <Label htmlFor="categoryIndustry">Ngành hàng *</Label>
                        <Select 
                          value={formData.industryId} 
                          onValueChange={handleIndustryChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn ngành hàng" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry.id} value={industry.id}>
                                {industry.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="categoryName">Tên danh mục *</Label>
                        <Input
                          id="categoryName"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nhập tên danh mục"
                          data-testid="input-category-name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="categoryDescription">Mô tả</Label>
                        <Textarea
                          id="categoryDescription"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Mô tả chi tiết danh mục"
                          rows={3}
                          data-testid="input-category-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="categorySortOrder">Thứ tự</Label>
                        <Input
                          id="categorySortOrder"
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          data-testid="input-category-sort-order"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="categoryActive">Kích hoạt</Label>
                        <Switch
                          id="categoryActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                          data-testid="switch-category-active"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="consultation" className="space-y-6">
                      {/* Consultation Types */}
                      <div>
                        <Label className="text-base font-semibold">🤖 Loại tư vấn được hỗ trợ</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Chọn các loại tư vấn mà danh mục này sẽ hỗ trợ
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {consultationTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`consultation-${type.id}`}
                                checked={(formData.consultationConfig.enabled_types || []).includes(type.id)}
                                onCheckedChange={() => toggleConsultationType(type.id)}
                              />
                              <Label 
                                htmlFor={`consultation-${type.id}`} 
                                className="text-sm cursor-pointer flex items-center gap-1"
                              >
                                <span>{type.icon}</span>
                                {type.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Required Fields */}
                      <div>
                        <Label className="text-base font-semibold">📋 Trường bắt buộc khi thêm sản phẩm</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Chọn các trường thông tin bắt buộc phải điền khi thêm sản phẩm thuộc danh mục này
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {availableFields.map((field) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`field-${field.id}`}
                                checked={(formData.consultationConfig.required_fields || []).includes(field.id)}
                                onCheckedChange={() => toggleRequiredField(field.id)}
                              />
                              <Label 
                                htmlFor={`field-${field.id}`} 
                                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Auto Prompts */}
                      <div>
                        <Label className="text-base font-semibold">💬 Câu hỏi gợi ý tự động</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Những câu hỏi sẽ được gợi ý tự động cho khách hàng khi tư vấn sản phẩm
                        </p>
                        <div className="space-y-2">
                          {(formData.consultationConfig.auto_prompts || []).map((prompt, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <span className="flex-1 text-sm">{prompt}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAutoPrompt(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addAutoPrompt}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm câu hỏi gợi ý
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Template Editor */}
                      <div>
                        <Label className="text-base font-semibold">📝 Mẫu template tư vấn</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Tạo template cho từng loại tư vấn đã chọn (sử dụng {"{biến_số}"} cho placeholder)
                        </p>
                        <div className="space-y-4">
                          {(formData.consultationConfig.enabled_types || []).map((typeId) => {
                            const type = consultationTypes.find(t => t.id === typeId);
                            if (!type) return null;
                            
                            const templateKey = `${typeId}_template` as keyof CategoryConsultationTemplates;
                            
                            return (
                              <div key={typeId} className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <span>{type.icon}</span>
                                  Template {type.label}
                                </Label>
                                <Textarea
                                  value={formData.consultationTemplates[templateKey] || ''}
                                  onChange={(e) => updateTemplate(templateKey, e.target.value)}
                                  placeholder={`Ví dụ: ${type.icon} **${type.label.toUpperCase()}:**\n1. {bước_1}\n2. {bước_2}\n3. {bước_3}`}
                                  rows={3}
                                  className="font-mono text-sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="flex-1"
                        data-testid="button-cancel"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-category"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveMutation.isPending 
                          ? 'Đang lưu...' 
                          : (editingCategory ? 'Cập nhật' : 'Thêm danh mục')
                        }
                      </Button>
                    </div>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Show total count */}
      <div className="mt-6 text-center text-muted-foreground">
        Tổng số {categories.length} danh mục
      </div>
    </div>
  );
}