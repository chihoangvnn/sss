import { pgTable, unique, varchar, text, integer, jsonb, boolean, timestamp, foreignKey, numeric, serial, index, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const storefrontConfig = pgTable("storefront_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	topProductsCount: integer("top_products_count").default(10).notNull(),
	displayMode: text("display_mode").default('auto').notNull(),
	selectedProductIds: jsonb("selected_product_ids"),
	isActive: boolean("is_active").default(true).notNull(),
	theme: text().default('organic').notNull(),
	primaryColor: text("primary_color").default('#4ade80').notNull(),
	contactInfo: jsonb("contact_info").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("storefront_config_name_unique").on(table.name),
]);

export const orders = pgTable("orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id").notNull(),
	total: numeric({ precision: 15, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	items: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	source: text().default('admin').notNull(),
	sourceOrderId: text("source_order_id"),
	sourceReference: text("source_reference"),
	syncStatus: text("sync_status").default('manual').notNull(),
	syncData: jsonb("sync_data"),
	sourceCustomerInfo: jsonb("source_customer_info"),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "orders_customer_id_customers_id_fk"
		}),
	unique("orders_source_source_order_id_unique").on(table.source, table.sourceOrderId),
]);

export const orderItems = pgTable("order_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	productId: varchar("product_id").notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 15, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 15, scale:  2 }).notNull(),
	stock: integer().default(0).notNull(),
	categoryId: varchar("category_id"),
	status: text().default('active').notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	sku: text(),
	images: jsonb().default([]),
	videos: jsonb().default([]),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	unique("products_sku_unique").on(table.sku),
]);

export const payments = pgTable("payments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	orderId: varchar("order_id").notNull(),
	method: text().default('qr_code').notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	qrCode: text("qr_code"),
	status: text().default('pending').notNull(),
	transactionId: text("transaction_id"),
	bankInfo: jsonb("bank_info"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}),
]);

export const storefrontOrders = pgTable("storefront_orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storefrontConfigId: varchar("storefront_config_id").notNull(),
	customerName: text("customer_name").notNull(),
	customerPhone: text("customer_phone").notNull(),
	customerEmail: text("customer_email"),
	customerAddress: text("customer_address"),
	productId: varchar("product_id").notNull(),
	productName: text("product_name").notNull(),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 15, scale:  2 }).notNull(),
	total: numeric({ precision: 15, scale:  2 }).notNull(),
	deliveryType: text("delivery_type").default('local_delivery').notNull(),
	status: text().default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storefrontConfigId],
			foreignColumns: [storefrontConfig.id],
			name: "storefront_orders_storefront_config_id_storefront_config_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "storefront_orders_product_id_products_id_fk"
		}),
]);

export const socialAccounts = pgTable("social_accounts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	platform: text().notNull(),
	name: text().notNull(),
	accountId: text("account_id").notNull(),
	accessToken: text("access_token"),
	followers: integer().default(0),
	connected: boolean().default(false),
	lastPost: timestamp("last_post", { mode: 'string' }),
	engagement: numeric({ precision: 5, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	pageAccessTokens: jsonb("page_access_tokens").default([]),
	webhookSubscriptions: jsonb("webhook_subscriptions").default([]),
	tags: jsonb().default([]),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
});

export const categories = pgTable("categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	industryId: varchar("industry_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.industryId],
			foreignColumns: [industries.id],
			name: "categories_industry_id_industries_id_fk"
		}),
]);

export const customers = pgTable("customers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	avatar: text(),
	status: text().default('active').notNull(),
	joinDate: timestamp("join_date", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("customers_email_unique").on(table.email),
]);

