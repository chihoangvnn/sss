import React, { useState, useEffect } from "react";
import { Facebook, Instagram, Twitter, MessageSquare, Settings, Plus, TrendingUp, Webhook, Copy, Check, ExternalLink, Tag, Palette, BarChart3, Users, Filter, Search, Grid, List, Store, Video, ShoppingBag, Package, DollarSign, Eye, Target } from "lucide-react";
import { useLocation } from "wouter";

// TikTok Icon Component (since Lucide doesn't have TikTok)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.242 6.242 0 0 1-1.137-.966c-.849-.849-1.347-2.143-1.347-3.416C16.394.482 15.912 0 15.372 0h-3.372c-.54 0-.976.436-.976.976v11.405c0 1.47-1.194 2.665-2.665 2.665s-2.665-1.194-2.665-2.665c0-1.47 1.194-2.665 2.665-2.665.273 0 .537.041.786.117.54.166 1.119-.138 1.285-.678s-.138-1.119-.678-1.285a4.647 4.647 0 0 0-1.393-.203c-2.551 0-4.617 2.066-4.617 4.617s2.066 4.617 4.617 4.617 4.617-2.066 4.617-4.617V6.853c1.346.713 2.88 1.097 4.464 1.097.54 0 .976-.436.976-.976s-.436-.976-.976-.976c-1.346 0-2.64-.524-3.608-1.436z"/>
  </svg>
);
import { FacebookChatManager } from "./FacebookChatManager";
import { FacebookConnectButton } from "./FacebookConnectButton";
import { TikTokShopOrdersPanel } from "./TikTokShopOrdersPanel";
import { TikTokShopSellerDashboard } from "./TikTokShopSellerDashboard";
import { TikTokShopFulfillmentPanel } from "./TikTokShopFulfillmentPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SocialAccount, PageTag } from "@shared/schema";

interface SocialMediaPanelProps {
  onConnectAccount?: (platform: string) => void;
  onToggleAccount?: (accountId: string, enabled: boolean) => void;
}

// Shopee Icon Component
const ShopeeIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.5 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-13 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6.5-5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  </svg>
);

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  "tiktok-business": TikTokIcon,
  "tiktok-shop": TikTokIcon,
  "shopee": ShopeeIcon,
};

const platformColors = {
  facebook: "text-blue-600",
  instagram: "text-pink-600", 
  twitter: "text-sky-600",
  "tiktok-business": "text-pink-600",
  "tiktok-shop": "text-pink-700",
  "shopee": "text-orange-600",
};

