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
  Calendar
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
import { formatOrderId } from '@/utils/orderUtils';

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  processing: { bg: 'bg-tiktok-cyan/20', text: 'text-tiktok-cyan', badge: 'bg-tiktok-cyan' },
  shipped: { bg: 'bg-tiktok-pink/20', text: 'text-tiktok-pink', badge: 'bg-tiktok-pink' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-500' },
  refunded: { bg: 'bg-tiktok-black/20', text: 'text-tiktok-black', badge: 'bg-tiktok-black' }
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw
};

interface TikTokShopOrder {
  id: string;
  tiktokOrderId: string;
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

export function TikTokShopOrdersPanel({ businessAccountId }: { businessAccountId?: string }) {
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
  
  // 🌿 Gentle Green Notifications
  const { triggerNewOrderNotification, NewOrderNotificationComponent } = useNewOrderNotification();

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['tiktok-shop-orders', businessAccountId, filters, currentPage],
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
      
      const response = await fetch(`/api/tiktok-shop/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!businessAccountId, // Only fetch when we have a business account
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch order analytics
  const { data: analytics } = useQuery({
    queryKey: ['tiktok-shop-analytics', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return null;
      const response = await fetch(`/api/tiktok-shop/analytics/orders?businessAccountId=${businessAccountId}&days=30`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!businessAccountId
  });

  // 🌿 New Order Detection & Gentle Notification Logic (Robust)
  useEffect(() => {
    if (ordersData?.orders && businessAccountId) {
      // Only process notifications on default view to avoid false positives
      const isDefaultView = currentPage === 1 && 
                            filters.status === 'all' && 
                            !filters.search && 
                            !filters.startDate && 
                            !filters.endDate && 
                            filters.sortBy === 'orderDate' && 
                            filters.sortOrder === 'desc';
      
      if (!isDefaultView) return;
      
      // Get persistent state for this business account
      const lastSeenKey = `lastSeenOrder_${businessAccountId}`;
      const seenIdsKey = `seenOrderIds_${businessAccountId}`;
      
      const lastSeenTimestamp = localStorage.getItem(lastSeenKey);
      const lastSeen = lastSeenTimestamp ? new Date(lastSeenTimestamp) : null;
      
      const seenIdsJson = localStorage.getItem(seenIdsKey);
      const seenIds = new Set<string>(seenIdsJson ? JSON.parse(seenIdsJson) : []);
      
      // Initialize baseline on first load to prevent deadlock
      if (!lastSeen && ordersData.orders.length > 0) {
        const newestOrderDate = new Date(ordersData.orders[0].orderDate);
        localStorage.setItem(lastSeenKey, newestOrderDate.toISOString());
        // Add all current order IDs to seen set to prevent immediate notifications
        ordersData.orders.forEach((order: TikTokShopOrder) => seenIds.add(order.id));
        localStorage.setItem(seenIdsKey, JSON.stringify(Array.from(seenIds)));
        return; // Skip notifications on initialization
      }
      
      // Find truly new orders (after last seen time AND not in seen IDs)
      const newOrders = ordersData.orders.filter((order: TikTokShopOrder) => {
        if (!lastSeen) return false; // Safety guard
        const orderDate = new Date(order.orderDate);
        return orderDate > lastSeen && !seenIds.has(order.id);
      });
      
      // Process each new order sequentially with stagger (max 20 to avoid spam)
      const notifyOrders = newOrders.slice(0, 20);
      const remainingCount = newOrders.length - notifyOrders.length;
      
      notifyOrders.forEach((order: TikTokShopOrder, index: number) => {
        setTimeout(() => {
          // Calculate time ago
          const orderDate = new Date(order.orderDate);
          const now = new Date();
          const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
          
          let timeAgo = 'Vừa xong';
          if (diffInMinutes >= 1 && diffInMinutes < 60) {
            timeAgo = `${diffInMinutes} phút trước`;
          } else if (diffInMinutes >= 60) {
            const hours = Math.floor(diffInMinutes / 60);
            timeAgo = `${hours} giờ trước`;
          }
          
          // Trigger gentle green notification
          triggerNewOrderNotification({
            id: order.id,
            orderNumber: order.orderNumber || formatOrderId({...order, source: 'tiktok-shop', sourceOrderId: order.tiktokOrderId}),
            customerName: order.customerInfo.name,
            totalAmount: order.totalAmount,
            currency: order.currency || 'VND',
            itemCount: order.items.length,
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
        const pageIsFull = ordersData.orders.length >= ordersPerPage; // Assuming 25 per page
        const potentialTruncation = remainingCount > 0 || (pageIsFull && newOrders.length >= ordersPerPage);
        
        if (!potentialTruncation) {
          // Safe to advance lastSeen - all new orders are on this page
          const maxNotifiedDate = Math.max(...notifyOrders.map((o: TikTokShopOrder) => new Date(o.orderDate).getTime()));
          const currentLastSeen = lastSeen || new Date(0);
          const newLastSeen = new Date(Math.max(maxNotifiedDate, currentLastSeen.getTime()));
          localStorage.setItem(lastSeenKey, newLastSeen.toISOString());
        }
        // If truncation detected, rely on seenIds for deduplication without advancing lastSeen
      }
      
      // Always update seen IDs for current page to maintain LRU cache
      if (ordersData.orders.length > 0) {
        // Add all notified order IDs to seen set 
        notifyOrders.forEach((order: TikTokShopOrder) => seenIds.add(order.id));
        
        // Prune seenIds to maintain LRU with 500 limit
        const seenIdsArray = Array.from(seenIds);
        const prunedSeenIds = seenIdsArray.slice(-500);
        localStorage.setItem(seenIdsKey, JSON.stringify(prunedSeenIds));
      }
    }
  }, [ordersData, businessAccountId, currentPage, filters, triggerNewOrderNotification]);

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, updates }: { 
      orderId: string; 
      status: string; 
      updates?: any 
    }) => {
      const response = await fetch(`/api/tiktok-shop/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...updates })
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-shop-orders'] });
      toast({ title: 'Đơn Hàng Đã Cập Nhật', description: 'Trạng thái đơn hàng được cập nhật thành công' });
    },
    onError: () => {
      toast({ 
        variant: 'destructive',
        title: 'Cập Nhật Thất Bại', 
        description: 'Không thể cập nhật trạng thái đơn hàng' 
      });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, updates }: { orderIds: string[]; updates: any }) => {
      const response = await fetch(`/api/tiktok-shop/orders/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, updates })
      });
      if (!response.ok) throw new Error('Failed to bulk update orders');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-shop-orders'] });
      setSelectedOrders([]);
      toast({ title: 'Cập Nhật Hàng Loạt Thành Công', description: 'Các đơn hàng đã chọn được cập nhật thành công' });
    }
  });

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === ordersData?.orders?.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(ordersData?.orders?.map((order: TikTokShopOrder) => order.id) || []);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🌿 Gentle Green Notifications */}
      <NewOrderNotificationComponent />
      
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Doanh thu</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.pendingOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã giao</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.deliveredOrders}</p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo mã đơn hàng..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="shipped">Đã giao</SelectItem>
                  <SelectItem value="delivered">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-40"
              />
              
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex gap-2">
              {selectedOrders.length > 0 && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => bulkUpdateMutation.mutate({
                      orderIds: selectedOrders,
                      updates: { status: 'processing' }
                    })}
                  >
                    Đánh dấu xử lý ({selectedOrders.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => bulkUpdateMutation.mutate({
                      orderIds: selectedOrders,
                      updates: { status: 'shipped' }
                    })}
                  >
                    Đánh dấu đã giao
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Danh sách đơn hàng ({ordersData?.totalCount || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedOrders.length === ordersData?.orders?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === ordersData?.orders?.length && ordersData?.orders?.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-medium">Đơn hàng</th>
                  <th className="text-left p-4 font-medium">Khách hàng</th>
                  <th className="text-left p-4 font-medium">Sản phẩm</th>
                  <th className="text-left p-4 font-medium">Tổng tiền</th>
                  <th className="text-left p-4 font-medium">Trạng thái</th>
                  <th className="text-left p-4 font-medium">Ngày đặt</th>
                  <th className="text-center p-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ordersData?.orders?.map((order: TikTokShopOrder) => {
                  const StatusIcon = statusIcons[order.status];
                  const statusStyle = statusColors[order.status];
                  
                  return (
                    <tr key={order.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleOrderSelect(order.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">ID: {order.tiktokOrderId}</p>
                          {order.trackingNumber && (
                            <p className="text-sm text-blue-600">Tracking: {order.trackingNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.customerInfo.name}</p>
                          {order.customerInfo.phone && (
                            <p className="text-sm text-gray-500">{order.customerInfo.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm">{order.items.length} sản phẩm</p>
                          <p className="text-xs text-gray-500">
                            {order.items[0]?.name}{order.items.length > 1 && ` và ${order.items.length - 1} sản phẩm khác`}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status === 'pending' ? 'Chờ xử lý' :
                           order.status === 'processing' ? 'Đang xử lý' :
                           order.status === 'shipped' ? 'Đã giao' :
                           order.status === 'delivered' ? 'Hoàn thành' :
                           order.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tiền'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{formatDate(order.orderDate)}</p>
                      </td>
                      <td className="p-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateOrderMutation.mutate({
                                orderId: order.id,
                                status: 'processing'
                              })}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Cập nhật trạng thái
                            </DropdownMenuItem>
                            {order.status === 'processing' && (
                              <DropdownMenuItem
                                onClick={() => updateOrderMutation.mutate({
                                  orderId: order.id,
                                  status: 'shipped',
                                  updates: { trackingNumber: `TT${Date.now()}` }
                                })}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Đánh dấu đã giao
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersData?.totalCount > ordersPerPage && (
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-gray-600">
                Hiển thị {(currentPage - 1) * ordersPerPage + 1} - {Math.min(currentPage * ordersPerPage, ordersData.totalCount)} / {ordersData.totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage * ordersPerPage >= ordersData.totalCount}
                  onClick={() => setCurrentPage(p => p + 1)}
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