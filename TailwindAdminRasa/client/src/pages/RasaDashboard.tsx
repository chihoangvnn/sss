import React, { useState } from "react";
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
  Users,
  Search,
  Filter,
  Eye,
  UserPlus,
  Clock,
  Hash,
  Phone
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Rate Limiting API endpoints
const fetchRateLimitSettings = async () => {
  const response = await fetch('/api/rasa-management/rate-limit/settings');
  if (!response.ok) throw new Error('Failed to fetch rate limit settings');
  return response.json();
};

const updateRateLimitSettings = async (settings: any) => {
  const response = await fetch('/api/rasa-management/rate-limit/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) throw new Error('Failed to update rate limit settings');
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
          {intents.map((intent: any) => (
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
          {conversations.map((conversation: any) => (
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

// Conversation Monitoring Component
function ConversationMonitoring() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Fetch conversations with filters
  const { data: conversationsData, isLoading, refetch } = useQuery({
    queryKey: ['conversations', statusFilter, channelFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('limit', '20');
      
      const response = await fetch(`/api/rasa-management/conversations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    refetchInterval: 3000 // Live refresh every 3 seconds
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await fetch(`/api/rasa-management/conversations/${selectedConversation}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: selectedConversation ? 2000 : false // Live refresh if conversation selected
  });

  // Human takeover mutation
  const takeoverMutation = useMutation({
    mutationFn: async ({ conversationId, reason }: { conversationId: string; reason?: string }) => {
      const response = await fetch(`/api/rasa-management/conversations/${conversationId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: reason || 'Yêu cầu chuyển giao thủ công từ dashboard',
          agentId: null // Could be extended to assign specific agent
        })
      });
      if (!response.ok) throw new Error('Failed to takeover conversation');
      return response.json();
    },
    onSuccess: () => {
      // Refresh conversations to show updated status
      refetch();
      // Show success message
      console.log('✅ Conversation successfully escalated to human agent');
    },
    onError: (error) => {
      console.error('❌ Failed to takeover conversation:', error);
    }
  });

  const handleTakeover = (conversationId: string) => {
    if (confirm('Bạn có chắc chắn muốn chuyển giao cuộc trò chuyện này cho nhân viên không?')) {
      takeoverMutation.mutate({ conversationId });
    }
  };

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];

  const getChannelIcon = (channel: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷', 
      whatsapp: '💬',
      web: '🌐',
      api: '⚡'
    };
    return icons[channel as keyof typeof icons] || '💬';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge className="bg-green-100 text-green-800">🟢 Đang hoạt động</Badge>,
      completed: <Badge className="bg-blue-100 text-blue-800">✅ Hoàn thành</Badge>,
      abandoned: <Badge className="bg-gray-100 text-gray-800">⏸️ Bị bỏ</Badge>,
      escalated: <Badge className="bg-red-100 text-red-800">🚨 Chuyển giao</Badge>
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="abandoned">Bị bỏ</SelectItem>
                <SelectItem value="escalated">Chuyển giao</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kênh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kênh</SelectItem>
                <SelectItem value="web">🌐 Web</SelectItem>
                <SelectItem value="facebook">📘 Facebook</SelectItem>
                <SelectItem value="instagram">📷 Instagram</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                <SelectItem value="api">⚡ API</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              🔄 Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Danh sách Cuộc trò chuyện ({conversations.length})
            </CardTitle>
            <CardDescription>Cuộc trò chuyện được cập nhật realtime</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Không có cuộc trò chuyện nào</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {conversations.map((conversation: any) => (
                    <div 
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-lg">{getChannelIcon(conversation.channel)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono text-sm">{conversation.id.slice(0, 8)}</span>
                              {getStatusBadge(conversation.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {conversation.messageCount} tin nhắn
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(conversation.startedAt)}
                              </span>
                            </div>
                            {conversation.escalatedToHuman && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Chuyển giao con người
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!conversation.escalatedToHuman && conversation.status !== 'escalated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTakeover(conversation.id);
                              }}
                              disabled={takeoverMutation.isPending}
                            >
                              {takeoverMutation.isPending ? '⏳' : '🚨'} Chuyển giao
                            </Button>
                          )}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Chi tiết Cuộc trò chuyện
            </CardTitle>
            {selectedConversation && (
              <CardDescription>ID: {selectedConversation.slice(0, 8)}...</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedConversation ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chọn một cuộc trò chuyện để xem chi tiết</p>
              </div>
            ) : messagesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`p-3 rounded-lg ${
                      msg.isBot ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50 border-l-4 border-l-gray-500'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium">
                            {msg.isBot ? '🤖 Bot' : '👤 Người dùng'}
                          </div>
                          {msg.intent && (
                            <Badge variant="secondary" className="text-xs">
                              Intent: {msg.intent}
                            </Badge>
                          )}
                          {msg.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(msg.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.responseTime && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Thời gian phản hồi: {msg.responseTime}ms
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Human Takeover Button */}
                <div className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // TODO: Implement human takeover
                      alert('Human takeover sẽ được implement trong version tiếp theo');
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Chuyển giao cho Con người
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Rate Limiting Settings Component
function RateLimitingSettings() {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(true);
  const [maxRequests, setMaxRequests] = useState(60);
  const [windowMinutes, setWindowMinutes] = useState(1);
  const [minInterval, setMinInterval] = useState(2);

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['rate-limit-settings'],
    queryFn: fetchRateLimitSettings
  });

  // Handle settings data when loaded
  React.useEffect(() => {
    if (settings) {
      setIsEnabled(settings.enabled ?? true);
      setMaxRequests(settings.maxRequests ?? 60);
      setWindowMinutes(settings.windowMinutes ?? 1);
      setMinInterval(settings.minIntervalSeconds ?? 2);
    } else if (isError) {
      // Use defaults if API fails
      setIsEnabled(true);
      setMaxRequests(60);
      setWindowMinutes(1);
      setMinInterval(2);
    }
  }, [settings, isError]);

  const updateMutation = useMutation({
    mutationFn: updateRateLimitSettings,
    onSuccess: () => {
      toast({
        title: "Cài đặt đã được lưu",
        description: "Rate limiting settings đã được cập nhật thành công.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi cập nhật",
        description: error instanceof Error ? error.message : "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      enabled: isEnabled,
      maxRequests,
      windowMinutes,
      minIntervalSeconds: minInterval
    });
  };

  if (isLoading) {
    return <div>Đang tải cài đặt...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-medium">Bật Rate Limiting</Label>
          <p className="text-sm text-muted-foreground">
            Kích hoạt rate limiting cho RASA chat endpoint
          </p>
        </div>
        <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
      </div>

      {/* Rate Limiting Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxRequests">Số tin nhắn tối đa</Label>
          <Input
            id="maxRequests"
            type="number"
            min="1"
            max="1000"
            value={maxRequests}
            onChange={(e) => setMaxRequests(parseInt(e.target.value) || 60)}
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Số tin nhắn tối đa cho phép trong khoảng thời gian
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="windowMinutes">Thời gian (phút)</Label>
          <Input
            id="windowMinutes"
            type="number"
            min="1"
            max="60"
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(parseInt(e.target.value) || 1)}
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Khoảng thời gian tính rate limit
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minInterval">Khoảng cách tối thiểu (giây)</Label>
          <Input
            id="minInterval"
            type="number"
            min="0"
            max="60"
            value={minInterval}
            onChange={(e) => setMinInterval(parseInt(e.target.value) || 2)}
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Khoảng cách tối thiểu giữa các tin nhắn
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="p-4 rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2">Cài đặt hiện tại</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Status: {isEnabled ? "Bật" : "Tắt"}</p>
          <p>• Giới hạn: {maxRequests} tin nhắn/{windowMinutes} phút</p>
          <p>• Khoảng cách: {minInterval} giây giữa các tin nhắn</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
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
        <Button onClick={() => setActiveTab("settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Cài đặt
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-[500px] grid-cols-4">
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
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cài đặt
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

        {/* Conversations Tab - Full Featured */}
        <TabsContent value="conversations" className="mt-6">
          <ConversationMonitoring />
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

        {/* Settings Tab - Rate Limiting Configuration */}
        <TabsContent value="settings" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting Settings</CardTitle>
                <CardDescription>
                  Quản lý cài đặt rate limiting cho RASA chat endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RateLimitingSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}