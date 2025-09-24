import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, unique, serial, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// VietQR Bank Info Type (shared between client/server)
export interface BankInfo {
  bank: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

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

// Industry Keywords table - For AI industry detection
export const industryKeywords = pgTable("industry_keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  industryId: varchar("industry_id").notNull().references(() => industries.id),
  keyword: text("keyword").notNull(),
  weight: decimal("weight", { precision: 5, scale: 3 }).notNull().default("1.000"), // 0.001 to 99.999
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Industry Templates table - Response templates for each industry
export const industryTemplates = pgTable("industry_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  industryId: varchar("industry_id").notNull().references(() => industries.id),
  intent: text("intent").notNull(), // "product_search", "product_recommendation", "price_inquiry", etc.
  template: text("template").notNull(), // "🏠 **SẢN PHẨM GIA DỤNG** cho ngôi nhà của bạn..."
  language: text("language").notNull().default("vi"), // "vi", "en"
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // Higher priority = used first
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Industry Rules table - AI detection rules and configuration
export const industryRules = pgTable("industry_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  industryId: varchar("industry_id").notNull().references(() => industries.id),
  rules: jsonb("rules_json").$type<{
    minKeywordMatches?: number; // Minimum keyword matches required
    confidenceThreshold?: number; // 0.0 to 1.0
    excludeKeywords?: string[]; // Keywords that exclude this industry
    requiredKeywords?: string[]; // Keywords that must be present
    contextRules?: {
      [key: string]: any;
    };
  }>().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RASA Description Variations Type
export interface RasaDescriptions {
  primary: string; // Main description for listings
  rasa_variations: {
    [key: string]: string; // "0": "safety focused", "1": "convenience focused", etc.
  };
  contexts: {
    [key: string]: string; // "safety": "0", "convenience": "1", etc.
  };
  analytics?: {
    [key: string]: {
      views: number;
      conversions: number;
      last_used: string;
    };
  };
}

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"), // Primary description for general use
  sku: text("sku").unique(), // Auto-generated: 2 chữ đầu ngành hàng + 4 số random
  itemCode: text("item_code"), // QR/Barcode scanner input for inventory management
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: varchar("category_id").references(() => categories.id),
  status: text("status", { enum: ["active", "inactive", "out-of-stock"] }).notNull().default("active"),
  image: text("image"), // Deprecated - kept for backward compatibility
  images: jsonb("images").$type<CloudinaryImage[]>().default(sql`'[]'::jsonb`), // Array of Cloudinary image URLs with metadata
  videos: jsonb("videos").$type<CloudinaryVideo[]>().default(sql`'[]'::jsonb`), // Array of Cloudinary video URLs with metadata
  
  // 🤖 RASA Description Management
  descriptions: jsonb("descriptions").$type<RasaDescriptions>().default(sql`'{}'::jsonb`), // Multiple context-aware descriptions for RASA
  defaultImageIndex: integer("default_image_index").default(0), // Index of default image for RASA/Facebook
  
  // Organization  
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // 🎯 SEO & Product Page Enhancement
  shortDescription: text("short_description"), // 1-2 câu highlight chính
  slug: text("slug").unique(), // SEO-friendly URL: nhang-sach-thao-moc-an-lanh
  productStory: jsonb("product_story").$type<{
    origin?: string;
    process?: string;
    tradition?: string;
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`), // Câu chuyện sản phẩm
  
  ingredients: jsonb("ingredients").$type<string[]>().default(sql`'[]'::jsonb`), // Thành phần: ["Bột quế", "Keo bời lời", "Tăm tre"]
  benefits: jsonb("benefits").$type<string[]>().default(sql`'[]'::jsonb`), // Lợi ích: ["Thanh lọc không khí", "Hương thơm dịu nhẹ"]
  usageInstructions: text("usage_instructions"), // Hướng dẫn sử dụng chi tiết
  specifications: jsonb("specifications").$type<{
    burnTime?: string;
    length?: string;
    quantity?: number;
    weight?: string;
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`), // Thông số kỹ thuật
  
  // SEO & Social Media
  seoTitle: text("seo_title"), // "Mua Nhang Sạch Thảo Mộc An Lành | Nhangsach.net"
  seoDescription: text("seo_description"), // Meta description cho Google
  ogImageUrl: text("og_image_url"), // Open Graph image cho social sharing
  
  // 🏷️ Unit & Measurement Support for POS
  unitType: text("unit_type", { 
    enum: ["weight", "count", "volume"] 
  }).notNull().default("count"), // Product measurement type
  unit: text("unit", { 
    enum: ["kg", "gram", "lít", "ml", "cái", "hộp", "gói", "thùng"] 
  }).notNull().default("cái"), // Specific unit of measurement
  allowDecimals: boolean("allow_decimals").notNull().default(false), // Enable decimal quantities in POS
  minQuantity: decimal("min_quantity", { precision: 10, scale: 3 }).default("0.001"), // Minimum quantity for weight-based products
  quantityStep: decimal("quantity_step", { precision: 10, scale: 3 }).default("1.000"), // Step increment (0.001 for weight, 1 for count)
  
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

// Enhanced Orders table with unified source tracking
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "processing", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  items: integer("items").notNull(),
  
  // 🚀 Unified Order Source Tracking
  source: text("source", { 
    enum: ["admin", "storefront", "tiktok-shop", "landing-page", "pos"] 
  }).notNull().default("admin"),
  sourceOrderId: text("source_order_id"), // Original order ID in source system
  sourceReference: text("source_reference"), // Additional reference (storefront name, TikTok shop ID, etc.)
  
  // 🔄 Sync Metadata  
  syncStatus: text("sync_status", { 
    enum: ["synced", "pending", "failed", "manual"] 
  }).notNull().default("manual"),
  syncData: jsonb("sync_data").$type<{
    lastSyncAt?: string;
    syncErrors?: string[];
    sourceData?: any; // Raw source order data for reference
  }>(),
  
  // 📞 Source Customer Info (if different from our customer record)
  sourceCustomerInfo: jsonb("source_customer_info").$type<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    originalCustomerId?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // 🔒 CRITICAL: Unique constraint to prevent duplicate syncs
  uniqueSourceOrder: unique().on(table.source, table.sourceOrderId),
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(), // Support decimal quantities with 3 decimal places
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
});

// Enhanced Social media accounts table with multi-platform support
// Interface for fanpage content preferences
export interface FanpageContentPreferences {
  preferredTags: string[];        // Tags this fanpage should prioritize
  excludedTags: string[];         // Tags this fanpage should never use
  topicCategories: string[];      // Main categories: Beauty, Fashion, Food, etc.
  mediaRatio: {
    image: number;                // 0-100 percentage preference for images
    video: number;                // 0-100 percentage preference for videos
    textOnly: number;             // 0-100 percentage preference for text-only
  };
  postingTimes: string[];         // Preferred posting hours ["09:00", "14:00", "21:00"]
  contentLength: 'short' | 'medium' | 'long'; // Preferred content length
  brandVoice: string;             // Friendly, Professional, Casual, etc.
  hashtagCount: number;           // Max number of hashtags per post
}

// Interface for smart scheduling rules
export interface SmartSchedulingRules {
  enabled: boolean;
  distributionMode: 'even' | 'weighted' | 'performance'; // How to distribute content
  conflictResolution: 'skip' | 'ask' | 'force'; // Handle content-fanpage mismatches
  timeSpacing: number;            // Minimum minutes between posts on same fanpage
  maxPostsPerDay: number;         // Maximum posts per day per fanpage
  respectPeakHours: boolean;      // Prioritize peak engagement hours
}

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform", { enum: ["facebook", "instagram", "twitter", "tiktok-business", "tiktok-shop"] }).notNull(),
  name: text("name").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"), // For token refresh
  tokenExpiresAt: timestamp("token_expires_at"), // Track token expiration
  
  // Facebook Page Support
  pageAccessTokens: jsonb("page_access_tokens").$type<FacebookPageToken[]>().default(sql`'[]'::jsonb`), // Array of page tokens
  webhookSubscriptions: jsonb("webhook_subscriptions").$type<WebhookSubscription[]>().default(sql`'[]'::jsonb`), // Active webhooks
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // 🎯 HYBRID SMART SCHEDULER - Fanpage Preferences
  contentPreferences: jsonb("content_preferences").$type<FanpageContentPreferences>().default(sql`'{
    "preferredTags": [],
    "excludedTags": [],
    "topicCategories": [],
    "mediaRatio": {"image": 70, "video": 25, "textOnly": 5},
    "postingTimes": ["09:00", "14:00", "21:00"],
    "contentLength": "medium",
    "brandVoice": "friendly",
    "hashtagCount": 5
  }'::jsonb`),
  
  // Smart scheduling configuration
  schedulingRules: jsonb("scheduling_rules").$type<SmartSchedulingRules>().default(sql`'{
    "enabled": true,
    "distributionMode": "weighted",
    "conflictResolution": "ask",
    "timeSpacing": 60,
    "maxPostsPerDay": 8,
    "respectPeakHours": true
  }'::jsonb`),
  
  // Performance tracking for smart algorithm
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }).default("0"), // 0-100 effectiveness score
  lastOptimization: timestamp("last_optimization"), // Last time AI optimized settings
  
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

