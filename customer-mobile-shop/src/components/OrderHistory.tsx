'use client'

import React, { useState } from 'react';
import { Package, Clock, Truck, CheckCircle, Calendar, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnamPrice } from '@/utils/currency';

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

// Mock data for demo
const MOCK_ORDERS: Order[] = [
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
  },
  {
    id: '5',
    orderNumber: 'DH240926010',
    status: 'shipped',
    date: '2024-09-24',
    total: 680000,
    items: [
      { id: '6', name: 'Lư đồng hương cao cấp', quantity: 1, price: 450000 },
      { id: '7', name: 'Nhang trầm Huế', quantity: 1, price: 230000 }
    ],
    shippingAddress: 'Quận 10, TP.HCM',
    estimatedDelivery: '2024-09-26'
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

interface OrderHistoryProps {
  className?: string;
}

export function OrderHistory({ className = '' }: OrderHistoryProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = selectedFilter === 'all' 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(order => order.status === selectedFilter);

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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                expandedOrder === order.id ? 'ring-2 ring-green-100' : ''
              }`}
            >
              {/* Order Header */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                    <h3 className="font-bold text-lg text-gray-900 tracking-tight">
                      #{order.orderNumber}
                    </h3>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="bg-gray-50/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-white px-3 py-1.5 rounded-lg">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        <span className="font-medium">{formatDate(order.date)}</span>
                      </div>
                      {order.shippingAddress && (
                        <div className="flex items-center bg-white px-3 py-1.5 rounded-lg">
                          <Truck className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">{order.shippingAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-sm">
                      <span className="text-lg font-bold">{formatVietnamPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {order.items.length} sản phẩm
                    </div>
                    {order.items.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {order.items[0].name}
                        {order.items.length > 1 && (
                          <span className="ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            +{order.items.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleOrderDetails(order.id)}
                    className={`text-sm font-medium border-2 transition-all duration-200 ${
                      expandedOrder === order.id
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
                    }`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {expandedOrder === order.id ? 'Thu gọn' : 'Chi tiết'}
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
                    {order.items.map((item, itemIndex) => (
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
        ) : (
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
            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105">
              Mua sắm ngay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}