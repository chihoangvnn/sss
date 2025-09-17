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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Trash2, Save, X, ArrowUp, ArrowDown } from "lucide-react";

interface Industry {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
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

interface CategoryFormData {
  name: string;
  description: string;
  industryId: string;
  isActive: boolean;
  sortOrder: number;
}

export default function CategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>("all");
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    industryId: "",
    isActive: true,
    sortOrder: 0,
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
      const url = editingCategory ? `/api/categories?id=${editingCategory.id}` : '/api/categories';
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
      const response = await fetch(`/api/categories?id=${id}`, {
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
      const response = await fetch(`/api/categories?id=${id}`, {
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

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => selectedIndustryFilter && selectedIndustryFilter !== "all" ? category.industryId === selectedIndustryFilter : true)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get industry name helper
  const getIndustryName = (industryId: string) => {
    const industry = industries.find(i => i.id === industryId);
    return industry ? industry.name : 'Không xác định';
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryIndustry">Ngành hàng *</Label>
                    <Select 
                      value={formData.industryId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, industryId: value }))}
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