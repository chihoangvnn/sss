import { db } from './db.js';
import { tiktokShopOrders, tiktokBusinessAccounts } from '../shared/schema.js';
import { eq, desc, asc, and, gte, lte, ilike, or, count } from 'drizzle-orm';

export interface TikTokShopOrderFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  shopId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'orderDate' | 'totalAmount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TikTokOrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  recentGrowth: number;
}

class TikTokShopOrdersService {
  
  /**
   * Get filtered list of TikTok Shop orders
   */
  async getOrders(filters: TikTokShopOrderFilter) {
    const {
      status,
      startDate,
      endDate,
      search,
      shopId,
      limit = 50,
      offset = 0,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = filters;

    let query = db.select().from(tiktokShopOrders);
    const conditions = [];

    // Apply filters
    if (status) {
      conditions.push(eq(tiktokShopOrders.status, status as any));
    }
    
    if (startDate) {
      conditions.push(gte(tiktokShopOrders.orderDate, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(tiktokShopOrders.orderDate, new Date(endDate)));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(tiktokShopOrders.orderNumber, `%${search}%`),
          ilike(tiktokShopOrders.tiktokOrderId, `%${search}%`)
        )
      );
    }
    
    if (shopId) {
      conditions.push(eq(tiktokShopOrders.shopId, shopId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    const sortColumn = sortBy === 'orderDate' ? tiktokShopOrders.orderDate
      : sortBy === 'totalAmount' ? tiktokShopOrders.totalAmount
      : tiktokShopOrders.updatedAt;
    
    query = query.orderBy(
      sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
    ) as any;

    // Apply pagination
    const orders = await query.limit(limit).offset(offset);
    
    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(tiktokShopOrders);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ count: totalCount }] = await countQuery;

    return {
      orders,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(orderId: string) {
    const [order] = await db
      .select()
      .from(tiktokShopOrders)
      .where(eq(tiktokShopOrders.id, orderId));

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, updates?: {
    trackingNumber?: string;
    shippingCarrier?: string;
    fulfillmentStatus?: string;
    notes?: string;
  }) {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add optional updates
    if (updates?.trackingNumber) {
      updateData.trackingNumber = updates.trackingNumber;
    }
    if (updates?.shippingCarrier) {
      updateData.shippingCarrier = updates.shippingCarrier;
    }
    if (updates?.fulfillmentStatus) {
      updateData.fulfillmentStatus = updates.fulfillmentStatus;
    }
    if (updates?.notes) {
      updateData.notes = updates.notes;
    }

    // Set fulfillment timestamps
    if (status === 'shipped') {
      updateData.shippedAt = new Date();
      updateData.fulfillmentStatus = 'shipped';
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.fulfillmentStatus = 'delivered';
    }

    const [updatedOrder] = await db
      .update(tiktokShopOrders)
      .set(updateData)
      .where(eq(tiktokShopOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    return updatedOrder;
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(orderIds: string[], updates: {
    status?: string;
    fulfillmentStatus?: string;
    tags?: string[];
  }) {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (updates.status) {
      updateData.status = updates.status;
    }
    if (updates.fulfillmentStatus) {
      updateData.fulfillmentStatus = updates.fulfillmentStatus;
    }
    if (updates.tags) {
      updateData.tags = updates.tags;
    }

    const results = await Promise.all(
      orderIds.map(orderId =>
        db.update(tiktokShopOrders)
          .set(updateData)
          .where(eq(tiktokShopOrders.id, orderId))
          .returning()
      )
    );

    return results.flat();
  }

  /**
   * Get order analytics for seller dashboard
   */
  async getOrderAnalytics(shopId?: string, days: number = 30): Promise<TikTokOrderAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let baseQuery = db.select().from(tiktokShopOrders);
    const conditions = [gte(tiktokShopOrders.orderDate, startDate)];

    if (shopId) {
      conditions.push(eq(tiktokShopOrders.shopId, shopId));
    }

    const orders = await baseQuery.where(and(...conditions));

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount.toString()), 0
    );

    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate recent growth (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousEndDate = new Date(startDate);

    let previousQuery = db.select().from(tiktokShopOrders);
    const previousConditions = [
      gte(tiktokShopOrders.orderDate, previousStartDate),
      lte(tiktokShopOrders.orderDate, previousEndDate)
    ];

    if (shopId) {
      previousConditions.push(eq(tiktokShopOrders.shopId, shopId));
    }

    const previousOrders = await previousQuery.where(and(...previousConditions));
    const previousRevenue = previousOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount.toString()), 0
    );

    const recentGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders: statusCounts.pending || 0,
      processingOrders: statusCounts.processing || 0,
      shippedOrders: statusCounts.shipped || 0,
      deliveredOrders: statusCounts.delivered || 0,
      cancelledOrders: statusCounts.cancelled || 0,
      averageOrderValue,
      recentGrowth
    };
  }

  /**
   * Get order status distribution for charts
   */
  async getOrderStatusDistribution(shopId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = db.select().from(tiktokShopOrders);
    const conditions = [gte(tiktokShopOrders.orderDate, startDate)];

    if (shopId) {
      conditions.push(eq(tiktokShopOrders.shopId, shopId));
    }

    const orders = await query.where(and(...conditions));

    const distribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: (count / orders.length) * 100
    }));
  }

  /**
   * Get daily order trends for analytics charts
   */
  async getDailyOrderTrends(shopId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = db.select().from(tiktokShopOrders);
    const conditions = [gte(tiktokShopOrders.orderDate, startDate)];

    if (shopId) {
      conditions.push(eq(tiktokShopOrders.shopId, shopId));
    }

    const orders = await query.where(and(...conditions));

    // Group orders by date
    const dailyData = orders.reduce((acc, order) => {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += parseFloat(order.totalAmount.toString());
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    // Convert to array format for charts
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const tiktokShopOrdersService = new TikTokShopOrdersService();