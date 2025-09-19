-- Create unified_tags table
CREATE TABLE IF NOT EXISTS unified_tags (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug varchar(100) NOT NULL,
  category text NOT NULL DEFAULT 'general',
  platforms jsonb DEFAULT '["facebook", "tiktok", "instagram"]'::jsonb,
  color varchar(7) NOT NULL DEFAULT '#3B82F6',
  icon varchar(50),
  description text,
  keywords jsonb DEFAULT '[]'::jsonb,
  usage_count integer DEFAULT 0,
  last_used timestamp,
  is_system_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Add unique constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS unified_tags_slug_unique ON unified_tags(slug);

-- Add tag_ids columns to all tables
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE facebook_conversations ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tiktok_business_accounts ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tiktok_shop_orders ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tiktok_shop_products ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tiktok_videos ADD COLUMN IF NOT EXISTS tag_ids jsonb DEFAULT '[]'::jsonb;
