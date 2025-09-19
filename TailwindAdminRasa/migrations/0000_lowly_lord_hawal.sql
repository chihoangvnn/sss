-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "storefront_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"top_products_count" integer DEFAULT 10 NOT NULL,
	"display_mode" text DEFAULT 'auto' NOT NULL,
	"selected_product_ids" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"theme" text DEFAULT 'organic' NOT NULL,
	"primary_color" text DEFAULT '#4ade80' NOT NULL,
	"contact_info" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "storefront_config_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"source" text DEFAULT 'admin' NOT NULL,
	"source_order_id" text,
	"source_reference" text,
	"sync_status" text DEFAULT 'manual' NOT NULL,
	"sync_data" jsonb,
	"source_customer_info" jsonb,
	CONSTRAINT "orders_source_source_order_id_unique" UNIQUE("source","source_order_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(15, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"category_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"sku" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"videos" jsonb DEFAULT '[]'::jsonb,
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"method" text DEFAULT 'qr_code' NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"qr_code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"bank_info" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "storefront_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storefront_config_id" varchar NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_address" text,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"delivery_type" text DEFAULT 'local_delivery' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"name" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"followers" integer DEFAULT 0,
	"connected" boolean DEFAULT false,
	"last_post" timestamp,
	"engagement" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"refresh_token" text,
	"token_expires_at" timestamp,
	"page_access_tokens" jsonb DEFAULT '[]'::jsonb,
	"webhook_subscriptions" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"last_sync" timestamp,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"industry_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"avatar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"join_date" timestamp DEFAULT now(),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "chatbot_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar,
	"session_id" text NOT NULL,
	"messages" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"satisfaction_rating" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caption" text NOT NULL,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"asset_ids" jsonb DEFAULT '[]'::jsonb,
	"social_account_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Ho_Chi_Minh',
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"platform_post_id" varchar(255),
	"platform_url" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"last_retry_at" timestamp,
	"analytics" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unified_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"platforms" jsonb DEFAULT '["facebook","tiktok","instagram"]'::jsonb,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"icon" varchar(50),
	"description" text,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"is_system_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"cloudinary_public_id" varchar(255) NOT NULL,
	"cloudinary_url" text NOT NULL,
	"cloudinary_secure_url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration" numeric(8, 3),
	"category_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"alt_text" text,
	"caption" text,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "content_assets_cloudinary_public_id_unique" UNIQUE("cloudinary_public_id")
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"customer_id" varchar,
	"customer_name" text NOT NULL,
	"customer_avatar" text,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color_palette" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"typography" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"spacing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"component_styles" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brand_guidelines" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"accessibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"psychology" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"industry" text,
	"conversion_rate" numeric(5, 2),
	"created_by" varchar,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_landing_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"product_id" varchar NOT NULL,
	"variant_id" varchar,
	"custom_price" numeric(15, 2),
	"original_price" numeric(15, 2),
	"hero_title" text,
	"hero_subtitle" text,
	"hero_image" text,
	"call_to_action" text DEFAULT 'Đặt hàng ngay',
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"testimonials" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"primary_color" text DEFAULT '#007bff' NOT NULL,
	"contact_info" jsonb DEFAULT '{"email":"","phone":"","businessName":""}'::jsonb NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"conversion_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"payment_methods" jsonb DEFAULT '{"cod":true,"online":false,"bankTransfer":true}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"theme_config_id" varchar,
	"advanced_theme_config" jsonb,
	CONSTRAINT "product_landing_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facebook_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"facebook_message_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_type" text NOT NULL,
	"content" text,
	"message_type" text DEFAULT 'text' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"timestamp" timestamp NOT NULL,
	"is_echo" boolean DEFAULT false,
	"reply_to_message_id" text,
	"is_read" boolean DEFAULT false,
	"is_delivered" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "facebook_messages_facebook_message_id_unique" UNIQUE("facebook_message_id")
);
--> statement-breakpoint
CREATE TABLE "facebook_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" text NOT NULL,
	"page_name" text NOT NULL,
	"participant_id" text NOT NULL,
	"participant_name" text NOT NULL,
	"participant_avatar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"assigned_to" varchar,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "tiktok_shop_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"tiktok_product_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"business_account_id" varchar,
	"sync_enabled" boolean DEFAULT true,
	"auto_sync" boolean DEFAULT false,
	"sync_direction" text DEFAULT 'to_tiktok',
	"tiktok_sku" text,
	"tiktok_title" text,
	"tiktok_description" text,
	"tiktok_price" numeric(15, 2),
	"tiktok_stock" integer,
	"tiktok_status" text DEFAULT 'pending_review',
	"views" integer DEFAULT 0,
	"orders" integer DEFAULT 0,
	"revenue" numeric(15, 2) DEFAULT '0',
	"conversion_rate" numeric(5, 2) DEFAULT '0',
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	"sync_error" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "tiktok_videos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" text NOT NULL,
	"business_account_id" varchar NOT NULL,
	"caption" text,
	"description" text,
	"thumbnail_url" text,
	"video_url" text,
	"duration" integer,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"shop_products_tagged" jsonb DEFAULT '[]'::jsonb,
	"sales_from_video" numeric(15, 2) DEFAULT '0',
	"clickthrough_rate" numeric(5, 2) DEFAULT '0',
	"status" text DEFAULT 'published',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "tiktok_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "tiktok_business_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" text NOT NULL,
	"display_name" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scope" jsonb DEFAULT '[]'::jsonb,
	"business_type" text,
	"industry" text,
	"website" text,
	"description" text,
	"shop_enabled" boolean DEFAULT false,
	"shop_id" text,
	"shop_status" text DEFAULT 'not_connected',
	"follower_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"video_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"engagement" numeric(5, 2) DEFAULT '0',
	"avg_views" integer DEFAULT 0,
	"last_post" timestamp,
	"last_sync" timestamp,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"connected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "tiktok_business_accounts_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "tiktok_shop_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiktok_order_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"business_account_id" varchar,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_info" jsonb NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'VND' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"shipping_amount" numeric(15, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"items" jsonb NOT NULL,
	"fulfillment_status" text DEFAULT 'pending',
	"tracking_number" text,
	"shipping_carrier" text,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"payment_method" text,
	"payment_status" text,
	"tiktok_fees" numeric(15, 2) DEFAULT '0',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"order_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tag_ids" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "tiktok_shop_orders_tiktok_order_id_unique" UNIQUE("tiktok_order_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_storefront_config_id_storefront_config_id_fk" FOREIGN KEY ("storefront_config_id") REFERENCES "public"."storefront_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_configurations" ADD CONSTRAINT "theme_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_landing_pages" ADD CONSTRAINT "product_landing_pages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_landing_pages" ADD CONSTRAINT "product_landing_pages_theme_config_id_theme_configurations_id_f" FOREIGN KEY ("theme_config_id") REFERENCES "public"."theme_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_messages" ADD CONSTRAINT "facebook_messages_conversation_id_facebook_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."facebook_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_shop_products" ADD CONSTRAINT "tiktok_shop_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_shop_products" ADD CONSTRAINT "tiktok_shop_products_business_account_id_tiktok_business_accoun" FOREIGN KEY ("business_account_id") REFERENCES "public"."tiktok_business_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_videos" ADD CONSTRAINT "tiktok_videos_business_account_id_tiktok_business_accounts_id_f" FOREIGN KEY ("business_account_id") REFERENCES "public"."tiktok_business_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_shop_orders" ADD CONSTRAINT "tiktok_shop_orders_business_account_id_tiktok_business_accounts" FOREIGN KEY ("business_account_id") REFERENCES "public"."tiktok_business_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_posts_scheduled_time_index" ON "scheduled_posts" USING btree ("scheduled_time" timestamp_ops);--> statement-breakpoint
CREATE INDEX "scheduled_posts_social_account_id_index" ON "scheduled_posts" USING btree ("social_account_id" text_ops);--> statement-breakpoint
CREATE INDEX "scheduled_posts_status_index" ON "scheduled_posts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unified_tags_slug_unique" ON "unified_tags" USING btree ("slug" text_ops);
*/