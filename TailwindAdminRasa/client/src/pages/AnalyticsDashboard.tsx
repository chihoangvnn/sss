import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, Users, Calendar, AlertTriangle, Target, 
  Activity, TrendingUp, Clock, CheckCircle, XCircle,
  Settings, Filter, RefreshCw, Download, Eye, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardOverview {
  summary: {
    totalGroups: number;
    totalAccounts: number;
    activeFormulas: number;
    todayPosts: number;
    weeklyPosts: number;
    monthlyPosts: number;
    successRate: number;
    activeRestPeriods: number;
    recentViolations: number;
  };
  timestamp: string;
}

interface GroupAnalytics {
  id: string;
  name: string;
  description: string;
  priority: number;
  weight: string;
  isActive: boolean;
  totalPosts: number;
  lastPostAt: string | null;
  formulaName: string | null;
  accountCount: number;
  createdAt: string;
}

interface LimitUsage {
  scope: string;
  scopeId: string;
  window: string;
  used: number;
  limit: number;
  usagePercent: number;
  windowStart: string;
  windowEnd: string;
  timeRemaining: number;
}

interface PostingTimeline {
  date: string;
  scheduled: number;
  posted: number;
  failed: number;
  total: number;
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const queryClient = useQueryClient();

  // Auto-refresh for real-time monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate all analytics queries with proper key matching
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] && 
                 typeof query.queryKey[0] === 'string' && 
                 query.queryKey[0].startsWith('/api/analytics');
        }
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, queryClient]);

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } = useQuery<DashboardOverview>({
    queryKey: ['/api/analytics/dashboard/overview'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard/overview');
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Fetch account groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<GroupAnalytics[]>({
    queryKey: ['/api/analytics/groups'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Fetch current limits
  const { data: limitsData, isLoading: limitsLoading } = useQuery<{
    byScope: Record<string, LimitUsage[]>;
    all: LimitUsage[];
    timestamp: string;
  }>({
    queryKey: ['/api/analytics/limits/current'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/limits/current');
      if (!response.ok) throw new Error('Failed to fetch limits');
      return response.json();
    },
    refetchInterval: 10000, // More frequent for limits
  });

  // Fetch posting timeline
  const { data: timelineData, isLoading: timelineLoading } = useQuery<{
    timeline: PostingTimeline[];
    period: { days: number; from: string; to: string; };
  }>({
    queryKey: ['/api/analytics/posts/timeline', timeRange, selectedGroup],
    queryFn: async () => {
      const params = new URLSearchParams({ days: timeRange });
      if (selectedGroup !== 'all') params.append('groupId', selectedGroup);
      const response = await fetch(`/api/analytics/posts/timeline?${params}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Platform analytics
  const { data: platformData = [] } = useQuery<Array<{
    platform: string;
    total: number;
    posted: number;
    failed: number;
    avgEngagement: number;
  }>>({
    queryKey: ['/api/analytics/posts/platforms', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/posts/platforms?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch platforms');
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Format data for charts
  const timelineChartData = timelineData?.timeline.map(item => ({
    ...item,
    successRate: item.total > 0 ? ((item.posted / item.total) * 100).toFixed(1) : '0',
  })) || [];

  const platformChartData = platformData.map(item => ({
    ...item,
    successRate: item.total > 0 ? ((item.posted / item.total) * 100).toFixed(1) : '0',
  }));

  // Colors for charts
  const COLORS = {
    posted: '#22c55e',    // Green
    scheduled: '#3b82f6', // Blue  
    failed: '#ef4444',    // Red
    primary: '#8b5cf6',   // Purple
    secondary: '#f59e0b', // Amber
  };

  const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring và insights cho posting system
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 ngày</SelectItem>
                <SelectItem value="7">7 ngày</SelectItem>
                <SelectItem value="30">30 ngày</SelectItem>
                <SelectItem value="90">90 ngày</SelectItem>
              </SelectContent>
            </Select>

            {/* Group Filter */}
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chọn group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả groups</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Controls */}
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.summary.totalGroups}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.summary.totalAccounts} accounts total
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Posts</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.summary.todayPosts}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.summary.weeklyPosts} tuần này
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.summary.successRate}%</div>
                <Progress value={overview.summary.successRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {overview.summary.recentViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview.summary.activeRestPeriods} active rests
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">📈 Timeline</TabsTrigger>
            <TabsTrigger value="groups">👥 Groups</TabsTrigger>
            <TabsTrigger value="limits">⚡ Limits</TabsTrigger>
            <TabsTrigger value="platforms">🌐 Platforms</TabsTrigger>
          </TabsList>

          {/* Timeline Analytics */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Posting Timeline - {timeRange} ngày qua
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timelineLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="posted" 
                        stroke={COLORS.posted} 
                        strokeWidth={2}
                        name="Posted" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="scheduled" 
                        stroke={COLORS.scheduled} 
                        strokeWidth={2}
                        name="Scheduled" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failed" 
                        stroke={COLORS.failed} 
                        strokeWidth={2}
                        name="Failed" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Analytics */}
          <TabsContent value="groups" className="space-y-6">
            <div className="grid gap-4">
              {groupsLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : (
                groups.map(group => (
                  <Card key={group.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Badge variant={group.isActive ? "default" : "secondary"}>
                              {group.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {group.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{group.totalPosts}</div>
                          <p className="text-xs text-muted-foreground">total posts</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <div className="font-medium">#{group.priority}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accounts:</span>
                          <div className="font-medium">{group.accountCount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Formula:</span>
                          <div className="font-medium">{group.formulaName || "None"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Limits Monitoring */}
          <TabsContent value="limits" className="space-y-6">
            {limitsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {Object.entries(limitsData?.byScope || {}).map(([scope, limits]) => (
                  <Card key={scope}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        <Target className="h-5 w-5" />
                        {scope} Limits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {limits.map((limit, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{limit.window}</Badge>
                                <span className="font-medium">
                                  {limit.used} / {limit.limit}
                                </span>
                                <Badge 
                                  variant={limit.usagePercent > 90 ? "destructive" : 
                                          limit.usagePercent > 70 ? "secondary" : "default"}
                                >
                                  {limit.usagePercent}%
                                </Badge>
                              </div>
                              <Progress value={limit.usagePercent} className="h-2" />
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm text-muted-foreground">
                                {Math.floor(limit.timeRemaining / 3600)}h remaining
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Platform Analytics */}
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="posted" fill={COLORS.posted} name="Posted" />
                    <Bar dataKey="failed" fill={COLORS.failed} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Real-time Status */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Live Monitoring Active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {overview?.timestamp ? new Date(overview.timestamp).toLocaleTimeString() : 'Loading...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}