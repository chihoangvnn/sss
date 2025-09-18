import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Archive,
  MapPin,
  User,
  Phone,
  Calendar,
  Filter,
  Download,
  Printer,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FulfillmentTask {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
  }>;
  shippingAddress: any;
  totalAmount: number;
  createdAt: string;
  dueDate: string;
}

const priorityColors = {
  low: { bg: 'bg-tiktok-gray-100', text: 'text-tiktok-gray-800', border: 'border-tiktok-gray-200' },
  normal: { bg: 'bg-tiktok-cyan/20', text: 'text-tiktok-cyan', border: 'border-tiktok-cyan/30' },
  high: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  urgent: { bg: 'bg-tiktok-pink/20', text: 'text-tiktok-pink', border: 'border-tiktok-pink/30' }
};

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  processing: { bg: 'bg-tiktok-cyan/20', text: 'text-tiktok-cyan', icon: Package },
  ready_to_ship: { bg: 'bg-green-100', text: 'text-green-800', icon: Archive },
  shipped: { bg: 'bg-tiktok-pink/20', text: 'text-tiktok-pink', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
};

const shippingCarriers = [
  { id: 'ghn', name: 'Giao Hàng Nhanh' },
  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm' },
  { id: 'viettel_post', name: 'Viettel Post' },
  { id: 'vnpost', name: 'Vietnam Post' },
  { id: 'j_t', name: 'J&T Express' },
  { id: 'tiktok_shipping', name: 'TikTok Shipping' }
];