const formatLastPost = (lastPost: Date | null): string => {
  if (!lastPost) return "Chưa có bài viết";
  
  const now = new Date();
  const diffMs = now.getTime() - lastPost.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else {
    return `${diffDays} ngày trước`;
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Beautiful color palette for tags
const tagColors = [
  { name: 'Xanh lá', value: '#10B981', bg: 'bg-emerald-500', text: 'text-white', hover: 'hover:bg-emerald-600' },
  { name: 'Xanh dương', value: '#3B82F6', bg: 'bg-blue-500', text: 'text-white', hover: 'hover:bg-blue-600' },
  { name: 'Tím', value: '#8B5CF6', bg: 'bg-violet-500', text: 'text-white', hover: 'hover:bg-violet-600' },
  { name: 'Hồng', value: '#EC4899', bg: 'bg-pink-500', text: 'text-white', hover: 'hover:bg-pink-600' },
  { name: 'Cam', value: '#F59E0B', bg: 'bg-amber-500', text: 'text-white', hover: 'hover:bg-amber-600' },
  { name: 'Đỏ', value: '#EF4444', bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' },
  { name: 'Xám', value: '#6B7280', bg: 'bg-gray-500', text: 'text-white', hover: 'hover:bg-gray-600' },
  { name: 'Xanh mint', value: '#06B6D4', bg: 'bg-cyan-500', text: 'text-white', hover: 'hover:bg-cyan-600' },
];

// Priority levels with colors
const priorityLevels = [
  { name: 'Cao', value: 'high', color: '#EF4444', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  { name: 'Trung bình', value: 'medium', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { name: 'Thấp', value: 'low', color: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
];

export function SocialMediaPanel({ 
  onConnectAccount, 
  onToggleAccount 
}: SocialMediaPanelProps) {
  const [location] = useLocation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  // Set platform-appropriate default tab
  const getDefaultTab = () => {
    if (location.includes('/tiktok-business')) return "business";
    if (location.includes('/tiktok-shop')) return "shop";
    return "chat"; // Facebook default
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Detect current platform from URL
  const currentPlatform = location.includes('/tiktok-business') ? 'tiktok-business'
                        : location.includes('/tiktok-shop') ? 'tiktok-shop'
                        : location.includes('/shopee') ? 'shopee'
                        : 'facebook';
  const [webhookVerifyToken, setWebhookVerifyToken] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<string>("#3B82F6");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Load existing tags
  const { data: existingTags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['page-tags'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tags');
      const data = await response.json();
      return data as PageTag[];
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  // Tag management mutations
  const createTagMutation = useMutation({
    mutationFn: async (tagData: { name: string; color: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/tags', tagData);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-tags'] });
      toast({
        title: "✅ Tag được tạo thành công",
        description: `Tag "${newTagName}" với màu ${tagColors.find(c => c.value === newTagColor)?.name} đã được tạo.`,
      });
      setNewTagName("");
      setNewTagColor("#3B82F6");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi tạo tag",
        description: error.message || "Không thể tạo tag. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await apiRequest('DELETE', `/api/tags/${tagId}`);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-tags'] });
      toast({
        title: "✅ Tag đã được xóa",
        description: "Tag đã được xóa thành công khỏi hệ thống.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi xóa tag",
        description: error.message || "Không thể xóa tag. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  // Load webhook configuration only for Facebook
  const { data: webhookConfig } = useQuery({
    queryKey: ['facebook-webhook-config'],
    queryFn: async () => {
      const response = await fetch('/api/facebook/webhook-config');
      if (!response.ok) throw new Error('Failed to fetch webhook config');
      return response.json();
    },
    enabled: currentPlatform === 'facebook', // Only load for Facebook
  });

  // Update state when webhook config loads  
  useEffect(() => {
    if (webhookConfig) {
      // Only set token if it's not masked (i.e., empty or full token)
      if (webhookConfig.verifyToken && !webhookConfig.verifyToken.includes('****')) {
        setWebhookVerifyToken(webhookConfig.verifyToken);
      } else if (!webhookConfig.verifyTokenSet) {
        setWebhookVerifyToken(""); // Clear if no token set
      }
      // Keep existing token in input if masked (don't overwrite user input)
      
      setWebhookUrl(webhookConfig.webhookUrl || "");
    }
  }, [webhookConfig]);

  // Save webhook configuration mutation
  const saveWebhookMutation = useMutation({
    mutationFn: async (config: { verifyToken: string; webhookUrl: string }) => {
      const response = await fetch('/api/facebook/webhook-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save webhook config');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-webhook-config'] });
      toast({
        title: "Webhook cấu hình thành công",
        description: "Verification token đã được lưu và sẵn sàng xác thực.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cấu hình webhook",
        description: error.message || "Không thể lưu cấu hình webhook.",
        variant: "destructive",
      });
    },
  });

  const { data: accounts = [], isLoading, error } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
  });

  // Get business account ID for TikTok Shop from the accounts
  const tikTokShopAccount = accounts.find(acc => acc.platform === 'tiktok-shop' && acc.connected);
  const businessAccountId = tikTokShopAccount?.accountId;

  // Handler functions
  const handleSaveWebhookConfig = () => {
    if (!webhookVerifyToken.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập verify token.",
        variant: "destructive",
      });
      return;
    }

    const finalWebhookUrl = webhookUrl || `${window.location.origin}/api/webhooks/facebook`;
    
    saveWebhookMutation.mutate({
      verifyToken: webhookVerifyToken,
      webhookUrl: finalWebhookUrl,
    });
  };

  // Check for OAuth success/error on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'facebook_connected') {
      toast({
        title: "Facebook Connected!",
        description: "Your Facebook account has been successfully connected.",
      });
    } else if (success === 'tiktok_business_connected') {
      toast({
        title: "TikTok Business Connected!",
        description: "Your TikTok Business account has been successfully connected.",
      });
    } else if (success === 'tiktok_shop_connected') {
      toast({
        title: "TikTok Shop Connected!",
        description: "Your TikTok Shop has been successfully connected.",
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh accounts
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        'Access was denied': 'You denied access to Facebook. Please try again.',
        'Authentication failed': 'Facebook authentication failed. Please try again.',
        'security_error': 'Security error occurred. Please try again.',
        'no_authorization_code': 'Authorization failed. Please try again.',
        'authentication_failed': 'Facebook connection failed. Please try again.'
      };
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessages[decodeURIComponent(error)] || "Failed to connect to Facebook. Please try again.",
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, queryClient]);

  // Facebook OAuth success handler - updated for new OAuth flow
  const handleFacebookOAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['facebook-auth-status'] });
    toast({
      title: "✅ Facebook OAuth Successful!",
      description: "Your Facebook pages are now connected and ready for auto-posting.",
    });
  };

  // Disconnect Facebook mutation
  const disconnectFacebookMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest('DELETE', `/api/facebook/disconnect/${accountId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Facebook Disconnected",
        description: "Your Facebook account has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
    },
    onError: (error: any) => {
      console.error('Facebook disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: "Failed to disconnect Facebook account. Please try again.",
      });
    },
  });

  // Connect TikTok Business mutation
  const connectTikTokBusinessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/tiktok-business/connect', { redirectUrl: '/tiktok-business' });
      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to TikTok Business OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      console.error('TikTok Business connect error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to initiate TikTok Business connection. Please try again.",
      });
      setConnectingPlatform(null);
    },
  });

  // Connect TikTok Shop mutation
  const connectTikTokShopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/tiktok-shop/connect', { redirectUrl: '/tiktok-shop' });
      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to TikTok Shop OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      console.error('TikTok Shop connect error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to initiate TikTok Shop connection. Please try again.",
      });
      setConnectingPlatform(null);
    },
  });

  const connectShopeeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/shopee-shop/connect', { 
        redirectUrl: '/shopee' 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Redirect to Shopee OAuth
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      console.error('Shopee connect error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to initiate Shopee connection. Please try again.",
      });
      setConnectingPlatform(null);
    },
  });

  // Disconnect TikTok mutation
  const disconnectTikTokMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest('DELETE', `/api/tiktok/disconnect/${accountId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "TikTok Disconnected",
        description: "Your TikTok account has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
    },
    onError: (error: any) => {
      console.error('TikTok disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: "Failed to disconnect TikTok account. Please try again.",
      });
    },
  });

  const handleConnectAccount = (platform: string) => {
    // Facebook now uses FacebookConnectButton component with OAuth flow
    if (platform === 'tiktok-business') {
      setConnectingPlatform('tiktok-business');
      connectTikTokBusinessMutation.mutate();
    } else if (platform === 'tiktok-shop') {
      setConnectingPlatform('tiktok-shop');
      connectTikTokShopMutation.mutate();
    } else if (platform === 'shopee') {
      setConnectingPlatform('shopee');
      connectShopeeMutation.mutate();
    } else {
      console.log(`Connect ${platform} triggered`);
      onConnectAccount?.(platform);
    }
  };

  const handleDisconnectFacebook = (accountId: string) => {
    disconnectFacebookMutation.mutate(accountId);
  };

  const handleDisconnectTikTok = (accountId: string) => {
    disconnectTikTokMutation.mutate(accountId);
  };

  const handleToggleAccount = (accountId: string, enabled: boolean) => {
    console.log(`Toggle account ${accountId}:`, enabled);
    onToggleAccount?.(accountId, enabled);
  };

  const handlePostContent = (accountId: string) => {
    console.log(`Post content to ${accountId} triggered`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="social-media-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mạng xã hội</h2>
            <p className="text-muted-foreground">Quản lý kết nối và nội dung trên các nền tảng</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Kết nối tài khoản
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-16 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" data-testid="social-media-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mạng xã hội</h2>
            <p className="text-muted-foreground">Quản lý kết nối và nội dung trên các nền tảng</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Không thể tải dữ liệu mạng xã hội</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="social-media-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý mạng xã hội</h1>
          <p className="text-gray-600">Kết nối và quản lý các tài khoản mạng xã hội của bạn</p>
        </div>
        <div className="flex gap-2">
          {/* Facebook Connect Button - Only show on Facebook page */}
          {currentPlatform === 'facebook' && (
            <FacebookConnectButton 
              accounts={accounts}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
                toast({
                  title: "✅ Facebook Connected!",
                  description: "Your Facebook pages are now connected for auto-posting.",
                });
              }}
              compact
            />
          )}
          
          {/* TikTok Business Connect Button - Only show on TikTok Business page */}
          {currentPlatform === 'tiktok-business' && (
            <Button 
              data-testid="button-connect-tiktok-business" 
              onClick={() => handleConnectAccount('tiktok-business')}
              disabled={connectingPlatform === 'tiktok-business' || connectTikTokBusinessMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            >
              <TikTokIcon className="h-4 w-4 mr-2" />
              {connectingPlatform === 'tiktok-business' ? 'Đang kết nối...' : 'Kết nối TikTok Business'}
            </Button>
          )}
          
          {/* TikTok Shop Connect Button - Only show on TikTok Shop page */}
          {currentPlatform === 'tiktok-shop' && (
            <Button 
              data-testid="button-connect-tiktok-shop" 
              onClick={() => handleConnectAccount('tiktok-shop')}
              disabled={connectingPlatform === 'tiktok-shop' || connectTikTokShopMutation.isPending}
              className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800"
            >
              <TikTokIcon className="h-4 w-4 mr-2" />
              {connectingPlatform === 'tiktok-shop' ? 'Đang kết nối...' : 'Kết nối TikTok Shop'}
            </Button>
          )}
          
          {/* Shopee Connect Button - Only show on Shopee page */}
          {currentPlatform === 'shopee' && (
            <Button 
              data-testid="button-connect-shopee" 
              onClick={() => handleConnectAccount('shopee')}
              disabled={connectingPlatform === 'shopee'}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <ShopeeIcon className="h-4 w-4 mr-2" />
              {connectingPlatform === 'shopee' ? 'Đang kết nối...' : 'Kết nối Shopee'}
            </Button>
          )}
          <Button 
            data-testid="button-add-social-account" 
            onClick={() => console.log('Add other social account triggered')}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Kết nối khác
          </Button>
        </div>
      </div>

      {/* Main Tabs - Platform Specific */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tin nhắn Facebook
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Kết nối
          </TabsTrigger>
        </TabsList>

        {/* Accounts Tab Content */}
        <TabsContent value="accounts" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Không có tài khoản mạng xã hội nào</p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
          const Icon = platformIcons[account.platform as keyof typeof platformIcons] || MessageSquare;
          const colorClass = platformColors[account.platform as keyof typeof platformColors] || "text-gray-600";

          return (
            <Card 
              key={account.id} 
              className={`hover-elevate ${selectedAccount === account.id ? 'ring-2 ring-primary' : ''}`}
              data-testid={`social-account-${account.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${colorClass}`} />
                  <div>
                    <h3 className="font-semibold text-sm">{account.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.platform}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={account.connected || false}
                  onCheckedChange={(checked) => handleToggleAccount(account.id, checked)}
                  data-testid={`toggle-${account.id}`}
                />
              </CardHeader>
              
              <CardContent className="space-y-4">
                {account.connected ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold" data-testid={`followers-${account.id}`}>
                          {formatFollowers(account.followers || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Người theo dõi</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {Number(account.engagement || 0).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Tương tác</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Hiệu suất tương tác</span>
                        <span>{Number(account.engagement || 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={Number(account.engagement || 0)} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bài viết cuối:</span>
                      <span data-testid={`last-post-${account.id}`}>
                        {formatLastPost(account.lastPost ? new Date(account.lastPost) : null)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handlePostContent(account.id)}
                        data-testid={`button-post-${account.id}`}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Đăng bài
                      </Button>
                      {account.platform === 'facebook' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDisconnectFacebook(account.id)}
                          disabled={disconnectFacebookMutation.isPending}
                          data-testid={`button-disconnect-${account.id}`}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          {disconnectFacebookMutation.isPending ? 'Đang ngắt...' : 'Ngắt'}
                        </Button>
                      ) : (account.platform === 'tiktok-business' || account.platform === 'tiktok-shop') ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDisconnectTikTok(account.id)}
                          disabled={disconnectTikTokMutation.isPending}
                          data-testid={`button-disconnect-${account.id}`}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          {disconnectTikTokMutation.isPending ? 'Đang ngắt...' : 'Ngắt TikTok'}
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAccount(account.id)}
                          data-testid={`button-manage-${account.id}`}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Tài khoản chưa được kết nối
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => handleConnectAccount(account.platform)}
                      disabled={connectingPlatform === account.platform || 
                               (account.platform === 'tiktok-business' && connectTikTokBusinessMutation.isPending) ||
                               (account.platform === 'tiktok-shop' && connectTikTokShopMutation.isPending)}
                      data-testid={`button-connect-${account.id}`}
                    >
                      {connectingPlatform === account.platform ? 'Đang kết nối...' : 'Kết nối ngay'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
        )}
          </div>

          {/* Facebook Webhook Configuration Section - Facebook Only */}
          {currentPlatform === 'facebook' && (
            <>
              <Separator className="my-8" />
              
              <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Webhook className="h-5 w-5" />
                Cấu hình Webhook Facebook
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Thiết lập webhook để nhận tin nhắn và cập nhật real-time từ Facebook
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl || `${window.location.origin}/api/webhooks/facebook`}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/api/webhooks/facebook"
                    className="font-mono text-xs"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = webhookUrl || `${window.location.origin}/api/webhooks/facebook`;
                      navigator.clipboard.writeText(url);
                      setCopied('url');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="shrink-0"
                  >
                    {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy URL này vào Facebook App Settings → Webhooks
                </p>
              </div>

              {/* Verify Token */}
              <div className="space-y-2">
                <Label htmlFor="verify-token">Verify Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="verify-token"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                    placeholder={webhookConfig?.verifyTokenSet 
                      ? "Token đã được cấu hình (nhập token mới để thay đổi)" 
                      : "Nhập verification token từ Facebook"
                    }
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (webhookVerifyToken) {
                        navigator.clipboard.writeText(webhookVerifyToken);
                        setCopied('token');
                        setTimeout(() => setCopied(null), 2000);
                      }
                    }}
                    disabled={!webhookVerifyToken}
                    className="shrink-0"
                  >
                    {copied === 'token' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token này phải giống trong Facebook App Settings
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  disabled={!webhookVerifyToken.trim()}
                  onClick={handleSaveWebhookConfig}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Lưu cấu hình
                </Button>
                
                <Button variant="outline" onClick={() => {
                  window.open('https://developers.facebook.com/apps', '_blank');
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Mở Facebook Developers
                </Button>
              </div>

              {/* Status indicator */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Trạng thái: {(webhookConfig?.verifyTokenSet || webhookVerifyToken) ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {(webhookConfig?.verifyTokenSet || webhookVerifyToken)
                    ? 'Webhook sẵn sàng nhận tin nhắn từ Facebook'
                    : 'Cần nhập verify token để hoạt động'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Chat Tab Content - Facebook Only */}
        {currentPlatform === 'facebook' && (
          <TabsContent value="chat" className="mt-6">
            <FacebookChatManager />
          </TabsContent>
        )}

        {/* TikTok Business Tab Content */}
        {currentPlatform === 'tiktok-business' && (
          <TabsContent value="business" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50 to-pink-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-700">
                    <TikTokIcon className="h-5 w-5" />
                    TikTok Business API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-pink-100 border border-pink-300 rounded-lg p-4">
                    <h3 className="font-medium text-pink-800 mb-2">🔧 Cấu hình Business API</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Client Key:</span>
                        <Badge variant="outline">Chưa cấu hình</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Client Secret:</span>
                        <Badge variant="outline">Chưa cấu hình</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Access Token:</span>
                        <Badge variant="outline">Chưa có</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-pink-600 hover:bg-pink-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Kết nối TikTok Business
                  </Button>
                  
                  <Button variant="outline" className="w-full" onClick={() => {
                    window.open('https://developers.tiktok.com/apps', '_blank');
                  }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở TikTok Developers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-pink-600" />
                    Video Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Video className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                      <h3 className="font-medium mb-2">Chưa có video nào</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Kết nối TikTok Business để xem analytics video
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* TikTok Shop Tab Content */}
        {currentPlatform === 'tiktok-shop' && (
          <TabsContent value="shop" className="space-y-6 mt-6">
            {/* TikTok Shop Header với branding */}
            <div className="bg-gradient-to-r from-tiktok-black via-tiktok-pink to-tiktok-cyan p-6 rounded-2xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <TikTokIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">TikTok Shop Partner Center</h1>
                      <p className="text-tiktok-cyan/80">Quản lý cửa hàng và bán hàng trên TikTok</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-white/80 text-sm">Trạng thái cửa hàng</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="font-medium">Đang hoạt động</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full"></div>
              <div className="absolute -left-5 -bottom-5 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-tiktok-black/10 backdrop-blur-sm p-1 rounded-xl border border-tiktok-pink/20">
                <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-tiktok-pink data-[state=active]:text-white data-[state=active]:shadow-sm font-medium hover:bg-tiktok-pink/10">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-tiktok-pink data-[state=active]:text-white data-[state=active]:shadow-sm font-medium hover:bg-tiktok-pink/10">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Sản phẩm
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-tiktok-pink data-[state=active]:text-white data-[state=active]:shadow-sm font-medium hover:bg-tiktok-pink/10">
                  <Package className="h-4 w-4 mr-2" />
                  Đơn hàng
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-tiktok-pink data-[state=active]:text-white data-[state=active]:shadow-sm font-medium hover:bg-tiktok-pink/10">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Phân tích
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-tiktok-pink data-[state=active]:text-white data-[state=active]:shadow-sm font-medium hover:bg-tiktok-pink/10">
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Overview Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="relative overflow-hidden bg-gradient-to-br from-tiktok-pink to-tiktok-pink/80 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium">Doanh thu hôm nay</p>
                          <p className="text-3xl font-bold">2.4M VNĐ</p>
                          <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-white/70 mr-1" />
                            <span className="text-white/80 text-sm">+12.5%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full">
                          <DollarSign className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
                  </Card>

                  <Card className="relative overflow-hidden bg-gradient-to-br from-tiktok-cyan to-tiktok-cyan/80 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium">Đơn hàng mới</p>
                          <p className="text-3xl font-bold">147</p>
                          <div className="flex items-center mt-2">
                            <TrendingUp className="h-4 w-4 text-white/70 mr-1" />
                            <span className="text-white/80 text-sm">+8.2%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
                  </Card>

                  <Card className="relative overflow-hidden bg-gradient-to-br from-tiktok-black to-tiktok-black/80 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium">Video views</p>
                          <p className="text-3xl font-bold">1.2M</p>
                          <div className="flex items-center mt-2">
                            <Eye className="h-4 w-4 text-tiktok-cyan mr-1" />
                            <span className="text-white/80 text-sm">24h qua</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full">
                          <Video className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
                  </Card>

                  <Card className="relative overflow-hidden bg-gradient-to-br from-tiktok-pink/80 to-tiktok-black text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-sm font-medium">Tỉ lệ chuyển đổi</p>
                          <p className="text-3xl font-bold">3.8%</p>
                          <div className="flex items-center mt-2">
                            <Target className="h-4 w-4 text-tiktok-cyan mr-1" />
                            <span className="text-white/80 text-sm">Tuần này</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full">
                          <Target className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Plus className="h-5 w-5 text-pink-500" />
                      Thao tác nhanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0">
                        <Plus className="h-6 w-6" />
                        <span>Thêm sản phẩm</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2 border-2 border-cyan-200 hover:bg-cyan-50">
                        <Video className="h-6 w-6 text-cyan-600" />
                        <span className="text-cyan-700">Tạo video</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2 border-2 border-purple-200 hover:bg-purple-50">
                        <Users className="h-6 w-6 text-purple-600" />
                        <span className="text-purple-700">Live stream</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2 border-2 border-orange-200 hover:bg-orange-50">
                        <BarChart3 className="h-6 w-6 text-orange-600" />
                        <span className="text-orange-700">Báo cáo</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-gray-800">
                          <Package className="h-5 w-5 text-pink-500" />
                          Đơn hàng gần đây
                        </span>
                        <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                          Xem tất cả
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[1,2,3].map((i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="font-medium text-gray-900">#TTS00{i}234</p>
                                <p className="text-sm text-gray-500">2 phút trước</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">459,000 VNĐ</p>
                              <Badge className="bg-green-100 text-green-800 border-0">Đã thanh toán</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-gray-800">
                          <TrendingUp className="h-5 w-5 text-cyan-500" />
                          Top sản phẩm
                        </span>
                        <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700">
                          Xem chi tiết
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "Áo thun TikTok Fashion", sales: 45, revenue: "2.1M" },
                          { name: "Túi xách trending viral", sales: 32, revenue: "1.8M" },
                          { name: "Giày sneaker phong cách", sales: 28, revenue: "1.4M" }
                        ].map((product, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-500'
                              }`}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.sales} đã bán</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-pink-600">{product.revenue} VNĐ</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
                    <p className="text-gray-600">Tạo và quản lý sản phẩm trên TikTok Shop</p>
                  </div>
                  <Button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm mới
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map((i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden rounded-t-lg">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-pink-300" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 text-white border-0">Đang bán</Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Sản phẩm #{i}</h3>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-pink-600">299,000 VNĐ</span>
                            <span className="text-sm text-gray-500">Đã bán: 24</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">Chỉnh sửa</Button>
                            <Button size="sm" className="bg-pink-500 hover:bg-pink-600">Xem</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Orders Management Tab */}
              <TabsContent value="orders" className="space-y-4">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-cyan-900">Quản lý đơn hàng TikTok Shop</h2>
                      <p className="text-cyan-700 text-sm">Theo dõi và xử lý đơn hàng từ TikTok Shop</p>
                    </div>
                    <div className="flex items-center space-x-2 text-cyan-600">
                      <Package className="h-5 w-5" />
                      <span className="font-medium">TikTok Commerce</span>
                    </div>
                  </div>
                </div>
                <TikTokShopOrdersPanel businessAccountId={businessAccountId} />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-purple-900">Phân tích hiệu suất TikTok Shop</h2>
                      <p className="text-purple-700 text-sm">Báo cáo chi tiết về doanh thu và hiệu suất bán hàng</p>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium">Analytics</span>
                    </div>
                  </div>
                </div>
                <TikTokShopSellerDashboard businessAccountId={businessAccountId} />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Cài đặt TikTok Shop</h2>
                      <p className="text-gray-700 text-sm">Cấu hình và quản lý kết nối TikTok Shop</p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-pink-500 rounded-xl shadow-lg">
                          <TikTokIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-pink-900">Kết nối TikTok Shop</CardTitle>
                          <p className="text-sm text-pink-700">Quản lý tài khoản và quyền truy cập</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-pink-100/50 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-pink-900">Trạng thái kết nối</span>
                          <Badge className="bg-green-500 text-white border-0 px-3 py-1">
                            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                            Đã kết nối
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-pink-700">Shop ID:</span>
                            <span className="font-mono bg-pink-200 px-2 py-1 rounded text-pink-900">shop_12345</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-pink-700">Quyền truy cập:</span>
                            <span className="text-pink-800">Đầy đủ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-pink-700">Đồng bộ cuối:</span>
                            <span className="text-pink-800">2 phút trước</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="w-full bg-pink-500 hover:bg-pink-600">
                          <Settings className="h-4 w-4 mr-2" />
                          Cài đặt
                        </Button>
                        <Button variant="outline" className="w-full border-pink-200 text-pink-700 hover:bg-pink-50">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Partner Center
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-100">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-cyan-500 rounded-xl shadow-lg">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-cyan-900">Cài đặt đồng bộ</CardTitle>
                          <p className="text-sm text-cyan-700">Tự động hóa và thông báo</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-cyan-100/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <ShoppingBag className="h-5 w-5 text-cyan-600" />
                            <span className="text-cyan-900 font-medium">Đồng bộ sản phẩm</span>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-cyan-100/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-cyan-600" />
                            <span className="text-cyan-900 font-medium">Đồng bộ đơn hàng</span>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-cyan-100/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <MessageSquare className="h-5 w-5 text-cyan-600" />
                            <span className="text-cyan-900 font-medium">Thông báo real-time</span>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Settings */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Settings className="h-5 w-5 text-gray-600" />
                      Cài đặt nâng cao
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shop-name" className="text-gray-700 font-medium">Tên cửa hàng</Label>
                        <Input 
                          id="shop-name" 
                          placeholder="Nhập tên cửa hàng..." 
                          className="border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shop-category" className="text-gray-700 font-medium">Danh mục chính</Label>
                        <Input 
                          id="shop-category" 
                          placeholder="Thời trang, Điện tử..." 
                          className="border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fulfillment-time" className="text-gray-700 font-medium">Thời gian xử lý đơn hàng</Label>
                        <Input 
                          id="fulfillment-time" 
                          type="number" 
                          defaultValue="24" 
                          className="border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-carrier" className="text-gray-700 font-medium">Đối tác vận chuyển</Label>
                        <Input 
                          id="shipping-carrier" 
                          placeholder="GHN, GHTK, J&T Express..." 
                          className="border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <Button variant="outline" className="px-6">Hủy</Button>
                      <Button className="px-6 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
                        Lưu cài đặt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}

        <TabsContent value="tags" className="space-y-6 mt-6">
          {/* Tag Assignment to Accounts */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Users className="h-5 w-5" />
                Gán tags cho tài khoản
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Chọn accounts và gán tags để tổ chức quản lý
              </p>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có tài khoản social media nào</p>
                  <p className="text-sm">Kết nối Facebook account trước để sử dụng tags</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${platformColors[account.platform]}`}>
                          <div className="w-4 h-4">
                            {React.createElement(platformIcons[account.platform])}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.platform}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {existingTags.map((tag) => {
                          const isAssigned = account.tagIds?.includes(tag.id) || false;
                          return (
                            <button
                              key={tag.id}
                              onClick={async () => {
                                try {
                                  const currentTags = account.tagIds || [];
                                  const newTags = isAssigned 
                                    ? currentTags.filter((t: string) => t !== tag.id)
                                    : [...currentTags, tag.id];
                                  
                                  const response = await apiRequest('PATCH', `/api/social-accounts/${account.id}/tags`, { tags: newTags });
                                  
                                  // Refresh account data
                                  queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
                                  
                                  toast({
                                    title: `✅ Tag ${isAssigned ? 'gỡ bỏ' : 'gán'} thành công`,
                                    description: `Tag "${tag.name}" đã được ${isAssigned ? 'gỡ bỏ khỏi' : 'gán cho'} ${account.name}`,
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "❌ Lỗi cập nhật tag",
                                    description: error.message || "Không thể cập nhật tag. Vui lòng thử lại.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className={`px-2 py-1 rounded-full text-xs border transition-all ${
                                isAssigned
                                  ? 'text-white border-transparent'
                                  : 'text-gray-600 border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                backgroundColor: isAssigned ? tag.color : 'transparent'
                              }}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Creation */}
          <Card className="border-l-4 border-l-violet-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-600">
                <Plus className="h-5 w-5" />
                Tạo tag mới
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tạo tags màu sắc để tổ chức conversations và accounts
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tên tag</Label>
                  <Input
                    id="tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nhập tên tag..."
                    className="font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Màu sắc</Label>
                  <div className="flex gap-2 flex-wrap">
                    {tagColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTagColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newTagColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <Button 
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
                disabled={!newTagName.trim() || createTagMutation.isPending}
                onClick={() => {
                  createTagMutation.mutate({
                    name: newTagName,
                    color: newTagColor,
                    description: ""
                  });
                }}
              >
                {createTagMutation.isPending ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {createTagMutation.isPending ? "Đang tạo..." : "Tạo tag"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags hiện có
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : existingTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Chưa có tags nào</p>
                  <p className="text-sm">Tạo tag đầu tiên để bắt đầu tổ chức conversations</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {existingTags
                    .filter(tag => !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <p className="font-medium text-sm">{tag.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tag.description || `Tạo ${tag.createdAt ? new Date(tag.createdAt).toLocaleDateString('vi-VN') : 'chưa rõ'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa tag "${tag.name}"?`)) {
                                deleteTagMutation.mutate(tag.id);
                              }
                            }}
                            disabled={deleteTagMutation.isPending}
                          >
                            {deleteTagMutation.isPending ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : (
                              <Settings className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}