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
  Video, 
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
  totalVideos: number;
  totalViews: number;
  totalEngagement: number;
  topPerformingProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    conversionRate: number;
  }>;
  topPerformingVideos: Array<{
    id: string;
    caption: string;
    views: number;
    engagement: number;
    salesGenerated: number;
  }>;
  compliance: {
    shippingPerformance: number;
    customerSatisfaction: number;
    policyCompliance: number;
  };
}

const CHART_COLORS = ['#FE2C55', '#25F4EE', '#161823', '#FE2C55', '#25F4EE']; // TikTok Brand Colors

export function TikTokShopSellerDashboard({ businessAccountId }: { businessAccountId?: string }) {
  // Fetch seller analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['tiktok-shop-seller-analytics', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return null;
      const response = await fetch(`/api/tiktok-shop/seller/${businessAccountId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!businessAccountId,
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch revenue trends
  const { data: revenueTrends } = useQuery({
    queryKey: ['tiktok-shop-revenue-trends', businessAccountId],
    queryFn: async () => {
      if (!businessAccountId) return [];
      const response = await fetch(`/api/tiktok-shop/analytics/order-trends?businessAccountId=${businessAccountId}&days=30`);
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
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu</h3>
          <p className="text-gray-600">Kết nối TikTok Shop account để xem analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doanh thu tháng</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue)}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analytics.revenueGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analytics.revenueGrowth)}`}>
                    {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đơn hàng tháng</p>
                <p className="text-2xl font-bold">{analytics.monthlyOrders}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analytics.orderGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analytics.orderGrowth)}`}>
                    {Math.abs(analytics.orderGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Giá trị đơn TB</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tỉ lệ hoàn thành: {analytics.fulfillmentRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Video views</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.totalVideos} videos
                </p>
              </div>
              <Video className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Hiệu suất giao hàng</h4>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tỉ lệ giao đúng hạn</span>
                <span className="font-medium">{analytics.compliance.shippingPerformance}%</span>
              </div>
              <Progress value={analytics.compliance.shippingPerformance} className="h-2" />
              <p className="text-xs text-gray-500">
                {analytics.compliance.shippingPerformance >= 95 ? 'Xuất sắc' : 
                 analytics.compliance.shippingPerformance >= 90 ? 'Tốt' : 'Cần cải thiện'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Đánh giá khách hàng</h4>
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Điểm trung bình</span>
                <span className="font-medium">{analytics.compliance.customerSatisfaction}/5.0</span>
              </div>
              <Progress value={analytics.compliance.customerSatisfaction * 20} className="h-2" />
              <p className="text-xs text-gray-500">
                {analytics.compliance.customerSatisfaction >= 4.5 ? 'Xuất sắc' : 
                 analytics.compliance.customerSatisfaction >= 4.0 ? 'Tốt' : 'Cần cải thiện'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Tuân thủ chính sách</h4>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tỉ lệ tuân thủ</span>
                <span className="font-medium">{analytics.compliance.policyCompliance}%</span>
              </div>
              <Progress value={analytics.compliance.policyCompliance} className="h-2" />
              <p className="text-xs text-gray-500">
                {analytics.compliance.policyCompliance >= 98 ? 'Xuất sắc' : 
                 analytics.compliance.policyCompliance >= 95 ? 'Tốt' : 'Cần cải thiện'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      {revenueTrends && revenueTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng doanh thu (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('vi-VN')}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Products and Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPerformingProducts.map((product: any, index: number) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium truncate max-w-40">{product.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{product.orders} đơn</span>
                      <span>CR: {product.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performing Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Video hiệu quả nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPerformingVideos.map((video: any, index: number) => (
              <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium truncate max-w-40">{video.caption || 'Video không tiêu đề'}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {formatNumber(video.views)}
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {formatNumber(video.engagement)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(video.salesGenerated)}</p>
                  <p className="text-xs text-gray-500">Doanh thu</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Product & Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tổng sản phẩm</span>
                <Badge variant="outline">{analytics.totalProducts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Đang hoạt động</span>
                <Badge className="bg-green-100 text-green-800">{analytics.activeProducts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Tỉ lệ hoạt động</span>
                <span className="font-medium">
                  {analytics.totalProducts > 0 ? ((analytics.activeProducts / analytics.totalProducts) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <Progress 
                value={analytics.totalProducts > 0 ? (analytics.activeProducts / analytics.totalProducts) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan hiệu suất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tổng doanh thu</span>
                <span className="font-bold text-lg">{formatCurrency(analytics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tổng đơn hàng</span>
                <span className="font-medium">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tổng engagement</span>
                <span className="font-medium">{formatNumber(analytics.totalEngagement)}</span>
              </div>
              <div className="pt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  Account đang hoạt động
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}