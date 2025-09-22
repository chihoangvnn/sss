import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { themeConfigurations } from "@shared/schema";
import { eq, like, and, or } from "drizzle-orm";

/**
 * 🎨 Theme Management API Routes
 * 
 * Provides complete CRUD operations for the Theme Repository system
 * Supports filtering, searching, and theme customization
 */

const router = Router();

// 🔒 Authentication middleware  
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }

  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to manage themes.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// Theme validation schemas
const ThemeDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['ecommerce', 'business', 'luxury', 'minimal', 'custom']),
  description: z.string(),
  version: z.string().default('1.0.0'),
  colorPalette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textMuted: z.string(),
    border: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontWeights: z.object({
      light: z.string(),
      normal: z.string(),
      medium: z.string(),
      bold: z.string(),
    }),
    fontSizes: z.object({
      xs: z.string(),
      sm: z.string(),
      base: z.string(),
      lg: z.string(),
      xl: z.string(),
      '2xl': z.string(),
      '3xl': z.string(),
    }),
    lineHeights: z.object({
      tight: z.string(),
      normal: z.string(),
      relaxed: z.string(),
    }),
  }),
  layout: z.object({
    containerMaxWidth: z.string(),
    containerPadding: z.string(),
    sectionSpacing: z.string(),
    gridGap: z.string(),
    borderRadius: z.object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
    }),
  }),
  components: z.object({
    productGrid: z.object({
      layout: z.enum(['2-column', '3-column', '4-column', 'list', 'masonry']),
      cardStyle: z.enum(['shopee', 'minimal', 'luxury', 'business']),
      spacing: z.enum(['tight', 'normal', 'loose']),
      borderRadius: z.string(),
      shadow: z.enum(['none', 'sm', 'md', 'lg']),
    }),
    header: z.object({
      style: z.enum(['shopee', 'minimal', 'business', 'luxury']),
      height: z.string(),
      backgroundColor: z.string(),
      position: z.enum(['sticky', 'fixed', 'static']),
      searchStyle: z.enum(['prominent', 'subtle', 'hidden']),
      showCamera: z.boolean(),
    }),
    navigation: z.object({
      type: z.enum(['bottom', 'top', 'sidebar', 'tabs']),
      style: z.enum(['shopee', 'minimal', 'business']),
      iconStyle: z.enum(['filled', 'outlined', 'rounded']),
      backgroundColor: z.string(),
      activeColor: z.string(),
    }),
    buttons: z.object({
      primary: z.object({
        style: z.enum(['filled', 'outlined', 'ghost', 'gradient']),
        borderRadius: z.string(),
        shadow: z.boolean(),
        animation: z.enum(['none', 'pulse', 'bounce', 'glow']),
      }),
      secondary: z.object({
        style: z.enum(['filled', 'outlined', 'ghost']),
        borderRadius: z.string(),
      }),
    }),
    badges: z.object({
      live: z.object({
        style: z.enum(['shopee', 'minimal', 'modern']),
        backgroundColor: z.string(),
        textColor: z.string(),
        animation: z.boolean(),
      }),
      freeship: z.object({
        style: z.enum(['shopee', 'minimal', 'tag']),
        backgroundColor: z.string(),
        textColor: z.string(),
      }),
      discount: z.object({
        style: z.enum(['percentage', 'amount', 'ribbon']),
        backgroundColor: z.string(),
        textColor: z.string(),
      }),
      voucher: z.object({
        style: z.enum(['ticket', 'rounded', 'sharp']),
        backgroundColor: z.string(),
        textColor: z.string(),
      }),
    }),
  }),
  breakpoints: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string(),
    wide: z.string(),
  }),
  animations: z.object({
    duration: z.object({
      fast: z.string(),
      normal: z.string(),
      slow: z.string(),
    }),
    easing: z.object({
      linear: z.string(),
      easeIn: z.string(),
      easeOut: z.string(),
      easeInOut: z.string(),
    }),
  }),
  platforms: z.array(z.enum(['landing-page', 'storefront', 'mobile-app', 'admin', 'all'])),
  metadata: z.object({
    author: z.string(),
    tags: z.array(z.string()),
    industry: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    usageCount: z.number().default(0),
    rating: z.number().min(0).max(5).default(5),
    preview: z.string(),
  }),
});

