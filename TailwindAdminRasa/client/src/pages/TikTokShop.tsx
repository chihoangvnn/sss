import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart3,
  ShoppingCart,
  Package,
  Settings,
  Store,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap
} from "lucide-react";
import { TikTokShopSellerDashboard } from "@/components/TikTokShopSellerDashboard";
import { TikTokShopOrdersPanel } from "@/components/TikTokShopOrdersPanel";
import { TikTokShopFulfillmentPanel } from "@/components/TikTokShopFulfillmentPanel";
import { useToast } from "@/hooks/use-toast";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.242 6.242 0 0 1-1.137-.966c-.849-.849-1.347-2.143-1.347-3.416C16.394.482 15.912 0 15.372 0h-3.372c-.54 0-.976.436-.976.976v11.405c0 1.47-1.194 2.665-2.665 2.665s-2.665-1.194-2.665-2.665c0-1.47 1.194-2.665 2.665-2.665.273 0 .537.041.786.117.54.166 1.119-.138 1.285-.678s-.138-1.119-.678-1.285a4.647 4.647 0 0 0-1.393-.203c-2.551 0-4.617 2.066-4.617 4.617s2.066 4.617 4.617 4.617 4.617-2.066 4.617-4.617V6.853c1.346.713 2.88 1.097 4.464 1.097.54 0 .976-.436.976-.976s-.436-.976-.976-.976c-1.346 0-2.64-.524-3.608-1.436z"/>
  </svg>
);

export default function TikTokShop() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch TikTok business accounts
  const { data: businessAccounts = [], isLoading, error } = useQuery({
    queryKey: ['tiktok-business-accounts'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tiktok/business-accounts');
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
      } catch (error) {
        console.error('Error fetching TikTok business accounts:', error);
        return [];
      }
    }
  });

  // Get primary business account (first connected account)
  const primaryAccount = businessAccounts.length > 0 ? businessAccounts[0] : null;

  // Connect to TikTok Shop
  const handleConnect = async (type: 'business' | 'shop') => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/tiktok-${type}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUrl: '/tiktok-shop' })
      });
      
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error(`Error connecting to TikTok ${type}:`, error);
      toast({
        title: "Lỗi kết nối",
        description: `Không thể kết nối với TikTok ${type === 'business' ? 'Business' : 'Shop'}. Vui lòng thử lại.`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-700 flex items-center justify-center">
                <TikTokIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-pink-900">TikTok Shop</CardTitle>
                <p className="text-sm text-pink-700 mt-1">
                  Đang tải thông tin tài khoản...
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Platform Banner */}
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-700 flex items-center justify-center">
              <TikTokIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-pink-900">TikTok Shop</CardTitle>
              <p className="text-sm text-pink-700 mt-1">
                Quản lý TikTok Shop và đơn hàng bán hàng trực tiếp
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-pink-100 text-pink-800">
              E-commerce Platform
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {!primaryAccount ? (
        /* Connection Required State */
        <div className="space-y-6">
          <Alert className="border-pink-200 bg-pink-50">
            <AlertCircle className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-800">
              Bạn cần kết nối tài khoản TikTok Business để sử dụng các tính năng quản lý TikTok Shop.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="h-5 w-5 text-pink-600" />
                Kết nối TikTok Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connection Button */}
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-3 mb-4">
                      <TikTokIcon className="w-8 h-8 text-pink-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">TikTok Business</h3>
                        <p className="text-sm text-gray-600">Kết nối để quản lý TikTok Shop</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleConnect('business')}
                      disabled={isConnecting}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      {isConnecting ? (
                        "Đang kết nối..."
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Kết nối TikTok Business
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="bg-white p-6 rounded-lg border border-pink-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Hướng dẫn kết nối</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <p className="font-medium text-gray-800">Đăng ký TikTok Business</p>
                        <p className="text-sm text-gray-600">Truy cập ads.tiktok.com để tạo tài khoản business</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <p className="font-medium text-gray-800">Tạo TikTok Shop</p>
                        <p className="text-sm text-gray-600">Đăng ký TikTok Shop seller account</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <p className="font-medium text-gray-800">Kết nối tài khoản</p>
                        <p className="text-sm text-gray-600">Nhấp "Kết nối TikTok Business" và làm theo hướng dẫn</p>
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
              className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Đơn hàng
            </TabsTrigger>
            <TabsTrigger 
              value="fulfillment"
              className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Fulfillment
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
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
                    <BarChart3 className="h-5 w-5 text-pink-600" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Store className="h-8 w-8 text-pink-600" />
                    <div>
                      <p className="font-semibold text-pink-800">{primaryAccount?.displayName || 'TikTok Shop chưa có tên'}</p>
                      <p className="text-sm text-pink-600">ID: {primaryAccount?.businessId || 'N/A'}</p>
                      <Badge className="bg-green-100 text-green-800 border-none mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đang hoạt động
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <TikTokShopSellerDashboard businessAccountId={primaryAccount?.id} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <TikTokShopOrdersPanel businessAccountId={primaryAccount?.id} />
          </TabsContent>

          <TabsContent value="fulfillment" className="space-y-6">
            <TikTokShopFulfillmentPanel businessAccountId={primaryAccount?.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Settings className="h-5 w-5 text-pink-600" />
                  Cài đặt TikTok Shop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Thông tin tài khoản</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tên hiển thị:</span>
                          <span className="font-medium">{primaryAccount?.displayName || 'Chưa có tên'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Business ID:</span>
                          <span className="font-medium">{primaryAccount?.businessId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Username:</span>
                          <span className="font-medium">{primaryAccount?.username || 'N/A'}</span>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}