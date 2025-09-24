import React, { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopeeOrdersPanel } from "@/components/ShopeeOrdersPanel";
import { ShopeeSellerDashboard } from "@/components/ShopeeSellerDashboard"; 
import { ShopeeFulfillmentPanel } from "@/components/ShopeeFulfillmentPanel";
import { SocialMediaPanel } from "@/components/SocialMediaPanel";
import { 
  ShoppingCart, 
  BarChart3, 
  Package, 
  Settings, 
  Store,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

// Shopee Brand Icon Component
const ShopeeIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.5 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-13 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6.5-5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  </svg>
);

export default function Shopee() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] = useState<string | null>(null);

  // Fetch real business accounts from API
  const { data: businessAccounts, isLoading, refetch } = useQuery({
    queryKey: ['shopee-accounts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shopee-shop/accounts');
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const connectedAccounts = businessAccounts?.accounts || [];
  const isConnected = connectedAccounts.length > 0;
  const primaryAccount = connectedAccounts[0] || null;

  // Set selected account if available
  useEffect(() => {
    if (primaryAccount && !selectedBusinessAccountId) {
      setSelectedBusinessAccountId(primaryAccount.id);
    }
  }, [primaryAccount, selectedBusinessAccountId]);

  // Handle connection success from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      refetch(); // Refresh accounts after successful connection
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-shopee">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <ShopeeIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Shopee Marketplace</h1>
                <p className="text-orange-100 mt-1">
                  Quản lý đơn hàng và bán hàng trên nền tảng Shopee
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span className="text-sm">Đang kiểm tra...</span>
                </div>
              ) : isConnected && primaryAccount ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm">Đã kết nối: {primaryAccount.shopName || `Shop ${primaryAccount.shopId}`}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm">Chưa kết nối</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {!isConnected ? (
          /* Connection Required State */
          <div className="max-w-2xl mx-auto">
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto p-4 bg-orange-500 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <ShopeeIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-orange-800 mb-2">
                  Kết nối với Shopee
                </CardTitle>
                <p className="text-orange-600">
                  Kết nối tài khoản Shopee để quản lý đơn hàng và bán hàng trực tiếp từ dashboard
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">Quản lý đơn hàng</p>
                        <p className="text-sm text-gray-600">Xem và xử lý đơn hàng</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">Thống kê bán hàng</p>
                        <p className="text-sm text-gray-600">Báo cáo doanh thu chi tiết</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <Package className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">Fulfillment</p>
                        <p className="text-sm text-gray-600">Quản lý vận chuyển</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <Store className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">Đồng bộ sản phẩm</p>
                        <p className="text-sm text-gray-600">Tự động sync inventory</p>
                      </div>
                    </div>
                  </div>

                  {/* Connection Form */}
                  <div className="bg-white p-6 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Thông tin kết nối</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sử dụng Partner ID và Partner Key từ Shopee Open Platform để kết nối
                    </p>
                    
                    <div className="space-y-4">
                      <SocialMediaPanel 
                        onConnectAccount={(platform) => {
                          if (platform === 'shopee') {
                            // Handle Shopee connection
                            console.log('Connecting to Shopee...');
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="bg-white p-6 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Hướng dẫn kết nối</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <p className="font-medium text-gray-800">Đăng ký Shopee Open Platform</p>
                          <p className="text-sm text-gray-600">Truy cập open.shopee.com để tạo ứng dụng</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <p className="font-medium text-gray-800">Lấy Partner ID & Partner Key</p>
                          <p className="text-sm text-gray-600">Copy Partner ID và Partner Key từ dashboard</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <p className="font-medium text-gray-800">Kết nối tài khoản</p>
                          <p className="text-sm text-gray-600">Nhấp "Kết nối Shopee" và làm theo hướng dẫn</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Connected State - Main Dashboard */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <ShoppingCart className="h-4 w-4" />
                Đơn hàng
              </TabsTrigger>
              <TabsTrigger 
                value="fulfillment"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Package className="h-4 w-4" />
                Fulfillment
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4" />
                Cài đặt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Store className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="font-semibold text-orange-800">{primaryAccount?.shopName || 'Shop chưa có tên'}</p>
                        <p className="text-sm text-orange-600">ID: {primaryAccount?.shopId || 'N/A'}</p>
                        <Badge className="bg-green-100 text-green-800 border-none mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đang hoạt động
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <ShopeeSellerDashboard businessAccountId={primaryAccount?.id} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <ShopeeOrdersPanel businessAccountId={primaryAccount?.id} />
            </TabsContent>

            <TabsContent value="fulfillment" className="space-y-6">
              <ShopeeFulfillmentPanel businessAccountId={primaryAccount?.id} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Settings className="h-5 w-5 text-orange-600" />
                    Cài đặt Shopee
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Thông tin cửa hàng</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tên cửa hàng:</span>
                            <span className="font-medium">{primaryAccount?.shopName || 'Chưa có tên'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shop ID:</span>
                            <span className="font-medium">{primaryAccount?.shopId || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trạng thái:</span>
                            <Badge className="bg-green-100 text-green-800 border-none">
                              Đang hoạt động
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Cài đặt đồng bộ</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Tự động đồng bộ đơn hàng</span>
                          <Button variant="outline" size="sm">
                            Bật
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Cập nhật inventory</span>
                          <Button variant="outline" size="sm">
                            Bật
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Thông báo đơn hàng mới</span>
                          <Button variant="outline" size="sm">
                            Bật
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <div className="flex gap-3">
                      <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                        Ngắt kết nối
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        Lưu cài đặt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}