import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// 💎 VIETNAMESE INCENSE BUSINESS MEMBERSHIP TIERS
export const MEMBERSHIP_TIERS = {
  member: {
    name: 'Thành viên',
    nameEn: 'Member',
    color: '#64748b',
    requiredSpent: 0,
    pointsMultiplier: 1,
    benefits: [
      'Tích điểm mỗi đơn hàng',
      'Nhận thông báo sản phẩm mới',
      'Hỗ trợ khách hàng cơ bản'
    ],
    icon: '👤'
  },
  silver: {
    name: 'Bạc',
    nameEn: 'Silver',
    color: '#94a3b8',
    requiredSpent: 1000000, // 1 triệu VND
    pointsMultiplier: 1.2,
    benefits: [
      'Tích điểm x1.2 mỗi đơn hàng',
      'Giảm giá 5% cho đơn hàng từ 500k',
      'Ưu tiên hỗ trợ khách hàng',
      'Nhận mẫu thử sản phẩm mới'
    ],
    icon: '🥈'
  },
  gold: {
    name: 'Vàng',
    nameEn: 'Gold',
    color: '#fbbf24',
    requiredSpent: 5000000, // 5 triệu VND
    pointsMultiplier: 1.5,
    benefits: [
      'Tích điểm x1.5 mỗi đơn hàng',
      'Giảm giá 10% cho đơn hàng từ 300k',
      'Miễn phí vận chuyển toàn quốc',
      'Tư vấn nhang theo phong thủy cá nhân',
      'Sản phẩm giới hạn độc quyền'
    ],
    icon: '🥇'
  },
  diamond: {
    name: 'Kim Cương',
    nameEn: 'Diamond',
    color: '#a855f7',
    requiredSpent: 15000000, // 15 triệu VND
    pointsMultiplier: 2,
    benefits: [
      'Tích điểm x2 mỗi đơn hàng',
      'Giảm giá 15% toàn bộ đơn hàng',
      'Miễn phí vận chuyển và đổi trả',
      'Tư vấn phong thủy 1-1 với chuyên gia',
      'Nhang thủ công cao cấp độc quyền',
      'Quà sinh nhật đặc biệt hàng năm'
    ],
    icon: '💎'
  }
} as const;

export type MembershipTierKey = keyof typeof MEMBERSHIP_TIERS;

// 🔢 POINTS CALCULATION
export const POINTS_CONFIG = {
  // Earn 1 point per 1000 VND spent
  pointsPerVND: 0.001,
  
  // Point values for redemption (1 point = 100 VND)
  pointValueVND: 100,
  
  // Minimum points for redemption
  minRedemption: 100,
  
  // Maximum points that can be used per order (50%)
  maxRedemptionPercent: 0.5
};

// 🎯 MEMBERSHIP LOGIC FUNCTIONS
export function calculatePointsEarned(orderTotal: number, membershipTier: MembershipTierKey): number {
  const basePoints = Math.floor(orderTotal * POINTS_CONFIG.pointsPerVND);
  const multiplier = MEMBERSHIP_TIERS[membershipTier].pointsMultiplier;
  return Math.floor(basePoints * multiplier);
}

export function calculateRequiredTierUpgrade(currentSpent: number, currentTier: MembershipTierKey): {
  nextTier: MembershipTierKey | null;
  remainingSpent: number;
  progressPercent: number;
} {
  const tiers = Object.keys(MEMBERSHIP_TIERS) as MembershipTierKey[];
  const currentTierIndex = tiers.indexOf(currentTier);
  
  if (currentTierIndex === tiers.length - 1) {
    return { nextTier: null, remainingSpent: 0, progressPercent: 100 };
  }
  
  const nextTier = tiers[currentTierIndex + 1];
  const nextTierRequirement = MEMBERSHIP_TIERS[nextTier].requiredSpent;
  const remainingSpent = Math.max(0, nextTierRequirement - currentSpent);
  
  const currentTierRequirement = MEMBERSHIP_TIERS[currentTier].requiredSpent;
  const progress = (currentSpent - currentTierRequirement) / (nextTierRequirement - currentTierRequirement);
  const progressPercent = Math.min(100, Math.max(0, progress * 100));
  
  return { nextTier, remainingSpent, progressPercent };
}

export function determineMembershipTier(totalSpent: number): MembershipTierKey {
  if (totalSpent >= MEMBERSHIP_TIERS.diamond.requiredSpent) return 'diamond';
  if (totalSpent >= MEMBERSHIP_TIERS.gold.requiredSpent) return 'gold';
  if (totalSpent >= MEMBERSHIP_TIERS.silver.requiredSpent) return 'silver';
  return 'member';
}

export function calculateDiscount(orderTotal: number, membershipTier: MembershipTierKey): number {
  switch (membershipTier) {
    case 'silver':
      return orderTotal >= 500000 ? orderTotal * 0.05 : 0;
    case 'gold':
      return orderTotal >= 300000 ? orderTotal * 0.10 : 0;
    case 'diamond':
      return orderTotal * 0.15;
    default:
      return 0;
  }
}

