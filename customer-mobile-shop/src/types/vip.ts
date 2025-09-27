export interface VipTier {
  id: 'member' | 'silver' | 'gold' | 'diamond';
  name: string;
  emoji: string;
  threshold: number;
  benefits: string[];
  discount: number;
  bgGradient: string;
  borderGradient: string;
  textColor: string;
  animationClass: string;
  motivationalTitle: string;  // Thông điệp kích thích chính
  motivationalSubtitle: string; // Thông điệp phụ
}

export interface VipProgress {
  currentTier: VipTier;
  totalSpent: number;
  nextTier: VipTier | null;
  progressToNext: number;
  amountToNext: number;
}

export const VIP_TIERS: VipTier[] = [
  {
    id: 'member',
    name: 'Thành viên',
    emoji: '🥉',
    threshold: 0,
    benefits: [
      'Tích điểm với mỗi đơn hàng',
      'Nhận thông báo khuyến mãi',
      'Hỗ trợ khách hàng 24/7'
    ],
    discount: 0,
    bgGradient: 'from-blue-400 to-sky-500',
    borderGradient: 'from-blue-300 to-sky-400',
    textColor: 'text-white',
    animationClass: 'animate-pulse',
    motivationalTitle: 'BẮT ĐẦU HÀNH TRÌNH VIP!',
    motivationalSubtitle: 'Mua sắm ngay để thăng hạng!'
  },
  {
    id: 'silver',
    name: 'Bạc',
    emoji: '🥈',
    threshold: 1000000,
    benefits: [
      'Ưu tiên xử lý đơn hàng',
      'Tư vấn miễn phí 24/7',
      'Miễn phí ship đơn >500K',
      'Tích điểm x1.5'
    ],
    discount: 5,
    bgGradient: 'from-gray-400 to-slate-500',
    borderGradient: 'from-gray-300 to-slate-400',
    textColor: 'text-white',
    animationClass: 'animate-shimmer',
    motivationalTitle: 'BẠN ĐÃ LÀ KHÁCH VIP!',
    motivationalSubtitle: 'Ưu tiên xử lý đơn hàng!'
  },
  {
    id: 'gold',
    name: 'Vàng',
    emoji: '🥇',
    threshold: 3000000,
    benefits: [
      'Freeship toàn quốc',
      'Sản phẩm độc quyền',
      'Quà tặng sinh nhật',
      'Tư vấn chuyên gia 1-1',
      'Early access sản phẩm mới'
    ],
    discount: 10,
    bgGradient: 'from-yellow-400 to-orange-500',
    borderGradient: 'from-yellow-300 to-orange-400',
    textColor: 'text-white',
    animationClass: 'animate-glow',
    motivationalTitle: 'KHÁCH HÀNG ĐẲNG CẤP!',
    motivationalSubtitle: 'Freeship toàn quốc!'
  },
  {
    id: 'diamond',
    name: 'Kim Cương',
    emoji: '💎',
    threshold: 10000000,
    benefits: [
      'Hotline riêng CEO',
      'Xem hàng trước khi mua',
      'Ưu đãi độc quyền 365 ngày',
      'Tích điểm x3',
      'Quà tặng sinh nhật đặc biệt',
      'Trải nghiệm độc quyền'
    ],
    discount: 20,
    bgGradient: 'from-purple-500 to-blue-600',
    borderGradient: 'from-purple-400 to-blue-500',
    textColor: 'text-white',
    animationClass: 'animate-diamond-shimmer',
    motivationalTitle: 'SIÊU VIP - ĐẲNG CẤP TỐI THƯỢNG!',
    motivationalSubtitle: 'Hotline riêng CEO!'
  }
];