import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Cloudinary Media Types
export interface CloudinaryBase {
  public_id: string;
  asset_id?: string;
  secure_url: string;
  resource_type: 'image' | 'video';
  format: string;
  bytes?: number;
  width?: number;
  height?: number;
  folder?: string;
  version?: number;
  created_at?: string;
  tags?: string[];
  alt?: string;
}

export interface CloudinaryImage extends CloudinaryBase {
  resource_type: 'image';
  width: number;
  height: number;
}

export interface CloudinaryVideo extends CloudinaryBase {
  resource_type: 'video';
  duration: number;
  thumbnail_url?: string;
}

export type CloudinaryMedia = CloudinaryImage | CloudinaryVideo;

// Facebook Management Types
export interface FacebookPageToken {
  pageId: string;
  pageName: string;
  accessToken: string;
  permissions: string[];
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface WebhookSubscription {
  objectType: 'page' | 'user';
  objectId: string;
  subscriptionId?: string;
  fields: string[]; // fields subscribed to
  webhookUrl: string;
  verifyToken: string;
  status: 'active' | 'inactive' | 'pending';
  lastEvent?: string;
}

export interface FacebookAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'template' | 'fallback';
  url: string;
  filename?: string;
  filesize?: number;
  preview_url?: string;
  media_url?: string;
  template_type?: string; // For template messages
  payload?: Record<string, any>; // Additional attachment data
}

// Zod schemas for runtime validation
export const CloudinaryBaseZ = z.object({
  public_id: z.string(),
  asset_id: z.string().optional(),
  secure_url: z.string().url(),
  resource_type: z.enum(['image', 'video']),
  format: z.string(),
  bytes: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  folder: z.string().optional(),
  version: z.number().int().optional(),
  created_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
  alt: z.string().optional(),
});

