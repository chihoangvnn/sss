import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Using browser alert for toast notifications (can be upgraded to toast library later)
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

// API Types
interface MembershipTier {
  name: string;
  nameEn: string;
  color: string;
  requiredSpent: number;
  pointsMultiplier: number;
  benefits: string[];
  icon: string;
  key: string;
  isActive?: boolean;
  isUnlocked?: boolean;
  remainingSpent?: number;
  progressPercent?: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  membershipTier: string;
  totalSpent: number;
  pointsBalance: number;
  pointsEarned: number;
  lastTierUpdate: string;
  joinDate: string;
}

interface MembershipDashboard {
  customer: Customer;
  currentTier: MembershipTier;
  nextTier: MembershipTier | null;
  points: {
    balance: number;
    earned: number;
    valueVND: number;
    minRedemption: number;
  };
  allTiers: MembershipTier[];
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function MemberProfile() {
  const queryClient = useQueryClient();
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  // Fetch membership dashboard data
  const { data: dashboard, isLoading, error } = useQuery<MembershipDashboard>({
    queryKey: ['membership', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/membership/dashboard', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch membership data');
      }
      return response.json();
    },
  });

  // Redeem points mutation
  const redeemPointsMutation = useMutation({
    mutationFn: async (data: { pointsToRedeem: number; orderTotal: number }) => {
      const response = await fetch('/api/membership/redeem-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem points');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Đã quy đổi ${formatNumber(data.pointsRedeemed)} điểm thành ${formatVND(data.discountValue)}!`);
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      setPointsToRedeem(0);
      setOrderTotal(0);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải thông tin thành viên. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { customer, currentTier, nextTier, points, allTiers } = dashboard;

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Thông Tin Thành Viên
        </h1>
        <p className="text-gray-600">Quản lý thông tin và quyền lợi thành viên nhang sạch</p>
      </div>

      {/* Current Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Member Information */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-3xl">
              {currentTier.icon}
            </div>
            <div>
              <CardTitle className="text-2xl" style={{ color: currentTier.color }}>
                {customer.name}
              </CardTitle>
              <CardDescription className="text-lg">
                Thành viên {currentTier.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tham gia:</span>
                <span className="font-medium">{formatDate(customer.joinDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng chi tiêu:</span>
                <span className="font-bold text-green-600">{formatVND(customer.totalSpent)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Balance */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              Điểm Thưởng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-orange-600">
                {formatNumber(points.balance)}
              </div>
              <div className="text-gray-600">
                Tương đương {formatVND(points.valueVND)}
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tổng điểm đã tích lũy:</span>
                <span className="font-medium">{formatNumber(points.earned)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tích điểm x{currentTier.pointsMultiplier}:</span>
                <Badge style={{ backgroundColor: currentTier.color }}>
                  {currentTier.name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Tiến Độ Thăng Hạng
            </CardTitle>
            <CardDescription>
              Còn {formatVND(nextTier.remainingSpent)} để thăng hạng {nextTier.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl">{currentTier.icon}</div>
              <div className="flex-1">
                <Progress value={nextTier.progressPercent || 0} className="h-3" />
              </div>
              <div className="text-2xl">{nextTier.icon}</div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentTier.name}</span>
              <span>{Math.round(nextTier.progressPercent || 0)}%</span>
              <span>{nextTier.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points Redemption */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Quy Đổi Điểm Thưởng
          </CardTitle>
          <CardDescription>
            Sử dụng điểm để giảm giá đơn hàng (1 điểm = 100 VND)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderTotal">Tổng đơn hàng (VND)</Label>
              <Input
                id="orderTotal"
                type="number"
                value={orderTotal}
                onChange={(e) => setOrderTotal(Number(e.target.value))}
                placeholder="Nhập tổng giá trị đơn hàng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsToRedeem">Điểm quy đổi</Label>
              <Input
                id="pointsToRedeem"
                type="number"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                placeholder="Nhập số điểm muốn quy đổi"
                max={Math.min(points.balance, Math.floor(orderTotal * 0.5 / 100))}
              />
            </div>
          </div>
          
          {pointsToRedeem > 0 && orderTotal > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Điểm quy đổi:</span>
                <span className="font-medium">{formatNumber(pointsToRedeem)} điểm</span>
              </div>
              <div className="flex justify-between">
                <span>Giá trị giảm:</span>
                <span className="font-medium text-green-600">-{formatVND(pointsToRedeem * 100)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Số tiền phải trả:</span>
                <span className="text-orange-600">{formatVND(orderTotal - (pointsToRedeem * 100))}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => redeemPointsMutation.mutate({ pointsToRedeem, orderTotal })}
            disabled={!pointsToRedeem || !orderTotal || pointsToRedeem > points.balance || redeemPointsMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {redeemPointsMutation.isPending ? 'Đang xử lý...' : 'Quy Đổi Điểm'}
          </Button>
        </CardContent>
      </Card>

      {/* Membership Tiers */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            Các Hạng Thành Viên
          </CardTitle>
          <CardDescription>
            Quyền lợi và yêu cầu cho từng hạng thành viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allTiers.map((tier) => (
              <div
                key={tier.key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.isActive
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : tier.isUnlocked
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{tier.icon}</div>
                  <h3 className="font-bold" style={{ color: tier.color }}>
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {tier.requiredSpent === 0
                      ? 'Miễn phí'
                      : `Từ ${formatVND(tier.requiredSpent)}`}
                  </p>
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-1">
                  {tier.benefits.map((benefit, index) => (
                    <div key={index} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {tier.isActive && (
                  <Badge className="w-full mt-3 justify-center bg-orange-500">
                    Hạng hiện tại
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}