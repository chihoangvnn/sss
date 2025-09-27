import { storage } from '../storage';
import type { InsertCustomer } from '../../shared/schema';

export interface MembershipProcessingResult {
  success: boolean;
  customerId: string;
  orderId: string;
  previousTier: string;
  newTier: string;
  pointsEarned: number;
  newPointsBalance: number;
  tierUpgrade: boolean;
  error?: string;
}

export interface MembershipTier {
  name: string;
  nameEn: string;
  color: string;
  requiredSpent: number;
  pointsMultiplier: number;
  benefits: string[];
  icon: string;
  key: string;
}

// Vietnamese 4-tier membership system for incense business
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    name: "Thành viên",
    nameEn: "Member", 
    color: "#64748b",
    requiredSpent: 0,
    pointsMultiplier: 1,
    benefits: [
      "Tích điểm mua hàng",
      "Cập nhật sản phẩm mới",
      "Hỗ trợ tư vấn cơ bản"
    ],
    icon: "👤",
    key: "member"
  },
  {
    name: "Bạc",
    nameEn: "Silver",
    color: "#94a3b8", 
    requiredSpent: 1000000,
    pointsMultiplier: 1.2,
    benefits: [
      "Tích điểm x1.2",
      "Giảm giá 3% mọi đơn hàng",
      "Tư vấn chuyên sâu",
      "Ưu tiên giao hàng"
    ],
    icon: "🥈",
    key: "silver"
  },
  {
    name: "Vàng", 
    nameEn: "Gold",
    color: "#fbbf24",
    requiredSpent: 5000000,
    pointsMultiplier: 1.5,
    benefits: [
      "Tích điểm x1.5",
      "Giảm giá 5% mọi đơn hàng", 
      "Tư vấn phong thủy miễn phí",
      "Giao hàng miễn phí nội thành",
      "Quà tặng sinh nhật"
    ],
    icon: "🥇",
    key: "gold"
  },
  {
    name: "Kim cương",
    nameEn: "Diamond", 
    color: "#8b5cf6",
    requiredSpent: 15000000,
    pointsMultiplier: 2,
    benefits: [
      "Tích điểm x2",
      "Giảm giá 8% mọi đơn hàng",
      "Tư vấn phong thủy chuyên gia",
      "Giao hàng miễn phí toàn quốc", 
      "Ưu tiên sản phẩm limited",
      "Dịch vụ VIP độc quyền"
    ],
    icon: "💎",
    key: "diamond"
  }
];

/**
 * Calculate which tier a customer belongs to based on total spent
 */
export function calculateTier(totalSpent: number): MembershipTier {
  // Sort tiers by required spent descending to find the highest qualifying tier
  const sortedTiers = [...MEMBERSHIP_TIERS].sort((a, b) => b.requiredSpent - a.requiredSpent);
  
  for (const tier of sortedTiers) {
    if (totalSpent >= tier.requiredSpent) {
      return tier;
    }
  }
  
  // Fallback to member tier
  return MEMBERSHIP_TIERS[0];
}

/**
 * Process membership for a completed order
 * This function is idempotent and safe to call multiple times for the same order
 */