// Facebook Apps Configuration Management
export const facebookApps = pgTable("facebook_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull(), // User-friendly app name
  appId: text("app_id").notNull().unique(), // Facebook App ID
  appSecret: text("app_secret").notNull(), // Encrypted Facebook App Secret
  
  // Webhook Configuration
  webhookUrl: text("webhook_url"), // Auto-generated webhook URL
  verifyToken: text("verify_token"), // User-defined verify token
  subscriptionFields: jsonb("subscription_fields").$type<string[]>().default(sql`'["messages", "messaging_postbacks", "feed"]'::jsonb`),
  
  // Status & Settings
  isActive: boolean("is_active").default(true),
  environment: text("environment", { enum: ["development", "staging", "production"] }).default("development"),
  description: text("description"), // Optional app description
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  groupId: varchar("group_id").references(() => accountGroups.id), // References account_groups.id
  
  // Tracking
  lastWebhookEvent: timestamp("last_webhook_event"), // Last received webhook
  totalEvents: integer("total_events").default(0), // Total webhook events received
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook App Webhook Events Log (for monitoring)
export const facebookWebhookEvents = pgTable("facebook_webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appId: varchar("app_id").notNull().references(() => facebookApps.id),
  eventType: text("event_type").notNull(), // "message", "feed", "postback", etc.
  eventData: jsonb("event_data").notNull(), // Raw webhook event data
  processedAt: timestamp("processed_at").defaultNow(),
  status: text("status", { enum: ["success", "failed", "pending"] }).default("pending"),
  errorMessage: text("error_message"), // If processing failed
});

// Types for Facebook Apps
export type FacebookApp = typeof facebookApps.$inferSelect;
export type InsertFacebookApp = typeof facebookApps.$inferInsert;

// Types for Facebook Webhook Events
export type FacebookWebhookEvent = typeof facebookWebhookEvents.$inferSelect;
export type InsertFacebookWebhookEvent = typeof facebookWebhookEvents.$inferInsert;

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

