import React, { useState } from "react";
import { Facebook, MessageSquare, TrendingUp, Users, ShoppingBag, Video, Star, ArrowUpRight, ArrowDownRight, BarChart3, Calendar, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SocialAccount } from "@shared/schema";

// TikTok Icon Component (since Lucide doesn't have TikTok)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.242 6.242 0 0 1-1.137-.966c-.849-.849-1.347-2.143-1.347-3.416C16.394.482 15.912 0 15.372 0h-3.372c-.54 0-.976.436-.976.976v11.405c0 1.47-1.194 2.665-2.665 2.665s-2.665-1.194-2.665-2.665c0-1.47 1.194-2.665 2.665-2.665.273 0 .537.041.786.117.54.166 1.119-.138 1.285-.678s-.138-1.119-.678-1.285a4.647 4.647 0 0 0-1.393-.203c-2.551 0-4.617 2.066-4.617 4.617s2.066 4.617 4.617 4.617 4.617-2.066 4.617-4.617V6.853c1.346.713 2.88 1.097 4.464 1.097.54 0 .976-.436.976-.976s-.436-.976-.976-.976c-1.346 0-2.64-.524-3.608-1.436z"/>
  </svg>
);

interface PlatformStatsProps {
  platform: 'facebook' | 'tiktok';
  accounts: SocialAccount[];
}

