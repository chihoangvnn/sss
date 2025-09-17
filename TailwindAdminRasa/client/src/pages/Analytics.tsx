import { RevenueChart } from "@/components/RevenueChart";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-8 p-6" data-testid="page-analytics">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo & Phân tích</h1>
        <p className="text-muted-foreground">
          Phân tích chi tiết về hiệu suất kinh doanh và xu hướng thị trường
        </p>
      </div>

      <DashboardStats />
      
      <div className="grid gap-6 lg:grid-cols-1">
        <RevenueChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Phân tích khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Biểu đồ phân tích khách hàng sẽ được phát triển trong giai đoạn tiếp theo
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Xu hướng sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Phân tích xu hướng sản phẩm bán chạy sẽ được bổ sung
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}