// TikTok Business Accounts Management
export const tiktokBusinessAccounts = pgTable("tiktok_business_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: text("business_id").notNull().unique(), // TikTok Business ID
  displayName: text("display_name").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  
  // Authentication
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scope: jsonb("scope").$type<string[]>().default(sql`'[]'::jsonb`), // Granted permissions
  
  // Business Info
  businessType: text("business_type"), // Individual, Business, etc
  industry: text("industry"),
  website: text("website"),
  description: text("description"),
  
  // Shop Integration
  shopEnabled: boolean("shop_enabled").default(false),
  shopId: text("shop_id"), // TikTok Shop ID if enabled
  shopStatus: text("shop_status", { enum: ["not_connected", "pending", "active", "suspended"] }).default("not_connected"),
  
  // Analytics Cache
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  videoCount: integer("video_count").default(0),
  likeCount: integer("like_count").default(0),
  
  // Performance Metrics
  engagement: decimal("engagement", { precision: 5, scale: 2 }).default("0"),
  avgViews: integer("avg_views").default(0),
  lastPost: timestamp("last_post"),
  lastSync: timestamp("last_sync"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // Status
  isActive: boolean("is_active").default(true),
  connected: boolean("connected").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TikTok Shop Orders Management  
export const tiktokShopOrders = pgTable("tiktok_shop_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tiktokOrderId: text("tiktok_order_id").notNull().unique(), // TikTok's order ID
  shopId: text("shop_id").notNull(), // TikTok Shop ID
  businessAccountId: varchar("business_account_id").references(() => tiktokBusinessAccounts.id),
  
  // Order Information
  orderNumber: text("order_number").notNull(), // Human readable order number
  status: text("status", { 
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"] 
  }).notNull().default("pending"),
  
  // Customer Information
  customerInfo: jsonb("customer_info").$type<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }>().notNull(),
  
  // Financial Details
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("VND"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 15, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0"),
  
  // Order Items
  items: jsonb("items").$type<Array<{
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }>>().notNull(),
  
  // Fulfillment
  fulfillmentStatus: text("fulfillment_status", {
    enum: ["pending", "processing", "shipped", "delivered", "failed"]
  }).default("pending"),
  trackingNumber: text("tracking_number"),
  shippingCarrier: text("shipping_carrier"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // TikTok Specific
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status"),
  tiktokFees: decimal("tiktok_fees", { precision: 15, scale: 2 }).default("0"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  notes: text("notes"),
  
  // Timestamps
  orderDate: timestamp("order_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TikTok Shop Products Sync
export const tiktokShopProducts = pgTable("tiktok_shop_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id), // Link to main products table
  tiktokProductId: text("tiktok_product_id").notNull(), // TikTok's product ID
  shopId: text("shop_id").notNull(),
  businessAccountId: varchar("business_account_id").references(() => tiktokBusinessAccounts.id),
  
  // Sync Configuration
  syncEnabled: boolean("sync_enabled").default(true),
  autoSync: boolean("auto_sync").default(false), // Auto sync inventory/price changes
  syncDirection: text("sync_direction", { 
    enum: ["to_tiktok", "from_tiktok", "bidirectional"] 
  }).default("to_tiktok"),
  
  // TikTok Specific Data
  tiktokSku: text("tiktok_sku"),
  tiktokTitle: text("tiktok_title"),
  tiktokDescription: text("tiktok_description"),
  tiktokPrice: decimal("tiktok_price", { precision: 15, scale: 2 }),
  tiktokStock: integer("tiktok_stock"),
  tiktokStatus: text("tiktok_status", {
    enum: ["active", "inactive", "pending_review", "rejected"]
  }).default("pending_review"),
  
  // Performance Metrics
  views: integer("views").default(0),
  orders: integer("orders").default(0),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Sync Status
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status", {
    enum: ["pending", "syncing", "success", "failed"]
  }).default("pending"),
  syncError: text("sync_error"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// SHOPEE MARKETPLACE INTEGRATION SCHEMA
// ============================================

// Shopee Business Accounts Management
export const shopeeBusinessAccounts = pgTable("shopee_business_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: text("partner_id").notNull(), // Shopee Partner ID
  shopId: text("shop_id").notNull().unique(), // Shopee Shop ID
  displayName: text("display_name").notNull(),
  shopName: text("shop_name").notNull(),
  shopLogo: text("shop_logo"),
  
  // Authentication
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  partnerKey: text("partner_key"), // Encrypted partner key
  
  // Shop Information
  shopType: text("shop_type"), // "normal", "mall", "official"
  shopStatus: text("shop_status", { 
    enum: ["normal", "frozen", "banned", "inactive"] 
  }).default("normal"),
  region: text("region").notNull().default("VN"), // VN, TH, MY, SG, PH, etc.
  currency: text("currency").notNull().default("VND"),
  
  // Business Details
  businessType: text("business_type"), // Individual, Company
  businessLicense: text("business_license"),
  taxId: text("tax_id"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  
  // Performance Metrics  
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0.00"),
  responseTime: integer("response_time").default(0), // minutes
  followerCount: integer("follower_count").default(0),
  productCount: integer("product_count").default(0),
  
  // Analytics Cache
  totalOrders: integer("total_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  avgOrderValue: decimal("avg_order_value", { precision: 15, scale: 2 }).default("0"),
  lastOrderAt: timestamp("last_order_at"),
  lastSync: timestamp("last_sync"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // Status
  isActive: boolean("is_active").default(true),
  connected: boolean("connected").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopee Shop Orders Management
export const shopeeShopOrders = pgTable("shopee_shop_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopeeOrderId: text("shopee_order_id").notNull().unique(), // Shopee's order SN
  orderSn: text("order_sn").notNull(), // Shopee order serial number
  shopId: text("shop_id").notNull(), // Reference to shop
  businessAccountId: varchar("business_account_id").references(() => shopeeBusinessAccounts.id),
  
  // Order Information
  orderNumber: text("order_number").notNull(), // Human readable order number
  orderStatus: text("order_status", { 
    enum: ["unpaid", "to_ship", "shipped", "to_confirm_receive", "in_cancel", "cancelled", "to_return", "completed"] 
  }).notNull().default("unpaid"),
  
  // Customer Information
  customerInfo: jsonb("customer_info").$type<{
    buyerUserId: string;
    buyerUsername: string;
    recipientAddress: {
      name: string;
      phone: string;
      fullAddress: string;
      district: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }>().notNull(),
  
  // Financial Details
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("VND"),
  actualShippingFee: decimal("actual_shipping_fee", { precision: 15, scale: 2 }).default("0"),
  goodsToReceive: decimal("goods_to_receive", { precision: 15, scale: 2 }).default("0"),
  coinOffset: decimal("coin_offset", { precision: 15, scale: 2 }).default("0"),
  escrowAmount: decimal("escrow_amount", { precision: 15, scale: 2 }).default("0"),
  
  // Order Items
  items: jsonb("items").$type<Array<{
    itemId: string;
    itemName: string;
    itemSku: string;
    modelId?: string;
    modelName?: string;
    modelSku?: string;
    modelQuantityPurchased: number;
    modelOriginalPrice: number;
    modelDiscountedPrice: number;
    wholesalePrice?: number;
    weight?: number;
    itemImageUrl?: string;
  }>>().notNull(),
  
  // Fulfillment & Shipping
  shippingCarrier: text("shipping_carrier"),
  trackingNumber: text("tracking_number"),
  shipTime: timestamp("ship_time"),
  deliveryTime: timestamp("delivery_time"),
  actualShippingFeeConfirmed: boolean("actual_shipping_fee_confirmed").default(false),
  
  // Shopee Specific
  paymentMethod: text("payment_method"),
  creditCardNumber: text("credit_card_number"), // Masked
  dropshipper: text("dropshipper"),
  dropshipperPhone: text("dropshipper_phone"),
  splitUp: boolean("split_up").default(false),
  buyerCancelReason: text("buyer_cancel_reason"),
  cancelBy: text("cancel_by"),
  cancelReason: text("cancel_reason"),
  actualShippingProvider: text("actual_shipping_provider"),
  packageNumber: text("package_number"),
  
  // Shopee Fees & Commissions
  shopeeFee: decimal("shopee_fee", { precision: 15, scale: 2 }).default("0"),
  transactionFee: decimal("transaction_fee", { precision: 15, scale: 2 }).default("0"),
  commissionFee: decimal("commission_fee", { precision: 15, scale: 2 }).default("0"),
  serviceFee: decimal("service_fee", { precision: 15, scale: 2 }).default("0"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  notes: text("notes"),
  
  // Timestamps  
  createTime: timestamp("create_time").notNull(), // Shopee order creation time
  updateTime: timestamp("update_time"), // Last update from Shopee
  payTime: timestamp("pay_time"), // Payment time
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopee Shop Products Sync
export const shopeeShopProducts = pgTable("shopee_shop_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id), // Link to main products table
  shopeeItemId: text("shopee_item_id").notNull(), // Shopee's item ID
  shopId: text("shop_id").notNull(),
  businessAccountId: varchar("business_account_id").references(() => shopeeBusinessAccounts.id),
  
  // Sync Configuration
  syncEnabled: boolean("sync_enabled").default(true),
  autoSync: boolean("auto_sync").default(false), // Auto sync inventory/price changes
  syncDirection: text("sync_direction", { 
    enum: ["to_shopee", "from_shopee", "bidirectional"] 
  }).default("to_shopee"),
  
  // Shopee Specific Data
  itemName: text("item_name"),
  itemSku: text("item_sku"),
  description: text("description"),
  originalPrice: decimal("original_price", { precision: 15, scale: 2 }),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }),
  stock: integer("stock"),
  itemStatus: text("item_status", {
    enum: ["normal", "deleted", "banned", "reviewing"]
  }).default("normal"),
  
  // Categories
  categoryId: integer("category_id"),
  categoryName: text("category_name"),
  
  // Product Details
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimension: jsonb("dimension").$type<{
    packageLength: number;
    packageWidth: number;
    packageHeight: number;
  }>(),
  condition: text("condition", { enum: ["new", "used"] }).default("new"),
  wholesaleEnabled: boolean("wholesale_enabled").default(false),
  
  // Performance Metrics
  sales: integer("sales").default(0),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  
  // Logistics
  logisticEnabled: boolean("logistic_enabled").default(true),
  daysToShip: integer("days_to_ship").default(3),
  
  // Sync Status
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status", {
    enum: ["pending", "syncing", "success", "failed"]
  }).default("pending"),
  syncError: text("sync_error"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueShopeeItem: unique().on(table.shopeeItemId, table.shopId),
}));

// TikTok Video Content Management
export const tiktokVideos = pgTable("tiktok_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: text("video_id").notNull().unique(), // TikTok's video ID
  businessAccountId: varchar("business_account_id").notNull().references(() => tiktokBusinessAccounts.id),
  
  // Content Information
  caption: text("caption"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // Duration in seconds
  
  // Performance Metrics
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  
  // E-commerce Integration
  shopProductsTagged: jsonb("shop_products_tagged").$type<string[]>().default(sql`'[]'::jsonb`), // Product IDs tagged
  salesFromVideo: decimal("sales_from_video", { precision: 15, scale: 2 }).default("0"),
  clickthroughRate: decimal("clickthrough_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Content Status
  status: text("status", {
    enum: ["draft", "pending_review", "published", "private", "removed"]
  }).default("published"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // Timestamps
  publishedAt: timestamp("published_at"),
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
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
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

// Bot settings table for RASA configuration
export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rasaUrl: text("rasa_url").notNull().default("http://localhost:5005"),
  webhookUrl: text("webhook_url"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  autoReply: boolean("auto_reply").notNull().default(false),
  apiKey: text("api_key"), // Optional API key for RASA auth
  connectionTimeout: integer("connection_timeout").notNull().default(5000), // in milliseconds
  maxRetries: integer("max_retries").notNull().default(3),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status", { enum: ["online", "offline", "error"] }).notNull().default("offline"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 🤖 RASA Analytics Tables for Management Dashboard

// Enhanced conversation sessions for RASA analytics
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => customers.id), // Can be null for anonymous users
  sessionId: text("session_id").notNull().unique(), // RASA session identifier
  channel: text("channel", { enum: ["web", "facebook", "instagram", "whatsapp", "api"] }).notNull().default("web"),
  userAgent: text("user_agent"), // Browser/device info
  ipAddress: text("ip_address"), // For analytics (anonymized)
  
  // Session metrics
  messageCount: integer("message_count").notNull().default(0),
  totalResponseTime: integer("total_response_time").notNull().default(0), // Total ms for all responses
  avgResponseTime: decimal("avg_response_time", { precision: 8, scale: 2 }), // Average response time
  
  // Session status
  status: text("status", { enum: ["active", "completed", "abandoned", "escalated"] }).notNull().default("active"),
  resolutionStatus: text("resolution_status", { enum: ["resolved", "unresolved", "pending"] }),
  escalatedToHuman: boolean("escalated_to_human").notNull().default(false),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("conversation_sessions_session_id_idx").on(table.sessionId),
  channelIdx: index("conversation_sessions_channel_idx").on(table.channel),
  statusIdx: index("conversation_sessions_status_idx").on(table.status),
}));

// Individual messages for detailed analytics
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => conversationSessions.id, { onDelete: 'cascade' }),
  
  // Message content
  message: text("message").notNull(), // User input or bot response
  isBot: boolean("is_bot").notNull().default(false), // true for bot responses
  messageType: text("message_type", { enum: ["text", "quick_reply", "button", "image", "product", "order"] }).notNull().default("text"),
  
  // RASA-specific data
  intent: text("intent"), // Detected intent (null for bot messages)
  entities: jsonb("entities").default(sql`'[]'::jsonb`), // Extracted entities
  confidence: decimal("confidence", { precision: 4, scale: 3 }), // Intent confidence score
  responseTime: integer("response_time"), // Response time in ms
  
  // Context and metadata
  context: jsonb("context").default(sql`'{}'::jsonb`), // Session context at time of message
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional metadata
  
  // Tracking
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("conversation_messages_session_id_idx").on(table.sessionId),
  intentIdx: index("conversation_messages_intent_idx").on(table.intent),
  timestampIdx: index("conversation_messages_timestamp_idx").on(table.timestamp),
  sessionTimestampIdx: index("conversation_messages_session_timestamp_idx").on(table.sessionId, table.timestamp),
}));

// Intent analytics for tracking popular intents and success rates
export const intentAnalytics = pgTable("intent_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Intent details
  intentName: text("intent_name").notNull().unique(), // "greet", "product_search", "order_status", etc.
  displayName: text("display_name"), // Human-friendly name
  category: text("category", { enum: ["greeting", "product", "order", "support", "general"] }).notNull().default("general"),
  
  // Analytics metrics
  totalCount: integer("total_count").notNull().default(0), // Total times triggered
  successCount: integer("success_count").notNull().default(0), // Successful resolutions
  failureCount: integer("failure_count").notNull().default(0), // Failed responses
  
  // Performance metrics
  avgConfidence: decimal("avg_confidence", { precision: 4, scale: 3 }), // Average confidence score
  avgResponseTime: decimal("avg_response_time", { precision: 8, scale: 2 }), // Average response time
  totalResponseTime: integer("total_response_time").notNull().default(0), // Total response time
  
  // Success rate calculation
  successRate: decimal("success_rate", { precision: 5, scale: 2 }), // Calculated success percentage
  
  // Usage patterns
  peakHour: integer("peak_hour"), // Hour of day with most usage (0-23)
  peakDay: integer("peak_day"), // Day of week with most usage (0-6)
  
  // Timestamps
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  intentNameIdx: index("intent_analytics_intent_name_idx").on(table.intentName),
  categoryIdx: index("intent_analytics_category_idx").on(table.category),
  successRateIdx: index("intent_analytics_success_rate_idx").on(table.successRate),
}));

// User satisfaction scores and feedback
export const userSatisfactionScores = pgTable("user_satisfaction_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => conversationSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => customers.id), // Can be null for anonymous
  
  // Rating and feedback
  rating: integer("rating").notNull(), // 1-5 star rating
  feedback: text("feedback"), // Optional text feedback
  feedbackType: text("feedback_type", { enum: ["positive", "negative", "neutral", "suggestion"] }),
  
  // Context
  wasResolved: boolean("was_resolved").notNull().default(false), // Was issue resolved
  escalatedToHuman: boolean("escalated_to_human").notNull().default(false), // Required human intervention
  primaryIntent: text("primary_intent"), // Main intent of the conversation
  
  // Metadata
  channel: text("channel", { enum: ["web", "facebook", "instagram", "whatsapp", "api"] }).notNull().default("web"),
  deviceType: text("device_type", { enum: ["mobile", "desktop", "tablet", "unknown"] }).notNull().default("unknown"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("user_satisfaction_scores_session_id_idx").on(table.sessionId),
  ratingIdx: index("user_satisfaction_scores_rating_idx").on(table.rating),
  wasResolvedIdx: index("user_satisfaction_scores_was_resolved_idx").on(table.wasResolved),
}));

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

// 🙋‍♂️ Product FAQs table - Hỏi & Đáp về sản phẩm (LEGACY - will migrate to faqLibrary)
export const productFAQs = pgTable("product_faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  question: text("question").notNull(), // "Nhang này dùng trong phòng máy lạnh được không?"
  answer: text("answer").notNull(), // "Hoàn toàn được. Sản phẩm an toàn cho mọi không gian..."
  sortOrder: integer("sort_order").notNull().default(0), // Thứ tự hiển thị
  isActive: boolean("is_active").notNull().default(true), // Hiển thị hay ẩn
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index để tối ưu query
  productIdIdx: index("product_faqs_product_id_idx").on(table.productId),
  sortOrderIdx: index("product_faqs_sort_order_idx").on(table.sortOrder),
}));

