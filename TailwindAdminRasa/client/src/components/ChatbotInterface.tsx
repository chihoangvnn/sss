import { useState } from "react";
import { Bot, Send, Settings, MessageSquare, Users, Zap, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

export interface ChatbotStats {
  totalConversations: number;
  activeUsers: number;
  responseTime: number;
  satisfactionRate: number;
}

interface ChatbotInterfaceProps {
  isOnline?: boolean;
  stats?: ChatbotStats;
  messages?: ChatMessage[];
  onToggleChatbot?: (enabled: boolean) => void;
  onSendMessage?: (message: string) => void;
}

// TODO: remove mock data
const mockStats: ChatbotStats = {
  totalConversations: 1247,
  activeUsers: 23,
  responseTime: 1.2,
  satisfactionRate: 94,
};

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    type: "user",
    content: "Tôi muốn tìm hiểu về sản phẩm iPhone 15",
    timestamp: "14:30",
  },
  {
    id: "2",
    type: "bot", 
    content: "Xin chào! Tôi có thể giúp bạn tìm hiểu về iPhone 15. Hiện tại chúng tôi có iPhone 15 Pro Max với giá 29.999.000 VNĐ. Bạn có muốn xem thông tin chi tiết không?",
    timestamp: "14:31",
  },
  {
    id: "3",
    type: "user",
    content: "Có những màu gì?",
    timestamp: "14:32",
  },
  {
    id: "4",
    type: "bot",
    content: "iPhone 15 Pro Max có 4 màu: Natural Titanium, Blue Titanium, White Titanium và Black Titanium. Bạn thích màu nào nhất?",
    timestamp: "14:32",
  },
];

export function ChatbotInterface({ 
  isOnline = true, 
  stats = mockStats, 
  messages = mockMessages,
  onToggleChatbot,
  onSendMessage 
}: ChatbotInterfaceProps) {
  const [message, setMessage] = useState("");
  const [testMessages, setTestMessages] = useState(messages);
  const [tab, setTab] = useState("chat");

  const handleToggleChatbot = () => {
    const newStatus = !isOnline;
    console.log(`Chatbot ${newStatus ? 'enabled' : 'disabled'}`);
    onToggleChatbot?.(newStatus);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setTestMessages(prev => [...prev, newMessage]);
    console.log('Message sent:', message);
    onSendMessage?.(message);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Cảm ơn bạn đã liên hệ! Tôi đang xử lý yêu cầu của bạn...",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setTestMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6" data-testid="chatbot-interface">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Chatbot RASA
          </h2>
          <p className="text-muted-foreground">Quản lý trợ lý ảo thông minh</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isOnline ? "default" : "secondary"} className="px-3 py-1">
            {isOnline ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                Đang hoạt động
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-2" />
                Tạm dừng
              </>
            )}
          </Badge>
          <Button
            variant={isOnline ? "outline" : "default"}
            onClick={handleToggleChatbot}
            data-testid="button-toggle-chatbot"
          >
            {isOnline ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Tạm dừng
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Khởi động
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
          <TabsTrigger value="chat">Trò chuyện</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cuộc trò chuyện</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-conversations">
                  {stats.totalConversations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% từ tháng trước
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Người dùng đang hoạt động</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-users">
                  {stats.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Đang trực tuyến
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thời gian phản hồi</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-response-time">
                  {stats.responseTime}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Trung bình
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ hài lòng</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-satisfaction">
                  {stats.satisfactionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Đánh giá tích cực
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Khách hàng hỏi về sản phẩm iPhone 15</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 phút trước</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <span className="text-sm">Đã cập nhật kho dữ liệu sản phẩm</span>
                  <span className="text-xs text-muted-foreground ml-auto">15 phút trước</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Huấn luyện mô hình với 50 câu hỏi mới</span>
                  <span className="text-xs text-muted-foreground ml-auto">1 giờ trước</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6" forceMount>
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Thử nghiệm Chatbot</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {testMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn để thử nghiệm..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                  onKeyUpCapture={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  data-testid="input-test-message"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Chatbot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Cài đặt chi tiết sẽ được phát triển trong phiên bản tiếp theo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}