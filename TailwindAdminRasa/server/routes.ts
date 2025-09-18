import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertCategorySchema, insertPaymentSchema, insertSocialAccountSchema, insertShopSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { setupRasaRoutes } from "./rasa-routes";
import { facebookAuth } from "./facebook-auth";
import { generateSKU } from "./utils/sku-generator";
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary, convertToCloudinaryMedia } from './services/cloudinary';


// Payment status validation schema
const paymentStatusSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "cancelled"], {
    errorMap: () => ({ message: "Status must be one of: pending, completed, failed, cancelled" })
  }),
  transactionId: z.string().optional()
});

// Session-based authentication middleware for frontend users
const requireSessionAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests (production would check session)
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  // In production, check for valid session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      message: "Please log in to access this resource" 
    });
  }
  
  next();
};

// Rate limiting for payment endpoints
const paymentRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

const rateLimitMiddleware = (req: any, res: any, next: any) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  const clientData = paymentRateLimit.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    paymentRateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    next();
    return;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many payment requests. Please try again later."
    });
  }
  
  clientData.count++;
  next();
};

// OAuth state storage for CSRF protection
const oauthStates = new Map<string, { timestamp: number; redirectUrl?: string }>();
const OAUTH_STATE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// Clean up expired OAuth states
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(oauthStates.entries());
  for (const [state, data] of entries) {
    if (now - data.timestamp > OAUTH_STATE_TIMEOUT) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Simple health check - return basic status
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          server: "running",
          database: "connected" // Will enhance with actual Firebase check later
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Dashboard API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cloudinary Media Upload API
  app.post("/api/media/upload", upload.array('files', 10) as any, async (req: any, res: any) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "No files provided",
          message: "Please select at least one file to upload"
        });
      }

      const uploadPromises = files.map(async (file) => {
        const folder = req.body.folder || 'products';
        const alt = req.body.alt || '';
        const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

        const result = await uploadToCloudinary(file.buffer, file.mimetype, {
          folder,
          tags,
        });

        return convertToCloudinaryMedia(result, alt);
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadedMedia.length} file(s)`,
        media: uploadedMedia,
      });

    } catch (error) {
      console.error("Media upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Delete media from Cloudinary
  app.delete("/api/media/:publicId", async (req, res) => {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        return res.status(400).json({
          error: "Missing public_id",
          message: "Public ID is required to delete media"
        });
      }

      await deleteFromCloudinary(publicId, resourceType as 'image' | 'video');

      res.json({
        success: true,
        message: "Media deleted successfully",
        publicId
      });

    } catch (error) {
      console.error("Media deletion error:", error);
      res.status(500).json({
        error: "Deletion failed",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { limit, categoryId, withCategories, search, offset } = req.query;
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;
      
      if (withCategories === 'true') {
        const products = await storage.getProductsWithCategory(limitNum, categoryId as string, search as string, offsetNum);
        res.json(products);
      } else {
        const products = await storage.getProducts(limitNum, categoryId as string, search as string, offsetNum);
        res.json(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Popular products API
  app.get("/api/products/popular", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const popularProducts = await storage.getPopularProducts(limit);
      res.json(popularProducts);
    } catch (error) {
      console.error("Error fetching popular products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // Generate SKU automatically
      let generatedSKU: string = "";
      
      if (validatedData.categoryId) {
        // Use generateSKU for products with category
        generatedSKU = await generateSKU(validatedData.categoryId);
      } else {
        // Generate SKU manually for products without category using "Khác" prefix
        const prefix = "KH"; // "Khác" -> "KH" 
        let attempts = 0;
        let isUnique = false;
        
        while (!isUnique && attempts < 10) {
          const randomNumber = Math.floor(1000 + Math.random() * 9000);
          const sku = `${prefix}${randomNumber}`;
          
          // Check if SKU already exists
          const existingProduct = await storage.getProductBySKU(sku);
          if (!existingProduct) {
            generatedSKU = sku;
            isUnique = true;
            break;
          }
          attempts++;
        }
        
        if (!isUnique) {
          throw new Error("Could not generate unique SKU after 10 attempts");
        }
      }
      const productData = {
        ...validatedData,
        sku: generatedSKU
      };
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const partialProductSchema = insertProductSchema.partial();
      const validatedData = partialProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Customers API
  app.get("/api/customers", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const customers = await storage.getCustomers(limit);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Customer search by phone (for member lookup) - MUST be before /:id route
  app.get("/api/customers/search", async (req, res) => {
    try {
      const { phone } = req.query;
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: "Phone parameter is required" });
      }

      // Normalize to digits only and validate minimum length
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 3) {
        return res.json([]); // Return empty for better UX
      }

      // Get all customers and filter by phone ending with the search digits
      const allCustomers = await storage.getCustomers(1000);
      
      // Filter customers whose phone ends with the search digits
      const matchingCustomers = allCustomers.filter(customer => 
        customer.phone && customer.phone.replace(/\D/g, '').endsWith(phoneDigits)
      );
      
      // Limit results to prevent UI overload
      const limitedResults = matchingCustomers.slice(0, 5);
      
      // Get most recent address for each customer from storefront orders
      const customersWithAddresses = await Promise.all(
        limitedResults.map(async (customer) => {
          try {
            // Get customer's most recent storefront order to get their address
            const recentAddress = await storage.getCustomerRecentAddress(customer.id);
            return {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              status: customer.status,
              recentAddress: recentAddress || null
            };
          } catch (error) {
            console.error(`Error getting address for customer ${customer.id}:`, error);
            return {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              status: customer.status,
              recentAddress: null
            };
          }
        })
      );

      res.json(customersWithAddresses);
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const partialCustomerSchema = insertCustomerSchema.partial();
      const validatedData = partialCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Industries API
  app.get("/api/industries", async (req, res) => {
    try {
      const industries = await storage.getIndustries();
      res.json(industries);
    } catch (error) {
      console.error("Error fetching industries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/industries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const industry = await storage.getIndustry(id);
      if (industry) {
        res.json(industry);
      } else {
        res.status(404).json({ error: "Industry not found" });
      }
    } catch (error) {
      console.error("Error fetching industry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/industries", async (req, res) => {
    try {
      const { name, description, isActive = true, sortOrder = 0 } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      
      const industry = await storage.createIndustry({
        name,
        description,
        isActive,
        sortOrder
      });
      res.json({ ...industry, message: "Industry created successfully" });
    } catch (error) {
      console.error("Error creating industry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/industries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive, sortOrder } = req.body;
      const industry = await storage.updateIndustry(id, {
        name,
        description,
        isActive,
        sortOrder
      });
      if (industry) {
        res.json({ ...industry, message: "Industry updated successfully" });
      } else {
        res.status(404).json({ error: "Industry not found" });
      }
    } catch (error) {
      console.error("Error updating industry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/industries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteIndustry(id);
      if (success) {
        res.json({ message: "Industry deleted successfully" });
      } else {
        res.status(404).json({ error: "Industry not found" });
      }
    } catch (error) {
      console.error("Error deleting industry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const { industryId } = req.query;
      const industryIdParam = typeof industryId === 'string' ? industryId : undefined;
      const categories = await storage.getCategories(industryIdParam);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const partialCategorySchema = insertCategorySchema.partial();
      const validatedData = partialCategorySchema.parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await storage.getOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderWithDetails(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const partialOrderSchema = insertOrderSchema.partial();
      const validatedData = partialOrderSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order Items API
  app.get("/api/order-items", async (req, res) => {
    try {
      const { orderId } = req.query;
      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: "Order ID is required" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/order-items", async (req, res) => {
    try {
      const { orderId, productId, quantity, price } = req.body;
      
      if (!orderId || !productId || !quantity || !price) {
        return res.status(400).json({ 
          error: "Missing required fields: orderId, productId, quantity, price" 
        });
      }
      
      const orderItem = await storage.createOrderItem({
        orderId,
        productId, 
        quantity: parseFloat(quantity),
        price: price.toString()
      });
      
      res.status(201).json(orderItem);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payments API - Session-authenticated for frontend users
  app.get("/api/orders/:id/payment", requireSessionAuth, rateLimitMiddleware, async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      // Return null instead of 404 when payment doesn't exist - better UX
      res.json(payment || null);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Create payment endpoint - Session-authenticated for frontend users
  app.post("/api/orders/:id/payment", requireSessionAuth, rateLimitMiddleware, async (req, res) => {
    try {
      // Validate order ID format
      if (!req.params.id || typeof req.params.id !== 'string') {
        return res.status(400).json({ error: "Invalid order ID format" });
      }

      // First check if order exists
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if payment already exists for this order
      const existingPayment = await storage.getPayment(req.params.id);
      if (existingPayment) {
        return res.status(200).json(existingPayment); // Return existing payment instead of error for better UX
      }

      // Bank information for VietQR - centralized configuration
      const bankInfo = {
        bank: "ACB",
        bankCode: "970416",
        accountNumber: "4555567777",
        accountName: "CONG TY TNHH ABC TECH",
      };

      // Generate QR code URL with FULL order ID (not truncated)
      const amount = Math.round(parseFloat(order.total.toString()));
      const content = `DH${order.id}`; // Use FULL order ID as requested
      const qrCode = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;

      // Create payment data with strict validation
      const paymentData = {
        orderId: req.params.id,
        method: "qr_code" as const,
        amount: order.total,
        qrCode: qrCode,
        status: "pending" as const,
        bankInfo: bankInfo,
      };

      const validatedData = insertPaymentSchema.parse(paymentData);
      const payment = await storage.createPayment(validatedData);
      
      // Log payment creation for audit trail
      console.log(`Session-authenticated payment created for order ${req.params.id} - Amount: ${order.total}`);
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors,
          message: "Invalid payment data provided"
        });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/orders/:id/payment/status", requireSessionAuth, rateLimitMiddleware, async (req, res) => {
    try {
      // Validate order ID format
      if (!req.params.id || typeof req.params.id !== 'string') {
        return res.status(400).json({ error: "Invalid order ID format" });
      }

      // Strict validation of status and transactionId
      const validatedBody = paymentStatusSchema.parse(req.body);
      const { status, transactionId } = validatedBody;

      // Get existing payment
      const existingPayment = await storage.getPayment(req.params.id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Payment not found for this order" });
      }

      // Validate state transitions - prevent invalid status changes
      const validTransitions: Record<string, string[]> = {
        "pending": ["completed", "failed", "cancelled"],
        "completed": [], // Final state - no transitions allowed
        "failed": ["pending"], // Allow retry
        "cancelled": ["pending"] // Allow retry
      };

      const allowedNextStates = validTransitions[existingPayment.status] || [];
      if (!allowedNextStates.includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status transition",
          message: `Cannot change status from '${existingPayment.status}' to '${status}'`,
          currentStatus: existingPayment.status,
          allowedStates: allowedNextStates
        });
      }

      // Enhanced validation for completed status
      if (status === "completed") {
        if (!transactionId) {
          return res.status(400).json({ 
            error: "Transaction ID required",
            message: "Transaction ID is required when marking payment as completed"
          });
        }
        
        // Validate transaction ID format (basic validation)
        if (transactionId.length < 6) {
          return res.status(400).json({ 
            error: "Invalid transaction ID",
            message: "Transaction ID must be at least 6 characters long"
          });
        }
      }
      
      // Validate state transitions - prevent unauthorized changes
      if (existingPayment.status === "completed" && status !== "completed") {
        return res.status(400).json({ 
          error: "Invalid status change",
          message: "Cannot change status of completed payment"
        });
      }

      const payment = await storage.updatePaymentStatus(existingPayment.id, status, transactionId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Log status change for audit trail
      console.log(`Payment status updated for order ${req.params.id}: ${existingPayment.status} -> ${status}${transactionId ? ` (TX: ${transactionId})` : ''}`);
      
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors,
          message: "Invalid status or transaction data provided"
        });
      }
      console.error("Error updating payment status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Facebook OAuth Routes
  app.get("/auth/facebook", async (req, res) => {
    try {
      // Generate CSRF state parameter
      const state = facebookAuth.generateState();
      const redirectUrl = req.query.redirect as string;
      
      // Store state for verification
      oauthStates.set(state, { 
        timestamp: Date.now(),
        redirectUrl: redirectUrl || '/social-media' 
      });
      
      // Generate authorization URL
      const authUrl = facebookAuth.getAuthorizationUrl(state);
      
      // Redirect to Facebook OAuth
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Facebook OAuth:", error);
      res.status(500).json({ 
        error: "Failed to initiate Facebook authentication",
        message: "Please try again later"
      });
    }
  });

  app.get("/auth/facebook/callback", async (req, res) => {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth error from Facebook
      if (error) {
        console.error("Facebook OAuth error:", error, error_description);
        const errorMessage = error === 'access_denied' ? 'Access was denied' : 'Authentication failed';
        return res.redirect(`/social-media?error=${encodeURIComponent(errorMessage)}`);
      }

      // Validate state parameter for CSRF protection
      if (!state || !oauthStates.has(state as string)) {
        console.error("Invalid or missing OAuth state parameter");
        return res.redirect('/social-media?error=security_error');
      }

      const stateData = oauthStates.get(state as string)!;
      oauthStates.delete(state as string); // Use state only once

      if (!code) {
        return res.redirect('/social-media?error=no_authorization_code');
      }

      // Exchange code for tokens
      const tokenData = await facebookAuth.exchangeCodeForToken(code as string);
      
      // Get long-lived token
      const longLivedTokenData = await facebookAuth.getLongLivedToken(tokenData.access_token);
      
      // Get user profile
      const userProfile = await facebookAuth.getUserProfile(longLivedTokenData.access_token);
      
      // Get user's Facebook pages
      const pages = await facebookAuth.getUserPages(longLivedTokenData.access_token);

      // Store main profile as social account
      const socialAccountData = {
        platform: "facebook" as const,
        name: userProfile.name,
        accountId: userProfile.id,
        accessToken: longLivedTokenData.access_token,
        followers: 0,
        connected: true,
        lastPost: null,
        engagement: "0"
      };

      const socialAccount = await storage.createSocialAccount(socialAccountData);
      
      // If user has pages, get insights for the first page
      if (pages.length > 0) {
        const firstPage = pages[0];
        try {
          const insights = await facebookAuth.getPageInsights(firstPage.id, firstPage.access_token);
          await storage.updateSocialAccount(socialAccount.id, {
            followers: insights.followers,
            engagement: insights.engagement.toString()
          });
        } catch (insightError) {
          console.warn("Could not fetch page insights:", insightError);
        }
      }

      // Redirect back to social media page with success
      res.redirect(`${stateData.redirectUrl}?success=facebook_connected`);
    } catch (error) {
      console.error("Error in Facebook OAuth callback:", error);
      res.redirect('/social-media?error=authentication_failed');
    }
  });

  app.post("/api/facebook/connect", async (req, res) => {
    try {
      // This endpoint initiates the OAuth flow from the frontend
      const state = facebookAuth.generateState();
      const redirectUrl = req.body.redirectUrl || '/social-media';
      
      // Store state for verification
      oauthStates.set(state, { 
        timestamp: Date.now(),
        redirectUrl 
      });
      
      // Return authorization URL to frontend
      const authUrl = facebookAuth.getAuthorizationUrl(state);
      
      res.json({ authUrl, state });
    } catch (error) {
      console.error("Error generating Facebook OAuth URL:", error);
      res.status(500).json({ 
        error: "Failed to generate authentication URL",
        message: "Please try again later"
      });
    }
  });

  app.delete("/api/facebook/disconnect/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      
      // Find the social account
      const accounts = await storage.getSocialAccounts();
      const facebookAccount = accounts.find(
        account => account.id === accountId && account.platform === 'facebook'
      );
      
      if (!facebookAccount) {
        return res.status(404).json({ error: "Facebook account not found" });
      }
      
      // Revoke Facebook token
      if (facebookAccount.accessToken) {
        try {
          await facebookAuth.revokeToken(facebookAccount.accessToken);
        } catch (revokeError) {
          console.warn("Failed to revoke Facebook token:", revokeError);
        }
      }
      
      // Update account to disconnected state
      await storage.updateSocialAccount(accountId, {
        connected: false,
        accessToken: null
      });
      
      res.json({ success: true, message: "Facebook account disconnected" });
    } catch (error) {
      console.error("Error disconnecting Facebook account:", error);
      res.status(500).json({ 
        error: "Failed to disconnect Facebook account",
        message: "Please try again later"
      });
    }
  });

  // Social Media API
  app.get("/api/social-accounts", async (req, res) => {
    try {
      const accounts = await storage.getSocialAccounts();
      // Remove sensitive fields like accessToken before sending to client
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        platform: account.platform,
        name: account.name,
        accountId: account.accountId,
        followers: account.followers,
        connected: account.connected,
        lastPost: account.lastPost,
        engagement: account.engagement,
        createdAt: account.createdAt,
      }));
      res.json(safeAccounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/social-accounts", async (req, res) => {
    try {
      const account = await storage.createSocialAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating social account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/social-accounts/:id", async (req, res) => {
    try {
      const account = await storage.updateSocialAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Social account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating social account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chatbot API
  app.get("/api/chatbot/conversations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const conversations = await storage.getChatbotConversations(limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching chatbot conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chatbot/conversations", async (req, res) => {
    try {
      const conversation = await storage.createChatbotConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating chatbot conversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Placeholder for RASA integration
  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      // TODO: Integrate with RASA chatbot API
      // For now, return a mock response
      const response = {
        response: `Cảm ơn bạn đã gửi tin nhắn: "${message}". Tôi đang được phát triển để hỗ trợ tốt hơn.`,
        sessionId: sessionId || "default-session"
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Placeholder for Facebook webhook
  app.post("/api/webhooks/facebook", async (req, res) => {
    try {
      // TODO: Implement Facebook webhook processing
      console.log("Facebook webhook received:", req.body);
      res.status(200).json({ status: "received" });
    } catch (error) {
      console.error("Error processing Facebook webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Product Landing Pages API
  app.get("/api/product-landing-pages", async (req, res) => {
    try {
      const landingPages = await storage.getAllProductLandingPages();
      res.json(landingPages);
    } catch (error) {
      console.error("Error fetching product landing pages:", error);
      res.status(500).json({ error: "Failed to fetch landing pages" });
    }
  });

  app.get("/api/product-landing-pages/:id", async (req, res) => {
    try {
      const landingPage = await storage.getProductLandingPageWithDetails(req.params.id);
      if (!landingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }
      res.json(landingPage);
    } catch (error) {
      console.error("Error fetching landing page:", error);
      res.status(500).json({ error: "Failed to fetch landing page" });
    }
  });

  app.post("/api/product-landing-pages", async (req, res) => {
    try {
      const landingPage = await storage.createProductLandingPage(req.body);
      res.json({ id: landingPage.id, message: "Product landing page created successfully" });
    } catch (error) {
      console.error("Error creating landing page:", error);
      if (error instanceof Error && error.message === 'Slug already exists') {
        return res.status(400).json({ error: "Slug already exists" });
      }
      res.status(500).json({ error: "Failed to create landing page" });
    }
  });

  app.put("/api/product-landing-pages/:id", async (req, res) => {
    try {
      const landingPage = await storage.updateProductLandingPage(req.params.id, req.body);
      if (!landingPage) {
        return res.status(404).json({ error: "Landing page not found" });
      }
      res.json({ message: "Product landing page updated successfully" });
    } catch (error) {
      console.error("Error updating landing page:", error);
      res.status(500).json({ error: "Failed to update landing page" });
    }
  });

  app.delete("/api/product-landing-pages/:id", async (req, res) => {
    try {
      const success = await storage.deleteProductLandingPage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Landing page not found" });
      }
      res.json({ message: "Product landing page deleted successfully" });
    } catch (error) {
      console.error("Error deleting landing page:", error);
      res.status(500).json({ error: "Failed to delete landing page" });
    }
  });

  // Public landing page endpoint
  app.get("/api/public-landing/:slug", async (req, res) => {
    try {
      const landingPage = await storage.getProductLandingPageWithDetails(req.params.slug);
      
      if (landingPage && landingPage.isActive) {
        // Increment view count
        if (landingPage.id) {
          await storage.incrementLandingPageView(landingPage.id);
        }
        
        // Get product reviews for this landing page  
        const reviewsData = landingPage.product ? 
          await storage.getProductReviewsWithStats(landingPage.product.id) :
          { reviews: [], averageRating: 0, totalReviews: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

        return res.json({
          ...landingPage,
          reviewsData
        });
      }
    } catch (error) {
      console.error("Error fetching public landing page:", error);
    }
    
    // Landing page not found
    res.status(404).json({ error: "Landing page not found or inactive" });
  });

  // Order from landing page
  app.post("/api/landing-orders", async (req, res) => {
    try {
      const { landingPageId, customerInfo, productInfo, deliveryType } = req.body;
      
      // Create guest customer for the order
      const guestCustomer = await storage.createCustomer({
        name: customerInfo.name,
        email: customerInfo.email || `guest-${Date.now()}@landing.local`,
        phone: customerInfo.phone,
        status: 'active'
      });
      
      // Create order using existing order system
      const orderData = {
        customerId: guestCustomer.id,
        total: productInfo.totalPrice.toString(),
        items: productInfo.quantity,
        status: 'pending' as const
      };
      
      const order = await storage.createOrder(orderData);
      
      // Increment order count for landing page
      if (landingPageId) {
        await storage.incrementLandingPageOrder(landingPageId);
      }
      
      res.json({ 
        order, 
        customer: guestCustomer,
        message: "Order created successfully",
        deliveryType 
      });
    } catch (error) {
      console.error("Error creating landing page order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ==========================================
  // PRODUCT REVIEWS API ROUTES
  // ==========================================

  // Get product reviews with stats
  app.get('/api/product-reviews/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const reviewsData = await storage.getProductReviewsWithStats(productId);
      res.json(reviewsData);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({ error: 'Failed to load reviews' });
    }
  });

  // Create new product review (with validation and moderation)
  app.post('/api/product-reviews', async (req, res) => {
    try {
      // Basic validation
      const { productId, customerName, rating, content } = req.body;
      
      if (!productId || !customerName || !rating || !content) {
        return res.status(400).json({ 
          error: 'Missing required fields: productId, customerName, rating, content' 
        });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: 'Rating must be between 1 and 5' 
        });
      }
      
      if (content.length < 10 || content.length > 1000) {
        return res.status(400).json({ 
          error: 'Review content must be between 10 and 1000 characters' 
        });
      }
      
      // Verify product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Create review with moderation (requires admin approval)
      const reviewData = {
        ...req.body,
        isApproved: false, // Require admin approval
        helpfulCount: 0,
        images: req.body.images || []
      };
      
      const review = await storage.createProductReview(reviewData);
      
      res.json({ 
        success: true, 
        review: {
          ...review,
          message: 'Review submitted successfully. It will be visible after admin approval.'
        }
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  // ==========================================
  // STOREFRONT API ROUTES (Public store frontend)
  // ==========================================

  // Get all storefront configs (admin)
  app.get("/api/storefront/config", async (req, res) => {
    try {
      const configs = await storage.getStorefrontConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching storefront configs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new storefront config (admin)
  app.post("/api/storefront/config", async (req, res) => {
    try {
      const { insertStorefrontConfigSchema } = await import("@shared/schema");
      const validation = insertStorefrontConfigSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid data format',
          details: validation.error.errors 
        });
      }

      const config = await storage.createStorefrontConfig(validation.data);
      res.json({ 
        success: true, 
        config,
        message: 'Storefront config created successfully' 
      });
    } catch (error) {
      console.error("Error creating storefront config:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get specific storefront config by name (admin)
  app.get("/api/storefront/config/:name", async (req, res) => {
    try {
      const config = await storage.getStorefrontConfigByName(req.params.name);
      if (!config) {
        return res.status(404).json({ error: "Storefront not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching storefront config:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update storefront config by ID (admin)
  app.put("/api/storefront/config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Config ID is required' });
      }

      const updatedConfig = await storage.updateStorefrontConfig(id, req.body);
      
      if (!updatedConfig) {
        return res.status(404).json({ error: 'Storefront config not found' });
      }
      
      res.json({ 
        success: true,
        config: updatedConfig,
        message: 'Storefront config updated successfully' 
      });
    } catch (error) {
      console.error("Error updating storefront config:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get public storefront data (for customers)
  app.get("/api/storefront/public/:name", async (req, res) => {
    try {
      const { name } = req.params;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Storefront name is required' });
      }

      const config = await storage.getStorefrontConfigByName(name);
      
      if (!config || !config.isActive) {
        return res.status(404).json({ error: 'Storefront not found or inactive' });
      }

      const topProducts = await storage.getTopProductsForStorefront(config.id);
      
      // Return public-safe data (no sensitive admin info)
      res.json({
        name: config.name,
        theme: config.theme,
        primaryColor: config.primaryColor,
        contactInfo: config.contactInfo,
        products: topProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          categoryId: product.categoryId
        })),
        storefrontConfigId: config.id // Needed for order creation
      });
    } catch (error) {
      console.error("Error fetching public storefront:", error);
      res.status(500).json({ error: "Failed to load storefront" });
    }
  });

  // Get storefront orders (admin)
  app.get("/api/storefront/orders", async (req, res) => {
    try {
      const { configId, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 50;
      
      const orders = await storage.getStorefrontOrders(
        configId as string, 
        limitNum
      );
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching storefront orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new customer order (public)
  app.post("/api/storefront/orders", async (req, res) => {
    try {
      const { insertStorefrontOrderSchema } = await import("@shared/schema");
      const validation = insertStorefrontOrderSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Thông tin đơn hàng không hợp lệ',
          details: validation.error.errors 
        });
      }

      // Verify storefront config exists and is active
      const config = await storage.getStorefrontConfig(validation.data.storefrontConfigId);
      if (!config || !config.isActive) {
        return res.status(400).json({ 
          error: 'Storefront không tồn tại hoặc đã bị tắt' 
        });
      }

      // Verify product exists and get canonical pricing
      const product = await storage.getProduct(validation.data.productId);
      if (!product) {
        return res.status(400).json({ 
          error: 'Sản phẩm không tồn tại' 
        });
      }

      // SECURITY: Calculate price and total server-side to prevent tampering
      // Never trust client-sent price/total values
      const quantity = validation.data.quantity;
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'Số lượng phải lớn hơn 0' 
        });
      }
      
      const unitPrice = parseFloat(product.price); // Canonical price from database
      const calculatedTotal = (unitPrice * quantity).toFixed(2);

      // Create order with server-calculated values
      const secureOrderData = {
        ...validation.data,
        productName: product.name, // Use product name from database
        unitPrice: product.price,  // Canonical price
        total: calculatedTotal     // Server-calculated total
      };

      const order = await storage.createStorefrontOrder(secureOrderData);
      
      // Auto-create customer if they don't exist (new customer flow)
      let customerCreated = false;
      if (order.customerPhone && order.customerName) {
        try {
          // Use existing pattern from customer search endpoint
          const allCustomers = await storage.getCustomers(); // Fetch all customers to prevent duplicates
          const normalizedPhone = order.customerPhone.replace(/\D/g, '');
          
          const existingCustomers = allCustomers.filter(customer => 
            customer.phone && customer.phone.replace(/\D/g, '') === normalizedPhone
          );
          
          if (existingCustomers.length === 0) {
            // Validate and create new customer record
            const customerData = insertCustomerSchema.parse({
              name: order.customerName,
              phone: order.customerPhone,
              email: order.customerEmail || undefined, // Use undefined instead of empty string
              status: 'active'
            });
            
            await storage.createCustomer(customerData);
            customerCreated = true;
            console.log(`Auto-created customer: ${order.customerName} (${normalizedPhone})`);
          }
        } catch (customerCreationError) {
          // Log error but don't fail the order - customer creation is not critical
          console.error('Error auto-creating customer:', customerCreationError);
        }
      }
      
      res.json({ 
        success: true,
        orderId: order.id,
        message: customerCreated 
          ? 'Đơn hàng đã được tạo thành công! Tài khoản thành viên đã được tạo cho bạn. Chúng tôi sẽ liên hệ với bạn sớm nhất.'
          : 'Đơn hàng đã được tạo thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        customerCreated: customerCreated,
        orderDetails: {
          customerName: order.customerName,
          phone: order.customerPhone,
          productName: order.productName,
          quantity: order.quantity,
          total: order.total,
          deliveryType: order.deliveryType
        }
      });
    } catch (error) {
      console.error("Error creating storefront order:", error);
      res.status(500).json({ 
        error: 'Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại sau.',
        success: false 
      });
    }
  });

  // Shop Settings API
  app.get("/api/shop-settings", async (req, res) => {
    try {
      const { id } = req.query;

      if (id === 'default') {
        // GET /api/shop-settings?id=default - Get default shop settings
        const defaultSettings = await storage.getDefaultShopSettings();
        res.json(defaultSettings || null);
      } else if (id && typeof id === 'string') {
        // GET /api/shop-settings?id=<id> - Get specific shop settings
        const foundSettings = await storage.getShopSettingsById(id);
        
        if (!foundSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json(foundSettings);
      } else {
        // GET /api/shop-settings - Get all shop settings
        const settings = await storage.getShopSettings();
        res.json(settings);
      }
    } catch (error) {
      console.error('Shop settings API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/shop-settings", async (req, res) => {
    try {
      const validation = insertShopSettingsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid data format',
          details: validation.error.errors 
        });
      }

      const settings = await storage.createShopSettings(validation.data);
      res.json({ 
        success: true, 
        settings,
        message: 'Shop settings created successfully' 
      });
    } catch (error) {
      console.error('Shop settings API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put("/api/shop-settings", async (req, res) => {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Settings ID is required for update' });
      }

      if (id === 'set-default') {
        // PUT /api/shop-settings?id=set-default - Set default shop settings
        const { settingsId } = req.body;
        
        if (!settingsId) {
          return res.status(400).json({ error: 'Settings ID is required' });
        }

        const updatedSettings = await storage.setDefaultShopSettings(settingsId);
        
        if (!updatedSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json({ 
          success: true,
          settings: updatedSettings,
          message: 'Default shop settings updated successfully' 
        });
      } else {
        // PUT /api/shop-settings?id=<id> - Update specific shop settings
        const validation = insertShopSettingsSchema.partial().safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Invalid data format',
            details: validation.error.errors 
          });
        }

        const updatedSettings = await storage.updateShopSettings(id, validation.data);
        
        if (!updatedSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json({ 
          success: true,
          settings: updatedSettings,
          message: 'Shop settings updated successfully' 
        });
      }
    } catch (error) {
      console.error('Shop settings API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete("/api/shop-settings", async (req, res) => {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Settings ID is required for deletion' });
      }

      const success = await storage.deleteShopSettings(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Shop settings not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Shop settings deleted successfully' 
      });
    } catch (error) {
      console.error('Shop settings API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Setup RASA-specific API routes for chatbot integration
  setupRasaRoutes(app);

  // ==========================================
  // API FALLBACK - Catch unmatched API routes and return JSON 404
  // This prevents API requests from falling through to Vite's HTML serve
  // ==========================================
  app.use("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "API endpoint not found",
      path: req.originalUrl,
      message: "The requested API endpoint does not exist"
    });
  });

  // Firebase sample data initialization (for development)
  app.post("/api/admin/init-sample-data", async (req, res) => {
    try {
      const { createSampleData } = await import("./firebase-sample-data");
      const result = await createSampleData();
      res.json({
        status: "success",
        message: "Dữ liệu mẫu đã được tạo thành công",
        data: result
      });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tạo dữ liệu mẫu",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
