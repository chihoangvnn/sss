import { db } from './db.js';
import { shopeeShopOrders, shopeeBusinessAccounts } from '../shared/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';

export interface FulfillmentWorkflowConfig {
  autoProcessing: boolean;
  autoShipping: boolean;
  shippingCarriers: string[];
  defaultCarrier: string;
  trackingRequired: boolean;
  notificationSettings: {
    emailCustomer: boolean;
    emailSeller: boolean;
    smsCustomer: boolean;
  };
}

export interface ShippingLabel {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  labelUrl: string;
  estimatedDelivery: Date;
  cost: number;
}

export interface FulfillmentTask {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
  }>;
  shippingAddress: any;
  totalAmount: number;
  createdAt: Date;
  dueDate: Date;
}

class ShopeeFulfillmentService {
  
  /**
   * Get fulfillment tasks queue for Shopee
   */
  async getFulfillmentQueue(businessAccountId: string, filters?: {
    status?: string;
    priority?: string;
    urgent?: boolean;
  }) {
    let conditions = [
      eq(shopeeShopOrders.businessAccountId, businessAccountId),
      or(
        eq(shopeeShopOrders.orderStatus, 'to_ship'),
        eq(shopeeShopOrders.orderStatus, 'shipped'),
        eq(shopeeShopOrders.orderStatus, 'to_confirm_receive')
      )
    ];

    if (filters?.status) {
      conditions.push(eq(shopeeShopOrders.orderStatus, filters.status as any));
    }

    const orders = await db
      .select()
      .from(shopeeShopOrders)
      .where(and(...conditions) as any);

    // Convert orders to fulfillment tasks
    const tasks: FulfillmentTask[] = orders.map(order => {
      // Calculate priority based on order age and amount
      const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderAge = Date.now() - createdAt.getTime();
      const hoursOld = orderAge / (1000 * 60 * 60);
      
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
      if (Number(order.totalAmount) > 1000000) priority = 'high'; // High value orders
      if (hoursOld > 48) priority = 'urgent'; // Orders older than 48 hours
      if (Number(order.totalAmount) < 200000) priority = 'low'; // Low value orders
      
      // Calculate due date (72 hours from order creation)
      const dueDate = new Date(createdAt);
      dueDate.setHours(dueDate.getHours() + 72);
      
      return {
        id: order.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerInfo?.buyerUsername || 'Unknown Customer',
        status: this.mapOrderStatusToFulfillmentStatus(order.orderStatus, order.trackingNumber || undefined),
        priority,
        items: this.mapOrderItems(order.items || []),
        shippingAddress: order.customerInfo?.recipientAddress || {},
        totalAmount: Number(order.totalAmount),
        trackingNumber: order.trackingNumber,
        shippingCarrier: order.shippingCarrier,
        createdAt,
        dueDate
      };
    });

    // Sort by priority and due date
    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  /**
   * Get fulfillment statistics
   */
  async getFulfillmentStats(businessAccountId: string) {
    const allOrders = await db
      .select()
      .from(shopeeShopOrders)
      .where(eq(shopeeShopOrders.businessAccountId, businessAccountId));

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      pendingTasks: allOrders.filter(o => 
        o.orderStatus === 'unpaid' || o.orderStatus === 'to_ship'
      ).length,
      
      shippedTasks: allOrders.filter(o => 
        o.orderStatus === 'shipped' || o.orderStatus === 'to_confirm_receive'
      ).length,
      
      completedTasks: allOrders.filter(o => 
        o.orderStatus === 'completed'
      ).length,
      
      efficiency: this.calculateEfficiencyRate(allOrders, last30Days)
    };

    return stats;
  }

  /**
   * Update fulfillment task status
   */
  async updateTaskStatus(taskId: string, status: string, updates?: any) {
    const updateData: any = {
      orderStatus: this.mapFulfillmentStatusToOrderStatus(status),
      updatedAt: new Date()
    };

    if (updates?.trackingNumber) {
      updateData.trackingNumber = updates.trackingNumber;
    }
    if (updates?.shippingCarrier) {
      updateData.shippingCarrier = updates.shippingCarrier;
    }
    if (updates?.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(updates.estimatedDelivery);
    }

    // Additional updates based on status
    if (status === 'shipped') {
      updateData.orderStatus = 'shipped';
    } else if (status === 'delivered') {
      updateData.orderStatus = 'completed';
    } else if (status === 'processing') {
      updateData.orderStatus = 'to_ship';
    }

    const result = await db
      .update(shopeeShopOrders)
      .set(updateData)
      .where(eq(shopeeShopOrders.id, taskId))
      .returning();

    return result[0];
  }

