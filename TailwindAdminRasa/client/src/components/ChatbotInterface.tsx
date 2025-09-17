import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Settings as SettingsIcon, 
  MessageSquare, 
  Users, 
  Zap, 
  Play, 
  Pause,
  Moon,
  Sun,
  Sparkles,
  MoreVertical,
  Plus,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

// Mock data (to be replaced with real data)
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
  }
];

export function ChatbotInterface({ 
  isOnline = true, 
  stats = mockStats, 
  messages = mockMessages,
  onToggleChatbot,
  onSendMessage 
}: ChatbotInterfaceProps) {
  const [message, setMessage] = useState("");

  // Clear any restored/cached input values on mount
  useEffect(() => {
    const input = document.getElementById('admin-chat-input') as HTMLInputElement;
    if (input) {
      input.value = "";
      setMessage("");
    }
  }, []);
  const [testMessages, setTestMessages] = useState(messages);
  const [currentView, setCurrentView] = useState<"chat" | "dashboard" | "settings">("chat");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [conversationId] = useState(() => `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom (ONLY if not actively typing)
  const scrollToBottom = () => {
    // Only scroll if input is not focused (not typing)
    if (document.activeElement?.id !== "admin-chat-input") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll with debounce to prevent focus interference
  useEffect(() => {
    // Only scroll if not actively typing and significant delay after message change
    const scrollTimer = setTimeout(() => {
      // Double-check input is not focused before scrolling
      if (document.activeElement?.id !== "admin-chat-input") {
        scrollToBottom();
      }
    }, 300); // Longer delay to avoid race conditions
    
    return () => clearTimeout(scrollTimer);
  }, [testMessages.length]); // Use .length instead of full array to reduce triggers

  const handleToggleChatbot = () => {
    const newStatus = !isOnline;
    console.log(`Chatbot ${newStatus ? 'enabled' : 'disabled'}`);
    onToggleChatbot?.(newStatus);
  };

  const handleSendMessage = async () => {
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
    const userMessage = message;
    // CLEAR input immediately after capturing message
    setMessage("");

    try {
      // Call real RASA API
      const response = await fetch('/api/rasa/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.trim(),
          sender: conversationId,
          context: {
            page_type: 'admin_dashboard',
            admin_test: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`RASA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('RASA response:', data);
      
      // Process RASA responses
      if (data.responses && data.responses.length > 0) {
        for (const rasaResponse of data.responses) {
          const botResponse: ChatMessage = {
            id: (Date.now() + Math.random()).toString(),
            type: "bot",
            content: rasaResponse.text || "Xin lỗi, tôi không hiểu rõ. Bạn có thể hỏi lại không?",
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          };
          setTestMessages(prev => [...prev, botResponse]);
        }
      } else {
        // Fallback response
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setTestMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Error calling RASA API:', error);
      // Error fallback response
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Xin lỗi, không thể kết nối đến chatbot. Vui lòng kiểm tra kết nối mạng và thử lại.",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setTestMessages(prev => [...prev, errorResponse]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // LobeChat-style Sidebar
  const Sidebar = () => (
    <div className={`w-80 h-full border-r flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              RASA Assistant
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              AI Chatbot Admin
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Status */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isOnline ? 'Đang hoạt động' : 'Tạm dừng'}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleToggleChatbot}
            className={`ml-auto p-1 h-6 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            {isOnline ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* Navigation */}
      <div className="p-4 flex-1">
        <nav className="space-y-2">
          <Button 
            variant={currentView === "chat" ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            onClick={() => setCurrentView("chat")}
          >
            <MessageSquare className="h-4 w-4" />
            Trò chuyện
          </Button>
          <Button 
            variant={currentView === "dashboard" ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <Users className="h-4 w-4" />
            Thống kê
          </Button>
          <Button 
            variant={currentView === "settings" ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            onClick={() => setCurrentView("settings")}
          >
            <SettingsIcon className="h-4 w-4" />
            Cài đặt
          </Button>
        </nav>
      </div>

      {/* Stats Preview */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Hoạt động hôm nay
            </span>
            <Sparkles className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {stats.activeUsers}
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            người dùng đang trực tuyến
          </p>
        </div>
      </div>
    </div>
  );

  // Chat Interface
  const ChatInterface = () => (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Test Conversation
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Thử nghiệm chatbot với RASA API
            </p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {testMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${msg.id}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.type === 'user' 
                    ? isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  {msg.type === 'user' ? (
                    <Users className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-white'}`} />
                  ) : (
                    <Bot className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDarkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-2 opacity-70`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              id="admin-chat-input"
              name="admin-chat-input"
              placeholder="Nhập tin nhắn để test chatbot..."
              value={message}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyDownCapture={(e) => e.stopPropagation()}
              onKeyUpCapture={(e) => e.stopPropagation()}
              className={`flex-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-300'}`}
              data-testid="input-test-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Dashboard View
  const Dashboard = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Thống kê Chatbot
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Theo dõi hiệu suất và hoạt động của chatbot
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Cuộc trò chuyện
              </CardTitle>
              <MessageSquare className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="stat-conversations">
                {stats.totalConversations.toLocaleString()}
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +12% từ tháng trước
              </p>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Người dùng hoạt động
              </CardTitle>
              <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="stat-active-users">
                {stats.activeUsers}
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Đang trực tuyến
              </p>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Thời gian phản hồi
              </CardTitle>
              <Zap className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="stat-response-time">
                {stats.responseTime}s
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Trung bình
              </p>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Tỷ lệ hài lòng
              </CardTitle>
              <Bot className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold text-green-600`} data-testid="stat-satisfaction">
                {stats.satisfactionRate}%
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Đánh giá tích cực
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Settings View
  const Settings = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <SettingsIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Cài đặt Chatbot
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Các tùy chọn cài đặt sẽ được phát triển trong phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} data-testid="chatbot-interface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {currentView === "chat" && <ChatInterface />}
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "settings" && <Settings />}
      </div>
    </div>
  );
}