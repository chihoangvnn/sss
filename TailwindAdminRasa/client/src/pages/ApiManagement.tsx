import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { Search, Plus, Settings, BarChart3, Power, PowerOff, Wrench, AlertTriangle, CheckCircle, XCircle, Timer, Users, Activity, RefreshCcw } from 'lucide-react';

// Types
interface ApiConfiguration {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  category: string;
  isEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  rateLimitEnabled: boolean;
  rateLimitRequests?: number;
  rateLimitWindowSeconds?: number;
  accessCount: number;
  errorCount: number;
  avgResponseTime: string;
  lastAccessed?: string;
  lastToggled?: string;
  lastError?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  tags?: string[];
  owner?: string;
  requiresAuth: boolean;
  adminOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiStats {
  total: number;
  enabled: number;
  disabled: number;
  maintenance: number;
  categories: Record<string, number>;
  totalAccess: number;
  totalErrors: number;
  avgResponseTime: number;
}

interface ApiConfigurationsResponse {
  configs: ApiConfiguration[];
  categories: string[];
  total: number;
}

export default function ApiManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch API configurations
  const { data: configsData, isLoading, error } = useQuery<ApiConfigurationsResponse>({
    queryKey: ['/api/api-configurations'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch statistics
  const { data: stats } = useQuery<ApiStats>({
    queryKey: ['/api/api-configurations/stats/summary'],
    refetchInterval: 30000,
  });

  // Toggle API mutation
  const toggleApiMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest('POST', `/api/api-configurations/${id}/toggle`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/api-configurations/stats/summary'] });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/api-configurations/cache/clear');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-configurations'] });
    },
  });

  const configs: ApiConfiguration[] = configsData?.configs || [];
  const categories: string[] = configsData?.categories || [];

  // Filter configurations
  const filteredConfigs = configs.filter((config: ApiConfiguration) => {
    const matchesSearch = config.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'enabled' && config.isEnabled && !config.maintenanceMode) ||
                         (selectedStatus === 'disabled' && !config.isEnabled) ||
                         (selectedStatus === 'maintenance' && config.maintenanceMode);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleApi = async (id: string, currentEnabled: boolean) => {
    await toggleApiMutation.mutateAsync({ id, enabled: !currentEnabled });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (config: ApiConfiguration) => {
    if (config.maintenanceMode) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
    }
    if (!config.isEnabled) {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>;
    }
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive',
      high: 'outline',
      normal: 'secondary',
      low: 'outline'
    };
    return <Badge variant={variants[priority as keyof typeof variants] as any}>{priority}</Badge>;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API configurations. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">
            Control and monitor your API endpoints in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add API
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
              <Activity className="h-4 w-4 text-activity-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.enabled} enabled, {stats.disabled} disabled
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <BarChart3 className="h-4 w-4 text-activity-pink" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAccess.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalErrors} errors ({((stats.totalErrors / stats.totalAccess) * 100).toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-activity-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                Across all endpoints
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Mode</CardTitle>
              <Wrench className="h-4 w-4 text-activity-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maintenance}</div>
              <p className="text-xs text-muted-foreground">
                APIs under maintenance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search APIs by endpoint, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category} ({stats?.categories[category] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configurations</CardTitle>
          <CardDescription>
            {filteredConfigs.length} of {configs.length} APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Access Count</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Avg Time</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config: ApiConfiguration) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono text-sm">
                        <div>
                          {config.endpoint}
                          {config.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {config.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {config.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{config.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(config)}</TableCell>
                      <TableCell>{getPriorityBadge(config.priority)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {config.accessCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={config.errorCount > 0 ? 'text-destructive' : ''}>
                          {config.errorCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Math.round(Number(config.avgResponseTime))}ms
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(config.lastAccessed)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.isEnabled && !config.maintenanceMode}
                            onCheckedChange={() => handleToggleApi(config.id, config.isEnabled)}
                            disabled={toggleApiMutation.isPending}
                          />
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredConfigs.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No API configurations found matching your filters.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create API Dialog - Placeholder for now */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Configuration</DialogTitle>
            <DialogDescription>
              Configure a new API endpoint for management and monitoring.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              API creation form will be implemented in the next iteration.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create API
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}