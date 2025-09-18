import { storage } from '../storage';
import { db } from '../db';
import { orders, orderItems } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import type { StorefrontOrder, TikTokShopOrder, InsertOrder, Order } from '../../shared/schema';

/**
 * 🚀 Unified Order Sync Service
 * Syncs orders from all sources (Storefront, TikTok Shop, Landing Pages) to main orders table
 */

export class OrderSyncService {
  
  /**
   * 🏪 Sync Storefront Orders to Main Orders
   * Transforms storefront orders into main order format with proper source tracking
   */
  async syncStorefrontOrders(): Promise<{
    synced: number;
    errors: string[];
    newOrders: string[];
  }> {
    const results = {
      synced: 0,
      errors: [] as string[],
      newOrders: [] as string[]
    };

    try {
      // Get all unsynced storefront orders
      const storefrontOrders = await storage.getStorefrontOrders();
      
      if (!storefrontOrders.length) {
        console.log('📦 No storefront orders found to sync');
        return results;
      }

      for (const storefrontOrder of storefrontOrders) {
        try {
          // Check if already synced to main orders
          const existingSyncedOrder = await this.findOrderBySourceId('storefront', storefrontOrder.id);
          
          if (existingSyncedOrder) {
            console.log(`⏭️  Storefront order ${storefrontOrder.id} already synced`);
            continue;
          }

          // Find or create customer from storefront order customer info
          let customerId = await this.findOrCreateCustomerFromStorefrontOrder(storefrontOrder);
          
          // Transform storefront order to main order format
          const mainOrderData: InsertOrder = {
            customerId: customerId,
            total: storefrontOrder.total.toString(),
            status: this.mapStorefrontStatusToMainStatus(storefrontOrder.status),
            items: storefrontOrder.quantity,
            
            // 🚀 Source Tracking
            source: 'storefront',
            sourceOrderId: storefrontOrder.id,
            sourceReference: storefrontOrder.storefrontConfigId, // Reference to storefront config
            
            // 🔄 Sync Metadata
            syncStatus: 'synced',
            syncData: {
              lastSyncAt: new Date().toISOString(),
              syncErrors: [],
              sourceData: {
                originalOrder: storefrontOrder,
                deliveryType: storefrontOrder.deliveryType,
                notes: storefrontOrder.notes
              }
            },
            
            // 📞 Original Customer Info
            sourceCustomerInfo: {
              name: storefrontOrder.customerName,
              email: storefrontOrder.customerEmail || undefined,
              phone: storefrontOrder.customerPhone,
              address: storefrontOrder.customerAddress || undefined,
              originalCustomerId: 'storefront-' + storefrontOrder.id
            }
          };

          // 🔒 CRITICAL: Use transactional upsert to handle unique constraint
          const newOrder = await this.upsertOrderWithTransaction(mainOrderData);
          
          // Create order items if product exists
          if (storefrontOrder.productId) {
            try {
              await storage.createOrderItem({
                orderId: newOrder.id,
                productId: storefrontOrder.productId,
                quantity: storefrontOrder.quantity,
                price: storefrontOrder.price.toString()
              });
            } catch (itemError) {
              console.warn(`⚠️ Could not create order item for storefront order ${storefrontOrder.id}:`, itemError);
              // Continue with order creation even if item creation fails
            }
          }

          results.synced++;
          results.newOrders.push(newOrder.id);
          
          console.log(`✅ Synced storefront order ${storefrontOrder.id} → main order ${newOrder.id}`);
          
        } catch (orderError) {
          const errorMsg = `Failed to sync storefront order ${storefrontOrder.id}: ${orderError}`;
          console.error('❌', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(`🎉 Storefront sync complete: ${results.synced} orders synced, ${results.errors.length} errors`);
      return results;

    } catch (error) {
      console.error('💥 Storefront sync service error:', error);
      results.errors.push(`Storefront sync service error: ${error}`);
      return results;
    }
  }

  /**
   * 🎵 Sync TikTok Shop Orders to Main Orders  
   * Transforms TikTok shop orders into main order format with proper source tracking
   */
  async syncTikTokShopOrders(): Promise<{
    synced: number;
    errors: string[];
    newOrders: string[];
  }> {
    const results = {
      synced: 0,
      errors: [] as string[],
      newOrders: [] as string[]
    };

    try {
      // Get all TikTok shop orders - we'll implement the storage method if needed
      const tiktokOrders = await this.getTikTokShopOrders();
      
      if (!tiktokOrders.length) {
        console.log('🎵 No TikTok shop orders found to sync');
        return results;
      }

      for (const tiktokOrder of tiktokOrders) {
        try {
          // Check if already synced to main orders
          const existingSyncedOrder = await this.findOrderBySourceId('tiktok-shop', tiktokOrder.id);
          
          if (existingSyncedOrder) {
            console.log(`⏭️  TikTok order ${tiktokOrder.tiktokOrderId} already synced`);
            continue;
          }

          // Find or create customer from TikTok order customer info
          let customerId = await this.findOrCreateCustomerFromTikTokOrder(tiktokOrder);
          
          // Transform TikTok order to main order format
          const mainOrderData: InsertOrder = {
            customerId: customerId,
            total: tiktokOrder.totalAmount.toString(),
            status: this.mapTikTokStatusToMainStatus(tiktokOrder.status),
            items: tiktokOrder.items?.length || 1,
            
            // 🚀 Source Tracking
            source: 'tiktok-shop',
            sourceOrderId: tiktokOrder.id,
            sourceReference: tiktokOrder.shopId, // TikTok Shop ID
            
            // 🔄 Sync Metadata
            syncStatus: 'synced',
            syncData: {
              lastSyncAt: new Date().toISOString(),
              syncErrors: [],
              sourceData: {
                originalOrder: tiktokOrder,
                tiktokOrderId: tiktokOrder.tiktokOrderId,
                orderNumber: tiktokOrder.orderNumber,
                fulfillmentStatus: tiktokOrder.fulfillmentStatus,
                paymentMethod: tiktokOrder.paymentMethod,
                tiktokFees: tiktokOrder.tiktokFees
              }
            },
            
            // 📞 Original Customer Info
            sourceCustomerInfo: {
              name: tiktokOrder.customerInfo?.name,
              email: tiktokOrder.customerInfo?.email,
              phone: tiktokOrder.customerInfo?.phone,
              address: JSON.stringify(tiktokOrder.customerInfo?.shippingAddress),
              originalCustomerId: tiktokOrder.customerInfo?.id
            }
          };

          // 🔒 CRITICAL: Use transactional upsert to handle unique constraint
          const newOrder = await this.upsertOrderWithTransaction(mainOrderData);
          
          // Create order items for TikTok products
          if (tiktokOrder.items && tiktokOrder.items.length > 0) {
            for (const item of tiktokOrder.items) {
              try {
                // Try to find matching product by name or SKU
                const product = await this.findProductBySkuOrName(item.sku, item.name);
                
                if (product) {
                  await storage.createOrderItem({
                    orderId: newOrder.id,
                    productId: product.id,
                    quantity: item.quantity,
                    price: item.unitPrice.toString()
                  });
                } else {
                  console.warn(`⚠️ Could not find matching product for TikTok item: ${item.name} (${item.sku})`);
                }
              } catch (itemError) {
                console.warn(`⚠️ Could not create order item for TikTok order ${tiktokOrder.id}:`, itemError);
              }
            }
          }

          results.synced++;
          results.newOrders.push(newOrder.id);
          
          console.log(`✅ Synced TikTok order ${tiktokOrder.tiktokOrderId} → main order ${newOrder.id}`);
          
        } catch (orderError) {
          const errorMsg = `Failed to sync TikTok order ${tiktokOrder.tiktokOrderId}: ${orderError}`;
          console.error('❌', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(`🎉 TikTok sync complete: ${results.synced} orders synced, ${results.errors.length} errors`);
      return results;

    } catch (error) {
      console.error('💥 TikTok sync service error:', error);
      results.errors.push(`TikTok sync service error: ${error}`);
      return results;
    }
  }

  /**
   * 🔍 Helper: Find order by source ID to prevent duplicates
   */
  private async findOrderBySourceId(source: string, sourceOrderId: string): Promise<Order | null> {
    try {
      // This would require a custom storage method - we'll add it
      const orders = await storage.getOrders();
      return orders.find(order => 
        (order as any).source === source && 
        (order as any).sourceOrderId === sourceOrderId
      ) || null;
    } catch (error) {
      console.warn('Could not check for existing synced order:', error);
      return null;
    }
  }

  /**
   * 👤 Helper: Find or create customer from storefront order
   */
  private async findOrCreateCustomerFromStorefrontOrder(storefrontOrder: StorefrontOrder): Promise<string> {
    try {
      // Try to find existing customer by email or phone
      const customers = await storage.getCustomers();
      const existingCustomer = customers.find(customer => 
        (storefrontOrder.customerEmail && customer.email === storefrontOrder.customerEmail) ||
        (storefrontOrder.customerPhone && customer.phone === storefrontOrder.customerPhone)
      );

      if (existingCustomer) {
        return existingCustomer.id;
      }

      // Create new customer
      const newCustomer = await storage.createCustomer({
        name: storefrontOrder.customerName,
        email: storefrontOrder.customerEmail || `storefront-${Date.now()}@guest.local`,
        phone: storefrontOrder.customerPhone,
        status: 'active'
      });

      return newCustomer.id;
    } catch (error) {
      console.error('Error finding/creating customer from storefront order:', error);
      throw error;
    }
  }

  /**
   * 👤 Helper: Find or create customer from TikTok order
   */
  private async findOrCreateCustomerFromTikTokOrder(tiktokOrder: TikTokShopOrder): Promise<string> {
    try {
      const customers = await storage.getCustomers();
      const existingCustomer = customers.find(customer => 
        (tiktokOrder.customerInfo?.email && customer.email === tiktokOrder.customerInfo.email) ||
        (tiktokOrder.customerInfo?.phone && customer.phone === tiktokOrder.customerInfo.phone)
      );

      if (existingCustomer) {
        return existingCustomer.id;
      }

      // Create new customer
      const newCustomer = await storage.createCustomer({
        name: tiktokOrder.customerInfo?.name || 'TikTok Customer',
        email: tiktokOrder.customerInfo?.email || `tiktok-${tiktokOrder.customerInfo?.id}-${Date.now()}@guest.local`,
        phone: tiktokOrder.customerInfo?.phone,
        status: 'active'
      });

      return newCustomer.id;
    } catch (error) {
      console.error('Error finding/creating customer from TikTok order:', error);
      throw error;
    }
  }

  /**
   * 🔄 Helper: Map storefront status to main order status  
   */
  private mapStorefrontStatusToMainStatus(storefrontStatus: string): "pending" | "processing" | "shipped" | "delivered" | "cancelled" {
    const statusMap: Record<string, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
      'pending': 'pending',
      'confirmed': 'processing', 
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    
    return statusMap[storefrontStatus] || 'pending';
  }

  /**
   * 🔄 Helper: Map TikTok status to main order status
   */
  private mapTikTokStatusToMainStatus(tiktokStatus: string): "pending" | "processing" | "shipped" | "delivered" | "cancelled" {
    const statusMap: Record<string, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
      'pending': 'pending',
      'processing': 'processing',
      'shipped': 'shipped', 
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'cancelled'
    };
    
    return statusMap[tiktokStatus] || 'pending';
  }

  /**
   * 🛍️ Helper: Get TikTok shop orders (wrapper for future implementation)
   */
  private async getTikTokShopOrders(): Promise<TikTokShopOrder[]> {
    try {
      // This will use the TikTok shop orders service when available
      // For now, return empty array
      return [];
    } catch (error) {
      console.warn('Could not fetch TikTok shop orders:', error);
      return [];
    }
  }

  /**
   * 🔒 CRITICAL: Proper Upsert with onConflictDoUpdate (Architect-recommended)
   * Uses Postgres native ON CONFLICT for atomic upsert operations
   */
  private async upsertOrderWithTransaction(orderData: InsertOrder): Promise<Order> {
    return await db.transaction(async (tx) => {
      // Prepare clean insert data with explicit typing
      const insertData = {
        customerId: orderData.customerId,
        total: orderData.total,
        status: orderData.status || 'pending',
        items: orderData.items,
        source: orderData.source || 'admin',
        sourceOrderId: orderData.sourceOrderId,
        sourceReference: orderData.sourceReference,
        syncStatus: orderData.syncStatus || 'synced',
        syncData: orderData.syncData as any || null,
        sourceCustomerInfo: orderData.sourceCustomerInfo as any || null
      };

      // Use onConflictDoUpdate for proper atomic upsert
      const [upsertedOrder] = await tx
        .insert(orders)
        .values([insertData])
        .onConflictDoUpdate({
          target: [orders.source, orders.sourceOrderId],
          set: {
            customerId: insertData.customerId,
            total: insertData.total,
            status: insertData.status,
            items: insertData.items,
            sourceReference: insertData.sourceReference,
            syncStatus: 'synced',
            syncData: insertData.syncData as any,
            sourceCustomerInfo: insertData.sourceCustomerInfo as any,
            updatedAt: new Date()
          }
        })
        .returning();
        
      if (!upsertedOrder) {
        throw new Error(`Failed to upsert order: ${orderData.source}/${orderData.sourceOrderId}`);
      }
      
      console.log(`✅ Order upserted: ${upsertedOrder.source}/${upsertedOrder.sourceOrderId} (${upsertedOrder.id})`);
      return upsertedOrder;
    });
  }

  /**
   * 🔍 Helper: Find product by SKU or name
   */
  private async findProductBySkuOrName(sku: string, name: string) {
    try {
      const products = await storage.getProducts();
      
      // Try by SKU first
      let product = products.find(p => p.sku === sku);
      
      // If not found, try by name (fuzzy match)
      if (!product) {
        product = products.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(p.name.toLowerCase())
        );
      }
      
      return product || null;
    } catch (error) {
      console.warn('Error finding product by SKU or name:', error);
      return null;
    }
  }

  /**
   * 🚀 Sync All Orders from All Sources
   */
  async syncAllOrders() {
    console.log('🚀 Starting unified order sync...');
    
    const storefrontResults = await this.syncStorefrontOrders();
    const tiktokResults = await this.syncTikTokShopOrders();
    
    const totalResults = {
      synced: storefrontResults.synced + tiktokResults.synced,
      errors: [...storefrontResults.errors, ...tiktokResults.errors],
      newOrders: [...storefrontResults.newOrders, ...tiktokResults.newOrders]
    };
    
    console.log(`🎉 Unified sync complete: ${totalResults.synced} total orders synced`);
    
    return totalResults;
  }
}

// Export singleton instance
export const orderSyncService = new OrderSyncService();