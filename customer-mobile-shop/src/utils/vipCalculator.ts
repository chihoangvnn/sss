import { VIP_TIERS, VipTier, VipProgress } from '@/types/vip';

export type { VipProgress } from '@/types/vip';

export function calculateVipStatus(totalSpent: number): VipProgress {
  // Find current tier
  let currentTier = VIP_TIERS[0];
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (totalSpent >= VIP_TIERS[i].threshold) {
      currentTier = VIP_TIERS[i];
      break;
    }
  }

  // Find next tier
  const currentIndex = VIP_TIERS.findIndex(tier => tier.id === currentTier.id);
  const nextTier = currentIndex < VIP_TIERS.length - 1 ? VIP_TIERS[currentIndex + 1] : null;

  // Calculate progress
  let progressToNext = 100;
  let amountToNext = 0;

  if (nextTier) {
    const currentThreshold = currentTier.threshold;
    const nextThreshold = nextTier.threshold;
    const progressAmount = totalSpent - currentThreshold;
    const totalNeeded = nextThreshold - currentThreshold;
    
    progressToNext = Math.min(100, (progressAmount / totalNeeded) * 100);
    amountToNext = nextThreshold - totalSpent;
  }

  return {
    currentTier,
    totalSpent,
    nextTier,
    progressToNext,
    amountToNext
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}K`;
  }
  return amount.toString();
}

export function getMotivationalMessage(progress: VipProgress): string {
  const { currentTier, nextTier, amountToNext, progressToNext } = progress;
  
  if (!nextTier) {
    return '🎉 Bạn đã đạt cấp độ cao nhất!';
  }

  if (progressToNext >= 90) {
    return `🔥 Chỉ còn ${formatCurrency(amountToNext)} nữa thôi!`;
  }
  
  if (progressToNext >= 75) {
    return `⚡ Sắp lên ${nextTier.name} rồi!`;
  }
  
  if (progressToNext >= 50) {
    return `📈 Đã đi được nửa chặng đường đến ${nextTier.name}`;
  }
  
  return `🎯 Hướng tới ${nextTier.name} với ưu đãi ${nextTier.discount}%`;
}