export function TikTokShopFulfillmentPanel({ businessAccountId }: { businessAccountId?: string }) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    urgent: false
  });
  const [selectedCarrier, setSelectedCarrier] = useState('ghn');
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fulfillment queue
  const { data: fulfillmentQueue, isLoading } = useQuery({
    queryKey: ['tiktok-shop-fulfillment-queue', businessAccountId, filters],
    queryFn: async () => {
      if (!businessAccountId) return [];
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/tiktok-shop/fulfillment/${businessAccountId}/queue?${params}`);
      if (!response.ok) throw new Error('Failed to fetch fulfillment queue');
      return response.json();
    },
    enabled: !!businessAccountId,
    refetchInterval: 30000
  });

  // Fetch fulfillment analytics
  const { data: analytics } = useQuery({
    queryKey: ['tiktok-shop-fulfillment-analytics', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return null;
      const response = await fetch(`/api/tiktok-shop/fulfillment/${businessAccountId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!businessAccountId
  });

  // Process fulfillment mutation
  const processFulfillmentMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const response = await fetch(`/api/tiktok-shop/fulfillment/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to process fulfillment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-shop-fulfillment-queue'] });
      toast({ title: 'Fulfillment Updated', description: 'Order fulfillment updated successfully' });
    }
  });

  // Bulk process mutation
  const bulkProcessMutation = useMutation({
    mutationFn: async ({ orderIds, action }: { orderIds: string[]; action: any }) => {
      const response = await fetch(`/api/tiktok-shop/fulfillment/bulk-process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, action })
      });
      if (!response.ok) throw new Error('Failed to bulk process');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-shop-fulfillment-queue'] });
      setSelectedTasks([]);
      toast({ title: 'Bulk Process Success', description: 'Selected orders processed successfully' });
    }
  });

  // Generate shipping labels mutation
  const generateLabelsMutation = useMutation({
    mutationFn: async ({ orderIds, carrier }: { orderIds: string[]; carrier: string }) => {
      const response = await fetch(`/api/tiktok-shop/fulfillment/shipping-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, carrier })
      });
      if (!response.ok) throw new Error('Failed to generate labels');
      return response.json();
    },
    onSuccess: (labels) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-shop-fulfillment-queue'] });
      toast({ 
        title: 'Labels Generated', 
        description: `Generated ${labels.length} shipping labels successfully` 
      });
    }
  });

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === fulfillmentQueue?.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(fulfillmentQueue?.map((task: FulfillmentTask) => task.orderId) || []);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.pendingFulfillment}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đang xử lý</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.processingFulfillment}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tỉ lệ hoàn thành</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.fulfillmentRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Thời gian xử lý TB</p>
                  <p className="text-2xl font-bold">{analytics.averageProcessingTime.toFixed(1)}h</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="ready_to_ship">Sẵn sàng giao</SelectItem>
                  <SelectItem value="shipped">Đã giao</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="normal">Thường</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {selectedTasks.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => bulkProcessMutation.mutate({
                      orderIds: selectedTasks,
                      action: { type: 'mark_processing' }
                    })}
                  >
                    Đánh dấu xử lý ({selectedTasks.length})
                  </Button>
                  
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingCarriers.map(carrier => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => generateLabelsMutation.mutate({
                      orderIds: selectedTasks,
                      carrier: selectedCarrier
                    })}
                    disabled={generateLabelsMutation.isPending}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Tạo vận đơn
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Hàng đợi fulfillment ({fulfillmentQueue?.length || 0})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTasks.length === fulfillmentQueue?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            {fulfillmentQueue?.map((task: FulfillmentTask) => {
              const StatusIcon = statusColors[task.status].icon;
              const statusStyle = statusColors[task.status];
              const priorityStyle = priorityColors[task.priority];
              const overdueDays = getDaysOverdue(task.dueDate);
              
              return (
                <div 
                  key={task.id} 
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                    selectedTasks.includes(task.orderId) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.orderId)}
                      onChange={() => handleTaskSelect(task.orderId)}
                      className="mt-1"
                    />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Order Info */}
                      <div className="md:col-span-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{task.orderNumber}</h4>
                          <Badge className={`${priorityStyle.bg} ${priorityStyle.text} border-0`}>
                            {task.priority === 'urgent' ? 'Khẩn cấp' :
                             task.priority === 'high' ? 'Cao' :
                             task.priority === 'normal' ? 'Thường' : 'Thấp'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{formatCurrency(task.totalAmount)}</p>
                        {overdueDays > 0 && (
                          <p className="text-sm text-red-600 font-medium">
                            Quá hạn {overdueDays} ngày
                          </p>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{task.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate max-w-32">
                            {task.shippingAddress?.city || 'Chưa có địa chỉ'}
                          </span>
                        </div>
                      </div>

                      {/* Items Info */}
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium mb-1">
                          {task.items.length} sản phẩm
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          {task.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="truncate">
                              {item.productName} × {item.quantity}
                            </div>
                          ))}
                          {task.items.length > 2 && (
                            <p className="text-xs text-gray-500">
                              và {task.items.length - 2} sản phẩm khác
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2">
                        <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 mb-2`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {task.status === 'pending' ? 'Chờ xử lý' :
                           task.status === 'processing' ? 'Đang xử lý' :
                           task.status === 'ready_to_ship' ? 'Sẵn sàng giao' :
                           task.status === 'shipped' ? 'Đã giao' :
                           task.status === 'delivered' ? 'Hoàn thành' : 'Lỗi'}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Hạn: {formatDate(task.dueDate)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex items-center space-x-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processFulfillmentMutation.mutate({
                              orderId: task.orderId,
                              updates: { fulfillmentStatus: 'processing' }
                            })}
                          >
                            Bắt đầu xử lý
                          </Button>
                        )}
                        
                        {task.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => generateLabelsMutation.mutate({
                              orderIds: [task.orderId],
                              carrier: selectedCarrier
                            })}
                          >
                            Tạo vận đơn
                          </Button>
                        )}

                        {task.status === 'ready_to_ship' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => processFulfillmentMutation.mutate({
                              orderId: task.orderId,
                              updates: { 
                                fulfillmentStatus: 'shipped',
                                trackingNumber: `TT${Date.now()}`
                              }
                            })}
                          >
                            Đánh dấu đã giao
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!fulfillmentQueue || fulfillmentQueue.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Không có đơn hàng cần xử lý</h3>
                <p className="text-gray-500">Tất cả đơn hàng đã được xử lý hoàn tất</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Performance */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tỉ lệ giao đúng hạn</span>
                  <span className="font-medium">{analytics.onTimeDeliveryRate}%</span>
                </div>
                <Progress value={analytics.onTimeDeliveryRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tỉ lệ hoàn thành fulfillment</span>
                  <span className="font-medium">{analytics.fulfillmentRate.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.fulfillmentRate} className="h-2" />
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Thời gian xử lý trung bình</span>
                  <span className="font-medium">{analytics.averageProcessingTime.toFixed(1)} giờ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Đơn hàng khẩn cấp</span>
                  <span className="font-medium text-red-600">{analytics.urgentOrders}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trạng thái fulfillment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Chờ xử lý</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {analytics.pendingFulfillment}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Đang xử lý</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {analytics.processingFulfillment}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Đã giao hàng</span>
                <Badge className="bg-green-100 text-green-800">
                  {analytics.shippedOrders}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Hoàn thành</span>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {analytics.deliveredOrders}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}