export const chatbotConversations = pgTable("chatbot_conversations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id"),
	sessionId: text("session_id").notNull(),
	messages: jsonb().notNull(),
	status: text().default('active').notNull(),
	satisfactionRating: integer("satisfaction_rating"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "chatbot_conversations_customer_id_customers_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const industries = pgTable("industries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const shopSettings = pgTable("shop_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	businessName: text("business_name").notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	address: text().notNull(),
	description: text(),
	website: text(),
	logo: text(),
	isDefault: boolean("is_default").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const contentCategories = pgTable("content_categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	color: varchar({ length: 7 }).default('#3B82F6').notNull(),
	icon: varchar({ length: 50 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const scheduledPosts = pgTable("scheduled_posts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	caption: text().notNull(),
	hashtags: jsonb().default([]),
	assetIds: jsonb("asset_ids").default([]),
	socialAccountId: varchar("social_account_id").notNull(),
	platform: text().notNull(),
	scheduledTime: timestamp("scheduled_time", { mode: 'string' }).notNull(),
	timezone: varchar({ length: 50 }).default('Asia/Ho_Chi_Minh'),
	status: text().default('draft').notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	platformPostId: varchar("platform_post_id", { length: 255 }),
	platformUrl: text("platform_url"),
	errorMessage: text("error_message"),
	retryCount: integer("retry_count").default(0),
	lastRetryAt: timestamp("last_retry_at", { mode: 'string' }),
	analytics: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index().using("btree", table.scheduledTime.asc().nullsLast().op("timestamp_ops")),
	index().using("btree", table.socialAccountId.asc().nullsLast().op("text_ops")),
	index().using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.socialAccountId],
			foreignColumns: [socialAccounts.id],
			name: "scheduled_posts_social_account_id_social_accounts_id_fk"
		}),
]);

export const unifiedTags = pgTable("unified_tags", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	category: text().default('general').notNull(),
	platforms: jsonb().default(["facebook","tiktok","instagram"]),
	color: varchar({ length: 7 }).default('#3B82F6').notNull(),
	icon: varchar({ length: 50 }),
	description: text(),
	keywords: jsonb().default([]),
	usageCount: integer("usage_count").default(0),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	isSystemDefault: boolean("is_system_default").default(false),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("unified_tags_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const contentAssets = pgTable("content_assets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	filename: varchar({ length: 255 }).notNull(),
	originalFilename: varchar("original_filename", { length: 255 }).notNull(),
	cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
	cloudinaryUrl: text("cloudinary_url").notNull(),
	cloudinarySecureUrl: text("cloudinary_secure_url").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	fileSize: integer("file_size").notNull(),
	width: integer(),
	height: integer(),
	duration: numeric({ precision: 8, scale:  3 }),
	categoryId: integer("category_id"),
	tags: jsonb().default([]),
	altText: text("alt_text"),
	caption: text(),
	usageCount: integer("usage_count").default(0),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [contentCategories.id],
			name: "content_assets_category_id_content_categories_id_fk"
		}),
	unique("content_assets_cloudinary_public_id_unique").on(table.cloudinaryPublicId),
]);

export const productReviews = pgTable("product_reviews", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	productId: varchar("product_id").notNull(),
	customerId: varchar("customer_id"),
	customerName: text("customer_name").notNull(),
	customerAvatar: text("customer_avatar"),
	rating: integer().notNull(),
	title: text(),
	content: text().notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	isApproved: boolean("is_approved").default(true).notNull(),
	helpfulCount: integer("helpful_count").default(0).notNull(),
	images: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_reviews_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "product_reviews_customer_id_customers_id_fk"
		}),
]);

