import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { userTemplates, templateCompilations, projectTemplates, type InsertUserTemplate } from "../../shared/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";

/**
 * 🧩 Template Management API Routes
 * 
 * Provides complete CRUD operations for the Template Repository system
 * Supports category filtering, business type search, and template compilation
 * Enhanced with Template Persistence System for user template save/load functionality
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
      error: "Unauthorized. Please log in to manage templates.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// Template validation schemas
const TemplateDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['ecommerce', 'navigation', 'layout', 'feedback', 'content', 'form', 'data']),
  complexity: z.enum(['simple', 'intermediate', 'advanced']),
  description: z.string(),
  version: z.string().default('1.0.0'),
  frameworks: z.array(z.enum(['react', 'vue', 'angular', 'svelte', 'html'])),
  platforms: z.array(z.enum(['web', 'mobile', 'desktop', 'all'])),
  compatibleThemes: z.array(z.string()),
  requiresTheme: z.boolean().default(false),
  themeOverrides: z.object({
    colorPalette: z.object({
      primary: z.string(),
      secondary: z.string(), 
      accent: z.string(),
      background: z.string(),
      surface: z.string(),
      onSurface: z.string()
    }).optional()
  }).optional(),
  preview: z.object({
    thumbnail: z.string(),
    screenshots: z.array(z.string()),
    liveDemo: z.string().optional()
  }),
  code: z.object({
    react: z.object({
      jsx: z.string(),
      typescript: z.string().optional(),
      dependencies: z.array(z.string()),
      devDependencies: z.array(z.string()).optional()
    }).optional(),
    vue: z.object({
      template: z.string(),
      script: z.string(),
      style: z.string().optional(),
      dependencies: z.array(z.string())
    }).optional(),
    html: z.object({
      html: z.string(),
      css: z.string(),
      javascript: z.string().optional(),
      dependencies: z.array(z.string()).optional()
    }).optional()
  }),
  styles: z.object({
    baseClasses: z.array(z.string()),
    themeAwareClasses: z.array(z.string()).optional(),
    responsiveClasses: z.object({
      mobile: z.array(z.string()).optional(),
      tablet: z.array(z.string()).optional(),
      desktop: z.array(z.string()).optional()
    }).optional(),
    cssVariables: z.array(z.string()).optional(),
    customCSS: z.string().optional(),
    safelist: z.array(z.string()).optional()
  }),
  assets: z.array(z.object({
    type: z.enum(['icon', 'image', 'font', 'video']),
    url: z.string(),
    description: z.string(),
    required: z.boolean().default(false)
  })).optional(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    options: z.array(z.string()).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      custom: z.string().optional()
    }).optional()
  })).optional(),
  slots: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
    defaultContent: z.string().optional()
  })).optional(),
  documentation: z.object({
    description: z.string(),
    usage: z.string(),
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      code: z.string()
    })).optional(),
    notes: z.array(z.string()).optional()
  }),
  dependencies: z.array(z.string()).optional(),
  variants: z.array(z.string()).optional(),
  baseTemplate: z.string().optional(),
  metadata: z.object({
    author: z.string(),
    authorUrl: z.string().optional(),
    license: z.string().default('MIT'),
    tags: z.array(z.string()),
    industry: z.array(z.string()),
    useCase: z.array(z.string()),
    designSystem: z.string().optional(),
    accessibility: z.object({
      level: z.enum(['A', 'AA', 'AAA']),
      features: z.array(z.string())
    }).optional(),
    performance: z.object({
      bundleSize: z.number(), // KB
      renderTime: z.number(), // ms
      score: z.number().min(0).max(100)
    }).optional(),
    seo: z.object({
      structured: z.boolean(),
      semantic: z.boolean(),
      score: z.number().min(0).max(100)
    }).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    usageCount: z.number().default(0),
    rating: z.number().min(0).max(5).default(5),
    downloads: z.number().default(0),
    featured: z.boolean().default(false)
  })
});

const BusinessTypeSchema = z.enum([
  'ecommerce', 'luxury', 'business', 'startup', 'restaurant', 
  'healthcare', 'education', 'real-estate', 'fashion', 'technology',
  'finance', 'creative', 'travel', 'fitness', 'automotive'
]);

// 💾 User Template Persistence Schemas
const UserTemplateCreateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  baseTemplateId: z.string().min(1, "Base template ID is required"),
  customizations: z.object({
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string()
    }).optional(),
    typography: z.object({
      headingFont: z.string(),
      bodyFont: z.string(),
      fontSize: z.enum(['small', 'medium', 'large'])
    }).optional(),
    layout: z.object({
      containerWidth: z.enum(['narrow', 'medium', 'wide', 'full']),
      spacing: z.enum(['tight', 'normal', 'loose']),
      borderRadius: z.enum(['none', 'small', 'medium', 'large'])
    }).optional(),
    responsive: z.object({
      breakpoints: z.array(z.string()),
      mobileFirst: z.boolean()
    }).optional()
  }),
  platforms: z.array(z.enum(['landing-page', 'storefront', 'all'])).default(['all']),
  category: z.string().default('custom'),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

const UserTemplateUpdateSchema = UserTemplateCreateSchema.partial().omit({ baseTemplateId: true });

// In-memory template storage (production would use database)
const templateRegistry = new Map<string, any>();
const templateCollections = new Map<string, any>();

// Initialize built-in templates
function initializeBuiltinTemplates() {
  // This would load templates from TemplateRegistry and TemplateCategoryManager
  console.log('🧩 Initializing built-in template registry...');
  
  // Placeholder for built-in templates - in production this would load from actual registry
  const builtinTemplates = [
    {
      id: 'shopee-product-card',
      name: 'Shopee Product Card',
      category: 'ecommerce',
      complexity: 'intermediate',
      businessType: 'ecommerce',
      frameworks: ['react'],
      platforms: ['web', 'mobile'],
      tags: ['shopee', 'product-card', 'mobile', 'ecommerce']
    },
    {
      id: 'luxury-product-card',
      name: 'Luxury Product Card',
      category: 'ecommerce',
      complexity: 'advanced',
      businessType: 'luxury',
      frameworks: ['react'],
      platforms: ['web'],
      tags: ['luxury', 'premium', 'elegant', 'product-card']
    },
    {
      id: 'business-dashboard-card',
      name: 'Business Dashboard Card',
      category: 'data',
      complexity: 'intermediate',
      businessType: 'business',
      frameworks: ['react'],
      platforms: ['web'],
      tags: ['business', 'dashboard', 'metrics', 'corporate']
    },
    {
      id: 'startup-feature-card',
      name: 'Startup Feature Card',
      category: 'content',
      complexity: 'intermediate',
      businessType: 'startup',
      frameworks: ['react'],
      platforms: ['web'],
      tags: ['startup', 'modern', 'feature', 'gradient']
    }
  ];
  
  builtinTemplates.forEach(template => {
    templateRegistry.set(template.id, template);
  });
  
  console.log(`✅ Loaded ${builtinTemplates.length} built-in templates`);
}

// Initialize on module load
initializeBuiltinTemplates();

/**
 * 📋 GET /api/templates - List all templates with filtering and search
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      businessType,
      platform,
      framework,
      complexity,
      search,
      featured,
      tags,
      industry,
      limit = "50",
      offset = "0",
      sortBy = "popularity", // popularity, rating, newest, name
      sortOrder = "desc"
    } = req.query;

    let templates = Array.from(templateRegistry.values());
    
    // Apply filters
    if (category && typeof category === 'string') {
      templates = templates.filter(t => t.category === category);
    }
    
    if (businessType && typeof businessType === 'string') {
      templates = templates.filter(t => t.businessType === businessType);
    }
    
    if (platform && typeof platform === 'string') {
      templates = templates.filter(t => 
        t.platforms?.includes(platform) || t.platforms?.includes('all')
      );
    }
    
    if (framework && typeof framework === 'string') {
      templates = templates.filter(t => 
        t.frameworks?.includes(framework)
      );
    }
    
    if (complexity && typeof complexity === 'string') {
      templates = templates.filter(t => t.complexity === complexity);
    }
    
    if (featured === 'true') {
      templates = templates.filter(t => t.featured === true);
    }
    
    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(tag => tag.trim());
      templates = templates.filter(t =>
        tagArray.some(tag => t.tags?.includes(tag))
      );
    }
    
    if (industry && typeof industry === 'string') {
      templates = templates.filter(t =>
        t.industry?.includes(industry)
      );
    }
    
    // Search functionality
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      templates = templates.filter(t =>
        t.name?.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Sorting
    templates.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'popularity':
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'newest':
          comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        default:
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    // Pagination
    const startIndex = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    const paginatedTemplates = templates.slice(startIndex, startIndex + limitNum);
    
    // Get available filter options
    const allTemplates = Array.from(templateRegistry.values());
    const categories = Array.from(new Set(allTemplates.map(t => t.category)));
    const businessTypes = Array.from(new Set(allTemplates.map(t => t.businessType)));
    const platforms = ['web', 'mobile', 'desktop'];
    const frameworks = ['react', 'vue', 'angular', 'svelte', 'html'];
    const complexities = ['simple', 'intermediate', 'advanced'];
    
    res.json({
      success: true,
      templates: paginatedTemplates,
      totalCount: templates.length,
      categories,
      businessTypes,
      platforms,
      frameworks,
      complexities,
      pagination: {
        limit: limitNum,
        offset: startIndex,
        hasMore: (startIndex + limitNum) < templates.length,
        totalPages: Math.ceil(templates.length / limitNum),
        currentPage: Math.floor(startIndex / limitNum) + 1
      },
      filters: {
        applied: {
          category,
          businessType,
          platform,
          framework,
          complexity,
          featured,
          tags,
          industry,
          search
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🎯 GET /api/templates/:id - Get specific template with full details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { includeCode = 'true', includeAssets = 'true' } = req.query;
    
    const template = templateRegistry.get(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found"
      });
    }
    
    // Filter response based on query parameters
    let responseTemplate = { ...template };
    
    if (includeCode === 'false') {
      delete responseTemplate.code;
    }
    
    if (includeAssets === 'false') {
      delete responseTemplate.assets;
    }
    
    // Track template view
    template.usageCount = (template.usageCount || 0) + 1;
    
    res.json({
      success: true,
      template: responseTemplate
    });
  } catch (error) {
    console.error("❌ Error fetching template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🔍 GET /api/templates/search/advanced - Advanced template search with AI recommendations
 */
