import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type InsertCustomer, type Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Upload, X } from "lucide-react";
import { z } from "zod";

// Form schema that extends the base insert schema with additional validation
const customerFormSchema = insertCustomerSchema.extend({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Vietnamese phone number validation
    return /^(\+84|0)[3-9][0-9]{8}$/.test(val);
  }, "Số điện thoại không hợp lệ")
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: InsertCustomer) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "add" | "edit";
}

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
};

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: CustomerFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(customer?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      status: customer?.status || "active",
      avatar: customer?.avatar || undefined,
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        form.setError("avatar", { message: "Ảnh phải nhỏ hơn 2MB" });
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        form.setError("avatar", { message: "Vui lòng chọn file ảnh" });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        form.setValue("avatar", result);
        form.clearErrors("avatar");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    form.setValue("avatar", undefined);
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      const submitData: InsertCustomer = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        status: data.status,
        avatar: avatarPreview || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="space-y-6" data-testid="customer-form">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === "add" ? "Thêm khách hàng mới" : "Chỉnh sửa khách hàng"}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-lg">
                  {form.watch("name") ? getInitials(form.watch("name")) : "KH"}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveAvatar}
                  data-testid="button-remove-avatar"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatar-input")?.click()}
                data-testid="button-upload-avatar"
              >
                <Upload className="h-4 w-4 mr-2" />
                {avatarPreview ? "Thay đổi ảnh" : "Tải ảnh lên"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Mock taking photo - in real app would open camera
                  const mockImageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${form.watch("name")}`;
                  setAvatarPreview(mockImageUrl);
                  form.setValue("avatar", mockImageUrl);
                }}
                data-testid="button-take-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                Chụp ảnh
              </Button>
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {form.formState.errors.avatar && (
              <p className="text-sm text-destructive">{form.formState.errors.avatar.message}</p>
            )}
          </div>

          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên khách hàng <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nhập tên đầy đủ"
                    data-testid="input-customer-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    data-testid="input-customer-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Field */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0901234567"
                    data-testid="input-customer-phone"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status Field */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer-status">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {mode === "add" ? "Đang thêm..." : "Đang cập nhật..."}
                </>
              ) : (
                mode === "add" ? "Thêm khách hàng" : "Cập nhật"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}