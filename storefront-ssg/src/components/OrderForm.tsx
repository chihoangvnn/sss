import React, { useState } from 'react';
import { Product, OrderFormData, StorefrontOrder } from '@/types';
import { formatPrice, validatePhoneNumber, validateEmail, cn } from '@/lib/utils';
import { runtimeApi } from '@/lib/api';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Package,
  Loader2,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface OrderFormProps {
  product: Product;
  storefrontConfigId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  primaryColor?: string;
}

interface ValidationErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function OrderForm({
  product,
  storefrontConfigId,
  onSuccess,
  onCancel,
  className = '',
  primaryColor = '#4ade80',
}: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    quantity: 1,
    paymentMethod: 'cod',
    notes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateField = (field: keyof OrderFormData, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Họ và tên là bắt buộc';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return '';
      case 'phone':
        if (!value.trim()) return 'Số điện thoại là bắt buộc';
        if (!validatePhoneNumber(value)) return 'Số điện thoại không hợp lệ (VD: 0123456789)';
        return '';
      case 'email':
        if (value && !validateEmail(value)) return 'Email không hợp lệ';
        return '';
      case 'address':
        if (!value.trim()) return 'Địa chỉ giao hàng là bắt buộc';
        if (value.trim().length < 10) return 'Vui lòng nhập địa chỉ chi tiết';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    newErrors.name = validateField('name', formData.name);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.email = validateField('email', formData.email);
    newErrors.address = validateField('address', formData.address);

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      setSubmitMessage('Vui lòng kiểm tra lại thông tin.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const unitPrice = parseFloat(product.price);
      const total = (unitPrice * formData.quantity).toFixed(2);

      const orderData: StorefrontOrder = {
        storefrontConfigId,
        productId: product.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || undefined,
        customerAddress: formData.address,
        productName: product.name,
        quantity: formData.quantity,
        unitPrice: product.price,
        total,
        paymentMethod: formData.paymentMethod,
        deliveryType: 'home_delivery',
        notes: formData.notes || undefined,
      };

      const response = await runtimeApi.createOrder(orderData);
      
      if (response.success) {
        setSubmitStatus('success');
        setSubmitMessage(response.message || 'Đặt hàng thành công!');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(response.error || 'Đặt hàng thất bại');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error 
          ? error.message 
          : 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = parseFloat(product.price) * formData.quantity;

  return (
    <div className={cn('bg-white rounded-lg shadow-lg p-6', className)}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Đặt hàng</h2>

      {/* Product Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <img
            src={product.images?.[0]?.secure_url || product.image}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-gray-600">{formatPrice(product.price)} × {formData.quantity}</p>
            <p className="font-bold" style={{ color: primaryColor }}>
              Tổng: {formatPrice(totalPrice)}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="w-4 h-4 inline mr-2" />
            Số lượng
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange('quantity', Math.max(1, formData.quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              -
            </button>
            <span className="text-lg font-semibold w-12 text-center">{formData.quantity}</span>
            <button
              type="button"
              onClick={() => handleFieldChange('quantity', formData.quantity + 1)}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Họ và tên *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.name 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            )}
            placeholder="Nhập họ và tên của bạn"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.phone 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            )}
            placeholder="0123456789"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email (tuỳ chọn)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.email 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            )}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Địa chỉ giao hàng *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            rows={3}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.address 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            )}
            placeholder="Nhập địa chỉ chi tiết để giao hàng"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Phương thức thanh toán
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={formData.paymentMethod === 'cod'}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                className="text-blue-600"
              />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={formData.paymentMethod === 'bank_transfer'}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                className="text-blue-600"
              />
              <span>Chuyển khoản ngân hàng</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú thêm về đơn hàng..."
          />
        </div>

        {/* Submit Status */}
        {submitStatus !== 'idle' && (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            submitStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          )}>
            {submitStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{submitMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="flex-1 py-3 px-4 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : submitStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Đã đặt hàng
              </>
            ) : (
              `Đặt hàng - ${formatPrice(totalPrice)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}