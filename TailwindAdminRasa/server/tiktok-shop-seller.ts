import { db } from './db.js';
import { 
  tiktokBusinessAccounts, 
  tiktokShopProducts, 
  tiktokShopOrders, 
  tiktokVideos 
} from '../shared/schema.js';
import { eq, desc, asc, sum, count, and, gte, lt } from 'drizzle-orm';

export interface SellerPerformanceMetrics {
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
  
  // Video performance
  totalVideos: number;
  totalViews: number;
  totalEngagement: number;
  topPerformingVideos: Array<{
    id: string;
    caption: string;
    views: number;
    engagement: number;
    salesGenerated: number;
  }>;
  
  // Account health
  accountStatus: string;
  shopStatus: string;
  lastSyncAt: Date | null;
  compliance: {
    shippingPerformance: number;
    customerSatisfaction: number;
    policyCompliance: number;
  };
}

export interface SellerDashboardData {
  businessAccount: typeof tiktokBusinessAccounts.$inferSelect;
  performanceMetrics: SellerPerformanceMetrics;
  recentOrders: Array<typeof tiktokShopOrders.$inferSelect>;
  inventoryAlerts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    status: 'low_stock' | 'out_of_stock';
  }>;
}

class TikTokShopSellerService {
  
  /**
   * Get comprehensive seller dashboard data
   */
  async getSellerDashboard(businessAccountId: string): Promise<SellerDashboardData> {
    // Get business account
    const [businessAccount] = await db
      .select()
      .from(tiktokBusinessAccounts)
      .where(eq(tiktokBusinessAccounts.id, businessAccountId));

    if (!businessAccount) {
      throw new Error('Business account not found');
    }

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(businessAccountId);

    // Get recent orders
    const recentOrders = await db
      .select()
      .from(tiktokShopOrders)
      .where(eq(tiktokShopOrders.businessAccountId, businessAccountId))
      .orderBy(desc(tiktokShopOrders.orderDate))
      .limit(10);

    // Get inventory alerts
    const inventoryAlerts = await this.getInventoryAlerts(businessAccountId);

    return {
      businessAccount,
      performanceMetrics,
      recentOrders,
      inventoryAlerts
    };
  }

  /**
   * Get detailed performance metrics for seller
   */
  async getPerformanceMetrics(businessAccountId: string): Promise<SellerPerformanceMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get current month orders
    const currentOrders = await db
      .select()
      .from(tiktokShopOrders)
      .where(
        and(
          eq(tiktokShopOrders.businessAccountId, businessAccountId),
          gte(tiktokShopOrders.orderDate, thirtyDaysAgo)
        )
      );

    // Get previous month orders for comparison (30-60 days ago)
    const previousOrders = await db
      .select()
      .from(tiktokShopOrders)
      .where(
        and(
          eq(tiktokShopOrders.businessAccountId, businessAccountId),
          gte(tiktokShopOrders.orderDate, sixtyDaysAgo),
          lt(tiktokShopOrders.orderDate, thirtyDaysAgo)
        )
      );

    // Get all orders for total metrics
    const allOrders = await db
      .select()
      .from(tiktokShopOrders)
      .where(eq(tiktokShopOrders.businessAccountId, businessAccountId));

