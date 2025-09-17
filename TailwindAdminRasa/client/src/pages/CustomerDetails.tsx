import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ShoppingCart,
  TrendingUp,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomerDialog } from "@/components/CustomerDialog";
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
import type { Customer, Order } from "@shared/schema";

// Extended Customer type matching the CustomerList interface
interface CustomerWithStats extends Customer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

// Order type with customer info for table display
interface OrderWithInfo extends Order {
  customerName: string;
  customerEmail: string;
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

const formatShortDate = (dateInput: string | Date | null) => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('vi-VN');
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { label: "Hoạt động", variant: "default" as const },
    inactive: { label: "Không hoạt động", variant: "secondary" as const },
    vip: { label: "VIP", variant: "secondary" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getOrderStatusBadge = (status: string) => {
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

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
};

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch customer details
  const { data: customer, isLoading, error } = useQuery<CustomerWithStats>({
    queryKey: ['/api/customers', id],
    enabled: !!id,
  });

  // Fetch customer orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithInfo[]>({
    queryKey: ['/api/orders', 'customer', id],
    queryFn: async () => {
      // Fetch all orders and filter by customer ID client-side
      // TODO: Enhance API to support customer ID filtering for better performance
      const response = await apiRequest('GET', '/api/orders');
      const allOrders = (await response.json()) as OrderWithInfo[];
      return allOrders.filter((order: OrderWithInfo) => order.customerId === id);
    },
    enabled: !!id,
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Khách hàng đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setLocation('/customers');
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

  const handleViewOrder = (orderId: string) => {
    setLocation(`/orders/${orderId}`);
  };

  // Calculate additional stats from orders
  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.total), 0) / orders.length : 0,
    lastOrderDate: orders.length > 0 ? orders.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt : null,
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="page-customer-details">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6" data-testid="page-customer-details">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/customers')}
            data-testid="button-back-to-customers"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Không thể tải thông tin khách hàng</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-customer-details">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/customers')}
            data-testid="button-back-to-customers"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Chi tiết khách hàng</h1>
            <p className="text-muted-foreground">
              Tham gia ngày {formatDate(customer.joinDate)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditFormOpen(true)}
              data-testid="button-edit-customer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-customer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {getStatusBadge(customer.status)}
        </div>
      </div>

      {/* Customer Information Card */}
      <Card className="mb-6" data-testid="card-customer-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={customer.avatar || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Tham gia: {formatDate(customer.joinDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card data-testid="card-total-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Tổng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Đơn hàng đã đặt
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-total-spent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tổng chi tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Giá trị đơn hàng
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-average-order">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Giá trị TB/đơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Trung bình mỗi đơn hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card data-testid="card-order-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lịch sử đơn hàng ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                      <TableCell className="font-medium">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell>{formatShortDate(order.createdAt)}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.items} sản phẩm</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Khách hàng chưa có đơn hàng nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Modal */}
      {isEditFormOpen && (
        <CustomerDialog
          mode="edit"
          customer={customer}
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng "{customer.name}" không? 
              Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa khách hàng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}