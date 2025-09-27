'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Package, HelpCircle, Search, ShoppingCart } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: string;
  image: string;
}

const DesktopChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của NhangSach.Net. Tôi có thể giúp bạn tìm sách, theo dõi đơn hàng và trả lời các câu hỏi. Bạn cần hỗ trợ gì?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: Search, text: 'Tìm sách', action: () => handleQuickAction('Tôi muốn tìm sách') },
    { icon: Package, text: 'Đơn hàng', action: () => handleQuickAction('Kiểm tra đơn hàng của tôi') },
    { icon: HelpCircle, text: 'Hỗ trợ', action: () => handleQuickAction('Tôi cần hỗ trợ') }
  ];

  const productSuggestions: ProductSuggestion[] = [
    {
      id: '1',
      name: 'Sách Giáo Khoa Lớp 12',
      price: '450.000 VNĐ',
      image: '/images/book-placeholder.jpg'
    },
    {
      id: '2', 
      name: 'Truyện Tranh Conan',
      price: '85.000 VNĐ',
      image: '/images/book-placeholder.jpg'
    }
  ];

  const handleQuickAction = (message: string) => {
    handleSendMessage(message);
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      setIsTyping(false);
      const botResponse = generateBotResponse(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1500);
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sách') || lowerMessage.includes('tìm')) {
      return 'Tôi có thể giúp bạn tìm sách theo thể loại, tác giả hoặc từ khóa. Bạn đang tìm loại sách nào?';
    } else if (lowerMessage.includes('đơn hàng') || lowerMessage.includes('order')) {
      return 'Để kiểm tra đơn hàng, bạn vui lòng cung cấp mã đơn hàng hoặc số điện thoại đặt hàng.';
    } else if (lowerMessage.includes('giá') || lowerMessage.includes('price')) {
      return 'Giá sách tại NhangSach.Net rất cạnh tranh. Bạn có thể xem giá chi tiết từng sản phẩm. Tôi có thể tìm sách trong tầm giá bạn mong muốn.';
    } else {
      return 'Cảm ơn bạn đã liên hệ! Tôi luôn sẵn sàng hỗ trợ bạn về sách và đơn hàng. Bạn có câu hỏi cụ thể nào không?';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // SEO Schema markup for ChatBot
  const chatBotSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NhangSach.Net AI Assistant",
    "applicationCategory": "CustomerSupport",
    "operatingSystem": "Web Browser",
    "description": "Trợ lý AI hỗ trợ khách hàng 24/7 tại NhangSach.Net - tìm sách, theo dõi đơn hàng, tư vấn mua sắm",
    "provider": {
      "@type": "Organization",
      "name": "NhangSach.Net"
    },
    "featureList": [
      "Tìm kiếm sách theo từ khóa",
      "Theo dõi đơn hàng",
      "Tư vấn sản phẩm",
      "Hỗ trợ khách hàng 24/7"
    ]
  };

  useEffect(() => {
    // Add schema markup to document head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(chatBotSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="Mở trợ lý AI hỗ trợ khách hàng"
          title="Trợ lý AI - Hỗ trợ 24/7"
        >
          <MessageCircle size={28} />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Trợ lý AI NhangSach.Net</h3>
                <p className="text-xs text-green-100">● Online - Phản hồi ngay</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Đóng chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex space-x-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                >
                  <action.icon size={14} />
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isBot 
                    ? 'bg-gray-100 text-gray-800 rounded-bl-md' 
                    : 'bg-green-500 text-white rounded-br-md'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-green-100'}`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Suggestions */}
            {messages.length > 2 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Gợi ý sản phẩm</p>
                <div className="space-y-2">
                  {productSuggestions.map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                        <Package size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-green-600 font-semibold">{product.price}</p>
                      </div>
                      <ShoppingCart size={14} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                aria-label="Nhập tin nhắn cho trợ lý AI"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-colors"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DesktopChatBot;