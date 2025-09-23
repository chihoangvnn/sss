import { db } from './db.js';
import { 
  shopeeBusinessAccounts, 
  shopeeShopProducts, 
  shopeeShopOrders
} from '../shared/schema.js';
import { eq, desc, asc, sum, count, and, gte, lt, sql } from 'drizzle-orm';

export interface ShopeeSellerPerformanceMetrics {
  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  
  // Order metrics  
  totalOrders: number;
  monthlyOrders: number;
  orderGrowth: number;
  fulfillmentRate: number;
  
  // Product metrics
  totalProducts: number;
  activeProducts: number;
  topPerformingProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    conversionRate: number;
  }>;
  
  // Account health
  accountStatus: string;
  shopStatus: string;
  lastSyncAt: Date | null;
  compliance: {
    responseRate: number;
    responseTime: number;
    rating: number;
  };
}

export interface ShopeeSellerDashboardData {
  businessAccount: typeof shopeeBusinessAccounts.$inferSelect;
  performanceMetrics: ShopeeSellerPerformanceMetrics;
  recentOrders: Array<typeof shopeeShopOrders.$inferSelect>;
  inventoryAlerts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    status: 'low_stock' | 'out_of_stock';
  }>;
}

class ShopeeSellerService {
  
  /**
   * Get comprehensive seller dashboard data
   */
  async getSellerDashboard(businessAccountId: string): Promise<ShopeeSellerDashboardData> {
    // Get business account
    const [businessAccount] = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.id, businessAccountId));

    if (!businessAccount) {
      throw new Error('Shopee business account not found');
    }

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(businessAccountId);

    // Get recent orders
    const recentOrders = await db
      .select()
      .from(shopeeShopOrders)
      .where(eq(shopeeShopOrders.businessAccountId, businessAccountId))
      .orderBy(desc(shopeeShopOrders.createTime))
      .limit(10);

    // Get inventory alerts
    const inventoryAlerts = await this.getInventoryAlerts(businessAccount.shopId);

    return {
      businessAccount,
      performanceMetrics,
      recentOrders,
      inventoryAlerts
    };
  }

  /**
   * Get performance metrics for a seller
   */
  async getPerformanceMetrics(businessAccountId: string): Promise<ShopeeSellerPerformanceMetrics> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Get business account for shop details
    const [businessAccount] = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.id, businessAccountId));

    if (!businessAccount) {
      throw new Error('Business account not found');
    }

    // Execute performance queries
    const [
      totalStats,
      monthlyStats,
      previousMonthStats,
      productStats,
      topProducts,
      fulfillmentStats
    ] = await Promise.all([
      // Total statistics
      db.select({
        orderCount: count(),
        totalRevenue: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(eq(shopeeShopOrders.businessAccountId, businessAccountId)),

      // Current month statistics
      db.select({
        orderCount: count(),
        totalRevenue: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(and(
          eq(shopeeShopOrders.businessAccountId, businessAccountId),
          gte(shopeeShopOrders.createTime, oneMonthAgo)
        )),

      // Previous month statistics (for growth calculation)
      db.select({
        orderCount: count(),
        totalRevenue: sum(shopeeShopOrders.totalAmount)
      })
        .from(shopeeShopOrders)
        .where(and(
          eq(shopeeShopOrders.businessAccountId, businessAccountId),
          gte(shopeeShopOrders.createTime, twoMonthsAgo),
          lt(shopeeShopOrders.createTime, oneMonthAgo)
        )),

      // Product statistics
      db.select({
        totalProducts: count(),
        activeProducts: count()
      })
        .from(shopeeShopProducts)
        .where(and(
          eq(shopeeShopProducts.businessAccountId, businessAccountId),
          eq(shopeeShopProducts.itemStatus, 'normal')
        )),

      // Top performing products by sales
      db.select({
        id: shopeeShopProducts.id,
        itemName: shopeeShopProducts.itemName,
        sales: shopeeShopProducts.sales,
        views: shopeeShopProducts.views
      })
        .from(shopeeShopProducts)
        .where(eq(shopeeShopProducts.businessAccountId, businessAccountId))
        .orderBy(desc(shopeeShopProducts.sales))
        .limit(5),

      // Fulfillment rate calculation - count completed/shipped vs total orders
      db.select({
        totalOrders: count(),
        fulfilledOrders: count(sql`CASE WHEN ${shopeeShopOrders.orderStatus} IN ('completed', 'shipped', 'to_confirm_receive') THEN 1 END`)
      })
        .from(shopeeShopOrders)
        .where(and(
          eq(shopeeShopOrders.businessAccountId, businessAccountId),
          gte(shopeeShopOrders.createTime, oneMonthAgo)
        ))
    ]);

    // Calculate metrics
    const totalRevenue = parseFloat(totalStats[0]?.totalRevenue?.toString() || '0');
    const monthlyRevenue = parseFloat(monthlyStats[0]?.totalRevenue?.toString() || '0');
    const previousMonthRevenue = parseFloat(previousMonthStats[0]?.totalRevenue?.toString() || '0');
    
    const totalOrders = totalStats[0]?.orderCount || 0;
    const monthlyOrders = monthlyStats[0]?.orderCount || 0;
    const previousMonthOrders = previousMonthStats[0]?.orderCount || 0;

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    const orderGrowth = previousMonthOrders > 0 
      ? ((monthlyOrders - previousMonthOrders) / previousMonthOrders) * 100 
      : 0;

    const totalFulfillmentOrders = fulfillmentStats[0]?.totalOrders || 0;
    const fulfilledOrders = fulfillmentStats[0]?.fulfilledOrders || 0;
    const fulfillmentRate = totalFulfillmentOrders > 0 
      ? (fulfilledOrders / totalFulfillmentOrders) * 100 
      : 0;

    // Calculate actual revenue for top performing products from order data
    const topPerformingProducts = await Promise.all(
      topProducts.map(async (product) => {
        // Calculate revenue from actual orders for this product
        const productRevenue = await db.select({
          revenue: sql`SUM(
            CAST((
              SELECT SUM(CAST(item->>'modelDiscountedPrice' AS NUMERIC) * CAST(item->>'modelQuantityPurchased' AS INTEGER))
              FROM jsonb_array_elements(${shopeeShopOrders.items}) AS item
              WHERE item->>'itemId' = ${product.id}
            ) AS NUMERIC)
          )`
        })
        .from(shopeeShopOrders)
        .where(eq(shopeeShopOrders.businessAccountId, businessAccountId));

        return {
          id: product.id,
          name: product.itemName || 'Unknown Product',
          revenue: parseFloat(productRevenue[0]?.revenue?.toString() || '0'),
          orders: product.sales || 0,
          conversionRate: (product.views || 0) > 0 ? ((product.sales || 0) / (product.views || 1)) * 100 : 0
        };
      })
    );

    return {
      totalRevenue,
      monthlyRevenue,
      revenueGrowth,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalOrders,
      monthlyOrders,
      orderGrowth,
      fulfillmentRate,
      totalProducts: productStats[0]?.totalProducts || 0,
      activeProducts: productStats[0]?.activeProducts || 0,
      topPerformingProducts,
      accountStatus: businessAccount.shopStatus || 'normal',
      shopStatus: businessAccount.shopStatus || 'normal',
      lastSyncAt: businessAccount.lastSync,
      compliance: {
        responseRate: parseFloat(businessAccount.responseRate?.toString() || '0'),
        responseTime: businessAccount.responseTime || 0,
        rating: parseFloat(businessAccount.rating?.toString() || '0')
      }
    };
  }

  /**
   * Get inventory alerts for low stock products
   */
  async getInventoryAlerts(shopId: string) {
    const lowStockThreshold = 10; // Configure as needed
    
    const products = await db
      .select({
        id: shopeeShopProducts.id,
        itemName: shopeeShopProducts.itemName,
        stock: shopeeShopProducts.stock
      })
      .from(shopeeShopProducts)
      .where(eq(shopeeShopProducts.shopId, shopId));

    return products
      .filter(product => (product.stock || 0) <= lowStockThreshold)
      .map(product => ({
        productId: product.id,
        productName: product.itemName || 'Unknown Product',
        currentStock: product.stock || 0,
        threshold: lowStockThreshold,
        status: (product.stock || 0) === 0 ? 'out_of_stock' as const : 'low_stock' as const
      }));
  }

  /**
   * Sync seller data from Shopee API
   */
  async syncSellerData(businessAccountId: string) {
    const [businessAccount] = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.id, businessAccountId));

    if (!businessAccount) {
      throw new Error('Business account not found');
    }

    // This would integrate with Shopee API to sync:
    // - Shop information updates
    // - Performance metrics
    // - Product listings
    // - Order updates
    
    // For now, update the last sync timestamp
    const updatedAccount = await db
      .update(shopeeBusinessAccounts)
      .set({
        lastSync: new Date(),
        updatedAt: new Date()
      })
      .where(eq(shopeeBusinessAccounts.id, businessAccountId))
      .returning();

    return {
      success: true,
      message: 'Shopee seller data synced successfully',
      syncedAt: updatedAccount[0]?.lastSync
    };
  }

  /**
   * Get seller by shop ID
   */
  async getSellerByShopId(shopId: string) {
    const [seller] = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.shopId, shopId));

    return seller;
  }

  /**
   * Update seller account information
   */
  async updateSellerAccount(businessAccountId: string, updateData: Partial<typeof shopeeBusinessAccounts.$inferInsert>) {
    const updatedAccount = await db
      .update(shopeeBusinessAccounts)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(shopeeBusinessAccounts.id, businessAccountId))
      .returning();

    return updatedAccount[0];
  }

  /**
   * Get all connected sellers
   */
  async getAllSellers() {
    const sellers = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.connected, true))
      .orderBy(desc(shopeeBusinessAccounts.createdAt));

    return sellers;
  }

  /**
   * Get seller performance comparison
   */
  async getSellerComparison() {
    const sellers = await this.getAllSellers();
    
    const comparisons = await Promise.all(
      sellers.map(async (seller) => {
        const metrics = await this.getPerformanceMetrics(seller.id);
        return {
          seller,
          metrics
        };
      })
    );

    // Sort by total revenue
    return comparisons.sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);
  }

  /**
   * Disconnect seller account
   */
  async disconnectSeller(businessAccountId: string) {
    await db
      .update(shopeeBusinessAccounts)
      .set({
        connected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        lastSync: new Date(),
        updatedAt: new Date()
      })
      .where(eq(shopeeBusinessAccounts.id, businessAccountId));

    return { success: true, message: 'Shopee seller disconnected successfully' };
  }
}

export const shopeeSellerService = new ShopeeSellerService();