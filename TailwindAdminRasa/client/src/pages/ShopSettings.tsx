import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Image,
  Plus,
  Edit,
  Trash2,
  Star,
  Filter,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShopSettingsType {
  id: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  description?: string;
  website?: string;
  logo?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  industryId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const shopSettingsSchema = z.object({
  businessName: z.string().min(1, "Tên doanh nghiệp là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
  description: z.string().optional(),
  website: z.string().url("Website không hợp lệ").optional().or(z.literal("")),
  logo: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type ShopSettingsForm = z.infer<typeof shopSettingsSchema>;

// LocalStorage key for POS category settings
const POS_CATEGORY_SETTINGS_KEY = 'pos-visible-categories';

export default function ShopSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<ShopSettingsType | null>(null);
  const [deleteSettings, setDeleteSettings] = useState<ShopSettingsType | null>(null);
  
  // POS Category Settings state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  const [categoryVisibilityMode, setCategoryVisibilityMode] = useState<'show_all' | 'hide_all' | 'custom'>('custom');

  // Fetch shop settings
  const { data: settings = [], isLoading } = useQuery<ShopSettingsType[]>({
    queryKey: ['/api/shop-settings'],
  });

  // Fetch categories for POS settings  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  // Load visible categories from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POS_CATEGORY_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Legacy migration: handle old "null" string values
        if (parsed === null || parsed === "null") {
          localStorage.removeItem(POS_CATEGORY_SETTINGS_KEY); // Clean up legacy data
          setVisibleCategories([]);
          setCategoryVisibilityMode('show_all'); // Legacy null = show all
          return;
        }
        if (Array.isArray(parsed)) {
          setVisibleCategories(parsed);
          // Derive mode from stored data: [] = hide_all, [items] = custom
          setCategoryVisibilityMode(parsed.length === 0 ? 'hide_all' : 'custom');
        } else {
          // Non-array, non-null data - treat as corruption, reset to show all
          localStorage.removeItem(POS_CATEGORY_SETTINGS_KEY);
          setVisibleCategories([]);
          setCategoryVisibilityMode('show_all');
        }
      } else {
        // No stored key = show_all (default state)
        setVisibleCategories([]);
        setCategoryVisibilityMode('show_all');
      }
    } catch (error) {
      console.error('Failed to load POS category settings:', error);
      // Fallback to show_all on error
      localStorage.removeItem(POS_CATEGORY_SETTINGS_KEY); // Clean up corrupted data
      setVisibleCategories([]);
      setCategoryVisibilityMode('show_all');
    }
  }, []);

  // Create/Update shop settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (data: ShopSettingsForm & { id?: string }) => {
      if (data.id) {
        return await apiRequest('PUT', `/api/shop-settings?id=${data.id}`, data);
      } else {
        return await apiRequest('POST', '/api/shop-settings', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-settings'] });
      setIsDialogOpen(false);
      setEditingSettings(null);
      form.reset();
      toast({
        title: "Thành công",
        description: editingSettings ? "Đã cập nhật cài đặt thành công!" : "Đã tạo cài đặt mới thành công!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi lưu cài đặt",
        variant: "destructive",
      });
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (settingsId: string) => {
      return await apiRequest('PUT', '/api/shop-settings?id=set-default', { settingsId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-settings'] });
      toast({
        title: "Thành công",
        description: "Đã đặt làm cài đặt mặc định thành công!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi đặt mặc định",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/shop-settings?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-settings'] });
      setDeleteSettings(null);
      toast({
        title: "Thành công",
        description: "Đã xóa cài đặt thành công!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa cài đặt",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ShopSettingsForm>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      businessName: "",
      phone: "",
      email: "",
      address: "",
      description: "",
      website: "",
      logo: "",
      isDefault: false,
    },
  });

  // Load data when editing
  useEffect(() => {
    if (editingSettings) {
      form.reset({
        businessName: editingSettings.businessName,
        phone: editingSettings.phone,
        email: editingSettings.email,
        address: editingSettings.address,
        description: editingSettings.description || "",
        website: editingSettings.website || "",
        logo: editingSettings.logo || "",
        isDefault: editingSettings.isDefault,
      });
    }
  }, [editingSettings, form]);

  const onSubmit = (data: ShopSettingsForm) => {
    settingsMutation.mutate({
      ...data,
      id: editingSettings?.id,
    });
  };

  const handleEdit = (settings: ShopSettingsType) => {
    setEditingSettings(settings);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingSettings(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleSetDefault = (settings: ShopSettingsType) => {
    setDefaultMutation.mutate(settings.id);
  };

  const handleDelete = (settings: ShopSettingsType) => {
    setDeleteSettings(settings);
  };

  const confirmDelete = () => {
    if (deleteSettings) {
      deleteMutation.mutate(deleteSettings.id);
    }
  };

  // POS Category Management Functions
  const savePOSCategorySettings = (categoryIds: string[] | null) => {
    try {
      if (categoryIds === null) {
        localStorage.removeItem(POS_CATEGORY_SETTINGS_KEY); // null = no preference, remove key
      } else {
        localStorage.setItem(POS_CATEGORY_SETTINGS_KEY, JSON.stringify(categoryIds)); // [] or [ids]
      }
      setVisibleCategories(categoryIds || []);
      toast({
        title: "Thành công",
        description: "Đã lưu cài đặt danh mục POS!",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt danh mục",
        variant: "destructive",
      });
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const updatedCategories = checked 
      ? [...visibleCategories, categoryId]
      : visibleCategories.filter(id => id !== categoryId);
    setVisibleCategories(updatedCategories);
    setCategoryVisibilityMode('custom'); // Mark as custom selection when manually toggling
  };

  const handleShowAllCategories = () => {
    setVisibleCategories([]); // Reset to empty for UI display
    setCategoryVisibilityMode('show_all'); // Explicitly track "show all" intent
  };

  const handleHideAllCategories = () => {
    setVisibleCategories([]);
    setCategoryVisibilityMode('hide_all'); // Explicitly track "hide all" intent
  };

  const applyCategorySettings = () => {
    // Use explicit mode flag to determine what to save
    if (categoryVisibilityMode === 'show_all') {
      // User explicitly chose "Show All" -> save null (no preference)
      savePOSCategorySettings(null);
    } else if (categoryVisibilityMode === 'hide_all') {
      // User explicitly chose "Hide All" -> save empty array
      savePOSCategorySettings([]);
    } else {
      // User selected specific categories -> save the selection
      savePOSCategorySettings(visibleCategories);
    }
    setIsCategoryDialogOpen(false);
  };

  const getVisibleCategoriesCount = () => {
    if (visibleCategories.length === 0) {
      return "Hiển thị tất cả";
    }
    return `${visibleCategories.length}/${categories.length} danh mục`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Cài đặt Shop</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted"></CardHeader>
              <CardContent className="h-32 bg-muted"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Cài đặt Shop</h1>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm cài đặt mới
        </Button>
      </div>

      {settings.length === 0 ? (
        <Card className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Chưa có cài đặt shop nào</h3>
          <p className="text-muted-foreground mb-4">
            Tạo cài đặt shop đầu tiên để lưu thông tin liên hệ mặc định
          </p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo cài đặt đầu tiên
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.map((setting) => (
              <Card key={setting.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {setting.businessName}
                    </CardTitle>
                    {setting.isDefault && (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Mặc định
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{setting.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{setting.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{setting.address}</span>
                    </div>
                    {setting.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{setting.website}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Sửa
                    </Button>
                    
                    {!setting.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(setting)}
                        className="flex items-center gap-1"
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-3 w-3" />
                        Đặt mặc định
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* POS Category Settings Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Cài đặt danh mục POS
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Quản lý danh mục hiển thị
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chọn những danh mục sản phẩm sẽ hiển thị trong POS. Để trống để hiện tất cả.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Danh mục đang hiển thị</p>
                    <p className="text-sm text-muted-foreground">
                      {getVisibleCategoriesCount()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsCategoryDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Cấu hình danh mục
                  </Button>
                </div>
                
                {visibleCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                    {visibleCategories.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="secondary">
                          {category.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSettings ? "Chỉnh sửa cài đặt shop" : "Tạo cài đặt shop mới"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Tên doanh nghiệp *</Label>
                <Input
                  id="businessName"
                  {...form.register("businessName")}
                  placeholder="VD: Cửa hàng thực phẩm sạch ABC"
                />
                {form.formState.errors.businessName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="VD: 0123456789"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="VD: contact@shop.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register("website")}
                  placeholder="VD: https://shop.com"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Địa chỉ *</Label>
              <Textarea
                id="address"
                {...form.register("address")}
                placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                rows={2}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Mô tả ngắn về cửa hàng"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                {...form.register("logo")}
                placeholder="URL hình ảnh logo"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                {...form.register("isDefault")}
                className="rounded border-input"
              />
              <Label htmlFor="isDefault">Đặt làm cài đặt mặc định</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={settingsMutation.isPending}
              >
                {settingsMutation.isPending
                  ? "Đang lưu..."
                  : editingSettings
                  ? "Cập nhật"
                  : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSettings} onOpenChange={() => setDeleteSettings(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cài đặt "{deleteSettings?.businessName}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* POS Category Settings Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Cấu hình danh mục POS
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Chọn những danh mục sản phẩm sẽ hiển thị trong POS. Nếu không chọn danh mục nào, tất cả sẽ được hiển thị.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowAllCategories}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Hiện tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleHideAllCategories}
                className="flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                Ẩn tất cả
              </Button>
              <div className="text-sm text-muted-foreground ml-auto">
                {visibleCategories.length}/{categories.length} được chọn
              </div>
            </div>

            {/* Category List */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {categoriesLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                    </div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2" />
                  <p>Chưa có danh mục nào</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-3">
                      <Checkbox
                        id={category.id}
                        checked={visibleCategories.includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={category.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={applyCategorySettings}>
              Áp dụng cài đặt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}