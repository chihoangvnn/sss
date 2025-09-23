import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, Clock, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatOrderIdForPayment } from "@/utils/orderUtils";
import type { Order, Payment } from "@shared/schema";

interface QRPaymentProps {
  order: Order;
  payment?: Payment;
  onPaymentCreated?: (payment: Payment) => void;
}

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function QRPayment({ order, payment, onPaymentCreated }: QRPaymentProps) {
  const { toast } = useToast();
  
  // ✅ Calculate actual remaining time from server-provided expiry
  const calculateTimeRemaining = () => {
    if (!payment?.createdAt) return 15 * 60; // fallback to 15 minutes
    
    const createdAt = new Date(payment.createdAt);
    const expiryTime = new Date(createdAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + 15); // VietQR expiry: 15 minutes
    
    const now = new Date();
    const remainingMs = expiryTime.getTime() - now.getTime();
    
    return Math.max(0, Math.floor(remainingMs / 1000)); // seconds remaining, minimum 0
  };
  
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining);

  // 🏦 Bank info - MUST come from backend payment.bankInfo (no fallbacks for production safety)
  const bankInfo = payment?.bankInfo as {
    bank: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | undefined;
  
  // ⚠️ If no bank info, payment creation failed - should not render QR
  if (!bankInfo) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="text-amber-600 mb-2">
            ⚠️ Chưa có thông tin ngân hàng
          </div>
          <p className="text-sm">Vui lòng tạo lại phiếu thanh toán</p>
        </div>
      </Card>
    );
  }

  // Use QR code URL from backend payment object instead of generating client-side
  const qrCodeUrl = payment?.qrCode || "";

  // Countdown timer
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [payment]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Đã sao chép",
        description: `${label} đã được sao chép vào clipboard`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép vào clipboard",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Đang chờ thanh toán", variant: "secondary" as const, icon: Clock },
      completed: { label: "Đã thanh toán", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Thanh toán thất bại", variant: "destructive" as const, icon: Clock },
      cancelled: { label: "Đã hủy", variant: "destructive" as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="qr-payment-container">
      {/* Payment Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Thanh toán QR</h3>
        </div>
        {payment && getStatusBadge(payment.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code Section */}
        <Card data-testid="qr-code-section">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mã QR Thanh Toán</span>
              {payment?.status === 'pending' && timeRemaining > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code thanh toán"
                  className="w-48 h-48 object-contain"
                  data-testid="qr-code-image"
                  onError={(e) => {
                    console.error("QR Code failed to load:", qrCodeUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-muted-foreground bg-muted rounded">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Đang tạo mã QR...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {qrCodeUrl ? "Quét mã QR bằng ứng dụng ngân hàng để thanh toán" : "Vui lòng chờ tạo mã QR thanh toán"}
            </p>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card data-testid="payment-info-section">
          <CardHeader>
            <CardTitle>Thông Tin Chuyển Khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Số tiền:</span>
              <span className="text-lg font-bold text-primary" data-testid="payment-amount">
                {formatPrice(order.total)}
              </span>
            </div>

            <Separator />

            {/* Bank Information */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ngân hàng:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankInfo.bank}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.bank, "Tên ngân hàng")}
                    data-testid="copy-bank-name"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium" data-testid="account-number">
                    {bankInfo.accountNumber}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.accountNumber, "Số tài khoản")}
                    data-testid="copy-account-number"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chủ tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankInfo.accountName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.accountName, "Tên chủ tài khoản")}
                    data-testid="copy-account-name"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nội dung:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium" data-testid="payment-content">
                    {formatOrderIdForPayment(order)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(formatOrderIdForPayment(order), "Nội dung chuyển khoản")}
                    data-testid="copy-payment-content"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>• Vui lòng chuyển đúng số tiền và nội dung để đơn hàng được xử lý tự động</p>
              <p>• Thời gian thanh toán: 15 phút kể từ khi tạo mã QR</p>
              <p>• Liên hệ hotline nếu gặp sự cố trong quá trình thanh toán</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {payment && (
        <Card data-testid="payment-history">
          <CardHeader>
            <CardTitle>Lịch Sử Thanh Toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Phương thức: {payment.method === 'qr_code' ? 'Chuyển khoản QR' : payment.method}</p>
                <p className="text-sm text-muted-foreground">
                  Tạo lúc: {payment.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </p>
                {payment.transactionId && (
                  <p className="text-sm text-muted-foreground">
                    Mã giao dịch: {payment.transactionId}
                  </p>
                )}
              </div>
              {getStatusBadge(payment.status)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}