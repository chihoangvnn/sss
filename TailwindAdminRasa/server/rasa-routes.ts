import { Express } from 'express';
import { storage } from './storage';

// Helper function for inventory demo data
const getInventory = async (productId: string, variantId?: string) => ({ 
  currentStock: 1_000_000, 
  soldQuantity: 0 
});

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
          sku: product.id
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
      const product = await storage.getProductById(productId);
      const variants = []; // Demo: no variants system yet
      const inventory = { quantity: 100, available: 95 }; // Demo inventory

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm"
        });
      }

      // Get variants with their inventory
      const variantsWithInventory = await Promise.all(
        variants.map(async (variant) => {
          const variantInventory = await Promise.resolve(
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
              currentStock: variantInventory?.currentStock || 0,
              soldQuantity: variantInventory?.soldQuantity || 0,
              isInStock: (variantInventory?.currentStock || 0) > 0
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
            basePrice: product.basePrice,
            unit: product.unit,
            minOrderQuantity: product.minOrderQuantity,
            images: product.images,
            videos: product.videos,
            tags: product.tags,
            sku: product.sku
          },
          variants: variantsWithInventory,
          baseInventory: {
            currentStock: inventory?.currentStock || 0,
            soldQuantity: inventory?.soldQuantity || 0,
            isInStock: (inventory?.currentStock || 0) > 0
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

      const inventory = await Promise.resolve(
        productId, 
        variantId as string
      );

      const requestedQty = parseFloat(quantity as string);
      const availableQty = inventory?.currentStock || 0;
      const isAvailable = availableQty >= requestedQty;

      res.json({
        status: "success",
        data: {
          productId,
          variantId: variantId || null,
          requestedQuantity: requestedQty,
          availableQuantity: availableQty,
          isAvailable,
          soldQuantity: inventory?.soldQuantity || 0,
          message: isAvailable 
            ? `Có sẵn ${availableQty} ${await getProductUnit(productId)}`
            : `Chỉ còn ${availableQty} ${await getProductUnit(productId)}, không đủ số lượng yêu cầu`
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
  app.get("/api/rasa/customers/search", async (req, res) => {
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
  app.get("/api/rasa/customers/:customerId/profile", async (req, res) => {
    try {
      const { customerId } = req.params;
      
      const [customer, topProducts] = await Promise.all([
        storage.getCustomerById(customerId),
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
            customerType: customer.customerType,
            totalDebt: customer.totalDebt,
            creditLimit: customer.creditLimit,
            isActive: customer.isActive,
            address: customer.address
          },
          topProducts,
          debtStatus: {
            hasDebt: customer.totalDebt > 0,
            debtAmount: customer.totalDebt,
            creditAvailable: customer.creditLimit - customer.totalDebt,
            canOrder: customer.totalDebt < customer.creditLimit
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
  app.post("/api/rasa/customers", async (req, res) => {
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
        address: "Địa chỉ mặc định",
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
  app.post("/api/rasa/orders/calculate", async (req, res) => {
    try {
      const { customerId, items, discount = 0, shippingFee = 0 } = req.body;

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Thiếu thông tin khách hàng hoặc sản phẩm"
        });
      }

      const customer = await storage.getCustomerById(customerId);
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
          storage.getProductById(productId),
          variantId ? Promise.resolve(productId) : Promise.resolve([]),
          Promise.resolve(productId, variantId)
        ]);

        if (!product) {
          return res.status(404).json({
            status: "error",
            message: `Không tìm thấy sản phẩm ${productId}`
          });
        }

        // Check stock availability
        const availableStock = inventory?.currentStock || 0;
        if (availableStock < quantity) {
          return res.status(400).json({
            status: "error",
            message: `Sản phẩm "${product.name}" chỉ còn ${availableStock} ${product.unit}, không đủ số lượng yêu cầu ${quantity}`
          });
        }

        // Get price (variant price or base price)
        let unitPrice = product.basePrice;
        let productName = product.name;
        let variantName;

        if (variantId) {
          const variant = variants.find(v => v.id === variantId);
          if (variant) {
            unitPrice = variant.price;
            variantName = variant.name;
            productName = `${product.name} - ${variant.name}`;
          }
        }

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
          unit: product.unit
        });
      }

      const discountAmount = Math.min(discount, subtotal);
      const tax = 0; // Configure as needed
      const total = subtotal - discountAmount + tax + shippingFee;

      // Check customer credit limit
      const potentialDebt = customer.totalDebt + total;
      const canAfford = potentialDebt <= customer.creditLimit;

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
            currentDebt: customer.totalDebt,
            creditLimit: customer.creditLimit,
            availableCredit: customer.creditLimit - customer.totalDebt,
            canAfford
          },
          validation: {
            isValid: canAfford,
            message: canAfford 
              ? "Đơn hàng hợp lệ, có thể tạo đơn"
              : `Vượt quá hạn mức tín dụng. Cần thanh toán ${potentialDebt - customer.creditLimit} trước khi đặt hàng`
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
  app.post("/api/rasa/orders", async (req, res) => {
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

      const customer = await storage.getCustomerById(customerId);
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
          storage.getProductById(productId),
          variantId ? Promise.resolve(productId) : Promise.resolve([]),
          Promise.resolve(productId, variantId)
        ]);

        if (!product) {
          return res.status(404).json({
            status: "error",
            message: `Không tìm thấy sản phẩm ${productId}`
          });
        }

        // Check stock availability
        const availableStock = inventory?.currentStock || 0;
        if (availableStock < quantity) {
          return res.status(400).json({
            status: "error",
            message: `Sản phẩm "${product.name}" chỉ còn ${availableStock} ${product.unit}, không đủ số lượng yêu cầu ${quantity}`
          });
        }

        // Get price (variant price or base price)
        let unitPrice = product.basePrice;
        let productName = product.name;
        let variantName;

        if (variantId) {
          const variant = variants.find(v => v.id === variantId);
          if (variant) {
            unitPrice = variant.price;
            variantName = variant.name;
            productName = `${product.name} - ${variant.name}`;
          }
        }

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
      const potentialDebt = customer.totalDebt + total;
      const canAfford = potentialDebt <= customer.creditLimit;

      if (!canAfford) {
        return res.status(400).json({
          status: "error",
          message: `Vượt quá hạn mức tín dụng. Cần thanh toán ${potentialDebt - customer.creditLimit} trước khi đặt hàng`
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

      // Create order
      const orderId = await firebaseStorage.createOrder({
        customerId,
        orderNumber,
        status: 'confirmed',
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        tax: calculation.tax,
        shippingFee: calculation.shippingFee,
        total: calculation.total,
        paidAmount,
        debtAmount,
        paymentStatus,
        shippingAddress,
        notes
      }, calculatedItems);

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
        storage.getOrderById(orderId),
        Promise.resolve(orderId)
      ]);

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy đơn hàng"
        });
      }

      const customer = await storage.getCustomerById(order.customerId);

      res.json({
        status: "success",
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            paidAmount: order.paidAmount,
            debtAmount: order.debtAmount,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            notes: order.notes
          },
          items: items.map(item => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          })),
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
        products = await firebaseStorage.getProductsByCatalog(catalogId as string);
      } else {
        // Get all active catalogs and their products
        const catalogs = await firebaseStorage.getActiveCatalogs();
        products = [];
        for (const catalog of catalogs.slice(0, 3)) { // Limit to first 3 catalogs
          const catalogProducts = await firebaseStorage.getProductsByCatalog(catalog.id!);
          products.push(...catalogProducts);
        }
      }

      const limitedProducts = products.slice(0, parseInt(limit as string));

      res.json({
        status: "success",
        data: limitedProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          unit: product.unit,
          images: product.images.slice(0, 1),
          tags: product.tags
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

      const topProducts = await firebaseStorage.getCustomerTopProducts(
        customerId, 
        parseInt(limit as string)
      );

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
}

// Helper function to get product unit
async function getProductUnit(productId: string): Promise<string> {
  try {
    const product = await storage.getProductById(productId);
    return product?.unit || 'sản phẩm';
  } catch {
    return 'sản phẩm';
  }
}