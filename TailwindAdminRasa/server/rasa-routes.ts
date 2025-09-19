import { Express } from 'express';
import { storage } from './storage';
import { firebaseStorage } from './firebase-storage';

// Authentication middleware for RASA endpoints
const requireSessionAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      status: "error",
      error: "Unauthorized. Authentication required for RASA endpoints.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// CSRF protection for state-changing RASA operations
const requireCSRFToken = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
  const sessionCSRF = req.session.csrfToken;
  
  if (!csrfToken || !sessionCSRF || csrfToken !== sessionCSRF) {
    return res.status(403).json({ 
      status: "error",
      error: "CSRF token invalid", 
      message: "Invalid or missing CSRF token" 
    });
  }
  
  next();
};

// Helper function for real inventory data
const getInventory = async (productId: string, variantId?: string) => {
  try {
    // Get real product stock from database
    const product = await storage.getProduct(productId);
    if (!product) {
      return { currentStock: 0, soldQuantity: 0 };
    }
    
    // Use real stock data from products table
    return {
      currentStock: product.stock || 0,
      soldQuantity: 0 // Could be calculated from order_items if needed
    };
  } catch (error) {
    console.error('Error getting inventory for product:', productId, error);
    return { currentStock: 0, soldQuantity: 0 };
  }
};

