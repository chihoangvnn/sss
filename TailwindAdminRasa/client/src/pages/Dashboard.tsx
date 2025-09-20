import { useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { RevenueChart } from "@/components/RevenueChart";
import { OrderTable } from "@/components/OrderTable";
import { ProfessionalDashboard } from "@/components/ProfessionalDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Zap } from "lucide-react";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("classic");

  return (
    <div className="space-y-6 p-6" data-testid="page-dashboard">
      {/* Dashboard Toggle */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Theo dõi hiệu suất kinh doanh và quản lý mạng xã hội
            </p>
          </div>
          <TabsList className="grid w-64 grid-cols-2">
            <TabsTrigger value="classic" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Kinh doanh
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Social Media
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="classic" className="space-y-8 mt-6">
          <DashboardStats />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <div className="space-y-6">
              <OrderTable />
            </div>
          </div>

        </TabsContent>

        <TabsContent value="professional" className="mt-6">
          <ProfessionalDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}