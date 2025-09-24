import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Edit,
  MoreHorizontal,
  RefreshCw,
  Download,
  Calendar,
  CreditCard,
  Package2,
  PackageCheck,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useNewOrderNotification } from './NewOrderNotification';

const statusColors = {
  // Generic statuses
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  processing: { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-500' },
  shipped: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-500' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-500' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500' },
  // Shopee-specific statuses
  unpaid: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-500' },
  to_ship: { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-500' },
  to_confirm_receive: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-500' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500' },
  to_return: { bg: 'bg-purple-100', text: 'text-purple-800', badge: 'bg-purple-500' },
  in_cancel: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500' }
};

const statusIcons = {
  // Generic statuses
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw,
  // Shopee-specific statuses
  unpaid: CreditCard,
  to_ship: Package2,
  to_confirm_receive: PackageCheck,
  completed: CheckCircle,
  to_return: RotateCcw,
  in_cancel: AlertTriangle
};

interface ShopeeOrder {
  id: string;
  shopeeOrderId: string;
  orderNumber: string;
  status: keyof typeof statusColors;
  fulfillmentStatus: string;
  customerInfo: {
    name: string;
    email?: string;
    phone?: string;
    shippingAddress: any;
  };
  totalAmount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  orderDate: string;
  trackingNumber?: string;
  shippingCarrier?: string;
}

interface OrderFilters {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function ShopeeOrdersPanel({ businessAccountId }: { businessAccountId?: string }) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'orderDate',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 25;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🧡 Shopee Orange Notifications
  const { triggerNewOrderNotification, NewOrderNotificationComponent } = useNewOrderNotification();

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['shopee-orders', businessAccountId, filters, currentPage],
    queryFn: async () => {
      if (!businessAccountId) return { orders: [], totalCount: 0 };
      
      const params = new URLSearchParams({
        businessAccountId,
        limit: ordersPerPage.toString(),
        offset: ((currentPage - 1) * ordersPerPage).toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      const response = await fetch(`/api/shopee-shop/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch Shopee orders');
      return response.json();
    },
    enabled: !!businessAccountId,
    refetchInterval: 30000 // Refresh every 30 seconds for new orders
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, updates }: { orderId: string; status: string; updates?: any }) => {
      const response = await fetch(`/api/shopee-shop/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...updates })
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopee-orders'] });
      toast({
        title: "✅ Cập nhật thành công",
        description: "Trạng thái đơn hàng đã được cập nhật",
      });
    }
  });

  // Bulk update orders mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, action }: { orderIds: string[]; action: string }) => {
      const response = await fetch('/api/shopee-shop/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, action })
      });
      if (!response.ok) throw new Error('Failed to bulk update orders');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopee-orders'] });
      setSelectedOrders([]);
      toast({
        title: "✅ Cập nhật hàng loạt thành công", 
        description: "Đã cập nhật tất cả đơn hàng được chọn",
      });
    }
  });

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ordersPerPage);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order: any) => order.id));
    }
  };

  const handleUpdateOrder = (orderId: string, status: string, updates?: any) => {
    updateOrderMutation.mutate({ orderId, status, updates });
  };

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "⚠️ Chưa chọn đơn hàng",
        description: "Vui lòng chọn ít nhất một đơn hàng để thực hiện",
        variant: "destructive"
      });
      return;
    }
    bulkUpdateMutation.mutate({ orderIds: selectedOrders, action });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-sm">Không thể tải danh sách đơn hàng Shopee</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['shopee-orders'] })}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <NewOrderNotificationComponent />
      
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Quản lý Đơn hàng Shopee</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {totalCount} đơn hàng • {selectedOrders.length} đã chọn
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['shopee-orders'] })}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipped">Đã giao</SelectItem>
                <SelectItem value="delivered">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1"
              />
            </div>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orderDate">Ngày đặt</SelectItem>
                <SelectItem value="totalAmount">Giá trị</SelectItem>
                <SelectItem value="status">Trạng thái</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
              <span className="text-sm font-medium text-orange-800">
                Đã chọn {selectedOrders.length} đơn hàng
              </span>
              <div className="flex gap-2 ml-auto">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('mark_processing')}
                  disabled={bulkUpdateMutation.isPending}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Đánh dấu đang xử lý
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('mark_shipped')}
                  disabled={bulkUpdateMutation.isPending}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Đánh dấu đã giao
                </Button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrders.length === orders.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Đơn hàng</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Khách hàng</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Giá trị</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Ngày đặt</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="p-4">
                        <div className="animate-pulse flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Chưa có đơn hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: ShopeeOrder) => {
                    const StatusIcon = statusIcons[order.status] || Clock;
                    const statusStyle = statusColors[order.status] || { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500' };
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {order.shopeeOrderId}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.customerInfo.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items.length} sản phẩm
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            className={`${statusStyle.bg} ${statusStyle.text} border-none`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {order.status === 'pending' ? 'Chờ xử lý' :
                             order.status === 'processing' ? 'Đang xử lý' :
                             order.status === 'shipped' ? 'Đã giao' :
                             order.status === 'delivered' ? 'Hoàn thành' :
                             order.status === 'cancelled' ? 'Đã hủy' :
                             order.status === 'refunded' ? 'Đã hoàn tiền' :
                             order.status === 'unpaid' ? 'Chưa thanh toán' :
                             order.status === 'to_ship' ? 'Chờ giao hàng' :
                             order.status === 'to_confirm_receive' ? 'Chờ xác nhận' :
                             order.status === 'completed' ? 'Hoàn thành' :
                             order.status === 'to_return' ? 'Trả hàng' :
                             order.status === 'in_cancel' ? 'Đang hủy' : order.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.currency}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-900">
                            {formatDate(order.orderDate)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Chi tiết đơn hàng #{order.orderNumber}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Khách hàng</label>
                                      <p className="text-sm text-gray-900 mt-1">{order.customerInfo.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Tổng tiền</label>
                                      <p className="text-sm text-gray-900 mt-1">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Sản phẩm</label>
                                    <div className="mt-2 space-y-2">
                                      {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                                          <span>{item.name}</span>
                                          <span>SL: {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, 'processing')}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Đánh dấu đang xử lý
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, 'shipped')}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Đánh dấu đã giao
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, 'delivered')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Đánh dấu hoàn thành
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, 'cancelled')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Hủy đơn hàng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Hiển thị {((currentPage - 1) * ordersPerPage) + 1} đến {Math.min(currentPage * ordersPerPage, totalCount)} trong {totalCount} đơn hàng
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className="text-sm">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}