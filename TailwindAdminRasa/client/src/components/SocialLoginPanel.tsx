import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Mail, Github, Smartphone } from 'lucide-react';

interface SocialLoginPanelProps {
  onSocialLogin?: (provider: string) => void;
  showTitle?: boolean;
  compact?: boolean;
}

const SocialLoginPanel: React.FC<SocialLoginPanelProps> = ({ 
  onSocialLogin, 
  showTitle = true, 
  compact = false 
}) => {
  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => {
        window.location.href = '/auth/google';
        onSocialLogin?.('google');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        window.location.href = '/auth/facebook';
        onSocialLogin?.('facebook');
      }
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-4 h-4" />,
      color: 'bg-gray-800 hover:bg-gray-900',
      action: () => {
        window.location.href = '/auth/github';
        onSocialLogin?.('github');
      }
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: <Smartphone className="w-4 h-4" />,
      color: 'bg-black hover:bg-gray-800',
      action: () => {
        window.location.href = '/auth/apple';
        onSocialLogin?.('apple');
      }
    }
  ];

  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <div className="text-center text-sm text-gray-600">
            Đăng nhập nhanh với
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {socialProviders.map((provider) => (
            <Button
              key={provider.id}
              onClick={provider.action}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              {provider.icon}
              <span className="text-xs">{provider.name}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      {showTitle && (
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <span className="text-2xl">🔐</span>
            Đăng nhập Social
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <div className="text-center text-sm text-gray-600 mb-4">
          Kết nối tài khoản mạng xã hội để đăng nhập nhanh chóng
        </div>
        
        <div className="space-y-2">
          {socialProviders.map((provider) => (
            <Button
              key={provider.id}
              onClick={provider.action}
              className={`w-full ${provider.color} text-white flex items-center justify-center gap-3 py-3 transition-all duration-200 hover:scale-105 shadow-md`}
            >
              {provider.icon}
              <span>Đăng nhập với {provider.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 text-center mt-4 p-2 bg-orange-50 rounded">
          🛡️ <strong>Bảo mật:</strong> Thông tin của bạn được mã hóa và bảo vệ an toàn
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialLoginPanel;