import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Settings, Eye, Users, ShoppingCart, Package2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStorefrontConfigSchema, type StorefrontConfig as StorefrontConfigType, type StorefrontOrder as StorefrontOrderType, type Product } from "@shared/schema";
import { z } from "zod";

// Use shared schema with form-specific validation
const storefrontConfigFormSchema = insertStorefrontConfigSchema.extend({
  name: z.string().min(1, "Tên storefront là bắt buộc").regex(/^[a-z0-9-]+$/, "Chỉ cho phép chữ thường, số và dấu gạch ngang"),
  topProductsCount: z.coerce.number().min(1, "Số sản phẩm phải ít nhất là 1").max(50, "Tối đa 50 sản phẩm"),
  displayMode: z.enum(["auto", "manual"]).default("auto"),
  selectedProductIds: z.array(z.string()).optional(),
  contactInfo: z.object({
    phone: z.string().min(1, "Số điện thoại là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    businessName: z.string().min(1, "Tên doanh nghiệp là bắt buộc"),
    address: z.string().min(1, "Địa chỉ là bắt buộc")
  })
});

type StorefrontConfigForm = z.infer<typeof storefrontConfigFormSchema>;


export default function StorefrontManager() {
  const { toast } = useToast();
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch storefront configs
  const { data: configs = [], isLoading: configsLoading } = useQuery<StorefrontConfigType[]>({
    queryKey: ['/api/storefront/config'],
  });

  // Fetch orders for selected storefront
  const { data: orders = [], isLoading: ordersLoading } = useQuery<StorefrontOrderType[]>({
    queryKey: ['/api/storefront/orders', selectedConfig],
    enabled: !!selectedConfig,
  });

  // Fetch available products for manual selection
  const { data: availableProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Create storefront config mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: StorefrontConfigForm) => {
      return await apiRequest('POST', '/api/storefront/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/storefront/config'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo storefront mới thành công!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo storefront",
        variant: "destructive",
      });
    },
  });

  const form = useForm<StorefrontConfigForm>({
    resolver: zodResolver(storefrontConfigFormSchema),
    defaultValues: {
      name: "",
      topProductsCount: 10,
      displayMode: "auto",
      selectedProductIds: [],
      isActive: true,
      theme: "organic",
      primaryColor: "#4ade80",
      contactInfo: {
        phone: "",
        email: "",
        businessName: "",
        address: ""
      }
    },
  });

  // Watch displayMode to show/hide product selection
  const watchDisplayMode = form.watch("displayMode");

  // Cross-system content sharing receiver logic
  useEffect(() => {
    const loadSharedContent = async () => {
      // Check URL parameters for content ID
      const urlParams = new URLSearchParams(window.location.search);
      const contentId = urlParams.get('content');

      if (!contentId) return;

      try {
        // First try to get content from localStorage (immediate transfer)
        const storedContent = localStorage.getItem('storefrontContent');
        let sharedContent = null;

        if (storedContent) {
          const parsedContent = JSON.parse(storedContent);
          if (parsedContent.contentId === contentId) {
            sharedContent = parsedContent;
            // Clean up localStorage after consumption
            localStorage.removeItem('storefrontContent');
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
          // Generate storefront name from content title with proper diacritic handling
          const storefrontName = sharedContent.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '');

          form.setValue('name', storefrontName);
          form.setValue('contactInfo.businessName', sharedContent.title);
          
          // Open the create dialog to show the pre-populated form
          setIsCreateDialogOpen(true);

          toast({
            title: "✅ Content loaded successfully!",
            description: `Content "${sharedContent.title}" has been pre-populated for new storefront.`,
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
  }, [form, toast]);

  const onSubmit = (data: StorefrontConfigForm) => {
    createConfigMutation.mutate(data);
  };

  const getStorefrontUrl = (name: string) => {
    return `${window.location.origin}/sf/${name}`;
  };

  if (configsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý Storefront</h1>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý Storefront</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-storefront">
              <Plus className="mr-2 h-4 w-4" />
              Tạo Storefront Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Storefront Mới</DialogTitle>
              <DialogDescription>
                Tạo một storefront mới để hiển thị sản phẩm cho khách hàng
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Storefront</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="organic-store" 
                          {...field}
                          data-testid="input-storefront-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Chỉ sử dụng chữ thường, số và dấu gạch ngang. Đây sẽ là URL của storefront.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Chế độ hiển thị sản phẩm</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="auto" id="auto" />
                            <Label htmlFor="auto">Tự động - Hiển thị sản phẩm top theo stock</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual">Thủ công - Chọn sản phẩm cụ thể</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Chọn cách hiển thị sản phẩm trên storefront
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topProductsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số sản phẩm hiển thị</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-products-count"
                        />
                      </FormControl>
                      <FormDescription>
                        {watchDisplayMode === 'manual' 
                          ? 'Giới hạn số sản phẩm được chọn (1-50)' 
                          : 'Số lượng sản phẩm top sẽ hiển thị trên storefront (1-50)'
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="organic" 
                          {...field}
                          data-testid="input-theme"
                        />
                      </FormControl>
                      <FormDescription>
                        Theme cho storefront (ví dụ: organic, modern, classic)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Màu chủ đạo</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="#4ade80" 
                            {...field}
                            data-testid="input-primary-color"
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: field.value }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Màu chủ đạo của storefront (định dạng hex: #4ade80)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Selection for Manual Mode */}
                {watchDisplayMode === 'manual' && (
                  <FormField
                    control={form.control}
                    name="selectedProductIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chọn sản phẩm cho storefront</FormLabel>
                        <FormDescription>
                          Chọn tối đa {form.watch("topProductsCount")} sản phẩm để hiển thị trên storefront
                        </FormDescription>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                            {productsLoading ? (
                              <div className="col-span-full text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                <p className="text-sm text-muted-foreground mt-2">Đang tải sản phẩm...</p>
                              </div>
                            ) : availableProducts.length === 0 ? (
                              <div className="col-span-full text-center py-4">
                                <Package2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
                              </div>
                            ) : (
                              availableProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={field.value?.includes(product.id) || false}
                                    onCheckedChange={(checked) => {
                                      const currentIds = field.value || [];
                                      const maxProducts = form.watch("topProductsCount");
                                      
                                      if (checked) {
                                        if (currentIds.length < maxProducts) {
                                          field.onChange([...currentIds, product.id]);
                                        }
                                      } else {
                                        field.onChange(currentIds.filter(id => id !== product.id));
                                      }
                                    }}
                                    disabled={(field.value?.length || 0) >= form.watch("topProductsCount") && !field.value?.includes(product.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-none">{product.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {parseInt(product.price).toLocaleString('vi-VN')}đ
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        Stock: {product.stock}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Đã chọn: {field.value?.length || 0} / {form.watch("topProductsCount")} sản phẩm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Thông tin liên hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactInfo.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0123456789" 
                              {...field}
                              data-testid="input-contact-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactInfo.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="contact@example.com" 
                              {...field}
                              data-testid="input-contact-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="contactInfo.businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên doanh nghiệp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Cửa hàng thực phẩm sạch ABC" 
                            {...field}
                            data-testid="input-contact-business"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Đường ABC, Quận 1, TP.HCM"
                            rows={3}
                            {...field}
                            data-testid="input-contact-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Kích hoạt Storefront</FormLabel>
                        <FormDescription>
                          Storefront sẽ có thể truy cập được bởi khách hàng
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createConfigMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createConfigMutation.isPending ? "Đang tạo..." : "Tạo Storefront"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storefront List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Danh sách Storefront</h2>
          
          {configs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có storefront nào</p>
                <p className="text-sm text-muted-foreground">Tạo storefront đầu tiên để bắt đầu</p>
              </CardContent>
            </Card>
          ) : (
            configs.map((config: StorefrontConfigType) => (
              <Card 
                key={config.id} 
                className={`cursor-pointer transition-colors ${
                  selectedConfig === config.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedConfig(config.id)}
                data-testid={`card-storefront-${config.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {config.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getStorefrontUrl(config.name), '_blank');
                        }}
                        data-testid={`button-view-storefront-${config.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Theme: {config.theme} • {config.topProductsCount} sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                      <span className="text-muted-foreground">Màu chủ đạo: {config.primaryColor}</span>
                    </div>
                    <div className="text-muted-foreground">
                      URL: <code className="text-primary">/sf/{config.name}</code>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Cập nhật lúc: {config.updatedAt ? new Date(config.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Orders Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Đơn hàng Storefront</h2>
          
          {!selectedConfig ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chọn một storefront để xem đơn hàng</p>
              </CardContent>
            </Card>
          ) : ordersLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Đang tải đơn hàng...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="orders-list">
              {orders.map((order: StorefrontOrderType) => (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        </div>
                        <Badge variant="outline">
                          {order.deliveryType === 'local_delivery' ? 'Giao hàng tận nơi' : 'COD Shipping'}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p><strong>{order.productName}</strong></p>
                        <p>Số lượng: {order.quantity}</p>
                        <p className="text-primary font-medium">
                          Tổng: {parseInt(order.total).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Chưa có thời gian'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}