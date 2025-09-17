import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Edit3, Trash2, Copy, BarChart3, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface ProductLandingPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  productId: string;
  customPrice?: number;
  heroTitle?: string;
  isActive: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  contactInfo: {
    phone: string;
    email?: string;
    businessName?: string;
  };
  paymentMethods: {
    cod: boolean;
    bankTransfer: boolean;
    online: boolean;
  };
  features: string[];
  viewCount: number;
  orderCount: number;
  conversionRate: number;
}

export default function ProductLandingPageManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all product landing pages
  const { data: landingPages = [], isLoading, refetch } = useQuery<ProductLandingPage[]>({
    queryKey: ['/api/product-landing-pages'],
  });

  // Delete landing page mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product-landing-pages/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Landing page đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-landing-pages'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa landing page",
        variant: "destructive",
      });
    },
  });

  const copyLandingPageUrl = (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Đã sao chép",
      description: "Link landing page đã được sao chép",
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa landing page "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Landing Page</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý landing page riêng biệt cho từng sản phẩm
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
            <BarChart3 className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Link href="/landing-page-editor">
            <Button data-testid="button-create-landing">
              <Plus className="h-4 w-4 mr-2" />
              Tạo Landing Page
            </Button>
          </Link>
        </div>
      </div>

      {landingPages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Chưa có Landing Page nào</h3>
            <p className="text-muted-foreground mb-4">
              Tạo landing page đầu tiên để bắt đầu bán hàng với link riêng biệt
            </p>
            <Link href="/landing-page-editor">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Landing Page đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingPages.map((page) => (
            <Card key={page.id} className="hover-elevate" data-testid={`card-landing-${page.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={page.isActive ? "default" : "secondary"}>
                    {page.isActive ? "Đang hoạt động" : "Tạm dừng"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLandingPageUrl(page.slug)}
                      data-testid={`button-copy-${page.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
                      data-testid={`button-preview-${page.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{page.title}</CardTitle>
                {page.description && (
                  <CardDescription className="line-clamp-2">
                    {page.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{page.viewCount}</div>
                    <div className="text-xs text-muted-foreground">Lượt xem</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{page.orderCount}</div>
                    <div className="text-xs text-muted-foreground">Đơn hàng</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{page.conversionRate}%</div>
                    <div className="text-xs text-muted-foreground">Tỷ lệ chuyển đổi</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Link:</span>
                    <span className="font-mono text-xs truncate">/lp/{page.slug}</span>
                  </div>
                  {page.customPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá:</span>
                      <span className="font-semibold">{page.customPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Liên hệ:</span>
                    <span>{page.contactInfo.phone}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {page.paymentMethods.cod && (
                    <Badge variant="outline" className="text-xs">COD</Badge>
                  )}
                  {page.paymentMethods.bankTransfer && (
                    <Badge variant="outline" className="text-xs">Chuyển khoản</Badge>
                  )}
                  {page.paymentMethods.online && (
                    <Badge variant="outline" className="text-xs">Thanh toán online</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/landing-page-editor/${page.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-${page.id}`}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
                    data-testid={`button-view-${page.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${page.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Landing Page URL Pattern Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin về Link Landing Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Cấu trúc URL:</strong> {window.location.origin}/lp/[slug]</p>
            <p><strong>Ví dụ:</strong> {window.location.origin}/lp/iphone-15-promotion</p>
            <p className="text-muted-foreground">
              Slug là phần định danh duy nhất cho mỗi landing page. Sử dụng để chạy ads và chia sẻ với khách hàng.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}