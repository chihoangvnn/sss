'use client'

import React, { useState } from 'react';
import { Package, Clock, Truck, CheckCircle, Calendar, Eye, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnamPrice } from '@/utils/currency';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/orderApi';
import { GiftPurchaseModal } from '@/components/GiftPurchaseModal';
import { SchedulePurchaseModal } from '@/components/SchedulePurchaseModal';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'shipped' | 'delivered';
  date: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress?: string;
  estimatedDelivery?: string;
}

// Demo fallback data (used when API is unavailable)
const FALLBACK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'DH240927001',
    status: 'delivered',
    date: '2024-09-20',
    total: 850000,
    items: [
      { id: '1', name: 'Nhang trầm hương cao cấp', quantity: 2, price: 300000 },
      { id: '2', name: 'Tinh dầu sả chanh', quantity: 1, price: 250000 }
    ],
    shippingAddress: 'Quận 1, TP.HCM',
    estimatedDelivery: '2024-09-22'
  },
  {
    id: '2',
    orderNumber: 'DH240926015',
    status: 'shipped',
    date: '2024-09-25',
    total: 1200000,
    items: [
      { id: '3', name: 'Bộ bàn thờ phong thủy', quantity: 1, price: 1200000 }
    ],
    shippingAddress: 'Quận 3, TP.HCM',
    estimatedDelivery: '2024-09-28'
  },
  {
    id: '3',
    orderNumber: 'DH240927002',
    status: 'shipped',
    date: '2024-09-27',
    total: 450000,
    items: [
      { id: '4', name: 'Đá phong thủy may mắn', quantity: 3, price: 150000 }
    ],
    shippingAddress: 'Quận 7, TP.HCM'
  },
  {
    id: '4',
    orderNumber: 'DH240927003',
    status: 'delivered',
    date: '2024-09-27',
    total: 320000,
    items: [
      { id: '5', name: 'Cung Ram tháng 7', quantity: 1, price: 320000 }
    ],
    shippingAddress: 'Quận 2, TP.HCM'
  }
];

const ORDER_STATUS_CONFIG = {
  shipped: {
    label: 'Đã gởi',
    color: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200/50',
    icon: Truck,
    iconColor: 'text-orange-600',
    dotColor: 'bg-orange-400'
  },
  delivered: {
    label: 'Đã giao',
    color: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200/50',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    dotColor: 'bg-green-400'
  }
};

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  media?: string;
  category_id: string;
  stock: number;
  short_description?: string;
  status: string;
}

interface OrderHistoryProps {
  className?: string;
  addToCart?: (product: Product) => void;
  setActiveTab?: (tab: string) => void;
}

