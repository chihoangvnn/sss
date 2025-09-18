import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "./ImageUploader";
import type { CloudinaryImage, CloudinaryVideo } from "@shared/schema";

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
  price: string;
  stock: number;
  categoryId?: string;
  status: "active" | "inactive" | "out-of-stock";
  image?: string; // Deprecated - kept for backward compatibility
  images?: CloudinaryImage[];
  videos?: CloudinaryVideo[];
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
    price: "",
    stock: "0",
    industryId: "",
    categoryId: "",
    status: "active" as "active" | "inactive" | "out-of-stock",
    image: "", // Deprecated - kept for backward compatibility
    images: [] as CloudinaryImage[],
    videos: [] as CloudinaryVideo[],
  });

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
        price: product.price,
        stock: product.stock.toString(),
        industryId: "",
        categoryId: product.categoryId || "",
        status: product.status,
        image: product.image || "",
        images: product.images || [],
        videos: product.videos || [],
      });
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
      const url = isEditing ? `/api/products?id=${product?.id}` : '/api/products';
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

    const saveData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: formData.price, // Send as string to match backend
      stock: parseInt(formData.stock) || 0,
      categoryId: formData.categoryId && formData.categoryId !== "none" ? formData.categoryId : undefined,
      status: formData.status,
      image: formData.image.trim() || undefined,
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div>
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

            {/* SKU Display */}
            <div>
              <Label htmlFor="sku">Mã SKU</Label>
              <Input
                id="sku"
                value={formData.sku || (isEditing ? "Chưa có SKU" : "Sẽ tự động tạo khi lưu")}
                readOnly
                disabled
                placeholder="Auto-generated SKU"
                className="bg-muted text-muted-foreground"
                data-testid="input-product-sku"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isEditing ? "SKU đã được tạo" : "SKU sẽ được tạo tự động: 2 chữ đầu ngành hàng + 4 số"}
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết sản phẩm"
                rows={3}
                data-testid="input-product-description"
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Industry and Category */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div></div>
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
    </div>
  );
}