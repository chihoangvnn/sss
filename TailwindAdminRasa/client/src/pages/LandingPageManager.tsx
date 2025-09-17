import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit3, Eye, Settings, GripVertical, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LandingPageSettings {
  id?: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  heroText?: string;
  isActive: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    zalo?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: string[];
  catalogId: string;
  isActive: boolean;
}

interface LandingPageProduct {
  id: string;
  productId: string;
  variantId?: string;
  displayOrder: number;
  isActive: boolean;
  showPrice: boolean;
  showStock: boolean;
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  product: Product;
  variant?: any;
  inventory?: any;
  availableStock: number;
  displayPrice: number;
  displayName: string;
  displayDescription: string;
  displayImage?: string;
}

export default function LandingPageManager() {
  const [activeTab, setActiveTab] = useState("settings");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditSettingsDialogOpen, setIsEditSettingsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [newProductForm, setNewProductForm] = useState({
    productId: "",
    variantId: "",
    displayOrder: 0,
    showPrice: true,
    showStock: true,
    customTitle: "",
    customDescription: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch landing page settings
  const { data: settings, isLoading: settingsLoading } = useQuery<LandingPageSettings>({
    queryKey: ['/api/product-landing-pages', 'settings'],
    queryFn: () => fetch('/api/product-landing-pages').then(res => res.json()).then(data => data[0] || {}),
    enabled: false, // Disable for now since this page seems to be for different purpose
  });

  // Fetch landing page products
  const { data: landingProducts = [], isLoading: productsLoading } = useQuery<LandingPageProduct[]>({
    queryKey: ['/api/product-landing-pages', 'products'],
    queryFn: () => fetch('/api/product-landing-pages').then(res => res.json()),
  });

  // Fetch all available products for selection
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<LandingPageSettings>({
    title: settings?.title || "Cửa hàng Online",
    subtitle: settings?.subtitle || "",
    heroText: settings?.heroText || "",
    isActive: settings?.isActive || true,
    theme: settings?.theme || 'light',
    primaryColor: settings?.primaryColor || "#007bff",
    secondaryColor: settings?.secondaryColor || "#28a745",
    contactInfo: {
      phone: settings?.contactInfo?.phone || "",
      email: settings?.contactInfo?.email || "",
      address: settings?.contactInfo?.address || "",
    },
    socialLinks: {
      facebook: settings?.socialLinks?.facebook || "",
      instagram: settings?.socialLinks?.instagram || "",
      zalo: settings?.socialLinks?.zalo || "",
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: LandingPageSettings) => {
      const response = await fetch("/api/product-landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt Landing Page đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-landing-pages', 'settings'] });
      setIsEditSettingsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/product-landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add product");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được thêm vào Landing Page",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-landing-pages', 'products'] });
      setIsAddProductDialogOpen(false);
      setNewProductForm({
        productId: "",
        variantId: "",
        displayOrder: 0,
        showPrice: true,
        showStock: true,
        customTitle: "",
        customDescription: "",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm",
        variant: "destructive",
      });
    },
  });

  // Remove product mutation
  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/landing/products/${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove product");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa khỏi Landing Page",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-landing-pages', 'products'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settingsForm);
  };

  const handleAddProduct = () => {
    if (!newProductForm.productId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm",
        variant: "destructive",
      });
      return;
    }

    addProductMutation.mutate({
      ...newProductForm,
      displayOrder: landingProducts.length,
    });
  };

  const handleRemoveProduct = (productId: string) => {
    removeProductMutation.mutate(productId);
  };

  if (settingsLoading || productsLoading) {
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Landing Page</h1>
          <p className="text-muted-foreground">
            Tùy chỉnh giao diện và sản phẩm hiển thị trên trang bán hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open('/store', '_blank')}
            data-testid="button-preview-landing"
          >
            <Eye className="h-4 w-4 mr-2" />
            Xem trước
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Cài đặt chung</TabsTrigger>
          <TabsTrigger value="products">Quản lý sản phẩm</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt Landing Page
              </CardTitle>
              <CardDescription>
                Tùy chỉnh thông tin và giao diện của trang Landing Page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tiêu đề trang</Label>
                  <Input
                    id="title"
                    value={settingsForm.title}
                    onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                    placeholder="Tên cửa hàng"
                    data-testid="input-page-title"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Phụ đề</Label>
                  <Input
                    id="subtitle"
                    value={settingsForm.subtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                    placeholder="Mô tả ngắn về cửa hàng"
                    data-testid="input-page-subtitle"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="heroText">Text Hero Section</Label>
                <Textarea
                  id="heroText"
                  value={settingsForm.heroText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroText: e.target.value })}
                  placeholder="Câu slogan chính của cửa hàng"
                  data-testid="textarea-hero-text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={settingsForm.contactInfo.phone}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      contactInfo: { ...settingsForm.contactInfo, phone: e.target.value }
                    })}
                    placeholder="0123456789"
                    data-testid="input-contact-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={settingsForm.contactInfo.email}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      contactInfo: { ...settingsForm.contactInfo, email: e.target.value }
                    })}
                    placeholder="contact@store.com"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={settingsForm.contactInfo.address}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      contactInfo: { ...settingsForm.contactInfo, address: e.target.value }
                    })}
                    placeholder="Địa chỉ cửa hàng"
                    data-testid="input-contact-address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={settingsForm.socialLinks.facebook}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/yourstore"
                    data-testid="input-social-facebook"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settingsForm.socialLinks.instagram}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/yourstore"
                    data-testid="input-social-instagram"
                  />
                </div>
                <div>
                  <Label htmlFor="zalo">Zalo</Label>
                  <Input
                    id="zalo"
                    value={settingsForm.socialLinks.zalo}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, zalo: e.target.value }
                    })}
                    placeholder="https://zalo.me/yourstore"
                    data-testid="input-social-zalo"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={settingsForm.isActive}
                  onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, isActive: checked })}
                  data-testid="switch-page-active"
                />
                <Label htmlFor="isActive">Kích hoạt Landing Page</Label>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sản phẩm trên Landing Page</CardTitle>
                  <CardDescription>
                    Chọn và sắp xếp sản phẩm hiển thị trên trang bán hàng
                  </CardDescription>
                </div>
                <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-product">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm sản phẩm
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm sản phẩm vào Landing Page</DialogTitle>
                      <DialogDescription>
                        Chọn sản phẩm từ danh sách có sẵn để hiển thị trên Landing Page
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Chọn sản phẩm</Label>
                        <Select
                          value={newProductForm.productId}
                          onValueChange={(value) => setNewProductForm({ ...newProductForm, productId: value })}
                        >
                          <SelectTrigger data-testid="select-product">
                            <SelectValue placeholder="Chọn sản phẩm" />
                          </SelectTrigger>
                          <SelectContent>
                            {allProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {(product.basePrice || 0).toLocaleString('vi-VN')}đ
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tiêu đề tùy chỉnh (không bắt buộc)</Label>
                        <Input
                          value={newProductForm.customTitle}
                          onChange={(e) => setNewProductForm({ ...newProductForm, customTitle: e.target.value })}
                          placeholder="Để trống để dùng tên sản phẩm gốc"
                          data-testid="input-custom-title"
                        />
                      </div>
                      <div>
                        <Label>Mô tả tùy chỉnh (không bắt buộc)</Label>
                        <Textarea
                          value={newProductForm.customDescription}
                          onChange={(e) => setNewProductForm({ ...newProductForm, customDescription: e.target.value })}
                          placeholder="Để trống để dùng mô tả sản phẩm gốc"
                          data-testid="textarea-custom-description"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPrice"
                            checked={newProductForm.showPrice}
                            onCheckedChange={(checked) => setNewProductForm({ ...newProductForm, showPrice: checked })}
                          />
                          <Label htmlFor="showPrice">Hiển thị giá</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showStock"
                            checked={newProductForm.showStock}
                            onCheckedChange={(checked) => setNewProductForm({ ...newProductForm, showStock: checked })}
                          />
                          <Label htmlFor="showStock">Hiển thị tồn kho</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddProductDialogOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button 
                        onClick={handleAddProduct}
                        disabled={addProductMutation.isPending}
                        data-testid="button-confirm-add-product"
                      >
                        {addProductMutation.isPending ? "Đang thêm..." : "Thêm sản phẩm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {landingProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có sản phẩm nào trên Landing Page</p>
                  <p className="text-sm">Nhấn "Thêm sản phẩm" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {landingProducts.map((product, index) => (
                    <Card key={product.id} className="p-4" data-testid={`card-landing-product-${product.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        {product.displayImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={product.displayImage}
                              alt={product.displayName}
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{product.displayName}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {product.displayDescription}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {product.showPrice && (
                              <Badge variant="outline">
                                {product.displayPrice.toLocaleString('vi-VN')}đ
                              </Badge>
                            )}
                            {product.showStock && (
                              <Badge variant={product.availableStock > 0 ? "default" : "destructive"}>
                                {product.availableStock > 0 ? `Còn ${product.availableStock}` : "Hết hàng"}
                              </Badge>
                            )}
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Hiển thị" : "Ẩn"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.id)}
                            disabled={removeProductMutation.isPending}
                            data-testid={`button-remove-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}