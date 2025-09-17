import { TrendingUp } from "lucide-react";
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
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{`Tháng ${label}`}</p>
        <p className="text-primary">
          {`Doanh thu: ${formatRevenue(payload[0].value)}`}
        </p>
        <p className="text-muted-foreground text-sm">
          {`${payload[0].payload.orders} đơn hàng`}
        </p>
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
    <Card data-testid="revenue-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" data-testid="total-revenue">
              {formatRevenue(totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
            <p className={`text-sm font-medium ${Number(growthRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(growthRate) >= 0 ? '+' : ''}{growthRate}% so với tháng trước
            </p>
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
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatRevenue}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold" data-testid="avg-monthly-revenue">
              {formatRevenue(avgMonthlyRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Trung bình/tháng</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" data-testid="last-month-revenue">
              {formatRevenue(lastMonthRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Tháng gần nhất</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">
              {data.reduce((sum, item) => sum + item.orders, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}