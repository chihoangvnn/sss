import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Satellite, 
  TrendingUp, 
  Users, 
  Calendar, 
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';

export interface SatelliteConfig {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'customer_pipeline' | 'general';
  tag: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    gradient: string;
  };
  status: 'active' | 'paused' | 'deploying' | 'error';
  metrics: {
    totalContent: number;
    totalAccounts: number;
    scheduledPosts: number;
    activeAccounts: number;
  };
  lastUpdated?: string;
}

interface BaseSatelliteTemplateProps {
  config: SatelliteConfig;
  onStatusChange?: (newStatus: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
  className?: string;
}

export default function BaseSatelliteTemplate({ 
  config, 
  onStatusChange, 
  onRefresh, 
  onConfigure,
  className 
}: BaseSatelliteTemplateProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch satellite data using our backend APIs
  const { data: satelliteData, isLoading, error, refetch } = useQuery({
    queryKey: ['satellite-data', config.tag.slug],
    queryFn: async () => {
      const response = await fetch(`/api/satellites/by-tag/${config.tag.slug}`);
      if (!response.ok) throw new Error('Failed to fetch satellite data');
      return response.json();
    },
    refetchInterval: config.status === 'active' ? 30000 : false, // Auto-refresh if active
  });

  const handleStatusToggle = () => {
    const newStatus = config.status === 'active' ? 'paused' : 'active';
    onStatusChange?.(newStatus);
  };

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          badge: 'bg-green-100 text-green-800 border-green-200',
          icon: 'text-green-600',
          pulse: 'animate-pulse'
        };
      case 'paused':
        return { 
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: 'text-yellow-600',
          pulse: ''
        };
      case 'deploying':
        return { 
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'text-blue-600',
          pulse: 'animate-spin'
        };
      case 'error':
        return { 
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: 'text-red-600',
          pulse: ''
        };
      default:
        return { 
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: 'text-gray-600',
          pulse: ''
        };
    }
  };

  const statusStyle = getStatusStyling(config.status);

  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto", 
      "border-2 transition-all duration-300 hover:shadow-lg",
      className
    )}
    style={{ borderColor: config.theme.primaryColor + '40' }}
    >
      {/* Header */}
      <CardHeader className="pb-4" style={{ 
        background: `linear-gradient(135deg, ${config.theme.primaryColor}10, ${config.theme.secondaryColor}05)` 
      }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.theme.primaryColor + '15' }}
            >
              <Satellite className={cn("w-6 h-6", statusStyle.pulse)} style={{ color: config.theme.primaryColor }} />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold">{config.name}</CardTitle>
                <Badge className={statusStyle.badge}>
                  <Activity className={cn("w-3 h-3 mr-1", statusStyle.pulse)} />
                  {config.status}
                </Badge>
                {config.tag.icon && (
                  <span className="text-lg">{config.tag.icon}</span>
                )}
              </div>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="w-3 h-3" />
                Category: {config.category}
                {config.lastUpdated && (
                  <>
                    <span>•</span>
                    Updated {new Date(config.lastUpdated).toLocaleTimeString()}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="hover:bg-background/80"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusToggle}
              style={{ 
                color: config.status === 'active' ? '#dc2626' : '#059669',
                borderColor: config.status === 'active' ? '#dc2626' : '#059669'
              }}
            >
              {config.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigure}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{config.metrics.totalContent}</p>
                      <p className="text-xs text-muted-foreground">Content Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{config.metrics.totalAccounts}</p>
                      <p className="text-xs text-muted-foreground">Total Accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{config.metrics.scheduledPosts}</p>
                      <p className="text-xs text-muted-foreground">Scheduled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Zap className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{config.metrics.activeAccounts}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Analytics from Backend */}
            {satelliteData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Live Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Content Library</span>
                      <Badge variant="outline">{satelliteData.data.analytics.totalContent} items</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Connected Accounts</span>
                      <Badge variant="outline">{satelliteData.data.analytics.activeAccounts} active</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Scheduled Posts</span>
                      <Badge variant="outline">{satelliteData.data.analytics.scheduledPosts} queued</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-600 text-sm">Error loading satellite data: {error.message}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs would show detailed content, accounts, and schedule info */}
          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>Content items tagged with "{config.tag.name}"</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading content...
                  </div>
                ) : satelliteData?.data.contentLibrary?.length > 0 ? (
                  <div className="space-y-2">
                    {satelliteData.data.contentLibrary.map((content: any) => (
                      <div key={content.id} className="p-3 bg-background rounded-lg border">
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-muted-foreground">{content.description}</p>
                        <Badge variant="outline" className="mt-2">{content.contentType}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No content found for this satellite</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Accounts</CardTitle>
                <CardDescription>Accounts tagged with "{config.tag.name}"</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading accounts...
                  </div>
                ) : satelliteData?.data.socialAccounts?.length > 0 ? (
                  <div className="space-y-2">
                    {satelliteData.data.socialAccounts.map((account: any) => (
                      <div key={account.id} className="p-3 bg-background rounded-lg border flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.platform}</p>
                        </div>
                        <Badge variant={account.connected ? "default" : "secondary"}>
                          {account.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No accounts found for this satellite</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Posts</CardTitle>
                <CardDescription>Upcoming posts for this satellite</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading schedule...
                  </div>
                ) : satelliteData?.data.scheduledPosts?.length > 0 ? (
                  <div className="space-y-2">
                    {satelliteData.data.scheduledPosts.map((post: any) => (
                      <div key={post.id} className="p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium line-clamp-1">{post.caption}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(post.scheduledTime).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{post.platform}</Badge>
                            <Badge variant={post.status === 'scheduled' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No scheduled posts for this satellite</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}