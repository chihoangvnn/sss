'use client'

import React, { useState } from 'react';
import { X, Calendar, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVietnamPrice } from '@/utils/currency';
import { Order } from '@/components/OrderHistory';

interface SchedulePurchaseModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedulePurchase: (order: Order, scheduleInfo: ScheduleInfo) => void;
}

interface ScheduleInfo {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate?: string;
  totalOrders?: number;
  autoRenewal: boolean;
  notes?: string;
}

const frequencyOptions = [
  { value: 'weekly', label: 'Hàng tuần', description: 'Mỗi 7 ngày' },
  { value: 'biweekly', label: 'Hai tuần một lần', description: 'Mỗi 14 ngày' },
  { value: 'monthly', label: 'Hàng tháng', description: 'Mỗi tháng' },
  { value: 'quarterly', label: 'Hàng quý', description: 'Mỗi 3 tháng' },
] as const;

export function SchedulePurchaseModal({ order, isOpen, onClose, onSchedulePurchase }: SchedulePurchaseModalProps) {
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo>({
    frequency: 'monthly',
    startDate: '',
    autoRenewal: false,
    notes: ''
  });

  const [scheduleType, setScheduleType] = useState<'unlimited' | 'endDate' | 'totalOrders'>('unlimited');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // Get tomorrow as minimum start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleInputChange = (field: keyof ScheduleInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'autoRenewal' ? (e.target as HTMLInputElement).checked : e.target.value;
    setScheduleInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!scheduleInfo.startDate) {
      alert('Vui lòng chọn ngày bắt đầu');
      return;
    }

    if (scheduleType === 'endDate' && !scheduleInfo.endDate) {
      alert('Vui lòng chọn ngày kết thúc');
      return;
    }

    if (scheduleType === 'totalOrders' && (!scheduleInfo.totalOrders || scheduleInfo.totalOrders < 1)) {
      alert('Vui lòng nhập số lượng đơn hàng hợp lệ');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Clear unused fields based on schedule type
      const cleanScheduleInfo = { ...scheduleInfo };
      if (scheduleType === 'unlimited') {
        delete cleanScheduleInfo.endDate;
        delete cleanScheduleInfo.totalOrders;
      } else if (scheduleType === 'endDate') {
        delete cleanScheduleInfo.totalOrders;
      } else if (scheduleType === 'totalOrders') {
        delete cleanScheduleInfo.endDate;
      }

      await onSchedulePurchase(order, cleanScheduleInfo);
      
      // Reset form and close modal
      setScheduleInfo({
        frequency: 'monthly',
        startDate: '',
        autoRenewal: false,
        notes: ''
      });
      setScheduleType('unlimited');
      onClose();
    } catch (error) {
      console.error('Schedule purchase failed:', error);
      alert('Có lỗi xảy ra khi lên lịch đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form when closing
      setScheduleInfo({
        frequency: 'monthly',
        startDate: '',
        autoRenewal: false,
        notes: ''
      });
      setScheduleType('unlimited');
    }
  };

  const selectedFrequency = frequencyOptions.find(opt => opt.value === scheduleInfo.frequency);

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0 duration-300" onClick={handleClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lên lịch mua hàng</h2>
                <p className="text-sm text-blue-700">#{order.orderNumber}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 hover:bg-white/80" disabled={isSubmitting}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Đơn hàng định kỳ</h3>
                <div className="space-y-2 mb-3">
                  {order.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatVietnamPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-blue-600">
                    <span>Tổng mỗi đơn:</span>
                    <span>{formatVietnamPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2 text-blue-500" />
                  Tần suất đặt hàng
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {frequencyOptions.map((option) => (
                    <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="frequency"
                        value={option.value}
                        checked={scheduleInfo.frequency === option.value}
                        onChange={handleInputChange('frequency')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={isSubmitting}
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Duration */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Thời gian lên lịch</h3>
                
                <div className="space-y-3">
                  {/* Unlimited */}
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="unlimited"
                      checked={scheduleType === 'unlimited'}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-3 text-gray-900">Không giới hạn (đến khi hủy)</span>
                  </label>

                  {/* End Date */}
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="endDate"
                      checked={scheduleType === 'endDate'}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-3 text-gray-900">Đến ngày cụ thể</span>
                  </label>

                  {/* Total Orders */}
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="totalOrders"
                      checked={scheduleType === 'totalOrders'}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-3 text-gray-900">Số lượng đơn hàng cố định</span>
                  </label>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={scheduleInfo.startDate}
                  onChange={handleInputChange('startDate')}
                  min={minDate}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* End Date (conditional) */}
              {scheduleType === 'endDate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={scheduleInfo.endDate || ''}
                    onChange={handleInputChange('endDate')}
                    min={scheduleInfo.startDate || minDate}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Total Orders (conditional) */}
              {scheduleType === 'totalOrders' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tổng số đơn hàng *
                  </label>
                  <input
                    type="number"
                    value={scheduleInfo.totalOrders || ''}
                    onChange={handleInputChange('totalOrders')}
                    min="1"
                    max="100"
                    placeholder="Nhập số lượng đơn hàng"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Auto Renewal */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  checked={scheduleInfo.autoRenewal}
                  onChange={handleInputChange('autoRenewal')}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="autoRenewal" className="flex-1 text-sm">
                  <span className="font-medium text-gray-900">Tự động gia hạn</span>
                  <p className="text-gray-500 mt-1">Tự động gia hạn lịch trình khi kết thúc</p>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={scheduleInfo.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Thêm ghi chú cho lịch trình đặt hàng..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Thông tin quan trọng:</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Đơn hàng sẽ tự động được tạo theo lịch trình</li>
                      <li>• Bạn sẽ nhận thông báo trước mỗi lần đặt hàng</li>
                      <li>• Có thể hủy hoặc tạm dừng lịch trình bất kỳ lúc nào</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !scheduleInfo.startDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Lên lịch đặt hàng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}