import { CustomerList } from "@/components/CustomerList";

export default function Customers() {
  return (
    <div className="p-6" data-testid="page-customers">
      <CustomerList />
    </div>
  );
}