import { useState, useEffect } from "react";
import { Facebook, Instagram, Twitter, MessageSquare, Settings, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mạng xã hội</h2>
          <p className="text-muted-foreground">Quản lý kết nối và nội dung trên các nền tảng</p>
        </div>
        <div className="flex gap-2">
          <Button 
            data-testid="button-connect-facebook" 
            onClick={() => handleConnectAccount('facebook')}
            disabled={connectingPlatform === 'facebook' || connectFacebookMutation.isPending}
            variant="outline"
          >
            <Facebook className="h-4 w-4 mr-2" />
            {connectingPlatform === 'facebook' ? 'Đang kết nối...' : 'Kết nối Facebook'}
          </Button>
          <Button data-testid="button-add-social-account" onClick={() => console.log('Add other social account triggered')}>
            <Plus className="h-4 w-4 mr-2" />
            Kết nối khác
          </Button>
        </div>
      </div>

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
    </div>
  );
}