export async function processMembershipForOrder(params: {
  customerId: string;
  orderTotal: number;
  orderId: string;
}): Promise<MembershipProcessingResult> {
  const { customerId, orderTotal, orderId } = params;

  try {
    console.log(`💎 Processing membership for customer: ${customerId}, order: ${orderId}, total: ${orderTotal}`);

    // Get current customer data
    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // IDEMPOTENCY CHECK: Check if order was already processed
    const membershipData = customer.membershipData as any || {};
    const processedOrders = (membershipData.processedOrders as string[]) || [];
    
    if (processedOrders.includes(orderId)) {
      console.log(`💎 Order ${orderId} already processed for customer ${customerId} - skipping (idempotent)`);
      
      // Return current state without processing
      const currentTier = calculateTier(parseFloat(customer.totalSpent || '0'));
      return {
        success: true,
        customerId,
        orderId,
        previousTier: currentTier.key,
        newTier: currentTier.key,
        pointsEarned: 0,
        newPointsBalance: customer.pointsBalance || 0,
        tierUpgrade: false
      };
    }

    const currentTotalSpent = parseFloat(customer.totalSpent || '0');
    const newTotalSpent = currentTotalSpent + orderTotal;
    
    // Calculate current and new tiers
    const previousTier = calculateTier(currentTotalSpent);
    const newTier = calculateTier(newTotalSpent);
    const tierUpgrade = newTier.key !== previousTier.key;

    // Calculate points earned (1 point per 1000 VND, with tier multiplier)
    const basePoints = Math.floor(orderTotal / 1000);
    const pointsEarned = Math.floor(basePoints * newTier.pointsMultiplier);
    const newPointsBalance = (customer.pointsBalance || 0) + pointsEarned;
    const newPointsTotal = (customer.pointsEarned || 0) + pointsEarned;

    // Add order to processed list for idempotency
    const updatedProcessedOrders = [...processedOrders, orderId];
    const updatedMembershipData = {
      ...membershipData,
      processedOrders: updatedProcessedOrders,
      lastProcessed: new Date().toISOString()
    };

    // Update customer membership data with idempotency tracking
    const updateParams = {
      customerId,
      totalSpent: newTotalSpent.toString(),
      pointsBalance: newPointsBalance,
      pointsEarned: newPointsTotal,
      membershipTier: newTier.key,
      lastTierUpdate: tierUpgrade ? new Date() : null,
      membershipData: updatedMembershipData
    };

    const updatedCustomer = await storage.updateCustomerMembership(updateParams);
    
    if (!updatedCustomer) {
      throw new Error('Failed to update customer membership');
    }

    console.log(`💎 Membership processed successfully:`, {
      customer: customerId,
      order: orderId,
      previousTier: previousTier.key,
      newTier: newTier.key,
      pointsEarned,
      newPointsBalance,
      tierUpgrade
    });

    return {
      success: true,
      customerId,
      orderId,
      previousTier: previousTier.key,
      newTier: newTier.key,
      pointsEarned,
      newPointsBalance,
      tierUpgrade
    };

  } catch (error) {
    console.error(`💎 Membership processing failed for order ${orderId}:`, error);
    
    return {
      success: false,
      customerId,
      orderId,
      previousTier: 'unknown',
      newTier: 'unknown', 
      pointsEarned: 0,
      newPointsBalance: 0,
      tierUpgrade: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Ensure customer exists for an order, creating one if needed
 * Returns the customer ID to use for membership processing
 */
export async function ensureCustomerForOrder(params: {
  existingCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}): Promise<string | null> {
  const { existingCustomerId, customerName, customerPhone, customerEmail } = params;

  // If customer ID already exists, return it
  if (existingCustomerId) {
    const customer = await storage.getCustomer(existingCustomerId);
    if (customer) {
      return existingCustomerId;
    }
  }

  // No customer ID or customer not found, try to create/find by phone
  if (customerPhone && customerName) {
    try {
      // Check if customer already exists by phone
      const allCustomers = await storage.getCustomers();
      const normalizedPhone = customerPhone.replace(/\D/g, '');
      
      const existingCustomer = allCustomers.find(customer => 
        customer.phone && customer.phone.replace(/\D/g, '') === normalizedPhone
      );
      
      if (existingCustomer) {
        console.log(`💎 Found existing customer by phone: ${existingCustomer.id}`);
        return existingCustomer.id;
      }

      // Create new customer
      const customerData: InsertCustomer = {
        name: customerName,
        email: customerEmail || `guest-${Date.now()}@membership.local`,
        phone: customerPhone,
        status: 'active' as const
      };
      
      const newCustomer = await storage.createCustomer(customerData);
      console.log(`💎 Created new customer for membership: ${newCustomer.id}`);
      return newCustomer.id;

    } catch (error) {
      console.error('💎 Failed to create customer for membership:', error);
      return null;
    }
  }

  return null;
}