const PlatformStats: React.FC<PlatformStatsProps> = ({ platform, accounts }) => {
  const platformAccounts = accounts.filter(acc => 
    platform === 'facebook' ? acc.platform === 'facebook' : 
    acc.platform === 'tiktok-business' || acc.platform === 'tiktok-shop'
  );

  const totalFollowers = platformAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const avgEngagement = platformAccounts.length > 0 
    ? platformAccounts.reduce((sum, acc) => sum + (Number(acc.engagement) || 0), 0) / platformAccounts.length
    : 0;

  const Icon = platform === 'facebook' ? Facebook : TikTokIcon;
  const color = platform === 'facebook' ? 'blue' : 'pink';

  return (
    <Card className={`border-l-4 ${platform === 'facebook' ? 'border-l-blue-500' : 'border-l-pink-500'} bg-gradient-to-br ${platform === 'facebook' ? 'from-blue-50 to-blue-100' : 'from-pink-50 to-pink-100'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {platform === 'facebook' ? 'Facebook' : 'TikTok Business'}
        </CardTitle>
        <Icon className={`h-4 w-4 ${platform === 'facebook' ? 'text-blue-600' : 'text-pink-600'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {platformAccounts.length} tài khoản
        </div>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {(totalFollowers / 1000).toFixed(1)}K người theo dõi
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {avgEngagement.toFixed(1)}% tương tác
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CrossPlatformMetricsProps {
  accounts: SocialAccount[];
}

const CrossPlatformMetrics: React.FC<CrossPlatformMetricsProps> = ({ accounts }) => {
  const facebookAccounts = accounts.filter(acc => acc.platform === 'facebook');
  const tiktokAccounts = accounts.filter(acc => acc.platform === 'tiktok-business' || acc.platform === 'tiktok-shop');

  const totalAccounts = accounts.length;
  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const avgEngagement = accounts.length > 0 
    ? accounts.reduce((sum, acc) => sum + (Number(acc.engagement) || 0), 0) / accounts.length
    : 0;
  const connectedAccounts = accounts.filter(acc => acc.connected).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng tài khoản</CardTitle>
          <BarChart3 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAccounts}</div>
          <p className="text-xs text-muted-foreground">
            {connectedAccounts} đã kết nối
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng người theo dõi</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(totalFollowers / 1000).toFixed(1)}K
          </div>
          <p className="text-xs text-muted-foreground">
            Trên tất cả platforms
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tương tác trung bình</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgEngagement.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Tỷ lệ tương tác
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-l-cyan-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trạng thái kết nối</CardTitle>
          <RefreshCw className="h-4 w-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {connectedAccounts}/{totalAccounts}
          </div>
          <div className="mt-2">
            <Progress 
              value={totalAccounts > 0 ? (connectedAccounts / totalAccounts) * 100 : 0} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface PlatformComparisonProps {
  accounts: SocialAccount[];
}

const PlatformComparison: React.FC<PlatformComparisonProps> = ({ accounts }) => {
  const facebookData = accounts.filter(acc => acc.platform === 'facebook');
  const tiktokData = accounts.filter(acc => acc.platform === 'tiktok-business' || acc.platform === 'tiktok-shop');

  const fbFollowers = facebookData.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const ttFollowers = tiktokData.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const fbEngagement = facebookData.length > 0 ? facebookData.reduce((sum, acc) => sum + (Number(acc.engagement) || 0), 0) / facebookData.length : 0;
  const ttEngagement = tiktokData.length > 0 ? tiktokData.reduce((sum, acc) => sum + (Number(acc.engagement) || 0), 0) / tiktokData.length : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          So sánh hiệu suất giữa các nền tảng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Facebook Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Facebook</h3>
              <Badge variant="secondary">{facebookData.length} tài khoản</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Người theo dõi</span>
                  <span className="font-medium">{(fbFollowers / 1000).toFixed(1)}K</span>
                </div>
                <Progress value={fbFollowers > 0 ? 75 : 0} className="h-2 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Tương tác</span>
                  <span className="font-medium">{fbEngagement.toFixed(1)}%</span>
                </div>
                <Progress value={fbEngagement} className="h-2 mt-1" />
              </div>
            </div>
          </div>

          {/* TikTok Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TikTokIcon className="h-5 w-5 text-pink-600" />
              <h3 className="font-semibold">TikTok Business</h3>
              <Badge variant="secondary">{tiktokData.length} tài khoản</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Người theo dõi</span>
                  <span className="font-medium">{(ttFollowers / 1000).toFixed(1)}K</span>
                </div>
                <Progress value={ttFollowers > 0 ? 60 : 0} className="h-2 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Tương tác</span>
                  <span className="font-medium">{ttEngagement.toFixed(1)}%</span>
                </div>
                <Progress value={ttEngagement} className="h-2 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionsProps {
  onConnectAccount: (platform: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onConnectAccount }) => {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-4 border-l-indigo-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Star className="h-5 w-5" />
          Hành động nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => onConnectAccount('facebook')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Kết nối Facebook
          </Button>
          <Button 
            onClick={() => onConnectAccount('tiktok')}
            className="bg-pink-600 hover:bg-pink-700 text-white"
            size="sm"
          >
            <TikTokIcon className="h-4 w-4 mr-2" />
            Kết nối TikTok
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Quản lý tin nhắn
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Xem báo cáo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function ProfessionalDashboard() {
  const [timeRange, setTimeRange] = useState("7d");

  // Load social accounts
  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
  });

  const handleConnectAccount = (platform: string) => {
    console.log(`Connect ${platform} triggered`);
    // TODO: Implement connection logic
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard chuyên nghiệp</h1>
            <p className="text-muted-foreground">Tổng quan quản lý mạng xã hội thống nhất</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="professional-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard chuyên nghiệp
          </h1>
          <p className="text-muted-foreground">
            Quản lý Facebook và TikTok Business trong một giao diện thống nhất
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày</SelectItem>
              <SelectItem value="30d">30 ngày</SelectItem>
              <SelectItem value="90d">90 ngày</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Cross-Platform Metrics */}
      <CrossPlatformMetrics accounts={accounts} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="platforms">So sánh nền tảng</TabsTrigger>
          <TabsTrigger value="actions">Hành động</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PlatformStats platform="facebook" accounts={accounts} />
            <PlatformStats platform="tiktok" accounts={accounts} />
            <QuickActions onConnectAccount={handleConnectAccount} />
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <PlatformComparison accounts={accounts} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <QuickActions onConnectAccount={handleConnectAccount} />
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tổng tin nhắn hôm nay</span>
                    <Badge>24</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tương tác trong tuần</span>
                    <Badge variant="secondary">1.2K</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bài viết chờ duyệt</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}