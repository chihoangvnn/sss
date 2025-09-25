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
  DollarSign,
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Bell
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

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest('PUT', `/api/orders/${id}/status`, { status: newStatus });
    },
    onSuccess: (data, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Cập nhật thành công",
        description: `Trạng thái đơn hàng đã được chuyển sang: ${getStatusLabel(newStatus)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    const statusConfig = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý", 
      shipped: "Đã gửi",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };
    return statusConfig[status as keyof typeof statusConfig] || status;
  };

  // Helper function to get next status options
  const getNextStatusOptions = (currentStatus: string) => {
    const statusFlow = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || [];
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    const statusIcons = {
      pending: Clock,
      processing: Package,
      shipped: Truck,
      delivered: PackageCheck,
      cancelled: XCircle,
    };
    return statusIcons[status as keyof typeof statusIcons] || Clock;
  };

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

        {/* Status Update UI */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Cập nhật trạng thái đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {(['pending', 'processing', 'shipped', 'delivered'] as const).map((status, index) => {
                  const StatusIcon = getStatusIcon(status);
                  const isActive = order.status === status;
                  const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) > index;
                  const isCancelled = order.status === 'cancelled';
                  
                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                        ${isActive ? 'bg-primary border-primary text-primary-foreground' : 
                          isCompleted ? 'bg-green-500 border-green-500 text-white' :
                          isCancelled ? 'bg-gray-300 border-gray-300 text-gray-500' :
                          'bg-gray-100 border-gray-300 text-gray-500'}
                      `}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs mt-2 text-center ${
                        isActive ? 'font-semibold text-primary' :
                        isCompleted ? 'text-green-600' :
                        isCancelled ? 'text-gray-400' :
                        'text-muted-foreground'
                      }`}>
                        {getStatusLabel(status)}
                      </span>
                      {index < 3 && (
                        <div className={`
                          h-0.5 w-full mt-2 -ml-4 -mr-4 transition-colors
                          ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                        `} style={{ marginTop: '-20px', zIndex: -1 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cancelled Status Indicator */}
              {order.status === 'cancelled' && (
                <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">Đơn hàng đã bị hủy</span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Thao tác nhanh
              </h4>
              
              <div className="flex gap-2 flex-wrap">
                {getNextStatusOptions(order.status).map((nextStatus) => {
                  const StatusIcon = getStatusIcon(nextStatus);
                  return (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === 'cancelled' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate(nextStatus)}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <StatusIcon className="h-4 w-4" />
                      {nextStatus === 'cancelled' ? 'Hủy đơn hàng' : `Chuyển sang: ${getStatusLabel(nextStatus)}`}
                    </Button>
                  );
                })}
              </div>

              {getNextStatusOptions(order.status).length === 0 && order.status !== 'cancelled' && (
                <p className="text-sm text-muted-foreground">
                  ✅ Đơn hàng đã hoàn thành! Không có thao tác nào khả dụng.
                </p>
              )}

              {order.status === 'cancelled' && (
                <p className="text-sm text-muted-foreground">
                  ❌ Đơn hàng đã bị hủy. Không thể thay đổi trạng thái.
                </p>
              )}
            </div>

            {/* Loading indicator */}
            {updateStatusMutation.isPending && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700 text-sm">Đang cập nhật trạng thái...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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