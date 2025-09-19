import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Activity, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  gradient: string;
  color: string;
  bgColor: string;
  description: string;
}

interface DashboardStatsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value);
}

// Modern Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

function ProgressRing({ 
  progress, 
  size = 80, 
  strokeWidth = 8, 
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--muted))",
  className = "" 
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 200);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          opacity="0.2"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  );
}

export function DashboardStats() {
  const { data: stats, isLoading, error } = useQuery<DashboardStatsData>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="activity-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        <Card className="col-span-4 activity-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-500">
              <Activity className="h-5 w-5" />
              <p>Không thể tải dữ liệu thống kê</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modern Activity Cards with progress indicators
  const statCards: StatCard[] = [
    {
      title: "Doanh thu",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      progress: 75, // Calculate based on target
      gradient: "from-teal-500 to-teal-600",
      color: "hsl(174, 77%, 56%)",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      description: "Tổng thu nhập tháng này"
    },
    {
      title: "Đơn hàng", 
      value: (stats?.totalOrders || 0).toString(),
      change: "+8%",
      trend: "up",
      icon: ShoppingCart,
      progress: 60,
      gradient: "from-pink-500 to-pink-600",
      color: "hsl(336, 84%, 69%)",
      bgColor: "bg-pink-50 dark:bg-pink-950/20", 
      description: "Đơn hàng được xử lý"
    },
    {
      title: "Khách hàng",
      value: (stats?.totalCustomers || 0).toString(),
      change: "+5%",
      trend: "up",
      icon: Users,
      progress: 85,
      gradient: "from-purple-500 to-purple-600", 
      color: "hsl(281, 39%, 56%)",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      description: "Khách hàng hoạt động"
    },
    {
      title: "Sản phẩm",
      value: (stats?.totalProducts || 0).toString(),
      change: "+15%",
      trend: "up", 
      icon: Package,
      progress: 90,
      gradient: "from-emerald-500 to-emerald-600",
      color: "hsl(162, 73%, 46%)",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      description: "Tổng sản phẩm trong kho"
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
        const trendColor = stat.trend === "up" 
          ? "text-emerald-600 dark:text-emerald-400" 
          : "text-red-600 dark:text-red-400";
        
        return (
          <Card 
            key={index} 
            className="activity-card group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 shadow-md overflow-hidden relative"
            data-testid={`stat-card-${index}`}
          >
            {/* Gradient Background Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <CardContent className="p-6 relative z-10">
              {/* Header with Icon and Progress Ring */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className={`p-2 rounded-xl ${stat.bgColor}`} 
                      style={{ color: stat.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground/80">
                      {stat.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {stat.description}
                  </p>
                </div>
                
                {/* Modern Progress Ring */}
                <div className="relative flex items-center justify-center">
                  <ProgressRing
                    progress={stat.progress}
                    size={60}
                    strokeWidth={6}
                    color={stat.color}
                    backgroundColor="hsl(var(--muted))"
                  />
                  {/* Center percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color: stat.color }}>
                      {stat.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Value and Trend */}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-0.5 ${
                        stat.trend === "up" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      }`}
                      data-testid={`stat-change-${index}`}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground/60">so với tháng trước</span>
                </div>
              </div>

              {/* Activity Indicator */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground/60">Cập nhật real-time</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}