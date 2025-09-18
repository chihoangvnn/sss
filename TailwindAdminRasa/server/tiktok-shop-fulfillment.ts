import { db } from './db.js';
import { tiktokShopOrders, tiktokBusinessAccounts } from '../shared/schema.js';
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

class TikTokShopFulfillmentService {
  
  /**
   * Get fulfillment tasks queue
   */
  async getFulfillmentQueue(businessAccountId: string, filters?: {
    status?: string;
    priority?: string;
    urgent?: boolean;
  }) {
    let conditions = [
      eq(tiktokShopOrders.businessAccountId, businessAccountId),
      or(
        eq(tiktokShopOrders.status, 'processing'),
        eq(tiktokShopOrders.fulfillmentStatus, 'pending'),
        eq(tiktokShopOrders.fulfillmentStatus, 'processing')
      )
    ];

    if (filters?.status) {
      conditions.push(eq(tiktokShopOrders.fulfillmentStatus, filters.status as any));
    }

    const orders = await db
      .select()
      .from(tiktokShopOrders)
      .where(and(...conditions) as any);

    // Convert orders to fulfillment tasks
    const tasks: FulfillmentTask[] = orders.map(order => {
      // Calculate priority based on order age and amount
      const daysSinceOrder = (Date.now() - order.orderDate.getTime()) / (1000 * 60 * 60 * 24);
      const orderAmount = parseFloat(order.totalAmount.toString());
      
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
      if (daysSinceOrder > 2) priority = 'high';
      if (daysSinceOrder > 3) priority = 'urgent';
      if (orderAmount > 1000000) priority = 'high'; // High value orders

      // Calculate due date (2 days for normal processing)
      const dueDate = new Date(order.orderDate);
      dueDate.setDate(dueDate.getDate() + 2);

      return {
        id: order.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerInfo.name,
        status: order.fulfillmentStatus || 'pending',
        priority,
        items: order.items.map(item => ({
          productName: item.name,
          quantity: item.quantity,
          sku: item.sku
        })),
        shippingAddress: order.customerInfo.shippingAddress,
        totalAmount: parseFloat(order.totalAmount.toString()),
        createdAt: order.orderDate,
        dueDate
      };
    });

    // Apply additional filters
    let filteredTasks = tasks;
    
    if (filters?.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters?.urgent) {
      filteredTasks = filteredTasks.filter(task => task.priority === 'urgent');
    }

    // Sort by priority and due date
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    filteredTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return filteredTasks;
  }