export const themeConfigurations = pgTable("theme_configurations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	colorPalette: jsonb("color_palette").default({}).notNull(),
	typography: jsonb().default({}).notNull(),
	spacing: jsonb().default({}).notNull(),
	componentStyles: jsonb("component_styles").default({}).notNull(),
	brandGuidelines: jsonb("brand_guidelines").default({}).notNull(),
	accessibility: jsonb().default({}).notNull(),
	psychology: jsonb().default({}).notNull(),
	isTemplate: boolean("is_template").default(false).notNull(),
	industry: text(),
	conversionRate: numeric("conversion_rate", { precision: 5, scale:  2 }),
	createdBy: varchar("created_by"),
	isPublic: boolean("is_public").default(false).notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "theme_configurations_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const productLandingPages = pgTable("product_landing_pages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	description: text(),
	productId: varchar("product_id").notNull(),
	variantId: varchar("variant_id"),
	customPrice: numeric("custom_price", { precision: 15, scale:  2 }),
	originalPrice: numeric("original_price", { precision: 15, scale:  2 }),
	heroTitle: text("hero_title"),
	heroSubtitle: text("hero_subtitle"),
	heroImage: text("hero_image"),
	callToAction: text("call_to_action").default('Đặt hàng ngay'),
	features: jsonb().default([]).notNull(),
	testimonials: jsonb().default([]),
	isActive: boolean("is_active").default(true).notNull(),
	theme: text().default('light').notNull(),
	primaryColor: text("primary_color").default('#007bff').notNull(),
	contactInfo: jsonb("contact_info").default({"email":"","phone":"","businessName":""}).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	orderCount: integer("order_count").default(0).notNull(),
	conversionRate: numeric("conversion_rate", { precision: 5, scale:  2 }).default('0.00').notNull(),
	paymentMethods: jsonb("payment_methods").default({"cod":true,"online":false,"bankTransfer":true}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	themeConfigId: varchar("theme_config_id"),
	advancedThemeConfig: jsonb("advanced_theme_config"),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_landing_pages_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.themeConfigId],
			foreignColumns: [themeConfigurations.id],
			name: "product_landing_pages_theme_config_id_theme_configurations_id_f"
		}).onDelete("set null"),
	unique("product_landing_pages_slug_unique").on(table.slug),
]);

export const pageTags = pgTable("page_tags", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	color: text().default('#3B82F6').notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const facebookMessages = pgTable("facebook_messages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	conversationId: varchar("conversation_id").notNull(),
	facebookMessageId: text("facebook_message_id").notNull(),
	senderId: text("sender_id").notNull(),
	senderName: text("sender_name").notNull(),
	senderType: text("sender_type").notNull(),
	content: text(),
	messageType: text("message_type").default('text').notNull(),
	attachments: jsonb().default([]),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	isEcho: boolean("is_echo").default(false),
	replyToMessageId: text("reply_to_message_id"),
	isRead: boolean("is_read").default(false),
	isDelivered: boolean("is_delivered").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [facebookConversations.id],
			name: "facebook_messages_conversation_id_facebook_conversations_id_fk"
		}).onDelete("cascade"),
	unique("facebook_messages_facebook_message_id_unique").on(table.facebookMessageId),
]);

export const facebookConversations = pgTable("facebook_conversations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	pageId: text("page_id").notNull(),
	pageName: text("page_name").notNull(),
	participantId: text("participant_id").notNull(),
	participantName: text("participant_name").notNull(),
	participantAvatar: text("participant_avatar"),
	status: text().default('active').notNull(),
	priority: text().default('normal').notNull(),
	assignedTo: varchar("assigned_to"),
	tags: jsonb().default([]),
	messageCount: integer("message_count").default(0).notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
	lastMessagePreview: text("last_message_preview"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
});

export const tiktokShopProducts = pgTable("tiktok_shop_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	productId: varchar("product_id"),
	tiktokProductId: text("tiktok_product_id").notNull(),
	shopId: text("shop_id").notNull(),
	businessAccountId: varchar("business_account_id"),
	syncEnabled: boolean("sync_enabled").default(true),
	autoSync: boolean("auto_sync").default(false),
	syncDirection: text("sync_direction").default('to_tiktok'),
	tiktokSku: text("tiktok_sku"),
	tiktokTitle: text("tiktok_title"),
	tiktokDescription: text("tiktok_description"),
	tiktokPrice: numeric("tiktok_price", { precision: 15, scale:  2 }),
	tiktokStock: integer("tiktok_stock"),
	tiktokStatus: text("tiktok_status").default('pending_review'),
	views: integer().default(0),
	orders: integer().default(0),
	revenue: numeric({ precision: 15, scale:  2 }).default('0'),
	conversionRate: numeric("conversion_rate", { precision: 5, scale:  2 }).default('0'),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncStatus: text("sync_status").default('pending'),
	syncError: text("sync_error"),
	tags: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "tiktok_shop_products_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.businessAccountId],
			foreignColumns: [tiktokBusinessAccounts.id],
			name: "tiktok_shop_products_business_account_id_tiktok_business_accoun"
		}),
]);

