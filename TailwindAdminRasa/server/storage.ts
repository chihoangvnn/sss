import { 
  users, products, customers, orders, orderItems, socialAccounts, chatbotConversations,
  storefrontConfig, storefrontOrders, categories, industries, payments, shopSettings,
  productLandingPages, productReviews, facebookConversations, facebookMessages, pageTags,
  tiktokBusinessAccounts, tiktokShopOrders, tiktokShopProducts, tiktokVideos,
  contentCategories, contentAssets, scheduledPosts, unifiedTags, contentLibrary,
  facebookApps, facebookWebhookEvents, botSettings, apiConfigurations,
  accountGroups, groupAccounts, workers, workerJobs, workerHealthChecks,
  productFAQs, productPolicies, productPolicyAssociations,
  abebooksAccounts, abebooksListings, abebooksSearchHistory,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Customer, type InsertCustomer, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type SocialAccount, type InsertSocialAccount,
  type ChatbotConversation, type InsertChatbotConversation,
  type StorefrontConfig, type InsertStorefrontConfig,
  type StorefrontOrder, type InsertStorefrontOrder,
  type Category, type InsertCategory, type Industry, type InsertIndustry,
  type Payment, type InsertPayment, type ShopSettings, type InsertShopSettings,
  type ProductLandingPage, type InsertProductLandingPage,
  type ProductReview, type InsertProductReview,
  type ProductFAQ, type InsertProductFAQ,
  type ProductPolicy, type InsertProductPolicy,
  type ProductPolicyAssociation, type InsertProductPolicyAssociation,
  type FacebookConversation, type InsertFacebookConversation,
  type FacebookMessage, type InsertFacebookMessage,
  type PageTag, type InsertPageTag, type UnifiedTag, type InsertUnifiedTag,
  type TikTokBusinessAccount, type InsertTikTokBusinessAccount,
  type TikTokShopOrder, type InsertTikTokShopOrder,
  type TikTokShopProduct, type InsertTikTokShopProduct,
  type TikTokVideo, type InsertTikTokVideo,
  type ContentCategory, type InsertContentCategory,
  type ContentAsset, type InsertContentAsset,
  type ScheduledPost, type InsertScheduledPost,
  type ContentLibrary, type InsertContentLibrary, type UpdateContentLibrary,
  type FacebookApp, type InsertFacebookApp,
  type FacebookWebhookEvent, type InsertFacebookWebhookEvent,
  type BotSettings, type InsertBotSettings,
  type ApiConfiguration, type InsertApiConfiguration, type UpdateApiConfiguration,
  type AccountGroup, type InsertAccountGroup,
  type Worker, type InsertWorker, type WorkerJob, type InsertWorkerJob,
  type AbebooksAccount, type InsertAbebooksAccount,
  type AbebooksListing, type InsertAbebooksListing,
  type AbebooksSearchHistory, type InsertAbebooksSearchHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql, ilike, or, gte, lte, isNull, inArray } from "drizzle-orm";

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
  getProductBySKU(sku: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsWithoutSKU(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductsWithCategory(limit?: number, categoryId?: string, search?: string, offset?: number): Promise<(Product & { categoryName?: string })[]>;

  // Customer methods
  getCustomers(limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]>;
  getCustomer(id: string): Promise<(Customer & { totalDebt: string; creditLimit: string }) | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomerRecentAddress(customerId: string): Promise<string | null>;
  
  // Customer analytics methods for POS suggestions
  searchCustomers(searchTerm: string, limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]>;
  getRecentCustomers(limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]>;
  getVipCustomers(limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]>;
  getFrequentCustomers(limit?: number): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]>;

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
  deleteOrderItem(id: string): Promise<boolean>;

  // Debt management methods
  updateCustomerDebt(customerId: string, paymentAmount: number): Promise<Customer | undefined>;
  getCustomerDebtInfo(customerId: string): Promise<{ totalDebt: number; creditLimit: number } | undefined>;

  // Social account methods
  getSocialAccounts(): Promise<SocialAccount[]>;
  getSocialAccount(id: string): Promise<SocialAccount | undefined>;
  getSocialAccountById(id: string): Promise<SocialAccount | undefined>;
  getSocialAccountByPlatform(platform: string): Promise<SocialAccount | undefined>;
  getSocialAccountsByPlatform(platform: string): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  
  // Account Groups methods
  getAccountGroups(): Promise<any[]>;
  getGroupAccounts(groupId: string): Promise<SocialAccount[]>;

  // Page tag methods
  getPageTags(): Promise<PageTag[]>;
  getPageTag(id: string): Promise<PageTag | undefined>;
  createPageTag(tag: InsertPageTag): Promise<PageTag>;
  updatePageTag(id: string, tag: Partial<InsertPageTag>): Promise<PageTag | undefined>;
  deletePageTag(id: string): Promise<boolean>;
  
  // Unified tag methods (Cross-platform tag system)
  getUnifiedTags(): Promise<UnifiedTag[]>;
  getUnifiedTag(id: string): Promise<UnifiedTag | undefined>;
  createUnifiedTag(tag: InsertUnifiedTag): Promise<UnifiedTag>;
  updateUnifiedTag(id: string, tag: Partial<InsertUnifiedTag>): Promise<UnifiedTag | undefined>;
  deleteUnifiedTag(id: string): Promise<boolean>;

  // TikTok Business Account methods
  getTikTokBusinessAccounts(): Promise<TikTokBusinessAccount[]>;
  getTikTokBusinessAccount(id: string): Promise<TikTokBusinessAccount | undefined>;
  getTikTokBusinessAccountByBusinessId(businessId: string): Promise<TikTokBusinessAccount | undefined>;
  createTikTokBusinessAccount(account: InsertTikTokBusinessAccount): Promise<TikTokBusinessAccount>;
  updateTikTokBusinessAccount(id: string, account: Partial<InsertTikTokBusinessAccount>): Promise<TikTokBusinessAccount | undefined>;
  deleteTikTokBusinessAccount(id: string): Promise<boolean>;

  // Facebook Apps methods
  getAllFacebookApps(): Promise<FacebookApp[]>;
  getFacebookAppById(id: string): Promise<FacebookApp | undefined>;
  getFacebookAppByAppId(appId: string): Promise<FacebookApp | undefined>;
  createFacebookApp(app: InsertFacebookApp): Promise<FacebookApp>;
  updateFacebookApp(id: string, app: Partial<InsertFacebookApp>): Promise<FacebookApp | undefined>;
  deleteFacebookApp(id: string): Promise<boolean>;

  // TikTok Shop Order methods
  getTikTokShopOrders(limit?: number): Promise<TikTokShopOrder[]>;
  getTikTokShopOrder(id: string): Promise<TikTokShopOrder | undefined>;
  getTikTokShopOrderByTikTokId(tiktokOrderId: string): Promise<TikTokShopOrder | undefined>;
  createTikTokShopOrder(order: InsertTikTokShopOrder): Promise<TikTokShopOrder>;
  updateTikTokShopOrder(id: string, order: Partial<InsertTikTokShopOrder>): Promise<TikTokShopOrder | undefined>;
  deleteTikTokShopOrder(id: string): Promise<boolean>;

  // TikTok Shop Product methods
  getTikTokShopProducts(): Promise<TikTokShopProduct[]>;
  getTikTokShopProduct(id: string): Promise<TikTokShopProduct | undefined>;
  getTikTokShopProductByTikTokId(tiktokProductId: string): Promise<TikTokShopProduct | undefined>;
  createTikTokShopProduct(product: InsertTikTokShopProduct): Promise<TikTokShopProduct>;
  updateTikTokShopProduct(id: string, product: Partial<InsertTikTokShopProduct>): Promise<TikTokShopProduct | undefined>;
  deleteTikTokShopProduct(id: string): Promise<boolean>;

  // TikTok Video methods
  getTikTokVideos(businessAccountId?: string): Promise<TikTokVideo[]>;
  getTikTokVideo(id: string): Promise<TikTokVideo | undefined>;
  getTikTokVideoByVideoId(videoId: string): Promise<TikTokVideo | undefined>;
  createTikTokVideo(video: InsertTikTokVideo): Promise<TikTokVideo>;
  updateTikTokVideo(id: string, video: Partial<InsertTikTokVideo>): Promise<TikTokVideo | undefined>;
  deleteTikTokVideo(id: string): Promise<boolean>;
  updateSocialAccount(id: string, account: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined>;
  getSocialAccountByPageId(pageId: string): Promise<SocialAccount | undefined>;

  // Facebook Management methods
  getPageTags(): Promise<PageTag[]>;
  getPageTag(id: string): Promise<PageTag | undefined>;
  createPageTag(tag: InsertPageTag): Promise<PageTag>;
  updatePageTag(id: string, tag: Partial<InsertPageTag>): Promise<PageTag | undefined>;
  deletePageTag(id: string): Promise<boolean>;

  // Facebook Conversations
  getFacebookConversations(pageId?: string, limit?: number): Promise<FacebookConversation[]>;
  getFacebookConversation(id: string): Promise<FacebookConversation | undefined>;
  getFacebookConversationByParticipant(pageId: string, participantId: string): Promise<FacebookConversation | undefined>;
  createFacebookConversation(conversation: InsertFacebookConversation): Promise<FacebookConversation>;
  updateFacebookConversation(id: string, conversation: Partial<InsertFacebookConversation>): Promise<FacebookConversation | undefined>;

  // Facebook Messages
  getFacebookMessages(conversationId: string, limit?: number): Promise<FacebookMessage[]>;
  createFacebookMessage(message: InsertFacebookMessage): Promise<FacebookMessage>;
  markConversationAsRead(conversationId: string): Promise<boolean>;

  // Chatbot methods
  getChatbotConversations(limit?: number): Promise<ChatbotConversation[]>;
  getChatbotConversation(id: string): Promise<ChatbotConversation | undefined>;
  getChatbotConversationBySession(sessionId: string): Promise<ChatbotConversation | undefined>;
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;
  updateChatbotConversation(id: string, conversation: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined>;
  addMessageToChatbotConversation(conversationId: string, message: any): Promise<ChatbotConversation | undefined>;
  getChatbotMessages(conversationId: string): Promise<any[]>;

  // Bot Settings methods
  getBotSettings(): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(id: string, settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
  getBotSettingsOrDefault(): Promise<BotSettings>;

  // API Management methods
  getApiConfigurations(): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: string): Promise<ApiConfiguration | undefined>;
  getApiConfigurationByEndpoint(endpoint: string, method?: string): Promise<ApiConfiguration | undefined>;
  getApiConfigurationsByCategory(category: string): Promise<ApiConfiguration[]>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: string, config: Partial<UpdateApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(id: string): Promise<boolean>;
  toggleApiEnabled(id: string, enabled: boolean): Promise<ApiConfiguration | undefined>;
  incrementApiAccess(id: string, responseTime?: number): Promise<void>;
  incrementApiError(id: string): Promise<void>;
  getEnabledApiConfigurations(): Promise<ApiConfiguration[]>;
  updateApiStats(id: string, stats: { accessCount?: number; errorCount?: number; avgResponseTime?: number }): Promise<void>;

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

  // Inventory methods for RASA API
  getProductStock(productId: string): Promise<number>;
  updateProductStock(productId: string, newStock: number): Promise<void>;

  // Payment methods
  getPayment(orderId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined>;

  // Shop settings methods
  getShopSettings(): Promise<ShopSettings[]>;
  getShopSettingsById(id: string): Promise<ShopSettings | undefined>;
  getDefaultShopSettings(): Promise<ShopSettings | undefined>;
  createShopSettings(settings: InsertShopSettings): Promise<ShopSettings>;
  updateShopSettings(id: string, settings: Partial<InsertShopSettings>): Promise<ShopSettings | undefined>;
  deleteShopSettings(id: string): Promise<boolean>;
  setDefaultShopSettings(id: string): Promise<ShopSettings | undefined>;

  // Product Landing Page methods
  getAllProductLandingPages(): Promise<ProductLandingPage[]>;
  getProductLandingPageById(id: string): Promise<ProductLandingPage | undefined>;
  getProductLandingPageBySlug(slug: string): Promise<ProductLandingPage | undefined>;
  createProductLandingPage(data: InsertProductLandingPage): Promise<ProductLandingPage>;
  updateProductLandingPage(id: string, data: Partial<InsertProductLandingPage>): Promise<ProductLandingPage | undefined>;
  deleteProductLandingPage(id: string): Promise<boolean>;
  incrementLandingPageView(id: string): Promise<void>;
  incrementLandingPageOrder(id: string): Promise<void>;
  getProductLandingPageWithDetails(idOrSlug: string): Promise<any>;

  // Product Review methods
  getProductReviews(productId: string, limit?: number): Promise<ProductReview[]>;
  getProductReviewsWithStats(productId: string): Promise<{ reviews: ProductReview[]; averageRating: number; totalReviews: number; ratingCounts: { [key: number]: number } }>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: string): Promise<boolean>;
  incrementHelpfulCount(id: string): Promise<boolean>;

  // Product FAQ methods
  getProductFAQs(productId: string, includeInactive?: boolean): Promise<ProductFAQ[]>;
  getProductFAQ(id: string): Promise<ProductFAQ | undefined>;
  createProductFAQ(faq: InsertProductFAQ): Promise<ProductFAQ>;
  updateProductFAQ(id: string, faq: Partial<InsertProductFAQ>): Promise<ProductFAQ | undefined>;
  deleteProductFAQ(id: string): Promise<boolean>;
  updateProductFAQOrder(productId: string, faqIds: string[]): Promise<boolean>;

  // Product Policy methods
  getProductPolicies(): Promise<ProductPolicy[]>;
  getProductPolicy(id: string): Promise<ProductPolicy | undefined>;
  createProductPolicy(policy: InsertProductPolicy): Promise<ProductPolicy>;
  updateProductPolicy(id: string, policy: Partial<InsertProductPolicy>): Promise<ProductPolicy | undefined>;
  deleteProductPolicy(id: string): Promise<boolean>;

  // Product Policy Association methods
  getProductPolicyAssociations(productId: string): Promise<(ProductPolicyAssociation & { policy: ProductPolicy })[]>;
  addProductPolicyAssociation(productId: string, policyId: string, sortOrder?: number): Promise<ProductPolicyAssociation>;
  removeProductPolicyAssociation(productId: string, policyId: string): Promise<boolean>;
  updateProductPolicyAssociationOrder(productId: string, policyIds: string[]): Promise<boolean>;

  // Content Library methods
  getContentLibraryItems(filters?: { tags?: string[]; status?: string; contentType?: string; priority?: string }): Promise<ContentLibrary[]>;
  getContentLibraryItem(id: string): Promise<ContentLibrary | undefined>;
  createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibrary>;
  updateContentLibraryItem(id: string, item: UpdateContentLibrary): Promise<ContentLibrary | undefined>;
  deleteContentLibraryItem(id: string): Promise<boolean>;
  incrementContentUsage(id: string): Promise<void>;
  addAIVariation(id: string, variation: { content: string; tone: string; style: string }): Promise<ContentLibrary | undefined>;
  getContentLibraryByTags(tagIds: string[]): Promise<ContentLibrary[]>;
  getContentLibraryByPriority(priority: string): Promise<ContentLibrary[]>;

  // Worker methods
  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkerByWorkerId(workerId: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<boolean>;
  updateWorkerStatus(workerId: string, isOnline: boolean, lastPingAt?: Date): Promise<Worker | undefined>;

  // AbeBooks methods
  getAbebooksAccounts(): Promise<AbebooksAccount[]>;
  getAbebooksAccount(id: string): Promise<AbebooksAccount | undefined>;
  getDefaultAbebooksAccount(): Promise<AbebooksAccount | undefined>;
  createAbebooksAccount(account: InsertAbebooksAccount): Promise<AbebooksAccount>;
  updateAbebooksAccount(id: string, account: Partial<InsertAbebooksAccount>): Promise<AbebooksAccount | undefined>;
  trackAbebooksAccountUsage(accountId: string): Promise<AbebooksAccount | undefined>;
  
  getAbebooksListings(bookIsbn?: string, accountId?: string): Promise<AbebooksListing[]>;
  getAbebooksListing(id: string): Promise<AbebooksListing | undefined>;
  createAbebooksListing(listing: InsertAbebooksListing): Promise<AbebooksListing>;
  updateAbebooksListing(id: string, listing: Partial<InsertAbebooksListing>): Promise<AbebooksListing | undefined>;
  deleteAbebooksListing(id: string): Promise<boolean>;
  
  getAbebooksSearchHistory(accountId?: string, limit?: number): Promise<AbebooksSearchHistory[]>;
  createAbebooksSearchHistory(history: InsertAbebooksSearchHistory): Promise<AbebooksSearchHistory>;
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
          ilike(products.description, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.itemCode, `%${search}%`)
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
      sku: products.sku,
      itemCode: products.itemCode,
      price: products.price,
      stock: products.stock,
      categoryId: products.categoryId,
      status: products.status,
      image: products.image,
      images: products.images,
      videos: products.videos,
      // 🤖 Include AI-generated descriptions for RASA
      descriptions: products.descriptions,
      defaultImageIndex: products.defaultImageIndex,
      tagIds: products.tagIds,
      // 🎯 SEO & Product Page Enhancement fields
      shortDescription: products.shortDescription,
      slug: products.slug,
      productStory: products.productStory,
      ingredients: products.ingredients,
      benefits: products.benefits,
      usageInstructions: products.usageInstructions,
      specifications: products.specifications,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      ogImageUrl: products.ogImageUrl,
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

  // Get popular products based on order items count
  async getPopularProducts(limit = 10): Promise<Product[]> {
    try {
      // Get products ordered most frequently today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const popularProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          itemCode: products.itemCode,
          price: products.price,
          stock: products.stock,
          image: products.image,
          images: products.images,
          videos: products.videos,
          descriptions: products.descriptions,
          defaultImageIndex: products.defaultImageIndex,
          tagIds: products.tagIds,
          // 🎯 SEO & Product Page Enhancement fields
          shortDescription: products.shortDescription,
          slug: products.slug,
          productStory: products.productStory,
          ingredients: products.ingredients,
          benefits: products.benefits,
          usageInstructions: products.usageInstructions,
          specifications: products.specifications,
          seoTitle: products.seoTitle,
          seoDescription: products.seoDescription,
          ogImageUrl: products.ogImageUrl,
          categoryId: products.categoryId,
          status: products.status,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          orderCount: sql<number>`COUNT(${orderItems.productId})::int`,
        })
        .from(products)
        .leftJoin(orderItems, eq(products.id, orderItems.productId))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(products.status, 'active'),
            or(
              gte(orders.createdAt, today),
              isNull(orders.createdAt) // Include products with no orders
            )
          )
        )
        .groupBy(products.id)
        .orderBy(desc(sql`COUNT(${orderItems.productId})`), desc(products.createdAt))
        .limit(limit);

      return popularProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        itemCode: p.itemCode,
        price: p.price,
        image: p.image,
        images: p.images,
        videos: p.videos,
        descriptions: p.descriptions,
        defaultImageIndex: p.defaultImageIndex,
        tagIds: p.tagIds,
        // 🎯 SEO & Product Page Enhancement fields
        shortDescription: p.shortDescription,
        slug: p.slug,
        productStory: p.productStory,
        ingredients: p.ingredients,
        benefits: p.benefits,
        usageInstructions: p.usageInstructions,
        specifications: p.specifications,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        ogImageUrl: p.ogImageUrl,
        categoryId: p.categoryId,
        status: p.status,
        stock: p.stock,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      console.error("Error fetching popular products:", error);
      // Fallback to latest products if query fails
      return await this.getProducts(limit);
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySKU(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product || undefined;
  }

  async getProductsWithoutSKU(): Promise<Product[]> {
    return await db.select().from(products).where(isNull(products.sku));
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
    try {
      console.log('🗑️ Starting cascade delete for product:', id);
      
      // Delete all references to avoid foreign key constraints
      
      // 1. Delete product landing pages
      const landingPages = await db.delete(productLandingPages).where(eq(productLandingPages.productId, id));
      console.log('🗑️ Deleted landing pages:', landingPages.rowCount);
      
      // 2. Delete order items (this will break foreign key with orders, but we need to handle this carefully)
      // Instead of deleting order items, we'll just prevent deletion if product has orders
      const existingOrders = await db.select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .where(eq(orderItems.productId, id));
      
      if (existingOrders[0]?.count > 0) {
        return false; // Don't delete products that have been ordered
      }
      
      // 3. Delete the product itself
      const result = await db.delete(products).where(eq(products.id, id));
      console.log('🗑️ Deleted product:', result.rowCount);
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  }

  // Customer methods
  async getCustomers(limit = 50): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]> {
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
          lastOrderDate: stats.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString(),
          totalDebt: customer.totalDebt || '0',
          creditLimit: customer.creditLimit || '0'
        };
      })
    );
    
    return enrichedCustomers;
  }

  async getCustomer(id: string): Promise<(Customer & { totalDebt: string; creditLimit: string }) | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return undefined;
    
    return {
      ...customer,
      totalDebt: customer.totalDebt || '0',
      creditLimit: customer.creditLimit || '0'
    };
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
    
    // Delete payments, order items, then orders for each order
    for (const order of customerOrders) {
      // Delete payments first (foreign key constraint)
      await db.delete(payments).where(eq(payments.orderId, order.id));
      // Then delete order items
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

  // Customer analytics methods for POS suggestions
  async searchCustomers(searchTerm: string, limit = 10): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]> {
    try {
      // Search customers by name, phone, or email
      const baseCustomers = await db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, `%${searchTerm}%`),
            ilike(customers.phone, `%${searchTerm}%`),
            ilike(customers.email, `%${searchTerm}%`)
          )
        )
        .orderBy(desc(customers.joinDate))
        .limit(limit);

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
            lastOrderDate: stats.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString(),
            totalDebt: customer.totalDebt || '0',
            creditLimit: customer.creditLimit || '0'
          };
        })
      );
      
      return enrichedCustomers;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  async getRecentCustomers(limit = 10): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]> {
    try {
      // Get customers with orders in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentCustomerIds = await db
        .selectDistinct({ customerId: orders.customerId })
        .from(orders)
        .where(gte(orders.createdAt, thirtyDaysAgo));

      if (recentCustomerIds.length === 0) {
        return [];
      }

      const customerIds = recentCustomerIds.map(r => r.customerId);
      const baseCustomers = await db
        .select()
        .from(customers)
        .where(inArray(customers.id, customerIds))
        .orderBy(desc(customers.joinDate))
        .limit(limit);

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
            lastOrderDate: stats.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString(),
            totalDebt: customer.totalDebt || '0',
            creditLimit: customer.creditLimit || '0'
          };
        })
      );
      
      // Sort by most recent order first
      return enrichedCustomers.sort((a, b) => 
        new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      );
    } catch (error) {
      console.error('Error getting recent customers:', error);
      return [];
    }
  }

  async getVipCustomers(limit = 10): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]> {
    try {
      const baseCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.status, 'vip'))
        .orderBy(desc(customers.joinDate))
        .limit(limit);

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
            lastOrderDate: stats.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString(),
            totalDebt: customer.totalDebt || '0',
            creditLimit: customer.creditLimit || '0'
          };
        })
      );
      
      // Sort VIP customers by total spent (high value customers first)
      return enrichedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    } catch (error) {
      console.error('Error getting VIP customers:', error);
      return [];
    }
  }

  async getFrequentCustomers(limit = 10): Promise<(Customer & { totalOrders: number; totalSpent: number; lastOrderDate: string; totalDebt: string; creditLimit: string })[]> {
    try {
      // Get customers with their order counts
      const customerOrderCounts = await db
        .select({
          customerId: orders.customerId,
          totalOrders: count(orders.id),
          totalSpent: sum(orders.total),
          lastOrderDate: sql<string>`MAX(${orders.createdAt})::text`
        })
        .from(orders)
        .groupBy(orders.customerId)
        .having(sql`COUNT(${orders.id}) > 0`)
        .orderBy(sql`COUNT(${orders.id}) DESC`)
        .limit(limit);

      if (customerOrderCounts.length === 0) {
        return [];
      }

      // Get customer details
      const customerIds = customerOrderCounts.map(c => c.customerId);
      const baseCustomers = await db
        .select()
        .from(customers)
        .where(inArray(customers.id, customerIds));

      // Combine customer data with order statistics
      const enrichedCustomers = baseCustomers.map(customer => {
        const stats = customerOrderCounts.find(c => c.customerId === customer.id);
        return {
          ...customer,
          totalOrders: Number(stats?.totalOrders) || 0,
          totalSpent: Number(stats?.totalSpent) || 0,
          lastOrderDate: stats?.lastOrderDate || customer.joinDate?.toISOString() || new Date().toISOString(),
          totalDebt: customer.totalDebt || '0',
          creditLimit: customer.creditLimit || '0'
        };
      });

      // Sort by total orders descending (most frequent first)
      return enrichedCustomers.sort((a, b) => b.totalOrders - a.totalOrders);
    } catch (error) {
      console.error('Error getting frequent customers:', error);
      return [];
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
    // Set defaults for new fields if not provided
    const orderData = {
      ...order,
      source: order.source || 'admin',
      syncStatus: order.syncStatus || 'manual',
      paymentMethod: order.paymentMethod || 'cash'
    };
    
    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    // Handle debt payment: update customer's total debt
    if (orderData.paymentMethod === 'debt' && orderData.customerId) {
      const orderTotal = parseFloat(orderData.total);
      
      await db
        .update(customers)
        .set({
          totalDebt: sql`COALESCE(total_debt, 0) + ${orderTotal}`
        })
        .where(eq(customers.id, orderData.customerId));
    }
    
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

  async deleteOrderItem(id: string): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return result.rowCount > 0;
  }

  // Debt management methods
  async updateCustomerDebt(customerId: string, paymentAmount: number): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        totalDebt: sql`GREATEST(0, COALESCE(total_debt, 0) - ${paymentAmount})`
      })
      .where(eq(customers.id, customerId))
      .returning();
    return updatedCustomer || undefined;
  }

  async getCustomerDebtInfo(customerId: string): Promise<{ totalDebt: number; creditLimit: number } | undefined> {
    const [customer] = await db
      .select({
        totalDebt: customers.totalDebt,
        creditLimit: customers.creditLimit
      })
      .from(customers)
      .where(eq(customers.id, customerId));
    
    if (!customer) return undefined;
    
    return {
      totalDebt: parseFloat(customer.totalDebt || '0'),
      creditLimit: parseFloat(customer.creditLimit || '0')
    };
  }

  // Social account methods
  async getSocialAccounts(): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
  }

  async getSocialAccount(id: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    return account || undefined;
  }

  async getSocialAccountById(id: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    return account || undefined;
  }

  async getSocialAccountByPlatform(platform: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.platform, platform as any));
    return account || undefined;
  }

  async getSocialAccountsByPlatform(platform: string): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts).where(eq(socialAccounts.platform, platform as any));
  }


  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [newAccount] = await db.insert(socialAccounts).values([account as any]).returning();
    return newAccount;
  }

  async updateSocialAccount(id: string, account: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined> {
    const [updatedAccount] = await db
      .update(socialAccounts)
      .set({ ...account, updatedAt: new Date() } as any)
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

  async getChatbotConversation(id: string): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db.select().from(chatbotConversations).where(eq(chatbotConversations.id, id));
    return conversation || undefined;
  }

  async getChatbotConversationBySession(sessionId: string): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db.select().from(chatbotConversations).where(eq(chatbotConversations.sessionId, sessionId));
    return conversation || undefined;
  }

  async updateChatbotConversation(id: string, conversation: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined> {
    const [updatedConversation] = await db
      .update(chatbotConversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(chatbotConversations.id, id))
      .returning();
    return updatedConversation || undefined;
  }

  async addMessageToChatbotConversation(conversationId: string, message: any): Promise<ChatbotConversation | undefined> {
    // Get current conversation to access existing messages
    const conversation = await this.getChatbotConversation(conversationId);
    if (!conversation) {
      return undefined;
    }

    // Add new message to existing messages array
    const currentMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const updatedMessages = [...currentMessages, {
      ...message,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }];

    // Update conversation with new messages and metadata
    const [updatedConversation] = await db
      .update(chatbotConversations)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
        status: 'active'
      })
      .where(eq(chatbotConversations.id, conversationId))
      .returning();

    return updatedConversation || undefined;
  }

  async getChatbotMessages(conversationId: string): Promise<any[]> {
    const conversation = await this.getChatbotConversation(conversationId);
    if (!conversation) {
      return [];
    }
    
    // Return messages from JSONB field, ensuring it's an array
    const messages = conversation.messages;
    return Array.isArray(messages) ? messages : [];
  }

  // Bot Settings methods
  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).limit(1);
    return settings || undefined;
  }

  async createBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const [newSettings] = await db.insert(botSettings).values(settings).returning();
    return newSettings;
  }

  async updateBotSettings(id: string, settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const [updatedSettings] = await db
      .update(botSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(botSettings.id, id))
      .returning();
    return updatedSettings || undefined;
  }

  async getBotSettingsOrDefault(): Promise<BotSettings> {
    const settings = await this.getBotSettings();
    if (settings) {
      return settings;
    }
    
    // Create default settings if none exist
    const defaultSettings: InsertBotSettings = {
      rasaUrl: "http://localhost:5005",
      webhookUrl: "",
      isEnabled: true,
      autoReply: false,
      connectionTimeout: 5000,
      maxRetries: 3,
      healthStatus: "offline"
    };
    
    return await this.createBotSettings(defaultSettings);
  }

  // Centralized serializer to prevent secret leakage
  toPublicBotSettings(settings: BotSettings | undefined | null): any {
    if (!settings) return null;
    const { apiKey, ...publicSettings } = settings;
    return publicSettings;
  }

  // API Management methods
  async getApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations).orderBy(desc(apiConfigurations.createdAt));
  }

  async getApiConfiguration(id: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.id, id));
    return config || undefined;
  }

  async getApiConfigurationByEndpoint(endpoint: string, method?: string): Promise<ApiConfiguration | undefined> {
    const conditions = [eq(apiConfigurations.endpoint, endpoint)];
    if (method) {
      conditions.push(eq(apiConfigurations.method, method));
    }
    
    const [config] = await db.select().from(apiConfigurations).where(and(...conditions));
    return config || undefined;
  }

  async getApiConfigurationsByCategory(category: string): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations)
      .where(eq(apiConfigurations.category, category))
      .orderBy(desc(apiConfigurations.createdAt));
  }

  async createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [newConfig] = await db.insert(apiConfigurations).values(config).returning();
    return newConfig;
  }

  async updateApiConfiguration(id: string, config: Partial<UpdateApiConfiguration>): Promise<ApiConfiguration | undefined> {
    const [updatedConfig] = await db
      .update(apiConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(apiConfigurations.id, id))
      .returning();
    return updatedConfig || undefined;
  }

  async deleteApiConfiguration(id: string): Promise<boolean> {
    const result = await db.delete(apiConfigurations).where(eq(apiConfigurations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async toggleApiEnabled(id: string, enabled: boolean): Promise<ApiConfiguration | undefined> {
    const [updatedConfig] = await db
      .update(apiConfigurations)
      .set({ 
        isEnabled: enabled, 
        lastToggled: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(apiConfigurations.id, id))
      .returning();
    return updatedConfig || undefined;
  }

  async incrementApiAccess(id: string, responseTime?: number): Promise<void> {
    if (responseTime !== undefined) {
      // Atomic update with response time averaging
      await db
        .update(apiConfigurations)
        .set({
          accessCount: sql`${apiConfigurations.accessCount} + 1`,
          avgResponseTime: sql`((${apiConfigurations.avgResponseTime}::numeric * ${apiConfigurations.accessCount}) + ${responseTime}) / (${apiConfigurations.accessCount} + 1)`,
          lastAccessed: new Date(),
          updatedAt: new Date()
        })
        .where(eq(apiConfigurations.id, id));
    } else {
      // Atomic update without response time
      await db
        .update(apiConfigurations)
        .set({
          accessCount: sql`${apiConfigurations.accessCount} + 1`,
          lastAccessed: new Date(),
          updatedAt: new Date()
        })
        .where(eq(apiConfigurations.id, id));
    }
  }

  async incrementApiError(id: string): Promise<void> {
    await db
      .update(apiConfigurations)
      .set({ 
        errorCount: sql`${apiConfigurations.errorCount} + 1`,
        lastError: new Date(),
        updatedAt: new Date()
      })
      .where(eq(apiConfigurations.id, id));
  }

  async getEnabledApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations)
      .where(and(
        eq(apiConfigurations.isEnabled, true),
        eq(apiConfigurations.maintenanceMode, false)
      ))
      .orderBy(apiConfigurations.priority, apiConfigurations.category);
  }

  async updateApiStats(id: string, stats: { accessCount?: number; errorCount?: number; avgResponseTime?: number }): Promise<void> {
    const updates: any = { updatedAt: new Date() };
    
    if (stats.accessCount !== undefined) updates.accessCount = stats.accessCount;
    if (stats.errorCount !== undefined) updates.errorCount = stats.errorCount;
    if (stats.avgResponseTime !== undefined) updates.avgResponseTime = stats.avgResponseTime;

    await db
      .update(apiConfigurations)
      .set(updates)
      .where(eq(apiConfigurations.id, id));
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

  /**
   * 🚀 Create Payment with Automatic QR Generation
   * Enhanced method that auto-generates VietQR codes for SHB bank
   */
  async createPaymentWithQR(orderId: string, amount: number, description?: string): Promise<Payment> {
    // Import VietQRService dynamically để avoid circular dependencies
    const { VietQRService } = await import('./services/vietqr-service');
    
    // 🎯 Generate logical order number for QR reference
    const order = await this.getOrder(orderId);
    const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const logicOrderId = `${dateStr}-${orderId.slice(-3).toUpperCase()}`; // Short reference
    
    // 🏦 Generate VietQR code automatically
    const qrResult = VietQRService.generateMobileQR(
      amount,
      logicOrderId,
      description || `Thanh toán đơn hàng ${logicOrderId}`
    );
    
    // 💾 Create payment record với auto-generated QR
    const paymentData: InsertPayment = {
      orderId,
      method: 'bank_transfer',
      amount: amount.toString(),
      qrCode: qrResult.qrCodeUrl,
      status: 'pending',
      bankInfo: qrResult.bankInfo,
    };
    
    const [newPayment] = await db.insert(payments).values(paymentData).returning();
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

  // Inventory methods for RASA API
  async getProductStock(productId: string): Promise<number> {
    const product = await this.getProduct(productId);
    return product?.stock || 0;
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    await db
      .update(products)
      .set({ stock: newStock, updatedAt: new Date() })
      .where(eq(products.id, productId));
  }

  // Shop settings methods
  async getShopSettings(): Promise<ShopSettings[]> {
    return await db.select().from(shopSettings).orderBy(desc(shopSettings.isDefault), desc(shopSettings.updatedAt));
  }

  async getShopSettingsById(id: string): Promise<ShopSettings | undefined> {
    const [settings] = await db.select().from(shopSettings).where(eq(shopSettings.id, id));
    return settings || undefined;
  }

  async getDefaultShopSettings(): Promise<ShopSettings | undefined> {
    const [settings] = await db.select().from(shopSettings).where(eq(shopSettings.isDefault, true));
    return settings || undefined;
  }

  async createShopSettings(insertSettings: InsertShopSettings): Promise<ShopSettings> {
    // If this is set as default, use transaction to ensure atomicity
    if (insertSettings.isDefault) {
      return await db.transaction(async (tx) => {
        // Unset all other defaults first
        await tx.update(shopSettings).set({ isDefault: false, updatedAt: new Date() });
        
        // Then create the new default settings
        const [settings] = await tx.insert(shopSettings).values(insertSettings).returning();
        return settings;
      });
    }
    
    const [settings] = await db.insert(shopSettings).values(insertSettings).returning();
    return settings;
  }

  async updateShopSettings(id: string, updateSettings: Partial<InsertShopSettings>): Promise<ShopSettings | undefined> {
    // If this is being set as default, use transaction to ensure atomicity
    if (updateSettings.isDefault) {
      return await db.transaction(async (tx) => {
        // Unset all other defaults first
        await tx.update(shopSettings).set({ isDefault: false, updatedAt: new Date() });
        
        // Then update the specified settings as default
        const [settings] = await tx
          .update(shopSettings)
          .set({ ...updateSettings, updatedAt: new Date() })
          .where(eq(shopSettings.id, id))
          .returning();
        return settings || undefined;
      });
    }
    
    const [settings] = await db
      .update(shopSettings)
      .set({ ...updateSettings, updatedAt: new Date() })
      .where(eq(shopSettings.id, id))
      .returning();
    return settings || undefined;
  }

  async deleteShopSettings(id: string): Promise<boolean> {
    const result = await db.delete(shopSettings).where(eq(shopSettings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async setDefaultShopSettings(id: string): Promise<ShopSettings | undefined> {
    // Use transaction to ensure atomic operation
    return await db.transaction(async (tx) => {
      // First, unset all defaults
      await tx.update(shopSettings).set({ isDefault: false, updatedAt: new Date() });
      
      // Then set the specified one as default
      const [settings] = await tx
        .update(shopSettings)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(shopSettings.id, id))
        .returning();
      return settings || undefined;
    });
  }

  // Product Landing Page methods
  async getAllProductLandingPages(): Promise<ProductLandingPage[]> {
    const result = await db
      .select()
      .from(productLandingPages)
      .orderBy(desc(productLandingPages.createdAt));
    return result;
  }

  async getProductLandingPageById(id: string): Promise<ProductLandingPage | undefined> {
    const [landingPage] = await db
      .select()
      .from(productLandingPages)
      .where(eq(productLandingPages.id, id));
    return landingPage || undefined;
  }

  async getProductLandingPageBySlug(slug: string): Promise<ProductLandingPage | undefined> {
    // Normalize input to handle case/whitespace/encoding issues
    const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
    
    // Query with case-insensitive comparison
    const [landingPage] = await db
      .select()
      .from(productLandingPages)
      .where(sql`lower(${productLandingPages.slug}) = ${normalizedSlug}`);
    
    // Fallback: try exact match if normalized didn't work
    if (!landingPage) {
      const [exactMatch] = await db
        .select()
        .from(productLandingPages)
        .where(eq(productLandingPages.slug, slug));
      return exactMatch || undefined;
    }
    
    return landingPage || undefined;
  }

  async createProductLandingPage(data: InsertProductLandingPage): Promise<ProductLandingPage> {
    // Check if slug already exists
    const existing = await this.getProductLandingPageBySlug(data.slug);
    if (existing) {
      throw new Error('Slug already exists');
    }

    const [landingPage] = await db
      .insert(productLandingPages)
      .values({
        ...data,
        viewCount: 0,
        orderCount: 0,
        conversionRate: "0.00"
      })
      .returning();
    return landingPage;
  }

  async updateProductLandingPage(id: string, data: Partial<InsertProductLandingPage>): Promise<ProductLandingPage | undefined> {
    const [landingPage] = await db
      .update(productLandingPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productLandingPages.id, id))
      .returning();
    return landingPage || undefined;
  }

  async deleteProductLandingPage(id: string): Promise<boolean> {
    const result = await db.delete(productLandingPages).where(eq(productLandingPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementLandingPageView(id: string): Promise<void> {
    await db
      .update(productLandingPages)
      .set({
        viewCount: sql`${productLandingPages.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(productLandingPages.id, id));
  }

  async incrementLandingPageOrder(id: string): Promise<void> {
    await db
      .update(productLandingPages)
      .set({
        orderCount: sql`${productLandingPages.orderCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(productLandingPages.id, id));
  }

  async getProductLandingPageWithDetails(idOrSlug: string): Promise<any> {
    let landingPage: ProductLandingPage | undefined;
    
    // Try to get by slug first, then by ID
    // UUIDs are exactly 36 characters with dashes at positions 8,13,18,23
    const isUUID = idOrSlug.length === 36 && 
                   idOrSlug[8] === '-' && 
                   idOrSlug[13] === '-' && 
                   idOrSlug[18] === '-' && 
                   idOrSlug[23] === '-';
    
    if (isUUID) {
      // This looks like a UUID
      landingPage = await this.getProductLandingPageById(idOrSlug);
    } else {
      // This looks like a slug
      landingPage = await this.getProductLandingPageBySlug(idOrSlug);
    }
    if (!landingPage) return null;

    // Get product details
    const product = await this.getProduct(landingPage.productId);
    if (!product) return null;

    return {
      ...landingPage,
      product,
      finalPrice: landingPage.customPrice || parseFloat(product.price),
      displayName: landingPage.title || product.name,
      displayDescription: landingPage.description || product.description,
      availableStock: product.stock || 0
    };
  }

  // Product Review methods
  async getProductReviews(productId: string, limit = 20): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(and(
        eq(productReviews.productId, productId),
        eq(productReviews.isApproved, true)
      ))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit);
  }

  async getProductReviewsWithStats(productId: string): Promise<{ 
    reviews: ProductReview[]; 
    averageRating: number; 
    totalReviews: number; 
    ratingCounts: { [key: number]: number } 
  }> {
    // Get reviews
    const reviews = await this.getProductReviews(productId);
    
    // Get rating statistics
    const stats = await db
      .select({
        rating: productReviews.rating,
        count: count()
      })
      .from(productReviews)
      .where(and(
        eq(productReviews.productId, productId),
        eq(productReviews.isApproved, true)
      ))
      .groupBy(productReviews.rating);

    // Calculate averages and counts
    let totalReviews = 0;
    let totalRating = 0;
    const ratingCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    stats.forEach(stat => {
      const rating = stat.rating;
      const count = stat.count;
      totalReviews += count;
      totalRating += rating * count;
      ratingCounts[rating] = count;
    });

    const averageRating = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;

    return {
      reviews,
      averageRating,
      totalReviews,
      ratingCounts
    };
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db.insert(productReviews).values(review).returning();
    return newReview;
  }

  async updateProductReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updatedReview] = await db
      .update(productReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(productReviews.id, id))
      .returning();
    return updatedReview || undefined;
  }

  async deleteProductReview(id: string): Promise<boolean> {
    const result = await db.delete(productReviews).where(eq(productReviews.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementHelpfulCount(id: string): Promise<boolean> {
    try {
      await db
        .update(productReviews)
        .set({
          helpfulCount: sql`${productReviews.helpfulCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(productReviews.id, id));
      return true;
    } catch {
      return false;
    }
  }

  // Product FAQ methods
  async getProductFAQs(productId: string, includeInactive = false): Promise<ProductFAQ[]> {
    const whereClause = includeInactive 
      ? eq(productFAQs.productId, productId)
      : and(
          eq(productFAQs.productId, productId),
          eq(productFAQs.isActive, true)
        );
    
    return await db
      .select()
      .from(productFAQs)
      .where(whereClause)
      .orderBy(productFAQs.sortOrder, productFAQs.createdAt);
  }

  async getProductFAQ(id: string): Promise<ProductFAQ | undefined> {
    const [faq] = await db.select().from(productFAQs).where(eq(productFAQs.id, id));
    return faq || undefined;
  }

  async createProductFAQ(faq: InsertProductFAQ): Promise<ProductFAQ> {
    const [newFAQ] = await db.insert(productFAQs).values(faq).returning();
    return newFAQ;
  }

  async updateProductFAQ(id: string, faq: Partial<InsertProductFAQ>): Promise<ProductFAQ | undefined> {
    const [updatedFAQ] = await db
      .update(productFAQs)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(productFAQs.id, id))
      .returning();
    return updatedFAQ || undefined;
  }

  async getMaxProductFAQSortOrder(productId: string): Promise<number> {
    const result = await db
      .select({ maxSortOrder: sql<number>`COALESCE(MAX(${productFAQs.sortOrder}), -1)` })
      .from(productFAQs)
      .where(eq(productFAQs.productId, productId));
    
    return result[0]?.maxSortOrder ?? -1;
  }

  async deleteProductFAQ(id: string): Promise<boolean> {
    const result = await db.delete(productFAQs).where(eq(productFAQs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateProductFAQOrder(productId: string, faqIds: string[]): Promise<boolean> {
    try {
      // Update sort order for each FAQ
      for (let i = 0; i < faqIds.length; i++) {
        await db
          .update(productFAQs)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(
            eq(productFAQs.id, faqIds[i]),
            eq(productFAQs.productId, productId)
          ));
      }
      return true;
    } catch {
      return false;
    }
  }

  // Product Policy methods
  async getProductPolicies(): Promise<ProductPolicy[]> {
    return await db
      .select()
      .from(productPolicies)
      .where(eq(productPolicies.isActive, true))
      .orderBy(productPolicies.sortOrder, productPolicies.createdAt);
  }

  async getProductPolicy(id: string): Promise<ProductPolicy | undefined> {
    const [policy] = await db.select().from(productPolicies).where(eq(productPolicies.id, id));
    return policy || undefined;
  }

  async createProductPolicy(policy: InsertProductPolicy): Promise<ProductPolicy> {
    const [newPolicy] = await db.insert(productPolicies).values(policy).returning();
    return newPolicy;
  }

  async updateProductPolicy(id: string, policy: Partial<InsertProductPolicy>): Promise<ProductPolicy | undefined> {
    const [updatedPolicy] = await db
      .update(productPolicies)
      .set({ ...policy, updatedAt: new Date() })
      .where(eq(productPolicies.id, id))
      .returning();
    return updatedPolicy || undefined;
  }

  async deleteProductPolicy(id: string): Promise<boolean> {
    const result = await db.delete(productPolicies).where(eq(productPolicies.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product Policy Association methods
  async getProductPolicyAssociations(productId: string): Promise<(ProductPolicyAssociation & { policy: ProductPolicy })[]> {
    const results = await db
      .select({
        productId: productPolicyAssociations.productId,
        policyId: productPolicyAssociations.policyId,
        sortOrder: productPolicyAssociations.sortOrder,
        createdAt: productPolicyAssociations.createdAt,
        policy: {
          id: productPolicies.id,
          title: productPolicies.title,
          description: productPolicies.description,
          icon: productPolicies.icon,
          type: productPolicies.type,
          isActive: productPolicies.isActive,
          sortOrder: productPolicies.sortOrder,
          createdAt: productPolicies.createdAt,
          updatedAt: productPolicies.updatedAt,
        }
      })
      .from(productPolicyAssociations)
      .leftJoin(productPolicies, eq(productPolicyAssociations.policyId, productPolicies.id))
      .where(eq(productPolicyAssociations.productId, productId))
      .orderBy(productPolicyAssociations.sortOrder);

    return results.map(row => ({
      productId: row.productId,
      policyId: row.policyId,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      policy: row.policy as ProductPolicy
    }));
  }

  async addProductPolicyAssociation(productId: string, policyId: string, sortOrder = 0): Promise<ProductPolicyAssociation> {
    const [association] = await db
      .insert(productPolicyAssociations)
      .values({ productId, policyId, sortOrder })
      .returning();
    return association;
  }

  async removeProductPolicyAssociation(productId: string, policyId: string): Promise<boolean> {
    const result = await db
      .delete(productPolicyAssociations)
      .where(and(
        eq(productPolicyAssociations.productId, productId),
        eq(productPolicyAssociations.policyId, policyId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateProductPolicyAssociationOrder(productId: string, policyIds: string[]): Promise<boolean> {
    try {
      // Update sort order for each policy association
      for (let i = 0; i < policyIds.length; i++) {
        await db
          .update(productPolicyAssociations)
          .set({ sortOrder: i })
          .where(and(
            eq(productPolicyAssociations.productId, productId),
            eq(productPolicyAssociations.policyId, policyIds[i])
          ));
      }
      return true;
    } catch {
      return false;
    }
  }

  // Facebook Management Methods
  async getPageTags(): Promise<PageTag[]> {
    return await db.select().from(pageTags).orderBy(desc(pageTags.createdAt));
  }

  async createPageTag(tag: InsertPageTag): Promise<PageTag> {
    const [newTag] = await db.insert(pageTags).values(tag).returning();
    return newTag;
  }

  async updatePageTag(id: string, tag: Partial<InsertPageTag>): Promise<PageTag | undefined> {
    const [updatedTag] = await db
      .update(pageTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(pageTags.id, id))
      .returning();
    return updatedTag || undefined;
  }

  async deletePageTag(id: string): Promise<boolean> {
    const result = await db.delete(pageTags).where(eq(pageTags.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Unified tag methods implementation
  async getUnifiedTags(): Promise<UnifiedTag[]> {
    return await db.select().from(unifiedTags).orderBy(desc(unifiedTags.createdAt));
  }

  async getUnifiedTag(id: string): Promise<UnifiedTag | undefined> {
    const [tag] = await db.select().from(unifiedTags).where(eq(unifiedTags.id, id));
    return tag || undefined;
  }

  async createUnifiedTag(tag: InsertUnifiedTag): Promise<UnifiedTag> {
    const [newTag] = await db.insert(unifiedTags).values(tag).returning();
    return newTag;
  }

  async updateUnifiedTag(id: string, tag: Partial<InsertUnifiedTag>): Promise<UnifiedTag | undefined> {
    const [updatedTag] = await db
      .update(unifiedTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(unifiedTags.id, id))
      .returning();
    return updatedTag || undefined;
  }

  async deleteUnifiedTag(id: string): Promise<boolean> {
    const result = await db.delete(unifiedTags).where(eq(unifiedTags.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Facebook Conversations
  async getFacebookConversations(pageId?: string, limit = 50): Promise<FacebookConversation[]> {
    const query = db.select().from(facebookConversations);
    
    if (pageId) {
      return await query
        .where(eq(facebookConversations.pageId, pageId))
        .orderBy(desc(facebookConversations.lastMessageAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(facebookConversations.lastMessageAt))
      .limit(limit);
  }

  async getFacebookConversation(id: string): Promise<FacebookConversation | undefined> {
    const [conversation] = await db.select().from(facebookConversations).where(eq(facebookConversations.id, id));
    return conversation || undefined;
  }

  async getFacebookConversationByParticipant(pageId: string, participantId: string): Promise<FacebookConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(facebookConversations)
      .where(and(
        eq(facebookConversations.pageId, pageId),
        eq(facebookConversations.participantId, participantId)
      ));
    return conversation || undefined;
  }

  async createFacebookConversation(conversation: InsertFacebookConversation): Promise<FacebookConversation> {
    const [newConversation] = await db.insert(facebookConversations).values([conversation as any]).returning();
    return newConversation;
  }

  async updateFacebookConversation(id: string, conversation: Partial<InsertFacebookConversation>): Promise<FacebookConversation | undefined> {
    const [updatedConversation] = await db
      .update(facebookConversations)
      .set({ ...conversation, updatedAt: new Date() } as any)
      .where(eq(facebookConversations.id, id))
      .returning();
    return updatedConversation || undefined;
  }

  // Facebook Messages
  async getFacebookMessages(conversationId: string, limit = 50): Promise<FacebookMessage[]> {
    return await db
      .select()
      .from(facebookMessages)
      .where(eq(facebookMessages.conversationId, conversationId))
      .orderBy(desc(facebookMessages.timestamp))
      .limit(limit);
  }

  async createFacebookMessage(message: InsertFacebookMessage): Promise<FacebookMessage> {
    // Update conversation's last message info
    await db
      .update(facebookConversations)
      .set({
        lastMessageAt: new Date(message.timestamp),
        lastMessagePreview: message.content?.substring(0, 100) || '[Media]',
        messageCount: sql`${facebookConversations.messageCount} + 1`,
        isRead: message.senderType === 'page' ? true : false,
        updatedAt: new Date()
      })
      .where(eq(facebookConversations.id, message.conversationId));

    const [newMessage] = await db.insert(facebookMessages).values([message as any]).returning();
    return newMessage;
  }

  async markConversationAsRead(conversationId: string): Promise<boolean> {
    const result = await db
      .update(facebookConversations)
      .set({ 
        isRead: true,
        updatedAt: new Date()
      })
      .where(eq(facebookConversations.id, conversationId));
    return (result.rowCount ?? 0) > 0;
  }

  async getSocialAccountByPageId(pageId: string): Promise<SocialAccount | undefined> {
    const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.platform, "facebook"));
    
    // Search through pageAccessTokens jsonb field
    for (const account of accounts) {
      const pageTokens = account.pageAccessTokens as any[];
      if (pageTokens?.some((token: any) => token.pageId === pageId)) {
        return account;
      }
    }
    return undefined;
  }

  // TikTok Business Account methods
  async getTikTokBusinessAccounts(): Promise<TikTokBusinessAccount[]> {
    return await db.select().from(tiktokBusinessAccounts).orderBy(desc(tiktokBusinessAccounts.createdAt));
  }

  async getTikTokBusinessAccount(id: string): Promise<TikTokBusinessAccount | undefined> {
    const [account] = await db.select().from(tiktokBusinessAccounts).where(eq(tiktokBusinessAccounts.id, id));
    return account;
  }

  async getTikTokBusinessAccountByBusinessId(businessId: string): Promise<TikTokBusinessAccount | undefined> {
    const [account] = await db.select().from(tiktokBusinessAccounts).where(eq(tiktokBusinessAccounts.businessId, businessId));
    return account;
  }

  async createTikTokBusinessAccount(account: InsertTikTokBusinessAccount): Promise<TikTokBusinessAccount> {
    const [newAccount] = await db.insert(tiktokBusinessAccounts).values(account).returning();
    return newAccount;
  }

  async updateTikTokBusinessAccount(id: string, account: Partial<InsertTikTokBusinessAccount>): Promise<TikTokBusinessAccount | undefined> {
    const [updatedAccount] = await db.update(tiktokBusinessAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(tiktokBusinessAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteTikTokBusinessAccount(id: string): Promise<boolean> {
    const result = await db.delete(tiktokBusinessAccounts).where(eq(tiktokBusinessAccounts.id, id));
    return result.rowCount! > 0;
  }

  // Facebook Apps methods
  async getAllFacebookApps(): Promise<FacebookApp[]> {
    return await db.select().from(facebookApps).orderBy(desc(facebookApps.createdAt));
  }

  async getFacebookAppById(id: string): Promise<FacebookApp | undefined> {
    const [app] = await db.select().from(facebookApps).where(eq(facebookApps.id, id));
    return app;
  }

  async getFacebookAppByAppId(appId: string): Promise<FacebookApp | undefined> {
    const [app] = await db.select().from(facebookApps).where(eq(facebookApps.appId, appId));
    return app;
  }

  async createFacebookApp(app: InsertFacebookApp): Promise<FacebookApp> {
    const [newApp] = await db.insert(facebookApps).values(app).returning();
    return newApp;
  }

  async updateFacebookApp(id: string, app: Partial<InsertFacebookApp>): Promise<FacebookApp | undefined> {
    const [updatedApp] = await db
      .update(facebookApps)
      .set({ ...app, updatedAt: new Date() })
      .where(eq(facebookApps.id, id))
      .returning();
    return updatedApp;
  }

  async deleteFacebookApp(id: string): Promise<boolean> {
    const result = await db.delete(facebookApps).where(eq(facebookApps.id, id));
    return result.rowCount! > 0;
  }

  // TikTok Shop Order methods
  async getTikTokShopOrders(limit?: number): Promise<TikTokShopOrder[]> {
    let query = db.select().from(tiktokShopOrders).orderBy(desc(tiktokShopOrders.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  async getTikTokShopOrder(id: string): Promise<TikTokShopOrder | undefined> {
    const [order] = await db.select().from(tiktokShopOrders).where(eq(tiktokShopOrders.id, id));
    return order;
  }

  async getTikTokShopOrderByTikTokId(tiktokOrderId: string): Promise<TikTokShopOrder | undefined> {
    const [order] = await db.select().from(tiktokShopOrders).where(eq(tiktokShopOrders.tiktokOrderId, tiktokOrderId));
    return order;
  }

  async createTikTokShopOrder(order: InsertTikTokShopOrder): Promise<TikTokShopOrder> {
    const [newOrder] = await db.insert(tiktokShopOrders).values(order).returning();
    return newOrder;
  }

  async updateTikTokShopOrder(id: string, order: Partial<InsertTikTokShopOrder>): Promise<TikTokShopOrder | undefined> {
    const [updatedOrder] = await db.update(tiktokShopOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(tiktokShopOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteTikTokShopOrder(id: string): Promise<boolean> {
    const result = await db.delete(tiktokShopOrders).where(eq(tiktokShopOrders.id, id));
    return result.rowCount! > 0;
  }

  // TikTok Shop Product methods
  async getTikTokShopProducts(): Promise<TikTokShopProduct[]> {
    return await db.select().from(tiktokShopProducts).orderBy(desc(tiktokShopProducts.createdAt));
  }

  async getTikTokShopProduct(id: string): Promise<TikTokShopProduct | undefined> {
    const [product] = await db.select().from(tiktokShopProducts).where(eq(tiktokShopProducts.id, id));
    return product;
  }

  async getTikTokShopProductByTikTokId(tiktokProductId: string): Promise<TikTokShopProduct | undefined> {
    const [product] = await db.select().from(tiktokShopProducts).where(eq(tiktokShopProducts.tiktokProductId, tiktokProductId));
    return product;
  }

  async createTikTokShopProduct(product: InsertTikTokShopProduct): Promise<TikTokShopProduct> {
    const [newProduct] = await db.insert(tiktokShopProducts).values(product).returning();
    return newProduct;
  }

  async updateTikTokShopProduct(id: string, product: Partial<InsertTikTokShopProduct>): Promise<TikTokShopProduct | undefined> {
    const [updatedProduct] = await db.update(tiktokShopProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(tiktokShopProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteTikTokShopProduct(id: string): Promise<boolean> {
    const result = await db.delete(tiktokShopProducts).where(eq(tiktokShopProducts.id, id));
    return result.rowCount! > 0;
  }

  // TikTok Video methods
  async getTikTokVideos(businessAccountId?: string): Promise<TikTokVideo[]> {
    let query = db.select().from(tiktokVideos).orderBy(desc(tiktokVideos.createdAt));
    if (businessAccountId) {
      query = query.where(eq(tiktokVideos.businessAccountId, businessAccountId));
    }
    return await query;
  }

  async getTikTokVideo(id: string): Promise<TikTokVideo | undefined> {
    const [video] = await db.select().from(tiktokVideos).where(eq(tiktokVideos.id, id));
    return video;
  }

  async getTikTokVideoByVideoId(videoId: string): Promise<TikTokVideo | undefined> {
    const [video] = await db.select().from(tiktokVideos).where(eq(tiktokVideos.videoId, videoId));
    return video;
  }

  async createTikTokVideo(video: InsertTikTokVideo): Promise<TikTokVideo> {
    const [newVideo] = await db.insert(tiktokVideos).values(video).returning();
    return newVideo;
  }

  async updateTikTokVideo(id: string, video: Partial<InsertTikTokVideo>): Promise<TikTokVideo | undefined> {
    const [updatedVideo] = await db.update(tiktokVideos)
      .set({ ...video, updatedAt: new Date() })
      .where(eq(tiktokVideos.id, id))
      .returning();
    return updatedVideo;
  }

  async deleteTikTokVideo(id: string): Promise<boolean> {
    const result = await db.delete(tiktokVideos).where(eq(tiktokVideos.id, id));
    return result.rowCount! > 0;
  }

  // ===========================================
  // CONTENT MANAGEMENT METHODS
  // ===========================================

  // Content Categories
  async getContentCategories(): Promise<ContentCategory[]> {
    return await db.select().from(contentCategories)
      .where(eq(contentCategories.isActive, true))
      .orderBy(contentCategories.sortOrder, contentCategories.name);
  }

  async createContentCategory(category: InsertContentCategory): Promise<ContentCategory> {
    const [newCategory] = await db.insert(contentCategories).values(category).returning();
    return newCategory;
  }

  async updateContentCategory(id: number, category: Partial<InsertContentCategory>): Promise<ContentCategory | undefined> {
    const [updated] = await db.update(contentCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(contentCategories.id, id))
      .returning();
    return updated;
  }

  async deleteContentCategory(id: number): Promise<boolean> {
    const result = await db.delete(contentCategories).where(eq(contentCategories.id, id));
    return result.rowCount! > 0;
  }

  // Content Assets
  async getContentAssets(): Promise<ContentAsset[]> {
    return await db.select().from(contentAssets)
      .orderBy(desc(contentAssets.createdAt));
  }

  async getContentAsset(id: string): Promise<ContentAsset | undefined> {
    const [asset] = await db.select().from(contentAssets).where(eq(contentAssets.id, id));
    return asset;
  }

  async getContentAssetsByCategory(categoryId: number): Promise<ContentAsset[]> {
    return await db.select().from(contentAssets)
      .where(eq(contentAssets.categoryId, categoryId))
      .orderBy(desc(contentAssets.createdAt));
  }

  async createContentAsset(asset: InsertContentAsset): Promise<ContentAsset> {
    const [newAsset] = await db.insert(contentAssets).values(asset).returning();
    return newAsset;
  }

  async updateContentAsset(id: string, asset: Partial<InsertContentAsset>): Promise<ContentAsset | undefined> {
    const [updated] = await db.update(contentAssets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(contentAssets.id, id))
      .returning();
    return updated;
  }

  async deleteContentAsset(id: string): Promise<boolean> {
    const result = await db.delete(contentAssets).where(eq(contentAssets.id, id));
    return result.rowCount! > 0;
  }

  async incrementAssetUsage(id: string): Promise<void> {
    await db.update(contentAssets)
      .set({ 
        usageCount: sql`${contentAssets.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contentAssets.id, id));
  }

  // Scheduled Posts
  async getScheduledPosts(): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .orderBy(desc(scheduledPosts.scheduledTime));
  }

  async getScheduledPost(id: string): Promise<ScheduledPost | undefined> {
    const [post] = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id));
    return post;
  }

  async getScheduledPostsToProcess(now: Date): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .where(
        and(
          eq(scheduledPosts.status, 'scheduled'),
          lte(scheduledPosts.scheduledTime, now)
        )
      )
      .orderBy(scheduledPosts.scheduledTime);
  }

  async getUpcomingScheduledPosts(limit: number = 50): Promise<ScheduledPost[]> {
    const now = new Date();
    return await db.select().from(scheduledPosts)
      .where(
        and(
          inArray(scheduledPosts.status, ['scheduled', 'draft']),
          gte(scheduledPosts.scheduledTime, now)
        )
      )
      .orderBy(scheduledPosts.scheduledTime)
      .limit(limit);
  }

  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    const [newPost] = await db.insert(scheduledPosts).values(post).returning();
    return newPost;
  }

  async updateScheduledPost(id: string, post: Partial<InsertScheduledPost>): Promise<ScheduledPost | undefined> {
    const [updated] = await db.update(scheduledPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, id))
      .returning();
    return updated;
  }

  async updateScheduledPostStatus(id: string, status: ScheduledPost['status']): Promise<void> {
    await db.update(scheduledPosts)
      .set({ status, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, id));
  }

  async deleteScheduledPost(id: string): Promise<boolean> {
    const result = await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
    return result.rowCount! > 0;
  }

  async getScheduledPostsByAccount(socialAccountId: string): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.socialAccountId, socialAccountId))
      .orderBy(desc(scheduledPosts.scheduledTime));
  }

  // Content Library methods
  async getContentLibraryItems(filters?: { tags?: string[]; status?: string; contentType?: string; priority?: string }): Promise<ContentLibrary[]> {
    // Build conditions array to properly combine multiple WHERE clauses
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(contentLibrary.status, filters.status as any));
    }
    if (filters?.contentType) {
      conditions.push(eq(contentLibrary.contentType, filters.contentType as any));
    }
    if (filters?.priority) {
      conditions.push(eq(contentLibrary.priority, filters.priority as any));
    }
    if (filters?.tags && filters.tags.length > 0) {
      // Use JSONB "contains any" logic with @> operator for "any tag" match
      // Create OR conditions for each tag to use GIN index efficiently
      const tagConditions = filters.tags.map(tag => 
        sql`${contentLibrary.tagIds} @> ${JSON.stringify([tag])}`
      );
      conditions.push(or(...tagConditions));
    }
    
    let query = db.select().from(contentLibrary);
    
    // Apply all conditions using AND logic
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(contentLibrary.createdAt));
  }

  async getContentLibraryItem(id: string): Promise<ContentLibrary | undefined> {
    const [item] = await db.select().from(contentLibrary).where(eq(contentLibrary.id, id));
    return item;
  }

  async createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibrary> {
    const [newItem] = await db.insert(contentLibrary).values(item).returning();
    return newItem;
  }

  async updateContentLibraryItem(id: string, item: UpdateContentLibrary): Promise<ContentLibrary | undefined> {
    const [updated] = await db.update(contentLibrary)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(contentLibrary.id, id))
      .returning();
    return updated;
  }

  async deleteContentLibraryItem(id: string): Promise<boolean> {
    const result = await db.delete(contentLibrary).where(eq(contentLibrary.id, id));
    return result.rowCount! > 0;
  }

  async incrementContentUsage(id: string): Promise<void> {
    await db.update(contentLibrary)
      .set({ 
        usageCount: sql`${contentLibrary.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contentLibrary.id, id));
  }

  async addAIVariation(id: string, variation: { content: string; tone: string; style: string }): Promise<ContentLibrary | undefined> {
    const [item] = await db.select().from(contentLibrary).where(eq(contentLibrary.id, id));
    if (!item) return undefined;

    const newVariation = {
      id: Date.now().toString(), // Simple ID for variation
      content: variation.content,
      tone: variation.tone,
      style: variation.style,
      generatedAt: new Date().toISOString()
    };

    const updatedVariations = [...(item.aiVariations || []), newVariation];

    const [updated] = await db.update(contentLibrary)
      .set({ 
        aiVariations: updatedVariations,
        updatedAt: new Date()
      })
      .where(eq(contentLibrary.id, id))
      .returning();
    return updated;
  }

  async getContentLibraryByTags(tagIds: string[]): Promise<ContentLibrary[]> {
    if (tagIds.length === 0) return [];
    
    return await db.select().from(contentLibrary)
      .where(sql`${contentLibrary.tagIds} && ${JSON.stringify(tagIds)}`)
      .orderBy(desc(contentLibrary.lastUsed), desc(contentLibrary.createdAt));
  }

  async getContentLibraryByPriority(priority: string): Promise<ContentLibrary[]> {
    return await db.select().from(contentLibrary)
      .where(eq(contentLibrary.priority, priority as any))
      .orderBy(desc(contentLibrary.createdAt));
  }

  // Account Groups methods
  async getAccountGroups(): Promise<any[]> {
    return await db.select().from(accountGroups).orderBy(desc(accountGroups.createdAt));
  }

  async getGroupAccounts(groupId: string): Promise<SocialAccount[]> {
    return await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        name: socialAccounts.name,
        accountId: socialAccounts.accountId,
        accessToken: socialAccounts.accessToken,
        refreshToken: socialAccounts.refreshToken,
        tokenExpiresAt: socialAccounts.tokenExpiresAt,
        pageAccessTokens: socialAccounts.pageAccessTokens,
        webhookSubscriptions: socialAccounts.webhookSubscriptions,
        tagIds: socialAccounts.tagIds,
        contentPreferences: socialAccounts.contentPreferences,
        schedulingRules: socialAccounts.schedulingRules,
        performanceScore: socialAccounts.performanceScore,
        lastOptimization: socialAccounts.lastOptimization,
        followers: socialAccounts.followers,
        connected: socialAccounts.connected,
        lastPost: socialAccounts.lastPost,
        engagement: socialAccounts.engagement,
        lastSync: socialAccounts.lastSync,
        isActive: socialAccounts.isActive,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt
      })
      .from(socialAccounts)
      .leftJoin(groupAccounts, eq(groupAccounts.socialAccountId, socialAccounts.id))
      .where(and(eq(groupAccounts.groupId, groupId), eq(groupAccounts.isActive, true)))
      .orderBy(desc(socialAccounts.createdAt));
  }

  // Worker methods
  async getWorkers(): Promise<Worker[]> {
    return await db.select({
      id: workers.id,
      workerId: workers.workerId,
      name: workers.name,
      description: workers.description,
      platforms: workers.platforms,
      capabilities: workers.capabilities,
      specialties: workers.specialties,
      maxConcurrentJobs: workers.maxConcurrentJobs,
      minJobInterval: workers.minJobInterval,
      maxJobsPerHour: workers.maxJobsPerHour,
      avgExecutionTime: workers.avgExecutionTime,
      region: workers.region,
      environment: workers.environment,
      deploymentPlatform: workers.deploymentPlatform,
      endpointUrl: workers.endpointUrl,
      ipAddress: workers.ipAddress,
      ipCountry: workers.ipCountry,
      ipRegion: workers.ipRegion,
      status: workers.status,
      isOnline: workers.isOnline,
      lastPingAt: workers.lastPingAt,
      lastJobAt: workers.lastJobAt,
      currentLoad: workers.currentLoad,
      totalJobsCompleted: workers.totalJobsCompleted,
      totalJobsFailed: workers.totalJobsFailed,
      successRate: workers.successRate,
      avgResponseTime: workers.avgResponseTime,
      registrationSecret: workers.registrationSecret,
      authToken: workers.authToken,
      tokenExpiresAt: workers.tokenExpiresAt,
      tags: workers.tags,
      priority: workers.priority,
      isEnabled: workers.isEnabled,
      metadata: workers.metadata,
      createdAt: workers.createdAt,
      updatedAt: workers.updatedAt
    }).from(workers).orderBy(desc(workers.createdAt));
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async getWorkerByWorkerId(workerId: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.workerId, workerId));
    return worker || undefined;
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [created] = await db.insert(workers).values(worker).returning();
    return created;
  }

  async updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const [updated] = await db.update(workers)
      .set({ ...worker, updatedAt: new Date() })
      .where(eq(workers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorker(id: string): Promise<boolean> {
    const result = await db.delete(workers).where(eq(workers.id, id));
    return result.rowCount > 0;
  }

  async updateWorkerStatus(workerId: string, isOnline: boolean, lastPingAt?: Date): Promise<Worker | undefined> {
    const [updated] = await db.update(workers)
      .set({ 
        isOnline, 
        lastPingAt: lastPingAt || new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(workers.workerId, workerId))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
