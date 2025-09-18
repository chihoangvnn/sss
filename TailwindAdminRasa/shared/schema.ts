import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Industries table - Ngành hàng
export const industries = pgTable("industries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table - Sub catalog
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  industryId: varchar("industry_id").notNull().references(() => industries.id),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: varchar("category_id").references(() => categories.id),
  status: text("status", { enum: ["active", "inactive", "out-of-stock"] }).notNull().default("active"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatar: text("avatar"),
  status: text("status", { enum: ["active", "inactive", "vip"] }).notNull().default("active"),
  joinDate: timestamp("join_date").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "processing", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  items: integer("items").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
});

// Social media accounts table
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform", { enum: ["facebook", "instagram", "twitter"] }).notNull(),
  name: text("name").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  followers: integer("followers").default(0),
  connected: boolean("connected").default(false),
  lastPost: timestamp("last_post"),
  engagement: decimal("engagement", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chatbot conversations table
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull(),
  messages: jsonb("messages").notNull(),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  satisfactionRating: integer("satisfaction_rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product reviews table - separate from landing page testimonials
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  customerId: varchar("customer_id").references(() => customers.id), // Optional - can be anonymous
  customerName: text("customer_name").notNull(), // Display name
  customerAvatar: text("customer_avatar"), // Avatar URL
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"), // Review title/summary
  content: text("content").notNull(), // Review content
  isVerified: boolean("is_verified").notNull().default(false), // Verified purchase
  isApproved: boolean("is_approved").notNull().default(true), // Admin approval
  helpfulCount: integer("helpful_count").notNull().default(0), // How many found helpful
  images: jsonb("images").default('[]'), // Array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Storefront configuration table
export const storefrontConfig = pgTable("storefront_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  topProductsCount: integer("top_products_count").notNull().default(10),
  displayMode: text("display_mode", { enum: ["auto", "manual"] }).notNull().default("auto"),
  selectedProductIds: jsonb("selected_product_ids"), // Array of product IDs for manual mode
  isActive: boolean("is_active").notNull().default(true),
  theme: text("theme", { enum: ["organic", "modern", "classic"] }).notNull().default("organic"),
  primaryColor: text("primary_color").notNull().default("#4ade80"),
  contactInfo: jsonb("contact_info").notNull(), // { phone, email, businessName, address }
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Storefront orders table (separate from main orders for tracking)
export const storefrontOrders = pgTable("storefront_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storefrontConfigId: varchar("storefront_config_id").notNull().references(() => storefrontConfig.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  deliveryType: text("delivery_type", { enum: ["local_delivery", "cod_shipping"] }).notNull().default("local_delivery"),
  status: text("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table for QR payment tracking
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  method: text("method", { enum: ["qr_code", "bank_transfer", "cash"] }).notNull().default("qr_code"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  qrCode: text("qr_code"), // VietQR URL
  status: text("status", { enum: ["pending", "completed", "failed", "cancelled"] }).notNull().default("pending"),
  transactionId: text("transaction_id"),
  bankInfo: jsonb("bank_info"), // { bank, accountNumber, accountName }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shop settings table for default contact information
export const shopSettings = pgTable("shop_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  website: text("website"),
  logo: text("logo"),
  isDefault: boolean("is_default").notNull().default(true), // Allow multiple settings but mark one as default
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Landing Pages table
export const productLandingPages = pgTable("product_landing_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(), // URL slug for the landing page (unique)
  description: text("description"),
  
  // Product connection
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id"), // Optional variant reference
  
  // Pricing (can override product price)
  customPrice: decimal("custom_price", { precision: 15, scale: 2 }), // If null, use product's base price
  originalPrice: decimal("original_price", { precision: 15, scale: 2 }), // For showing discount
  
  // Page customization
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroImage: text("hero_image"),
  callToAction: text("call_to_action").default("Đặt hàng ngay"), // Button text
  
  // Features & benefits
  features: jsonb("features").notNull().default('[]'), // Array of strings
  testimonials: jsonb("testimonials").default('[]'), // Array of testimonial objects
  
  // Settings
  isActive: boolean("is_active").notNull().default(true),
  theme: text("theme", { enum: ["light", "dark"] }).notNull().default("light"),
  primaryColor: text("primary_color").notNull().default("#007bff"),
  
  // Contact info for this landing page
  contactInfo: jsonb("contact_info").notNull().default('{"phone":"","email":"","businessName":""}'), // { phone, email, address, businessName }
  
  // Tracking & Analytics
  viewCount: integer("view_count").notNull().default(0),
  orderCount: integer("order_count").notNull().default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).notNull().default('0.00'),
  
  // Payment methods
  paymentMethods: jsonb("payment_methods").notNull().default('{"cod":true,"bankTransfer":true,"online":false}'), // { cod, bankTransfer, online }
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  joinDate: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorefrontConfigSchema = createInsertSchema(storefrontConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertIndustrySchema = createInsertSchema(industries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorefrontOrderSchema = createInsertSchema(storefrontOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopSettingsSchema = createInsertSchema(shopSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductLandingPageSchema = createInsertSchema(productLandingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;

export type InsertStorefrontConfig = z.infer<typeof insertStorefrontConfigSchema>;
export type StorefrontConfig = typeof storefrontConfig.$inferSelect;

export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Industry = typeof industries.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertStorefrontOrder = z.infer<typeof insertStorefrontOrderSchema>;
export type StorefrontOrder = typeof storefrontOrders.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertShopSettings = z.infer<typeof insertShopSettingsSchema>;
export type ShopSettings = typeof shopSettings.$inferSelect;

export type InsertProductLandingPage = z.infer<typeof insertProductLandingPageSchema>;
export type ProductLandingPage = typeof productLandingPages.$inferSelect;

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
