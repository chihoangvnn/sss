import { useState, useEffect, useRef, useCallback } from "react";
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
  Clock,
  CheckCircle,
  AlertCircle
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [lastSeenMessageId, setLastSeenMessageId] = useState<string | null>(null);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUserMessageRef = useRef<Date>(new Date());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart positioning calculations
  const getSmartPositioning = useCallback(() => {
    const isLandingPage = pageType === "landing_page";
    const isMobile = window.innerWidth < 768;
    
    // Landing pages have sticky bottom CTAs that need 80px clearance on mobile
    const mobileBottomOffset = isLandingPage && isMobile ? "6rem" : "1rem"; // 96px vs 16px
    const desktopBottomOffset = "5rem"; // 80px for desktop popup
    
    // Ensure chatbot is above landing page sticky bars (z-50 + 1)
    const zIndexValue = 9999;
    
    return {
      mobileBottomOffset,
      desktopBottomOffset,
      zIndexValue
    };
  }, [pageType]);

  const positioning = getSmartPositioning();

  // Enhanced visibility entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced welcome message with comprehensive context awareness
  const getWelcomeMessage = useCallback((): Message => {
    const featuredProduct = pageContext?.featuredProduct;
    const storefrontName = pageContext?.storefrontName;
    const cartItemCount = pageContext?.cartItems?.length || 0;
    const hasProducts = pageContext?.products && pageContext.products.length > 0;
    
    let text: string;
    let suggestions: string[];
    
    if (pageType === "storefront") {
      if (cartItemCount > 0) {
        text = `Chào mừng bạn trở lại! 🛒 Bạn có ${cartItemCount} sản phẩm trong giỏ hàng. Tôi có thể giúp gì thêm cho bạn?`;
        suggestions = ["Xem giỏ hàng", "Thanh toán luôn", "Thêm sản phẩm", "Tư vấn ưu đãi"];
      } else {
        text = storefrontName 
          ? `Chào bạn! 👋 Tôi là trợ lý AI của ${storefrontName}. Sẵn sàng giúp bạn tìm kiếm và mua sắm dễ dàng!`
          : `Chào bạn! 👋 Tôi là trợ lý mua sắm AI. Hãy để tôi giúp bạn tìm được sản phẩm ưng ý!`;
        suggestions = hasProducts 
          ? ["Sản phẩm hot", "Tìm theo giá", "Danh mục", "Ưu đãi hiện tại"]
          : ["Tìm sản phẩm", "Kiểm tra tồn kho", "Tư vấn mua hàng", "Liên hệ hỗ trợ"];
      }
    } else {
      // Landing page context
      if (featuredProduct) {
        const productName = featuredProduct.name;
        const hasPrice = featuredProduct.price && featuredProduct.price !== '0';
        
        text = `Chào bạn! 🌟 Tôi thấy bạn quan tâm đến ${productName}. ${hasPrice ? `Giá chỉ ${parseInt(featuredProduct.price).toLocaleString('vi-VN')}đ.` : ''} Bạn muốn tìm hiểu điều gì?`;
        
        suggestions = [
          `Ưu điểm ${productName}`,
          "Cách sử dụng", 
          "Đặt hàng ngay",
          "So sánh sản phẩm"
        ];
      } else {
        text = `Chào bạn! 🎯 Tôi có thể giúp bạn tìm hiểu chi tiết về sản phẩm này và hỗ trợ đặt hàng. Bạn quan tâm điều gì nhất?`;
        suggestions = ["Thông số sản phẩm", "Giá cả ưu đãi", "Cách đặt hàng", "Chính sách bảo hành"];
      }
    }
    
    return {
      id: `msg_${Date.now()}`,
      text,
      isBot: true,
      timestamp: new Date(),
      suggestions
    };
  }, [pageType, pageContext]);

  // Welcome message initialization
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, getWelcomeMessage]);

  // Enhanced unread message tracking with better counting
  useEffect(() => {
    if (!isOpen) {
      // Count unread messages since last seen
      const unreadMessages = lastSeenMessageId 
        ? messages.filter(m => {
            const messageIndex = messages.findIndex(msg => msg.id === lastSeenMessageId);
            const currentIndex = messages.findIndex(msg => msg.id === m.id);
            return m.isBot && currentIndex > messageIndex && !m.text.includes("Chào bạn");
          })
        : messages.filter(m => m.isBot && !m.text.includes("Chào bạn"));
      
      setUnreadCount(unreadMessages.length);
    } else {
      // Mark all messages as seen when chat is opened
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        setLastSeenMessageId(lastMessage.id);
      }
      setUnreadCount(0);
      setNewMessageIds(new Set());
    }
  }, [isOpen, messages, lastSeenMessageId]);

  // Enhanced typing indicator with realistic timing
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    if (isTyping) {
      // Simulate more realistic typing duration based on message length
      const estimatedTypingTime = Math.min(Math.max(1000, inputValue.length * 50), 3000);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, estimatedTypingTime);
    }
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [isTyping, inputValue.length]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  // Enhanced auto-focus with better timing and accessibility
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Improved auto-focus timing for better UX
      const focusTimer = setTimeout(() => {
        // Only focus if not on mobile to avoid virtual keyboard issues
        const isMobile = window.innerWidth < 768;
        if (!isMobile && inputRef.current) {
          inputRef.current.focus();
          // Set cursor to end for better UX
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
      }, 200); // Slightly longer delay for smoother experience
      
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    lastUserMessageRef.current = new Date();

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
      
      // Enhanced RASA response processing with context awareness
      if (data.responses && data.responses.length > 0) {
        for (const rasaResponse of data.responses) {
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Enhanced fallback messages with context
          let fallbackText = "Xin lỗi, tôi không hiểu rõ. ";
          if (pageType === "landing_page" && pageContext?.featuredProduct) {
            fallbackText += `Bạn có thể hỏi về ${pageContext.featuredProduct.name}, giá cả, hoặc cách đặt hàng?`;
          } else if (pageType === "storefront") {
            fallbackText += "Bạn có thể hỏi về sản phẩm, giá cả, tồn kho, hoặc cách đặt hàng?";
          } else {
            fallbackText += "Bạn có thể hỏi lại rõ hơn không?";
          }
          
          // Enhanced suggestions based on context
          let contextSuggestions = rasaResponse.buttons?.map((btn: any) => btn.title);
          if (!contextSuggestions || contextSuggestions.length === 0) {
            const cartItems = pageContext?.cartItems?.length || 0;
            if (pageType === "landing_page") {
              contextSuggestions = ["Chi tiết sản phẩm", "Giá bán", "Đặt hàng", "Hỗ trợ"];
            } else if (cartItems > 0) {
              contextSuggestions = ["Xem giỏ hàng", "Sản phẩm mới", "Thanh toán", "Tư vấn"];
            } else {
              contextSuggestions = ["Tìm sản phẩm", "Danh mục", "Ưu đãi", "Hỗ trợ"];
            }
          }
          
          const botMessage: Message = {
            id: messageId,
            text: rasaResponse.text || fallbackText,
            isBot: true,
            timestamp: new Date(),
            suggestions: contextSuggestions,
            productData: rasaResponse.custom?.product,
            orderData: rasaResponse.custom?.order
          };
          
          // Mark as new message for animation
          setNewMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(messageId);
            return newSet;
          });
          
          setMessages(prev => [...prev, botMessage]);
          
          // Remove from new messages after animation
          setTimeout(() => {
            setNewMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
          }, 500);
          
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
      setConnectionStatus('error');
      setRetryCount(prev => prev + 1);
      setIsNetworkError(true);
      
      // Enhanced error messages based on error type
      let errorText = "Có lỗi xảy ra. ";
      let suggestions: string[] = [];
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorText = "🔌 Mất kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
        suggestions = ["Thử lại", "Kiểm tra mạng", "Liên hệ hỗ trợ"];
      } else if (retryCount >= 3) {
        errorText = "❌ Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút.";
        suggestions = ["Thử lại sau", "Liên hệ trực tiếp", "Xem FAQ"];
      } else {
        errorText = "⚠️ Có lỗi nhỏ xảy ra. Tôi sẽ thử kết nối lại...";
        suggestions = ["Thử lại ngay", "Gửi lại tin nhắn"];
        
        // Auto retry after 2 seconds
        retryTimeoutRef.current = setTimeout(() => {
          sendMessage(text);
        }, 2000);
      }
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        text: errorText,
        isBot: true,
        timestamp: new Date(),
        suggestions
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Reset connection status after 5 seconds
      setTimeout(() => {
        setConnectionStatus('connected');
        setIsNetworkError(false);
      }, 5000);
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
      
      // Enhanced confirmation message with cart context
      const cartItemCount = (pageContext?.cartItems?.length || 0) + 1;
      const confirmMessage: Message = {
        id: `msg_${Date.now()}`,
        text: `✅ Đã thêm ${productData.name} vào giỏ hàng! Bạn hiện có ${cartItemCount} sản phẩm trong giỏ.`,
        isBot: true,
        timestamp: new Date(),
        suggestions: cartItemCount >= 2 
          ? ["Xem giỏ hàng", "Tiếp tục mua sắm", "Thanh toán ngay", "Cần tư vấn thêm?"]
          : ["Thêm sản phẩm khác", "Xem sản phẩm tương tự", "Tư vấn số lượng", "Hỗ trợ thanh toán"]
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      // Trigger new message animation
      setNewMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.add(confirmMessage.id);
        return newSet;
      });
      setTimeout(() => {
        setNewMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(confirmMessage.id);
          return newSet;
        });
      }, 500);
    }
  };

  const renderMessage = (message: Message) => {
    const isNewMessage = newMessageIds.has(message.id);
    
    return (
      <div
        key={message.id}
        className={`flex ${message.isBot ? "justify-start" : "justify-end"} mb-4`}
      >
        <div className={`flex items-start space-x-2 max-w-[85%] ${message.isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
          {/* Enhanced Avatar with status indicator */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative transition-all duration-200 ${
            message.isBot ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg" : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
          }`}>
            {message.isBot ? (
              <Bot className="w-4 h-4 text-white" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
            {/* Online indicator for bot */}
            {message.isBot && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </div>

          {/* Enhanced Message Content */}
          <div className={`rounded-xl px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md ${
            message.isBot 
              ? "bg-white border border-gray-100 text-gray-800" 
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
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

          {/* Enhanced Timestamp */}
          <p className="text-xs opacity-70 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{message.timestamp.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
            {message.isBot && (
              <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
            )}
          </p>
        </div>
      </div>
    </div>
    );
  };

  // Enhanced Mobile full-screen overlay with smart positioning
  const MobileChat = () => {
    const isLandingPage = pageType === "landing_page";
    
    return (
      <div 
        className="fixed inset-0 bg-white flex flex-col"
        style={{ zIndex: positioning.zIndexValue }}
      >
      {/* Enhanced Header with gradient */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Trợ lý mua sắm</h3>
            <p className="text-xs text-green-100">Trực tuyến</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Enhanced Messages with better spacing */}
      <ScrollArea className="flex-1 p-4 bg-gray-50/30">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="flex items-center space-x-3 text-gray-500 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <span className="text-xs text-gray-500 ml-2">Đang soạn...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Enhanced Input with better visual hierarchy */}
      <div className="p-4 border-t bg-white shadow-lg">
        <div className="flex space-x-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputValue)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
            disabled={isTyping}
          />
          <Button 
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4"
          >
            {isTyping ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
  };

  // Enhanced Desktop popup with smart positioning
  const DesktopChat = () => (
    <Card 
      className="fixed right-4 w-96 h-96 shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 border-0 overflow-hidden"
      style={{
        bottom: positioning.desktopBottomOffset,
        zIndex: positioning.zIndexValue
      }}
    >
      {/* Enhanced Header with status indicator */}
      <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Trợ lý mua sắm</CardTitle>
              <p className="text-xs text-green-100">Trực tuyến • Phản hồi nhanh</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 p-1 h-6 w-6 transition-colors duration-200"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 h-6 w-6 transition-colors duration-200"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Enhanced Messages for desktop */}
          <CardContent className="flex-1 p-4 overflow-hidden bg-gray-50/30">
            <ScrollArea className="h-full">
              {messages.map(renderMessage)}
              {isTyping && (
                <div className="flex items-center space-x-3 text-gray-500 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <span className="text-xs text-gray-500 ml-2">Đang soạn...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {/* Enhanced Input for desktop */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputValue)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg"
                disabled={isTyping}
              />
              <Button 
                size="sm"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
              >
                {isTyping ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <>
      {/* Enhanced Floating Button with smart positioning */}
      {!isOpen && (
        <div 
          className={`fixed right-4 transition-all duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
          }`}
          style={{
            bottom: positioning.mobileBottomOffset,
            zIndex: positioning.zIndexValue
          }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-4 border-white transform transition-all duration-300 hover:scale-110 hover:shadow-3xl group touch-manipulation will-change-transform"
            size="lg"
            aria-label="Mở chat hỗ trợ"
            tabIndex={0}
          >
            {/* Ripple effect on hover */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300" />
            
            <MessageCircle className="w-7 h-7 text-white transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            
            {/* Enhanced notification badge with accessibility */}
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-500 text-white text-xs font-bold border-2 border-white shadow-lg animate-pulse hover:animate-bounce will-change-transform"
                aria-label={`${unreadCount} tin nhắn chưa đọc`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            
            {/* Optimized breathing animation ring */}
            <div className="absolute inset-0 rounded-full border-2 border-green-400 opacity-50 animate-ping will-change-transform" aria-hidden="true" />
            
            {/* Online status indicator with accessibility */}
            <div 
              className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse will-change-transform" 
              aria-label="Trạng thái trực tuyến"
              title="Trợ lý đang trực tuyến"
            />
          </Button>
          
          {/* Enhanced tooltip with accessibility */}
          <div 
            className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none will-change-opacity"
            role="tooltip"
            aria-hidden="true"
          >
            Cần hỗ trợ? Chat ngay!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
          </div>
        </div>
      )}

      {/* Enhanced Chat Interface with smart positioning */}
      {isOpen && (
        <>
          {/* Mobile: Full screen overlay */}
          <div className="md:hidden">
            <MobileChat />
          </div>
          
          {/* Desktop: Popup window with smart positioning */}
          <div className="hidden md:block">
            <DesktopChat />
          </div>
        </>
      )}
    </>
  );
}