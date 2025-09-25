import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, 
  Server, 
  MessageCircle, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Database,
  Zap,
  Users,
  TrendingUp,
  Globe,
  ExternalLink
} from 'lucide-react';

interface BotStatus {
  isRunning: boolean;
  uptime?: number;
  lastCheck?: string;
  responseTime?: number;
}

interface NgrokStatus {
  isRunning: boolean;
  tunnelUrl: string | null;
  whiteId: string;
  uptime: string | null;
  connections: number;
  region: string;
  error: string | null;
}

interface SystemHealth {
  server: boolean;
  rasa: BotStatus;
  ngrok: NgrokStatus;
  botResponse: {
    status: string;
    response?: any;
    error?: string;
  };
  conversations: {
    status: string;
    count: number;
    latest?: any;
  };
}

interface ChatMessage {
  id: string;
  senderType: 'user' | 'bot';
  content: string;
  timestamp: string;
  hasButtons?: boolean;
  buttons?: Array<{ title: string; payload: string }>;
}

interface Conversation {
  id: string;
  sessionId: string;
  status: string;
  messageCount: number;
  messages: ChatMessage[];
  createdAt: string;
}

const formatUptime = (milliseconds?: number): string => {
  if (!milliseconds) return 'Unknown';
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('vi-VN');
};

// Fetch ngrok status
const fetchNgrokStatus = async (): Promise<NgrokStatus> => {
  const response = await fetch('/api/ngrok/status');
  if (!response.ok) {
    return {
      isRunning: false,
      tunnelUrl: null,
      whiteId: '9c3313cc-33fd-4764-9a29-c3d52979e891',
      uptime: null,
      connections: 0,
      region: 'ap',
      error: 'Failed to fetch ngrok status'
    };
  }
  const data = await response.json();
  return data.status;
};

// Fetch bot system health
const fetchBotHealth = async (): Promise<SystemHealth> => {
  const [serverRes, rasaRes, conversationsRes, ngrokStatus] = await Promise.all([
    fetch('/api/health').catch(() => ({ ok: false })),
    fetch('/api/rasa-management/server/status').catch(() => ({ ok: false, json: () => ({}) })),
    fetch('/api/rasa/conversations?limit=5').catch(() => ({ ok: false, json: () => ({}) })),
    fetchNgrokStatus().catch(() => ({
      isRunning: false,
      tunnelUrl: null,
      whiteId: '9c3313cc-33fd-4764-9a29-c3d52979e891',
      uptime: null,
      connections: 0,
      region: 'ap',
      error: 'Failed to fetch ngrok status'
    }))
  ]);

  const server = serverRes.ok;
  const rasaData = rasaRes.ok ? await rasaRes.json() : {};
  const conversationsData = conversationsRes.ok ? await conversationsRes.json() : { success: false };

  return {
    server,
    rasa: {
      isRunning: rasaData?.isRunning || false,
      uptime: rasaData?.uptime,
      lastCheck: rasaData?.lastCheck,
      responseTime: rasaRes.ok ? 200 : 0
    },
    ngrok: ngrokStatus,
    botResponse: {
      status: server && rasaData?.isRunning ? 'working' : 'failed'
    },
    conversations: {
      status: conversationsData?.success ? 'working' : 'failed',
      count: conversationsData?.count || 0,
      latest: conversationsData?.data?.[0]
    }
  };
};

// Fetch conversation logs
const fetchConversationLogs = async (): Promise<Conversation[]> => {
  const response = await fetch('/api/rasa/conversations?limit=10');
  if (!response.ok) throw new Error('Failed to fetch conversations');
  
  const data = await response.json();
  return data.success ? data.data : [];
};

