import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Server, 
  Monitor, 
  Cloud, 
  Activity, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Play,
  Pause,
  RefreshCw,
  Users,
  Globe,
  Database,
  Send,
  Plus,
  TrendingUp,
  BarChart3
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Types
interface Worker {
  id: string;
  workerId: string;
  region: string;
  platforms: string[];
  status: 'active' | 'inactive' | 'error';
  lastPingAt?: string;  // Database field name
  totalJobsCompleted?: number;  // Database field name
  successRate?: string;  // Database returns string
  avgExecutionTime?: number;
  isHealthy?: boolean;
  endpointUrl?: string;
  ipAddress?: string;  // Worker IP for diversity tracking
  ipCountry?: string;  // IP geolocation country
  ipRegion?: string;   // IP geolocation region
  isEnabled?: boolean; // Enable/disable toggle state
  capabilities?: {
    maxConcurrentJobs: number;
    supportedJobTypes: string[];
  };
}

interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  totalJobsProcessed: number;
  avgSuccessRate: number;
  totalExecutionTime: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
      error?: string;
      checkedAt: string;
    };
  };
  overall: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface JobDispatchRequest {
  platform: string;
  jobType: string;
  priority: 'low' | 'medium' | 'high';
  targetAccount: {
    id: string;
    name: string;
    platform: string;
  };
  content: {
    caption: string;
    hashtags: string[];
    assetIds: string[];
  };
}

// API Functions
const fetchWorkers = async (): Promise<Worker[]> => {
  const response = await fetch('/api/workers');
  if (!response.ok) {
    throw new Error('Failed to fetch workers');
  }
  const data = await response.json();
  return data.workers || [];
};

const fetchWorkerStats = async (): Promise<WorkerStats> => {
  const response = await fetch('/api/workers/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch worker stats');
  }
  const data = await response.json();
  return data.stats || data;
};

const fetchSystemHealth = async (): Promise<SystemHealth> => {
  const response = await fetch('/api/health/check');
  // Accept both 2xx and 503 responses - 503 means unhealthy but still valid data
  if (!response.ok && response.status !== 503) {
    throw new Error('Failed to fetch system health');
  }
  const data = await response.json();
  
  // Transform the simple health check format to match our SystemHealth interface
  return {
    status: data.status,
    components: {
      database: {
        status: data.status === 'unhealthy' ? 'degraded' : 'healthy',
        checkedAt: data.timestamp,
        responseTime: 0
      },
      workers: {
        status: 'unhealthy', // Workers are always unhealthy when no workers deployed
        checkedAt: data.timestamp,
        responseTime: 0
      }
    },
    overall: {
      healthy: data.components?.healthy || 0,
      degraded: data.components?.degraded || 0,
      unhealthy: data.components?.unhealthy || 0
    }
  };
};

const dispatchJob = async (jobData: JobDispatchRequest) => {
  const response = await fetch('/api/workers/dispatch-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to dispatch job');
  }
  
  return response.json();
};

const refreshWorkerIPs = async (workerIds?: string[]) => {
  const response = await fetch('/api/workers/refresh-ips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerIds }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh worker IPs');
  }
  
  return response.json();
};

const toggleWorker = async (workerId: string, enabled: boolean) => {
  const response = await fetch(`/api/workers/${workerId}/toggle`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle worker');
  }
  
  return response.json();
};

