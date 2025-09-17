import { 
  users, products, customers, orders, orderItems, socialAccounts, chatbotConversations,
  storefrontConfig, storefrontOrders, categories, industries, payments,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Customer, type InsertCustomer, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type SocialAccount, type InsertSocialAccount,
  type ChatbotConversation, type InsertChatbotConversation,
  type StorefrontConfig, type InsertStorefrontConfig,
  type StorefrontOrder, type InsertStorefrontOrder,
  type Category, type InsertCategory, type Industry, type InsertIndustry,
  type Payment, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Industry methods
  getIndustries(): Promise<Industry[]>;
  getIndustry(id: string): Promise<Industry | undefined>;
  createIndustry(industry: InsertIndustry): Promise<Industry>;
  updateIndustry(id: string, industry: Partial<InsertIndustry>): Promise<Industry | undefined>;
  deleteIndustry(id: string): Promise<boolean>;

  // Category methods
  getCategories(industryId?: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Product methods
  getProducts(limit?: number, categoryId?: string, search?: string, offset?: number): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductsWithCategory(limit?: number, categoryId?: string, search?: string, offset?: number): Promise<(Product & { categoryName?: string })[]>;

  // Customer methods
  getCustomers(limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string })[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomerRecentAddress(customerId: string): Promise<string | null>;

  // Order methods
  getOrders(limit?: number): Promise<(Order & { customerName: string; customerEmail: string })[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithDetails(id: string): Promise<(Order & { customerName: string; customerEmail: string; orderItems: (OrderItem & { productName: string })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Order items methods
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Social account methods
  getSocialAccounts(): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, account: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined>;

  // Chatbot methods
  getChatbotConversations(limit?: number): Promise<ChatbotConversation[]>;
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  }>;

  // Storefront methods
  getStorefrontConfigs(): Promise<StorefrontConfig[]>;
  getStorefrontConfig(id: string): Promise<StorefrontConfig | undefined>;
  getStorefrontConfigByName(name: string): Promise<StorefrontConfig | undefined>;
  createStorefrontConfig(config: InsertStorefrontConfig): Promise<StorefrontConfig>;
  updateStorefrontConfig(id: string, config: Partial<InsertStorefrontConfig>): Promise<StorefrontConfig | undefined>;
  getTopProductsForStorefront(configId: string): Promise<Product[]>;
  getStorefrontOrders(configId?: string, limit?: number): Promise<StorefrontOrder[]>;
  createStorefrontOrder(order: InsertStorefrontOrder): Promise<StorefrontOrder>;
  updateStorefrontOrderStatus(id: string, status: string): Promise<StorefrontOrder | undefined>;

  // Payment methods
  getPayment(orderId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Industry methods
  async getIndustries(): Promise<Industry[]> {
    return await db.select().from(industries).orderBy(industries.sortOrder, industries.name);
  }

  async getIndustry(id: string): Promise<Industry | undefined> {
    const [industry] = await db.select().from(industries).where(eq(industries.id, id));
    return industry || undefined;
  }

  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const [newIndustry] = await db.insert(industries).values(industry).returning();
    return newIndustry;
  }

  async updateIndustry(id: string, industry: Partial<InsertIndustry>): Promise<Industry | undefined> {
    const [updatedIndustry] = await db
      .update(industries)
      .set({ ...industry, updatedAt: new Date() })
      .where(eq(industries.id, id))
      .returning();
    return updatedIndustry || undefined;
  }

  async deleteIndustry(id: string): Promise<boolean> {
    const result = await db.delete(industries).where(eq(industries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Category methods
  async getCategories(industryId?: string): Promise<Category[]> {
    if (industryId) {
      return await db
        .select()
        .from(categories)
        .where(eq(categories.industryId, industryId))
        .orderBy(categories.sortOrder, categories.name);
    }
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product methods
  async getProducts(limit = 50, categoryId?: string, search?: string, offsetNum = 0): Promise<Product[]> {
    // Build where conditions
    const conditions = [];
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }
    
    // Build query with or without conditions
    if (conditions.length > 0) {
      return await db
        .select()
        .from(products)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offsetNum);
    } else {
      return await db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offsetNum);
    }
  }

  async getProductsWithCategory(limit = 50, categoryId?: string, search?: string, offsetNum = 0): Promise<(Product & { categoryName?: string })[]> {
    const baseQuery = {
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      categoryId: products.categoryId,
      status: products.status,
      image: products.image,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryName: categories.name
    };
    
    // Build where conditions
    const conditions = [];
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }
    
    // Build query with or without conditions
    let results;
    if (conditions.length > 0) {
      results = await db
        .select(baseQuery)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offsetNum);
    } else {
      results = await db
        .select(baseQuery)
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offsetNum);
    }
      
    return results.map(row => ({
      ...row,
      categoryName: row.categoryName || undefined
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Customer methods
  async getCustomers(limit = 50): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string })[]> {
    const baseCustomers = await db.select().from(customers).orderBy(desc(customers.joinDate)).limit(limit);
    
    // Calculate enriched data for each customer
    const enrichedCustomers = await Promise.all(
      baseCustomers.map(async (customer) => {
        const customerStats = await db
          .select({
            totalOrders: count(orders.id),
            totalSpent: sum(orders.total),
            lastOrderDate: sql<string>`MAX(${orders.createdAt})::text`
          })
          .from(orders)
          .where(eq(orders.customerId, customer.id));

        const stats = customerStats[0];
        
        return {
          ...customer,
          totalOrders: Number(stats.totalOrders) || 0,
          totalSpent: Number(stats.totalSpent) || 0,
          lastOrderDate: stats.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString()
        };
      })
    );
    
    return enrichedCustomers;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    // First delete all orders associated with this customer
    const customerOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, id));
    
    // Delete order items for each order
    for (const order of customerOrders) {
      await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
    }
    
    // Delete orders
    await db.delete(orders).where(eq(orders.customerId, id));
    
    // Finally delete the customer
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCustomerRecentAddress(customerId: string): Promise<string | null> {
    try {
      // First get the customer's phone number
      const customer = await this.getCustomer(customerId);
      if (!customer || !customer.phone) {
        return null;
      }
      
      // Get the most recent storefront order for this customer by phone
      const [recentOrder] = await db
        .select({ customerAddress: storefrontOrders.customerAddress })
        .from(storefrontOrders)
        .where(eq(storefrontOrders.customerPhone, customer.phone))
        .orderBy(desc(storefrontOrders.createdAt))
        .limit(1);
      
      return recentOrder?.customerAddress || null;
    } catch (error) {
      console.error('Error getting customer recent address:', error);
      return null;
    }
  }

  // Order methods
  async getOrders(limit = 50): Promise<(Order & { customerName: string; customerEmail: string })[]> {
    const result = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        total: orders.total,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
    
    return result as (Order & { customerName: string; customerEmail: string })[];
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    // First delete order items
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    // Then delete the order
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getOrderWithDetails(id: string): Promise<(Order & { customerName: string; customerEmail: string; orderItems: (OrderItem & { productName: string })[] }) | undefined> {
    // Get order with customer info
    const orderResult = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        total: orders.total,
        status: orders.status,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, id));

    if (!orderResult[0]) return undefined;
    
    const order = orderResult[0];

    // Get order items with product info
    const itemsResult = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: products.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      customerName: order.customerName || 'Unknown Customer',
      customerEmail: order.customerEmail || 'unknown@example.com',
      orderItems: itemsResult.map(item => ({
        ...item,
        productName: item.productName || 'Unknown Product'
      })),
    };
  }

  // Order items methods
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Social account methods
  async getSocialAccounts(): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
  }

  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [newAccount] = await db.insert(socialAccounts).values(account).returning();
    return newAccount;
  }

  async updateSocialAccount(id: string, account: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined> {
    const [updatedAccount] = await db
      .update(socialAccounts)
      .set(account)
      .where(eq(socialAccounts.id, id))
      .returning();
    return updatedAccount || undefined;
  }

  // Chatbot methods
  async getChatbotConversations(limit = 50): Promise<ChatbotConversation[]> {
    return await db
      .select()
      .from(chatbotConversations)
      .orderBy(desc(chatbotConversations.createdAt))
      .limit(limit);
  }

  async createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation> {
    const [newConversation] = await db.insert(chatbotConversations).values(conversation).returning();
    return newConversation;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  }> {
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)` 
      })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    const [orderCountResult] = await db
      .select({ count: count() })
      .from(orders);

    const [customerCountResult] = await db
      .select({ count: count() })
      .from(customers);

    const [productCountResult] = await db
      .select({ count: count() })
      .from(products);

    return {
      totalRevenue: Number(revenueResult?.total || 0),
      totalOrders: orderCountResult?.count || 0,
      totalCustomers: customerCountResult?.count || 0,
      totalProducts: productCountResult?.count || 0,
    };
  }

  // Storefront methods
  async getStorefrontConfigs(): Promise<StorefrontConfig[]> {
    return await db.select().from(storefrontConfig).orderBy(desc(storefrontConfig.updatedAt));
  }

  async getStorefrontConfig(id: string): Promise<StorefrontConfig | undefined> {
    const [config] = await db.select().from(storefrontConfig).where(eq(storefrontConfig.id, id));
    return config || undefined;
  }

  async getStorefrontConfigByName(name: string): Promise<StorefrontConfig | undefined> {
    const [config] = await db.select().from(storefrontConfig).where(eq(storefrontConfig.name, name));
    return config || undefined;
  }

  async createStorefrontConfig(insertConfig: InsertStorefrontConfig): Promise<StorefrontConfig> {
    const [config] = await db.insert(storefrontConfig).values(insertConfig).returning();
    return config;
  }

  async updateStorefrontConfig(id: string, updateConfig: Partial<InsertStorefrontConfig>): Promise<StorefrontConfig | undefined> {
    const [config] = await db
      .update(storefrontConfig)
      .set({ ...updateConfig, updatedAt: new Date() })
      .where(eq(storefrontConfig.id, id))
      .returning();
    return config || undefined;
  }

  async getTopProductsForStorefront(configId: string): Promise<Product[]> {
    const config = await this.getStorefrontConfig(configId);
    if (!config) return [];

    if (config.displayMode === 'manual' && config.selectedProductIds) {
      // Get manually selected products
      const productIds = (config.selectedProductIds as string[]) || [];
      if (productIds.length === 0) return [];
      
      const selectedProducts = await Promise.all(
        productIds.map(async (id) => {
          const [product] = await db.select().from(products).where(eq(products.id, id));
          return product;
        })
      );
      
      return selectedProducts.filter(Boolean).slice(0, config.topProductsCount);
    } else {
      // Auto mode - get top products by stock or created date
      return await db
        .select()
        .from(products)
        .where(eq(products.status, 'active'))
        .orderBy(desc(products.stock), desc(products.createdAt))
        .limit(config.topProductsCount);
    }
  }

  async getStorefrontOrders(configId?: string, limit: number = 50): Promise<StorefrontOrder[]> {
    if (configId) {
      return await db
        .select()
        .from(storefrontOrders)
        .where(eq(storefrontOrders.storefrontConfigId, configId))
        .orderBy(desc(storefrontOrders.createdAt))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(storefrontOrders)
        .orderBy(desc(storefrontOrders.createdAt))
        .limit(limit);
    }
  }

  async createStorefrontOrder(order: InsertStorefrontOrder): Promise<StorefrontOrder> {
    const [newOrder] = await db.insert(storefrontOrders).values(order).returning();
    return newOrder;
  }

  async updateStorefrontOrderStatus(id: string, status: string): Promise<StorefrontOrder | undefined> {
    const [order] = await db
      .update(storefrontOrders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(storefrontOrders.id, id))
      .returning();
    return order || undefined;
  }

  // Payment methods
  async getPayment(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }
}

export const storage = new DatabaseStorage();
