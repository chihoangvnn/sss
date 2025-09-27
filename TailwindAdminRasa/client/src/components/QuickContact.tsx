import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, Headphones, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  hoverColor: string;
}

const QuickContact: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactOptions: ContactOption[] = [
    {
      id: 'phone',
      label: 'Gọi hotline',
      icon: <Phone className="w-5 h-5" />,
      action: () => window.location.href = 'tel:+84901234567',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'zalo',
      label: 'Chat Zalo',
      icon: <MessageCircle className="w-5 h-5" />,
      action: () => window.open('https://zalo.me/0901234567', '_blank'),
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'messenger',
      label: 'Facebook Messenger',
      icon: <MessageCircle className="w-5 h-5" />,
      action: () => window.open('https://m.me/nhangxanhstore', '_blank'),
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      id: 'email',
      label: 'Gửi email',
      icon: <Mail className="w-5 h-5" />,
      action: () => window.location.href = 'mailto:support@nhangxanh.vn?subject=Hỗ trợ khách hàng',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Contact Options */}
      {isExpanded && (
        <div className="mb-4 space-y-3 animate-in slide-in-from-bottom-5">
          {contactOptions.map((option, index) => (
            <div
              key={option.id}
              className={`transform transition-all duration-300 delay-${index * 50}`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <Button
                onClick={option.action}
                className={`
                  ${option.color} ${option.hoverColor} text-white
                  shadow-lg hover:shadow-xl transition-all duration-200
                  flex items-center gap-3 pl-4 pr-6 py-3 rounded-full
                  transform hover:scale-105 group
                `}
              >
                <div className="group-hover:animate-bounce">
                  {option.icon}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {option.label}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Floating Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-16 h-16 rounded-full shadow-2xl
          bg-gradient-to-r from-orange-500 to-red-500
          hover:from-orange-600 hover:to-red-600
          text-white border-4 border-white
          transform transition-all duration-300
          hover:scale-110 group
          ${isExpanded ? 'rotate-45' : 'hover:rotate-12'}
        `}
      >
        {isExpanded ? (
          <X className="w-6 h-6 transform transition-transform duration-200" />
        ) : (
          <div className="relative">
            <Headphones className="w-6 h-6 group-hover:animate-bounce" />
            {/* Pulse Effect */}
            <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-30 -z-10"></div>
          </div>
        )}
      </Button>

      {/* Tooltip when collapsed */}
      {!isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Hỗ trợ nhanh
          <div className="absolute top-full right-3 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default QuickContact;