// Worker List Component
function WorkerList({ workers, onToggleWorker, isToggling }: { 
  workers: Worker[]; 
  onToggleWorker: (workerId: string, enabled: boolean) => void;
  isToggling: boolean;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {workers.map((worker) => (
        <Card key={worker.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">{worker.workerId}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {worker.region}
                    <span className="mx-1">•</span>
                    <span className="font-mono text-xs">
                      {worker.ipAddress || 'Detecting...'}
                    </span>
                    {worker.ipCountry && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{worker.ipCountry}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={worker.isEnabled ?? true}
                    disabled={isToggling}
                    onCheckedChange={(checked) => onToggleWorker(worker.workerId, checked)}
                    aria-label={`Toggle ${worker.workerId}`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(worker.status)}
                  <Badge variant="outline" className={getStatusColor(worker.status)}>
                    {worker.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Platforms Row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground">Platforms:</span>
              <div className="flex gap-1">
                {worker.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-xs px-2 py-0.5">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-xs">
                <span className="font-semibold">{(worker.totalJobsCompleted || 0).toLocaleString()}</span>
                <span className="text-muted-foreground">Jobs</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-xs">
                <span className="font-semibold">{worker.successRate || '0.00'}%</span>
                <span className="text-muted-foreground">Success</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-xs">
                <span className="font-semibold">{(worker.avgExecutionTime || 0).toFixed(0)}ms</span>
                <span className="text-muted-foreground">Avg Time</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t text-xs text-muted-foreground text-center">
              Last seen: {worker.lastPingAt ? new Date(worker.lastPingAt).toLocaleString() : 'Never'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// System Health Component
function SystemHealthMonitor({ health }: { health: SystemHealth }) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <Alert className={`border-2 ${getHealthColor(health.status)}`}>
        <div className="flex items-center gap-2">
          {getHealthIcon(health.status)}
          <AlertTitle>System Status: {health.status.toUpperCase()}</AlertTitle>
        </div>
        <AlertDescription>
          {health.overall.healthy} healthy, {health.overall.degraded} degraded, {health.overall.unhealthy} unhealthy components
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {Object.entries(health.components).map(([component, status]) => (
          <Card key={component}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <CardTitle className="text-base capitalize">{component.replace('_', ' ')}</CardTitle>
                </div>
                <Badge variant="outline" className={getHealthColor(status.status)}>
                  {status.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {status.responseTime && (
                  <div>Response time: {status.responseTime}ms</div>
                )}
                {status.error && (
                  <div className="text-red-600">Error: {status.error}</div>
                )}
                <div className="text-muted-foreground">
                  Checked: {new Date(status.checkedAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Job Dispatch Component
function JobDispatchInterface() {
  const [jobData, setJobData] = useState<Partial<JobDispatchRequest>>({
    platform: '',
    jobType: '',
    priority: 'medium',
    content: {
      caption: '',
      hashtags: [],
      assetIds: []
    }
  });

  const queryClient = useQueryClient();

  const dispatchMutation = useMutation({
    mutationFn: dispatchJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
      // Reset form
      setJobData({
        platform: '',
        jobType: '',
        priority: 'medium',
        content: {
          caption: '',
          hashtags: [],
          assetIds: []
        }
      });
    },
  });

  const handleDispatch = () => {
    if (jobData.platform && jobData.jobType && jobData.content?.caption) {
      dispatchMutation.mutate({
        ...jobData,
        targetAccount: {
          id: 'manual-dispatch',
          name: 'Manual Test Account',
          platform: jobData.platform || 'facebook'
        }
      } as JobDispatchRequest);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Manual Job Dispatch
        </CardTitle>
        <CardDescription>
          Dispatch jobs manually to test worker functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={jobData.platform}
              onValueChange={(value) => setJobData(prev => ({ ...prev, platform: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select
              value={jobData.jobType}
              onValueChange={(value) => setJobData(prev => ({ ...prev, jobType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post Content</SelectItem>
                <SelectItem value="story">Story Upload</SelectItem>
                <SelectItem value="comment">Comment Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Content Caption</Label>
          <Input
            id="caption"
            placeholder="Enter content caption..."
            value={jobData.content?.caption || ''}
            onChange={(e) => setJobData(prev => ({
              ...prev,
              content: { 
                hashtags: [],
                assetIds: [],
                ...prev.content, 
                caption: e.target.value 
              }
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={jobData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high') => 
              setJobData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleDispatch}
          disabled={dispatchMutation.isPending || !jobData.platform || !jobData.jobType}
          className="w-full"
        >
          {dispatchMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Dispatching...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Dispatch Job
            </>
          )}
        </Button>

        {dispatchMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dispatch Failed</AlertTitle>
            <AlertDescription>
              {dispatchMutation.error?.message || 'Unknown error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {dispatchMutation.isSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Job Dispatched Successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              The job has been sent to an available worker for processing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Main WorkerManagement Component
export function WorkerManagement() {
  const queryClient = useQueryClient();

  const {
    data: workers,
    isLoading: workersLoading,
    error: workersError,
    refetch: refetchWorkers
  } = useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers,
  });

  const refreshIPsMutation = useMutation({
    mutationFn: refreshWorkerIPs,
    onSuccess: () => {
      // Refresh workers data to get updated IPs
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const toggleWorkerMutation = useMutation({
    mutationFn: ({ workerId, enabled }: { workerId: string; enabled: boolean }) => 
      toggleWorker(workerId, enabled),
    onSuccess: () => {
      // Refresh workers data to get updated state
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const {
    data: workerStats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['workerStats'],
    queryFn: fetchWorkerStats,
  });

  const {
    data: systemHealth,
    isLoading: healthLoading,
    error: healthError
  } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchSystemHealth,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Server className="h-8 w-8 text-blue-600" />
            Worker Management
          </h1>
          <p className="text-muted-foreground">
            Quản lý Vercel Functions workers trong hệ thống "Bộ Não - Cánh Tay - Vệ Tinh"
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => refreshIPsMutation.mutate(undefined)}
            variant="outline"
            disabled={refreshIPsMutation.isPending}
          >
            {refreshIPsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            {refreshIPsMutation.isPending ? 'Refreshing IPs...' : 'Refresh IPs'}
          </Button>
          
          <Button onClick={() => refetchWorkers()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {workerStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workerStats.totalWorkers}</div>
              <p className="text-xs text-muted-foreground">
                {workerStats.activeWorkers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Jobs Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workerStats.totalJobsProcessed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(workerStats.avgSuccessRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all workers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Avg Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workerStats.totalExecutionTime.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Workers
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Dispatch
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Registered Workers</CardTitle>
              <CardDescription>
                List of all Vercel Functions workers and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workersLoading && <div>Loading workers...</div>}
              {workersError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Failed to load workers</AlertDescription>
                </Alert>
              )}
              {!workersLoading && !workersError && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Debug: Found {workers?.length || 0} workers
                  </p>
                  {workers && workers.length > 0 ? (
                    <WorkerList 
                      workers={workers} 
                      onToggleWorker={(workerId, enabled) => 
                        toggleWorkerMutation.mutate({ workerId, enabled })
                      }
                      isToggling={toggleWorkerMutation.isPending}
                    />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Workers Found</AlertTitle>
                      <AlertDescription>
                        No workers are currently registered. Workers will appear here when registered.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Real-time system health monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading && <div>Loading health data...</div>}
              {healthError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Failed to load health data</AlertDescription>
                </Alert>
              )}
              {systemHealth && <SystemHealthMonitor health={systemHealth} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch">
          <JobDispatchInterface />
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>
                Comprehensive worker performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Advanced statistics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WorkerManagement;