/**
 * 📋 GET /api/themes - List all themes with filtering
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      platform,
      search,
      limit = "50",
      offset = "0",
    } = req.query;

    let whereConditions = [];

    // Category filter
    if (category && typeof category === 'string') {
      whereConditions.push(eq(themes.category, category as any));
    }

    // Platform filter (check if platforms array contains the platform)
    if (platform && typeof platform === 'string') {
      whereConditions.push(
        or(
          like(themes.platforms, `%${platform}%`),
          like(themes.platforms, '%all%')
        )
      );
    }

    // Search filter
    if (search && typeof search === 'string') {
      whereConditions.push(
        or(
          like(themes.name, `%${search}%`),
          like(themes.description, `%${search}%`),
          like(themes.tags, `%${search}%`)
        )
      );
    }

    const result = await db
      .select()
      .from(themeConfigurations)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Parse JSON fields
    const parsedThemes = result.map(theme => ({
      ...theme,
      colorPalette: typeof theme.colorPalette === 'string' ? JSON.parse(theme.colorPalette) : theme.colorPalette,
      typography: typeof theme.typography === 'string' ? JSON.parse(theme.typography) : theme.typography,
      layout: typeof theme.layout === 'string' ? JSON.parse(theme.layout) : theme.layout,
      components: typeof theme.components === 'string' ? JSON.parse(theme.components) : theme.components,
      breakpoints: typeof theme.breakpoints === 'string' ? JSON.parse(theme.breakpoints) : theme.breakpoints,
      animations: typeof theme.animations === 'string' ? JSON.parse(theme.animations) : theme.animations,
      platforms: typeof theme.platforms === 'string' ? JSON.parse(theme.platforms) : theme.platforms,
      tags: typeof theme.tags === 'string' ? JSON.parse(theme.tags) : theme.tags,
      industry: typeof theme.industry === 'string' ? JSON.parse(theme.industry) : theme.industry,
    }));

    // Get available categories  
    const allThemes = await db.select().from(themeConfigurations);
    const categories = [...new Set(allThemes.map((t: any) => t.industry || 'ecommerce'))];
    const platforms = ['landing-page', 'storefront', 'mobile-app', 'admin'];

    res.json({
      success: true,
      themes: parsedThemes,
      totalCount: result.length,
      categories,
      platforms,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching themes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch themes",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🎯 GET /api/themes/:id - Get specific theme
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .select()
      .from(themeConfigurations)
      .where(eq(themeConfigurations.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Theme not found"
      });
    }

    const theme = result[0];
    
    // Parse JSON fields
    const parsedTheme = {
      ...theme,
      colorPalette: typeof theme.colorPalette === 'string' ? JSON.parse(theme.colorPalette) : theme.colorPalette,
      typography: typeof theme.typography === 'string' ? JSON.parse(theme.typography) : theme.typography,
      layout: typeof theme.layout === 'string' ? JSON.parse(theme.layout) : theme.layout,
      components: typeof theme.components === 'string' ? JSON.parse(theme.components) : theme.components,
      breakpoints: typeof theme.breakpoints === 'string' ? JSON.parse(theme.breakpoints) : theme.breakpoints,
      animations: typeof theme.animations === 'string' ? JSON.parse(theme.animations) : theme.animations,
      platforms: typeof theme.platforms === 'string' ? JSON.parse(theme.platforms) : theme.platforms,
      tags: typeof theme.tags === 'string' ? JSON.parse(theme.tags) : theme.tags,
      industry: typeof theme.industry === 'string' ? JSON.parse(theme.industry) : theme.industry,
    };

    res.json({
      success: true,
      theme: parsedTheme
    });
  } catch (error) {
    console.error("❌ Error fetching theme:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch theme",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * ✨ POST /api/themes - Create new theme
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const validatedData = ThemeDefinitionSchema.parse(req.body);

    const newTheme = {
      ...validatedData,
      colorPalette: JSON.stringify(validatedData.colorPalette),
      typography: JSON.stringify(validatedData.typography),
      layout: JSON.stringify(validatedData.layout),
      components: JSON.stringify(validatedData.components),
      breakpoints: JSON.stringify(validatedData.breakpoints),
      animations: JSON.stringify(validatedData.animations),
      platforms: JSON.stringify(validatedData.platforms),
      tags: JSON.stringify(validatedData.metadata.tags),
      industry: JSON.stringify(validatedData.metadata.industry),
      author: validatedData.metadata.author,
      usageCount: validatedData.metadata.usageCount,
      rating: validatedData.metadata.rating,
      preview: validatedData.metadata.preview,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(themeConfigurations).values(newTheme).returning();

    res.status(201).json({
      success: true,
      theme: result[0],
      message: `Theme "${validatedData.name}" created successfully`
    });
  } catch (error) {
    console.error("❌ Error creating theme:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create theme",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🔄 PUT /api/themes/:id - Update theme
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = ThemeDefinitionSchema.parse(req.body);

    const updateData = {
      ...validatedData,
      colorPalette: JSON.stringify(validatedData.colorPalette),
      typography: JSON.stringify(validatedData.typography),
      layout: JSON.stringify(validatedData.layout),
      components: JSON.stringify(validatedData.components),
      breakpoints: JSON.stringify(validatedData.breakpoints),
      animations: JSON.stringify(validatedData.animations),
      platforms: JSON.stringify(validatedData.platforms),
      tags: JSON.stringify(validatedData.metadata.tags),
      industry: JSON.stringify(validatedData.metadata.industry),
      author: validatedData.metadata.author,
      usageCount: validatedData.metadata.usageCount,
      rating: validatedData.metadata.rating,
      preview: validatedData.metadata.preview,
      updatedAt: new Date(),
    };

    const result = await db
      .update(themeConfigurations)
      .set(updateData)
      .where(eq(themeConfigurations.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Theme not found"
      });
    }

    res.json({
      success: true,
      theme: result[0],
      message: `Theme "${validatedData.name}" updated successfully`
    });
  } catch (error) {
    console.error("❌ Error updating theme:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update theme",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🗑️ DELETE /api/themes/:id - Delete theme
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(themeConfigurations)
      .where(eq(themeConfigurations.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Theme not found"
      });
    }

    res.json({
      success: true,
      message: `Theme deleted successfully`,
      deletedTheme: result[0]
    });
  } catch (error) {
    console.error("❌ Error deleting theme:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete theme",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 📊 POST /api/themes/:id/track-usage - Track theme usage
 */
