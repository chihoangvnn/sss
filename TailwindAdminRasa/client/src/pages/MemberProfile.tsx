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
import { Share, MessageCircle, Phone, Mail, Facebook, Copy, Users, Gift } from 'lucide-react';
import QuickContact from '@/components/QuickContact';
import SocialLoginPanel from '@/components/SocialLoginPanel';
import SocialShare from '@/components/SocialShare';
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

  // Demo data fallback for testing UI
  const demoData = {
    customer: {
      id: 'demo-customer-001',
      name: 'Nguyễn Văn A', 
      email: 'customer@nhangxanh.vn',
      membershipTier: 'gold',
      totalSpent: 5500000, // 5.5M VND - Gold tier
      pointsBalance: 2750,
      pointsEarned: 5500,
      totalDebt: 150000, // Has some debt  
      creditLimit: 2000000, // 2M credit limit
      joinDate: '2024-01-15',
      lastTierUpdate: '2024-09-01'
    },
    currentTier: {
      id: 'gold',
      name: 'Vàng',
      nameEn: 'gold',
      color: '#FFD700',
      requiredSpent: 5000000,
      pointsMultiplier: 1.5,
      benefits: ['Tích điểm x1.5', 'Miễn phí vận chuyển', 'Ưu tiên hỗ trợ'],
      icon: '🥇',
      key: 'gold',
      isActive: true,
      isUnlocked: true
    },
    nextTier: {
      id: 'diamond',
      name: 'Kim Cương',
      nameEn: 'diamond',
      color: '#E0E7FF',
      requiredSpent: 15000000,
      pointsMultiplier: 2.0,
      benefits: ['Tích điểm x2.0', 'Quà tặng sinh nhật', 'Tư vấn 1:1'],
      icon: '💎',
      key: 'diamond',
      isActive: false,
      remainingSpent: 9500000,
      progressPercent: 58
    },
    points: {
      balance: 2750,
      earned: 5500,
      valueVND: 275000,
      minRedemption: 100
    },
    allTiers: []
  };

  if (error || !dashboard) {
    console.log('Using demo data for testing UI');
  }

  const { customer, currentTier, nextTier, points, allTiers } = dashboard || demoData;

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 min-h-screen">
      {/* Header with Social Integration */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Thông Tin Thành Viên
        </h1>
        <p className="text-gray-600">Quản lý thông tin và quyền lợi thành viên nhang sạch</p>
        
        {/* Social Achievement Banner */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-center gap-2 text-orange-700">
            <span className="text-2xl">{currentTier.icon}</span>
            <div className="text-center">
              <div className="font-bold">🎉 Thành tích đáng tự hào!</div>
              <div className="text-sm">Bạn đã đạt hạng {currentTier.name} với {formatVND(customer.totalSpent)} chi tiêu</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/80 hover:bg-white border-orange-300"
              onClick={() => {
                const achievementText = `🔥 Tôi vừa đạt hạng ${currentTier.name} tại nhang sạch với ${formatVND(customer.totalSpent)} chi tiêu! ${formatNumber(points.balance)} điểm thưởng đang chờ sử dụng! 🌟 #nhangxanh #thanhvien${currentTier.nameEn}`;
                if (navigator.share) {
                  navigator.share({ 
                    text: achievementText, 
                    url: window.location.href,
                    title: 'Thành tích thành viên nhang sạch'
                  });
                } else {
                  navigator.clipboard.writeText(achievementText);
                  toast.success('Đã copy thành tích để chia sẻ!');
                }
              }}
            >
              <Share className="w-4 h-4 mr-1" />
              Khoe thành tích
            </Button>
          </div>
        </div>
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
            
            {/* Social Actions */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 text-xs"
                  onClick={() => {
                    const text = `🎉 Tôi là thành viên ${currentTier.name} tại nhang sạch! Tổng chi tiêu ${formatVND(customer.totalSpent)} với ${formatNumber(points.balance)} điểm thưởng! 🔥`;
                    if (navigator.share) {
                      navigator.share({ text, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success('Đã copy thành tích!');
                    }
                  }}
                >
                  <Share className="w-3 h-3" />
                  Chia sẻ
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 text-xs"
                  onClick={() => {
                    const referralCode = `REF${customer.id.slice(-6).toUpperCase()}`;
                    const text = `Mã giới thiệu: ${referralCode}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Đã copy mã giới thiệu!');
                  }}
                >
                  <Users className="w-3 h-3" />
                  Giới thiệu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Balance với Social Features */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                Điểm Thưởng
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 p-1"
                  onClick={() => {
                    const referralCode = `REF${customer.id.slice(-6).toUpperCase()}`;
                    const referralText = `🎁 Tham gia nhang sạch với mã giới thiệu ${referralCode} để nhận 500 điểm thưởng miễn phí! Link: ${window.location.origin}/member-profile?ref=${referralCode}`;
                    navigator.clipboard.writeText(referralText);
                    toast.success('Đã copy link giới thiệu bạn bè!');
                  }}
                  title="Giới thiệu bạn bè"
                >
                  <Users className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-green-600 hover:text-green-700 p-1"
                  onClick={() => {
                    const pointsText = `💰 Tôi có ${formatNumber(points.balance)} điểm thưởng (${formatVND(points.valueVND)}) tại nhang sạch! Đủ mua nhiều sản phẩm tuyệt vời! 🛒`;
                    if (navigator.share) {
                      navigator.share({ text: pointsText });
                    } else {
                      navigator.clipboard.writeText(pointsText);
                      toast.success('Đã copy thông tin điểm!');
                    }
                  }}
                  title="Chia sẻ điểm thưởng"
                >
                  <Gift className="w-4 h-4" />
                </Button>
              </div>
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
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                💡 <strong>Mẹo:</strong> Giới thiệu bạn bè và cả hai đều nhận 500 điểm thưởng!
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
              Còn {formatVND(nextTier.remainingSpent || 0)} để thăng hạng {nextTier.name}
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

      {/* Business Management Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Debt Management Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Quản Lý Công Nợ
              </div>
              <Badge variant={Number(customer.totalDebt || 0) > 0 ? "destructive" : "default"}>
                {Number(customer.totalDebt || 0) > 0 ? "Có nợ" : "Không nợ"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-red-600">
                {formatVND(Number(customer.totalDebt || 0))}
              </div>
              <div className="text-gray-600 text-sm">
                Tổng công nợ hiện tại
              </div>
            </div>
            
            {Number(customer.totalDebt || 0) > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    💡 <strong>Lưu ý:</strong> Vui lòng thanh toán công nợ để tiếp tục mua hàng
                  </div>
                  <div className="grid gap-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      💳 Thanh toán ngay
                    </Button>
                    <Button variant="outline" className="w-full">
                      📞 Liên hệ hỗ trợ
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            {Number(customer.totalDebt || 0) === 0 && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-green-700 font-medium">✅ Không có công nợ</div>
                <div className="text-green-600 text-sm">Bạn có thể mua hàng bình thường</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Limit Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                Hạn Mức Tín Dụng
              </div>
              <Badge variant={Number(customer.creditLimit || 0) > 0 ? "default" : "secondary"}>
                {Number(customer.creditLimit || 0) > 0 ? "Có hạn mức" : "Chưa có"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {formatVND(Number(customer.creditLimit || 0))}
              </div>
              <div className="text-gray-600 text-sm">
                Hạn mức tín dụng được phép
              </div>
            </div>
            
            {Number(customer.creditLimit || 0) > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Đã sử dụng:</span>
                      <span className="font-medium text-red-600">
                        {formatVND(Number(customer.totalDebt || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Còn lại:</span>
                      <span className="font-medium text-green-600">
                        {formatVND(Number(customer.creditLimit || 0) - Number(customer.totalDebt || 0))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (Number(customer.totalDebt || 0) / Number(customer.creditLimit || 0)) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Sử dụng {Math.round((Number(customer.totalDebt || 0) / Number(customer.creditLimit || 0)) * 100)}% hạn mức
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {Number(customer.creditLimit || 0) === 0 && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-700 font-medium">📋 Chưa có hạn mức</div>
                <div className="text-blue-600 text-sm">Liên hệ để đăng ký hạn mức tín dụng</div>
                <Button variant="outline" className="mt-2 w-full">
                  📞 Yêu cầu hạn mức
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Points Redemption */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
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
                max={Math.min(points.balance, Math.floor((orderTotal || 0) * 0.5 / 100))}
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

      {/* Social Integration Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SocialLoginPanel compact={true} showTitle={true} />
        
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Chia sẻ thành tích
              </div>
              <SocialShare 
                title={`Thành viên ${currentTier.name} - Nhang Sạch`}
                text={`🎉 Tôi đã đạt hạng ${currentTier.name} với ${formatVND(customer.totalSpent)} chi tiêu và ${formatNumber(points.balance)} điểm thưởng tại nhang sạch!`}
                hashtags={['nhangxanh', `thanhvien${currentTier.nameEn}`, 'loyalty']}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              Khoe thành tích thành viên của bạn với bạn bè!
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-sm">🏆 Hạng hiện tại:</span>
                <Badge style={{ backgroundColor: currentTier.color }}>
                  {currentTier.name}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm">💰 Tổng chi tiêu:</span>
                <span className="font-bold text-green-600">
                  {formatVND(customer.totalSpent)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm">⭐ Điểm thưởng:</span>
                <span className="font-bold text-blue-600">
                  {formatNumber(points.balance)} điểm
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Quick Contact Floating Component */}
      <QuickContact />
    </div>
  );
}