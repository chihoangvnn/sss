import { db } from './db.js';
import { shopeeShopOrders, shopeeBusinessAccounts } from '../shared/schema.js';
import { eq, desc, asc, and, gte, lte, ilike, or, count, sum } from 'drizzle-orm';

export interface ShopeeOrderFilter {
  orderStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  shopId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createTime' | 'totalAmount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ShopeeOrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  unpaidOrders: number;
  toShipOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  recentGrowth: number;
}

class ShopeeOrdersService {
  
  /**
   * Get filtered list of Shopee orders
   */
  async getOrders(filters: ShopeeOrderFilter) {
    const {
      orderStatus,
      startDate,
      endDate,
      search,
      shopId,
      limit = 50,
      offset = 0,
      sortBy = 'createTime',
      sortOrder = 'desc'
    } = filters;

    let query = db.select().from(shopeeShopOrders);
    const conditions = [];

    // Apply filters
    if (orderStatus) {
      conditions.push(eq(shopeeShopOrders.orderStatus, orderStatus as any));
    }
    
    if (startDate) {
      conditions.push(gte(shopeeShopOrders.createTime, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(shopeeShopOrders.createTime, new Date(endDate)));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(shopeeShopOrders.orderNumber, `%${search}%`),
          ilike(shopeeShopOrders.shopeeOrderId, `%${search}%`),
          ilike(shopeeShopOrders.orderSn, `%${search}%`)
        )
      );
    }
    
