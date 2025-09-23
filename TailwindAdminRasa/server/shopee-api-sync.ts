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
      // Get fresh access token
      const tokenResult = await this.shopeeAuth.getValidAccessToken(businessAccountId);
      if (!tokenResult.success || !tokenResult.accessToken) {
        throw new Error('Failed to get valid access token for shipping');
      }

      const accessToken = tokenResult.accessToken;
      const timestamp = Math.floor(Date.now() / 1000);
      const path = `/api/v2/logistics/ship_order`;

      // Prepare ship order payload
      const requestBody = {
        order_sn: orderSn,
        tracking_number: shippingData.trackingNumber,
        shipping_carrier: shippingData.shippingCarrier,
        pickup_time: shippingData.pickupTime ? Math.floor(shippingData.pickupTime.getTime() / 1000) : undefined,
        ship_time: shippingData.shipTime ? Math.floor(shippingData.shipTime.getTime() / 1000) : Math.floor(Date.now() / 1000),
        estimated_delivery_time: shippingData.estimatedDeliveryTime ? Math.floor(shippingData.estimatedDeliveryTime.getTime() / 1000) : undefined
      };

      // Generate signature for ship order API
      const sign = this.shopeeAuth.generateSign(path, timestamp, accessToken, shopId);
      const url = `${this.shopeeAuth.baseUrl}${path}?partner_id=${this.shopeeAuth.config.partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}`;

      console.log(`📡 Calling Shopee ship order API for: ${orderSn}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Ship order API failed (HTTP ${response.status}):`, errorText);
        throw new Error(`Ship order API failed: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`🔍 Ship order API response:`, JSON.stringify(responseData, null, 2));

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
          fulfillmentStatus: 'shipped',
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