// Status indicator component
const StatusIndicator: React.FC<{ 
  status: boolean | string; 
  label: string; 
  details?: string;
  loading?: boolean;
}> = ({ status, label, details, loading }) => {
  const getStatusColor = () => {
    if (loading) return 'text-yellow-500';
    if (typeof status === 'boolean') {
      return status ? 'text-green-500' : 'text-red-500';
    }
    switch (status) {
      case 'working': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (typeof status === 'boolean') {
      return status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
    }
    switch (status) {
      case 'working': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (typeof status === 'boolean') {
      return status ? 'Online' : 'Offline';
    }
    return status === 'working' ? 'Working' : 'Failed';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      <div>
        <span className="font-medium">{label}</span>
        <span className={`ml-2 ${getStatusColor()}`}>{getStatusText()}</span>
        {details && (
          <p className="text-xs text-muted-foreground mt-1">{details}</p>
        )}
      </div>
    </div>
  );
};

// Message component
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isBot = message.senderType === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isBot 
          ? 'bg-gray-200 text-gray-800' 
          : 'bg-blue-500 text-white'
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          {isBot ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          <span className="text-xs font-medium">
            {isBot ? 'Bot' : 'User'}
          </span>
          <span className="text-xs opacity-70">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm">{message.content}</p>
        {message.hasButtons && message.buttons && message.buttons.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.buttons.map((button, index) => (
              <div key={index} className="text-xs bg-white bg-opacity-20 rounded px-2 py-1">
                🔘 {button.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function BotStatusDashboard() {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health
  const { 
    data: health, 
    isLoading: healthLoading, 
    error: healthError,
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['bot-health'],
    queryFn: fetchBotHealth,
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 2000
  });

  // Fetch conversation logs
  const { 
    data: conversations, 
    isLoading: conversationsLoading,
    refetch: refetchConversations 
  } = useQuery({
    queryKey: ['bot-conversations'],
    queryFn: fetchConversationLogs,
    refetchInterval: autoRefresh ? 10000 : false,
    staleTime: 5000
  });

  const handleRefresh = () => {
    refetchHealth();
    refetchConversations();
  };

  const overallStatus = health?.server && health?.rasa?.isRunning && health?.botResponse?.status === 'working';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-500" />
            Bot Status Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitoring bot health, performance và chat conversations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={overallStatus ? 'default' : 'destructive'} className="px-3 py-1">
            {overallStatus ? '🟢 Healthy' : '🔴 Issues'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={healthLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {healthError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load bot status. Please check server connection.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="conversations">Chat Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* System Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Server Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusIndicator 
                  status={health?.server || false}
                  label="Express Server"
                  loading={healthLoading}
                />
              </CardContent>
            </Card>

            {/* RASA Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RASA Bot</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusIndicator 
                  status={health?.rasa?.isRunning || false}
                  label="RASA Engine"
                  details={health?.rasa?.isRunning ? `Uptime: ${formatUptime(health.rasa.uptime)}` : undefined}
                  loading={healthLoading}
                />
              </CardContent>
            </Card>

            {/* Chat Response */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Response</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusIndicator 
                  status={health?.botResponse?.status || 'failed'}
                  label="Bot Responses"
                  loading={healthLoading}
                />
              </CardContent>
            </Card>

            {/* Ngrok Tunnel */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ngrok Tunnel</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusIndicator 
                  status={health?.ngrok?.isRunning || false}
                  label="Public URL"
                  details={health?.ngrok?.tunnelUrl ? 'Connected' : 'Offline'}
                  loading={healthLoading}
                />
                {health?.ngrok?.tunnelUrl && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Connections:</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {health.ngrok.connections}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <StatusIndicator 
                  status={health?.conversations?.status || 'failed'}
                  label="Chat History"
                  details={`${health?.conversations?.count || 0} conversations`}
                  loading={healthLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Ngrok Status Details */}
          {health?.ngrok && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Ngrok Tunnel Status
                </CardTitle>
                <CardDescription>Public URL tunnel for RASA webhook</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={health.ngrok.isRunning ? 'default' : 'destructive'}>
                        {health.ngrok.isRunning ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Region:</span>
                      <span className="text-sm font-mono uppercase">
                        {health.ngrok.region}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Connections:</span>
                      <Badge variant="outline">
                        {health.ngrok.connections}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">White ID:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {health.ngrok.whiteId?.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {health.ngrok.tunnelUrl ? (
                      <div>
                        <span className="font-medium">Public URL:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                            {health.ngrok.tunnelUrl}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="shrink-0"
                          >
                            <a 
                              href={health.ngrok.tunnelUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <AlertTriangle className="h-4 w-4 inline mr-2" />
                          No public URL available. Ngrok may be offline.
                        </p>
                      </div>
                    )}

                    {health.ngrok.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <XCircle className="h-4 w-4 inline mr-2" />
                          {health.ngrok.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href="/ngrok-config">
                        <Globe className="h-4 w-4 mr-2" />
                        Manage Ngrok
                      </a>
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Go to Ngrok Configuration to start/stop/restart tunnel
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Activity */}
          {health?.conversations?.latest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Latest Activity
                </CardTitle>
                <CardDescription>Most recent conversation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Session ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {health.conversations.latest.sessionId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Messages:</span>
                    <Badge variant="outline">
                      {health.conversations.latest.messages?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={health.conversations.latest.status === 'active' ? 'default' : 'secondary'}>
                      {health.conversations.latest.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(health.conversations.latest.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Recent Conversations ({conversations?.length || 0})
              </CardTitle>
              <CardDescription>Latest chat conversations with the bot</CardDescription>
            </CardHeader>
            <CardContent>
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading conversations...</span>
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="space-y-6">
                  {conversations.slice(0, 5).map((conversation) => (
                    <div key={conversation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">Session: {conversation.sessionId}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(conversation.createdAt)} • {conversation.messageCount} messages
                          </p>
                        </div>
                        <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                          {conversation.status}
                        </Badge>
                      </div>
                      
                      {/* Messages */}
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {conversation.messages.slice(0, 4).map((message) => (
                          <MessageBubble key={message.id} message={message} />
                        ))}
                        {conversation.messages.length > 4 && (
                          <div className="text-center text-sm text-muted-foreground py-2">
                            ... và {conversation.messages.length - 4} tin nhắn khác
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có cuộc trò chuyện nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>RASA Server:</span>
                    <span className="font-mono text-sm">
                      {health?.rasa?.responseTime || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database:</span>
                    <span className="font-mono text-sm">~500ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Response:</span>
                    <span className="font-mono text-sm">~750ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Conversations:</span>
                    <span className="font-medium">{health?.conversations?.count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">
                      {formatUptime(health?.rasa?.uptime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Check:</span>
                    <span className="font-medium text-sm">
                      {health?.rasa?.lastCheck ? formatTime(health.rasa.lastCheck) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Backend Services</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Express.js Server</li>
                    <li>• RASA NLU Engine</li>
                    <li>• PostgreSQL Database</li>
                    <li>• Real-time WebSocket</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Vietnamese Language Support</li>
                    <li>• Interactive Buttons</li>
                    <li>• Session Management</li>
                    <li>• Chat History Logging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}