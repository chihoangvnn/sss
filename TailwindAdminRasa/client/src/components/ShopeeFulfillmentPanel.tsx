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
  low: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  normal: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  high: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  urgent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
};

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  processing: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Package },
  ready_to_ship: { bg: 'bg-green-100', text: 'text-green-800', icon: Archive },
  shipped: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
};

const shippingCarriers = [
  { id: 'ghn', name: 'Giao Hàng Nhanh' },
  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm' },
  { id: 'viettel_post', name: 'Viettel Post' },
  { id: 'vnpost', name: 'Vietnam Post' },
  { id: 'j_t', name: 'J&T Express' },
  { id: 'shopee_express', name: 'Shopee Express' }
];

export function ShopeeFulfillmentPanel({ businessAccountId }: { businessAccountId?: string }) {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });
  
  const [selectedTask, setSelectedTask] = useState<FulfillmentTask | null>(null);
  const [shippingDetails, setShippingDetails] = useState({
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fulfillment queue
  const { data: fulfillmentQueue, isLoading } = useQuery({
    queryKey: ['shopee-fulfillment-queue', businessAccountId, filters],
    queryFn: async () => {
      if (!businessAccountId) return [];
      
      const params = new URLSearchParams({
        businessAccountId,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      });
      
      const response = await fetch(`/api/shopee-shop/fulfillment/queue?${params}`);
      if (!response.ok) throw new Error('Failed to fetch fulfillment queue');
      return response.json();
    },
    enabled: !!businessAccountId,
    refetchInterval: 30000
  });

  // Fetch fulfillment stats
  const { data: stats } = useQuery({
    queryKey: ['shopee-fulfillment-stats', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return null;
      const response = await fetch(`/api/shopee-shop/fulfillment/stats?businessAccountId=${businessAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!businessAccountId
  });

  // Update fulfillment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status, updates }: { taskId: string; status: string; updates?: any }) => {
      const response = await fetch(`/api/shopee-shop/fulfillment/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...updates })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopee-fulfillment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['shopee-fulfillment-stats'] });
      toast({
        title: "✅ Cập nhật thành công",
        description: "Trạng thái fulfillment đã được cập nhật",
      });
    }
  });

  // Generate shipping label mutation
  const generateLabelMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/shopee-shop/fulfillment/tasks/${taskId}/shipping-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate label');
      return response.blob();
    },
    onSuccess: (blob, taskId) => {
      // Download the generated label
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopee-shipping-label-${taskId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "✅ Tạo nhãn thành công",
        description: "Nhãn vận chuyển đã được tạo và tải xuống",
      });
    }
  });

  const handleUpdateStatus = (taskId: string, status: string, updates?: any) => {
    updateStatusMutation.mutate({ taskId, status, updates });
  };

  const handleGenerateLabel = (taskId: string) => {
    generateLabelMutation.mutate(taskId);
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

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cần xử lý</p>
                <p className="text-xl font-bold text-orange-800">
                  {stats?.pendingTasks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang giao</p>
                <p className="text-xl font-bold text-blue-800">
                  {stats?.shippedTasks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-xl font-bold text-green-800">
                  {stats?.completedTasks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hiệu suất</p>
                <p className="text-xl font-bold text-purple-800">
                  {stats?.efficiency || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Hàng đợi Fulfillment Shopee</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                In nhãn hàng loạt
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="ready_to_ship">Sẵn sàng giao</SelectItem>
                <SelectItem value="shipped">Đã giao</SelectItem>
                <SelectItem value="delivered">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                <SelectItem value="urgent">Khẩn cấp</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Lọc nâng cao
            </Button>
          </div>

          {/* Fulfillment Tasks List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : !fulfillmentQueue || fulfillmentQueue.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Không có tác vụ fulfillment
                </h3>
                <p className="text-gray-500">
                  Tất cả đơn hàng đã được xử lý hoặc chưa có đơn hàng mới
                </p>
              </div>
            ) : (
              fulfillmentQueue.map((task: FulfillmentTask) => {
                const StatusIcon = statusColors[task.status].icon;
                const statusStyle = statusColors[task.status];
                const priorityStyle = priorityColors[task.priority];
                const daysUntilDue = getDaysUntilDue(task.dueDate);
                
                return (
                  <Card key={task.id} className={`border-l-4 ${priorityStyle.border}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${priorityStyle.bg} ${priorityStyle.text} border-none`}>
                              {task.priority === 'urgent' ? 'Khẩn cấp' :
                               task.priority === 'high' ? 'Cao' :
                               task.priority === 'normal' ? 'Bình thường' : 'Thấp'}
                            </Badge>
                            <Badge className={`${statusStyle.bg} ${statusStyle.text} border-none`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {task.status === 'pending' ? 'Chờ xử lý' :
                               task.status === 'processing' ? 'Đang xử lý' :
                               task.status === 'ready_to_ship' ? 'Sẵn sàng giao' :
                               task.status === 'shipped' ? 'Đã giao' :
                               task.status === 'delivered' ? 'Hoàn thành' : 'Thất bại'}
                            </Badge>
                            {daysUntilDue <= 1 && (
                              <Badge className="bg-red-100 text-red-800 border-none">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Gần hạn
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                Đơn hàng #{task.orderNumber}
                              </h4>
                              <p className="text-sm text-gray-600">
                                <User className="h-4 w-4 inline mr-1" />
                                {task.customerName}
                              </p>
                              <p className="text-sm text-gray-600">
                                <Package className="h-4 w-4 inline mr-1" />
                                {task.items.length} sản phẩm
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Tạo: {formatDate(task.createdAt)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Hạn: {formatDate(task.dueDate)} 
                                <span className={daysUntilDue <= 1 ? 'text-red-600 font-medium ml-1' : 'text-gray-500 ml-1'}>
                                  ({daysUntilDue > 0 ? `${daysUntilDue} ngày` : 'Quá hạn'})
                                </span>
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-gray-900 mb-1">
                                {formatCurrency(task.totalAmount)}
                              </p>
                              <div className="flex gap-1 justify-end">
                                {task.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(task.id, 'processing')}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Package className="h-4 w-4 mr-1" />
                                    Bắt đầu
                                  </Button>
                                )}
                                
                                {task.status === 'processing' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(task.id, 'ready_to_ship')}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Archive className="h-4 w-4 mr-1" />
                                    Sẵn sàng
                                  </Button>
                                )}

                                {task.status === 'ready_to_ship' && (
                                  <div className="flex gap-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <Truck className="h-4 w-4 mr-1" />
                                          Giao hàng
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Cấu hình giao hàng</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <label className="text-sm font-medium">Nhà vận chuyển</label>
                                            <Select 
                                              value={shippingDetails.carrier} 
                                              onValueChange={(value) => setShippingDetails(prev => ({ ...prev, carrier: value }))}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Chọn nhà vận chuyển" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {shippingCarriers.map(carrier => (
                                                  <SelectItem key={carrier.id} value={carrier.id}>
                                                    {carrier.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          <div>
                                            <label className="text-sm font-medium">Mã vận đơn</label>
                                            <Input
                                              value={shippingDetails.trackingNumber}
                                              onChange={(e) => setShippingDetails(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                              placeholder="Nhập mã vận đơn"
                                            />
                                          </div>
                                          
                                          <div>
                                            <label className="text-sm font-medium">Ngày giao dự kiến</label>
                                            <Input
                                              type="date"
                                              value={shippingDetails.estimatedDelivery}
                                              onChange={(e) => setShippingDetails(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                                            />
                                          </div>
                                          
                                          <div className="flex gap-2">
                                            <Button
                                              onClick={() => handleUpdateStatus(task.id, 'shipped', shippingDetails)}
                                              disabled={!shippingDetails.carrier || !shippingDetails.trackingNumber}
                                              className="flex-1"
                                            >
                                              <Truck className="h-4 w-4 mr-2" />
                                              Xác nhận giao hàng
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateLabel(task.id)}
                                      disabled={generateLabelMutation.isPending}
                                    >
                                      <Printer className="h-4 w-4 mr-1" />
                                      Nhãn
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {task.items.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex justify-between text-gray-600">
                                  <span className="truncate">{item.productName}</span>
                                  <span>SL: {item.quantity}</span>
                                </div>
                              ))}
                              {task.items.length > 2 && (
                                <div className="text-gray-500 text-xs">
                                  +{task.items.length - 2} sản phẩm khác
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}