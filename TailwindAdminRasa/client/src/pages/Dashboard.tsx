import { DashboardStats } from "@/components/DashboardStats";
import { RevenueChart } from "@/components/RevenueChart";
import { OrderTable } from "@/components/OrderTable";
import { SocialMediaPanel } from "@/components/SocialMediaPanel";

export default function Dashboard() {
  return (
    <div className="space-y-8 p-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-3xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground">
          Theo dõi hiệu suất kinh doanh và các chỉ số quan trọng
        </p>
      </div>

      <DashboardStats />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <div className="space-y-6">
          <OrderTable />
        </div>
      </div>

      <SocialMediaPanel />
    </div>
  );
}