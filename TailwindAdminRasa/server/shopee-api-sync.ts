import { db } from './db.js';
import { shopeeShopOrders, shopeeShopProducts, shopeeBusinessAccounts } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import ShopeeAuthService from './shopee-auth.js';

/**
 * Service for syncing real data from Shopee API
 * This service will be used when real Shopee credentials are available
 */
export class ShopeeApiSyncService {
  private shopeeAuth: ShopeeAuthService;

  constructor(partnerId: string, partnerKey: string, region: string = 'VN') {
    this.shopeeAuth = new ShopeeAuthService({
      partnerId,
      partnerKey,
      redirectUri: `${process.env.REPL_URL || 'http://localhost:5000'}/auth/shopee/callback`,
      region
    });
  }

  /**
   * Sync orders from Shopee API to database
   * Fixed for Shopee API v2 specification
   */
  async syncOrders(businessAccountId: string, shopId: string): Promise<{success: boolean, syncedCount: number, errors: string[]}> {
    try {
      console.log(`🔄 Syncing orders for shop: ${shopId}`);
      
      // Get orders from last 3 months
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (90 * 24 * 60 * 60); // 90 days ago

      // 🔧 CRITICAL FIX: Implement full pagination for orders
      const errors: string[] = [];
      let syncedCount = 0;
      let cursor = '';
      let hasMore = true;

      while (hasMore) {
        const ordersData = await this.shopeeAuth.makeAuthenticatedRequest(
          'order/get_order_list',
          shopId,
          'GET',
          {
            time_range_field: 'create_time',
            time_from: startTime,
            time_to: endTime,
            page_size: 100,
            cursor: cursor
          }
        );

        if (!ordersData?.response?.order_list?.length) {
          hasMore = false;
          break;
        }

        console.log(`📦 Processing batch of ${ordersData.response.order_list.length} orders...`);

        // Update cursor for next iteration
        cursor = ordersData.response.next_cursor || '';
        hasMore = ordersData.response.more || false;

      // Process each order
      for (const order of ordersData.response.order_list) {
        try {
          // Get detailed order information
          const orderDetail = await this.shopeeAuth.makeAuthenticatedRequest(
            'order/get_order_detail',
            shopId,
            'GET',
            {
              order_sn_list: order.order_sn,
              response_optional_fields: 'buyer_user_id,buyer_username,estimated_shipping_fee,recipient_address,actual_shipping_fee,goods_to_receive,note,note_update_time,item_list,pay_time,dropshipper,dropshipper_phone,split_up,buyer_cancel_reason,cancel_by,cancel_reason,actual_shipping_fee_confirmed,buyer_cpf_id,fulfillment_flag,pickup_done_time,package_list,shipping_carrier,payment_method,total_amount,buyer_username,invoice_data'
            }
          );

          if (orderDetail?.response?.order_list?.[0]) {
            const detailedOrder = orderDetail.response.order_list[0];
            
            // 🔧 FIXED: Map Shopee order to correct database structure
            const orderData = {
              shopeeOrderId: detailedOrder.order_sn,
              orderSn: detailedOrder.order_sn,
              shopId: shopId,
              businessAccountId: businessAccountId,
              orderNumber: detailedOrder.order_sn,
              orderStatus: this.mapShopeeOrderStatus(detailedOrder.order_status),
              customerInfo: {
                buyerUserId: detailedOrder.buyer_user_id || '',
                buyerUsername: detailedOrder.buyer_username || '',
                recipientAddress: detailedOrder.recipient_address || {
                  name: '',
                  phone: '',
                  fullAddress: '',
                  district: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'VN'
                }
              },
              totalAmount: (detailedOrder.total_amount / 100000).toString(), // Convert from Shopee cents
              currency: 'VND',
              actualShippingFee: ((detailedOrder.actual_shipping_fee || 0) / 100000).toString(),
              goodsToReceive: ((detailedOrder.goods_to_receive || 0) / 100000).toString(),
              coinOffset: ((detailedOrder.coin_offset || 0) / 100000).toString(),
              escrowAmount: ((detailedOrder.escrow_amount || 0) / 100000).toString(),
              items: detailedOrder.item_list?.map((item: any) => ({
                itemId: item.item_id?.toString() || '',
                itemName: item.item_name || '',
                itemSku: item.item_sku || '',
                modelId: item.model_id?.toString(),
                modelName: item.model_name,
                modelSku: item.model_sku,
                modelQuantityPurchased: item.model_quantity_purchased || 0,
                modelOriginalPrice: (item.model_original_price || 0) / 100000,
                modelDiscountedPrice: (item.model_discounted_price || 0) / 100000,
                wholesalePrice: item.wholesale_price ? item.wholesale_price / 100000 : undefined,
                weight: item.weight,
                itemImageUrl: item.item_image_url
              })) || [],
              paymentMethod: detailedOrder.payment_method || '',
              paymentStatus: detailedOrder.payment_status || 'pending',
              fulfillmentStatus: 'pending',
              trackingNumber: detailedOrder.tracking_number || null,
              shippingCarrier: detailedOrder.shipping_carrier || 'shopee',
              orderDate: new Date(detailedOrder.create_time * 1000),
              createTime: new Date(detailedOrder.create_time * 1000),
              updatedAt: new Date(detailedOrder.update_time * 1000),
              payTime: detailedOrder.pay_time ? new Date(detailedOrder.pay_time * 1000) : null,
              shipTime: detailedOrder.ship_time ? new Date(detailedOrder.ship_time * 1000) : null,
              deliveryTime: detailedOrder.delivery_time ? new Date(detailedOrder.delivery_time * 1000) : null,
              shopeeFee: '0',
              transactionFee: '0',
              commissionFee: '0',
              serviceFee: '0',
              actualShippingFeeConfirmed: false,
              dropshipper: detailedOrder.dropshipper || '',
              dropshipperPhone: detailedOrder.dropshipper_phone || '',
              splitUp: false,
              buyerCancelReason: detailedOrder.buyer_cancel_reason || null,
              cancelBy: detailedOrder.cancel_by || null,
              cancelReason: detailedOrder.cancel_reason || null,
              notes: detailedOrder.note || null,
              tagIds: []
            };

            // Insert or update order in database
            await db.insert(shopeeShopOrders).values(orderData).onConflictDoUpdate({
              target: shopeeShopOrders.shopeeOrderId,
              set: {
                orderStatus: orderData.orderStatus,
                customerInfo: orderData.customerInfo,
                totalAmount: orderData.totalAmount,
                items: orderData.items,
                trackingNumber: orderData.trackingNumber,
                payTime: orderData.payTime,
                shipTime: orderData.shipTime,
                deliveryTime: orderData.deliveryTime,
                paymentMethod: orderData.paymentMethod,
                shippingCarrier: orderData.shippingCarrier,
                updatedAt: new Date()
              }
            });

            syncedCount++;
          }
        } catch (orderError) {
          errors.push(`Failed to sync order ${order.order_sn}: ${orderError}`);
        }
      }

      } // Close pagination while loop

      console.log(`✅ Synced ${syncedCount} orders for shop: ${shopId}`);
      return { success: true, syncedCount, errors };

    } catch (error) {
      console.error('Failed to sync orders:', error);
      return { 
        success: false, 
        syncedCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown sync error'] 
      };
    }
  }