// 🏷️ FAQ Library table - Tag-based FAQ management system
export const faqLibrary = pgTable("faq_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(), // "Nhang này có tác dụng gì cho sức khỏe?"
  answer: text("answer").notNull(), // "Nhang thiên nhiên giúp thư giãn tinh thần..."
  
  // 🏷️ Tags integration with unified_tags system - Focus on "Sản phẩm" tags
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // Organization & Priority
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  category: text("category", { enum: ["general", "product", "tutorial", "policy", "technical"] }).notNull().default("product"),
  
  // Status & Display
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  
  // Usage tracking
  usageCount: integer("usage_count").notNull().default(0), // How many times this FAQ is used
  lastUsed: timestamp("last_used"), // Last time assigned to content
  
  // SEO & Search
  keywords: jsonb("keywords").$type<string[]>().default(sql`'[]'::jsonb`), // Search keywords
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  categoryIdx: index("faq_library_category_idx").on(table.category),
  priorityIdx: index("faq_library_priority_idx").on(table.priority),
  activeIdx: index("faq_library_active_idx").on(table.isActive),
  sortOrderIdx: index("faq_library_sort_order_idx").on(table.sortOrder),
  usageCountIdx: index("faq_library_usage_count_idx").on(table.usageCount),
}));

// 🔗 Content-FAQ Assignment table - Many-to-Many relationship with drag & drop support
export const contentFAQAssignments = pgTable("content_faq_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  faqId: varchar("faq_id").notNull().references(() => faqLibrary.id, { onDelete: 'cascade' }),
  
  // Flexible content types - products, articles, landing pages
  contentType: text("content_type", { 
    enum: ["product", "article", "landing_page"] 
  }).notNull().default("product"),
  contentId: varchar("content_id").notNull(), // Product/Article/Page ID
  
  // Display & Organization
  sortOrder: integer("sort_order").notNull().default(0), // Drag & drop order
  isVisible: boolean("is_visible").notNull().default(true), // Show/hide on frontend
  
  // Assignment context
  assignedBy: varchar("assigned_by"), // User who assigned this FAQ
  assignmentNote: text("assignment_note"), // Why this FAQ was assigned
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint: Each FAQ can only be assigned once per content item
  uniqueAssignment: unique("unique_faq_content_assignment").on(table.faqId, table.contentType, table.contentId),
  
  // Performance indexes
  faqIdIdx: index("content_faq_assignments_faq_id_idx").on(table.faqId),
  contentTypeIdx: index("content_faq_assignments_content_type_idx").on(table.contentType),
  contentIdIdx: index("content_faq_assignments_content_id_idx").on(table.contentId),
  contentCompositeIdx: index("content_faq_assignments_content_composite_idx").on(table.contentType, table.contentId),
  sortOrderIdx: index("content_faq_assignments_sort_order_idx").on(table.sortOrder),
  visibleIdx: index("content_faq_assignments_visible_idx").on(table.isVisible),
}));

// 🛡️ Product Policies table - Chính sách sản phẩm (có thể tái sử dụng)
export const productPolicies = pgTable("product_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // "Đổi trả trong 7 ngày"
  description: text("description").notNull(), // Mô tả chi tiết chính sách
  icon: text("icon"), // Icon name từ Lucide React: "shield-check", "truck", "refresh-cw"
  type: text("type", { 
    enum: ["guarantee", "return", "shipping", "quality", "support"] 
  }).notNull(), // Loại chính sách
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("product_policies_type_idx").on(table.type),
  sortOrderIdx: index("product_policies_sort_order_idx").on(table.sortOrder),
}));

