import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Users, 
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Globe
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 🎭 TRỢ LÝ GIÁM ĐỐC DASHBOARD
 * 
 * Real-time monitoring và control center cho Job Orchestrator
 * Cung cấp giao diện quản lý campaign, worker status, và performance metrics
 */

interface OrchestratorOverview {
  activeCampaigns: number;
  totalWorkers: number;
  onlineWorkers: number;
  queuedJobs: number;
  completedToday: number;
  systemHealth: 'healthy' | 'degraded' | 'error';
}

interface CampaignExecution {
  campaignId: string;
  status: 'planning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';
  plan: {
    strategy: {
      templateName: string;
      templateType: 'content' | 'customer_pipeline';
    };
    timeline: {
      startTime: string;
      estimatedEndTime: string;
      totalJobs: number;
      concurrentWorkers: number;
    };
    antiDetection: {
      ipDiversityScore: number;
      timingVariation: number;
      geographicSpread: string[];
    };
  };
  progress: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    activeWorkers: number;
    currentPhase: string;
  };
  metrics: {
    startedAt?: string;
    completedAt?: string;
    avgExecutionTime: number;
    successRate: number;
    throughput: number;
  };
}

interface WorkerAnalysis {
  totalWorkers: number;
  onlineWorkers: number;
  totalCapacity: number;
  averageSuccessRate: number;
  regionDistribution: {
    region: string;
    workerCount: number;
    capacity: number;
  }[];
  workers: {
    workerId: string;
    name: string;
    region: string;
    platforms: string[];
    successRate: number;
    currentLoad: number;
    maxConcurrentJobs: number;
  }[];
}

export default function OrchestratorDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [quickStartLimit, setQuickStartLimit] = useState(10);
  const queryClient = useQueryClient();

  // =====================================
  // API QUERIES
  // =====================================

  const { data: overview, isLoading: overviewLoading } = useQuery<OrchestratorOverview>({
    queryKey: ['orchestrator-overview'],
    queryFn: async () => {
      const response = await fetch('/api/orchestrator/overview');
      if (!response.ok) throw new Error('Failed to fetch overview');
      const data = await response.json();
      return data.overview;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignExecution[]>({
    queryKey: ['orchestrator-campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/orchestrator/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      return data.campaigns;
    },
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  const { data: workerAnalysis } = useQuery<WorkerAnalysis>({
    queryKey: ['orchestrator-worker-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/orchestrator/worker-analysis');
      if (!response.ok) throw new Error('Failed to fetch worker analysis');
      const data = await response.json();
      return data.analysis;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // =====================================
  // CAMPAIGN CONTROL MUTATIONS
  // =====================================

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/orchestrator/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to pause campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-campaigns'] });
    }
  });

  const resumeCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/orchestrator/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to resume campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-campaigns'] });
    }
  });

  const cancelCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/orchestrator/campaigns/${campaignId}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cancel campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-campaigns'] });
    }
  });

  const quickStartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/orchestrator/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          limit: quickStartLimit,
          strategy: 'balanced'
        })
      });
      if (!response.ok) throw new Error('Failed to start quick campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['orchestrator-overview'] });
    }
  });

  // =====================================
  // HELPER FUNCTIONS
  // =====================================

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      running: { variant: "default", color: "bg-green-500" },
      paused: { variant: "secondary", color: "bg-yellow-500" },
      completed: { variant: "outline", color: "bg-blue-500" },
      failed: { variant: "destructive", color: "bg-red-500" },
      planning: { variant: "outline", color: "bg-gray-500" }
    };

    return (
      <Badge 
        variant={variants[status]?.variant || "outline"}
        className={`${variants[status]?.color} text-white`}
      >
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // =====================================
  // RENDER COMPONENTS
  // =====================================

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎭 Trợ lý Giám đốc</h1>
          <p className="text-gray-600">Hệ thống điều phối thông minh cho auto-posting</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => quickStartMutation.mutate()}
            disabled={quickStartMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            {quickStartMutation.isPending ? 'Đang khởi chạy...' : 'Quick Start'}
          </Button>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign đang chạy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.queuedJobs || 0} jobs đang chờ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workers Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.onlineWorkers || 0}/{overview?.totalWorkers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ online: {overview?.totalWorkers ? Math.round((overview.onlineWorkers / overview.totalWorkers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành hôm nay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Posts đã lên thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tình trạng hệ thống</CardTitle>
            {overview && getHealthIcon(overview.systemHealth)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {overview?.systemHealth === 'healthy' ? 'Tốt' : 
               overview?.systemHealth === 'degraded' ? 'Giảm' : 'Lỗi'}
            </div>
            <p className="text-xs text-muted-foreground">
              Trạng thái tổng thể
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns đang hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.campaignId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{campaign.plan.strategy.templateName}</h3>
                      {getStatusBadge(campaign.status)}
                      <Badge variant="outline">
                        {campaign.plan.strategy.templateType}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {campaign.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseCampaignMutation.mutate(campaign.campaignId)}
                          disabled={pauseCampaignMutation.isPending}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {campaign.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resumeCampaignMutation.mutate(campaign.campaignId)}
                          disabled={resumeCampaignMutation.isPending}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {['running', 'paused'].includes(campaign.status) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelCampaignMutation.mutate(campaign.campaignId)}
                          disabled={cancelCampaignMutation.isPending}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <div className="font-medium">
                        {campaign.progress.completedJobs}/{campaign.progress.totalJobs}
                        <span className="text-gray-500 ml-1">
                          ({Math.round((campaign.progress.completedJobs / campaign.progress.totalJobs) * 100)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Workers:</span>
                      <div className="font-medium">{campaign.progress.activeWorkers}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Success Rate:</span>
                      <div className="font-medium">{campaign.metrics.successRate.toFixed(1)}%</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Phase:</span>
                      <div className="font-medium capitalize">{campaign.progress.currentPhase}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(campaign.progress.completedJobs / campaign.progress.totalJobs) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Anti-Detection Metrics */}
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        IP Diversity: {campaign.plan.antiDetection.ipDiversityScore.toFixed(0)}%
                      </div>
                      <div>
                        Timing Jitter: ±{campaign.plan.antiDetection.timingVariation}min
                      </div>
                      <div>
                        Regions: {campaign.plan.antiDetection.geographicSpread.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có campaign nào đang chạy
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worker Analysis */}
      {workerAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố Workers theo vùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workerAnalysis.regionDistribution.map((region) => (
                  <div key={region.region} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-gray-500">
                        {region.workerCount} workers, {region.capacity} capacity
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${(region.capacity / workerAnalysis.totalCapacity) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workers hiệu suất cao</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workerAnalysis.workers
                  .sort((a, b) => b.successRate - a.successRate)
                  .slice(0, 5)
                  .map((worker) => (
                    <div key={worker.workerId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-gray-500">
                          {worker.region} • {worker.platforms.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{worker.successRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">
                          {worker.currentLoad}/{worker.maxConcurrentJobs}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Start Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Số lượng posts:</label>
              <select 
                value={quickStartLimit} 
                onChange={(e) => setQuickStartLimit(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 posts</option>
                <option value={10}>10 posts</option>
                <option value={20}>20 posts</option>
                <option value={50}>50 posts</option>
              </select>
            </div>
            
            <Button
              onClick={() => quickStartMutation.mutate()}
              disabled={quickStartMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {quickStartMutation.isPending ? 'Đang khởi chạy...' : 'Khởi chạy ngay'}
            </Button>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              Quick Start sẽ tự động chọn {quickStartLimit} posts đã được lên lịch và phân phối thông minh 
              cho các workers online để đăng ngay lập tức.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}