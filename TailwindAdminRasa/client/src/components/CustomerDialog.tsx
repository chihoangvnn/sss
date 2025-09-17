import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { CustomerForm } from "./CustomerForm";
import { type Customer, type InsertCustomer } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null | undefined;
  mode: "add" | "edit";
}

export function CustomerDialog({ open, onOpenChange, customer, mode }: CustomerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Thành công",
        description: "Khách hàng đã được thêm thành công",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Create customer error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm khách hàng",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      if (!customer?.id) throw new Error("Customer ID is required");
      const response = await apiRequest("PUT", `/api/customers/${customer.id}`, data);
      return response.json();
    },
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer?.id] });
      toast({
        title: "Thành công",
        description: "Thông tin khách hàng đã được cập nhật",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Update customer error:", error);
      toast({
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật thông tin khách hàng",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InsertCustomer) => {
    if (mode === "add") {
      await createCustomerMutation.mutateAsync(data);
    } else {
      await updateCustomerMutation.mutateAsync(data);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isLoading = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="customer-dialog">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm khách hàng mới" : "Chỉnh sửa khách hàng"}
          </DialogTitle>
        </DialogHeader>
        <CustomerForm
          customer={customer || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog Component
interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCustomerDialog({ 
  open, 
  onOpenChange, 
  customer, 
  onConfirm, 
  isLoading = false 
}: DeleteCustomerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="delete-customer-dialog">
        <DialogHeader>
          <DialogTitle className="text-destructive">Xác nhận xóa khách hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa khách hàng này không?
            </p>
            {customer && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold" data-testid="delete-customer-name">
                  {customer.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customer.email}
                </p>
                {customer.phone && (
                  <p className="text-sm text-muted-foreground">
                    {customer.phone}
                  </p>
                )}
              </div>
            )}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cảnh báo
              </p>
              <p className="text-sm text-destructive/90 mt-1">
                Hành động này sẽ xóa vĩnh viễn khách hàng và tất cả đơn hàng liên quan. 
                Không thể hoàn tác.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel-delete"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              data-testid="button-confirm-delete"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Đang xóa...
                </>
              ) : (
                "Xóa khách hàng"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}