  /**
   * Sync products from Shopee API to database
   * Fixed for Shopee API v2 specification
   */
  async syncProducts(businessAccountId: string, shopId: string): Promise<{success: boolean, syncedCount: number, errors: string[]}> {
    try {
      console.log(`🔄 Syncing products for shop: ${shopId}`);

      // 🔧 CRITICAL FIX: Implement full pagination for products
      const errors: string[] = [];
      let syncedCount = 0;
      let offset = 0;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const productsData = await this.shopeeAuth.makeAuthenticatedRequest(
          'product/get_item_list',
          shopId,
          'GET',
          {
            offset: offset,
            page_size: pageSize,
            item_status: 'NORMAL'
          }
        );

        if (!productsData?.response?.item?.length) {
          hasMore = false;
          break;
        }

        console.log(`🛍️ Processing batch of ${productsData.response.item.length} products (offset: ${offset})...`);

        // Check if we have more data
        hasMore = productsData.response.has_next_page || productsData.response.item.length === pageSize;
        offset += pageSize;

      // Process each product
      for (const product of productsData.response.item) {
        try {
          // Get detailed product information
          const productDetail = await this.shopeeAuth.makeAuthenticatedRequest(
            'product/get_item_base_info',
            shopId,
            'GET',
            {
              item_id_list: product.item_id.toString()
            }
          );

          if (productDetail?.response?.item_list?.[0]) {
            const detailedProduct = productDetail.response.item_list[0];

            // 🔧 FIXED: Map Shopee product to correct database structure
            const productData = {
              shopeeItemId: detailedProduct.item_id.toString(),
              shopId: shopId,
              businessAccountId: businessAccountId,
              syncEnabled: true,
              autoSync: false,
              syncDirection: 'from_shopee' as const,
              itemName: detailedProduct.item_name || '',
              itemSku: detailedProduct.item_sku || '',
              description: detailedProduct.description || '',
              originalPrice: ((detailedProduct.price_info?.[0]?.original_price || 0) / 100000).toString(),
              currentPrice: ((detailedProduct.price_info?.[0]?.current_price || 0) / 100000).toString(),
              stock: detailedProduct.stock || 0,
              itemStatus: this.mapShopeeProductStatus(detailedProduct.item_status),
              categoryId: detailedProduct.category_id || null,
              categoryName: detailedProduct.category_name || null,
              weight: detailedProduct.weight ? (detailedProduct.weight / 1000).toString() : null, // Convert grams to kg
              dimension: detailedProduct.dimension ? {
                packageLength: detailedProduct.dimension.package_length || 0,
                packageWidth: detailedProduct.dimension.package_width || 0,
                packageHeight: detailedProduct.dimension.package_height || 0
              } : null,
              condition: 'new' as const,
              wholesaleEnabled: detailedProduct.wholesale?.is_wholesale_enabled || false,
              sales: 0,
              views: 0,
              likes: 0,
              rating: '0',
              reviewCount: 0,
              images: detailedProduct.image?.image_url_list || [],
              videos: [],
              hasModel: detailedProduct.has_model || false,
              logisticEnabled: detailedProduct.logistic_info?.enabled || false,
              daysToShip: detailedProduct.logistic_info?.days_to_ship || 7,
              createTime: new Date(detailedProduct.create_time * 1000),
              updatedAt: new Date(detailedProduct.update_time * 1000),
              tagIds: []
            };

            // Insert or update product in database
            await db.insert(shopeeShopProducts).values([productData]).onConflictDoUpdate({
              target: shopeeShopProducts.shopeeItemId,
              set: {
                itemName: productData.itemName,
                itemSku: productData.itemSku,
                stock: productData.stock,
                originalPrice: productData.originalPrice,
                currentPrice: productData.currentPrice,
                itemStatus: productData.itemStatus,
                description: productData.description,
                weight: productData.weight,
                dimension: productData.dimension,
                categoryId: productData.categoryId,
                categoryName: productData.categoryName,
                condition: productData.condition,
                wholesaleEnabled: productData.wholesaleEnabled,
                updatedAt: new Date()
              }
            });

            syncedCount++;
          }
        } catch (productError) {
          errors.push(`Failed to sync product ${product.item_id}: ${productError}`);
        }
      }

      } // Close pagination while loop

      console.log(`✅ Synced ${syncedCount} products for shop: ${shopId}`);
      return { success: true, syncedCount, errors };

    } catch (error) {
      console.error('Failed to sync products:', error);
      return { 
        success: false, 
        syncedCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown sync error'] 
      };
    }
  }

  /**
   * Get detailed order information from Shopee API
   * NEW: Dedicated method for fetching single order details
   */
  async getOrderDetail(businessAccountId: string, shopId: string, orderSn: string): Promise<any> {
    try {
      console.log(`🔍 Fetching order details for: ${orderSn} from shop: ${shopId}`);
      
      const orderDetail = await this.shopeeAuth.makeAuthenticatedRequest(
        'order/get_order_detail',
        shopId,
        'GET',
        {
          order_sn_list: orderSn,
          response_optional_fields: 'buyer_user_id,buyer_username,estimated_shipping_fee,recipient_address,actual_shipping_fee,goods_to_receive,note,note_update_time,item_list,pay_time,dropshipper,dropshipper_phone,split_up,buyer_cancel_reason,cancel_by,cancel_reason,actual_shipping_fee_confirmed,buyer_cpf_id,fulfillment_flag,pickup_done_time,package_list,shipping_carrier,payment_method,total_amount,buyer_username,invoice_data'
        }
      );

      if (!orderDetail?.response?.order_list?.[0]) {
        throw new Error(`Order ${orderSn} not found on Shopee`);
      }

      const detailedOrder = orderDetail.response.order_list[0];
      
      // Map to our format
      const mappedOrder = {
        shopeeOrderId: detailedOrder.order_sn,
        orderSn: detailedOrder.order_sn,
        shopId: shopId,
        businessAccountId: businessAccountId,
        orderNumber: detailedOrder.order_sn,
        orderStatus: this.mapShopeeOrderStatus(detailedOrder.order_status),
        customerInfo: {
          buyerUserId: detailedOrder.buyer_user_id || '',
          buyerUsername: detailedOrder.buyer_username || '',
          recipientAddress: {
            name: detailedOrder.recipient_address?.name || '',
            phone: detailedOrder.recipient_address?.phone || '',
            fullAddress: detailedOrder.recipient_address?.full_address || '',
            district: detailedOrder.recipient_address?.district || '',
            city: detailedOrder.recipient_address?.city || '',
            state: detailedOrder.recipient_address?.state || '',
            zipCode: detailedOrder.recipient_address?.zipcode || '',
            country: detailedOrder.recipient_address?.country || 'VN'
          }
        },
        totalAmount: (detailedOrder.total_amount / 100000).toString(),
        currency: 'VND',
        actualShippingFee: ((detailedOrder.actual_shipping_fee || 0) / 100000).toString(),
        goodsToReceive: ((detailedOrder.goods_to_receive || 0) / 100000).toString(),
        items: detailedOrder.item_list?.map((item: any) => ({
          itemId: item.item_id?.toString() || '',
          itemName: item.item_name || '',
          itemSku: item.item_sku || '',
          modelId: item.model_id?.toString(),
          modelName: item.model_name,
          modelSku: item.model_sku,
          modelQuantityPurchased: item.model_quantity_purchased || 0,
          modelOriginalPrice: (item.model_original_price || 0) / 100000,
          modelDiscountedPrice: (item.model_discounted_price || 0) / 100000,
          wholesalePrice: item.wholesale_price != null ? item.wholesale_price / 100000 : undefined,
          weight: item.weight || 0,
          itemImageUrl: item.item_image?.image_url || '',
          // Add-on specific fields (extra features)
          addOnList: item.add_on_deal?.add_on_deal_list || [],
          mainItem: item.main_item,
          addOnDealId: item.add_on_deal?.add_on_deal_id
        })) || [],
        shippingCarrier: detailedOrder.package_list?.[0]?.shipping_carrier || detailedOrder.shipping_carrier,
        trackingNumber: detailedOrder.package_list?.[0]?.tracking_number || detailedOrder.tracking_number || '',
        paymentMethod: detailedOrder.payment_method,
        payTime: detailedOrder.pay_time ? new Date(detailedOrder.pay_time * 1000) : null,
        shipTime: detailedOrder.ship_time ? new Date(detailedOrder.ship_time * 1000) : null,
        deliveryTime: detailedOrder.delivery_time ? new Date(detailedOrder.delivery_time * 1000) : null,
        notes: detailedOrder.note || '',
        createTime: new Date(detailedOrder.create_time * 1000),
        updatedAt: new Date(detailedOrder.update_time * 1000),
        // Raw Shopee data for reference
        shopeeRawData: detailedOrder
      };

      console.log(`✅ Order details fetched successfully for: ${orderSn}`);
      return mappedOrder;

    } catch (error) {
      console.error(`❌ Failed to fetch order details for ${orderSn}:`, error);
      throw error;
    }
  }

  /**
   * Full shop data sync - orders, products, shop info
   */
  async fullShopSync(businessAccountId: string, shopId: string): Promise<{
    success: boolean,
    results: {
      orders: {success: boolean, syncedCount: number, errors: string[]},
      products: {success: boolean, syncedCount: number, errors: string[]},
      shopInfo: {success: boolean, errors: string[]}
    }
  }> {
    console.log(`🚀 Starting full sync for shop: ${shopId}`);

    const results = {
      orders: { success: false, syncedCount: 0, errors: [] as string[] },
      products: { success: false, syncedCount: 0, errors: [] as string[] },
      shopInfo: { success: false, errors: [] as string[] }
    };

    // Sync orders
    try {
      results.orders = await this.syncOrders(businessAccountId, shopId);
    } catch (error) {
      results.orders.errors.push(`Order sync failed: ${error}`);
    }

    // Sync products
    try {
      results.products = await this.syncProducts(businessAccountId, shopId);
    } catch (error) {
      results.products.errors.push(`Product sync failed: ${error}`);
    }

    // Update shop info
    try {
      const shopInfo = await this.shopeeAuth.syncShopData(shopId);
      await db.update(shopeeBusinessAccounts)
        .set({
          displayName: shopInfo.shop_name,
          shopName: shopInfo.shop_name,
          shopLogo: shopInfo.shop_logo,
          contactEmail: shopInfo.contact_email,
          contactPhone: shopInfo.contact_phone,
          lastSync: new Date(),
          updatedAt: new Date()
        })
        .where(eq(shopeeBusinessAccounts.id, businessAccountId));
      
      results.shopInfo.success = true;
    } catch (error) {
      results.shopInfo.errors.push(`Shop info sync failed: ${error}`);
    }

    const overallSuccess = results.orders.success || results.products.success || results.shopInfo.success;
    
    console.log(`${overallSuccess ? '✅' : '❌'} Full sync completed for shop: ${shopId}`);
    
    return { success: overallSuccess, results };
  }

  /**
   * Map Shopee order status to our internal status
   */
  private mapShopeeOrderStatus(shopeeStatus: string): "unpaid" | "to_ship" | "shipped" | "to_confirm_receive" | "in_cancel" | "cancelled" | "to_return" | "completed" {
    const statusMap: Record<string, "unpaid" | "to_ship" | "shipped" | "to_confirm_receive" | "in_cancel" | "cancelled" | "to_return" | "completed"> = {
      'UNPAID': 'unpaid',
      'TO_CONFIRM_RECEIVE': 'to_confirm_receive',
      'TO_SHIP': 'to_ship',
      'SHIPPED': 'shipped',
      'COMPLETED': 'completed',
      'IN_CANCEL': 'in_cancel',
      'CANCELLED': 'cancelled',
      'TO_RETURN': 'to_return',
      'INVOICE_PENDING': 'unpaid',
      'RETRY_SHIPPING': 'to_ship'
    };
    
    return statusMap[shopeeStatus] || 'unpaid';
  }

  /**
   * Map Shopee product status to our internal status
   */
  private mapShopeeProductStatus(shopeeStatus: string): "normal" | "deleted" | "banned" | "reviewing" {
    const statusMap: Record<string, "normal" | "deleted" | "banned" | "reviewing"> = {
      'NORMAL': 'normal',
      'DELETED': 'deleted',
      'BANNED': 'banned',
      'REVIEWING': 'reviewing',
      'DRAFT': 'reviewing'
    };
    
    return statusMap[shopeeStatus] || 'normal';
  }

  /**
   * Ship order API - Mark order as shipped with tracking info
   * POST /logistics/ship_order
   */
  async shipOrder(
    businessAccountId: string, 
    shopId: string, 
    orderSn: string, 
    shippingData: {
      trackingNumber: string;
      shippingCarrier: string;
      pickupTime?: Date;
      shipTime?: Date;
      estimatedDeliveryTime?: Date;
    }
  ): Promise<{
    success: boolean;
    trackingNumber?: string;
    shippingCarrier?: string;
    shipTime?: Date;
    error?: string;
  }> {
    console.log(`🚢 Shipping order: ${orderSn} with tracking: ${shippingData.trackingNumber}`);

    try {
      // Use makeAuthenticatedRequest for consistency and proper auth handling
      const requestBody = {
        order_sn: orderSn,
        tracking_number: shippingData.trackingNumber,
        shipping_carrier: shippingData.shippingCarrier,
        pickup_time: shippingData.pickupTime ? Math.floor(shippingData.pickupTime.getTime() / 1000) : undefined,
        ship_time: shippingData.shipTime ? Math.floor(shippingData.shipTime.getTime() / 1000) : Math.floor(Date.now() / 1000),
        estimated_delivery_time: shippingData.estimatedDeliveryTime ? Math.floor(shippingData.estimatedDeliveryTime.getTime() / 1000) : undefined
      };

      console.log(`📡 Calling Shopee ship order API for: ${orderSn}`);
      
      const responseData = await this.shopeeAuth.makeAuthenticatedRequest(
        'logistics/ship_order',
        shopId,
        'POST',
        requestBody
      );

      // Handle Shopee v2.0 response structure
      if (responseData.error && responseData.error !== "" && responseData.error !== 0) {
        const errorMsg = responseData.message || responseData.error || 'Ship order failed';
        console.error(`❌ Ship order API error:`, errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      // Update order in local database
      await db.update(shopeeShopOrders)
        .set({
          orderStatus: 'shipped',
          trackingNumber: shippingData.trackingNumber,
          shippingCarrier: shippingData.shippingCarrier,
          shipTime: shippingData.shipTime || new Date(),
          updatedAt: new Date()
        })
        .where(eq(shopeeShopOrders.orderSn, orderSn));

      console.log(`✅ Order shipped successfully: ${orderSn} - Tracking: ${shippingData.trackingNumber}`);

      return {
        success: true,
        trackingNumber: shippingData.trackingNumber,
        shippingCarrier: shippingData.shippingCarrier,
        shipTime: shippingData.shipTime || new Date()
      };

    } catch (error) {
      console.error(`❌ Ship order failed for ${orderSn}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown ship order error'
      };
    }
  }

  // 💰 Vietnamese Currency Helper - VND formatting for Shopee compliance
  private formatVietnameseCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // 🔄 TASK 5: Bulk Product Update API - Vietnamese retail optimization
  async bulkUpdateProducts(
    businessAccountId: string, 
    shopId: string, 
    updates: Array<{
      shopeeItemId: string;
      updates: {
        originalPrice?: number;
        currentPrice?: number;
        stock?: number;
        itemStatus?: string;
        description?: string;
      };
    }>
  ): Promise<{success: boolean, updatedCount: number, errors: string[]}> {
    try {
      console.log(`🔄 Bulk updating ${updates.length} products for shop: ${shopId}`);
      
      const errors: string[] = [];
      let updatedCount = 0;
      
      // Process in batches of 10 for Vietnamese market performance
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        // Process each item in current batch with Vietnamese retail optimizations
        for (const { shopeeItemId, updates: itemUpdates } of batch) {
          try {
            let response: any = { error: "", message: "" };
            const itemId = parseInt(shopeeItemId);
            
            // 1. Handle price updates - Use dedicated Shopee v2.0 price endpoint
            if (itemUpdates.originalPrice !== undefined || itemUpdates.currentPrice !== undefined) {
              const pricePayload = {
                item_id: itemId,
                price_list: [{
                  model_id: 0, // Default model for Vietnamese single-variant products
                  original_price: itemUpdates.originalPrice ? Math.round(itemUpdates.originalPrice * 100000) : undefined, // VND × 100000 scaling
                  current_price: itemUpdates.currentPrice ? Math.round(itemUpdates.currentPrice * 100000) : undefined
                }]
              };
              
              const priceResponse = await this.shopeeAuth.makeAuthenticatedRequest(
                'product/update_price',
                shopId,
                'POST',
                pricePayload
              );
              
              if (priceResponse.error && priceResponse.error !== "" && priceResponse.error !== 0) {
                throw new Error(`Price update failed: ${priceResponse.message || priceResponse.error}`);
              }
            }
            
            // 2. Handle stock updates - Use dedicated Shopee v2.0 stock endpoint
            if (itemUpdates.stock !== undefined) {
              const stockPayload = {
                item_id: itemId,
                stock_list: [{
                  model_id: 0, // Default model
                  seller_stock: [{
                    stock: itemUpdates.stock
                  }]
                }]
              };
              
              const stockResponse = await this.shopeeAuth.makeAuthenticatedRequest(
                'product/update_stock',
                shopId,
                'POST',
                stockPayload
              );
              
              if (stockResponse.error && stockResponse.error !== "" && stockResponse.error !== 0) {
                throw new Error(`Stock update failed: ${stockResponse.message || stockResponse.error}`);
              }
            }
            
            // 3. Handle status updates - Use item management endpoint
            if (itemUpdates.itemStatus) {
              const statusResponse = await this.shopeeAuth.makeAuthenticatedRequest(
                'product/update_item',
                shopId,
                'POST',
                {
                  item_id: itemId,
                  item_status: itemUpdates.itemStatus.toUpperCase()
                }
              );
              
              if (statusResponse.error && statusResponse.error !== "" && statusResponse.error !== 0) {
                throw new Error(`Status update failed: ${statusResponse.message || statusResponse.error}`);
              }
            }
            
            // 4. Handle description updates - Use item info endpoint
            if (itemUpdates.description) {
              const descResponse = await this.shopeeAuth.makeAuthenticatedRequest(
                'product/update_item',
                shopId,
                'POST',
                {
                  item_id: itemId,
                  description: itemUpdates.description
                }
              );
              
              if (descResponse.error && descResponse.error !== "" && descResponse.error !== 0) {
                throw new Error(`Description update failed: ${descResponse.message || descResponse.error}`);
              }
            }
            
            // 5. Update local database with Vietnamese formatting and transaction safety
            await db.transaction(async (tx) => {
              await tx.update(shopeeShopProducts)
                .set({
                  ...(itemUpdates.originalPrice !== undefined && { 
                    originalPrice: this.formatVietnameseCurrency(itemUpdates.originalPrice) 
                  }),
                  ...(itemUpdates.currentPrice !== undefined && { 
                    currentPrice: this.formatVietnameseCurrency(itemUpdates.currentPrice) 
                  }),
                  ...(itemUpdates.stock !== undefined && { stock: itemUpdates.stock }),
                  ...(itemUpdates.itemStatus && { 
                    itemStatus: this.mapShopeeProductStatus(itemUpdates.itemStatus) 
                  }),
                  ...(itemUpdates.description && { description: itemUpdates.description }),
                  updatedAt: new Date()
                })
                .where(eq(shopeeShopProducts.shopeeItemId, shopeeItemId));
            });
            
            updatedCount++;
            console.log(`✅ Updated product ${shopeeItemId}`);
            
          } catch (productError) {
            const errorMsg = productError instanceof Error ? productError.message : 'Unknown error';
            errors.push(`Product ${shopeeItemId}: ${errorMsg}`);
          }
        }
        
        // Add delay between batches for API rate limiting
        if (i + batchSize < updates.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`✅ Bulk update completed: ${updatedCount}/${updates.length} products updated`);
      return { success: true, updatedCount, errors };
      
    } catch (error) {
      console.error('Failed to bulk update products:', error);
      return {
        success: false,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown bulk update error']
      };
    }
  }

  // 📦 TASK 5: Inventory Sync API - Advanced Vietnamese conflict resolution
  async syncInventory(
    businessAccountId: string,
    shopId: string,
    shopeeItemId: string,
    localStock: number
  ): Promise<{success: boolean, shopeeStock?: number, localStock?: number, conflict?: boolean, resolution?: string, auditId?: string}> {
    return await db.transaction(async (tx) => {
      try {
        console.log(`📦 Syncing inventory for product ${shopeeItemId} - Local: ${localStock}`);
        
        // 1. Get current local product with timestamp for conflict detection
        const [localProduct] = await tx
          .select({
            id: shopeeShopProducts.id,
            stock: shopeeShopProducts.stock,
            updatedAt: shopeeShopProducts.updatedAt,
            lastSyncAt: shopeeShopProducts.lastSyncAt
          })
          .from(shopeeShopProducts)
          .where(eq(shopeeShopProducts.shopeeItemId, shopeeItemId))
          .limit(1);
        
        if (!localProduct) {
          throw new Error(`Product ${shopeeItemId} not found in local database`);
        }
        
        // 2. Get current Shopee stock with proper API v2.0 call
        const productDetail = await this.shopeeAuth.makeAuthenticatedRequest(
          'product/get_item_base_info',
          shopId,
          'GET',
          { item_id_list: shopeeItemId }
        );
        
        if (!productDetail?.response?.item_list?.[0]) {
          throw new Error(`Product ${shopeeItemId} not found on Shopee`);
        }
        
        const shopeeProduct = productDetail.response.item_list[0];
        const shopeeStock = shopeeProduct.stock || 0;
        const currentTime = new Date();
        
        // 3. Advanced conflict detection with Vietnamese retail logic
        const threshold = 5; // Vietnamese retail threshold
        const stockDifference = Math.abs(shopeeStock - localStock);
        const hasStockConflict = stockDifference > threshold;
        
        // Time-based conflict detection (15 minutes threshold)
        const timeSinceLastSync = localProduct.lastSyncAt 
          ? currentTime.getTime() - localProduct.lastSyncAt.getTime()
          : Infinity;
        const hasTimingConflict = timeSinceLastSync < 15 * 60 * 1000; // 15 minutes
        
        let resolution = 'no_conflict';
        let finalShopeeStock = shopeeStock;
        let finalLocalStock = localStock;
        
        // 4. Conflict resolution policy for Vietnamese retail
        if (hasStockConflict) {
          console.log(`⚠️ Stock conflict detected: Shopee=${shopeeStock}, Local=${localStock} (diff: ${stockDifference})`);
          
          if (hasTimingConflict) {
            // Recent sync - prefer Shopee as source of truth (marketplace-first)
            resolution = 'shopee_wins_timing';
            finalLocalStock = shopeeStock;
            console.log(`🏪 Shopee wins: Recent sync detected, using marketplace data`);
          } else {
            // Old sync - check which is more recent based on business logic
            const localIsNewer = localProduct.updatedAt > (localProduct.lastSyncAt || new Date(0));
            
            if (localIsNewer) {
              // Local changes are newer - push to Shopee
              resolution = 'local_wins_newer';
              finalShopeeStock = localStock;
              
              const updateResponse = await this.shopeeAuth.makeAuthenticatedRequest(
                'product/update_stock',
                shopId,
                'POST',
                {
                  item_id: parseInt(shopeeItemId),
                  stock_list: [{
                    model_id: 0,
                    seller_stock: [{ stock: localStock }]
                  }]
                }
              );
              
              if (updateResponse.error && updateResponse.error !== "" && updateResponse.error !== 0) {
                throw new Error(`Shopee stock update failed: ${updateResponse.message || updateResponse.error}`);
              }
              
              console.log(`📤 Local wins: Pushed ${localStock} units to Shopee`);
            } else {
              // Shopee data is authoritative - pull from Shopee
              resolution = 'shopee_wins_authoritative';
              finalLocalStock = shopeeStock;
              console.log(`📥 Shopee wins: Using authoritative marketplace data`);
            }
          }
        } else {
          // No significant conflict - sync local to Shopee
          const updateResponse = await this.shopeeAuth.makeAuthenticatedRequest(
            'product/update_stock',
            shopId,
            'POST',
            {
              item_id: parseInt(shopeeItemId),
              stock_list: [{
                model_id: 0,
                seller_stock: [{ stock: localStock }]
              }]
            }
          );
          
          if (updateResponse.error && updateResponse.error !== "" && updateResponse.error !== 0) {
            throw new Error(`Shopee sync failed: ${updateResponse.message || updateResponse.error}`);
          }
          
          finalShopeeStock = localStock;
          resolution = 'synced_to_shopee';
        }
        
        // 5. Update local database with sync audit trail
        await tx.update(shopeeShopProducts)
          .set({
            stock: finalLocalStock,
            lastSyncAt: currentTime,
            updatedAt: currentTime
          })
          .where(eq(shopeeShopProducts.shopeeItemId, shopeeItemId));
        
        // 6. Create audit trail for Vietnamese compliance
        const auditId = `sync_${shopeeItemId}_${Date.now()}`;
        console.log(`📋 Audit trail: ${auditId} - Resolution: ${resolution}`);
        
        console.log(`✅ Inventory sync completed: Shopee=${finalShopeeStock}, Local=${finalLocalStock}`);
        
        return {
          success: true,
          shopeeStock: finalShopeeStock,
          localStock: finalLocalStock,
          conflict: hasStockConflict,
          resolution,
          auditId
        };
        
      } catch (error) {
        console.error(`❌ Inventory sync transaction failed for ${shopeeItemId}:`, error);
        throw error; // Re-throw to rollback transaction
      }
    }).catch((error) => {
      console.error(`❌ Inventory sync failed for ${shopeeItemId}:`, error);
      return { 
        success: false, 
        conflict: false, 
        resolution: 'error',
        auditId: `error_${Date.now()}`
      };
    });
  }

  // 🎯 TASK 5: Product Status Management - Vietnamese compliance
  async updateProductStatus(
    businessAccountId: string,
    shopId: string,
    shopeeItemId: string,
    status: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST'
  ): Promise<{success: boolean, newStatus?: string}> {
    try {
      console.log(`🎯 Updating product ${shopeeItemId} status to: ${status}`);
      
      // Shopee v2.0 status update
      const response = await this.shopeeAuth.makeAuthenticatedRequest(
        'product/update_item',
        shopId,
        'POST',
        {
          item_id: parseInt(shopeeItemId),
          item_status: status
        }
      );
      
      // Handle response
      if (response.error && response.error !== "" && response.error !== 0) {
        const errorMsg = response.message || response.error || 'Status update failed';
        console.error(`❌ Status update failed:`, errorMsg);
        return { success: false };
      }
      
      // Update local database
      const mappedStatus = this.mapShopeeProductStatus(status);
      await db.update(shopeeShopProducts)
        .set({
          itemStatus: mappedStatus,
          updatedAt: new Date()
        })
        .where(eq(shopeeShopProducts.shopeeItemId, shopeeItemId));
      
      console.log(`✅ Product status updated to: ${mappedStatus}`);
      return { success: true, newStatus: mappedStatus };
      
    } catch (error) {
      console.error(`❌ Status update failed for ${shopeeItemId}:`, error);
      return { success: false };
    }
  }
}

// Factory function to create sync service with environment credentials
export function createShopeeApiSync(): ShopeeApiSyncService | null {
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  
  if (!partnerId || !partnerKey) {
    console.warn('⚠️ Shopee credentials not found - API sync disabled');
    return null;
  }
  
  return new ShopeeApiSyncService(partnerId, partnerKey, 'VN');
}

export default ShopeeApiSyncService;