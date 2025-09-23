/**
 * 🆔 Order ID Display Utilities
 * Chuẩn hóa hiển thị ID đơn hàng theo nguồn:
 * - Đơn hàng nội bộ: DH-12345678 (8 ký tự cuối từ UUID)
 * - Đơn hàng sàn thương mại: Giữ nguyên ID gốc
 */

export interface OrderDisplayData {
  id: string;
  source?: string | null;
  sourceOrderId?: string | null;
  sourceReference?: string | null;
}

/**
 * Chuẩn hóa order object để có thể sử dụng với utilities
 * Chuyển đổi nested sourceInfo thành root-level properties
 */
export function normalizeOrderForDisplay(order: any): OrderDisplayData {
  // Kiểm tra và xử lý nested sourceInfo structure
  const sourceInfo = order.sourceInfo || {};
  
  return {
    id: order.id,
    source: order.source || sourceInfo.source || null,
    sourceOrderId: order.sourceOrderId || sourceInfo.sourceOrderId || null,
    sourceReference: order.sourceReference || sourceInfo.sourceReference || null
  };
}

/**
 * Format order ID cho hiển thị dựa trên nguồn đơn hàng (với auto-normalization)
 */
export function formatOrderId(order: OrderDisplayData | any): string {
  const normalizedOrder = 'sourceInfo' in order ? normalizeOrderForDisplay(order) : order;
  // Đơn hàng từ sàn thương mại - giữ nguyên ID gốc
  if (isMarketplaceOrder(normalizedOrder)) {
    // Ưu tiên sourceOrderId nếu có, fallback về ID được format
    if (normalizedOrder.sourceOrderId) {
      return normalizedOrder.sourceOrderId;
    }
    
    // Nếu không có sourceOrderId, format với prefix theo platform
    switch (normalizedOrder.source) {
      case 'tiktok-shop':
        return `TTS-${normalizedOrder.id.slice(-8).toUpperCase()}`;
      case 'shopee':
        return `SPE-${normalizedOrder.id.slice(-8).toUpperCase()}`;
      default:
        return normalizedOrder.id.slice(-8).toUpperCase();
    }
  }
  
  // Đơn hàng nội bộ - chỉ hiển thị 8 chữ số thuần túy
  const digitsOnly = normalizedOrder.id.replace(/\D/g, ''); // Chỉ lấy số
  return digitsOnly.slice(-8).padStart(8, '0'); // 8 số cuối, pad với 0 nếu thiếu
}

/**
 * Kiểm tra xem đơn hàng có phải từ sàn thương mại không (với auto-normalization)
 */
export function isMarketplaceOrder(order: OrderDisplayData | any): boolean {
  const normalizedOrder = 'sourceInfo' in order ? normalizeOrderForDisplay(order) : order;
  const marketplaceSources = ['tiktok-shop', 'shopee', 'lazada', 'facebook-shop', 'instagram-shop'];
  return normalizedOrder.source ? marketplaceSources.includes(normalizedOrder.source) : false;
}

/**
 * Lấy ID ngắn cho hiển thị (8 ký tự cuối, viết hoa) - không phụ thuộc vào source
 */
export function getShortOrderId(order: OrderDisplayData | any): string {
  return order.id.slice(-8).toUpperCase();
}

/**
 * Format order ID cho QR payment (đơn hàng nội bộ) - với auto-normalization
 */
export function formatOrderIdForPayment(order: OrderDisplayData | any): string {
  const normalizedOrder = 'sourceInfo' in order ? normalizeOrderForDisplay(order) : order;
  // Chỉ format cho đơn hàng nội bộ
  if (isMarketplaceOrder(normalizedOrder)) {
    return normalizedOrder.sourceOrderId || normalizedOrder.id.slice(-8).toUpperCase();
  }
  
  // Đơn hàng nội bộ - chỉ hiển thị 8 chữ số thuần túy cho QR payment
  const digitsOnly = normalizedOrder.id.replace(/\D/g, ''); // Chỉ lấy số
  return digitsOnly.slice(-8).padStart(8, '0'); // 8 số cuối, pad với 0 nếu thiếu
}

/**
 * Lấy source name hiển thị cho người dùng
 */
export function getOrderSourceDisplayName(source?: string | null): string {
  const sourceNames: Record<string, string> = {
    'admin': 'Quản trị',
    'storefront': 'Website',
    'landing-page': 'Landing Page',
    'tiktok-shop': 'TikTok Shop',
    'shopee': 'Shopee',
    'lazada': 'Lazada',
    'facebook-shop': 'Facebook Shop',
    'instagram-shop': 'Instagram Shop'
  };
  
  return sourceNames[source || 'admin'] || 'Khác';
}

/**
 * Tạo display object với thông tin đầy đủ cho order
 */
export function createOrderDisplayInfo(order: OrderDisplayData) {
  return {
    id: formatOrderId(order),
    shortId: getShortOrderId(order),
    paymentId: formatOrderIdForPayment(order),
    sourceName: getOrderSourceDisplayName(order.source),
    isMarketplace: isMarketplaceOrder(order),
    originalId: order.id
  };
}

/**
 * Copy order ID to clipboard với format phù hợp
 */
export function copyOrderIdToClipboard(order: OrderDisplayData, description: string = "Mã đơn hàng"): Promise<boolean> {
  const orderId = formatOrderId(order);
  
  return navigator.clipboard.writeText(orderId).then(() => {
    console.log(`📋 Đã copy ${description}: ${orderId}`);
    return true;
  }).catch((err) => {
    console.error('❌ Không thể copy order ID:', err);
    return false;
  });
}