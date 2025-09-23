import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  Eye,
  Heart,
  MessageSquare,
  Share,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SellerAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  monthlyOrders: number;
  orderGrowth: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  totalProducts: number;
  activeProducts: number;
  topPerformingProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    conversionRate: number;
  }>;
  compliance: {
    shippingPerformance: number;
    customerSatisfaction: number;
    policyCompliance: number;
  };
}

const CHART_COLORS = ['#FF6600', '#FF8C42', '#FFA366', '#FF6600', '#FF8C42']; // Shopee Orange Colors

export function ShopeeSellerDashboard({ businessAccountId }: { businessAccountId?: string }) {
  // Fetch seller analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['shopee-seller-analytics', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return null;
      const response = await fetch(`/api/shopee-shop/seller/${businessAccountId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!businessAccountId,
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch revenue trends
  const { data: revenueTrends } = useQuery({
    queryKey: ['shopee-revenue-trends', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return [];
      const response = await fetch(`/api/shopee-shop/analytics/order-trends?businessAccountId=${businessAccountId}&days=30`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    enabled: !!businessAccountId
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Chưa có dữ liệu</h3>
          <p className="text-orange-600">Kết nối tài khoản Shopee để xem thống kê</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Dashboard Shopee Seller</h2>
        <p className="text-orange-100">Tổng quan hiệu suất kinh doanh trên Shopee</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu tháng này</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.monthlyRevenue || 0)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(analytics.revenueGrowth || 0)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(analytics.revenueGrowth || 0)}`}>
                    {analytics.revenueGrowth >= 0 ? '+' : ''}{(analytics.revenueGrowth || 0).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hàng tháng này</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.monthlyOrders || 0)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(analytics.orderGrowth || 0)}
                  <span className={`text-sm font-medium ml-1 ${getGrowthColor(analytics.orderGrowth || 0)}`}>
                    {analytics.orderGrowth >= 0 ? '+' : ''}{(analytics.orderGrowth || 0).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giá trị đơn hàng TB</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.averageOrderValue || 0)}
                </p>
                <div className="flex items-center mt-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-500 ml-1">Mục tiêu: {formatCurrency(500000)}</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(analytics.fulfillmentRate || 0).toFixed(1)}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${analytics.fulfillmentRate || 0}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Xu hướng doanh thu (30 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrends && revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#FF6600" 
                    strokeWidth={3}
                    dot={{ fill: '#FF6600' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có dữ liệu xu hướng</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformingProducts && analytics.topPerformingProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topPerformingProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.orders} đơn hàng
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.conversionRate.toFixed(1)}% chuyển đổi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có sản phẩm bán chạy</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store Performance & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Hiệu suất cửa hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Tổng sản phẩm</span>
                </div>
                <span className="text-2xl font-bold text-orange-900">
                  {analytics.totalProducts || 0}
                </span>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Đang bán</span>
                </div>
                <span className="text-2xl font-bold text-green-900">
                  {analytics.activeProducts || 0}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Tổng doanh thu</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(analytics.totalRevenue || 0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
                  style={{ width: `${Math.min(100, ((analytics.totalRevenue || 0) / 100000000) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">Mục tiêu: {formatCurrency(100000000)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Chỉ số tuân thủ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Hiệu suất giao hàng</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.compliance?.shippingPerformance || 0}%
                  </span>
                </div>
                <Progress value={analytics.compliance?.shippingPerformance || 0} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Hài lòng khách hàng</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.compliance?.customerSatisfaction || 0}%
                  </span>
                </div>
                <Progress value={analytics.compliance?.customerSatisfaction || 0} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Tuân thủ chính sách</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.compliance?.policyCompliance || 0}%
                  </span>
                </div>
                <Progress value={analytics.compliance?.policyCompliance || 0} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                {((analytics.compliance?.shippingPerformance || 0) + 
                  (analytics.compliance?.customerSatisfaction || 0) + 
                  (analytics.compliance?.policyCompliance || 0)) / 3 >= 85 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Trạng thái: Tốt</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">Trạng thái: Cần cải thiện</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}