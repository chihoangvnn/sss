import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Zap, 
  Clock, 
  MemoryStick, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Minimize2, 
  Maximize2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerformanceOverlayProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}

// Technical goals thresholds
const PERFORMANCE_GOALS = {
  search: 200, // ms
  tabSwitch: 100, // ms
  cartOp: 50, // ms
  pageLoad: 2000, // ms
  frameRate: 55, // fps (target 60, warn below 55)
} as const;

// Performance status indicators
const getStatusIcon = (value: number, threshold: number, inverse: boolean = false) => {
  const isGood = inverse ? value >= threshold : value <= threshold;
  return isGood ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <AlertTriangle className="h-4 w-4 text-red-500" />
  );
};

const getStatusColor = (value: number, threshold: number, inverse: boolean = false) => {
  const isGood = inverse ? value >= threshold : value <= threshold;
  return isGood ? 'text-green-600' : 'text-red-600';
};

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  enabled = import.meta.env.DEV,
  position = 'bottom-right',
  minimized: initialMinimized = false,
}) => {
  const { stats, clearMetrics } = usePerformanceMonitor();
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isVisible, setIsVisible] = useState(true);
  const [currentFrameRate, setCurrentFrameRate] = useState<number>(60);

  // Frame rate monitoring
  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrameRate = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setCurrentFrameRate(fps);
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(measureFrameRate);
    };

    animationId = requestAnimationFrame(measureFrameRate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  // Auto-hide after period of inactivity
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    
    if (enabled && !isMinimized) {
      hideTimeout = setTimeout(() => {
        setIsMinimized(true);
      }, 30000); // Auto-minimize after 30 seconds
    }

    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [enabled, isMinimized, stats]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const searchMetrics = stats.slowOperations.filter(m => m.name.includes('search'));
    const tabMetrics = stats.slowOperations.filter(m => m.name.includes('tab'));
    const cartMetrics = stats.slowOperations.filter(m => m.name.includes('cart'));

    const avgSearch = searchMetrics.length > 0 
      ? searchMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / searchMetrics.length
      : stats.averageApiResponseTime;

    const avgTab = tabMetrics.length > 0
      ? tabMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / tabMetrics.length  
      : stats.averageUserInteractionTime;

    const avgCart = cartMetrics.length > 0
      ? cartMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / cartMetrics.length
      : stats.averageUserInteractionTime;

    return {
      avgSearch: Math.round(avgSearch),
      avgTab: Math.round(avgTab),
      avgCart: Math.round(avgCart),
      slowOpsCount: stats.slowOperations.length,
    };
  }, [stats]);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!enabled || !isVisible) {
    return null;
  }

  // Minimized view - just key metrics
  if (isMinimized) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(derivedMetrics.avgSearch, PERFORMANCE_GOALS.search)}
                  <span className={getStatusColor(derivedMetrics.avgSearch, PERFORMANCE_GOALS.search)}>
                    {derivedMetrics.avgSearch}ms
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {getStatusIcon(currentFrameRate, PERFORMANCE_GOALS.frameRate, true)}
                  <span className={getStatusColor(currentFrameRate, PERFORMANCE_GOALS.frameRate, true)}>
                    {currentFrameRate}fps
                  </span>
                </div>
                
                {stats.memoryUsage && (
                  <div className="flex items-center space-x-1">
                    <MemoryStick className="h-3 w-3 text-purple-500" />
                    <span className="text-purple-600">
                      {stats.memoryUsage.toFixed(1)}MB
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expanded view - detailed metrics
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border w-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Performance Monitor</span>
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearMetrics}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                title="Clear metrics"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                title="Minimize"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                title="Hide"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Technical Goals Status */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Technical Goals</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Search Performance */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(derivedMetrics.avgSearch, PERFORMANCE_GOALS.search)}
                  <span>Search</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(derivedMetrics.avgSearch, PERFORMANCE_GOALS.search)}>
                    {derivedMetrics.avgSearch}ms
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {'<'}200ms
                  </Badge>
                </div>
              </div>
              
              {/* Tab Switch Performance */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(derivedMetrics.avgTab, PERFORMANCE_GOALS.tabSwitch)}
                  <span>Tab Switch</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(derivedMetrics.avgTab, PERFORMANCE_GOALS.tabSwitch)}>
                    {derivedMetrics.avgTab}ms
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {'<'}100ms
                  </Badge>
                </div>
              </div>
              
              {/* Cart Operations Performance */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(derivedMetrics.avgCart, PERFORMANCE_GOALS.cartOp)}
                  <span>Cart Ops</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(derivedMetrics.avgCart, PERFORMANCE_GOALS.cartOp)}>
                    {derivedMetrics.avgCart}ms
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {'<'}50ms
                  </Badge>
                </div>
              </div>
              
              {/* Frame Rate */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(currentFrameRate, PERFORMANCE_GOALS.frameRate, true)}
                  <span>Frame Rate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(currentFrameRate, PERFORMANCE_GOALS.frameRate, true)}>
                    {currentFrameRate}fps
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    60fps
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* System Metrics */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
              <MemoryStick className="h-3 w-3" />
              <span>System Metrics</span>
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">
                  {stats.memoryUsage ? `${stats.memoryUsage.toFixed(1)} MB` : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Metrics</span>
                <span className="font-medium">{stats.totalMetrics}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Slow Operations</span>
                <Badge variant={derivedMetrics.slowOpsCount > 5 ? "destructive" : "secondary"} className="text-xs px-2 py-0">
                  {derivedMetrics.slowOpsCount}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Averages */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Averages</span>
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Render Time</span>
                <span className="font-medium">{stats.averageRenderTime.toFixed(1)}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Response</span>
                <span className="font-medium">{stats.averageApiResponseTime.toFixed(1)}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">User Interaction</span>
                <span className="font-medium">{stats.averageUserInteractionTime.toFixed(1)}ms</span>
              </div>
            </div>
          </div>

          {/* Recent Slow Operations */}
          {stats.slowOperations.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span>Recent Slow Ops</span>
                </h4>
                
                <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                  {stats.slowOperations.slice(-3).map((op, index) => (
                    <div key={index} className="flex items-center justify-between p-1 bg-orange-50 rounded text-orange-800">
                      <span className="truncate flex-1 mr-2" title={op.name}>
                        {op.name}
                      </span>
                      <span className="font-medium">
                        {op.duration?.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Performance Tips */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            💡 <strong>Tips:</strong> Search {'<'}200ms, Tabs {'<'}100ms, Cart {'<'}50ms, 60fps target
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to show/hide performance overlay with keyboard shortcut
export function usePerformanceOverlayControl() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + P to toggle performance overlay
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsEnabled(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    isEnabled,
    setIsEnabled,
    toggle: () => setIsEnabled(prev => !prev),
  };
}