export const tiktokVideos = pgTable("tiktok_videos", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	videoId: text("video_id").notNull(),
	businessAccountId: varchar("business_account_id").notNull(),
	caption: text(),
	description: text(),
	thumbnailUrl: text("thumbnail_url"),
	videoUrl: text("video_url"),
	duration: integer(),
	views: integer().default(0),
	likes: integer().default(0),
	comments: integer().default(0),
	shares: integer().default(0),
	engagementRate: numeric("engagement_rate", { precision: 5, scale:  2 }).default('0'),
	shopProductsTagged: jsonb("shop_products_tagged").default([]),
	salesFromVideo: numeric("sales_from_video", { precision: 15, scale:  2 }).default('0'),
	clickthroughRate: numeric("clickthrough_rate", { precision: 5, scale:  2 }).default('0'),
	status: text().default('published'),
	tags: jsonb().default([]),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.businessAccountId],
			foreignColumns: [tiktokBusinessAccounts.id],
			name: "tiktok_videos_business_account_id_tiktok_business_accounts_id_f"
		}),
	unique("tiktok_videos_video_id_unique").on(table.videoId),
]);

export const tiktokBusinessAccounts = pgTable("tiktok_business_accounts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	displayName: text("display_name").notNull(),
	username: text().notNull(),
	avatarUrl: text("avatar_url"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	scope: jsonb().default([]),
	businessType: text("business_type"),
	industry: text(),
	website: text(),
	description: text(),
	shopEnabled: boolean("shop_enabled").default(false),
	shopId: text("shop_id"),
	shopStatus: text("shop_status").default('not_connected'),
	followerCount: integer("follower_count").default(0),
	followingCount: integer("following_count").default(0),
	videoCount: integer("video_count").default(0),
	likeCount: integer("like_count").default(0),
	engagement: numeric({ precision: 5, scale:  2 }).default('0'),
	avgViews: integer("avg_views").default(0),
	lastPost: timestamp("last_post", { mode: 'string' }),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	tags: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	connected: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	unique("tiktok_business_accounts_business_id_unique").on(table.businessId),
]);

export const tiktokShopOrders = pgTable("tiktok_shop_orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	tiktokOrderId: text("tiktok_order_id").notNull(),
	shopId: text("shop_id").notNull(),
	businessAccountId: varchar("business_account_id"),
	orderNumber: text("order_number").notNull(),
	status: text().default('pending').notNull(),
	customerInfo: jsonb("customer_info").notNull(),
	totalAmount: numeric("total_amount", { precision: 15, scale:  2 }).notNull(),
	currency: text().default('VND').notNull(),
	taxAmount: numeric("tax_amount", { precision: 15, scale:  2 }).default('0'),
	shippingAmount: numeric("shipping_amount", { precision: 15, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 15, scale:  2 }).default('0'),
	items: jsonb().notNull(),
	fulfillmentStatus: text("fulfillment_status").default('pending'),
	trackingNumber: text("tracking_number"),
	shippingCarrier: text("shipping_carrier"),
	shippedAt: timestamp("shipped_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	paymentMethod: text("payment_method"),
	paymentStatus: text("payment_status"),
	tiktokFees: numeric("tiktok_fees", { precision: 15, scale:  2 }).default('0'),
	tags: jsonb().default([]),
	notes: text(),
	orderDate: timestamp("order_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tagIds: jsonb("tag_ids").default([]),
}, (table) => [
	foreignKey({
			columns: [table.businessAccountId],
			foreignColumns: [tiktokBusinessAccounts.id],
			name: "tiktok_shop_orders_business_account_id_tiktok_business_accounts"
		}),
	unique("tiktok_shop_orders_tiktok_order_id_unique").on(table.tiktokOrderId),
]);
