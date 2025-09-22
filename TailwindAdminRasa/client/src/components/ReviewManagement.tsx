import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, StarHalf, User, Calendar, MessageSquare, Eye, Trash2, Check, X,
  Settings, RefreshCw, Plus, Download, Upload, Filter, Search, ChevronDown,
  Bot, Wand2, AlertTriangle, CheckCircle2, Clock, Users, BarChart3,
  MoreHorizontal, Sparkles, ShoppingBag, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryName?: string;
}

interface Review {
  id: string;
  productId: string;
  productName?: string;
  customerId?: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface ReviewStatistics {
  total: number;
  approved: number;
  pending: number;
  avgRating: number;
  ratingDistribution: {
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
}

interface SeedingPreview {
  customerName: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  helpfulCount: number;
}

export function ReviewManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for filtering and pagination
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // State for bulk actions
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // State for AI seeding
  const [showSeedingModal, setShowSeedingModal] = useState(false);
  const [seedingProductId, setSeedingProductId] = useState<string>('');
  const [seedingQuantity, setSeedingQuantity] = useState(10);
  const [seedingCustomPrompt, setSeedingCustomPrompt] = useState('');
  const [seedingAutoApprove, setSeedingAutoApprove] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState({
    star5: 45, // 45%
    star4: 35, // 35%
    star3: 15, // 15%
    star2: 4,  // 4%
    star1: 1   // 1%
  });

  // State for preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<SeedingPreview[]>([]);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-reviews'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json() as Product[];
    },
  });

  // Fetch reviews with filters
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['admin-reviews', selectedProductId, selectedRating, selectedApprovalStatus, searchQuery, currentPage, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProductId !== 'all') params.append('productId', selectedProductId);
      if (selectedRating !== 'all') params.append('rating', selectedRating);
      if (selectedApprovalStatus !== 'all') params.append('approvalStatus', selectedApprovalStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const url = `/api/admin/reviews?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json();
    },
  });

  const reviews: Review[] = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;
  const statistics: ReviewStatistics = reviewsData?.statistics;

  // AI Seeding mutation
  const seedReviewsMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      quantity: number;
      ratingDistribution: any;
      customPrompt?: string;
      autoApprove: boolean;
    }) => {
      const response = await fetch('/api/review-seeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to seed reviews');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setShowSeedingModal(false);
      resetSeedingForm();
      toast({
        title: "🤖 AI Seeding thành công!",
        description: `Đã tạo ${data.saved} reviews cho sản phẩm "${data.productName}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi AI Seeding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/review-seeding/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate preview');
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data.reviews);
      setShowPreviewModal(true);
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi preview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: "✅ Cập nhật thành công",
        description: "Review đã được cập nhật",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: "🗑️ Đã xóa",
        description: "Review đã được xóa thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi xóa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const response = await fetch('/api/admin/reviews/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds }),
      });
      if (!response.ok) throw new Error('Failed to bulk approve');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReviews(new Set());
      setSelectAll(false);
      toast({
        title: "✅ Bulk approve thành công",
        description: `Đã duyệt ${data.updated} reviews`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi bulk approve",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (data: { reviewIds?: string[]; productId?: string; filterBy?: any }) => {
      const response = await fetch('/api/admin/reviews/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to bulk delete');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReviews(new Set());
      setSelectAll(false);
      toast({
        title: "🗑️ Bulk delete thành công",
        description: `Đã xóa ${data.deleted} reviews`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Lỗi bulk delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetSeedingForm = () => {
    setSeedingProductId('');
    setSeedingQuantity(10);
    setSeedingCustomPrompt('');
    setSeedingAutoApprove(false);
    setRatingDistribution({ star5: 45, star4: 35, star3: 15, star2: 4, star1: 1 });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedReviews(new Set(reviews.map(r => r.id)));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleSelectReview = (reviewId: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (checked) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
    setSelectAll(newSelected.size === reviews.length);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Quản lý Reviews
            </h1>
            <p className="text-muted-foreground mt-2">
              AI Seeding và quản lý đánh giá sản phẩm thông minh
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowSeedingModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Seeding
            </Button>
            <Button variant="outline" onClick={() => refetchReviews()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Reviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.approved} đã duyệt, {statistics.pending} chờ duyệt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Điểm TB</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.avgRating}/5</div>
                <div className="flex items-center mt-1">
                  {renderStars(statistics.avgRating)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ duyệt</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.total > 0 ? Math.round((statistics.approved / statistics.total) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics.approved}/{statistics.total} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">5 sao</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.ratingDistribution.star5}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.total > 0 ? Math.round((statistics.ratingDistribution.star5 / statistics.total) * 100) : 0}% tổng reviews
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Sản phẩm</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Đánh giá</Label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đánh giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả đánh giá</SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} sao
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={selectedApprovalStatus} onValueChange={setSelectedApprovalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, nội dung..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedReviews.size > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {selectedReviews.size} reviews đã chọn
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReviews(new Set())}>
                    Bỏ chọn tất cả
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => bulkApproveMutation.mutate(Array.from(selectedReviews))}
                    disabled={bulkApproveMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Duyệt tất cả
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa tất cả
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa {selectedReviews.size} reviews đã chọn? 
                          Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => bulkDeleteMutation.mutate({ reviewIds: Array.from(selectedReviews) })}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Reviews</CardTitle>
                <CardDescription>
                  {pagination && `Trang ${pagination.page}/${pagination.pages} - ${pagination.total} reviews`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm text-muted-foreground">
                  Chọn tất cả
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Đang tải reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không có reviews nào phù hợp với bộ lọc</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedReviews.has(review.id)}
                          onCheckedChange={(checked) => handleSelectReview(review.id, checked as boolean)}
                        />
                        
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{review.customerName}</span>
                                {review.isVerified && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Đã xác thực
                                  </Badge>
                                )}
                                {!review.customerId && (
                                  <Badge variant="outline" className="border-blue-200 text-blue-600">
                                    <Bot className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={review.isApproved ? "default" : "secondary"}>
                                {review.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                              </Badge>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc muốn xóa review này? Hành động này không thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteReviewMutation.mutate(review.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {/* Product & Rating */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4" />
                              <span>{review.productName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                              <span className="ml-1">{review.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>

                          {/* Title */}
                          {review.title && (
                            <h4 className="font-medium text-base">{review.title}</h4>
                          )}

                          {/* Content */}
                          <p className="text-muted-foreground leading-relaxed">
                            {review.content}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{review.helpfulCount} lượt hữu ích</span>
                            </div>
                            
                            <div className="flex gap-2">
                              {!review.isApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => updateReviewMutation.mutate({
                                    id: review.id,
                                    data: { isApproved: true }
                                  })}
                                  disabled={updateReviewMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Duyệt
                                </Button>
                              )}
                              
                              {review.isApproved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReviewMutation.mutate({
                                    id: review.id,
                                    data: { isApproved: false }
                                  })}
                                  disabled={updateReviewMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Hủy duyệt
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                  trong tổng {pagination.total} reviews
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={!pagination.hasNext}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Seeding Modal */}
        <Dialog open={showSeedingModal} onOpenChange={setShowSeedingModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                AI Review Seeding
              </DialogTitle>
              <DialogDescription>
                Tạo reviews thông minh bằng AI cho sản phẩm với phân bố đánh giá tự nhiên
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Chọn sản phẩm *</Label>
                <Select value={seedingProductId} onValueChange={setSeedingProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm để seed reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {product.categoryName} • {product.price.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Số lượng reviews (1-50)</Label>
                <div className="space-y-3">
                  <Slider
                    value={[seedingQuantity]}
                    onValueChange={(value) => setSeedingQuantity(value[0])}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{seedingQuantity} reviews</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                <Label>Phân bố đánh giá (%)</Label>
                <div className="grid grid-cols-5 gap-3">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const key = `star${stars}` as keyof typeof ratingDistribution;
                    return (
                      <div key={stars} className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{stars}</span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={ratingDistribution[key]}
                          onChange={(e) => setRatingDistribution(prev => ({
                            ...prev,
                            [key]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                          }))}
                          className="text-center"
                        />
                        <div className="text-xs text-center text-muted-foreground">
                          ~{Math.round((ratingDistribution[key] / 100) * seedingQuantity)} reviews
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tổng: {Object.values(ratingDistribution).reduce((a, b) => a + b, 0)}%
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label>Prompt tùy chỉnh (tùy chọn)</Label>
                <Textarea
                  placeholder="Ví dụ: Tập trung vào chất lượng sản phẩm và dịch vụ giao hàng..."
                  value={seedingCustomPrompt}
                  onChange={(e) => setSeedingCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Auto Approve */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-approve"
                  checked={seedingAutoApprove}
                  onCheckedChange={setSeedingAutoApprove}
                />
                <Label htmlFor="auto-approve">
                  Tự động duyệt reviews sau khi tạo
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!seedingProductId) {
                    toast({
                      title: "❌ Lỗi",
                      description: "Vui lòng chọn sản phẩm",
                      variant: "destructive",
                    });
                    return;
                  }
                  previewMutation.mutate({
                    productId: seedingProductId,
                    quantity: Math.min(3, seedingQuantity),
                    ratingDistribution,
                    customPrompt: seedingCustomPrompt
                  });
                }}
                disabled={previewMutation.isPending}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMutation.isPending ? 'Đang tạo...' : 'Xem trước'}
              </Button>
              
              <Button
                onClick={() => {
                  if (!seedingProductId) {
                    toast({
                      title: "❌ Lỗi",
                      description: "Vui lòng chọn sản phẩm",
                      variant: "destructive",
                    });
                    return;
                  }
                  const total = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
                  if (total !== 100) {
                    toast({
                      title: "❌ Lỗi",
                      description: "Tổng phân bố đánh giá phải bằng 100%",
                      variant: "destructive",
                    });
                    return;
                  }
                  seedReviewsMutation.mutate({
                    productId: seedingProductId,
                    quantity: seedingQuantity,
                    ratingDistribution,
                    customPrompt: seedingCustomPrompt,
                    autoApprove: seedingAutoApprove
                  });
                }}
                disabled={seedReviewsMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {seedReviewsMutation.isPending ? 'Đang tạo...' : 'Bắt đầu Seeding'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Xem trước AI Reviews</DialogTitle>
              <DialogDescription>
                Dưới đây là mẫu reviews mà AI sẽ tạo ra
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {previewData.map((preview, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{preview.customerName}</span>
                          {preview.isVerified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Đã xác thực
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(preview.rating)}
                          <span className="ml-1 font-medium">{preview.rating}/5</span>
                        </div>
                      </div>

                      {preview.title && (
                        <h4 className="font-medium">{preview.title}</h4>
                      )}

                      <p className="text-muted-foreground">
                        {preview.content}
                      </p>

                      <div className="text-sm text-muted-foreground">
                        {preview.helpfulCount} lượt hữu ích
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}