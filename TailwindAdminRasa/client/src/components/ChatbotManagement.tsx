import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Activity,
  Search,
  Filter,
  Send,
  Settings,
  Power,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag as TagIcon,
  Plus,
  Paperclip
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Types
interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  successRate: number;
  messagesFromFacebook: number;
  messagesFromComments: number;
  ordersFromBot: number;
  revenueFromBot: number;
  conversionRate: number;
  rasaStatus: 'online' | 'offline' | 'error';
  webhookStatus: 'online' | 'offline' | 'error';
  lastSync: string;
}

interface FacebookConversation {
  id: string;
  pageId: string;
  pageName: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  status: string;
  priority: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  isRead: boolean;
  tagIds: string[];
}

interface FacebookMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'page';
  content?: string;
  messageType: string;
  attachments: any[];
  timestamp: string;
  isEcho: boolean;
  isRead: boolean;
}

interface BotSettings {
  isEnabled: boolean;
  autoReply: boolean;
  rasaUrl: string;
  webhookUrl: string;
}

export function ChatbotManagement() {
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [conversations, setConversations] = useState<FacebookConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<FacebookConversation | null>(null);
  const [messages, setMessages] = useState<FacebookMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    isEnabled: true,
    autoReply: true,
    rasaUrl: "",
    webhookUrl: ""
  });
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState<BotSettings>({
    isEnabled: true,
    autoReply: false,
    rasaUrl: "http://localhost:5005",
    webhookUrl: ""
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; status: string; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/chatbot/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching chatbot stats:', error);
      // Mock data for development
      setStats({
        totalConversations: 156,
        activeConversations: 23,
        avgResponseTime: 1.2,
        successRate: 94,
        messagesFromFacebook: 342,
        messagesFromComments: 89,
        ordersFromBot: 12,
        revenueFromBot: 24500000,
        conversionRate: 7.8,
        rasaStatus: 'online',
        webhookStatus: 'online',
        lastSync: new Date().toISOString()
      });
    }
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/facebook/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/facebook/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    try {
      const response = await fetch(`/api/facebook/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      });

      if (response.ok) {
        setReplyMessage("");
        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  // Fetch bot settings from API
  const fetchBotSettings = async () => {
    try {
      const response = await fetch('/api/chatbot/settings');
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data);
      }
    } catch (error) {
      console.error('Error fetching bot settings:', error);
    }
  };

  // Save bot settings to API
  const saveBotSettings = async (settings: BotSettings) => {
    try {
      const response = await fetch('/api/chatbot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data);
        return { success: true };
      }
      return { success: false, error: 'Failed to save settings' };
    } catch (error) {
      console.error('Error saving bot settings:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Test RASA connection
  const testRasaConnection = async (rasaUrl: string) => {
    try {
      const response = await fetch('/api/chatbot/test-rasa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rasaUrl, timeout: 5000 })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { success: false, error: 'Failed to test connection' };
    } catch (error) {
      console.error('Error testing RASA connection:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Handle configuration form
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTest(null);
    
    const result = await testRasaConnection(configForm.rasaUrl);
    setConnectionTest(result);
    setTestingConnection(false);
  };

  const handleSaveConfig = async () => {
    const result = await saveBotSettings(configForm);
    if (result.success) {
      setBotSettings(configForm);
      setShowConfig(false);
    }
  };

  const openConfig = () => {
    setConfigForm(botSettings);
    setConnectionTest(null);
    setShowConfig(true);
  };

  useEffect(() => {
    fetchStats();
    fetchConversations();
    fetchBotSettings();
    setIsLoading(false);

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchConversations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getStatusColor = (status: 'online' | 'offline' | 'error') => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: 'online' | 'offline' | 'error') => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải dữ liệu chatbot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Stats Row */}
      <div className="p-6 bg-white border-b">
        <div className="grid grid-cols-4 gap-6">
          {/* Bot Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Performance</CardTitle>
              <Bot className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeConversations || 0} đang hoạt động
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats?.avgResponseTime || 0}s phản hồi
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats?.successRate || 0}% thành công
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Message Sources */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nguồn Tin Nhắn</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.messagesFromFacebook || 0) + (stats?.messagesFromComments || 0)}</div>
              <p className="text-xs text-muted-foreground">tin nhắn hôm nay</p>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span>Messenger:</span>
                  <span className="font-medium">{stats?.messagesFromFacebook || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Comments:</span>
                  <span className="font-medium">{stats?.messagesFromComments || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đơn Hàng Bot</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordersFromBot || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.revenueFromBot || 0)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats?.conversionRate || 0}% conversion
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Bot Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Health</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">RASA:</span>
                  <div className={`flex items-center gap-1 ${getStatusColor(stats?.rasaStatus || 'offline')}`}>
                    {getStatusIcon(stats?.rasaStatus || 'offline')}
                    <span className="text-xs capitalize">{stats?.rasaStatus || 'offline'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Webhook:</span>
                  <div className={`flex items-center gap-1 ${getStatusColor(stats?.webhookStatus || 'offline')}`}>
                    {getStatusIcon(stats?.webhookStatus || 'offline')}
                    <span className="text-xs capitalize">{stats?.webhookStatus || 'offline'}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sync: {stats?.lastSync ? formatTime(stats.lastSync) : 'Chưa có'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Hoạt động
              </Button>
              <Button
                variant={filterStatus === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("resolved")}
              >
                Đã xử lý
              </Button>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participantAvatar} />
                      <AvatarFallback>
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.participantName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {conversation.lastMessagePreview}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {conversation.pageName}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {conversation.messageCount} tin nhắn
                          </span>
                        </div>
                        {!conversation.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participantAvatar} />
                      <AvatarFallback>
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                      <p className="text-sm text-gray-500">
                        Facebook Messenger • {selectedConversation.pageName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <TagIcon className="h-4 w-4" />
                      Tags
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'page' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[70%] ${message.senderType === 'page' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {message.senderType === 'page' ? (
                            <div className="w-full h-full bg-blue-500 flex items-center justify-center rounded-full">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <AvatarImage src={selectedConversation.participantAvatar} />
                          )}
                          <AvatarFallback>
                            {message.senderType === 'page' ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.senderType === 'page'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.content && (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="text-xs opacity-75">
                                  📎 {attachment.type} attachment
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs mt-2 opacity-70">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-4 bg-white border-t">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Nhập tin nhắn trả lời..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button onClick={sendReply} disabled={!replyMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Thêm tag
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bot className="h-4 w-4 mr-1" />
                      Gợi ý AI
                    </Button>
                    <div className="flex-1"></div>
                    <Badge variant="outline" className="text-xs">
                      Auto Reply: {botSettings.autoReply ? 'Bật' : 'Tắt'}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chọn cuộc trò chuyện
                </h3>
                <p className="text-gray-500">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để xem tin nhắn và trả lời
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Settings Panel */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Bot Status */}
            <div className="flex items-center gap-2">
              <Power className={`h-5 w-5 ${botSettings.isEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">Bot</span>
              <Badge variant={botSettings.isEnabled ? "default" : "secondary"}>
                {botSettings.isEnabled ? 'Online' : 'Offline'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBotSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
              >
                {botSettings.isEnabled ? 'Tắt' : 'Bật'}
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Auto Reply */}
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${botSettings.autoReply ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">Auto Reply</span>
              <Badge variant={botSettings.autoReply ? "default" : "secondary"}>
                {botSettings.autoReply ? 'Bật' : 'Tắt'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBotSettings(prev => ({ ...prev, autoReply: !prev.autoReply }))}
              >
                {botSettings.autoReply ? 'Tắt' : 'Bật'}
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* RASA Status */}
            <div className="flex items-center gap-2">
              <Bot className={`h-5 w-5 ${getStatusColor(stats?.rasaStatus || 'offline')}`} />
              <span className="text-sm font-medium">RASA</span>
              <Badge variant={stats?.rasaStatus === 'online' ? "default" : "secondary"}>
                {stats?.rasaStatus || 'Offline'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={openConfig}>
                Config
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Webhook Status */}
            <div className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${getStatusColor(stats?.webhookStatus || 'offline')}`} />
              <span className="text-sm font-medium">Webhook</span>
              <Badge variant={stats?.webhookStatus === 'online' ? "default" : "secondary"}>
                {stats?.webhookStatus || 'Offline'}
              </Badge>
              <Button variant="ghost" size="sm">
                Config
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { fetchStats(); fetchConversations(); }}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cấu hình Bot RASA</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Bot Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bot-enabled" className="text-sm font-medium">
                  Kích hoạt Bot
                </Label>
                <Switch
                  id="bot-enabled"
                  checked={configForm.isEnabled}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ ...prev, isEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-reply" className="text-sm font-medium">
                  Tự động trả lời
                </Label>
                <Switch
                  id="auto-reply"
                  checked={configForm.autoReply}
                  onCheckedChange={(checked) => 
                    setConfigForm(prev => ({ ...prev, autoReply: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* RASA URL Configuration */}
            <div className="space-y-2">
              <Label htmlFor="rasa-url" className="text-sm font-medium">
                RASA Server URL
              </Label>
              <Input
                id="rasa-url"
                placeholder="http://localhost:5005"
                value={configForm.rasaUrl}
                onChange={(e) => 
                  setConfigForm(prev => ({ ...prev, rasaUrl: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500">
                URL của RASA server đang chạy trên máy local
              </p>
            </div>

            {/* Test Connection */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection || !configForm.rasaUrl}
                className="w-full"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Test kết nối RASA
                  </>
                )}
              </Button>
              
              {connectionTest && (
                <div className={`p-3 rounded-lg text-sm ${
                  connectionTest.success 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {connectionTest.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {connectionTest.success ? 'Kết nối thành công!' : 'Kết nối thất bại'}
                    </span>
                  </div>
                  <p className="mt-1">{connectionTest.message}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-sm font-medium">
                Webhook URL (Tùy chọn)
              </Label>
              <Input
                id="webhook-url"
                placeholder="https://your-app.com/webhook"
                value={configForm.webhookUrl}
                onChange={(e) => 
                  setConfigForm(prev => ({ ...prev, webhookUrl: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500">
                URL để nhận thông báo từ RASA server
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveConfig}>
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}