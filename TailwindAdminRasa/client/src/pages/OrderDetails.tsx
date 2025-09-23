import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  User,
  Calendar,
  Package,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OrderForm } from "@/components/OrderForm";
import { QRPayment } from "@/components/QRPayment";
import { formatOrderId, getShortOrderId } from "@/utils/orderUtils";
import { useState } from "react";
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
import type { Order, Payment } from "@shared/schema";

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

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

const formatDate = (dateInput: string | Date | null) => {
  if (!dateInput) return 'Không có thông tin';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: "Chờ xử lý", variant: "secondary" as const },
    processing: { label: "Đang xử lý", variant: "default" as const },
    shipped: { label: "Đã gửi", variant: "secondary" as const },
    delivered: { label: "Đã giao", variant: "default" as const },
    cancelled: { label: "Đã hủy", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: ['/api/orders', id],
    enabled: !!id,
  });

  // Fetch payment details
  const { data: payment, isLoading: paymentLoading } = useQuery<Payment>({
    queryKey: ['/api/orders', id, 'payment'],
    enabled: !!id,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      // Use session-authenticated endpoint (secure)
      return await apiRequest('POST', `/api/orders/${id}/payment`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: "QR thanh toán đã được tạo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', id, 'payment'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/orders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đơn hàng đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setLocation('/orders');
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="page-order-details">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6" data-testid="page-order-details">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/orders')}
            data-testid="button-back-to-orders"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Không thể tải thông tin đơn hàng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-order-details">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/orders')}
            data-testid="button-back-to-orders"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Chi tiết đơn hàng #{formatOrderId(order)}</h1>
            <p className="text-muted-foreground">
              Tạo ngày {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditFormOpen(true)}
              data-testid="button-edit-order"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-order"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {getStatusBadge(order.status)}
          <span className="text-sm text-muted-foreground">
            Cập nhật lần cuối: {formatDate(order.updatedAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card data-testid="card-customer-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {order.customerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{order.customerName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {order.customerEmail}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card data-testid="card-order-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tóm tắt đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Số lượng sản phẩm:</span>
              <span className="font-medium">{order.items} sản phẩm</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày tạo:</span>
              <span className="font-medium">
                <Calendar className="h-4 w-4 inline mr-1" />
                {formatDate(order.createdAt)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng tiền:</span>
              <span className="text-primary flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {formatPrice(order.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mt-6" data-testid="card-order-items">
        <CardHeader>
          <CardTitle>Sản phẩm trong đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`order-item-${index}`}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Mã sản phẩm: {item.productId.slice(-8)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">
                    {item.quantity} x {formatPrice(item.price)}
                  </p>
                  <p className="text-sm font-bold">
                    = {formatPrice(item.quantity * parseFloat(item.price))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {order.orderItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có sản phẩm nào trong đơn hàng
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Section */}
      {(order.status === 'pending' || order.status === 'processing') && (
        <Card className="mt-6" data-testid="card-payment-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Thanh Toán
              </CardTitle>
              {!payment && (
                <Button
                  onClick={() => createPaymentMutation.mutate()}
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-create-payment"
                >
                  {createPaymentMutation.isPending ? 'Đang tạo...' : 'Tạo QR thanh toán'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {payment ? (
              <QRPayment 
                order={order} 
                payment={payment}
                onPaymentCreated={(newPayment) => {
                  queryClient.invalidateQueries({ queryKey: ['/api/orders', id, 'payment'] });
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nhấn "Tạo QR thanh toán" để tạo mã QR cho đơn hàng này</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Form Modal */}
      {isEditFormOpen && (
        <OrderForm
          order={order}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/orders', id] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng #{formatOrderId(order)} không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa đơn hàng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}