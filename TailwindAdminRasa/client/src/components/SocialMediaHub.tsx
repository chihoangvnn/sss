import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Facebook, Instagram, Twitter, Music, Users, MessageCircle, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { FacebookConnectButton } from '@/components/FacebookConnectButton';

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  connected: boolean;
  followers?: number;
  lastSync?: string;
  isActive?: boolean;
  pages?: number;
}

interface PlatformStats {
  totalAccounts: number;
  connectedAccounts: number;
  totalFollowers: number;
  pendingMessages: number;
}

const platformConfig = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  },
  instagram: {
    name: 'Instagram', 
    icon: Instagram,
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-purple-600'
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter, 
    color: 'bg-slate-900',
    gradient: 'from-slate-800 to-slate-900'
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    gradient: 'from-black to-slate-800'
  }
};

function PlatformCard({ platform, accounts, stats }: { 
  platform: string; 
  accounts: SocialAccount[];
  stats: PlatformStats;
}) {
  const config = platformConfig[platform as keyof typeof platformConfig];
  const Icon = config.icon;
  const connectedAccounts = accounts.filter(acc => acc.connected);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
      <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <CardTitle className="text-xl font-bold">{config.name}</CardTitle>
              <CardDescription className="text-white/80">
                {stats.connectedAccounts}/{stats.totalAccounts} accounts connected
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {accounts.length} accounts
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalFollowers.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.pendingMessages}</div>
            <div className="text-sm text-gray-500">Messages</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${connectedAccounts.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {connectedAccounts.length > 0 ? '●' : '○'}
            </div>
            <div className="text-sm text-gray-500">Status</div>
          </div>
        </div>
        
        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Connected Accounts</h4>
            <div className="space-y-2">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">{account.name}</span>
                    {account.pages && account.pages > 0 && (
                      <Badge variant="outline" className="text-xs">{account.pages} pages</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Connect Section */}
        <div className="border-t pt-4">
          {platform === 'facebook' ? (
            <div className="space-y-2">
              <FacebookConnectButton />
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => window.open('/facebook-apps', '_blank')}
              >
                🔧 Manage Facebook Apps
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              disabled
            >
              <Icon className="h-4 w-4 mr-2" />
              Connect {config.name} (Coming Soon)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialMediaHub() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: socialAccounts = [] } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/social-accounts');
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      return response.json();
    }
  });

  // Group accounts by platform
  const accountsByPlatform = socialAccounts.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = [];
    }
    acc[account.platform].push(account);
    return acc;
  }, {} as Record<string, SocialAccount[]>);

  // Calculate stats for each platform
  const platformStats = Object.entries(platformConfig).map(([platform, config]) => {
    const accounts = accountsByPlatform[platform] || [];
    const connectedAccounts = accounts.filter(acc => acc.connected);
    
    return {
      platform,
      config,
      accounts,
      stats: {
        totalAccounts: accounts.length,
        connectedAccounts: connectedAccounts.length,
        totalFollowers: connectedAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0),
        pendingMessages: platform === 'facebook' ? 2 : 0 // Mock data for now
      }
    };
  });

  const totalStats = {
    totalAccounts: socialAccounts.length,
    connectedAccounts: socialAccounts.filter(acc => acc.connected).length,
    totalFollowers: socialAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0),
    platforms: Object.keys(accountsByPlatform).length
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Management</h1>
        <p className="text-gray-600">Manage all your social media accounts from one unified dashboard</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalAccounts}</div>
                <p className="text-xs text-gray-500">{totalStats.connectedAccounts} connected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Followers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalFollowers.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Across all platforms</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.platforms}</div>
                <p className="text-xs text-gray-500">Facebook, Instagram, Twitter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-gray-500">Needs response</p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {platformStats.map(({ platform, config, accounts, stats }) => (
              <PlatformCard 
                key={platform} 
                platform={platform} 
                accounts={accounts} 
                stats={stats} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>All Connected Accounts</CardTitle>
              <CardDescription>Manage your social media account connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(accountsByPlatform).map(([platform, accounts]) => {
                  const config = platformConfig[platform as keyof typeof platformConfig];
                  const Icon = config?.icon || Users;
                  
                  return (
                    <div key={platform}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold capitalize">{platform}</h3>
                        <Badge variant="outline">{accounts.length} accounts</Badge>
                      </div>
                      <div className="grid gap-3 ml-7">
                        {accounts.map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${account.connected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <div>
                                <div className="font-medium">{account.name}</div>
                                <div className="text-sm text-gray-500">
                                  {account.connected ? 'Connected' : 'Not connected'} • 
                                  {account.followers ? ` ${account.followers.toLocaleString()} followers` : ' No data'}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">Settings</Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>Unified Inbox</CardTitle>
              <CardDescription>Messages from all your connected social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Coming Soon</h3>
                <p className="text-gray-500">Unified inbox will show messages from all your connected platforms</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler">
          <Card>
            <CardHeader>
              <CardTitle>Content Scheduler</CardTitle>
              <CardDescription>Schedule posts across multiple platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Coming Soon</h3>
                <p className="text-gray-500">Multi-platform content scheduler will be available soon</p>
                <Button variant="outline" className="mt-4">
                  Use Current Post Scheduler
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}