router.get("/search/advanced", async (req, res) => {
  try {
    const {
      query,
      businessType,
      designStyle,
      useCase,
      difficulty,
      hasCharts,
      hasAnimations,
      accessibility,
      limit = "20"
    } = req.query;
    
    let templates = Array.from(templateRegistry.values());
    
    // Advanced filtering
    if (businessType && typeof businessType === 'string') {
      templates = templates.filter(t => t.businessType === businessType);
    }
    
    if (difficulty && typeof difficulty === 'string') {
      templates = templates.filter(t => t.complexity === difficulty);
    }
    
    if (hasCharts === 'true') {
      templates = templates.filter(t => 
        t.tags?.includes('chart') || 
        t.tags?.includes('dashboard') ||
        t.category === 'data'
      );
    }
    
    if (hasAnimations === 'true') {
      templates = templates.filter(t => 
        t.tags?.includes('animation') || 
        t.tags?.includes('gradient') ||
        t.description?.toLowerCase().includes('animation')
      );
    }
    
    if (accessibility && typeof accessibility === 'string') {
      templates = templates.filter(t => 
        t.metadata?.accessibility?.level === accessibility
      );
    }
    
    // AI-powered semantic search (placeholder - would use actual ML in production)
    if (query && typeof query === 'string') {
      const searchTerms = query.toLowerCase().split(' ');
      templates = templates.filter(t => {
        const searchableText = [
          t.name,
          t.description,
          ...(t.tags || []),
          ...(t.useCase || []),
          t.businessType
        ].join(' ').toLowerCase();
        
        return searchTerms.some(term => searchableText.includes(term));
      });
    }
    
    // Sort by relevance score (simplified)
    templates.sort((a, b) => {
      let scoreA = (a.rating || 0) * 0.3 + (a.usageCount || 0) * 0.7;
      let scoreB = (b.rating || 0) * 0.3 + (b.usageCount || 0) * 0.7;
      
      if (a.featured) scoreA += 10;
      if (b.featured) scoreB += 10;
      
      return scoreB - scoreA;
    });
    
    const limitNum = parseInt(limit as string);
    const results = templates.slice(0, limitNum);
    
    res.json({
      success: true,
      templates: results,
      totalCount: results.length,
      query: {
        searchQuery: query,
        filters: {
          businessType,
          designStyle,
          useCase,
          difficulty,
          hasCharts: hasCharts === 'true',
          hasAnimations: hasAnimations === 'true',
          accessibility
        }
      },
      suggestions: templates.length === 0 ? [
        "Try removing some filters",
        "Search for broader terms",
        "Check spelling",
        "Browse by category instead"
      ] : []
    });
  } catch (error) {
    console.error("❌ Error in advanced search:", error);
    res.status(500).json({
      success: false,
      error: "Failed to perform advanced search",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 📦 GET /api/templates/collections - Get template collections by business type
 */
router.get("/collections", async (req, res) => {
  try {
    const { businessType, featured, limit = "10" } = req.query;
    
    // Simulate template collections from TemplateCategoryManager
    const collections = [
      {
        id: 'shopee-ecommerce',
        name: 'Shopee E-commerce',
        description: 'Complete e-commerce template collection based on Shopee mobile interface',
        businessType: 'ecommerce',
        featured: true,
        templateCount: 6,
        popularity: 95,
        colorScheme: {
          primary: '#ee4d2d',
          secondary: '#f69113',
          accent: '#ffd700'
        }
      },
      {
        id: 'luxury-premium',
        name: 'Luxury Premium',
        description: 'Elegant and sophisticated templates for luxury brands',
        businessType: 'luxury',
        featured: true,
        templateCount: 4,
        popularity: 78,
        colorScheme: {
          primary: '#1a1a1a',
          secondary: '#d4af37',
          accent: '#ffffff'
        }
      },
      {
        id: 'modern-startup',
        name: 'Modern Startup',
        description: 'Fresh and innovative templates for tech startups',
        businessType: 'startup',
        featured: true,
        templateCount: 5,
        popularity: 82,
        colorScheme: {
          primary: '#8b5cf6',
          secondary: '#06b6d4',
          accent: '#f59e0b'
        }
      },
      {
        id: 'corporate-business',
        name: 'Corporate Business',
        description: 'Professional templates for corporate websites',
        businessType: 'business',
        featured: false,
        templateCount: 8,
        popularity: 65,
        colorScheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#0ea5e9'
        }
      }
    ];
    
    let filteredCollections = collections;
    
    // Apply filters
    if (businessType && typeof businessType === 'string') {
      filteredCollections = collections.filter(c => c.businessType === businessType);
    }
    
    if (featured === 'true') {
      filteredCollections = filteredCollections.filter(c => c.featured);
    }
    
    // Sort by popularity
    filteredCollections.sort((a, b) => b.popularity - a.popularity);
    
    // Limit results
    const limitNum = parseInt(limit as string);
    filteredCollections = filteredCollections.slice(0, limitNum);
    
    res.json({
      success: true,
      collections: filteredCollections,
      totalCount: filteredCollections.length
    });
  } catch (error) {
    console.error("❌ Error fetching collections:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch collections",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🎨 GET /api/templates/collections/:id - Get specific collection with templates
 */
router.get("/collections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock collection data - in production would use TemplateCategoryManager
    const mockCollections: any = {
      'shopee-ecommerce': {
        id: 'shopee-ecommerce',
        name: 'Shopee E-commerce',
        description: 'Complete e-commerce template collection based on Shopee mobile interface',
        businessType: 'ecommerce',
        featured: true,
        templateIds: ['shopee-product-card', 'shopee-mobile-header', 'shopee-bottom-nav'],
        designPrinciples: [
          'Mobile-first responsive design',
          'High contrast for accessibility',
          'Visual hierarchy with badges',
          'Touch-friendly interactive elements'
        ]
      },
      'luxury-premium': {
        id: 'luxury-premium',
        name: 'Luxury Premium',
        description: 'Elegant and sophisticated templates for luxury brands',
        businessType: 'luxury',
        featured: true,
        templateIds: ['luxury-product-card'],
        designPrinciples: [
          'Minimalist elegance',
          'Premium typography',
          'Generous white space',
          'Subtle animations'
        ]
      }
    };
    
    const collection = mockCollections[id];
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found"
      });
    }
    
    // Get templates in this collection
    const templates = collection.templateIds
      .map((templateId: string) => templateRegistry.get(templateId))
      .filter(Boolean);
    
    res.json({
      success: true,
      collection: {
        ...collection,
        templates,
        templateCount: templates.length
      }
    });
  } catch (error) {
    console.error("❌ Error fetching collection:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch collection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🔧 POST /api/templates/:id/compile - Compile template code for specific framework
 */
router.post("/:id/compile", async (req, res) => {
  try {
    const { id } = req.params;
    const { framework = 'react', theme, customizations } = req.body;
    
    const template = templateRegistry.get(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found"
      });
    }
    
    if (!template.frameworks?.includes(framework)) {
      return res.status(400).json({
        success: false,
        error: `Template does not support ${framework} framework`,
        supportedFrameworks: template.frameworks
      });
    }
    
    // Simulate template compilation
    const compiledCode = {
      framework,
      component: template.code?.[framework] || null,
      styles: template.styles,
      assets: template.assets,
      dependencies: template.code?.[framework]?.dependencies || [],
      devDependencies: template.code?.[framework]?.devDependencies || [],
      customizations: customizations || {},
      appliedTheme: theme || null
    };
    
    // Track compilation
    template.usageCount = (template.usageCount || 0) + 1;
    
    res.json({
      success: true,
      compiled: compiledCode,
      message: `Template compiled successfully for ${framework}`,
      metadata: {
        templateId: id,
        templateName: template.name,
        compiledAt: new Date().toISOString(),
        framework,
        version: template.version
      }
    });
  } catch (error) {
    console.error("❌ Error compiling template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to compile template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * ⭐ POST /api/templates/:id/rate - Rate template
 */
router.post("/:id/rate", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }
    
    const template = templateRegistry.get(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found"
      });
    }
    
    // Simple average calculation (production would store individual ratings)
    const currentRating = template.rating || 5;
    const newRating = (currentRating + rating) / 2;
    
    template.rating = newRating;
    template.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: "Template rated successfully",
      newRating: newRating,
      comment: comment || null
    });
  } catch (error) {
    console.error("❌ Error rating template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to rate template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 📊 POST /api/templates/:id/track-usage - Track template usage
 */
router.post("/:id/track-usage", async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, framework, project } = req.body;
    
    const template = templateRegistry.get(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found"
      });
    }
    
    template.usageCount = (template.usageCount || 0) + 1;
    template.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: "Usage tracked successfully",
      usageCount: template.usageCount,
      tracking: {
        platform: platform || 'unknown',
        framework: framework || 'unknown',
        project: project || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error tracking usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track usage",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 📈 GET /api/templates/analytics/overview - Get template system analytics
 */
router.get("/analytics/overview", requireAuth, async (req, res) => {
  try {
    const templates = Array.from(templateRegistry.values());
    
    const analytics = {
      totalTemplates: templates.length,
      totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
      averageRating: templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length,
      categoryCounts: templates.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
      businessTypeCounts: templates.reduce((acc: any, t) => {
        acc[t.businessType] = (acc[t.businessType] || 0) + 1;
        return acc;
      }, {}),
      popularTemplates: templates
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          name: t.name,
          usageCount: t.usageCount || 0,
          rating: t.rating || 0
        })),
      recentActivity: {
        newTemplates: templates.filter(t => {
          const created = new Date(t.createdAt || 0);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > weekAgo;
        }).length,
        weeklyUsage: Math.floor(Math.random() * 1000) + 500 // Mock data
      }
    };
    
    res.json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error getting analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get analytics",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 💾 USER TEMPLATE PERSISTENCE API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 💾 POST /api/user-templates - Save a new user template
 */
router.post("/user-templates", requireAuth, async (req, res) => {
  try {
    const validatedData = UserTemplateCreateSchema.parse(req.body);
    const userId = (req.session as any)?.userId || 'anonymous';
    
    // Check if base template exists
    const baseTemplate = templateRegistry.get(validatedData.baseTemplateId);
    if (!baseTemplate) {
      return res.status(404).json({
        success: false,
        error: "Base template not found",
        code: "BASE_TEMPLATE_NOT_FOUND"
      });
    }
    
    // Create user template in database
    const insertData: InsertUserTemplate = {
      userId,
      name: validatedData.name,
      description: validatedData.description,
      baseTemplateId: validatedData.baseTemplateId,
      customizations: validatedData.customizations,
      platforms: validatedData.platforms,
      category: validatedData.category,
      isPublic: validatedData.isPublic,
      tags: validatedData.tags,
      usageCount: 0,
      rating: "0.00"
    };
    
    const [userTemplate] = await db.insert(userTemplates).values(insertData).returning();
    
    res.status(201).json({
      success: true,
      template: userTemplate,
      message: "Template saved successfully"
    });
  } catch (error) {
    console.error("❌ Error saving user template:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid template data",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to save template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 📋 GET /api/user-templates - List user's saved templates
 */
router.get("/user-templates", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId || 'anonymous';
    const {
      category,
      platform,
      search,
      isPublic,
      limit = "50",
      offset = "0",
      sortBy = "created", // created, name, usage
      sortOrder = "desc"
    } = req.query;
    
    // Build where conditions
    const conditions = [eq(userTemplates.userId, userId)];
    
    if (category && typeof category === 'string') {
      conditions.push(eq(userTemplates.category, category));
    }
    
    if (platform && typeof platform === 'string') {
      conditions.push(sql`${userTemplates.platforms}::text LIKE '%${platform}%'`);
    }
    
    if (isPublic === 'true') {
      conditions.push(eq(userTemplates.isPublic, true));
    }
    
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(userTemplates.name, `%${search}%`),
          like(userTemplates.description, `%${search}%`)
        )
      );
    }
    
    // Build sort order
    let orderBy;
    switch (sortBy) {
      case 'name':
        orderBy = sortOrder === 'asc' ? userTemplates.name : desc(userTemplates.name);
        break;
      case 'usage':
        orderBy = sortOrder === 'asc' ? userTemplates.usageCount : desc(userTemplates.usageCount);
        break;
      default:
        orderBy = sortOrder === 'asc' ? userTemplates.createdAt : desc(userTemplates.createdAt);
    }
    
    const templates = await db
      .select()
      .from(userTemplates)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      templates,
      totalCount: templates.length,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: templates.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🎯 GET /api/user-templates/:id - Get specific user template
 */
router.get("/user-templates/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.session as any)?.userId || 'anonymous';
    
    const [template] = await db
      .select()
      .from(userTemplates)
      .where(and(
        eq(userTemplates.id, id),
        or(
          eq(userTemplates.userId, userId),
          eq(userTemplates.isPublic, true)
        )
      ));
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found or access denied"
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error("❌ Error fetching user template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * ✏️ PUT /api/user-templates/:id - Update user template
 */
router.put("/user-templates/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.session as any)?.userId || 'anonymous';
    const validatedData = UserTemplateUpdateSchema.parse(req.body);
    
    // Check if template exists and belongs to user
    const [existingTemplate] = await db
      .select()
      .from(userTemplates)
      .where(and(
        eq(userTemplates.id, id),
        eq(userTemplates.userId, userId)
      ));
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: "Template not found or access denied"
      });
    }
    
    // Update template
    const [updatedTemplate] = await db
      .update(userTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(userTemplates.id, id))
      .returning();
    
    res.json({
      success: true,
      template: updatedTemplate,
      message: "Template updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating user template:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid template data",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * 🗑️ DELETE /api/user-templates/:id - Delete user template
 */
router.delete("/user-templates/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.session as any)?.userId || 'anonymous';
    
    // Check if template exists and belongs to user
    const [existingTemplate] = await db
      .select()
      .from(userTemplates)
      .where(and(
        eq(userTemplates.id, id),
        eq(userTemplates.userId, userId)
      ));
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: "Template not found or access denied"
      });
    }
    
    // Delete template
    await db.delete(userTemplates).where(eq(userTemplates.id, id));
    
    res.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting user template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete template",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;