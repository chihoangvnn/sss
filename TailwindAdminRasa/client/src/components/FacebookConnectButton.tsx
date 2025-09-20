import React, { useState } from "react";
import { Facebook, RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Users, Plus, Trash2, Eye, Calendar, Globe } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SocialAccount } from "@shared/schema";

interface FacebookConnectButtonProps {
  accounts?: SocialAccount[];
  onSuccess?: () => void;
  onDisconnect?: (accountId: string) => void;
  compact?: boolean;
  showAccountDetails?: boolean;
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

interface FacebookPage {
  pageId: string;
  pageName: string;
  permissions: string[];
  status: string;
  expiresAt?: string;
}

export function FacebookConnectButton({ 
  accounts = [], 
  onSuccess,
  onDisconnect,
  compact = false,
  showAccountDetails = true
}: FacebookConnectButtonProps) {
  const [connecting, setConnecting] = useState(false);
  const [selectedAccountPages, setSelectedAccountPages] = useState<{accountId: string, pages: FacebookPage[]} | null>(null);
  const [pendingActions, setPendingActions] = useState<{[accountId: string]: 'refresh' | 'disconnect' | null}>({});
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

  // Refresh Facebook tokens with per-account pending state
  const refreshTokensMutation = useMutation({
    mutationFn: async (accountId: string) => {
      setPendingActions(prev => ({...prev, [accountId]: 'refresh'}));
      const response = await apiRequest('POST', `/api/auth/facebook/refresh/${accountId}`, {});
      return await response.json();
    },
    onSuccess: (data, accountId) => {
      setPendingActions(prev => ({...prev, [accountId]: null}));
      queryClient.invalidateQueries({ queryKey: ['facebook-auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: "✅ Facebook tokens refreshed",
        description: `Successfully refreshed tokens for ${data.pages} pages`,
      });
    },
    onError: (error: any, accountId) => {
      setPendingActions(prev => ({...prev, [accountId]: null}));
      toast({
        title: "❌ Failed to refresh tokens",
        description: error.message || "Could not refresh Facebook tokens",
        variant: "destructive"
      });
    }
  });

  // Disconnect Facebook account with per-account pending state
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      setPendingActions(prev => ({...prev, [accountId]: 'disconnect'}));
      const response = await apiRequest('DELETE', `/api/auth/facebook/disconnect/${accountId}`, {});
      return await response.json();
    },
    onSuccess: (data, accountId) => {
      setPendingActions(prev => ({...prev, [accountId]: null}));
      queryClient.invalidateQueries({ queryKey: ['facebook-auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      onDisconnect?.(accountId);
      toast({
        title: "✅ Facebook account disconnected",
        description: "Account has been removed from auto-posting system",
      });
    },
    onError: (error: any, accountId) => {
      setPendingActions(prev => ({...prev, [accountId]: null}));
      toast({
        title: "❌ Failed to disconnect",
        description: error.message || "Could not disconnect Facebook account",
        variant: "destructive"
      });
    }
  });

  // Get pages for specific account
  const getAccountPages = async (accountId: string) => {
    try {
      const response = await apiRequest('GET', `/api/auth/facebook/account/${accountId}/pages`);
      const data = await response.json();
      setSelectedAccountPages({ accountId, pages: data.pages || [] });
    } catch (error) {
      toast({
        title: "❌ Failed to load pages",
        description: "Could not load Facebook pages for this account",
        variant: "destructive"
      });
    }
  };

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

  const handleDisconnect = (accountId: string, accountName: string) => {
    if (window.confirm(`Are you sure you want to disconnect "${accountName}"? This will stop all auto-posting to this account.`)) {
      disconnectMutation.mutate(accountId);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
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
                disabled={pendingActions[account.id] === 'refresh'}
              >
                <RefreshCw className={`w-3 h-3 ${pendingActions[account.id] === 'refresh' ? 'animate-spin' : ''}`} />
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
            {connectedAccounts.map((account, index) => (
              <div key={account.id} className="relative group">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{account.name}</p>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                          Account {index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">{account.pages} pages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Last sync: {formatLastSync(account.lastSync)}</span>
                        </div>
                        {account.isActive && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-100 text-green-700 border-green-300">
                            ● Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRefresh(account.id)}
                            disabled={pendingActions[account.id] === 'refresh'}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            <RefreshCw className={`w-4 h-4 text-green-600 ${pendingActions[account.id] === 'refresh' ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Refresh tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm" 
                                variant="ghost"
                                onClick={() => getAccountPages(account.id)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <Facebook className="w-5 h-5 text-blue-600" />
                                  <span>{account.name} - Facebook Pages</span>
                                </DialogTitle>
                                <DialogDescription>
                                  Manage individual Facebook pages for this account
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedAccountPages?.accountId === account.id && (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {selectedAccountPages.pages.length > 0 ? (
                                    selectedAccountPages.pages.map((page) => (
                                      <div key={page.pageId} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">{page.pageName}</p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                              <span>ID: {page.pageId}</span>
                                              <span>•</span>
                                              <span className={`px-2 py-0.5 rounded-full ${page.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {page.status}
                                              </span>
                                              {page.expiresAt && (
                                                <>
                                                  <span>•</span>
                                                  <span>Expires: {new Date(page.expiresAt).toLocaleDateString()}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className="text-xs">
                                            {page.permissions.length} permissions
                                          </Badge>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => window.open(`https://facebook.com/${page.pageId}`, '_blank')}
                                          >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      <Facebook className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                      <p>No pages found for this account</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View pages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDisconnect(account.id, account.name)}
                            disabled={pendingActions[account.id] === 'disconnect'}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Disconnect account</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {/* Account details section */}
                {showAccountDetails && (
                  <div className="mt-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Auto-posting: <span className="font-medium text-green-600">{account.isActive ? 'Enabled' : 'Disabled'}</span></span>
                      <span>Pages ready for posting: <span className="font-medium">{account.pages}</span></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">Add Another Facebook Account</span>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  Connect multiple Facebook accounts to manage all your pages from one dashboard. Each account will be managed separately.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  variant="outline"
                  className="w-full border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Another Account
                    </>
                  )}
                </Button>
              </div>
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