  /**
   * Generate shipping label for Shopee order
   */
  async generateShippingLabel(taskId: string): Promise<ShippingLabel> {
    const order = await db
      .select()
      .from(shopeeShopOrders)
      .where(eq(shopeeShopOrders.id, taskId))
      .limit(1);

    if (!order.length) {
      throw new Error('Order not found');
    }

    const orderData = order[0];

    // Mock shipping label generation (integrate with actual Shopee API)
    const mockLabel: ShippingLabel = {
      orderId: taskId,
      trackingNumber: `SPE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      carrier: orderData.shippingCarrier || 'Shopee Express',
      labelUrl: `/api/shopee-shop/labels/${taskId}.pdf`,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      cost: this.calculateShippingCost(Number(orderData.totalAmount), orderData.customerInfo?.recipientAddress)
    };

    // Update order with tracking info
    await this.updateTaskStatus(taskId, 'ready_to_ship', {
      trackingNumber: mockLabel.trackingNumber,
      shippingCarrier: mockLabel.carrier
    });

    return mockLabel;
  }

  /**
   * Get recommended shipping carriers for address
   */
  async getRecommendedCarriers(address: any) {
    // Shopee specific shipping carriers
    return [
      { id: 'shopee_express', name: 'Shopee Express', estimatedDays: 2, cost: 15000 },
      { id: 'ghn', name: 'Giao Hàng Nhanh', estimatedDays: 1, cost: 20000 },
      { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', estimatedDays: 3, cost: 12000 },
      { id: 'viettel_post', name: 'Viettel Post', estimatedDays: 2, cost: 18000 },
      { id: 'j_t', name: 'J&T Express', estimatedDays: 2, cost: 17000 }
    ].sort((a, b) => a.cost - b.cost); // Sort by cost
  }

  /**
   * Batch process multiple orders
   */
  async batchProcessOrders(orderIds: string[], action: string) {
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        let result;
        switch (action) {
          case 'mark_processing':
            result = await this.updateTaskStatus(orderId, 'processing');
            break;
          case 'mark_shipped':
            result = await this.updateTaskStatus(orderId, 'shipped');
            break;
          case 'mark_delivered':
            result = await this.updateTaskStatus(orderId, 'delivered');
            break;
          case 'generate_labels':
            result = await this.generateShippingLabel(orderId);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push({ orderId, success: true, data: result });
      } catch (error) {
        results.push({ 
          orderId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get fulfillment workflow configuration
   */
  async getWorkflowConfig(businessAccountId: string): Promise<FulfillmentWorkflowConfig> {
    // Default Shopee fulfillment configuration
    return {
      autoProcessing: false,
      autoShipping: false,
      shippingCarriers: ['shopee_express', 'ghn', 'ghtk', 'viettel_post', 'j_t'],
      defaultCarrier: 'shopee_express',
      trackingRequired: true,
      notificationSettings: {
        emailCustomer: true,
        emailSeller: true,
        smsCustomer: false
      }
    };
  }

  /**
   * Update workflow configuration
   */
  async updateWorkflowConfig(businessAccountId: string, config: Partial<FulfillmentWorkflowConfig>) {
    // Store configuration in database or cache
    // For now, return the updated config
    const currentConfig = await this.getWorkflowConfig(businessAccountId);
    return { ...currentConfig, ...config };
  }

  // Private helper methods
  private mapOrderStatusToFulfillmentStatus(orderStatus: string, trackingNumber?: string): 'pending' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed' {
    // Smart mapping: to_ship with tracking = ready_to_ship, without tracking = processing
    if (orderStatus === 'to_ship') {
      return trackingNumber ? 'ready_to_ship' : 'processing';
    }
    
    const statusMap: Record<string, 'pending' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'failed'> = {
      'unpaid': 'pending',
      'shipped': 'shipped',
      'to_confirm_receive': 'delivered',
      'completed': 'delivered',
      'cancelled': 'failed',
      'to_return': 'failed',
      'in_cancel': 'failed'
    };
    return statusMap[orderStatus] || 'pending';
  }

  private mapFulfillmentStatusToOrderStatus(fulfillmentStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'unpaid',
      'processing': 'to_ship',
      'ready_to_ship': 'to_ship', 
      'shipped': 'shipped',
      'delivered': 'completed',
      'failed': 'cancelled'
    };
    return statusMap[fulfillmentStatus] || 'unpaid';
  }

  private mapOrderItems(items: any[]): { productName: string; quantity: number; sku: string; }[] {
    return items.map(item => ({
      productName: item.itemName || item.item_name || 'Unknown Product',
      quantity: item.modelQuantityPurchased || item.quantity || 1,
      sku: item.itemSku || item.item_sku || item.modelSku || 'NO-SKU'
    }));
  }

  private calculateEfficiencyRate(orders: any[], since: Date): number {
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= since);
    if (recentOrders.length === 0) return 100;
    
    const completedOnTime = recentOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const completedDate = o.deliveredAt ? new Date(o.deliveredAt) : null;
      const expectedDelivery = new Date(orderDate.getTime() + 72 * 60 * 60 * 1000); // 72 hours
      
      return completedDate && completedDate <= expectedDelivery;
    });

    return Math.round((completedOnTime.length / recentOrders.length) * 100);
  }

  private calculateShippingCost(orderAmount: number, address: any): number {
    // Base Shopee shipping cost calculation
    let baseCost = 15000; // Base cost in VND
    
    // Distance factor (simplified)
    if (address?.city !== 'Ho Chi Minh City') {
      baseCost += 5000;
    }
    
    // Weight factor (estimated from order amount)
    if (orderAmount > 500000) {
      baseCost += 10000; // Heavy item surcharge
    }
    
    return baseCost;
  }
}

export const shopeeFulfillmentService = new ShopeeFulfillmentService();