export const CloudinaryImageZ = CloudinaryBaseZ.extend({
  resource_type: z.literal('image'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const CloudinaryVideoZ = CloudinaryBaseZ.extend({
  resource_type: z.literal('video'),
  duration: z.number().positive(),
  thumbnail_url: z.string().url().optional(),
});

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
  sku: text("sku").unique(), // Auto-generated: 2 chữ đầu ngành hàng + 4 số random
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: varchar("category_id").references(() => categories.id),
  status: text("status", { enum: ["active", "inactive", "out-of-stock"] }).notNull().default("active"),
  image: text("image"), // Deprecated - kept for backward compatibility
  images: jsonb("images").$type<CloudinaryImage[]>().default(sql`'[]'::jsonb`), // Array of Cloudinary image URLs with metadata
  videos: jsonb("videos").$type<CloudinaryVideo[]>().default(sql`'[]'::jsonb`), // Array of Cloudinary video URLs with metadata
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

// Enhanced Social media accounts table with Facebook page support
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform", { enum: ["facebook", "instagram", "twitter"] }).notNull(),
  name: text("name").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"), // For token refresh
  tokenExpiresAt: timestamp("token_expires_at"), // Track token expiration
  
  // Facebook Page Support
  pageAccessTokens: jsonb("page_access_tokens").$type<FacebookPageToken[]>().default(sql`'[]'::jsonb`), // Array of page tokens
  webhookSubscriptions: jsonb("webhook_subscriptions").$type<WebhookSubscription[]>().default(sql`'[]'::jsonb`), // Active webhooks
  
  // Organization
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`), // Tag IDs for organization
  
  // Analytics
  followers: integer("followers").default(0),
  connected: boolean("connected").default(false),
  lastPost: timestamp("last_post"),
  engagement: decimal("engagement", { precision: 5, scale: 2 }).default("0"),
  lastSync: timestamp("last_sync"), // Last time we synced with platform
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page Tags Management
export const pageTags = pgTable("page_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"), // Default blue
  description: text("description"),
  isDefault: boolean("is_default").default(false), // System default tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook Conversations for chat management
export const facebookConversations = pgTable("facebook_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: text("page_id").notNull(), // Facebook page ID
  pageName: text("page_name").notNull(), // Page display name
  participantId: text("participant_id").notNull(), // Facebook user ID
  participantName: text("participant_name").notNull(), // User display name
  participantAvatar: text("participant_avatar"), // User profile picture
  
  // Conversation management
  status: text("status", { enum: ["active", "resolved", "pending", "archived"] }).notNull().default("active"),
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
  assignedTo: varchar("assigned_to"), // Admin user handling this conversation
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`), // Conversation tags
  
  // Analytics
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"), // Preview of last message
  isRead: boolean("is_read").default(false), // Admin read status
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook Messages storage
export const facebookMessages = pgTable("facebook_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => facebookConversations.id, { onDelete: 'cascade' }),
  facebookMessageId: text("facebook_message_id").notNull().unique(), // Facebook's message ID
  
  // Message content
  senderId: text("sender_id").notNull(), // Facebook user/page ID
  senderName: text("sender_name").notNull(), // Display name
  senderType: text("sender_type", { enum: ["page", "user"] }).notNull(),
  
  // Message data
  content: text("content"), // Text content
  messageType: text("message_type", { enum: ["text", "image", "video", "audio", "file", "sticker", "emoji"] }).notNull().default("text"),
  attachments: jsonb("attachments").$type<FacebookAttachment[]>().default(sql`'[]'::jsonb`), // Media/files
  
  // Metadata
  timestamp: timestamp("timestamp").notNull(), // When message was sent on Facebook
  isEcho: boolean("is_echo").default(false), // Message sent by page (echo)
  replyToMessageId: text("reply_to_message_id"), // If replying to another message
  
  // Status
  isRead: boolean("is_read").default(false),
  isDelivered: boolean("is_delivered").default(true),
  
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
  
  // Advanced Theme Configuration (Optional - fallback to basic primaryColor if null)
  themeConfigId: varchar("theme_config_id").references(() => themeConfigurations.id, { onDelete: 'set null' }),
  
  // Advanced Theme Config JSON (Direct storage for theme builder integration)
  advancedThemeConfig: jsonb("advanced_theme_config"), // Full theme configuration object
  
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

// Advanced Theme Configurations table
export const themeConfigurations = pgTable("theme_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Theme name (e.g., "Shopee Orange", "Luxury Purple")
  description: text("description"),
  
  // Color Palette
  colorPalette: jsonb("color_palette").notNull().default('{}'), 
  // {
  //   primary: "#FF6B35",
  //   secondary: "#F7931E", 
  //   accent: "#FF8C42",
  //   success: "#28A745",
  //   warning: "#FFC107",
  //   danger: "#DC3545",
  //   background: "#FFFFFF",
  //   surface: "#F8F9FA",
  //   text: "#212529",
  //   textMuted: "#6C757D"
  // }
  
  // Typography Settings
  typography: jsonb("typography").notNull().default('{}'),
  // {
  //   fontFamily: "Nunito Sans",
  //   headingWeight: "700",
  //   bodyWeight: "400",
  //   fontSize: { base: "16px", mobile: "14px" }
  // }
  
  // Spacing & Layout
  spacing: jsonb("spacing").notNull().default('{}'),
  // {
  //   containerPadding: "1rem",
  //   sectionSpacing: "3rem",
  //   cardRadius: "8px",
  //   buttonRadius: "6px"
  // }
  
  // Component Styles
  componentStyles: jsonb("component_styles").notNull().default('{}'),
  // {
  //   buttons: { style: "solid", shadow: true },
  //   cards: { shadow: "medium", border: false },
  //   reviews: { style: "shopee", avatarBorder: true }
  // }
  
  // Brand Guidelines
  brandGuidelines: jsonb("brand_guidelines").notNull().default('{}'),
  // {
  //   logo: "url",
  //   brandColors: ["#FF6B35", "#F7931E"],
  //   industry: "ecommerce",
  //   personality: ["trustworthy", "energetic", "modern"]
  // }
  
  // Accessibility Settings
  accessibility: jsonb("accessibility").notNull().default('{}'),
  // {
  //   contrastRatio: 4.5,
  //   focusVisible: true,
  //   reducedMotion: false,
  //   fontSize: { min: "14px", max: "24px" }
  // }
  
  // Psychology & Conversion
  psychology: jsonb("psychology").notNull().default('{}'),
  // {
  //   urgencyColor: "#DC3545", 
  //   trustColor: "#28A745",
  //   ctaColor: "#FF6B35",
  //   conversionFocus: "high" | "medium" | "low"
  // }
  
  // Template Settings
  isTemplate: boolean("is_template").notNull().default(false), // Built-in templates vs custom
  industry: text("industry"), // "ecommerce", "fashion", "tech", "food", etc.
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).$type<number>(), // Avg conversion for this theme (0-100%)
  
  // Meta
  createdBy: varchar("created_by").references(() => users.id, { onDelete: 'set null' }), // User ID who created this theme
  isPublic: boolean("is_public").notNull().default(false), // Can other users use this theme?
  usageCount: integer("usage_count").notNull().default(0), // How many landing pages use this
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products, {
  images: z.array(CloudinaryImageZ).default([]),
  videos: z.array(CloudinaryVideoZ).default([]),
}).omit({
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
  updatedAt: true,
});

export const insertPageTagSchema = createInsertSchema(pageTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookConversationSchema = createInsertSchema(facebookConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookMessageSchema = createInsertSchema(facebookMessages).omit({
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

export type InsertPageTag = z.infer<typeof insertPageTagSchema>;
export type PageTag = typeof pageTags.$inferSelect;

export type InsertFacebookConversation = z.infer<typeof insertFacebookConversationSchema>;
export type FacebookConversation = typeof facebookConversations.$inferSelect;

export type InsertFacebookMessage = z.infer<typeof insertFacebookMessageSchema>;
export type FacebookMessage = typeof facebookMessages.$inferSelect;

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
