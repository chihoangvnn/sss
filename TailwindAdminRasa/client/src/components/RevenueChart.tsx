import { TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data?: RevenueData[];
  title?: string;
  description?: string;
}

// TODO: remove mock data
const mockData: RevenueData[] = [
  { month: "T1", revenue: 45000000, orders: 120 },
  { month: "T2", revenue: 52000000, orders: 145 },
  { month: "T3", revenue: 48000000, orders: 132 },
  { month: "T4", revenue: 61000000, orders: 167 },
  { month: "T5", revenue: 55000000, orders: 153 },
  { month: "T6", revenue: 67000000, orders: 189 },
  { month: "T7", revenue: 59000000, orders: 164 },
  { month: "T8", revenue: 72000000, orders: 198 },
  { month: "T9", revenue: 65000000, orders: 176 },
  { month: "T10", revenue: 78000000, orders: 212 },
  { month: "T11", revenue: 71000000, orders: 195 },
  { month: "T12", revenue: 85000000, orders: 230 },
];

const formatRevenue = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 min-w-[180px]">
        <p className="font-semibold text-foreground/90 mb-2">{`Tháng ${label}`}</p>
        <div className="space-y-1">
          <p className="text-[hsl(var(--activity-teal))] font-bold">
            {formatRevenue(payload[0].value)}
          </p>
          <p className="text-foreground/60 text-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-[hsl(var(--activity-pink))] rounded-full"></span>
            {`${payload[0].payload.orders} đơn hàng`}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ 
  data = mockData, 
  title = "Doanh thu theo tháng",
  description = "Biểu đồ thể hiện xu hướng doanh thu trong 12 tháng gần nhất"
}: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgMonthlyRevenue = totalRevenue / data.length;
  const lastMonthRevenue = data[data.length - 1]?.revenue || 0;
  const previousMonthRevenue = data[data.length - 2]?.revenue || 0;
  const growthRate = previousMonthRevenue > 0 
    ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
    : "0";

  return (
    <Card data-testid="revenue-chart" className="activity-card relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--activity-teal))]/5 via-transparent to-[hsl(var(--activity-mint))]/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          {/* Left side - Title and description */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[hsl(var(--activity-teal))]/10 text-[hsl(var(--activity-teal))]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground/90">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-foreground/60 mt-1">
                  {description}
                </CardDescription>
              </div>
            </div>
          </div>
          
          {/* Right side - Key metrics with gradient */}
          <div className="text-right space-y-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[hsl(var(--activity-teal))]/10 to-[hsl(var(--activity-mint))]/5 border border-[hsl(var(--activity-teal))]/20">
              <p className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--activity-teal))] to-[hsl(var(--activity-mint))] bg-clip-text text-transparent" data-testid="total-revenue">
                {formatRevenue(totalRevenue)}
              </p>
              <p className="text-xs text-foreground/60 font-medium">Tổng doanh thu</p>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <div className={`w-2 h-2 rounded-full ${Number(growthRate) >= 0 ? 'bg-[hsl(var(--activity-mint))]' : 'bg-[hsl(var(--activity-coral))]/80'}`} />
                <p className={`text-xs font-semibold ${Number(growthRate) >= 0 ? 'text-[hsl(var(--activity-mint))]' : 'text-[hsl(var(--activity-coral))]/80'}`}>
                  {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--activity-teal))" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="hsl(var(--activity-teal))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--activity-mint))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--activity-teal))" />
                  <stop offset="100%" stopColor="hsl(var(--activity-mint))" />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatRevenue}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="url(#strokeGradient)"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Modern Activity Manager Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-[hsl(var(--activity-teal))]/5 to-[hsl(var(--activity-teal))]/10 border border-[hsl(var(--activity-teal))]/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--activity-teal))]/20">
                <Target className="h-3 w-3 text-[hsl(var(--activity-teal))]" />
              </div>
              <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Trung bình</p>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--activity-teal))]" data-testid="avg-monthly-revenue">
              {formatRevenue(avgMonthlyRevenue)}
            </p>
            <p className="text-xs text-foreground/50 mt-1">Mỗi tháng</p>
          </div>
          
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-[hsl(var(--activity-pink))]/5 to-[hsl(var(--activity-pink))]/10 border border-[hsl(var(--activity-pink))]/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--activity-pink))]/20">
                <DollarSign className="h-3 w-3 text-[hsl(var(--activity-pink))]" />
              </div>
              <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Hiện tại</p>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--activity-pink))]" data-testid="last-month-revenue">
              {formatRevenue(lastMonthRevenue)}
            </p>
            <p className="text-xs text-foreground/50 mt-1">Tháng này</p>
          </div>
          
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-[hsl(var(--activity-purple))]/5 to-[hsl(var(--activity-purple))]/10 border border-[hsl(var(--activity-purple))]/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--activity-purple))]/20">
                <BarChart3 className="h-3 w-3 text-[hsl(var(--activity-purple))]" />
              </div>
              <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Đơn hàng</p>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--activity-purple))]">
              {data.reduce((sum, item) => sum + item.orders, 0)}
            </p>
            <p className="text-xs text-foreground/50 mt-1">Tổng số</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}