import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Globe, 
  Play, 
  Square, 
  RefreshCw,
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings,
  ExternalLink,
  Copy,
  Shield,
  Activity
} from 'lucide-react';

interface NgrokStatus {
  isRunning: boolean;
  tunnelUrl: string | null;
  whiteId: string;
  uptime: string | null;
  connections: number;
  region: string;
  error: string | null;
}

interface NgrokConfig {
  whiteId: string;
  authToken: string | null;
  region: string;
  protocol: string;
  port: number;
  isEnabled: boolean;
  lastUpdated: string;
}

// Fixed White ID từ user
const FIXED_WHITE_ID = '9c3313cc-33fd-4764-9a29-c3d52979e891';

// Fetch ngrok status
const fetchNgrokStatus = async (): Promise<NgrokStatus> => {
  const response = await fetch('/api/ngrok/status');
  if (!response.ok) throw new Error('Failed to fetch ngrok status');
  const data = await response.json();
  return data.status;
};

// Fetch ngrok config
const fetchNgrokConfig = async (): Promise<NgrokConfig> => {
  const response = await fetch('/api/ngrok/config');
  if (!response.ok) throw new Error('Failed to fetch ngrok config');
  const data = await response.json();
  return data.config;
};

// Control ngrok
const controlNgrok = async (action: 'start' | 'stop' | 'restart', config?: any) => {
  const response = await fetch(`/api/ngrok/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: action === 'start' ? JSON.stringify(config) : undefined
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || `Failed to ${action} ngrok`);
  }
  
  return response.json();
};

// Copy to clipboard utility
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export default function NgrokConfig() {
  const queryClient = useQueryClient();
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch ngrok status with auto-refresh
  const { 
    data: status, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ['ngrok-status'],
    queryFn: fetchNgrokStatus,
    refetchInterval: 5000, // Auto refresh every 5 seconds
    staleTime: 2000
  });

  // Fetch ngrok config
  const { 
    data: config, 
    isLoading: configLoading
  } = useQuery({
    queryKey: ['ngrok-config'],
    queryFn: fetchNgrokConfig,
    staleTime: 30000 // Config changes less frequently
  });

  // Control mutations
  const startMutation = useMutation({
    mutationFn: (config: any) => controlNgrok('start', config),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ngrok-status'] });
      }, 3000); // Wait for ngrok to start
    }
  });

  const stopMutation = useMutation({
    mutationFn: () => controlNgrok('stop'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngrok-status'] });
    }
  });

  const restartMutation = useMutation({
    mutationFn: () => controlNgrok('restart'),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ngrok-status'] });
      }, 4000); // Wait for ngrok to restart
    }
  });

  // Handle copy URL
  const handleCopyUrl = async () => {
    if (status?.tunnelUrl) {
      const success = await copyToClipboard(status.tunnelUrl);
      if (success) {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    }
  };

  // Handle start ngrok
  const handleStart = () => {
    const startConfig = {
      whiteListId: FIXED_WHITE_ID,
      region: 'ap',
      port: 5000,
      isEnabled: true
    };
    startMutation.mutate(startConfig);
  };

  // Status indicator component
  const StatusIndicator = ({ status: currentStatus }: { status?: NgrokStatus }) => {
    if (statusLoading) {
      return (
        <div className="flex items-center space-x-2 text-yellow-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking...</span>
        </div>
      );
    }

    if (!currentStatus || !currentStatus.isRunning) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Online</span>
      </div>
    );
  };

  const isLoading = startMutation.isPending || stopMutation.isPending || restartMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-500" />
            Ngrok Configuration
          </h1>
          <p className="text-muted-foreground">
            Quản lý ngrok tunnel cho RASA bot với White ID cố định
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIndicator status={status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStatus()}
            disabled={statusLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Running Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.isRunning ? 'Running' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.uptime ? `Uptime: ${status.uptime}` : 'Not running'}
            </p>
          </CardContent>
        </Card>

        {/* White ID */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">White ID</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
              {FIXED_WHITE_ID}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cố định cho RASA webhook
            </p>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.connections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        {/* Region */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Region</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">
              {status?.region || config?.region || 'AP'}
            </div>
            <p className="text-xs text-muted-foreground">
              Asia Pacific
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tunnel URL Card */}
      {status?.tunnelUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Tunnel URL
            </CardTitle>
            <CardDescription>URL public để truy cập RASA bot từ bên ngoài</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                {status.tunnelUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copiedUrl ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shrink-0"
              >
                <a href={status.tunnelUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {copiedUrl && (
              <p className="text-xs text-green-600 mt-2">✓ Đã copy vào clipboard!</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Control Panel
          </CardTitle>
          <CardDescription>Quản lý trạng thái ngrok tunnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleStart}
              disabled={isLoading || status?.isRunning}
              className="flex items-center gap-2"
            >
              {startMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Ngrok
            </Button>

            <Button
              variant="outline"
              onClick={() => stopMutation.mutate()}
              disabled={isLoading || !status?.isRunning}
              className="flex items-center gap-2"
            >
              {stopMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop
            </Button>

            <Button
              variant="secondary"
              onClick={() => restartMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {restartMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Restart (Get New URL)
            </Button>
          </div>

          {/* Status Messages */}
          <div className="mt-4 space-y-2">
            {startMutation.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to start ngrok: {(startMutation.error as Error).message}
                </AlertDescription>
              </Alert>
            )}

            {stopMutation.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to stop ngrok: {(stopMutation.error as Error).message}
                </AlertDescription>
              </Alert>
            )}

            {restartMutation.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to restart ngrok: {(restartMutation.error as Error).message}
                </AlertDescription>
              </Alert>
            )}

            {status?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {status.error}
                </AlertDescription>
              </Alert>
            )}

            {startMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ngrok started successfully! Tunnel URL will be available in a few seconds.
                </AlertDescription>
              </Alert>
            )}

            {restartMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ngrok restarted successfully! New tunnel URL generated.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Details
          </CardTitle>
          <CardDescription>Thông tin cấu hình hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Fixed Settings</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• White ID: <code className="text-xs">{FIXED_WHITE_ID}</code></li>
                <li>• Port: <strong>5000</strong></li>
                <li>• Protocol: <strong>HTTP</strong></li>
                <li>• Region: <strong>Asia Pacific (ap)</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Tự động get URL mới khi restart</li>
                <li>• White ID cố định cho webhook</li>
                <li>• Real-time status monitoring</li>
                <li>• One-click copy tunnel URL</li>
              </ul>
            </div>
          </div>

          {config?.authToken && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Shield className="h-4 w-4 inline mr-2" />
                Ngrok auth token configured - Premium features available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}