export function OrderHistory({ className = '', addToCart, setActiveTab }: OrderHistoryProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [giftModalOpen, setGiftModalOpen] = useState<boolean>(false);
  const [selectedGiftOrder, setSelectedGiftOrder] = useState<Order | null>(null);
  
  // Schedule purchase modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [selectedScheduleOrder, setSelectedScheduleOrder] = useState<Order | null>(null);

  // Fetch orders from API
  const { 
    data: orders = [], 
    isLoading, 
    error,
    isError 
  } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use API data if available, otherwise fallback data
  const availableOrders: Order[] = isError ? FALLBACK_ORDERS : orders;

  // Log error for debugging if API fails
  React.useEffect(() => {
    if (error) {
      console.warn('Failed to fetch orders, using fallback data:', error);
    }
  }, [error]);

  const filteredOrders = selectedFilter === 'all' 
    ? availableOrders 
    : availableOrders.filter((order: Order) => order.status === selectedFilter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const StatusBadge = ({ status }: { status: Order['status'] }) => {
    const config = ORDER_STATUS_CONFIG[status];
    const IconComponent = config.icon;

    return (
      <div className={`${config.color} border px-4 py-2 rounded-full font-medium text-sm flex items-center shadow-sm`}>
        <div className={`w-2 h-2 rounded-full ${config.dotColor} mr-2 animate-pulse`}></div>
        <IconComponent className={`h-4 w-4 mr-1.5 ${config.iconColor}`} />
        {config.label}
      </div>
    );
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Handle "Mua Lại" functionality
  const handleBuyAgain = (order: Order) => {
    if (!addToCart || !setActiveTab) {
      console.warn('addToCart or setActiveTab functions not available');
      return;
    }

    // Convert order items to Product objects and add to cart
    order.items.forEach((item: Order['items'][0]) => {
      const product: Product = {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        media: item.image, // Use image as media fallback
        category_id: 'general', // Default category
        stock: 999, // Assume in stock
        short_description: `Sản phẩm từ đơn hàng #${order.orderNumber}`,
        status: 'active'
      };

      // Add each item to cart with original quantity
      for (let i = 0; i < item.quantity; i++) {
        addToCart(product);
      }
    });

    // Switch to cart tab to show added items
    setActiveTab('cart');
    
    // Optional: Show success message (could be enhanced later)
    console.log(`Đã thêm ${order.items.length} sản phẩm từ đơn #${order.orderNumber} vào giỏ hàng`);
  };

  // Handle "Mua Tặng" functionality
  const handleGiftPurchase = (order: Order) => {
    setSelectedGiftOrder(order);
    setGiftModalOpen(true);
  };

  const handleGiftPurchaseConfirm = async (order: Order, recipientInfo: any) => {
    try {
      // In a real app, this would call an API to create a gift order
      console.log('Gift purchase confirmed:', { order, recipientInfo });
      
      // For now, just add to cart like a regular purchase
      if (addToCart && setActiveTab) {
        order.items.forEach((item: Order['items'][0]) => {
          const product: Product = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            media: item.image,
            category_id: 'general',
            stock: 999,
            short_description: `Quà tặng - ${item.name}`,
            status: 'active'
          };

          for (let i = 0; i < item.quantity; i++) {
            addToCart(product);
          }
        });

        setActiveTab('cart');
      }
      
      alert(`Đã tạo đơn quà tặng cho ${recipientInfo.name}!`);
    } catch (error) {
      console.error('Gift purchase failed:', error);
      throw error;
    }
  };

  const handleCloseGiftModal = () => {
    setGiftModalOpen(false);
    setSelectedGiftOrder(null);
  };

  // Handle "Lên Lịch" functionality  
  const handleSchedulePurchase = (order: Order) => {
    setSelectedScheduleOrder(order);
    setScheduleModalOpen(true);
  };

  const handleSchedulePurchaseConfirm = async (order: Order, scheduleInfo: any) => {
    try {
      // In a real app, this would call an API to create a scheduled order
      console.log('Schedule purchase confirmed:', { order, scheduleInfo });
      
      // For demo purposes, just show success message
      const frequencyText = {
        weekly: 'hàng tuần',
        biweekly: 'hai tuần một lần', 
        monthly: 'hàng tháng',
        quarterly: 'hàng quý'
      };
      
      alert(`Đã lên lịch đặt hàng ${frequencyText[scheduleInfo.frequency]} bắt đầu từ ${scheduleInfo.startDate}!`);
    } catch (error) {
      console.error('Schedule purchase failed:', error);
      throw error;
    }
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedScheduleOrder(null);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lịch sử đơn hàng</h2>
        <div className="bg-green-50 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-green-700">
            {filteredOrders.length} đơn hàng
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl border border-gray-200/50">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedFilter === 'all'
              ? 'bg-white text-green-700 shadow-md border border-green-100'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setSelectedFilter(status)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === status
                ? 'bg-white text-green-700 shadow-md border border-green-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center max-w-sm mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tải đơn hàng</h3>
            <p className="text-sm text-gray-500 text-center">
              Vui lòng đợi trong giây lát...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm p-6 flex flex-col items-center max-w-sm mx-auto">
            <AlertCircle className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Kết nối thất bại</h3>
            <p className="text-sm text-amber-700 text-center mb-4">
              Không thể tải dữ liệu từ server. Hiển thị dữ liệu demo.
            </p>
            <div className="text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
              Sử dụng dữ liệu fallback
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {!isLoading && filteredOrders.length > 0 ? (
          filteredOrders.map((order: Order, index: number) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                expandedOrder === order.id ? 'ring-2 ring-green-100' : ''
              }`}
            >
              {/* New Compact Layout */}
              <div className="p-4">
                {/* Compact Header: #DH240927001 [Đã giao] */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-gray-900">
                    #{order.orderNumber}
                  </h3>
                  <StatusBadge status={order.status} />
                </div>

                {/* Address + Price same line */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 flex-1 mr-4">
                    {order.shippingAddress || 'Địa chỉ giao hàng'}
                  </div>
                  <div className="font-bold text-green-600 text-base">
                    {formatVietnamPrice(order.total)}
                  </div>
                </div>

                {/* Date separate line */}
                <div className="text-sm text-gray-500 mb-4">
                  {formatDate(order.date)}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-2 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handleSchedulePurchase(order)}
                  >
                    Lên Lịch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-2 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handleGiftPurchase(order)}
                  >
                    Mua Tặng
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-2 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handleBuyAgain(order)}
                  >
                    Mua Lại
                  </Button>
                  <div className="flex-1"></div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleOrderDetails(order.id)}
                    className={`text-xs px-3 py-2 transition-all duration-200 ${
                      expandedOrder === order.id
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
                    }`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Chi Tiết
                  </Button>
                </div>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-5 bg-gradient-to-b from-gray-50 to-white">
                  <div className="flex items-center mb-4">
                    <Package className="h-5 w-5 text-green-500 mr-2" />
                    <h4 className="font-bold text-gray-900">Sản phẩm đã đặt</h4>
                  </div>
                  <div className="space-y-4">
                    {order.items.map((item: Order['items'][0], itemIndex: number) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{item.name}</div>
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="bg-gray-100 px-2 py-1 rounded-full">
                              Số lượng: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 px-3 py-2 rounded-lg">
                          <div className="font-bold text-green-600">
                            {formatVietnamPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-400">
                      <div className="flex items-center text-blue-800">
                        <Truck className="h-5 w-5 mr-2" />
                        <div>
                          <div className="font-semibold">Dự kiến giao hàng</div>
                          <div className="text-sm">{formatDate(order.estimatedDelivery)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div className="text-green-800 font-semibold">Tổng thanh toán:</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatVietnamPrice(order.total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : !isLoading ? (
          <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Chưa có đơn hàng</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {selectedFilter === 'all' 
                ? 'Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!' 
                : `Không có đơn hàng nào ở trạng thái "${ORDER_STATUS_CONFIG[selectedFilter as keyof typeof ORDER_STATUS_CONFIG]?.label}".`
              }
            </p>
            <Button 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              onClick={() => window.location.href = '/'}
            >
              Mua sắm ngay
            </Button>
          </div>
        ) : null}
      </div>

      {/* Gift Purchase Modal */}
      <GiftPurchaseModal
        order={selectedGiftOrder}
        isOpen={giftModalOpen}
        onClose={handleCloseGiftModal}
        onGiftPurchase={handleGiftPurchaseConfirm}
      />

      {/* Schedule Purchase Modal */}
      <SchedulePurchaseModal
        order={selectedScheduleOrder}
        isOpen={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        onSchedulePurchase={handleSchedulePurchaseConfirm}
      />
    </div>
  );
}