import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Bot, 
  BarChart3, 
  Settings, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Users
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// API endpoints
const fetchServerStatus = async () => {
  const response = await fetch('/api/rasa-management/server/status');
  if (!response.ok) throw new Error('Failed to fetch server status');
  return response.json();
};

const fetchAnalyticsOverview = async () => {
  const response = await fetch('/api/rasa-management/analytics/overview');
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

const fetchIntentAnalytics = async () => {
  const response = await fetch('/api/rasa-management/analytics/intents');
  if (!response.ok) throw new Error('Failed to fetch intents');
  return response.json();
};

const fetchRecentConversations = async () => {
  const response = await fetch('/api/rasa-management/conversations?limit=4');
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
};

const controlServer = async (action: string) => {
  const response = await fetch('/api/rasa-management/server', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!response.ok) throw new Error(`Failed to ${action} server`);
  return response.json();
};

// Server Status Component
function ServerStatusCard() {
  const { toast } = useToast();
  const { data: serverStatus, isLoading, refetch } = useQuery({
    queryKey: ['server-status'],
    queryFn: fetchServerStatus,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  const serverMutation = useMutation({
    mutationFn: controlServer,
    onSuccess: (data, action) => {
      refetch();
      toast({
        title: "Thành công",
        description: `Server đã được ${action === 'start' ? 'khởi động' : action === 'stop' ? 'dừng' : 'khởi động lại'} thành công`,
      });
    },
    onError: (error, action) => {
      toast({
        title: "Lỗi",
        description: `Không thể ${action === 'start' ? 'khởi động' : action === 'stop' ? 'dừng' : 'khởi động lại'} server: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">RASA Server</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  const { isRunning, uptime, version, health } = serverStatus || {};
  
  const formatUptime = (seconds?: number) => {
    if (!seconds || typeof seconds !== 'number') return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (health: string) => {
    switch(health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">RASA Server</CardTitle>
        <Bot className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(health)}`} />
          <span className="text-2xl font-bold">{isRunning ? 'Online' : 'Offline'}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <div>Phiên bản: {version ?? "—"}</div>
          <div>Uptime: {formatUptime(uptime)}</div>
        </div>
        <div className="mt-3 flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7"
            onClick={() => serverMutation.mutate('start')}
            disabled={serverMutation.isPending}
          >
            <Play className="h-3 w-3 mr-1" />
            {serverMutation.isPending ? 'Đang xử lý...' : 'Khởi động'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7"
            onClick={() => serverMutation.mutate('stop')}
            disabled={serverMutation.isPending}
          >
            <Pause className="h-3 w-3 mr-1" />
            {serverMutation.isPending ? 'Đang xử lý...' : 'Dừng'}  
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7"
            onClick={() => serverMutation.mutate('restart')}
            disabled={serverMutation.isPending}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {serverMutation.isPending ? 'Đang xử lý...' : 'Khởi động lại'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Stats Component
function QuickStatsCards() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: fetchAnalyticsOverview,
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }
  
  const { totalConversations, averageSatisfaction, resolutionRate, activeConversations } = analytics || {};
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng Hội thoại</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(totalConversations ?? 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Tất cả thời gian</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang Hoạt động</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeConversations ?? 0}</div>
          <p className="text-xs text-muted-foreground">Cuộc trò chuyện trực tuyến</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tỷ lệ Giải quyết</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{resolutionRate || 0}%</div>
          <p className="text-xs text-muted-foreground">Thành công xử lý</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đánh giá Trung bình</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageSatisfaction ? averageSatisfaction.toFixed(1) : '0.0'}/5.0</div>
          <p className="text-xs text-muted-foreground">Điểm hài lòng</p>
        </CardContent>
      </Card>
    </>
  );
}

// Intent Analytics Component
function IntentAnalyticsCard() {
  const { data: intentsData, isLoading } = useQuery({
    queryKey: ['intent-analytics'],
    queryFn: fetchIntentAnalytics,
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân tích Intent</CardTitle>
          <CardDescription>Đang tải...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading intents...</div>
        </CardContent>
      </Card>
    );
  }
  
  const intents = intentsData?.intents || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân tích Intent</CardTitle>
        <CardDescription>Hiệu suất các ý định được nhận dạng</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {intents.map((intent) => (
            <div key={intent.name} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{intent.displayName}</span>
                  <Badge variant={intent.successRate >= 90 ? "default" : intent.successRate >= 80 ? "secondary" : "destructive"}>
                    {intent.successRate}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {intent.totalCount} lần kích hoạt
                </div>
              </div>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${intent.successRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Conversations Component  
function RecentConversationsCard() {
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['recent-conversations'],
    queryFn: fetchRecentConversations,
    refetchInterval: 5000 // Live refresh every 5 seconds
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuộc trò chuyện Gần đây</CardTitle>
          <CardDescription>Đang tải...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }
  
  const conversations = conversationsData?.conversations || [];
  const getChannelIcon = (channel: string) => {
    switch(channel) {
      case 'facebook': return '📘';
      case 'whatsapp': return '💬'; 
      case 'web': return '🌐';
      default: return '💬';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Đang hoạt động</Badge>;
      case 'completed': return <Badge variant="secondary">Hoàn thành</Badge>;
      case 'escalated': return <Badge variant="destructive">Chuyển giao</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuộc trò chuyện Gần đây</CardTitle>
        <CardDescription>Hoạt động trò chuyện mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center space-x-3">
                <div className="text-lg">{getChannelIcon(conversation.channel)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">#{conversation.id}</span>
                    {getStatusBadge(conversation.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {conversation.messageCount} tin nhắn • {new Date(conversation.startedAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">Xem</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RasaDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 p-6" data-testid="page-rasa-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bảng điều khiển RASA</h1>
          <p className="text-muted-foreground">
            Quản lý và giám sát chatbot AI của bạn
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Cài đặt
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-96 grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Hội thoại
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Phân tích
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Server Status & Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ServerStatusCard />
            <QuickStatsCards />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <IntentAnalyticsCard />
            <RecentConversationsCard />
          </div>
        </TabsContent>

        {/* Conversations Tab - Placeholder */}
        <TabsContent value="conversations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Hội thoại</CardTitle>
              <CardDescription>Tính năng sẽ được phát triển trong Task 4</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tính năng quản lý hội thoại đang được phát triển...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - Placeholder */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Phân tích</CardTitle>
              <CardDescription>Tính năng sẽ được phát triển trong Task 5</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Dashboard phân tích chi tiết đang được phát triển...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}