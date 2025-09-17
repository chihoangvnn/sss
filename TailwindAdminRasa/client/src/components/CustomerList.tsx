import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MoreHorizontal, UserPlus, Filter, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomerDialog, DeleteCustomerDialog } from "./CustomerDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Customer as BaseCustomer } from "@shared/schema";

// Extend the base Customer type to include additional stats fields from API
export interface Customer extends BaseCustomer {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface CustomerListProps {
  onViewCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="default">Hoạt động</Badge>;
    case "inactive":
      return <Badge variant="secondary">Không hoạt động</Badge>;
    case "vip":
      return <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>;
    default:
      return <Badge variant="secondary">Không xác định</Badge>;
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
};

export function CustomerList({ 
  onViewCustomer, 
  onEditCustomer 
}: CustomerListProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerDialog, setCustomerDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    customer?: Customer | null;
  }>({ open: false, mode: "add", customer: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({ open: false, customer: null });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Thành công",
        description: "Khách hàng đã được xóa thành công",
      });
      setDeleteDialog({ open: false, customer: null });
    },
    onError: (error: any) => {
      console.error("Delete customer error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa khách hàng",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone || "").includes(searchTerm);
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCustomerAction = (action: string, customer: Customer) => {
    console.log(`${action} triggered for customer:`, customer.name);
    switch (action) {
      case "view":
        setLocation(`/customers/${customer.id}`);
        break;
      case "edit":
        setCustomerDialog({ open: true, mode: "edit", customer });
        break;
      case "delete":
        setDeleteDialog({ open: true, customer });
        break;
      case "email":
        console.log(`Email customer: ${customer.email}`);
        // In a real app, would open email client or send email
        break;
      case "call":
        console.log(`Call customer: ${customer.phone}`);
        // In a real app, would initiate phone call
        break;
    }
  };

  const handleAddCustomer = () => {
    setCustomerDialog({ open: true, mode: "add", customer: null });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.customer) {
      deleteCustomerMutation.mutate(deleteDialog.customer.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="customer-list-loading">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Khách hàng</h2>
            <p className="text-muted-foreground">Quản lý thông tin khách hàng</p>
          </div>
          <Button data-testid="button-add-customer" onClick={handleAddCustomer}>
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm khách hàng
          </Button>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-16 mx-auto mb-1" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" data-testid="customer-list-error">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Khách hàng</h2>
            <p className="text-muted-foreground">Quản lý thông tin khách hàng</p>
          </div>
          <Button data-testid="button-add-customer" onClick={handleAddCustomer}>
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm khách hàng
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Không thể tải danh sách khách hàng</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="customer-list">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Khách hàng</h2>
          <p className="text-muted-foreground">Quản lý thông tin khách hàng</p>
        </div>
        <Button data-testid="button-add-customer" onClick={handleAddCustomer}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-filter-status">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter === "all" ? "Tất cả trạng thái" : getStatusBadge(statusFilter).props.children}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              Tất cả trạng thái
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
              Hoạt động
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
              Không hoạt động
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("vip")}>
              VIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Customer Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover-elevate" data-testid={`customer-card-${customer.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold" data-testid={`customer-name-${customer.id}`}>
                      {customer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                </div>
                {getStatusBadge(customer.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold" data-testid={`customer-orders-${customer.id}`}>
                    {customer.totalOrders}
                  </p>
                  <p className="text-xs text-muted-foreground">Đơn hàng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600" data-testid={`customer-spent-${customer.id}`}>
                    {formatPrice(customer.totalSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground">Đã mua</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn gần nhất:</span>
                  <span data-testid={`customer-last-order-${customer.id}`}>
                    {formatDate(customer.lastOrderDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tham gia:</span>
                  <span>{customer.joinDate ? formatDate(new Date(customer.joinDate).toISOString()) : "Chưa rõ"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleCustomerAction("view", customer)}
                  data-testid={`button-view-${customer.id}`}
                >
                  Xem chi tiết
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-actions-${customer.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleCustomerAction("edit", customer)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleCustomerAction("email", customer)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Gửi email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCustomerAction("call", customer)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Gọi điện
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleCustomerAction("delete", customer)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa khách hàng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy khách hàng nào.</p>
        </div>
      )}
      
      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialog.open}
        onOpenChange={(open) => 
          setCustomerDialog({ open, mode: customerDialog.mode, customer: customerDialog.customer })
        }
        customer={customerDialog.customer}
        mode={customerDialog.mode}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteCustomerDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, customer: deleteDialog.customer })}
        customer={deleteDialog.customer}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteCustomerMutation.isPending}
      />
    </div>
  );
}