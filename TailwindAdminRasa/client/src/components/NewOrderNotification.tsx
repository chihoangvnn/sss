import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, User, DollarSign, Package, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  timeAgo: string;
}

interface NewOrderNotificationProps {
  order?: NewOrderData;
  onViewOrder?: (orderId: string) => void;
}

export function NewOrderNotification({ order, onViewOrder }: NewOrderNotificationProps) {
  const { toast } = useToast();
  
  const showNewOrderNotification = (orderData: NewOrderData) => {
    // 🌿 Gentle Green New Order Notification
    toast({
      variant: "gentle-success",
      duration: 6000, // Show for 6 seconds
      title: "🎉 Đơn hàng mới!",
      description: (
        <div className="space-y-3">
          {/* Header with sparkle effect (Fixed Jumping) */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-shrink-0">
              <Sparkles className="h-4 w-4 text-gentle-mint animate-sparkle will-change-transform" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gentle-sparkle rounded-full animate-pulse will-change-auto"></div>
            </div>
            <span className="text-gentle-mint font-medium">Đơn hàng mới nhận!</span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-2 text-gentle-deep/90">
            <User className="h-4 w-4 text-gentle-mint" />
            <span className="font-medium">{orderData.customerName}</span>
          </div>
          
          {/* Order Value */}
          <div className="flex items-center gap-2 text-gentle-deep/90">
            <DollarSign className="h-4 w-4 text-gentle-sparkle" />
            <span className="font-semibold">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: orderData.currency
              }).format(orderData.totalAmount)}
            </span>
          </div>
          
          {/* Items Count */}
          <div className="flex items-center gap-2 text-gentle-deep/90">
            <Package className="h-4 w-4 text-gentle-mint" />
            <span>{orderData.itemCount} sản phẩm</span>
          </div>
          
          {/* Time (Fixed Smooth Animation) */}
          <div className="flex items-center gap-2 text-gentle-deep/70 text-sm">
            <div className="w-2 h-2 bg-gentle-sparkle rounded-full animate-pulse will-change-auto flex-shrink-0"></div>
            <span>{orderData.timeAgo}</span>
          </div>
          
          {/* Action Button */}
          <div className="pt-2 border-t border-gentle-outline/30">
            <Button
              variant="ghost" 
              size="sm"
              className="h-8 px-3 text-gentle-deep hover:bg-gentle-mint/10 hover:text-gentle-mint transition-all duration-200 will-change-auto"
              onClick={() => onViewOrder?.(orderData.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Xem chi tiết
            </Button>
          </div>
        </div>
      ),
    });
    
    // 🔔 Optional gentle notification sound (can be enabled in settings)
    try {
      // Create a gentle notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Gentle bell tone: 800Hz for 0.1s, then 600Hz for 0.1s
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Silent fail if audio context not available
      console.debug('Notification sound not available');
    }
  };
  
  // Auto-trigger notification when order data is provided
  useEffect(() => {
    if (order) {
      showNewOrderNotification(order);
    }
  }, [order]);
  
  return null; // This component only triggers notifications
}

// 🌟 Hook for easy usage (Fixed Double Toast Issue)
export function useNewOrderNotification() {
  const [notificationTrigger, setNotificationTrigger] = useState<NewOrderData | undefined>();
  
  const triggerNewOrderNotification = React.useCallback((orderData: NewOrderData) => {
    setNotificationTrigger(orderData);
    // Reset trigger after a small delay to allow for re-triggering
    setTimeout(() => setNotificationTrigger(undefined), 100);
  }, []);
  
  // Memoize component to prevent recreation on every hook call
  const NewOrderNotificationComponent = React.useCallback(() => (
    <NewOrderNotification 
      order={notificationTrigger} 
      onViewOrder={(orderId) => {
        // Default action - could be customized
        console.log('Navigate to order:', orderId);
      }} 
    />
  ), [notificationTrigger]);
  
  return {
    NewOrderNotificationComponent,
    triggerNewOrderNotification,
  };
}