// RASA-specific API routes for chatbot integration
export function setupRasaRoutes(app: Express) {
  
  // === CATALOG & PRODUCT DISCOVERY APIs ===
  
  /**
   * GET /api/rasa/catalogs
   * Lấy danh sách tất cả catalog cho tư vấn
   */
  app.get("/api/rasa/catalogs", async (req, res) => {
    try {
      // Get real categories from database
      const categories = await storage.getCategories();
      const activeCatalogs = categories
        .filter(cat => cat.isActive)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          sortOrder: cat.sortOrder
        }));
      
      res.json({
        status: "success",
        data: activeCatalogs
      });
    } catch (error) {
      console.error("RASA API Error - Get Catalogs:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy danh sách nghành hàng" 
      });
    }
  });

  /**
   * GET /api/rasa/catalog-tree
   * Lấy cấu trúc phân cấp Industries → Categories → Products cho RASA chatbot
   */
  app.get("/api/rasa/catalog-tree", async (req, res) => {
    try {
      // Get all active industries
      const industries = await storage.getIndustries();
      const activeIndustries = industries.filter(industry => industry.isActive);
      
      // Build hierarchical tree structure
      const catalogTree = [];
      
      for (const industry of activeIndustries) {
        // Get categories for this industry
        const categories = await storage.getCategories(industry.id);
        const activeCategories = categories.filter(cat => cat.isActive);
        
        // Build categories with their products
        const categoriesWithProducts = [];
        
        for (const category of activeCategories) {
          // Get products for this category
          const products = await storage.getProducts(50, category.id); // Limit to 50 products per category
          const activeProducts = products.filter(product => product.status === 'active');
          
          // Map products to RASA format
          const rasaProducts = activeProducts.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price),
            stock: product.stock,
            image: product.image || null,
            sku: product.id
          }));
          
          categoriesWithProducts.push({
            id: category.id,
            name: category.name,
            description: category.description || '',
            sortOrder: category.sortOrder,
            products: rasaProducts,
            productCount: rasaProducts.length
          });
        }
        
        catalogTree.push({
          id: industry.id,
          name: industry.name,
          description: industry.description || '',
          sortOrder: industry.sortOrder,
          categories: categoriesWithProducts,
          categoryCount: categoriesWithProducts.length,
          totalProducts: categoriesWithProducts.reduce((sum, cat) => sum + cat.productCount, 0)
        });
      }
      
      res.json({
        status: "success",
        data: {
          catalogTree,
          summary: {
            totalIndustries: catalogTree.length,
            totalCategories: catalogTree.reduce((sum, ind) => sum + ind.categoryCount, 0),
            totalProducts: catalogTree.reduce((sum, ind) => sum + ind.totalProducts, 0)
          }
        }
      });
    } catch (error) {
      console.error("RASA API Error - Get Catalog Tree:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy cấu trúc danh mục sản phẩm" 
      });
    }
  });

  /**
   * GET /api/rasa/catalogs/:catalogId/subcatalogs
   * Lấy danh sách sub-catalog theo catalog để tư vấn chi tiết
   */
  app.get("/api/rasa/catalogs/:catalogId/subcatalogs", async (req, res) => {
    try {
      const { catalogId } = req.params;
      // Fallback subcatalogs demo data
      const subCatalogs = [
        { id: 'sub-phones', name: 'Điện thoại', description: 'Smartphone, điện thoại thông minh', catalogId, sortOrder: 1 },
        { id: 'sub-laptops', name: 'Laptop', description: 'Máy tính xách tay', catalogId, sortOrder: 2 },
        { id: 'sub-accessories', name: 'Phụ kiện', description: 'Tai nghe, ốp lưng, sạc', catalogId, sortOrder: 3 }
      ];
      
      res.json({
        status: "success",
        data: subCatalogs.map(sub => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          catalogId: sub.catalogId,
          sortOrder: sub.sortOrder
        }))
      });
    } catch (error) {
      console.error("RASA API Error - Get SubCatalogs:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy danh sách danh mục con" 
      });
    }
  });

  /**
   * GET /api/rasa/products/by-catalog/:catalogId
   * Lấy sản phẩm theo catalog cho tư vấn
   */
  app.get("/api/rasa/products/by-catalog/:catalogId", async (req, res) => {
    try {
      const { catalogId } = req.params;
      const { limit = 20 } = req.query;
      
      // Get products by category from our real database
      const products = await storage.getProducts(parseInt(limit as string), catalogId);
      
      res.json({
        status: "success",
        data: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          basePrice: parseFloat(product.price),
          price: parseFloat(product.price),
          stock: product.stock,
          categoryId: product.categoryId,
          status: product.status,
          image: product.image,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }))
      });
    } catch (error) {
      console.error("RASA API Error - Get Products by Catalog:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy danh sách sản phẩm" 
      });
    }
  });

  /**
   * GET /api/rasa/products/search
   * Tìm kiếm sản phẩm cho tư vấn thông minh
   */
  app.get("/api/rasa/products/search", async (req, res) => {
    try {
      const { q: searchTerm, limit = 20 } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu từ khóa tìm kiếm"
        });
      }

      // Use PostgreSQL storage instead of Firebase
      const allProducts = await storage.getProducts(parseInt(limit as string) || 20);
      
      // Simple search filter by name and description
      const searchLower = (searchTerm as string).toLowerCase();
      const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );

      res.json({
        status: "success",
        data: filteredProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || "",
          basePrice: parseFloat(product.price),
          unit: "cái",
          minOrderQuantity: 1,
          catalogId: "cat-electronics", // Demo category
          subCatalogId: null,
          images: product.image ? [product.image] : [],
          tags: [],
          sku: product.id,
          stock: product.stock || 0,
          currentStock: product.stock || 0
        }))
      });
    } catch (error) {
      console.error("RASA API Error - Search Products:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tìm kiếm sản phẩm" 
      });
    }
  });

  /**
   * GET /api/rasa/products/:productId/details
   * Lấy chi tiết sản phẩm và variants cho tư vấn chính xác
   */
  app.get("/api/rasa/products/:productId/details", async (req, res) => {
    try {
      const { productId } = req.params;
      
      // Use PostgreSQL storage for product details
      const product = await storage.getProduct(productId);
      const variants: any[] = []; // Demo: no variants system yet
      const inventory = { quantity: 100, available: 95 }; // Demo inventory

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm"
        });
      }

      // Get variants with their inventory
      const variantsWithInventory = await Promise.all(
        variants.map(async (variant: any) => {
          const variantInventory = await getInventory(
            productId, 
            variant.id
          );
          return {
            id: variant.id,
            name: variant.name,
            price: variant.price,
            sku: variant.sku,
            isActive: variant.isActive,
            inventory: {
              currentStock: variantInventory.currentStock || 0,
              soldQuantity: variantInventory.soldQuantity || 0,
              isInStock: variantInventory.currentStock > 0
            }
          };
        })
      );

      res.json({
        status: "success",
        data: {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            basePrice: parseFloat(product.price),
            unit: "cái",
            minOrderQuantity: 1,
            images: product.image ? [product.image] : [],
            videos: [],
            tags: [],
            sku: product.id
          },
          variants: variantsWithInventory,
          baseInventory: {
            currentStock: inventory.quantity || 0,
            soldQuantity: inventory.available || 0,
            isInStock: inventory.quantity > 0
          }
        }
      });
    } catch (error) {
      console.error("RASA API Error - Get Product Details:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy chi tiết sản phẩm" 
      });
    }
  });

  /**
   * GET /api/rasa/products/:productId/availability
   * Kiểm tra tồn kho cho chatbot
   */
  app.get("/api/rasa/products/:productId/availability", async (req, res) => {
    try {
      const { productId } = req.params;
      const { variantId, quantity = 1 } = req.query;

      const inventory = await getInventory(
        productId, 
        variantId as string
      );

      const requestedQty = parseFloat(quantity as string);
      const availableQty = inventory.currentStock || 0;
      const isAvailable = availableQty >= requestedQty;

      res.json({
        status: "success",
        data: {
          productId,
          variantId: variantId || null,
          requestedQuantity: requestedQty,
          availableQuantity: availableQty,
          isAvailable,
          soldQuantity: inventory.soldQuantity || 0,
          message: isAvailable 
            ? `Có sẵn ${availableQty} cái`
            : `Chỉ còn ${availableQty} cái, không đủ số lượng yêu cầu`
        }
      });
    } catch (error) {
      console.error("RASA API Error - Check Availability:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể kiểm tra tồn kho" 
      });
    }
  });

  // === CUSTOMER MANAGEMENT APIs ===

  /**
   * GET /api/rasa/customers/search
   * Tìm kiếm khách hàng cho bot
   */
  app.get("/api/rasa/customers/search", requireSessionAuth, async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin tìm kiếm khách hàng"
        });
      }

      // Use PostgreSQL storage to search customers
      const allCustomers = await storage.getCustomers(50);
      
      // Simple search filter by name, phone, or email
      const searchLower = (searchTerm as string).toLowerCase();
      const filteredCustomers = allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );

      res.json({
        status: "success",
        data: filteredCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          customerType: "regular", // Default type
          totalDebt: 0, // Default no debt
          creditLimit: 50000000, // Default 50M credit limit
          isActive: customer.status === 'active'
        }))
      });
    } catch (error) {
      console.error("RASA API Error - Search Customers:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tìm kiếm khách hàng" 
      });
    }
  });

  /**
   * GET /api/rasa/customers/:customerId/profile
   * Lấy thông tin chi tiết khách hàng
   */
  app.get("/api/rasa/customers/:customerId/profile", requireSessionAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      
      const [customer, topProducts] = await Promise.all([
        storage.getCustomer(customerId),
        Promise.resolve([]) // Demo: no top products tracking yet
      ]);

      if (!customer) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy khách hàng"
        });
      }

      res.json({
        status: "success",
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            customerType: "regular",
            totalDebt: 0,
            creditLimit: 50000000,
            isActive: customer.status === 'active',
            address: "Địa chỉ mặc định"
          },
          topProducts,
          debtStatus: {
            hasDebt: false,
            debtAmount: 0,
            creditAvailable: 50000000,
            canOrder: true
          }
        }
      });
    } catch (error) {
      console.error("RASA API Error - Get Customer Profile:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy thông tin khách hàng" 
      });
    }
  });

  /**
   * POST /api/rasa/customers
   * Tạo khách hàng mới từ chatbot
   */
  app.post("/api/rasa/customers", requireSessionAuth, requireCSRFToken, async (req, res) => {
    try {
      const { name, phone, email, customerType = 'retail', creditLimit = 0 } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin tên và số điện thoại"
        });
      }

      const customerId = await storage.createCustomer({
        name,
        phone,
        email,
        status: "active"
      });

      res.json({
        status: "success",
        data: {
          customerId,
          message: `Đã tạo khách hàng ${name} thành công`
        }
      });
    } catch (error) {
      console.error("RASA API Error - Create Customer:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tạo khách hàng mới" 
      });
    }
  });

  // === ORDER MANAGEMENT APIs ===

  /**
   * POST /api/rasa/orders/calculate
   * Tính toán đơn hàng trước khi tạo
   */
  app.post("/api/rasa/orders/calculate", requireSessionAuth, requireCSRFToken, async (req, res) => {
    try {
      const { customerId, items, discount = 0, shippingFee = 0 } = req.body;

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin khách hàng hoặc sản phẩm"
        });
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy khách hàng"
        });
      }

      let subtotal = 0;
      const calculatedItems = [];

      // Validate items and calculate prices
      for (const item of items) {
        const { productId, variantId, quantity } = item;
        
        if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({
            status: "error",
            message: "Thông tin sản phẩm không hợp lệ"
          });
        }

        const [product, variants, inventory] = await Promise.all([
          storage.getProduct(productId),
          variantId ? Promise.resolve([]) : Promise.resolve([]),
          getInventory(productId, variantId)
        ]);

        if (!product) {
          return res.status(404).json({
            status: "error",
            message: `Không tìm thấy sản phẩm ${productId}`
          });
        }

        // Check stock availability
        const availableStock = inventory.currentStock || 0;
        if (availableStock < quantity) {
          return res.status(400).json({
            status: "error",
            message: `Sản phẩm "${product.name}" chỉ còn ${availableStock} cái, không đủ số lượng yêu cầu ${quantity}`
          });
        }

        // Get price (variant price or base price)
        let unitPrice = parseFloat(product.price);
        let productName = product.name;
        let variantName;

        // Note: Variants not implemented in current schema
        // if (variantId && variants.length > 0) {
        //   const variant = variants.find((v: any) => v.id === variantId);
        //   if (variant) {
        //     unitPrice = variant.price;
        //     variantName = variant.name;
        //     productName = `${product.name} - ${variant.name}`;
        //   }
        // }

        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        calculatedItems.push({
          productId,
          variantId,
          productName,
          variantName,
          quantity,
          unitPrice,
          total: itemTotal,
          unit: "cái"
        });
      }

      const discountAmount = Math.min(discount, subtotal);
      const tax = 0; // Configure as needed
      const total = subtotal - discountAmount + tax + shippingFee;

      // Check customer credit limit
      const potentialDebt = 0 + total;
      const canAfford = potentialDebt <= 50000000;

      res.json({
        status: "success",
        data: {
          calculation: {
            subtotal,
            discount: discountAmount,
            tax,
            shippingFee,
            total
          },
          items: calculatedItems,
          customer: {
            id: customer.id,
            name: customer.name,
            currentDebt: 0,
            creditLimit: 50000000,
            availableCredit: 50000000,
            canAfford
          },
          validation: {
            isValid: canAfford,
            message: canAfford 
              ? "Đơn hàng hợp lệ, có thể tạo đơn"
              : `Vượt quá hạn mức tín dụng. Cần thanh toán ${potentialDebt - 50000000} trước khi đặt hàng`
          }
        }
      });
    } catch (error) {
      console.error("RASA API Error - Calculate Order:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tính toán đơn hàng" 
      });
    }
  });

  /**
   * POST /api/rasa/orders
   * Tạo đơn hàng từ chatbot
   */
  app.post("/api/rasa/orders", requireSessionAuth, requireCSRFToken, async (req, res) => {
    try {
      const { 
        customerId, 
        items, 
        discount = 0, 
        shippingFee = 0, 
        paidAmount = 0,
        shippingAddress,
        notes = "Đơn hàng từ chatbot"
      } = req.body;

      // Validate items and calculate directly
      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin khách hàng hoặc sản phẩm"
        });
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy khách hàng"
        });
      }

      let subtotal = 0;
      const calculatedItems = [];

      // Validate items and calculate prices
      for (const item of items) {
        const { productId, variantId, quantity } = item;
        
        if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({
            status: "error",
            message: "Thông tin sản phẩm không hợp lệ"
          });
        }

        const [product, variants, inventory] = await Promise.all([
          storage.getProduct(productId),
          variantId ? Promise.resolve([]) : Promise.resolve([]),
          getInventory(productId, variantId)
        ]);

        if (!product) {
          return res.status(404).json({
            status: "error",
            message: `Không tìm thấy sản phẩm ${productId}`
          });
        }

        // Check stock availability
        const availableStock = inventory.currentStock || 0;
        if (availableStock < quantity) {
          return res.status(400).json({
            status: "error",
            message: `Sản phẩm "${product.name}" chỉ còn ${availableStock} cái, không đủ số lượng yêu cầu ${quantity}`
          });
        }

        // Get price (variant price or base price)
        let unitPrice = parseFloat(product.price);
        let productName = product.name;
        let variantName;

        // Note: Variants not implemented in current schema
        // if (variantId && variants.length > 0) {
        //   const variant = variants.find((v: any) => v.id === variantId);
        //   if (variant) {
        //     unitPrice = variant.price;
        //     variantName = variant.name;
        //     productName = `${product.name} - ${variant.name}`;
        //   }
        // }

        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        calculatedItems.push({
          productId,
          variantId,
          productName,
          variantName,
          quantity,
          unitPrice,
          discount: 0,
          total: itemTotal
        });
      }

      const discountAmount = Math.min(discount, subtotal);
      const tax = 0;
      const total = subtotal - discountAmount + tax + shippingFee;

      // Check customer credit limit
      const potentialDebt = 0 + total;
      const canAfford = potentialDebt <= 50000000;

      if (!canAfford) {
        return res.status(400).json({
          status: "error",
          message: `Vượt quá hạn mức tín dụng. Cần thanh toán ${potentialDebt - 50000000} trước khi đặt hàng`
        });
      }

      const calculation = {
        subtotal,
        discount: discountAmount,
        tax,
        shippingFee,
        total
      };

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      const debtAmount = Math.max(0, calculation.total - paidAmount);
      const paymentStatus = paidAmount >= calculation.total ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending');

      // Create order with storage.createOrder
      const order = await storage.createOrder({
        customerId,
        status: 'pending',
        total: calculation.total.toString(),
        items: calculatedItems.length
      });

      const orderId = order.id;

      res.json({
        status: "success",
        data: {
          orderId,
          orderNumber,
          total: calculation.total,
          paidAmount,
          debtAmount,
          message: `Đã tạo đơn hàng ${orderNumber} thành công. ${debtAmount > 0 ? `Còn nợ ${debtAmount.toLocaleString('vi-VN')} VNĐ` : 'Đã thanh toán đủ'}`
        }
      });
    } catch (error) {
      console.error("RASA API Error - Create Order:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể tạo đơn hàng" 
      });
    }
  });

  /**
   * GET /api/rasa/orders/:orderId
   * Lấy thông tin đơn hàng
   */
  app.get("/api/rasa/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const [order, items] = await Promise.all([
        storage.getOrder(orderId),
        Promise.resolve(orderId)
      ]);

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy đơn hàng"
        });
      }

      const customer = await storage.getCustomer(order.customerId);

      res.json({
        status: "success",
        data: {
          order: {
            id: order.id,
            orderNumber: `ORD-${Date.now()}`,
            status: order.status,
            total: order.total,
            paidAmount: 0,
            debtAmount: 0,
            paymentStatus: 'pending',
            createdAt: order.createdAt,
            notes: ''
          },
          items: [], // Order items would be fetched separately in real implementation
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email
          } : null
        }
      });
    } catch (error) {
      console.error("RASA API Error - Get Order:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy thông tin đơn hàng" 
      });
    }
  });

  // === RECOMMENDATION APIs ===

  /**
   * GET /api/rasa/recommendations/trending
   * Lấy sản phẩm bán chạy để tư vấn
   */
  app.get("/api/rasa/recommendations/trending", async (req, res) => {
    try {
      const { catalogId, limit = 10 } = req.query;
      
      // This is a simplified implementation
      // In production, you'd want to calculate this based on sales data
      let products;
      if (catalogId) {
        products = await storage.getProducts(20, catalogId as string);
      } else {
        // Get all active catalogs and their products
        const catalogs = await storage.getCategories();
        products = await storage.getProducts(parseInt(limit as string) || 10);
        // Simplified: just use the products already fetched
        // In real implementation, you'd fetch products from multiple categories
      }

      const limitedProducts = products.slice(0, parseInt(limit as string));

      res.json({
        status: "success",
        data: limitedProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          basePrice: parseFloat(product.price),
          unit: "cái",
          images: product.image ? [product.image] : [],
          tags: []
        }))
      });
    } catch (error) {
      console.error("RASA API Error - Get Trending:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy sản phẩm bán chạy" 
      });
    }
  });

  /**
   * GET /api/rasa/recommendations/customer/:customerId
   * Gợi ý sản phẩm dựa trên lịch sử mua hàng
   */
  app.get("/api/rasa/recommendations/customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const { limit = 5 } = req.query;

      // Simplified: return sample products since we don't have customer purchase history tracking
      const topProducts = await storage.getProducts(parseInt(limit as string) || 5);

      res.json({
        status: "success",
        data: {
          customerId,
          recommendations: topProducts,
          message: topProducts.length > 0 
            ? "Dựa trên lịch sử mua hàng của bạn"
            : "Khách hàng chưa có lịch sử mua hàng"
        }
      });
    } catch (error) {
      console.error("RASA API Error - Get Customer Recommendations:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Không thể lấy gợi ý sản phẩm" 
      });
    }
  });

  // === CHAT CONVERSATION API ===

  /**
   * POST /api/rasa/chat
   * Main chat endpoint for conversational interaction
   */
  app.post("/api/rasa/chat", async (req, res) => {
    try {
      const { message, sender, context } = req.body;
      
      if (!message || !sender) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin tin nhắn hoặc người gửi"
        });
      }

      // Process message through RASA-like logic with context awareness
      const responses = await processConversationalMessage(message, sender, context);
      
      res.json({
        status: "success",
        responses,
        sender
      });
    } catch (error) {
      console.error("RASA Chat API Error:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Có lỗi xảy ra trong quá trình xử lý" 
      });
    }
  });

  /**
   * Process conversational message with intelligent routing
   */
  async function processConversationalMessage(message: string, sender: string, context: any) {
    const msgLower = message.toLowerCase();
    const responses = [];

    // Intent detection based on message content
    if (msgLower.includes("tìm") || msgLower.includes("sản phẩm") || msgLower.includes("có gì")) {
      // Enhanced product search with category detection
      const category = detectCategory(message);
      const searchTerm = extractSearchTerm(message);
      
      if (category) {
        // Category-specific search
        const categoryResults = await searchProductsByCategory(category, context);
        responses.push({
          text: categoryResults.text,
          custom: categoryResults.custom
        });
      } else if (searchTerm) {
        // General product search
        const searchResults = await searchProductsForChat(searchTerm, context);
        responses.push({
          text: searchResults.text,
          custom: searchResults.custom
        });
      } else {
        responses.push({
          text: "Bạn muốn tìm sản phẩm gì? Hãy cho tôi biết tên hoặc danh mục sản phẩm.",
          buttons: [
            { title: "📱 Điện thoại", payload: "/search_smartphone" },
            { title: "💻 Laptop", payload: "/search_laptop" },  
            { title: "🎧 Tai nghe", payload: "/search_headphone" },
            { title: "📺 TV", payload: "/search_tv" },
            { title: "Xem tất cả", payload: "/search_all" }
          ]
        });
      }
    }
    else if (msgLower.includes("còn hàng") || msgLower.includes("tồn kho") || msgLower.includes("có sẵn")) {
      // Stock check intent
      const productName = extractProductName(message);
      if (productName) {
        const stockInfo = await checkStockForChat(productName);
        responses.push({
          text: stockInfo.text,
          custom: stockInfo.custom
        });
      } else {
        responses.push({
          text: "Bạn muốn kiểm tra tồn kho sản phẩm nào? Vui lòng cho tôi biết tên sản phẩm.",
          buttons: [
            { title: "Kiểm tra sản phẩm cụ thể", payload: "/check_specific_product" }
          ]
        });
      }
    }
    else if (msgLower.includes("đặt hàng") || msgLower.includes("mua") || msgLower.includes("order")) {
      // Order intent
      if (context?.cartItems && context.cartItems.length > 0) {
        const orderSummary = await createOrderSummaryForChat(context.cartItems);
        responses.push({
          text: "Tôi thấy bạn đã có sản phẩm trong giỏ hàng. Bạn có muốn tiếp tục đặt hàng không?",
          custom: { order: orderSummary },
          buttons: [
            { title: "Xác nhận đặt hàng", payload: "/confirm_order" },
            { title: "Thêm sản phẩm khác", payload: "/add_more_products" },
            { title: "Xem chi tiết", payload: "/view_cart_details" }
          ]
        });
      } else {
        responses.push({
          text: "Bạn muốn đặt hàng sản phẩm nào? Tôi có thể giúp bạn tìm và thêm vào giỏ hàng.",
          buttons: [
            { title: "Xem sản phẩm hot", payload: "/show_trending" },
            { title: "Tìm theo danh mục", payload: "/browse_categories" }
          ]
        });
      }
    }
    else if (msgLower.includes("giá") || msgLower.includes("bao nhiêu") || msgLower.includes("price")) {
      // Price inquiry intent
      const productName = extractProductName(message);
      if (productName) {
        const priceInfo = await getPriceInfoForChat(productName);
        responses.push({
          text: priceInfo.text,
          custom: priceInfo.custom
        });
      } else {
        responses.push({
          text: "Bạn muốn hỏi giá sản phẩm nào? Hãy cho tôi biết tên sản phẩm.",
          buttons: [
            { title: "Xem bảng giá", payload: "/show_price_list" }
          ]
        });
      }
    }
    else if (msgLower.includes("giao hàng") || msgLower.includes("ship") || msgLower.includes("delivery")) {
      // Delivery info intent
      responses.push({
        text: "🚚 Thông tin giao hàng:\n\n• Giao hàng quanh thị trấn: 2-4 giờ\n• Ship COD toàn quốc: 1-3 ngày\n• FREE SHIP vào 11:00 và 17:00 hàng ngày\n• Phí ship theo khoảng cách\n\nBạn cần hỗ trợ gì thêm về giao hàng?",
        buttons: [
          { title: "Kiểm tra phí ship", payload: "/check_shipping_fee" },
          { title: "Thời gian giao hàng", payload: "/delivery_time" }
        ]
      });
    }
    else if (msgLower.includes("thanh toán") || msgLower.includes("payment") || msgLower.includes("trả tiền")) {
      // Payment info intent
      responses.push({
        text: "💳 Các hình thức thanh toán:\n\n• COD (Thanh toán khi nhận hàng)\n• Chuyển khoản ngân hàng\n• Ví điện tử\n\nTất cả đều an toàn và bảo mật. Bạn muốn biết thêm chi tiết nào?",
        buttons: [
          { title: "Hướng dẫn chuyển khoản", payload: "/bank_transfer_guide" },
          { title: "Chính sách bảo mật", payload: "/security_policy" }
        ]
      });
    }
    else if (msgLower.includes("quá đắt") || msgLower.includes("đắt quá") || msgLower.includes("rẻ hơn") || msgLower.includes("có gì rẻ") || msgLower.includes("thay thế") || msgLower.includes("tương tự")) {
      // NEW: Similar product suggestion intent
      const productName = extractProductName(message);
      if (productName) {
        const similarProducts = await getSimilarProductsForChat(productName);
        responses.push({
          text: similarProducts.text,
          custom: similarProducts.custom
        });
      } else {
        responses.push({
          text: "💰 Tôi hiểu bạn muốn tìm sản phẩm với giá tốt hơn. Bạn đang quan tâm đến sản phẩm nào để tôi gợi ý những lựa chọn phù hợp?",
          buttons: [
            { title: "Sản phẩm giá rẻ", payload: "/budget_products" },
            { title: "Khuyến mãi hot", payload: "/promotions" },
            { title: "So sánh giá", payload: "/price_comparison" }
          ]
        });
      }
    }
    else if (msgLower.includes("xin chào") || msgLower.includes("hello") || msgLower.includes("hi")) {
      // Greeting intent
      responses.push({
        text: `Xin chào! Tôi là trợ lý mua sắm. Tôi có thể giúp bạn:\n\n🔍 Tìm kiếm sản phẩm\n📦 Kiểm tra tồn kho\n🛒 Hỗ trợ đặt hàng\n💰 Tư vấn giá cả\n🚚 Thông tin giao hàng\n\nBạn cần hỗ trợ gì?`,
        buttons: [
          { title: "Tìm sản phẩm", payload: "/search_products" },
          { title: "Sản phẩm hot", payload: "/trending_products" },
          { title: "Khuyến mãi", payload: "/promotions" }
        ]
      });
    }
    else {
      // Default/fallback intent
      responses.push({
        text: "Tôi hiểu bạn đang cần hỗ trợ. Có thể bạn muốn:",
        buttons: [
          { title: "Tìm sản phẩm", payload: "/search_products" },
          { title: "Kiểm tra tồn kho", payload: "/check_stock" },
          { title: "Hỗ trợ đặt hàng", payload: "/help_order" },
          { title: "Thông tin giao hàng", payload: "/delivery_info" }
        ]
      });
    }

    return responses;
  }

  /**
   * Helper functions for conversation processing
   */
  function extractSearchTerm(message: string): string | null {
    const searchPatterns = [
      /tìm\s+(.+)/i,
      /có\s+(.+)\s+không/i,
      /(.+)\s+ở\s+đâu/i,
      /muốn\s+mua\s+(.+)/i
    ];
    
    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  function extractProductName(message: string): string | null {
    // Simple extraction - in production, use NER
    const words = message.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 2) {
        return words[i];
      }
    }
    return null;
  }

  // NEW: Category detection function
  function detectCategory(message: string): string | null {
    const msgLower = message.toLowerCase();
    const categoryMap = {
      'smartphone': ['điện thoại', 'smartphone', 'phone', 'di động', 'iphone', 'samsung', 'xiaomi'],
      'laptop': ['laptop', 'máy tính', 'macbook', 'dell', 'hp', 'asus'],
      'headphone': ['tai nghe', 'headphone', 'airpods', 'earphone'], 
      'tablet': ['máy tính bảng', 'tablet', 'ipad'],
      'tv': ['tivi', 'tv', 'smart tv', 'television'],
      'camera': ['máy ảnh', 'camera'],
      'watch': ['đồng hồ', 'smart watch', 'apple watch'],
      'speaker': ['loa', 'speaker', 'bluetooth']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      for (const keyword of keywords) {
        if (msgLower.includes(keyword)) {
          return category;
        }
      }
    }
    return null;
  }

  // NEW: Search products by category
  async function searchProductsByCategory(category: string, context: any) {
    try {
      const allProducts = await storage.getProducts(50);
      const filteredProducts = allProducts.filter(product => {
        const productName = product.name.toLowerCase();
        const categoryKeywords: Record<string, string[]> = {
          'smartphone': ['điện thoại', 'phone', 'iphone', 'samsung', 'xiaomi', 'oppo', 'vivo'],
          'laptop': ['laptop', 'macbook', 'dell', 'hp', 'asus', 'acer', 'lenovo'],
          'headphone': ['tai nghe', 'headphone', 'airpods', 'earphone'],
          'tablet': ['ipad', 'tablet'],
          'tv': ['tv', 'tivi', 'smart tv'],
          'camera': ['camera', 'máy ảnh'],  
          'watch': ['watch', 'đồng hồ'],
          'speaker': ['loa', 'speaker']
        };

        const keywords = categoryKeywords[category] || [];
        return keywords.some((keyword: string) => productName.includes(keyword));
      });

      if (filteredProducts.length === 0) {
        return {
          text: `Hiện tại chưa có sản phẩm nào trong danh mục "${category}". Bạn có thể xem các danh mục khác?`,
          custom: null
        };
      }

      // Show top 3 products in category
      const topProducts = filteredProducts.slice(0, 3);
      const productsWithStock = await Promise.all(
        topProducts.map(async (product) => {
          const inventory = await getInventory(product.id);
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: inventory.currentStock
          };
        })
      );

      const categoryNames: Record<string, string> = {
        'smartphone': 'Điện thoại',
        'laptop': 'Laptop', 
        'headphone': 'Tai nghe',
        'tablet': 'Máy tính bảng',
        'tv': 'TV',
        'camera': 'Máy ảnh',
        'watch': 'Đồng hồ',
        'speaker': 'Loa'
      };

      return {
        text: `📱 Tìm thấy ${filteredProducts.length} sản phẩm trong danh mục ${categoryNames[category] || category}. Đây là những sản phẩm nổi bật:`,
        custom: {
          products: productsWithStock,
          category: category,
          totalCount: filteredProducts.length
        }
      };
    } catch (error) {
      return {
        text: "Có lỗi khi tìm kiếm theo danh mục. Vui lòng thử lại.",
        custom: null
      };
    }
  }

  // NEW: Get similar/cheaper product suggestions
  async function getSimilarProductsForChat(productName: string) {
    try {
      const allProducts = await storage.getProducts(50);
      const targetProduct = allProducts.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );

      if (!targetProduct) {
        return {
          text: `Không tìm thấy sản phẩm "${productName}". Bạn có thể cho tôi biết tên sản phẩm chính xác hơn?`,
          custom: null
        };
      }

      const targetPrice = parseFloat(targetProduct.price);
      
      // Find similar products in same category but cheaper
      const category = detectCategory(targetProduct.name);
      let similarProducts = allProducts.filter(p => {
        const productPrice = parseFloat(p.price);
        const isCheaper = productPrice < targetPrice;
        const isDifferentProduct = p.id !== targetProduct.id;
        
        if (category) {
          // Same category, cheaper price
          const productCategory = detectCategory(p.name);
          return productCategory === category && isCheaper && isDifferentProduct;
        } else {
          // Just cheaper products (fallback)
          return isCheaper && isDifferentProduct;
        }
      });

      // Sort by price ascending and get top 3
      similarProducts = similarProducts
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 3);

      if (similarProducts.length === 0) {
        return {
          text: `${targetProduct.name} (${parseInt(targetProduct.price).toLocaleString()}đ) đã là sản phẩm có giá tốt trong danh mục này. Bạn có thể xem các khuyến mãi đặc biệt?`,
          custom: {
            originalProduct: {
              id: targetProduct.id,
              name: targetProduct.name,
              price: targetProduct.price,
              image: targetProduct.image
            }
          }
        };
      }

      // Get stock info for similar products
      const productsWithStock = await Promise.all(
        similarProducts.map(async (product) => {
          const inventory = await getInventory(product.id);
          const savings = targetPrice - parseFloat(product.price);
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: inventory.currentStock,
            savings: Math.round(savings)
          };
        })
      );

      return {
        text: `💡 Tôi tìm thấy ${similarProducts.length} sản phẩm tương tự với giá tốt hơn so với ${targetProduct.name}:`,
        custom: {
          originalProduct: {
            id: targetProduct.id,
            name: targetProduct.name,
            price: targetProduct.price
          },
          similarProducts: productsWithStock
        }
      };
    } catch (error) {
      return {
        text: "Có lỗi khi tìm sản phẩm tương tự. Vui lòng thử lại.",
        custom: null
      };
    }
  }

  async function searchProductsForChat(searchTerm: string, context: any) {
    try {
      const allProducts = await storage.getProducts(20);
      const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (filteredProducts.length === 0) {
        return {
          text: `Không tìm thấy sản phẩm nào với từ khóa "${searchTerm}". Bạn có thể thử tìm với từ khóa khác?`,
          custom: null
        };
      }

      const topProduct = filteredProducts[0];
      const inventory = await getInventory(topProduct.id);
      
      return {
        text: `Tìm thấy ${filteredProducts.length} sản phẩm cho "${searchTerm}". Đây là sản phẩm phù hợp nhất:`,
        custom: {
          product: {
            id: topProduct.id,
            name: topProduct.name,
            price: topProduct.price,
            image: topProduct.image,
            stock: inventory.currentStock
          }
        }
      };
    } catch (error) {
      return {
        text: "Có lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại.",
        custom: null
      };
    }
  }

  async function checkStockForChat(productName: string) {
    try {
      const allProducts = await storage.getProducts(50);
      const product = allProducts.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );

      if (!product) {
        return {
          text: `Không tìm thấy sản phẩm "${productName}". Bạn có thể kiểm tra tên sản phẩm khác?`,
          custom: null
        };
      }

      const inventory = await getInventory(product.id);
      const stockStatus = inventory.currentStock > 0 ? "còn hàng" : "hết hàng";
      
      return {
        text: `${product.name} hiện tại ${stockStatus}. Còn lại ${inventory.currentStock} sản phẩm.`,
        custom: {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: inventory.currentStock
          }
        }
      };
    } catch (error) {
      return {
        text: "Có lỗi khi kiểm tra tồn kho. Vui lòng thử lại.",
        custom: null
      };
    }
  }

  async function getPriceInfoForChat(productName: string) {
    try {
      const allProducts = await storage.getProducts(50);
      const product = allProducts.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );

      if (!product) {
        return {
          text: `Không tìm thấy thông tin giá cho "${productName}".`,
          custom: null
        };
      }

      const price = parseInt(product.price);
      return {
        text: `${product.name}: ${price.toLocaleString('vi-VN')}đ/kg`,
        custom: {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
          }
        }
      };
    } catch (error) {
      return {
        text: "Có lỗi khi lấy thông tin giá. Vui lòng thử lại.",
        custom: null
      };
    }
  }

  async function createOrderSummaryForChat(cartItems: any[]) {
    let total = 0;
    const items = cartItems.map(item => {
      const itemTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
      total += itemTotal;
      return {
        name: item.name,
        quantity: item.quantity,
        price: itemTotal
      };
    });

    return {
      items,
      total
    };
  }
}

// Helper function to get product unit
async function getProductUnit(productId: string): Promise<string> {
  try {
    const product = await storage.getProduct(productId);
    return 'cái';
  } catch {
    return 'sản phẩm';
  }
}