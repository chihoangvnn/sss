import { OrderTable } from "@/components/OrderTable";

export default function Orders() {
  return (
    <div className="p-6" data-testid="page-orders">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">
          Theo dõi và xử lý các đơn hàng từ khách hàng
        </p>
      </div>
      <OrderTable />
    </div>
  );
}