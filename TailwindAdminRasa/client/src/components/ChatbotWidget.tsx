import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  ShoppingCart,
  Package,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
  productData?: {
    id: string;
    name: string;
    price: string;
    image: string;
    stock?: number;
  };
  orderData?: {
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

interface ChatbotWidgetProps {
  pageType: "storefront" | "landing_page";
  pageContext?: {
    storefrontName?: string;
    products?: Array<{
      id: string;
      name: string;
      price: string;
      category: string;
    }>;
    featuredProduct?: {
      id: string;
      name: string;
      price: string;
      description: string;
    };
    cartItems?: Array<{
      productId: string;
      name: string;
      quantity: number;
    }>;
  };
  onAddToCart?: (productId: string, quantity: number) => void;
  onCreateOrder?: (orderData: any) => void;
}

export default function ChatbotWidget({
  pageType,
  pageContext,
  onAddToCart,
  onCreateOrder
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message based on page type
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        text: pageType === "storefront" 
          ? `Chào bạn! Tôi là trợ lý mua sắm. Tôi có thể giúp bạn tìm sản phẩm, kiểm tra tồn kho, và hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?`
          : `Chào bạn! Tôi có thể giúp bạn tìm hiểu chi tiết về sản phẩm này và hỗ trợ đặt hàng. Bạn có câu hỏi gì không?`,
        isBot: true,
        timestamp: new Date(),
        suggestions: pageType === "storefront" 
          ? ["Tìm sản phẩm", "Kiểm tra tồn kho", "Tư vấn sản phẩm", "Hỗ trợ đặt hàng"]
          : ["Chi tiết sản phẩm", "So sánh giá", "Cách đặt hàng", "Chính sách đổi trả"]
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, pageType, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send to RASA API with context
      const response = await fetch('/api/rasa/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          sender: conversationId,
          context: {
            page_type: pageType,
            ...pageContext
          }
        })
      });

      const data = await response.json();
      
      // Process RASA response
      if (data.responses && data.responses.length > 0) {
        for (const rasaResponse of data.responses) {
          const botMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: rasaResponse.text || "Xin lỗi, tôi không hiểu. Bạn có thể hỏi lại không?",
            isBot: true,
            timestamp: new Date(),
            suggestions: rasaResponse.buttons?.map((btn: any) => btn.title),
            productData: rasaResponse.custom?.product,
            orderData: rasaResponse.custom?.order
          };
          
          setMessages(prev => [...prev, botMessage]);
          
          // Small delay between multiple responses
          if (data.responses.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      } else {
        // Fallback response
        const fallbackMessage: Message = {
          id: `msg_${Date.now()}`,
          text: "Xin lỗi, tôi đang gặp sự cố. Bạn có thể thử lại không?",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        text: "Có lỗi xảy ra. Vui lòng thử lại sau.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleProductAction = (action: string, productData: any) => {
    if (action === "add_to_cart" && onAddToCart) {
      onAddToCart(productData.id, 1);
      const confirmMessage: Message = {
        id: `msg_${Date.now()}`,
        text: `Đã thêm ${productData.name} vào giỏ hàng!`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`flex ${message.isBot ? "justify-start" : "justify-end"} mb-4`}
    >
      <div className={`flex items-start space-x-2 max-w-[85%] ${message.isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.isBot ? "bg-green-500" : "bg-blue-500"
        }`}>
          {message.isBot ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`rounded-lg px-3 py-2 ${
          message.isBot 
            ? "bg-gray-100 text-gray-800" 
            : "bg-blue-500 text-white"
        }`}>
          <p className="text-sm">{message.text}</p>
          
          {/* Product Card */}
          {message.productData && (
            <div className="mt-2 p-3 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                {message.productData.image && (
                  <img 
                    src={message.productData.image} 
                    alt={message.productData.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{message.productData.name}</h4>
                  <p className="text-green-600 font-bold">{parseInt(message.productData.price).toLocaleString('vi-VN')}đ</p>
                  {message.productData.stock !== undefined && (
                    <p className="text-sm text-gray-500">Còn {message.productData.stock} sản phẩm</p>
                  )}
                </div>
              </div>
              {onAddToCart && (
                <Button
                  size="sm"
                  className="w-full mt-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleProductAction("add_to_cart", message.productData)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
              )}
            </div>
          )}

          {/* Order Summary */}
          {message.orderData && (
            <div className="mt-2 p-3 bg-white border rounded-lg shadow-sm">
              <h4 className="font-medium text-gray-800 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Tóm tắt đơn hàng
              </h4>
              {message.orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{item.price.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-gray-800">
                <span>Tổng cộng:</span>
                <span>{message.orderData.total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="text-xs bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs opacity-70 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );

  // Mobile full-screen overlay
  const MobileChat = () => (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-500 text-white">
        <h3 className="font-semibold">Trợ lý mua sắm</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-green-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <Bot className="w-6 h-6" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage(inputValue)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
          />
          <Button 
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Desktop popup
  const DesktopChat = () => (
    <Card className="fixed bottom-20 right-4 w-96 h-96 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <CardHeader className="pb-2 bg-green-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Trợ lý mua sắm</CardTitle>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-green-600 p-1 h-6 w-6"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-green-600 p-1 h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Messages */}
          <CardContent className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full">
              {messages.map(renderMessage)}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500 mb-4">
                  <Bot className="w-6 h-6" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage(inputValue)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm"
              />
              <Button 
                size="sm"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 z-40"
          size="lg"
        >
          <MessageCircle className="w-6 h-6" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 text-xs">
            {messages.filter(m => m.isBot && !m.text.includes("Chào bạn")).length}
          </Badge>
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <>
          {/* Mobile: Full screen overlay */}
          <div className="md:hidden">
            <MobileChat />
          </div>
          
          {/* Desktop: Popup window */}
          <div className="hidden md:block">
            <DesktopChat />
          </div>
        </>
      )}
    </>
  );
}