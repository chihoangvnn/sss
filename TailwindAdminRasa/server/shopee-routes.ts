import { Express } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import ShopeeAuthService from './shopee-auth.js';
import { shopeeOrdersService } from './shopee-orders.js';
import { shopeeSellerService } from './shopee-seller.js';
import { insertShopeeBusinessAccountSchema, insertShopeeShopOrderSchema, insertShopeeShopProductSchema } from '../shared/schema.js';

// Create OAuth state storage (in production, use Redis or persistent storage)
const oauthStates = new Map();

export function setupShopeeRoutes(app: Express, requireAdminAuth: any, requireCSRFToken: any) {
  
  // Shopee Authentication Routes - SECURED
  app.post("/api/shopee-shop/connect", requireAdminAuth, requireCSRFToken, async (req, res) => {
    try {
      const { partnerId, partnerKey, region = 'VN' } = req.body;
      
      if (!partnerId || !partnerKey) {
        return res.status(400).json({ 
          error: "Missing required credentials",
          message: "Partner ID and Partner Key are required"
        });
      }

      const shopeeAuth = new ShopeeAuthService({
        partnerId,
        partnerKey,
        redirectUri: `${process.env.REPL_URL || 'http://localhost:5000'}/auth/shopee/callback`,
        region
      });

      const state = crypto.randomUUID();
      const redirectUrl = req.body.redirectUrl || '/shopee-shop';
      
      // Store state for verification
      oauthStates.set(state, { 
        timestamp: Date.now(),
        redirectUrl,
        platform: 'shopee',
        shopeeAuth
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

  // Shopee OAuth Callback
  app.get("/auth/shopee/callback", async (req, res) => {
    try {
      const { code, shop_id, state, error } = req.query;
      
      if (error) {
        console.error('Shopee OAuth error:', error);
        return res.redirect('/shopee-shop?error=access_denied');
      }
      
      if (!code || !shop_id || !state || typeof code !== 'string' || typeof shop_id !== 'string' || typeof state !== 'string') {
        return res.redirect('/shopee-shop?error=invalid_request');
      }
      
      // Verify state parameter
      const storedState = oauthStates.get(state);
      if (!storedState || storedState.platform !== 'shopee') {
        return res.redirect('/shopee-shop?error=invalid_state');
      }
      
      // Clean up state
      oauthStates.delete(state);
      
      const shopeeAuth = storedState.shopeeAuth;
      
      // Exchange code for token
      const tokenResult = await shopeeAuth.exchangeCodeForToken(code, shop_id);
      
      if (!tokenResult.success) {
        console.error('Shopee token exchange failed:', tokenResult.error);
        return res.redirect('/shopee-shop?error=token_exchange_failed');
      }

      // Store business account (would need shop info from Shopee API)
      const shopInfo = {
        shop_name: `Shopee Shop ${shop_id}`,
        shop_logo: null,
        shop_type: 'normal',
        contact_email: null,
        contact_phone: null
      };

      await shopeeAuth.storeBusinessAccount({
        accessToken: tokenResult.accessToken!,
        refreshToken: tokenResult.refreshToken!,
        expiresAt: tokenResult.expiresAt!,
        shopId: shop_id
      }, shopInfo);
      
      // Redirect to success page
      const allowedPaths = ['/shopee-shop', '/social-media', '/marketplace'];
      const redirectPath = (storedState.redirectUrl && allowedPaths.includes(storedState.redirectUrl)) 
        ? storedState.redirectUrl 
        : '/shopee-shop';
      
      res.redirect(`${redirectPath}?success=shopee_connected`);
    } catch (error) {
      console.error("Error in Shopee OAuth callback:", error);
      res.redirect('/shopee-shop?error=authentication_failed');
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

  // Shopee Seller Dashboard API
  app.get("/api/shopee-shop/seller/:businessAccountId/dashboard", requireAdminAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      
      if (!businessAccountId || !businessAccountId.match(/^[0-9a-fA-F-]{36}$/)) {
        return res.status(400).json({ error: "Invalid business account ID format" });
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
      
      if (!businessAccountId || !businessAccountId.match(/^[0-9a-fA-F-]{36}$/)) {
        return res.status(400).json({ error: "Invalid business account ID format" });
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
      
      if (!businessAccountId || !businessAccountId.match(/^[0-9a-fA-F-]{36}$/)) {
        return res.status(400).json({ error: "Invalid business account ID format" });
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
      
      if (!businessAccountId || !businessAccountId.match(/^[0-9a-fA-F-]{36}$/)) {
        return res.status(400).json({ error: "Invalid business account ID format" });
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
}