import { Express } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import ShopeeAuthService from './shopee-auth.js';
import { shopeeOrdersService } from './shopee-orders.js';
import { shopeeSellerService } from './shopee-seller.js';
import { shopeeFulfillmentService } from './shopee-fulfillment.js';
import { createShopeeApiSync } from './shopee-api-sync.js';
import { db } from './db.js';
import { eq } from 'drizzle-orm';
import { shopeeBusinessAccounts, shopeeShopOrders, insertShopeeBusinessAccountSchema, insertShopeeShopOrderSchema, insertShopeeShopProductSchema } from '../shared/schema.js';

// 🚨 PRODUCTION WARNING: In-memory state will break on server restart
// TODO: Use Redis or persistent storage for OAuth state
const oauthStates = new Map();

export function setupShopeeRoutes(app: Express, requireAdminAuth: any, requireCSRFToken: any) {
  
  // Shopee Authentication Routes - SECURED
  app.post("/api/shopee-shop/connect", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      // Get credentials from environment (secure server-side storage)
      const partnerId = process.env.SHOPEE_PARTNER_ID;
      const partnerKey = process.env.SHOPEE_PARTNER_KEY;
      const region = req.body.region || 'VN';
      
      if (!partnerId || !partnerKey) {
        return res.status(500).json({ 
          error: "Shopee credentials not configured",
          message: "Please contact administrator to configure Shopee Partner credentials"
        });
      }

      const shopeeAuth = new ShopeeAuthService({
        partnerId,
        partnerKey,
        redirectUri: `${process.env.REPL_URL || 'http://localhost:5000'}/auth/shopee/callback`,
        region
      });

      const state = crypto.randomUUID();
      const redirectUrl = req.body.redirectUrl || '/shopee';
      
      // Store state for verification
      // 🔒 SECURITY FIX: Store minimal state, recreate ShopeeAuth in callback
      oauthStates.set(state, { 
        timestamp: Date.now(),
        redirectUrl,
        platform: 'shopee',
        region: region || 'VN'
        // No shopeeAuth instance stored - will recreate in callback
      });
      
      // Generate authorization URL
      const authUrl = shopeeAuth.generateAuthUrl();
      
      res.json({ authUrl, state });
    } catch (error) {
      console.error("Error generating Shopee OAuth URL:", error);
      res.status(500).json({ 
        error: "Failed to generate authentication URL",
        message: "Please try again later"
      });
    }
  });

  // Shopee OAuth Callback - PUBLIC (no auth required for OAuth callback)
  app.get("/auth/shopee/callback", async (req, res) => {
    try {
      const { code, shop_id, state } = req.query;

      if (!code || !shop_id) {
        console.error('Missing required OAuth parameters:', { code: !!code, shop_id: !!shop_id });
        return res.redirect('/?error=oauth_failed&message=Missing authorization parameters');
      }

      // Verify state parameter
      const storedState = oauthStates.get(state as string);
      if (!storedState || storedState.platform !== 'shopee') {
        console.error('Invalid or expired OAuth state:', state);
        return res.redirect('/?error=oauth_failed&message=Invalid authentication state');
      }

      // Clean up expired states (older than 10 minutes)
      const now = Date.now();
      Array.from(oauthStates.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > 10 * 60 * 1000) {
          oauthStates.delete(key);
        }
      });

      // 🔒 SECURITY FIX: Recreate ShopeeAuth from env instead of storing credentials
      const shopeeAuth = new ShopeeAuthService({
        partnerId: process.env.SHOPEE_PARTNER_ID!,
        partnerKey: process.env.SHOPEE_PARTNER_KEY!,
        redirectUri: `${process.env.REPL_URL || 'http://localhost:5000'}/auth/shopee/callback`,
        region: storedState.region || 'VN'
      });
      
      // Exchange code for tokens
      const authResult = await shopeeAuth.exchangeCodeForToken(code as string, shop_id as string);
      
      if (!authResult.success) {
        console.error('Token exchange failed:', authResult.error);
        return res.redirect(`/?error=oauth_failed&message=${encodeURIComponent(authResult.error || 'Authentication failed')}`);
      }

      // 🔧 CRITICAL FIX: Store tokens FIRST, then get shop info
      // Create minimal shop info for initial storage
      const minimalShopInfo = {
        shop_id: authResult.shopId!,
        shop_name: `Shopee Shop ${authResult.shopId!}`,
        shop_type: 'normal',
        status: 'normal'
      };

      // Store business account with minimal data first
      await shopeeAuth.storeBusinessAccount({
        accessToken: authResult.accessToken!,
        refreshToken: authResult.refreshToken!,
        expiresAt: authResult.expiresAt!,
        shopId: authResult.shopId!
      }, minimalShopInfo);

      // Now get real shop information from Shopee API (tokens are in DB)
      const realShopInfo = await shopeeAuth.syncShopData(authResult.shopId! as string);
      
      // Update with real shop info if we got it successfully
      if (realShopInfo && realShopInfo.shop_name && realShopInfo.shop_name !== minimalShopInfo.shop_name) {
        await shopeeAuth.storeBusinessAccount({
          accessToken: authResult.accessToken!,
          refreshToken: authResult.refreshToken!,
          expiresAt: authResult.expiresAt!,
          shopId: authResult.shopId!
        }, realShopInfo);
      }

      // Clean up state
      oauthStates.delete(state as string);

      console.log(`Shopee OAuth successful for shop: ${shop_id}`);
      
      // Redirect to success page
      const redirectUrl = storedState.redirectUrl || '/shopee';
      res.redirect(`${redirectUrl}?connected=true&shop_id=${shop_id}`);
      
    } catch (error) {
      console.error('Shopee OAuth callback error:', error);
      res.redirect('/?error=oauth_failed&message=Authentication error occurred');
    }
  });

  // Shopee disconnect route  
  app.delete("/api/shopee-shop/disconnect/:accountId", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      // Delete from shopeeBusinessAccounts table
      const result = await db.delete(shopeeBusinessAccounts).where(eq(shopeeBusinessAccounts.id, accountId));
      
      console.log(`Shopee account disconnected: ${accountId}`);
      res.json({ success: true, message: "Shopee account disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Shopee account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get connected Shopee business accounts
  app.get("/api/shopee-shop/accounts", requireAdminAuth, async (req, res) => {
    try {
      const accounts = await db
        .select({
          id: shopeeBusinessAccounts.id,
          shopId: shopeeBusinessAccounts.shopId,
          displayName: shopeeBusinessAccounts.displayName,
          shopName: shopeeBusinessAccounts.shopName,
          shopLogo: shopeeBusinessAccounts.shopLogo,
          connected: shopeeBusinessAccounts.connected,
          isActive: shopeeBusinessAccounts.isActive,
          region: shopeeBusinessAccounts.region,
          shopType: shopeeBusinessAccounts.shopType,
          createdAt: shopeeBusinessAccounts.createdAt,
          lastSync: shopeeBusinessAccounts.lastSync
        })
        .from(shopeeBusinessAccounts)
        .where(eq(shopeeBusinessAccounts.connected, true))
        .orderBy(shopeeBusinessAccounts.createdAt);

      res.json({ accounts });
    } catch (error) {
      console.error("Error fetching Shopee accounts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Orders API
  app.get("/api/shopee-shop/orders", requireAdminAuth, async (req, res) => {
    try {
      const filters = {
        orderStatus: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        shopId: req.query.shopId as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
        sortBy: (req.query.sortBy as 'createTime' | 'totalAmount' | 'updatedAt') || 'createTime',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await shopeeOrdersService.getOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching Shopee orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics route MUST come before :orderId dynamic route
  app.get("/api/shopee-shop/orders/analytics", requireAdminAuth, async (req, res) => {
    try {
      const shopId = req.query.shopId as string;
      const analytics = await shopeeOrdersService.getOrderAnalytics(shopId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching Shopee order analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shopee-shop/orders/:orderId", requireAdminAuth, async (req, res) => {
    try {
      const order = await shopeeOrdersService.getOrderById(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching Shopee order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/shopee-shop/orders/:orderId/status", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { status, trackingInfo } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedOrder = await shopeeOrdersService.updateOrderStatus(req.params.orderId, status, trackingInfo);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating Shopee order status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Seller Dashboard API
  app.get("/api/shopee-shop/seller/:businessAccountId/dashboard", requireAdminAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      
      // Allow both UUID and shop account ID formats for now
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business account ID is required" });
      }

      const dashboardData = await shopeeSellerService.getSellerDashboard(businessAccountId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching Shopee seller dashboard:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shopee-shop/seller/:businessAccountId/analytics", requireAdminAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      
      // Allow both UUID and shop account ID formats for now
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business account ID is required" });
      }

      const metrics = await shopeeSellerService.getPerformanceMetrics(businessAccountId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching Shopee seller analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/shopee-shop/seller/:businessAccountId/sync", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      
      // Allow both UUID and shop account ID formats for now
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business account ID is required" });
      }

      const result = await shopeeSellerService.syncSellerData(businessAccountId);
      res.json(result);
    } catch (error) {
      console.error("Error syncing Shopee seller data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shopee-shop/sellers", requireAdminAuth, async (req, res) => {
    try {
      const sellers = await shopeeSellerService.getAllSellers();
      res.json(sellers);
    } catch (error) {
      console.error("Error fetching Shopee sellers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shopee-shop/sellers/comparison", requireAdminAuth, async (req, res) => {
    try {
      const comparison = await shopeeSellerService.getSellerComparison();
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching Shopee seller comparison:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Account Management
  app.delete("/api/shopee-shop/disconnect/:businessAccountId", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      
      // Allow both UUID and shop account ID formats for now
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business account ID is required" });
      }

      const result = await shopeeSellerService.disconnectSeller(businessAccountId);
      res.json(result);
    } catch (error) {
      console.error("Error disconnecting Shopee seller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Products API (placeholder for future implementation)
  app.get("/api/shopee-shop/products", requireAdminAuth, async (req, res) => {
    try {
      // Placeholder - would implement product listing from Shopee API
      res.json({ 
        products: [],
        message: "Shopee Products API - Coming Soon" 
      });
    } catch (error) {
      console.error("Error fetching Shopee products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Inventory Management (placeholder)
  app.get("/api/shopee-shop/inventory/alerts", requireAdminAuth, async (req, res) => {
    try {
      const shopId = req.query.shopId as string;
      
      if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
      }

      const alerts = await shopeeSellerService.getInventoryAlerts(shopId);
      res.json({ alerts });
    } catch (error) {
      console.error("Error fetching Shopee inventory alerts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Shopee Fulfillment Routes
  app.get("/api/shopee-shop/fulfillment/queue", requireAdminAuth, async (req, res) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const search = req.query.search as string;
      
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business Account ID is required" });
      }

      // Get full queue first, then apply fulfillment-level status filtering
      const queue = await shopeeFulfillmentService.getFulfillmentQueue(businessAccountId, {});
      
      // Apply fulfillment-level status filtering after smart mapping
      let filteredQueue = queue;
      if (status && status !== 'all') {
        filteredQueue = queue.filter(task => task.status === status);
      }
      if (priority && priority !== 'all') {
        filteredQueue = filteredQueue.filter(task => task.priority === priority);
      }
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredQueue = filteredQueue.filter(task => 
          task.orderNumber.toLowerCase().includes(searchLower) ||
          task.customerName.toLowerCase().includes(searchLower)
        );
      }

      res.json(filteredQueue);
    } catch (error) {
      console.error("Error fetching Shopee fulfillment queue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shopee-shop/fulfillment/stats", requireAdminAuth, async (req, res) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business Account ID is required" });
      }

      const stats = await shopeeFulfillmentService.getFulfillmentStats(businessAccountId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching Shopee fulfillment stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/shopee-shop/fulfillment/tasks/:taskId/status", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, ...updates } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedTask = await shopeeFulfillmentService.updateTaskStatus(taskId, status, updates);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating Shopee fulfillment task status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/shopee-shop/fulfillment/tasks/:taskId/shipping-label", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const label = await shopeeFulfillmentService.generateShippingLabel(taskId);
      
      // For demo purposes, return the label info
      // In production, this would return the actual PDF file
      res.json({
        success: true,
        label,
        message: "Shipping label generated successfully"
      });
    } catch (error) {
      console.error("Error generating Shopee shipping label:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/shopee-shop/fulfillment/bulk-update", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { orderIds, action } = req.body;
      
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Order IDs array is required" });
      }
      
      if (!action) {
        return res.status(400).json({ error: "Action is required" });
      }

      const result = await shopeeFulfillmentService.batchProcessOrders(orderIds, action);
      res.json(result);
    } catch (error) {
      console.error("Error with Shopee bulk fulfillment update:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔧 FIXED: Real API Sync Routes - Only work with real credentials
  app.post("/api/shopee-shop/sync/:businessAccountId", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      const { syncType = 'full' } = req.body;
      
      // Allow both UUID and shop account ID formats for now
      if (!businessAccountId) {
        return res.status(400).json({ error: "Business account ID is required" });
      }

      // Check if Shopee credentials are available
      const syncService = createShopeeApiSync();
      if (!syncService) {
        return res.status(503).json({ 
          error: "Shopee API sync not available", 
          message: "Real Shopee credentials required. Currently using demo data."
        });
      }

      // Get shop ID from business account
      const [businessAccount] = await db
        .select()
        .from(shopeeBusinessAccounts)
        .where(eq(shopeeBusinessAccounts.id, businessAccountId));

      if (!businessAccount) {
        return res.status(404).json({ error: "Business account not found" });
      }

      console.log(`🚀 Starting ${syncType} sync for shop: ${businessAccount.shopId}`);

      let result;
      switch (syncType) {
        case 'orders':
          result = await syncService.syncOrders(businessAccountId, businessAccount.shopId);
          break;
        case 'products':
          result = await syncService.syncProducts(businessAccountId, businessAccount.shopId);
          break;
        case 'full':
        default:
          result = await syncService.fullShopSync(businessAccountId, businessAccount.shopId);
          break;
      }

      res.json({
        success: true,
        message: `${syncType} sync completed for shop: ${businessAccount.shopName}`,
        result
      });

    } catch (error) {
      console.error("Error syncing Shopee data:", error);
      res.status(500).json({ 
        error: "Sync failed", 
        message: error instanceof Error ? error.message : "Unknown sync error"
      });
    }
  });

  app.get("/api/shopee-shop/sync-status", requireAdminAuth, async (req, res) => {
    try {
      const syncService = createShopeeApiSync();
      const isAvailable = !!syncService;
      
      res.json({
        syncAvailable: isAvailable,
        message: isAvailable 
          ? "Real Shopee API sync is available" 
          : "Using demo data - add SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY for real sync",
        demoMode: !isAvailable
      });
    } catch (error) {
      console.error("Error checking sync status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Ship Order API - POST /api/shopee-shop/orders/:orderSn/ship
  app.post("/api/shopee-shop/orders/:orderSn/ship", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { orderSn } = req.params;
      const { trackingNumber, shippingCarrier, pickupTime, shipTime, estimatedDeliveryTime } = req.body;

      if (!orderSn || !trackingNumber || !shippingCarrier) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Order number, tracking number, and shipping carrier are required"
        });
      }

      // Find business account for this order
      const [orderRecord] = await db
        .select()
        .from(shopeeShopOrders)
        .where(eq(shopeeShopOrders.orderSn, orderSn))
        .limit(1);

      if (!orderRecord) {
        return res.status(404).json({
          error: "Order not found",
          message: `Order ${orderSn} not found in database`
        });
      }

      // Get sync service and ship order
      const syncService = createShopeeApiSync();
      if (!syncService) {
        return res.status(503).json({
          error: "Shopee API unavailable",
          message: "Shopee API credentials not configured. Please contact administrator."
        });
      }

      // Prepare shipping data
      const shippingData = {
        trackingNumber,
        shippingCarrier,
        pickupTime: pickupTime ? new Date(pickupTime) : undefined,
        shipTime: shipTime ? new Date(shipTime) : new Date(),
        estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : undefined
      };

      console.log(`🚢 Shipping order ${orderSn} via ${shippingCarrier} with tracking: ${trackingNumber}`);

      // Call ship order API
      const result = await syncService.shipOrder(
        orderRecord.businessAccountId || '',
        orderRecord.shopId || '',
        orderSn as string, // TypeScript: orderSn validated above
        shippingData
      );

      if (!result.success) {
        return res.status(400).json({
          error: "Ship order failed",
          message: result.error || "Failed to ship order via Shopee API"
        });
      }

      res.json({
        success: true,
        message: `Order ${orderSn} shipped successfully`,
        data: {
          orderSn,
          trackingNumber: result.trackingNumber,
          shippingCarrier: result.shippingCarrier,
          shipTime: result.shipTime,
          status: 'shipped'
        }
      });

    } catch (error) {
      console.error(`❌ Ship order API error for ${req.params.orderSn}:`, error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // 🔄 TASK 5: Bulk Product Update API - POST /api/shopee-shop/products/bulk-update
  app.post("/api/shopee-shop/products/bulk-update", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { businessAccountId, updates } = req.body;

      if (!businessAccountId || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Business account ID and updates array are required"
        });
      }

      // Find business account
      const [businessAccount] = await db
        .select()
        .from(shopeeBusinessAccounts)
        .where(eq(shopeeBusinessAccounts.id, businessAccountId))
        .limit(1);

      if (!businessAccount) {
        return res.status(404).json({
          error: "Business account not found",
          message: `Business account ${businessAccountId} not found`
        });
      }

      // Get sync service
      const syncService = createShopeeApiSync();
      if (!syncService) {
        return res.status(503).json({
          error: "Shopee API unavailable",
          message: "Shopee API credentials not configured. Please contact administrator."
        });
      }

      console.log(`🔄 Bulk updating ${updates.length} products for shop: ${businessAccount.shopName}`);

      // Call bulk update API
      const result = await syncService.bulkUpdateProducts(
        businessAccountId,
        businessAccount.shopId,
        updates
      );

      res.json({
        success: result.success,
        message: `Bulk update completed: ${result.updatedCount}/${updates.length} products updated`,
        data: {
          updatedCount: result.updatedCount,
          totalCount: updates.length,
          errors: result.errors,
          successRate: `${Math.round((result.updatedCount / updates.length) * 100)}%`
        }
      });

    } catch (error) {
      console.error(`❌ Bulk update API error:`, error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // 📦 TASK 5: Inventory Sync API - POST /api/shopee-shop/products/:id/sync-inventory
  app.post("/api/shopee-shop/products/:id/sync-inventory", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { id: itemId } = req.params;
      const { businessAccountId, localStock } = req.body;

      if (!itemId || !businessAccountId || localStock === undefined) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Item ID, business account ID, and local stock are required"
        });
      }

      if (typeof localStock !== 'number' || localStock < 0) {
        return res.status(400).json({
          error: "Invalid stock value",
          message: "Local stock must be a non-negative number"
        });
      }

      // Find business account
      const [businessAccount] = await db
        .select()
        .from(shopeeBusinessAccounts)
        .where(eq(shopeeBusinessAccounts.id, businessAccountId))
        .limit(1);

      if (!businessAccount) {
        return res.status(404).json({
          error: "Business account not found",
          message: `Business account ${businessAccountId} not found`
        });
      }

      // Get sync service
      const syncService = createShopeeApiSync();
      if (!syncService) {
        return res.status(503).json({
          error: "Shopee API unavailable",
          message: "Shopee API credentials not configured. Please contact administrator."
        });
      }

      console.log(`📦 Syncing inventory for product ${itemId} - Local: ${localStock}`);

      // Call inventory sync API
      const result = await syncService.syncInventory(
        businessAccountId,
        businessAccount.shopId,
        itemId,
        localStock
      );

      if (!result.success) {
        return res.status(400).json({
          error: "Inventory sync failed",
          message: "Failed to sync inventory with Shopee"
        });
      }

      res.json({
        success: true,
        message: result.conflict 
          ? `Inventory conflict resolved: Updated local stock to match Shopee (${result.shopeeStock})`
          : `Inventory synced successfully: ${result.localStock} units`,
        data: {
          shopeeStock: result.shopeeStock,
          localStock: result.localStock,
          conflict: result.conflict,
          syncDirection: result.conflict ? 'from_shopee' : 'to_shopee'
        }
      });

    } catch (error) {
      console.error(`❌ Inventory sync API error for ${req.params.id}:`, error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // 🎯 TASK 5: Product Status Management API - PATCH /api/shopee-shop/products/:id/status
  app.patch("/api/shopee-shop/products/:id/status", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { id: itemId } = req.params;
      const { businessAccountId, status } = req.body;

      if (!itemId || !businessAccountId || !status) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Item ID, business account ID, and status are required"
        });
      }

      // Validate status
      const validStatuses = ['NORMAL', 'BANNED', 'DELETED', 'UNLIST'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          error: "Invalid status",
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Find business account
      const [businessAccount] = await db
        .select()
        .from(shopeeBusinessAccounts)
        .where(eq(shopeeBusinessAccounts.id, businessAccountId))
        .limit(1);

      if (!businessAccount) {
        return res.status(404).json({
          error: "Business account not found",
          message: `Business account ${businessAccountId} not found`
        });
      }

      // Get sync service
      const syncService = createShopeeApiSync();
      if (!syncService) {
        return res.status(503).json({
          error: "Shopee API unavailable",
          message: "Shopee API credentials not configured. Please contact administrator."
        });
      }

      console.log(`🎯 Updating product ${itemId} status to: ${status}`);

      // Call status update API
      const result = await syncService.updateProductStatus(
        businessAccountId,
        businessAccount.shopId,
        itemId,
        status.toUpperCase() as 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST'
      );

      if (!result.success) {
        return res.status(400).json({
          error: "Status update failed",
          message: "Failed to update product status on Shopee"
        });
      }

      res.json({
        success: true,
        message: `Product status updated successfully to: ${result.newStatus}`,
        data: {
          itemId,
          oldStatus: status.toUpperCase(),
          newStatus: result.newStatus,
          shopName: businessAccount.shopName
        }
      });

    } catch (error) {
      console.error(`❌ Status update API error for ${req.params.id}:`, error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });
}