    // Calculate revenue metrics
    const currentRevenue = currentOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount.toString()), 0
    );
    
    const previousRevenue = previousOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount.toString()), 0
    );
    
    const totalRevenue = allOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount.toString()), 0
    );

    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Calculate order metrics
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    const totalOrderCount = allOrders.length;
    
    const orderGrowth = previousOrderCount > 0 
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
      : 0;

    const averageOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

    // Calculate fulfillment rate
    const deliveredOrders = allOrders.filter(order => 
      order.status === 'delivered'
    ).length;
    const fulfillmentRate = totalOrderCount > 0 ? (deliveredOrders / totalOrderCount) * 100 : 0;

    // Get product metrics
    const products = await db
      .select()
      .from(tiktokShopProducts)
      .where(eq(tiktokShopProducts.businessAccountId, businessAccountId));

    const activeProducts = products.filter(p => p.tiktokStatus === 'active').length;

    // Get top performing products
    const topPerformingProducts = products
      .sort((a, b) => parseFloat((b.revenue || '0').toString()) - parseFloat((a.revenue || '0').toString()))
      .slice(0, 5)
      .map(product => ({
        id: product.id,
        name: product.tiktokTitle || 'Untitled Product',
        revenue: parseFloat((product.revenue || '0').toString()),
        orders: product.orders || 0,
        conversionRate: parseFloat((product.conversionRate || '0').toString())
      }));

    // Get video metrics
    const videos = await db
      .select()
      .from(tiktokVideos)
      .where(eq(tiktokVideos.businessAccountId, businessAccountId));

    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalEngagement = videos.reduce((sum, video) => sum + (video.likes || 0) + (video.comments || 0) + (video.shares || 0), 0);

    // Get top performing videos
    const topPerformingVideos = videos
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(video => ({
        id: video.id,
        caption: video.caption || 'No caption',
        views: video.views || 0,
        engagement: (video.likes || 0) + (video.comments || 0) + (video.shares || 0),
        salesGenerated: parseFloat((video.salesFromVideo || '0').toString())
      }));

    // Get business account details for status
    const [businessAccount] = await db
      .select()
      .from(tiktokBusinessAccounts)
      .where(eq(tiktokBusinessAccounts.id, businessAccountId));

    return {
      totalRevenue,
      monthlyRevenue: currentRevenue,
      revenueGrowth,
      averageOrderValue,
      
      totalOrders: totalOrderCount,
      monthlyOrders: currentOrderCount,
      orderGrowth,
      fulfillmentRate,
      
      totalProducts: products.length,
      activeProducts,
      topPerformingProducts,
      
      totalVideos: videos.length,
      totalViews,
      totalEngagement,
      topPerformingVideos,
      
      accountStatus: businessAccount?.connected ? 'connected' : 'disconnected',
      shopStatus: businessAccount?.shopStatus || 'not_connected',
      lastSyncAt: businessAccount?.lastSync || null,
      compliance: {
        shippingPerformance: 95, // Mock data - would come from TikTok API
        customerSatisfaction: 4.8, // Mock data - would come from TikTok API
        policyCompliance: 98 // Mock data - would come from TikTok API
      }
    };
  }

  /**
   * Get inventory alerts for low stock products
   */
  async getInventoryAlerts(businessAccountId: string) {
    const products = await db
      .select()
      .from(tiktokShopProducts)
      .where(eq(tiktokShopProducts.businessAccountId, businessAccountId));

    const alerts = products
      .filter(product => {
        const stock = product.tiktokStock || 0;
        return stock <= 10; // Alert threshold
      })
      .map(product => ({
        productId: product.id,
        productName: product.tiktokTitle || 'Untitled Product',
        currentStock: product.tiktokStock || 0,
        threshold: 10,
        status: (product.tiktokStock || 0) === 0 ? 'out_of_stock' as const : 'low_stock' as const
      }));

    return alerts;
  }

  /**
   * Update seller business information
   */
  async updateBusinessInfo(businessAccountId: string, updates: {
    displayName?: string;
    description?: string;
    website?: string;
    industry?: string;
  }) {
    const [updatedAccount] = await db
      .update(tiktokBusinessAccounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tiktokBusinessAccounts.id, businessAccountId))
      .returning();

    if (!updatedAccount) {
      throw new Error('Failed to update business information');
    }

    return updatedAccount;
  }

  /**
   * Sync seller data with TikTok API
   */
  async syncSellerData(businessAccountId: string) {
    // This would integrate with actual TikTok APIs
    // For now, we'll update the lastSync timestamp
    
    const [updatedAccount] = await db
      .update(tiktokBusinessAccounts)
      .set({
        lastSync: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tiktokBusinessAccounts.id, businessAccountId))
      .returning();

    if (!updatedAccount) {
      throw new Error('Failed to sync seller data');
    }

    return {
      success: true,
      message: 'Seller data synced successfully',
      syncedAt: updatedAccount.lastSync
    };
  }

  /**
   * Get seller revenue trends for analytics charts
   */
  async getRevenueTrends(businessAccountId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db
      .select()
      .from(tiktokShopOrders)
      .where(
        and(
          eq(tiktokShopOrders.businessAccountId, businessAccountId),
          gte(tiktokShopOrders.orderDate, startDate)
        )
      )
      .orderBy(asc(tiktokShopOrders.orderDate));

    // Group by date
    const dailyRevenue = orders.reduce((acc, order) => {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += parseFloat(order.totalAmount.toString());
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const tiktokShopSellerService = new TikTokShopSellerService();