// 🔗 Product-Policy Association table - Many-to-Many relationship
export const productPolicyAssociations = pgTable("product_policy_associations", {
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  policyId: varchar("policy_id").notNull().references(() => productPolicies.id, { onDelete: 'cascade' }),
  sortOrder: integer("sort_order").notNull().default(0), // Thứ tự hiển thị cho từng sản phẩm
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Composite primary key
  pk: unique().on(table.productId, table.policyId),
  // Indexes for performance
  productIdIdx: index("product_policy_assoc_product_id_idx").on(table.productId),
  policyIdIdx: index("product_policy_assoc_policy_id_idx").on(table.policyId),
}));

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
  bankInfo: jsonb("bank_info").$type<BankInfo>(), // ✅ Typed bank information
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
  
  // POS UI Preferences for customizable category display
  posUIPreferences: jsonb("pos_ui_preferences").$type<{
    showCategoryLabel?: boolean; // Show "Danh mục sản phẩm" label
    categoryLayoutMode?: "full" | "compact" | "hidden"; // Display mode
    showProductCount?: boolean; // Show product count in categories
    collapsedByDefault?: boolean; // Whether category section starts collapsed
  }>().default(sql`'{"showCategoryLabel":true,"categoryLayoutMode":"full","showProductCount":true,"collapsedByDefault":false}'::jsonb`),
  
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
}).extend({
  customerId: z.string().optional(), // Override to make customerId optional for POS walk-in customers
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

// TikTok Zod validation schemas
export const insertTikTokBusinessAccountSchema = createInsertSchema(tiktokBusinessAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTikTokShopOrderSchema = createInsertSchema(tiktokShopOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTikTokShopProductSchema = createInsertSchema(tiktokShopProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTikTokVideoSchema = createInsertSchema(tiktokVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
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

export const insertIndustryKeywordSchema = createInsertSchema(industryKeywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndustryTemplateSchema = createInsertSchema(industryTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndustryRuleSchema = createInsertSchema(industryRules).omit({
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

export const insertProductFAQSchema = createInsertSchema(productFAQs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPolicySchema = createInsertSchema(productPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPolicyAssociationSchema = createInsertSchema(productPolicyAssociations).omit({
  createdAt: true,
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

// TikTok TypeScript types
export type InsertTikTokBusinessAccount = z.infer<typeof insertTikTokBusinessAccountSchema>;
export type TikTokBusinessAccount = typeof tiktokBusinessAccounts.$inferSelect;

export type InsertTikTokShopOrder = z.infer<typeof insertTikTokShopOrderSchema>;
export type TikTokShopOrder = typeof tiktokShopOrders.$inferSelect;

export type InsertTikTokShopProduct = z.infer<typeof insertTikTokShopProductSchema>;
export type TikTokShopProduct = typeof tiktokShopProducts.$inferSelect;

export type InsertTikTokVideo = z.infer<typeof insertTikTokVideoSchema>;
export type TikTokVideo = typeof tiktokVideos.$inferSelect;

// Shopee Zod schemas
export const insertShopeeBusinessAccountSchema = createInsertSchema(shopeeBusinessAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopeeShopOrderSchema = createInsertSchema(shopeeShopOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopeeShopProductSchema = createInsertSchema(shopeeShopProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Shopee TypeScript types
export type InsertShopeeBusinessAccount = z.infer<typeof insertShopeeBusinessAccountSchema>;
export type ShopeeBusinessAccount = typeof shopeeBusinessAccounts.$inferSelect;

export type InsertShopeeShopOrder = z.infer<typeof insertShopeeShopOrderSchema>;
export type ShopeeShopOrder = typeof shopeeShopOrders.$inferSelect;

export type InsertShopeeShopProduct = z.infer<typeof insertShopeeShopProductSchema>;
export type ShopeeShopProduct = typeof shopeeShopProducts.$inferSelect;

export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

export type InsertStorefrontConfig = z.infer<typeof insertStorefrontConfigSchema>;
export type StorefrontConfig = typeof storefrontConfig.$inferSelect;

export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Industry = typeof industries.$inferSelect;

export type InsertIndustryKeyword = z.infer<typeof insertIndustryKeywordSchema>;
export type IndustryKeyword = typeof industryKeywords.$inferSelect;

export type InsertIndustryTemplate = z.infer<typeof insertIndustryTemplateSchema>;
export type IndustryTemplate = typeof industryTemplates.$inferSelect;

export type InsertIndustryRule = z.infer<typeof insertIndustryRuleSchema>;
export type IndustryRule = typeof industryRules.$inferSelect;

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

export type InsertProductFAQ = z.infer<typeof insertProductFAQSchema>;
export type ProductFAQ = typeof productFAQs.$inferSelect;

export type InsertProductPolicy = z.infer<typeof insertProductPolicySchema>;
export type ProductPolicy = typeof productPolicies.$inferSelect;

export type InsertProductPolicyAssociation = z.infer<typeof insertProductPolicyAssociationSchema>;
export type ProductPolicyAssociation = typeof productPolicyAssociations.$inferSelect;

// ==========================================
// CONTENT MANAGEMENT TABLES
// ==========================================

// Content categories for organizing assets
export const contentCategories = pgTable("content_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#3B82F6"), // Hex color
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unified Tags System - Replaces page_tags and content_categories
export const unifiedTags = pgTable("unified_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(), // URL-friendly identifier (unique constraint defined below)
  
  // Organization
  category: text("category").notNull().default("general"), // "product", "content", "promotion", "tutorial", etc
  platforms: jsonb("platforms").$type<string[]>().default(sql`'["facebook", "tiktok", "instagram"]'::jsonb`), // Platform compatibility
  
  // Visual
  color: varchar("color", { length: 7 }).notNull().default("#3B82F6"), // Hex color
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  
  // Metadata
  description: text("description"),
  keywords: jsonb("keywords").$type<string[]>().default(sql`'[]'::jsonb`), // Search keywords
  
  // Analytics & Usage
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  // Settings
  isSystemDefault: boolean("is_system_default").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUnifiedSlug: unique().on(table.slug),
}));

// Content assets (images, videos) stored in Cloudinary
export const contentAssets = pgTable("content_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  
  // Cloudinary details
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  cloudinarySecureUrl: text("cloudinary_secure_url").notNull(),
  
  // File metadata
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  width: integer("width"), // for images/videos
  height: integer("height"), // for images/videos
  duration: decimal("duration", { precision: 8, scale: 3 }), // for videos (seconds)
  
  // Organization
  categoryId: integer("category_id").references(() => contentCategories.id), // Keep for backward compatibility
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unified_tags.id
  
  // SEO & Metadata
  altText: text("alt_text"),
  caption: text("caption"),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCloudinaryPublicId: unique().on(table.cloudinaryPublicId),
}));

// Scheduled social media posts
export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Content
  caption: text("caption").notNull(),
  hashtags: jsonb("hashtags").$type<string[]>().default(sql`'[]'::jsonb`),
  
  // Media attachments
  assetIds: jsonb("asset_ids").$type<string[]>().default(sql`'[]'::jsonb`), // Array of content asset IDs
  
  // Targeting
  socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id),
  platform: text("platform", { enum: ["facebook", "instagram", "twitter", "tiktok"] }).notNull(),
  
  // Scheduling
  scheduledTime: timestamp("scheduled_time").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Ho_Chi_Minh"),
  
  // Status tracking
  status: text("status", { 
    enum: ["draft", "scheduled", "posting", "posted", "failed", "cancelled"] 
  }).notNull().default("draft"),
  
  // Publishing results
  publishedAt: timestamp("published_at"),
  platformPostId: varchar("platform_post_id", { length: 255 }), // ID from Facebook/Instagram/etc
  platformUrl: text("platform_url"), // Direct link to the published post
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  
  // Analytics (populated after posting)
  analytics: jsonb("analytics").$type<{
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
    impressions?: number;
    clickThroughRate?: number;
    lastUpdated?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  scheduledTimeIndex: index().on(table.scheduledTime),
  statusIndex: index().on(table.status),
  socialAccountIndex: index().on(table.socialAccountId),
}));

// Content Library for storing reusable content with tag-based organization
export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Content
  title: varchar("title", { length: 255 }).notNull(),
  baseContent: text("base_content").notNull(), // Original content text
  
  // Content type
  contentType: text("content_type", { 
    enum: ["text", "image", "video", "mixed"] 
  }).notNull().default("text"),
  
  // Media attachments
  assetIds: jsonb("asset_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References contentAssets.id
  
  // Organization & Tagging
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`), // References unifiedTags.id
  
  // AI Variations
  aiVariations: jsonb("ai_variations").$type<{
    id: string;
    content: string;
    tone: string; // 'formal' | 'casual' | 'trendy' | 'sales'
    style: string; // 'headline' | 'story' | 'question' | 'cta'
    generatedAt: string;
  }[]>().default(sql`'[]'::jsonb`),
  
  // Priority & Usage
  priority: text("priority", { enum: ["high", "normal", "low"] }).notNull().default("normal"),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  // Status & Settings
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
  isTemplate: boolean("is_template").default(false), // For reusable templates
  
  // Scheduling hints
  platforms: jsonb("platforms").$type<string[]>().default(sql`'["facebook", "instagram", "tiktok"]'::jsonb`), // Suggested platforms
  bestTimeSlots: jsonb("best_time_slots").$type<string[]>().default(sql`'[]'::jsonb`), // Suggested posting times
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  titleIndex: index().on(table.title),
  statusIndex: index().on(table.status),
  priorityIndex: index().on(table.priority),
  contentTypeIndex: index().on(table.contentType),
}));

// Content management validation schemas
export const insertContentCategorySchema = createInsertSchema(contentCategories, {
  name: z.string().min(1, "Tên danh mục là bắt buộc").max(255),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Màu phải ở định dạng hex (#RRGGBB)"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const insertContentAssetSchema = createInsertSchema(contentAssets, {
  filename: z.string().min(1).max(255),
  originalFilename: z.string().min(1).max(255),
  cloudinaryPublicId: z.string().min(1).max(255),
  cloudinaryUrl: z.string().url(),
  cloudinarySecureUrl: z.string().url(),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().min(1),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  categoryId: z.number().int().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts, {
  caption: z.string().min(1, "Nội dung bài đăng là bắt buộc"),
  scheduledTime: z.date(),
  timezone: z.string().optional(),
  socialAccountId: z.string().uuid(),
  platform: z.enum(["facebook", "instagram", "twitter", "tiktok"]),
  status: z.enum(["draft", "scheduled", "posting", "posted", "failed", "cancelled"]).optional(),
});

// Content management TypeScript types
export type InsertContentCategory = z.infer<typeof insertContentCategorySchema>;
export type ContentCategory = typeof contentCategories.$inferSelect;

export type InsertContentAsset = z.infer<typeof insertContentAssetSchema>;
export type ContentAsset = typeof contentAssets.$inferSelect;

export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;

// Unified Tags validation schemas
export const insertUnifiedTagSchema = createInsertSchema(unifiedTags, {
  name: z.string().min(1, "Tên tag là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  platforms: z.array(z.string()).min(1, "Ít nhất 1 platform"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Màu phải là hex color"),
});

export type InsertUnifiedTag = z.infer<typeof insertUnifiedTagSchema>;
export type UnifiedTag = typeof unifiedTags.$inferSelect;

// Content Library validation schema
export const insertContentLibrarySchema = createInsertSchema(contentLibrary, {
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(255),
  baseContent: z.string().min(1, "Nội dung là bắt buộc"),
  contentType: z.enum(["text", "image", "video", "mixed"]),
  priority: z.enum(["high", "normal", "low"]).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  tagIds: z.array(z.string()).optional(),
  assetIds: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  bestTimeSlots: z.array(z.string()).optional(),
});

export const updateContentLibrarySchema = insertContentLibrarySchema.partial();

export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type UpdateContentLibrary = z.infer<typeof updateContentLibrarySchema>;
export type ContentLibrary = typeof contentLibrary.$inferSelect;

// ===========================================
// API MANAGEMENT SYSTEM
// ===========================================

// API Configurations - Centralized API enable/disable management
export const apiConfigurations = pgTable("api_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Core API Info  
  endpoint: text("endpoint").notNull(), // e.g., "/api/content/categories"
  method: text("method", { enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] }).notNull().default("GET"),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "content", "facebook", "tiktok", "rasa", "core"
  
  // Status Management
  isEnabled: boolean("is_enabled").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message").default("API temporarily unavailable for maintenance"),
  
  // Rate Limiting
  rateLimitEnabled: boolean("rate_limit_enabled").notNull().default(false),
  rateLimitRequests: integer("rate_limit_requests").default(100), // requests per window
  rateLimitWindowSeconds: integer("rate_limit_window_seconds").default(60), // window in seconds
  
  // Circuit Breaker
  circuitBreakerEnabled: boolean("circuit_breaker_enabled").notNull().default(false),
  circuitBreakerThreshold: integer("circuit_breaker_threshold").default(5), // failures before opening circuit
  circuitBreakerTimeout: integer("circuit_breaker_timeout").default(60), // seconds to wait before retry
  
  // Monitoring & Analytics
  accessCount: integer("access_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 10, scale: 3 }).default("0"), // milliseconds
  lastAccessed: timestamp("last_accessed"),
  lastToggled: timestamp("last_toggled"),
  lastError: timestamp("last_error"),
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`), // for grouping/filtering
  priority: text("priority", { enum: ["critical", "high", "normal", "low"] }).notNull().default("normal"),
  owner: text("owner"), // team/person responsible
  
  // Security
  requiresAuth: boolean("requires_auth").notNull().default(true),
  adminOnly: boolean("admin_only").notNull().default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Composite unique constraint - one config per endpoint+method combination
  endpointMethodUnique: unique().on(table.endpoint, table.method),
  // Performance indexes
  categoryIndex: index().on(table.category),
  enabledIndex: index().on(table.isEnabled),
  accessedIndex: index().on(table.lastAccessed),
}));

// Validation schemas for API configurations
export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations, {
  endpoint: z.string().min(1, "Endpoint là bắt buộc").regex(/^\/api\//, "Endpoint phải bắt đầu với /api/"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string().min(1, "Mô tả là bắt buộc").max(500),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  rateLimitRequests: z.number().int().min(1).max(10000).optional(),
  rateLimitWindowSeconds: z.number().int().min(1).max(3600).optional(),
  circuitBreakerThreshold: z.number().int().min(1).max(100).optional(),
  circuitBreakerTimeout: z.number().int().min(10).max(3600).optional(),
  priority: z.enum(["critical", "high", "normal", "low"]).optional(),
  owner: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateApiConfigurationSchema = insertApiConfigurationSchema.partial();

// TypeScript types
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type UpdateApiConfiguration = z.infer<typeof updateApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;

// =============================================================================
// FACEBOOK APP LIMITS MANAGEMENT SYSTEM
// =============================================================================

// Account Groups - Nhóm tài khoản Facebook với limit rules
export const accountGroups = pgTable("account_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Group VIP", "Group Thường", etc.
  description: text("description"),
  platform: text("platform").notNull().default("facebook"), // Chỉ support Facebook
  priority: integer("priority").default(1), // 1 = cao nhất, 5 = thấp nhất
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.0"), // Weight trong distribution
  isActive: boolean("is_active").default(true),
  formulaId: varchar("formula_id").references(() => postingFormulas.id), // FK to posting formula
  
  // Tracking
  totalPosts: integer("total_posts").default(0), // Total posts đã đăng
  lastPostAt: timestamp("last_post_at"), // Post cuối cùng
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Accounts - Junction table: nhóm nào có account nào
export const groupAccounts = pgTable("group_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => accountGroups.id, { onDelete: "cascade" }),
  socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  
  // Per-account overrides
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.0"), // Weight riêng của account này
  dailyCapOverride: integer("daily_cap_override"), // Override daily limit cho account này
  cooldownMinutes: integer("cooldown_minutes"), // Thời gian nghỉ riêng
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure unique group-account relationship
  uniqueGroupAccount: unique().on(table.groupId, table.socialAccountId),
}));

// Posting Formulas - Công thức đăng bài với limits
export const postingFormulas = pgTable("posting_formulas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Formula VIP", "Formula An Toàn", etc.
  description: text("description"),
  
  // Formula Configuration (JSONB)
  config: jsonb("config").$type<{
    // Caps per time period
    caps: {
      perHour?: number;
      perDay?: number;
      perWeek?: number;
      perMonth?: number;
      perYear?: number;
    };
    
    // Timing constraints
    minGapMinutes: number; // Khoảng cách tối thiểu giữa 2 posts
    maxPerHour: number; // Tối đa bao nhiêu posts/giờ
    
    // Schedule restrictions
    quietHours: { start: string; end: string }[]; // Giờ không được đăng
    allowedDays: number[]; // 0=CN, 1=T2, ... 6=T7
    peakSlots: { hour: number; minute: number; weight: number }[]; // Giờ vàng
    
    // Randomization
    jitterSeconds: number; // Random delay để tránh detect
    
    // Distribution strategy
    distributionMode: "even" | "weighted" | "performance"; // Cách phân phối
    
    // Error handling
    backoffOnFail: boolean; // Có nghỉ khi fail không
    
    // Rest strategy
    restStrategy: {
      threshold: number; // Đạt bao nhiêu % limit thì nghỉ
      restDurationHours: number; // Nghỉ bao lâu
      resumePolicy: "auto" | "manual"; // Tự động tiếp tục hay manual
    };
  }>().notNull(),
  
  // Preset templates
  isSystemDefault: boolean("is_system_default").default(false), // Có phải template hệ thống
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Limit Counters - Đếm usage theo thời gian
export const limitCounters = pgTable("limit_counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Scope: app-wide, group, hoặc individual account
  scope: text("scope", { enum: ["app", "group", "account"] }).notNull(),
  scopeId: varchar("scope_id").notNull(), // ID của app/group/account
  
  // Action type
  action: text("action").notNull().default("post"), // "post", "comment", etc.
  
  // Time window
  window: text("window", { enum: ["hour", "day", "week", "month", "year"] }).notNull(),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  
  // Counters
  used: integer("used").default(0), // Đã dùng
  limit: integer("limit").notNull(), // Giới hạn
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure unique counter per scope/action/window
  uniqueCounter: unique().on(table.scope, table.scopeId, table.action, table.window, table.windowStart),
}));

// Rest Periods - Thời gian nghỉ ngơi
export const restPeriods = pgTable("rest_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Scope
  scope: text("scope", { enum: ["app", "group", "account"] }).notNull(),
  scopeId: varchar("scope_id").notNull(),
  
  // Rest period
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  
  // Reason & status
  reason: text("reason").notNull(), // "daily_limit_reached", "manual_pause", etc.
  status: text("status", { enum: ["active", "completed", "cancelled"] }).default("active"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Assignments - Bài đăng được assign vào account nào
export const scheduleAssignments = pgTable("schedule_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  scheduledPostId: varchar("scheduled_post_id").notNull().references(() => scheduledPosts.id, { onDelete: "cascade" }),
  socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id),
  groupId: varchar("group_id").references(() => accountGroups.id),
  
  // Assignment details
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status", { enum: ["assigned", "executing", "completed", "failed"] }).default("assigned"),
  
  // Concurrency control
  lockVersion: integer("lock_version").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure unique assignment per post
  uniqueAssignment: unique().on(table.scheduledPostId),
}));

// Violations Log - Log các vi phạm limits
export const violationsLog = pgTable("violations_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Scope
  scope: text("scope", { enum: ["app", "group", "account"] }).notNull(),
  scopeId: varchar("scope_id").notNull(),
  
  // Violation details
  code: text("code").notNull(), // "DAILY_LIMIT_EXCEEDED", "MIN_GAP_VIOLATION", etc.
  message: text("message").notNull(),
  eventTime: timestamp("event_time").defaultNow(),
  
  // Context data
  metadata: jsonb("metadata").$type<{
    attemptedAction?: string;
    currentUsage?: number;
    limit?: number;
    timeSinceLastPost?: number;
    additionalInfo?: Record<string, any>;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// TYPES FOR FACEBOOK LIMITS MANAGEMENT
// =============================================================================

export type AccountGroup = typeof accountGroups.$inferSelect;
export type InsertAccountGroup = typeof accountGroups.$inferInsert;

export type GroupAccount = typeof groupAccounts.$inferSelect;
export type InsertGroupAccount = typeof groupAccounts.$inferInsert;

export type PostingFormula = typeof postingFormulas.$inferSelect;
export type InsertPostingFormula = typeof postingFormulas.$inferInsert;

export type LimitCounter = typeof limitCounters.$inferSelect;
export type InsertLimitCounter = typeof limitCounters.$inferInsert;

export type RestPeriod = typeof restPeriods.$inferSelect;
export type InsertRestPeriod = typeof restPeriods.$inferInsert;

export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;
export type InsertScheduleAssignment = typeof scheduleAssignments.$inferInsert;

export type ViolationLog = typeof violationsLog.$inferSelect;
export type InsertViolationLog = typeof violationsLog.$inferInsert;

// ============================================
// MULTI-PLATFORM WORKER MANAGEMENT SYSTEM
// ============================================

// Worker platforms enum for extensibility
export const SUPPORTED_WORKER_PLATFORMS = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin'] as const;
export type WorkerPlatform = typeof SUPPORTED_WORKER_PLATFORMS[number];

// Worker capabilities and specialties
export interface WorkerCapability {
  platform: WorkerPlatform;
  actions: ('post_text' | 'post_image' | 'post_video' | 'post_story' | 'post_reel')[];
  maxConcurrent: number;
  avgExecutionTime: number; // milliseconds
}

// Workers table - Cánh Tay management
export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic worker info
  workerId: text("worker_id").notNull().unique(), // e.g., "vercel-us-east-1"
  name: text("name").notNull(), // Human-readable name
  description: text("description"),
  
  // Platform capabilities
  platforms: jsonb("platforms").notNull().$type<WorkerPlatform[]>(), // ["facebook", "instagram"]
  capabilities: jsonb("capabilities").notNull().$type<WorkerCapability[]>(), // Platform-specific capabilities
  specialties: jsonb("specialties").$type<string[]>(), // ["video_posts", "high_volume", "regions"]
  
  // Performance configuration
  maxConcurrentJobs: integer("max_concurrent_jobs").notNull().default(3),
  minJobInterval: integer("min_job_interval").notNull().default(300), // seconds (5 minutes)
  maxJobsPerHour: integer("max_jobs_per_hour").notNull().default(12),
  avgExecutionTime: integer("avg_execution_time").notNull().default(5000), // milliseconds
  
  // Deployment info
  region: text("region").notNull(), // e.g., "us-east-1", "eu-west-1"
  environment: text("environment").notNull().default('production'), // production, staging, development
  deploymentPlatform: text("deployment_platform").notNull(), // "vercel", "railway", "render"
  endpointUrl: text("endpoint_url").notNull(), // Worker webhook URL
  ipAddress: text("ip_address"), // Worker's external IP address for diversity tracking
  ipCountry: text("ip_country"), // IP geolocation country
  ipRegion: text("ip_region"), // IP geolocation region
  
  // Status and health
  status: text("status").notNull().default('active'), // active, paused, maintenance, failed
  isOnline: boolean("is_online").notNull().default(false),
  lastPingAt: timestamp("last_ping_at"),
  lastJobAt: timestamp("last_job_at"),
  currentLoad: integer("current_load").notNull().default(0), // Current concurrent jobs
  
  // Performance metrics
  totalJobsCompleted: integer("total_jobs_completed").notNull().default(0),
  totalJobsFailed: integer("total_jobs_failed").notNull().default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0.00'), // percentage
  avgResponseTime: integer("avg_response_time").default(0), // milliseconds
  
  // Authentication
  registrationSecret: text("registration_secret").notNull(),
  authToken: text("auth_token"), // JWT token for authentication
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Configuration
  tags: jsonb("tags").$type<string[]>(), // For filtering and grouping
  priority: integer("priority").notNull().default(1), // 1 = highest priority
  isEnabled: boolean("is_enabled").notNull().default(true),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible metadata storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker job assignments - Track active jobs per worker
export const workerJobs = pgTable("worker_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Job relationships
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: 'cascade' }),
  jobId: text("job_id").notNull(), // BullMQ job ID
  scheduledPostId: varchar("scheduled_post_id").references(() => scheduledPosts.id, { onDelete: 'cascade' }),
  
  // Job details
  platform: text("platform").notNull().$type<WorkerPlatform>(),
  jobType: text("job_type").notNull(), // post_text, post_image, post_video
  priority: integer("priority").notNull().default(1),
  
  // Timing
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Status tracking
  status: text("status").notNull().default('assigned'), // assigned, started, completed, failed, timeout
  result: jsonb("result").$type<{
    success: boolean;
    platformPostId?: string;
    platformUrl?: string;
    error?: string;
    executionTime?: number;
    metrics?: Record<string, any>;
  }>(),
  
  // Performance data
  executionTime: integer("execution_time"), // milliseconds
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker health checks and monitoring
export const workerHealthChecks = pgTable("worker_health_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: 'cascade' }),
  
  // Health status
  status: text("status").notNull(), // healthy, degraded, unhealthy, offline
  responseTime: integer("response_time"), // milliseconds
  
  // System metrics
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }), // percentage
  networkLatency: integer("network_latency"), // milliseconds
  
  // Platform-specific health data
  platformStatus: jsonb("platform_status").$type<Record<WorkerPlatform, {
    status: 'healthy' | 'degraded' | 'error';
    lastSuccessAt?: string;
    errorCount: number;
    avgResponseTime: number;
  }>>(),
  
  // Error tracking
  errorMessage: text("error_message"),
  errorCode: text("error_code"),
  errorCount: integer("error_count").notNull().default(0),
  
  // Metadata
  checkedAt: timestamp("checked_at").defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

// Worker performance analytics (aggregated data)
export const workerAnalytics = pgTable("worker_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: 'cascade' }),
  
  // Time period
  period: text("period").notNull(), // hourly, daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Performance metrics
  totalJobs: integer("total_jobs").notNull().default(0),
  successfulJobs: integer("successful_jobs").notNull().default(0),
  failedJobs: integer("failed_jobs").notNull().default(0),
  avgExecutionTime: integer("avg_execution_time").default(0),
  avgResponseTime: integer("avg_response_time").default(0),
  
  // Platform-specific analytics
  platformMetrics: jsonb("platform_metrics").$type<Record<WorkerPlatform, {
    totalJobs: number;
    successfulJobs: number;
    avgExecutionTime: number;
    errorRate: number;
  }>>(),
  
  // Capacity utilization
  maxConcurrentJobs: integer("max_concurrent_jobs").notNull(),
  avgConcurrentJobs: decimal("avg_concurrent_jobs", { precision: 5, scale: 2 }),
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }), // percentage
  
  // Quality metrics
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertWorkerSchema = createInsertSchema(workers);
export const insertWorkerJobSchema = createInsertSchema(workerJobs);
export const insertWorkerHealthCheckSchema = createInsertSchema(workerHealthChecks);
export const insertWorkerAnalyticsSchema = createInsertSchema(workerAnalytics);

// 🤖 RASA Analytics Zod Schemas
export const insertConversationSessionSchema = createInsertSchema(conversationSessions);
export const insertConversationMessageSchema = createInsertSchema(conversationMessages);
export const insertIntentAnalyticsSchema = createInsertSchema(intentAnalytics);
export const insertUserSatisfactionScoreSchema = createInsertSchema(userSatisfactionScores);

// TypeScript types for RASA analytics
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type NewConversationSession = typeof conversationSessions.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
export type IntentAnalytics = typeof intentAnalytics.$inferSelect;
export type NewIntentAnalytics = typeof intentAnalytics.$inferInsert;
export type UserSatisfactionScore = typeof userSatisfactionScores.$inferSelect;
export type NewUserSatisfactionScore = typeof userSatisfactionScores.$inferInsert;

// Template Persistence System - Phase 1 Database Schema

// User Templates table - for saving customized templates
export const userTemplates = pgTable("user_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Reference to users table, nullable for anonymous saves
  name: text("name").notNull(),
  description: text("description"),
  
  // Template inheritance
  baseTemplateId: varchar("base_template_id").notNull(), // Reference to built-in template
  customizations: jsonb("customizations").notNull(), // Theme overrides, color changes, etc.
  
  // Targeting
  platforms: jsonb("platforms").notNull().default('["all"]'), // ['landing-page', 'storefront', 'all']
  category: varchar("category").notNull().default('custom'), // 'ecommerce', 'navigation', 'custom', etc.
  
  // Sharing & visibility
  isPublic: boolean("is_public").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  // Metadata
  tags: jsonb("tags").default('[]'), // ['shopee-style', 'dark-theme', etc.]
  usageCount: integer("usage_count").notNull().default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template Compilations cache - for storing compiled template code
export const templateCompilations = pgTable("template_compilations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(), // Can be built-in or user template ID
  templateType: varchar("template_type").notNull(), // 'builtin' or 'user'
  
  // Compilation parameters
  framework: varchar("framework").notNull().default('react'), // 'react', 'vue', 'vanilla'
  customizationHash: varchar("customization_hash").notNull(), // Hash of customizations for cache key
  
  // Compiled output
  compiledCode: text("compiled_code").notNull(),
  dependencies: jsonb("dependencies").default('[]'), // External dependencies needed
  devDependencies: jsonb("dev_dependencies").default('[]'),
  
  // Applied theme data
  appliedTheme: jsonb("applied_theme"), // Complete theme object that was applied
  
  // Cache management
  version: varchar("version").notNull().default('1.0.0'),
  isValid: boolean("is_valid").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration for cache invalidation
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint for cache efficiency
  uniqueCompilation: unique().on(table.templateId, table.templateType, table.customizationHash, table.framework)
}));

// Project Templates - tracking template usage in projects
export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Project references
  projectId: varchar("project_id").notNull(), // References landing page or storefront ID
  projectType: varchar("project_type").notNull(), // 'landing_page' or 'storefront'
  
  // Template references
  templateId: varchar("template_id").notNull(), // Can be built-in or user template
  templateType: varchar("template_type").notNull(), // 'builtin' or 'user'
  templateName: text("template_name").notNull(), // Snapshot of template name for history
  
  // Applied configuration
  appliedCustomizations: jsonb("applied_customizations").notNull(), // What was actually applied
  appliedAt: timestamp("applied_at").defaultNow(),
  
  // Usage tracking
  isActive: boolean("is_active").notNull().default(true), // If this template application is current
  platform: varchar("platform").notNull(), // 'landing-page', 'storefront'
  
  // Performance tracking
  loadTime: integer("load_time"), // Template application time in ms
  compilationTime: integer("compilation_time"), // How long compilation took
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for efficient project lookups
  projectIndex: index("project_templates_project_idx").on(table.projectId, table.projectType),
  // Index for template usage analytics
  templateUsageIndex: index("project_templates_template_idx").on(table.templateId, table.templateType)
}));

// Zod schemas for new template tables
export const insertUserTemplateSchema = createInsertSchema(userTemplates);
export const insertTemplateCompilationSchema = createInsertSchema(templateCompilations);
export const insertProjectTemplateSchema = createInsertSchema(projectTemplates);

// Type exports
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type WorkerJob = typeof workerJobs.$inferSelect;
export type InsertWorkerJob = z.infer<typeof insertWorkerJobSchema>;
export type WorkerHealthCheck = typeof workerHealthChecks.$inferSelect;
export type InsertWorkerHealthCheck = z.infer<typeof insertWorkerHealthCheckSchema>;
export type WorkerAnalytics = typeof workerAnalytics.$inferSelect;
export type InsertWorkerAnalytics = z.infer<typeof insertWorkerAnalyticsSchema>;

// ============================================
// 📦 COMPREHENSIVE PRODUCT MANAGEMENT SYSTEM
// ============================================

// Product Variants - Support for size, color, material, etc.
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  
  // Variant Information
  name: text("name").notNull(), // "Size L - Red"
  sku: text("sku").notNull().unique(), // Auto-generated: parent SKU + variant suffix
  barcode: text("barcode"), // EAN/UPC barcode for this specific variant
  
  // Variant Attributes
  attributes: jsonb("attributes").$type<{
    size?: string;
    color?: string;
    material?: string;
    weight?: string;
    dimensions?: string;
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`),
  
  // Pricing & Inventory (can override parent product)
  price: decimal("price", { precision: 15, scale: 2 }), // If null, use parent product price
  cost: decimal("cost", { precision: 15, scale: 2 }), // Cost of goods sold for margin calculation
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0), // Stock reserved for pending orders
  
  // Inventory Management
  reorderPoint: integer("reorder_point").default(10), // Trigger reorder alert
  maxStock: integer("max_stock").default(1000), // Maximum recommended stock
  weight: decimal("weight", { precision: 10, scale: 3 }), // Weight in kg for shipping
  
  // Media (can override parent product images)
  images: jsonb("images").$type<CloudinaryImage[]>().default(sql`'[]'::jsonb`),
  defaultImageIndex: integer("default_image_index").default(0),
  
  // Status
  status: text("status", { enum: ["active", "inactive", "discontinued"] }).notNull().default("active"),
  isDefault: boolean("is_default").default(false), // Mark as default variant for product
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse Locations - Support multiple storage locations
export const warehouseLocations = pgTable("warehouse_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Location Information
  name: text("name").notNull(), // "Kho chính Hà Nội", "Kho phụ HCM"
  code: text("code").notNull().unique(), // "WH-HN-01", "WH-HCM-02"
  description: text("description"),
  
  // Address
  address: jsonb("address").$type<{
    street: string;
    ward: string;
    district: string;
    city: string;
    zipCode?: string;
    country: string;
  }>().notNull(),
  
  // Contact & Management
  manager: text("manager"), // Warehouse manager name
  phone: text("phone"),
  email: text("email"),
  
  // Configuration
  isPrimary: boolean("is_primary").default(false), // Primary warehouse for new products
  isActive: boolean("is_active").default(true),
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  
  // Operational Details
  operatingHours: jsonb("operating_hours").$type<{
    [key: string]: { open: string; close: string; }; // "monday": {"open": "08:00", "close": "17:00"}
  }>().default(sql`'{}'::jsonb`),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Movements - Complete audit trail of all stock changes
export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Product/Variant Reference
  productId: varchar("product_id").references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  warehouseId: varchar("warehouse_id").references(() => warehouseLocations.id),
  
  // Movement Details
  type: text("type", { 
    enum: ["purchase", "sale", "adjustment", "transfer", "return", "damage", "expired"] 
  }).notNull(),
  quantity: integer("quantity").notNull(), // Positive = in, Negative = out
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  
  // Cost & Pricing
  unitCost: decimal("unit_cost", { precision: 15, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  
  // Reference Information
  referenceType: text("reference_type", {
    enum: ["order", "purchase_order", "manual_adjustment", "bulk_import", "return", "transfer"]
  }),
  referenceId: text("reference_id"), // Order ID, PO ID, etc.
  
  // Details & Tracking
  reason: text("reason"), // "Sold to customer", "Damaged in shipping", "Manual count adjustment"
  notes: text("notes"),
  batchNumber: text("batch_number"), // For product batches/lots
  expiryDate: timestamp("expiry_date"), // For perishable goods
  
  // User & System Tracking
  performedBy: varchar("performed_by"), // User ID who performed the movement
  performedByType: text("performed_by_type", { enum: ["user", "system", "api"] }).default("user"),
  systemSource: text("system_source"), // "shopee_sync", "tiktok_sync", "manual_entry"
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Indexes for efficient queries
  productDateIndex: index("inventory_movements_product_date_idx").on(table.productId, table.createdAt),
  variantDateIndex: index("inventory_movements_variant_date_idx").on(table.variantId, table.createdAt),
  warehouseIndex: index("inventory_movements_warehouse_idx").on(table.warehouseId),
  referenceIndex: index("inventory_movements_reference_idx").on(table.referenceType, table.referenceId),
}));

// Marketplace Pricing - Platform-specific pricing and cost management
export const marketplacePricing = pgTable("marketplace_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Product Reference
  productId: varchar("product_id").references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  
  // Marketplace Information
  platform: text("platform", { 
    enum: ["shopee", "tiktok-shop", "lazada", "facebook-shop", "instagram-shop", "manual"] 
  }).notNull(),
  marketplaceProductId: text("marketplace_product_id"), // Platform's product ID
  
  // Pricing Strategy
  basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
  sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 15, scale: 2 }), // Original price for discounts
  
  // Cost Analysis
  costPrice: decimal("cost_price", { precision: 15, scale: 2 }), // Cost of goods sold
  shippingCost: decimal("shipping_cost", { precision: 15, scale: 2 }).default("0"),
  platformFees: decimal("platform_fees", { precision: 15, scale: 2 }).default("0"), // Commission, transaction fees
  advertisingCost: decimal("advertising_cost", { precision: 15, scale: 2 }).default("0"),
  otherCosts: decimal("other_costs", { precision: 15, scale: 2 }).default("0"),
  
  // Calculated Margins
  grossMargin: decimal("gross_margin", { precision: 15, scale: 2 }), // sellPrice - costPrice
  netMargin: decimal("net_margin", { precision: 15, scale: 2 }), // After all fees and costs
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }), // (netMargin / sellPrice) * 100
  
  // Pricing Rules
  minimumPrice: decimal("minimum_price", { precision: 15, scale: 2 }), // Never sell below this
  maximumPrice: decimal("maximum_price", { precision: 15, scale: 2 }), // Maximum competitive price
  priceStrategy: text("price_strategy", {
    enum: ["fixed", "competitive", "margin_based", "volume_based"]
  }).default("fixed"),
  
  // Sync Configuration
  autoSync: boolean("auto_sync").default(true),
  syncDirection: text("sync_direction", {
    enum: ["to_platform", "from_platform", "bidirectional"]
  }).default("to_platform"),
  
  // Status & Tracking
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "failed"] }).default("pending"),
  syncError: text("sync_error"),
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one pricing record per product per platform
  uniquePlatformProduct: unique().on(table.productId, table.variantId, table.platform),
  platformIndex: index("marketplace_pricing_platform_idx").on(table.platform),
  productIndex: index("marketplace_pricing_product_idx").on(table.productId),
}));

// Inventory Alerts - Automated alerts for stock management
export const inventoryAlerts = pgTable("inventory_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Product Reference
  productId: varchar("product_id").references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id),
  warehouseId: varchar("warehouse_id").references(() => warehouseLocations.id),
  
  // Alert Configuration
  alertType: text("alert_type", {
    enum: ["low_stock", "out_of_stock", "overstocked", "reorder_point", "expiry_warning", "negative_stock"]
  }).notNull(),
  
  threshold: integer("threshold"), // Stock level that triggers alert
  currentStock: integer("current_stock").notNull(),
  
  // Alert Status
  status: text("status", { enum: ["active", "acknowledged", "resolved", "ignored"] }).default("active"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  
  // Alert Details
  message: text("message").notNull(), // Human-readable alert message
  description: text("description"), // Additional context
  recommendedAction: text("recommended_action"), // "Order 100 units", "Check warehouse"
  
  // Escalation & Notifications
  notificationsSent: integer("notifications_sent").default(0),
  lastNotificationAt: timestamp("last_notification_at"),
  acknowledgedBy: varchar("acknowledged_by"), // User ID who acknowledged
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // Auto-Resolution
  autoResolve: boolean("auto_resolve").default(true), // Auto-resolve when stock levels normalize
  snoozeUntil: timestamp("snooze_until"), // Temporary disable until this time
  
  // Organization
  tagIds: jsonb("tag_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for alert management
  statusIndex: index("inventory_alerts_status_idx").on(table.status, table.priority),
  productIndex: index("inventory_alerts_product_idx").on(table.productId),
  typeIndex: index("inventory_alerts_type_idx").on(table.alertType),
  warehouseIndex: index("inventory_alerts_warehouse_idx").on(table.warehouseId),
}));

// Bulk Operations Log - Track all bulk operations for auditing
export const bulkOperationsLog = pgTable("bulk_operations_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Operation Details
  operationType: text("operation_type", {
    enum: ["bulk_update", "bulk_create", "bulk_delete", "csv_import", "marketplace_sync", "price_update"]
  }).notNull(),
  
  // Scope & Targets
  targetType: text("target_type", { enum: ["products", "variants", "inventory", "pricing"] }).notNull(),
  targetIds: jsonb("target_ids").$type<string[]>().default(sql`'[]'::jsonb`), // IDs of affected records
  totalRecords: integer("total_records").notNull(),
  
  // Execution Status
  status: text("status", { enum: ["pending", "running", "completed", "failed", "partially_failed"] }).default("pending"),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"), // 0-100 percentage
  
  // Results & Metrics
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  skippedCount: integer("skipped_count").default(0),
  
  // Operation Data
  operationData: jsonb("operation_data").$type<{
    filters?: any; // Filters used to select records
    changes?: any; // Changes to be applied
    csvFile?: string; // Path to uploaded CSV file
    mapping?: any; // Field mapping for imports
    errors?: string[]; // List of errors encountered
    warnings?: string[]; // List of warnings
  }>().default(sql`'{}'::jsonb`),
  
  // User & System Tracking
  performedBy: varchar("performed_by").notNull(), // User ID
  performedByName: text("performed_by_name"), // User name for easier tracking
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // Duration in milliseconds
  
  // Additional Context
  description: text("description"), // Human-readable description
  notes: text("notes"), // Additional notes or comments
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Indexes for efficient tracking
  statusIndex: index("bulk_operations_status_idx").on(table.status),
  userIndex: index("bulk_operations_user_idx").on(table.performedBy),
  typeIndex: index("bulk_operations_type_idx").on(table.operationType, table.targetType),
  dateIndex: index("bulk_operations_date_idx").on(table.createdAt),
}));

// ============================================
// SCHEMA VALIDATION & TYPE EXPORTS
// ============================================

// Zod schemas for new tables
export const insertProductVariantSchema = createInsertSchema(productVariants);
export const insertWarehouseLocationSchema = createInsertSchema(warehouseLocations);
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements);
export const insertMarketplacePricingSchema = createInsertSchema(marketplacePricing);
export const insertInventoryAlertSchema = createInsertSchema(inventoryAlerts);
export const insertBulkOperationsLogSchema = createInsertSchema(bulkOperationsLog);

// Type exports for new product management tables
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type WarehouseLocation = typeof warehouseLocations.$inferSelect;
export type InsertWarehouseLocation = z.infer<typeof insertWarehouseLocationSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type MarketplacePricing = typeof marketplacePricing.$inferSelect;
export type InsertMarketplacePricing = z.infer<typeof insertMarketplacePricingSchema>;
export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type InsertInventoryAlert = z.infer<typeof insertInventoryAlertSchema>;
export type BulkOperationsLog = typeof bulkOperationsLog.$inferSelect;
export type InsertBulkOperationsLog = z.infer<typeof insertBulkOperationsLogSchema>;

// Template Persistence System types
export type UserTemplate = typeof userTemplates.$inferSelect;
export type InsertUserTemplate = z.infer<typeof insertUserTemplateSchema>;
export type TemplateCompilation = typeof templateCompilations.$inferSelect;
export type InsertTemplateCompilation = z.infer<typeof insertTemplateCompilationSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