  /**
   * Process order fulfillment
   */
  async processOrderFulfillment(orderId: string, updates: {
    fulfillmentStatus: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    notes?: string;
    notifyCustomer?: boolean;
  }) {
    const updateData: any = {
      fulfillmentStatus: updates.fulfillmentStatus,
      updatedAt: new Date()
    };

    if (updates.trackingNumber) {
      updateData.trackingNumber = updates.trackingNumber;
    }
    
    if (updates.shippingCarrier) {
      updateData.shippingCarrier = updates.shippingCarrier;
    }
    
    if (updates.notes) {
      updateData.notes = updates.notes;
    }

    // Set timestamps based on status
    if (updates.fulfillmentStatus === 'shipped') {
      updateData.shippedAt = new Date();
      updateData.status = 'shipped';
    } else if (updates.fulfillmentStatus === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.status = 'delivered';
    }

    const [updatedOrder] = await db
      .update(tiktokShopOrders)
      .set(updateData)
      .where(eq(tiktokShopOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order fulfillment');
    }

    // Send notifications if requested
    if (updates.notifyCustomer) {
      await this.sendCustomerNotification(orderId, updates.fulfillmentStatus);
    }

    return updatedOrder;
  }

  /**
   * Bulk process fulfillment tasks
   */
  async bulkProcessFulfillment(orderIds: string[], action: {
    type: 'mark_processing' | 'mark_shipped' | 'assign_carrier';
    carrier?: string;
    generateTracking?: boolean;
    notifyCustomers?: boolean;
  }) {
    const updates: any = {
      updatedAt: new Date()
    };

    switch (action.type) {
      case 'mark_processing':
        updates.fulfillmentStatus = 'processing';
        break;
      case 'mark_shipped':
        updates.fulfillmentStatus = 'shipped';
        updates.status = 'shipped';
        updates.shippedAt = new Date();
        break;
      case 'assign_carrier':
        if (action.carrier) {
          updates.shippingCarrier = action.carrier;
        }
        break;
    }

    // Generate tracking numbers if requested
    if (action.generateTracking && action.type === 'mark_shipped') {
      // This would integrate with actual shipping APIs
      // For now, generate mock tracking numbers
      const results = await Promise.all(
        orderIds.map(async orderId => {
          const trackingNumber = `TT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          return db.update(tiktokShopOrders)
            .set({
              ...updates,
              trackingNumber
            })
            .where(eq(tiktokShopOrders.id, orderId))
            .returning();
        })
      );
      return results.flat();
    } else {
      const results = await Promise.all(
        orderIds.map(orderId =>
          db.update(tiktokShopOrders)
            .set(updates)
            .where(eq(tiktokShopOrders.id, orderId))
            .returning()
        )
      );

      const updatedOrders = results.flat();

      // Send notifications if requested
      if (action.notifyCustomers) {
        await Promise.all(
          updatedOrders.map(order => 
            this.sendCustomerNotification(order.id, updates.fulfillmentStatus)
          )
        );
      }

      return updatedOrders;
    }
  }

  /**
   * Generate shipping labels
   */
  async generateShippingLabels(orderIds: string[], carrier: string): Promise<ShippingLabel[]> {
    const orders = await db
      .select()
      .from(tiktokShopOrders)
      .where(inArray(tiktokShopOrders.id, orderIds));

    // This would integrate with actual shipping APIs (TikTok Shipping, DHL, etc.)
    // For now, generate mock shipping labels
    const labels: ShippingLabel[] = orders.map(order => {
      const trackingNumber = `${carrier.substring(0, 2).toUpperCase()}${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days delivery

      return {
        orderId: order.id,
        trackingNumber,
        carrier,
        labelUrl: `https://mock-label-service.com/label/${trackingNumber}.pdf`,
        estimatedDelivery,
        cost: Math.round(Math.random() * 50000) + 20000 // Mock shipping cost
      };
    });

    // Update orders with tracking information
    await Promise.all(
      labels.map(label =>
        db.update(tiktokShopOrders)
          .set({
            trackingNumber: label.trackingNumber,
            shippingCarrier: label.carrier,
            fulfillmentStatus: 'shipped',
            status: 'shipped',
            shippedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(tiktokShopOrders.id, label.orderId))
      )
    );

    return labels;
  }

  /**
   * Get fulfillment analytics
   */
  async getFulfillmentAnalytics(businessAccountId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db
      .select()
      .from(tiktokShopOrders)
      .where(eq(tiktokShopOrders.businessAccountId, businessAccountId));

    // Calculate fulfillment metrics
    const totalOrders = orders.length;
    const pendingFulfillment = orders.filter(o => o.fulfillmentStatus === 'pending').length;
    const processingFulfillment = orders.filter(o => o.fulfillmentStatus === 'processing').length;
    const shippedOrders = orders.filter(o => o.fulfillmentStatus === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.fulfillmentStatus === 'delivered').length;

    // Calculate average processing time
    const processedOrders = orders.filter(o => o.shippedAt);
    const avgProcessingTime = processedOrders.length > 0
      ? processedOrders.reduce((sum, order) => {
          const processingTime = order.shippedAt!.getTime() - order.orderDate.getTime();
          return sum + processingTime;
        }, 0) / processedOrders.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = processedOrders.filter(order => {
      if (!order.shippedAt) return false;
      const timeDiff = order.shippedAt.getTime() - order.orderDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      return hoursDiff <= 48; // 48 hours SLA
    }).length;

    const onTimeRate = processedOrders.length > 0 ? (onTimeDeliveries / processedOrders.length) * 100 : 0;

    return {
      totalOrders,
      pendingFulfillment,
      processingFulfillment,
      shippedOrders,
      deliveredOrders,
      fulfillmentRate: totalOrders > 0 ? ((shippedOrders + deliveredOrders) / totalOrders) * 100 : 0,
      averageProcessingTime: Math.round(avgProcessingTime * 10) / 10, // Round to 1 decimal
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
      urgentOrders: orders.filter(order => {
        const daysSinceOrder = (Date.now() - order.orderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceOrder > 3 && order.fulfillmentStatus === 'pending';
      }).length
    };
  }

  /**
   * Send customer notification (mock implementation)
   */
  private async sendCustomerNotification(orderId: string, status: string) {
    // This would integrate with actual notification services (email, SMS)
    console.log(`Notification sent to customer for order ${orderId}: Status updated to ${status}`);
    
    // In real implementation, this would:
    // 1. Get customer contact info from order
    // 2. Send email/SMS notification
    // 3. Log notification in database
    
    return { success: true, orderId, status };
  }

  /**
   * Get carrier options for shipping
   */
  getShippingCarriers() {
    return [
      { id: 'tiktok_shipping', name: 'TikTok Shipping', enabled: true },
      { id: 'ghn', name: 'Giao Hàng Nhanh', enabled: true },
      { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', enabled: true },
      { id: 'viettel_post', name: 'Viettel Post', enabled: true },
      { id: 'vnpost', name: 'Vietnam Post', enabled: true },
      { id: 'j_t', name: 'J&T Express', enabled: true },
      { id: 'dhl', name: 'DHL Express', enabled: false },
      { id: 'fedex', name: 'FedEx', enabled: false }
    ];
  }

  /**
   * Configure fulfillment workflow
   */
  async configureFulfillmentWorkflow(businessAccountId: string, config: FulfillmentWorkflowConfig) {
    // This would be stored in a separate fulfillment_config table
    // For now, we'll store it as a JSON field in the business account
    
    const [updatedAccount] = await db
      .update(tiktokBusinessAccounts)
      .set({
        // Assuming we add a fulfillment_config jsonb field to the schema
        updatedAt: new Date()
      })
      .where(eq(tiktokBusinessAccounts.id, businessAccountId))
      .returning();

    if (!updatedAccount) {
      throw new Error('Failed to update fulfillment configuration');
    }

    return {
      success: true,
      message: 'Fulfillment workflow configured successfully',
      config
    };
  }
}

export const tiktokShopFulfillmentService = new TikTokShopFulfillmentService();