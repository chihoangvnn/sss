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
  Eye,
  CreditCard,
  Receipt
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
  totalSpent: string; // Matches schema decimal type
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
  const calculatedTotalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const stats = {
    totalOrders: orders.length,
    totalSpent: calculatedTotalSpent,
    averageOrderValue: orders.length > 0 ? calculatedTotalSpent / orders.length : 0,
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
    <div className="p-4" data-testid="page-customer-details">
      {/* Compact Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/customers')}
              data-testid="button-back-to-customers"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
            <h1 className="text-xl font-bold">Chi tiết khách hàng</h1>
            {getStatusBadge(customer.status)}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditFormOpen(true)}
              data-testid="button-edit-customer"
            >
              <Edit className="h-3 w-3 mr-1" />
              Sửa
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-customer"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Customer Information */}
      <Card className="mb-4" data-testid="card-customer-info">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={customer.avatar || ""} />
              <AvatarFallback className="text-sm">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-lg font-bold">{customer.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatShortDate(customer.joinDate)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Statistics Grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-4">
        <Card data-testid="card-total-orders">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Đơn hàng</span>
            </div>
            <div className="text-lg font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-total-spent">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Chi tiêu</span>
            </div>
            <div className="text-lg font-bold">{formatPrice(stats.totalSpent)}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-average-order">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">TB/đơn</span>
            </div>
            <div className="text-lg font-bold">{formatPrice(stats.averageOrderValue)}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-debt">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Công nợ</span>
            </div>
            <div className={`text-lg font-bold ${parseFloat(customer.totalDebt || '0') > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatPrice(parseFloat(customer.totalDebt || '0'))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-credit-limit">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Hạn mức</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatPrice(parseFloat(customer.creditLimit || '0'))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Order History */}
      <Card data-testid="card-order-history">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lịch sử đơn hàng ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {ordersLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="h-8 px-2 text-xs">Đơn hàng</TableHead>
                    <TableHead className="h-8 px-2 text-xs">Ngày</TableHead>
                    <TableHead className="h-8 px-2 text-xs">Trạng thái</TableHead>
                    <TableHead className="h-8 px-2 text-xs">SP</TableHead>
                    <TableHead className="h-8 px-2 text-xs text-right">Tổng tiền</TableHead>
                    <TableHead className="h-8 px-2 text-xs text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`} className="border-b">
                      <TableCell className="px-2 py-2 text-sm font-medium">
                        #{order.id.slice(-6)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-sm">{formatShortDate(order.createdAt)}</TableCell>
                      <TableCell className="px-2 py-2">{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell className="px-2 py-2 text-sm">{order.items}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-right font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          data-testid={`button-view-order-${order.id}`}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có đơn hàng</p>
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