// 📊 GET MEMBERSHIP DASHBOARD DATA
router.get('/dashboard', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const customer = await storage.getCustomerByAuthUser(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const currentSpent = parseFloat(customer.totalSpent || '0');
    const currentTier = customer.membershipTier as MembershipTierKey;
    const upgrade = calculateRequiredTierUpgrade(currentSpent, currentTier);
    
    const tierInfo = MEMBERSHIP_TIERS[currentTier];
    const nextTierInfo = upgrade.nextTier ? MEMBERSHIP_TIERS[upgrade.nextTier] : null;

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        membershipTier: currentTier,
        totalSpent: currentSpent,
        pointsBalance: customer.pointsBalance,
        pointsEarned: customer.pointsEarned,
        lastTierUpdate: customer.lastTierUpdate,
        joinDate: customer.joinDate
      },
      currentTier: {
        ...tierInfo,
        key: currentTier
      },
      nextTier: nextTierInfo ? {
        ...nextTierInfo,
        key: upgrade.nextTier!,
        remainingSpent: upgrade.remainingSpent,
        progressPercent: upgrade.progressPercent
      } : null,
      points: {
        balance: customer.pointsBalance,
        earned: customer.pointsEarned,
        valueVND: customer.pointsBalance * POINTS_CONFIG.pointValueVND,
        minRedemption: POINTS_CONFIG.minRedemption
      },
      allTiers: Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => ({
        ...tier,
        key,
        isActive: key === currentTier,
        isUnlocked: currentSpent >= tier.requiredSpent
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching membership dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔄 PROCESS ORDER AND UPDATE MEMBERSHIP
router.post('/process-order', async (req, res) => {
  try {
    const processOrderSchema = z.object({
      customerId: z.string(),
      orderTotal: z.number().positive(),
      orderId: z.string()
    });

    const { customerId, orderTotal, orderId } = processOrderSchema.parse(req.body);
    
    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const currentSpent = parseFloat(customer.totalSpent || '0');
    const newTotalSpent = currentSpent + orderTotal;
    
    // Calculate points earned
    const currentTier = customer.membershipTier as MembershipTierKey;
    const pointsEarned = calculatePointsEarned(orderTotal, currentTier);
    
    // Check for tier upgrade
    const newTier = determineMembershipTier(newTotalSpent);
    const tierUpgraded = newTier !== currentTier;
    
    // Update customer
    const updatedCustomer = await storage.updateCustomerMembership({
      customerId,
      totalSpent: newTotalSpent.toString(),
      pointsBalance: customer.pointsBalance + pointsEarned,
      pointsEarned: customer.pointsEarned + pointsEarned,
      membershipTier: newTier,
      lastTierUpdate: tierUpgraded ? new Date() : customer.lastTierUpdate
    });

    res.json({
      success: true,
      customer: updatedCustomer,
      order: {
        id: orderId,
        total: orderTotal,
        pointsEarned,
        tierUpgraded,
        newTier: tierUpgraded ? newTier : null
      },
      newTierInfo: tierUpgraded ? MEMBERSHIP_TIERS[newTier] : null
    });
  } catch (error) {
    console.error('❌ Error processing order for membership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 💰 REDEEM POINTS
router.post('/redeem-points', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const redeemSchema = z.object({
      pointsToRedeem: z.number().positive(),
      orderTotal: z.number().positive()
    });

    const { pointsToRedeem, orderTotal } = redeemSchema.parse(req.body);
    
    const customer = await storage.getCustomerByAuthUser(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    // Validation checks
    if (pointsToRedeem < POINTS_CONFIG.minRedemption) {
      return res.status(400).json({ 
        error: `Tối thiểu ${POINTS_CONFIG.minRedemption} điểm để quy đổi` 
      });
    }

    if (pointsToRedeem > customer.pointsBalance) {
      return res.status(400).json({ 
        error: 'Không đủ điểm thưởng' 
      });
    }

    const maxRedeemable = Math.floor(orderTotal * POINTS_CONFIG.maxRedemptionPercent / POINTS_CONFIG.pointValueVND);
    if (pointsToRedeem > maxRedeemable) {
      return res.status(400).json({ 
        error: `Tối đa ${maxRedeemable} điểm cho đơn hàng này (50% giá trị đơn hàng)` 
      });
    }

    const discountValue = pointsToRedeem * POINTS_CONFIG.pointValueVND;
    const newPointsBalance = customer.pointsBalance - pointsToRedeem;

    // Update customer points
    const updatedCustomer = await storage.updateCustomerMembership({
      customerId: customer.id,
      totalSpent: customer.totalSpent,
      pointsBalance: newPointsBalance,
      pointsEarned: customer.pointsEarned,
      membershipTier: customer.membershipTier,
      lastTierUpdate: customer.lastTierUpdate
    });

    res.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountValue,
      newPointsBalance,
      remainingValue: orderTotal - discountValue,
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('❌ Error redeeming points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📈 GET TIER REQUIREMENTS
router.get('/tiers', async (req, res) => {
  try {
    res.json({
      tiers: Object.entries(MEMBERSHIP_TIERS).map(([key, tier]) => ({
        ...tier,
        key
      })),
      pointsConfig: POINTS_CONFIG
    });
  } catch (error) {
    console.error('❌ Error fetching tier requirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;