    if (shopId) {
      conditions.push(eq(shopeeShopOrders.shopId, shopId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    const sortColumn = sortBy === 'createTime' ? shopeeShopOrders.createTime
      : sortBy === 'totalAmount' ? shopeeShopOrders.totalAmount
      : shopeeShopOrders.updatedAt;
    
    query = query.orderBy(
      sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
    ) as any;

    // Apply pagination
    const orders = await query.limit(limit).offset(offset);
    
    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(shopeeShopOrders);
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
   * Get order analytics for a specific shop or all shops
   */
  async getOrderAnalytics(shopId?: string): Promise<ShopeeOrderAnalytics> {
    const baseQuery = db.select().from(shopeeShopOrders);
    const conditions = shopId ? [eq(shopeeShopOrders.shopId, shopId)] : [];
    
    // Get orders for current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const currentPeriodConditions = [
      ...conditions,
      gte(shopeeShopOrders.createTime, thirtyDaysAgo)
    ];

    // Get orders for previous period (30-60 days ago) for growth comparison
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const previousPeriodConditions = [
      ...conditions,
      and(
        gte(shopeeShopOrders.createTime, sixtyDaysAgo),
        lte(shopeeShopOrders.createTime, thirtyDaysAgo)
      )
    ];

    // Execute all analytics queries
    const [
      totalOrdersResult,
      totalRevenueResult,
      unpaidOrdersResult,
      toShipOrdersResult,
      shippedOrdersResult,
      completedOrdersResult,
      cancelledOrdersResult,
      currentPeriodResult,
      previousPeriodResult
    ] = await Promise.all([
      // Total orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
      
      // Total revenue
      db.select({ 
        total: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
      
      // Unpaid orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(and(...conditions, eq(shopeeShopOrders.orderStatus, 'unpaid'))),
      
      // To ship orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(and(...conditions, eq(shopeeShopOrders.orderStatus, 'to_ship'))),
      
      // Shipped orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(and(...conditions, eq(shopeeShopOrders.orderStatus, 'shipped'))),
      
      // Completed orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(and(...conditions, eq(shopeeShopOrders.orderStatus, 'completed'))),
      
      // Cancelled orders
      db.select({ count: count() })
        .from(shopeeShopOrders)
        .where(and(...conditions, eq(shopeeShopOrders.orderStatus, 'cancelled'))),
      
      // Current period orders (for growth calculation)
      db.select({ 
        count: count(),
        total: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(and(...currentPeriodConditions)),
      
      // Previous period orders (for growth comparison)
      db.select({ 
        count: count(),
        total: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(and(...previousPeriodConditions))
    ]);

    const totalOrders = totalOrdersResult[0]?.count || 0;
    const totalRevenue = parseFloat(totalRevenueResult[0]?.total?.toString() || '0');
    const currentRevenue = parseFloat(currentPeriodResult[0]?.total?.toString() || '0');
    const previousRevenue = parseFloat(previousPeriodResult[0]?.total?.toString() || '0');
    
    // Calculate growth percentage
    const recentGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      totalOrders,
      totalRevenue,
      unpaidOrders: unpaidOrdersResult[0]?.count || 0,
      toShipOrders: toShipOrdersResult[0]?.count || 0,
      shippedOrders: shippedOrdersResult[0]?.count || 0,
      completedOrders: completedOrdersResult[0]?.count || 0,
      cancelledOrders: cancelledOrdersResult[0]?.count || 0,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      recentGrowth
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const [order] = await db
      .select()
      .from(shopeeShopOrders)
      .where(eq(shopeeShopOrders.id, orderId));

    return order;
  }

  /**
   * Get order by Shopee order ID
   */
  async getOrderByShopeeId(shopeeOrderId: string) {
    const [order] = await db
      .select()
      .from(shopeeShopOrders)
      .where(eq(shopeeShopOrders.shopeeOrderId, shopeeOrderId));

    return order;
  }

  /**
   * Create or update order from Shopee API data
   */
  async upsertOrder(orderData: any, businessAccountId: string) {
    const orderExists = await this.getOrderByShopeeId(orderData.order_sn);
    
    const orderRecord = {
      shopeeOrderId: orderData.order_sn,
      orderSn: orderData.order_sn,
      shopId: orderData.shop_id || '',
      businessAccountId,
      orderNumber: orderData.order_sn, // Shopee uses order_sn as display number
      orderStatus: orderData.order_status,
      customerInfo: {
        buyerUserId: orderData.buyer_user_id,
        buyerUsername: orderData.buyer_username,
        recipientAddress: orderData.recipient_address
      },
      totalAmount: orderData.total_amount.toString(),
      currency: orderData.currency || 'VND',
      actualShippingFee: orderData.actual_shipping_fee?.toString() || '0',
      goodsToReceive: orderData.goods_to_receive?.toString() || '0',
      coinOffset: orderData.coin_offset?.toString() || '0',
      escrowAmount: orderData.escrow_amount?.toString() || '0',
      items: orderData.item_list || [],
      shippingCarrier: orderData.shipping_carrier,
      trackingNumber: orderData.tracking_number,
      shipTime: orderData.ship_time ? new Date(orderData.ship_time * 1000) : null,
      deliveryTime: orderData.delivery_time ? new Date(orderData.delivery_time * 1000) : null,
      paymentMethod: orderData.payment_method,
      creditCardNumber: orderData.credit_card_number_masked,
      dropshipper: orderData.dropshipper,
      dropshipperPhone: orderData.dropshipper_phone,
      splitUp: orderData.split_up || false,
      buyerCancelReason: orderData.buyer_cancel_reason,
      cancelBy: orderData.cancel_by,
      cancelReason: orderData.cancel_reason,
      shopeeFee: orderData.shopee_fee?.toString() || '0',
      transactionFee: orderData.transaction_fee?.toString() || '0',
      commissionFee: orderData.commission_fee?.toString() || '0',
      serviceFee: orderData.service_fee?.toString() || '0',
      createTime: new Date(orderData.create_time * 1000),
      updateTime: orderData.update_time ? new Date(orderData.update_time * 1000) : null,
      payTime: orderData.pay_time ? new Date(orderData.pay_time * 1000) : null
    };

    if (orderExists) {
      // Update existing order
      await db
        .update(shopeeShopOrders)
        .set({
          ...orderRecord,
          updatedAt: new Date()
        })
        .where(eq(shopeeShopOrders.shopeeOrderId, orderData.order_sn));
    } else {
      // Create new order
      await db.insert(shopeeShopOrders).values(orderRecord);
    }

    return orderRecord;
  }

  /**
   * Update order status (for fulfillment)
   */
  async updateOrderStatus(orderId: string, status: string, trackingInfo?: any) {
    const updateData: any = {
      orderStatus: status,
      updatedAt: new Date()
    };

    if (trackingInfo) {
      updateData.trackingNumber = trackingInfo.trackingNumber;
      updateData.shippingCarrier = trackingInfo.carrier;
      if (status === 'shipped') {
        updateData.shipTime = new Date();
      }
    }

    await db
      .update(shopeeShopOrders)
      .set(updateData)
      .where(eq(shopeeShopOrders.id, orderId));

    return this.getOrderById(orderId);
  }

  /**
   * Get orders by status for fulfillment queue
   */
  async getOrdersByStatus(status: string, shopId?: string) {
    const conditions = [eq(shopeeShopOrders.orderStatus, status as any)];
    
    if (shopId) {
      conditions.push(eq(shopeeShopOrders.shopId, shopId));
    }

    const orders = await db
      .select()
      .from(shopeeShopOrders)
      .where(and(...conditions))
      .orderBy(desc(shopeeShopOrders.createTime));

    return orders;
  }

  /**
   * Get daily order statistics for charts
   */
  async getDailyOrderStats(shopId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const conditions = [gte(shopeeShopOrders.createTime, startDate)];
    if (shopId) {
      conditions.push(eq(shopeeShopOrders.shopId, shopId));
    }

    const orders = await db
      .select({
        createTime: shopeeShopOrders.createTime,
        totalAmount: shopeeShopOrders.totalAmount
      })
      .from(shopeeShopOrders)
      .where(and(...conditions));

    // Group by date
    const dailyData = orders.reduce((acc, order) => {
      const date = order.createTime.toISOString().split('T')[0];
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

export const shopeeOrdersService = new ShopeeOrdersService();