import React, { useState } from "react";
import { Facebook, RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SocialAccount } from "@shared/schema";

interface FacebookConnectButtonProps {
  accounts?: SocialAccount[];
  onSuccess?: () => void;
  compact?: boolean;
}

interface FacebookAuthStatus {
  configured: boolean;
  accounts: Array<{
    id: string;
    name: string;
    connected: boolean;
    pages: number;
    lastSync: string | null;
    isActive: boolean;
  }>;
}

export function FacebookConnectButton({ 
  accounts = [], 
  onSuccess,
  compact = false 
}: FacebookConnectButtonProps) {
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Facebook OAuth status
  const { data: authStatus, isLoading: statusLoading } = useQuery<FacebookAuthStatus>({
    queryKey: ['facebook-auth-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/facebook/status');
      return await response.json();
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  // Refresh Facebook tokens
  const refreshTokensMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest('POST', `/api/auth/facebook/refresh/${accountId}`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facebook-auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: "✅ Facebook tokens refreshed",
        description: `Successfully refreshed tokens for ${data.pages} pages`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to refresh tokens",
        description: error.message || "Could not refresh Facebook tokens",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    setConnecting(true);
    
    // Show connecting toast
    toast({
      title: "🔄 Connecting to Facebook",
      description: "You will be redirected to Facebook to authorize access...",
    });

    // Small delay for UX, then redirect to OAuth
    setTimeout(() => {
      window.location.href = '/api/auth/facebook';
    }, 1000);
  };

  const handleRefresh = (accountId: string) => {
    refreshTokensMutation.mutate(accountId);
  };

  // Get Facebook accounts
  const facebookAccounts = accounts.filter(account => account.platform === 'facebook' && account.accountId !== 'webhook_config');
  const connectedAccounts = authStatus?.accounts?.filter(acc => acc.connected) || [];
  const hasConnectedAccounts = connectedAccounts.length > 0;

  if (statusLoading) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-md"}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse" />
            <div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!authStatus?.configured) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-md"}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Facebook Not Configured</p>
              <p className="text-xs text-gray-500">FACEBOOK_APP_ID or FACEBOOK_APP_SECRET missing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact && hasConnectedAccounts) {
    const account = connectedAccounts[0];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Facebook className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-1">
                    {account.pages} pages
                  </Badge>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </div>
              </div>
              <Button
                size="sm" 
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleRefresh(account.id)}
                disabled={refreshTokensMutation.isPending}
              >
                <RefreshCw className={`w-3 h-3 ${refreshTokensMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Facebook connected with {account.pages} pages</p>
            <p className="text-xs opacity-75">Click refresh to update tokens</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={compact ? "w-full" : "w-full max-w-md"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Facebook className="w-4 h-4 text-blue-600" />
          <span>Facebook Pages Connection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasConnectedAccounts ? (
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">{account.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-green-700">
                      <Users className="w-3 h-3" />
                      <span>{account.pages} pages connected</span>
                      {account.lastSync && (
                        <>
                          <span>•</span>
                          <span>Synced {new Date(account.lastSync).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRefresh(account.id)}
                  disabled={refreshTokensMutation.isPending}
                  className="ml-2"
                >
                  {refreshTokensMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <Button
                onClick={handleConnect}
                disabled={connecting}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect Another Account
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Facebook className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Connect your Facebook Pages</h3>
              <p className="text-xs text-gray-500 mb-4">
                Authorize access to manage and post content to your Facebook pages automatically.
              </p>
            </div>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Facebook className="w-4 h-4 mr-2" />
                  Connect Facebook
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 flex items-center justify-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              You'll be redirected to Facebook
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export additional components for specific use cases
export function FacebookConnectStatus({ accounts }: { accounts: SocialAccount[] }) {
  const facebookAccounts = accounts.filter(account => 
    account.platform === 'facebook' && account.accountId !== 'webhook_config'
  );
  
  if (facebookAccounts.length === 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Not Connected
      </Badge>
    );
  }

  const connectedAccounts = facebookAccounts.filter(account => account.connected);
  const pageCount = connectedAccounts.reduce((total, account) => {
    const tokens = account.pageAccessTokens as any[] || [];
    return total + tokens.length;
  }, 0);

  return (
    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" />
      {pageCount} pages connected
    </Badge>
  );
}