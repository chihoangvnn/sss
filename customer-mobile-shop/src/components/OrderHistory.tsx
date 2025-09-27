'use client'

import React, { useState } from 'react';
import { Package, Clock, Truck, CheckCircle, Calendar, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnamPrice } from '@/utils/currency';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
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
    status: 'processing',
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
    status: 'pending',
    date: '2024-09-27',
    total: 320000,
    items: [
      { id: '5', name: 'Cung Ram tháng 7', quantity: 1, price: 320000 }
    ],
    shippingAddress: 'Quận 2, TP.HCM'
  }
];

const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  processing: {
    label: 'Đang xử lý',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package,
    iconColor: 'text-blue-600'
  },
  shipped: {
    label: 'Đã gửi',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Truck,
    iconColor: 'text-orange-600'
  },
  delivered: {
    label: 'Đã giao',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
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
      <Badge className={`${config.color} border px-3 py-1.5 font-medium text-sm`}>
        <IconComponent className={`h-4 w-4 mr-1.5 ${config.iconColor}`} />
        {config.label}
      </Badge>
    );
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h2>
        <div className="text-sm text-gray-500">
          {filteredOrders.length} đơn hàng
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-50 p-1 rounded-lg">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setSelectedFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === status
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900">
                      Đơn hàng {order.orderNumber}
                    </h3>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(order.date)}
                    </div>
                    {order.shippingAddress && (
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-1" />
                        {order.shippingAddress}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatVietnamPrice(order.total)}
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {order.items.length} sản phẩm
                    {order.items.length > 0 && (
                      <span className="ml-2">
                        {order.items[0].name}
                        {order.items.length > 1 && ` +${order.items.length - 1} sản phẩm khác`}
                      </span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleOrderDetails(order.id)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Chi tiết
                  </Button>
                </div>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Sản phẩm đã đặt:</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">Số lượng: {item.quantity}</div>
                        </div>
                        <div className="font-medium text-green-600">
                          {formatVietnamPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Dự kiến giao hàng:</strong> {formatDate(order.estimatedDelivery)}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Tổng thanh toán:</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatVietnamPrice(order.total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-600 mb-6">
              {selectedFilter === 'all' 
                ? 'Bạn chưa có đơn hàng nào.' 
                : `Không có đơn hàng nào ở trạng thái "${ORDER_STATUS_CONFIG[selectedFilter as keyof typeof ORDER_STATUS_CONFIG]?.label}".`
              }
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              Mua sắm ngay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}