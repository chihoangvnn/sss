import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, MoreHorizontal, Search, Filter, Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OrderForm } from "./OrderForm";
import { useNewOrderNotification, TestNewOrderNotification } from "./NewOrderNotification";
import type { Order } from "@shared/schema";

interface OrderWithCustomerInfo extends Order {
  customerName: string;
  customerEmail: string;
}

interface OrderTableProps {
  onViewOrder?: (order: OrderWithCustomerInfo) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
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

export function OrderTable({ onViewOrder }: OrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithCustomerInfo | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<OrderWithCustomerInfo | null>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 🌿 Gentle Green Notifications for Main Orders
  const { triggerNewOrderNotification, NewOrderNotificationComponent } = useNewOrderNotification();

  const { data: orders = [], isLoading, error } = useQuery<OrderWithCustomerInfo[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 30000, // Check for new orders every 30 seconds
  });

  // 🌿 New Order Detection for Main Orders (Robust)
  useEffect(() => {
    if (orders?.length > 0) {
      // Only process notifications when no search/filter applied (clean state)
      const isCleanState = searchTerm === "" && statusFilter === "all";
      
      if (!isCleanState) return;
      
      // Get persistent state for main orders
      const lastSeenKey = `lastSeenMainOrder`;
      const seenIdsKey = `seenMainOrderIds`;
      
      const lastSeenTimestamp = localStorage.getItem(lastSeenKey);
      const lastSeen = lastSeenTimestamp ? new Date(lastSeenTimestamp) : null;
      
      const seenIdsJson = localStorage.getItem(seenIdsKey);
      const seenIds = new Set<string>(seenIdsJson ? JSON.parse(seenIdsJson) : []);
      
      // Initialize baseline on first load to prevent deadlock
      if (!lastSeen) {
        const newestOrderDate = new Date(orders[0].createdAt);
        localStorage.setItem(lastSeenKey, newestOrderDate.toISOString());
        // Add all current order IDs to seen set to prevent immediate notifications
        orders.forEach((order: OrderWithCustomerInfo) => seenIds.add(order.id));
        localStorage.setItem(seenIdsKey, JSON.stringify(Array.from(seenIds)));
        return; // Skip notifications on initialization
      }
      
      // Find truly new orders (after last seen time AND not in seen IDs)
      const newOrders = orders.filter((order: OrderWithCustomerInfo) => {
        if (!lastSeen) return false; // Safety guard
        const orderDate = new Date(order.createdAt);
        return orderDate > lastSeen && !seenIds.has(order.id);
      });
      
      // Process each new order sequentially with stagger (max 20 to avoid spam)
      const notifyOrders = newOrders.slice(0, 20);
      const remainingCount = newOrders.length - notifyOrders.length;
      
      notifyOrders.forEach((order: OrderWithCustomerInfo, index: number) => {
        setTimeout(() => {
          // Calculate time ago
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
          
          let timeAgo = 'Vừa xong';
          if (diffInMinutes >= 1 && diffInMinutes < 60) {
            timeAgo = `${diffInMinutes} phút trước`;
          } else if (diffInMinutes >= 60) {
            const hours = Math.floor(diffInMinutes / 60);
            timeAgo = `${hours} giờ trước`;
          }
          
          // Trigger gentle green notification for main order
          triggerNewOrderNotification({
            id: order.id,
            orderNumber: `DH-${order.id.slice(0, 8)}`,
            customerName: order.customerName,
            totalAmount: Number(order.total),
            currency: 'VND',
            itemCount: order.items ? JSON.parse(order.items as string).length : 1,
            timeAgo
          });
          
          // Add to seen IDs
          seenIds.add(order.id);
        }, index * 800); // Stagger by 800ms
      });
      
      // Show summary notification if too many new orders
      if (remainingCount > 0) {
        setTimeout(() => {
          toast({
            variant: 'gentle-success',
            title: `+${remainingCount} Đơn Hàng Mới Khác`,
            description: 'Có nhiều đơn hàng mới vừa đến cùng lúc'
          });
        }, notifyOrders.length * 800 + 400);
      }
      
      // Update persistent state (burst-safe lastSeen advancement)
      if (newOrders.length > 0) {
        // Only advance lastSeen if there's no potential truncation
        const pageIsFull = orders.length >= 25; // Assuming pagination limit
        const potentialTruncation = remainingCount > 0 || (pageIsFull && newOrders.length >= 25);
        
        if (!potentialTruncation) {
          // Safe to advance lastSeen - all new orders are on this page
          const maxNotifiedDate = Math.max(...notifyOrders.map(o => new Date(o.createdAt).getTime()));
          const currentLastSeen = lastSeen || new Date(0);
          const newLastSeen = new Date(Math.max(maxNotifiedDate, currentLastSeen.getTime()));
          localStorage.setItem(lastSeenKey, newLastSeen.toISOString());
        }
        // If truncation detected, rely on seenIds for deduplication without advancing lastSeen
      }
      
      // Always update seen IDs to maintain LRU cache
      if (orders.length > 0) {
        // Add all notified order IDs to seen set 
        notifyOrders.forEach((order: OrderWithCustomerInfo) => seenIds.add(order.id));
        
        // Prune seenIds to maintain LRU with 500 limit
        const seenIdsArray = Array.from(seenIds);
        const prunedSeenIds = seenIdsArray.slice(-500);
        localStorage.setItem(seenIdsKey, JSON.stringify(prunedSeenIds));
      }
    }
  }, [orders, searchTerm, statusFilter, triggerNewOrderNotification, toast]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiRequest('DELETE', `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đơn hàng đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setDeletingOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewOrder = (order: OrderWithCustomerInfo) => {
    setLocation(`/orders/${order.id}`);
  };

  const handleEditOrder = (order: OrderWithCustomerInfo) => {
    setEditingOrder(order);
  };

  const handleDeleteOrder = (order: OrderWithCustomerInfo) => {
    setDeletingOrder(order);
  };

  const confirmDelete = () => {
    if (deletingOrder) {
      deleteMutation.mutate(deletingOrder.id);
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="order-table">
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="order-table">
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Không thể tải dữ liệu đơn hàng</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      {/* 🌿 Gentle Green Notifications for Main Orders */}
      <NewOrderNotificationComponent />
      
      {/* 🧪 Test Notification (Dev Only) */}
      <div className="flex justify-end">
        <TestNewOrderNotification />
      </div>

      <Card data-testid="order-table">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Đơn hàng gần đây</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button 
              onClick={() => setIsCreateFormOpen(true)}
              data-testid="button-create-order"
              className="md:order-last"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo đơn hàng
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="orders-search"
                name="orders-search"
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:w-64"
                data-testid="input-search-orders"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-filter-status">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === "all" ? "Tất cả trạng thái" : getStatusBadge(statusFilter).props.children}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Tất cả trạng thái
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Chờ xử lý
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                  Đang xử lý
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("shipped")}>
                  Đã gửi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("delivered")}>
                  Đã giao
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                  Đã hủy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn hàng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                <TableCell className="font-medium" data-testid={`order-id-${order.id}`}>
                  {order.id}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                  </div>
                </TableCell>
                <TableCell data-testid={`order-date-${order.id}`}>
                  {order.createdAt ? formatDate(order.createdAt.toString()) : 'N/A'}
                </TableCell>
                <TableCell data-testid={`order-items-${order.id}`}>
                  {order.items} sản phẩm
                </TableCell>
                <TableCell className="font-medium" data-testid={`order-total-${order.id}`}>
                  {formatPrice(Number(order.total))}
                </TableCell>
                <TableCell data-testid={`order-status-${order.id}`}>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        data-testid={`order-actions-${order.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteOrder(order)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa đơn hàng
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {orders.length === 0 ? "Chưa có đơn hàng nào" : "Không tìm thấy đơn hàng nào."}
            </p>
          </div>
        )}
      </CardContent>

      {/* Create Order Form */}
      {isCreateFormOpen && (
        <OrderForm
          onClose={() => setIsCreateFormOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          }}
        />
      )}

      {/* Edit Order Form */}
      {editingOrder && (
        <OrderForm
          order={editingOrder as any}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng #{deletingOrder?.id.slice(-8)} của khách hàng {deletingOrder?.customerName} không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa đơn hàng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </div>
  );
}