router.post("/:id/track-usage", async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    const result = await db
      .update(themeConfigurations)
      .set({
        usageCount: sql`${themeConfigurations.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(themeConfigurations.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Theme not found"
      });
    }

    res.json({
      success: true,
      message: "Usage tracked",
      usageCount: result[0].usageCount
    });
  } catch (error) {
    console.error("❌ Error tracking theme usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track usage",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * ⭐ POST /api/themes/:id/rate - Rate theme
 */
router.post("/:id/rate", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }

    // Get current theme to calculate new average
    const currentTheme = await db
      .select()
      .from(themeConfigurations)
      .where(eq(themeConfigurations.id, id))
      .limit(1);

    if (currentTheme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Theme not found"
      });
    }

    // Simple average calculation (in production, you'd want to store individual ratings)
    const current = currentTheme[0];
    const newRating = (current.rating + rating) / 2;

    const result = await db
      .update(themeConfigurations)
      .set({
        conversionRate: newRating,
        updatedAt: new Date(),
      })
      .where(eq(themeConfigurations.id, id))
      .returning();

    res.json({
      success: true,
      message: "Theme rated successfully",
      newRating: result[0].rating
    });
  } catch (error) {
    console.error("❌ Error rating theme:", error);
    res.status(500).json({
      success: false,
      error: "Failed to rate theme",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;