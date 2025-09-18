import { useState, useEffect } from "react";
import { Facebook, Instagram, Twitter, MessageSquare, Settings, Plus, TrendingUp, Webhook, Copy, Check, ExternalLink } from "lucide-react";
import { FacebookChatManager } from "./FacebookChatManager";
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
import type { SocialAccount } from "@shared/schema";

interface SocialMediaPanelProps {
  onConnectAccount?: (platform: string) => void;
  onToggleAccount?: (accountId: string, enabled: boolean) => void;
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
};

const platformColors = {
  facebook: "text-blue-600",
  instagram: "text-pink-600", 
  twitter: "text-sky-600",
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

export function SocialMediaPanel({ 
  onConnectAccount, 
  onToggleAccount 
}: SocialMediaPanelProps) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("accounts");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load webhook configuration on mount
  const { data: webhookConfig } = useQuery({
    queryKey: ['facebook-webhook-config'],
    queryFn: async () => {
      const response = await fetch('/api/facebook/webhook-config');
      if (!response.ok) throw new Error('Failed to fetch webhook config');
      return response.json();
    },
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

  // Connect Facebook mutation
  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/facebook/connect', { redirectUrl: '/social-media' });
      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to Facebook OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      console.error('Facebook connect error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to initiate Facebook connection. Please try again.",
      });
      setConnectingPlatform(null);
    },
  });

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

  const handleConnectAccount = (platform: string) => {
    if (platform === 'facebook') {
      setConnectingPlatform('facebook');
      connectFacebookMutation.mutate();
    } else {
      console.log(`Connect ${platform} triggered`);
      onConnectAccount?.(platform);
    }
  };

  const handleDisconnectFacebook = (accountId: string) => {
    disconnectFacebookMutation.mutate(accountId);
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
          <Button 
            data-testid="button-connect-facebook" 
            onClick={() => handleConnectAccount('facebook')}
            disabled={connectingPlatform === 'facebook' || connectFacebookMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Facebook className="h-4 w-4 mr-2" />
            {connectingPlatform === 'facebook' ? 'Đang kết nối...' : 'Kết nối Facebook'}
          </Button>
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Tài khoản
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tin nhắn
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Thống kê
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
          const Icon = platformIcons[account.platform as keyof typeof platformIcons];
          const colorClass = platformColors[account.platform as keyof typeof platformColors];

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
                      disabled={connectingPlatform === account.platform || (account.platform === 'facebook' && connectFacebookMutation.isPending)}
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

          {/* Webhook Configuration Section */}
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
        </TabsContent>

        {/* Chat Tab Content */}
        <TabsContent value="chat" className="mt-6">
          <FacebookChatManager />
        </TabsContent>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tổng quan hiệu suất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatFollowers(accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Tổng người theo dõi</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {accounts.filter(acc => acc.connected).length}/{accounts.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Tài khoản đã kết nối</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {accounts.length > 0 ? Math.round(accounts.reduce((sum, acc) => sum + Number(acc.engagement || 0), 0) / accounts.length) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Tương tác trung bình</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Analytics Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Hoạt động tin nhắn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tin nhắn hôm nay</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cuộc trò chuyện mới</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Thời gian phản hồi TB</span>
                    <span className="font-semibold">12 phút</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Facebook Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lượt tiếp cận hôm nay</span>
                    <span className="font-semibold">1.2K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tương tác</span>
                    <span className="font-semibold">85</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tỷ lệ tương tác</span>
                    <span className="font-semibold text-green-600">7.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}