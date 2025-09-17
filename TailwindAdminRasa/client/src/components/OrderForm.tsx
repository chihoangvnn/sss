import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Customer, Product } from "@shared/schema";

interface OrderWithDetails extends Order {
  customerName: string;
  customerEmail: string;
  orderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: string;
    productName: string;
  }>;
}

interface OrderFormProps {
  order?: OrderWithDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

export function OrderForm({ order, onClose, onSuccess }: OrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(order);

  const [formData, setFormData] = useState({
    customerId: "retail", // Default to retail customer
    status: "pending" as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Load order data if editing
  useEffect(() => {
    if (order) {
      setFormData({
        customerId: order.customerId,
        status: order.status,
      });
      
      // Convert order items to the format expected by the form
      const items = order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: item.quantity * parseFloat(item.price),
      }));
      setOrderItems(items);
    }
  }, [order]);

  // Fetch customers and products for dropdowns
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Calculate totals
  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Add new order item
  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      productId: "",
      productName: "",
      quantity: 1, // Default quantity is 1
      price: 0,
      total: 0,
    }]);
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Update order item
  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    const item = newItems[index];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = value;
        item.productName = product.name;
        item.price = parseFloat(product.price);
        item.total = item.quantity * item.price;
      }
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value) || 1;
      item.total = item.quantity * item.price;
    } else if (field === 'price') {
      item.price = parseFloat(value) || 0;
      item.total = item.quantity * item.price;
    }
    
    setOrderItems(newItems);
  };

  // Save order mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        // Update existing order
        await apiRequest('PUT', `/api/orders/${order?.id}`, {
          customerId: data.customerId,
          total: data.total,
          status: data.status,
          items: data.items,
        });
        
        // Handle order items separately (simplified approach)
        // In a real implementation, you might want to handle order items updates more elegantly
      } else {
        // Create new order
        const orderData = {
          customerId: data.customerId,
          total: data.total,
          status: data.status,
          items: data.items,
        };
        
        const newOrderResponse = await apiRequest('POST', '/api/orders', orderData);
        const newOrder = await newOrderResponse.json();
        
        // Create order items
        for (const item of orderItems) {
          if (item.productId) {
            await apiRequest('POST', '/api/order-items', {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price.toString(),
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `Đơn hàng đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
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
    
    // Customer is optional now - defaults to retail customer

    if (orderItems.length === 0 || !orderItems.some(item => item.productId)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một sản phẩm",
        variant: "destructive",
      });
      return;
    }

    const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số lượng hợp lệ cho các sản phẩm",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      customerId: formData.customerId,
      total: totalAmount.toString(),
      status: formData.status,
      items: totalItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEditing ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-order-form"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer">Khách hàng</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Khách lẻ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Khách lẻ</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="shipped">Đã gửi</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sản phẩm *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrderItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </div>

              {orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  {/* Product Selection */}
                  <div className="flex-1">
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateOrderItem(index, 'productId', value)}
                    >
                      <SelectTrigger data-testid={`select-product-${index}`}>
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatPrice(parseFloat(product.price))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                      placeholder="Kg"
                      data-testid={`input-quantity-${index}`}
                    />
                  </div>

                  {/* Price */}
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', e.target.value)}
                      placeholder="Giá"
                      data-testid={`input-price-${index}`}
                    />
                  </div>

                  {/* Total */}
                  <div className="w-32 text-right font-medium">
                    {formatPrice(item.total)}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrderItem(index)}
                    data-testid={`button-remove-item-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-sm">
                <span>Tổng số lượng:</span>
                <span className="font-medium">{totalItems} sản phẩm</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold mt-2">
                <span>Tổng tiền:</span>
                <span className="text-primary">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
                data-testid="button-save-order"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo đơn hàng')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}