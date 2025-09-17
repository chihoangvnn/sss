import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
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

export function DashboardStats() {
  const { data: stats, isLoading, error } = useQuery<DashboardStatsData>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        <Card className="col-span-4">
          <CardContent className="pt-6">
            <p className="text-destructive">Không thể tải dữ liệu thống kê</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: "Tổng doanh thu",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: "+12%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Đơn hàng",
      value: (stats?.totalOrders || 0).toString(),
      change: "+8%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Khách hàng",
      value: (stats?.totalCustomers || 0).toString(),
      change: "+5%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Sản phẩm",
      value: (stats?.totalProducts || 0).toString(),
      change: "+15%",
      trend: "up",
      icon: Package,
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
        const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600";
        
        return (
          <Card key={index} className="hover-elevate" data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${trendColor}`}
                  data-testid={`stat-change-${index}`}
                >
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground ml-1">từ tháng trước</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}