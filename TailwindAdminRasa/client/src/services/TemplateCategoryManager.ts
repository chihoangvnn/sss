import { 
  TemplateDefinition, 
  TemplateCategory, 
  TemplateSearchOptions 
} from '@/types/template';

/**
 * 🗂️ Template Category Manager
 * 
 * Manages template organization by categories, industries, and business types
 * Provides curated template collections for different use cases
 */

// Extended Category System
export type BusinessType = 
  | 'ecommerce'           // Online stores, marketplaces
  | 'luxury'              // High-end, premium brands
  | 'business'            // Corporate, professional
  | 'startup'             // Tech startups, modern
  | 'restaurant'          // Food & beverage
  | 'healthcare'          // Medical, wellness
  | 'education'           // Schools, courses
  | 'real-estate'         // Property, housing
  | 'fashion'             // Clothing, accessories
  | 'technology'          // SaaS, tech products
  | 'finance'             // Banking, fintech
  | 'creative'            // Art, design, photography
  | 'travel'              // Tourism, hospitality
  | 'fitness'             // Gym, sports, wellness
  | 'automotive';         // Cars, vehicles

// Template Collection Definitions
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  businessType: BusinessType;
  categories: TemplateCategory[];
  featured: boolean;
  templates: string[]; // Template IDs
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    style: 'modern' | 'classic' | 'elegant' | 'bold' | 'minimal';
  };
  designPrinciples: string[];
  targetAudience: string[];
  useCases: string[];
  metadata: {
    popularity: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeToImplement: string; // e.g., "1-2 hours"
    industry: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
}

// Category Filter Options
export interface CategoryFilterOptions {
  businessType?: BusinessType;
  categories?: TemplateCategory[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  industry?: string[];
  featured?: boolean;
  tags?: string[];
}

class TemplateCategoryManagerService {
  private collections: Map<string, TemplateCollection> = new Map();
  private businessTypeIndex: Map<BusinessType, TemplateCollection[]> = new Map();
  private categoryIndex: Map<TemplateCategory, TemplateCollection[]> = new Map();
  
  constructor() {
    this.initializeCollections();
  }
  
  /**
   * 📋 Get Collections by Business Type
   */
  getCollectionsByBusinessType(businessType: BusinessType): TemplateCollection[] {
    return this.businessTypeIndex.get(businessType) || [];
  }
  
  /**
   * 📂 Get Collections by Template Category
   */
  getCollectionsByCategory(category: TemplateCategory): TemplateCollection[] {
    return this.categoryIndex.get(category) || [];
  }
  
  /**
   * 🔍 Search Collections with Filters
   */
  searchCollections(filters: CategoryFilterOptions = {}): TemplateCollection[] {
    let collections = Array.from(this.collections.values());
    
    // Filter by business type
    if (filters.businessType) {
      collections = collections.filter(collection => 
        collection.businessType === filters.businessType
      );
    }
    
    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      collections = collections.filter(collection =>
        filters.categories!.some(category => 
          collection.categories.includes(category)
        )
      );
    }
    
    // Filter by difficulty
    if (filters.difficulty) {
      collections = collections.filter(collection =>
        collection.metadata.difficulty === filters.difficulty
      );
    }
    
    // Filter by industry
    if (filters.industry && filters.industry.length > 0) {
      collections = collections.filter(collection =>
        filters.industry!.some(industry =>
          collection.metadata.industry.includes(industry)
        )
      );
    }
    
    // Filter by featured
    if (filters.featured !== undefined) {
      collections = collections.filter(collection =>
        collection.featured === filters.featured
      );
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      collections = collections.filter(collection =>
        filters.tags!.some(tag =>
          collection.metadata.tags.includes(tag)
        )
      );
    }
    
    // Sort by popularity
    return collections.sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }
  
  /**
   * ⭐ Get Featured Collections
   */
  getFeaturedCollections(): TemplateCollection[] {
    return Array.from(this.collections.values())
      .filter(collection => collection.featured)
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }
  
  /**
   * 📊 Get Collection by ID
   */
  getCollection(collectionId: string): TemplateCollection | null {
    return this.collections.get(collectionId) || null;
  }
  
  /**
   * 📈 Get Popular Collections by Category
   */
  getPopularCollections(limit: number = 10): TemplateCollection[] {
    return Array.from(this.collections.values())
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity)
      .slice(0, limit);
  }
  
  /**
   * 🎯 Get Recommended Collections
   */
  getRecommendedCollections(
    userPreferences: {
      businessType?: BusinessType;
      industry?: string[];
      experience?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): TemplateCollection[] {
    let collections = Array.from(this.collections.values());
    
    // Weight by business type match
    if (userPreferences.businessType) {
      collections = collections.filter(collection =>
        collection.businessType === userPreferences.businessType
      );
    }
    
    // Weight by industry match
    if (userPreferences.industry && userPreferences.industry.length > 0) {
      collections = collections.filter(collection =>
        userPreferences.industry!.some(industry =>
          collection.metadata.industry.includes(industry)
        )
      );
    }
    
    // Filter by experience level
    if (userPreferences.experience) {
      collections = collections.filter(collection =>
        collection.metadata.difficulty === userPreferences.experience ||
        (userPreferences.experience === 'intermediate' && 
         ['beginner', 'intermediate'].includes(collection.metadata.difficulty))
      );
    }
    
    return collections.sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }
  
  /**
   * 🏷️ Get All Available Tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.collections.forEach(collection => {
      collection.metadata.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
  
  /**
   * 🏢 Get All Industries
   */
  getAllIndustries(): string[] {
    const industries = new Set<string>();
    this.collections.forEach(collection => {
      collection.metadata.industry.forEach(industry => industries.add(industry));
    });
    return Array.from(industries).sort();
  }
  
  /**
   * 🎨 Get Design Styles
   */
  getDesignStyles(): string[] {
    const styles = new Set<string>();
    this.collections.forEach(collection => {
      styles.add(collection.typography.style);
    });
    return Array.from(styles);
  }
  
  // === PRIVATE METHODS ===
  
  private initializeCollections(): void {
    // Initialize with built-in template collections
    this.registerCollection(this.createEcommerceCollection());
    this.registerCollection(this.createLuxuryCollection());
    this.registerCollection(this.createBusinessCollection());
    this.registerCollection(this.createStartupCollection());
    this.registerCollection(this.createRestaurantCollection());
    this.registerCollection(this.createHealthcareCollection());
    this.registerCollection(this.createFashionCollection());
    this.registerCollection(this.createTechnologyCollection());
  }
  
  private registerCollection(collection: TemplateCollection): void {
    this.collections.set(collection.id, collection);
    
    // Update business type index
    if (!this.businessTypeIndex.has(collection.businessType)) {
      this.businessTypeIndex.set(collection.businessType, []);
    }
    this.businessTypeIndex.get(collection.businessType)!.push(collection);
    
    // Update category index
    collection.categories.forEach(category => {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, []);
      }
      this.categoryIndex.get(category)!.push(collection);
    });
  }
  
  // Collection Definitions
  private createEcommerceCollection(): TemplateCollection {
    return {
      id: 'shopee-ecommerce',
      name: 'Shopee E-commerce',
      description: 'Complete e-commerce template collection based on Shopee mobile interface',
      businessType: 'ecommerce',
      categories: ['ecommerce', 'navigation', 'layout', 'feedback'],
      featured: true,
      templates: [
        'shopee-product-card',
        'shopee-mobile-header',
        'shopee-bottom-nav',
        'shopee-live-badge',
        'shopee-freeship-badge',
        'shopee-grid-layout'
      ],
      colorScheme: {
        primary: '#ee4d2d',
        secondary: '#f69113',
        accent: '#ffd700',
        background: '#f5f5f5'
      },
      typography: {
        headingFont: 'Nunito Sans',
        bodyFont: 'Nunito Sans',
        style: 'modern'
      },
      designPrinciples: [
        'Mobile-first responsive design',
        'High contrast for accessibility',
        'Visual hierarchy with badges and indicators',
        'Touch-friendly interactive elements',
        'Vietnamese localization support'
      ],
      targetAudience: [
        'E-commerce businesses',
        'Online marketplaces',
        'Mobile commerce apps',
        'Retail companies',
        'Product catalog sites'
      ],
      useCases: [
        'Product listing pages',
        'Mobile shopping apps',
        'Marketplace interfaces',
        'Product catalogs',
        'Mobile e-commerce sites'
      ],
      metadata: {
        popularity: 95,
        difficulty: 'intermediate',
        timeToImplement: '2-4 hours',
        industry: ['retail', 'ecommerce', 'marketplace'],
        tags: ['mobile', 'responsive', 'shopee', 'product-card', 'badges'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createLuxuryCollection(): TemplateCollection {
    return {
      id: 'luxury-premium',
      name: 'Luxury Premium',
      description: 'Elegant and sophisticated templates for luxury brands and premium products',
      businessType: 'luxury',
      categories: ['ecommerce', 'content', 'layout'],
      featured: true,
      templates: [], // Will be populated with luxury variants
      colorScheme: {
        primary: '#1a1a1a',
        secondary: '#d4af37',
        accent: '#ffffff',
        background: '#fafafa'
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Source Sans Pro',
        style: 'elegant'
      },
      designPrinciples: [
        'Minimalist elegance',
        'Premium typography',
        'Generous white space',
        'Subtle animations',
        'High-quality imagery focus'
      ],
      targetAudience: [
        'Luxury brands',
        'High-end retailers',
        'Premium service providers',
        'Designer boutiques',
        'Exclusive collections'
      ],
      useCases: [
        'Luxury product showcases',
        'Premium brand websites',
        'High-end portfolio sites',
        'Exclusive membership portals',
        'Designer collection pages'
      ],
      metadata: {
        popularity: 78,
        difficulty: 'advanced',
        timeToImplement: '4-6 hours',
        industry: ['luxury', 'fashion', 'jewelry', 'automotive'],
        tags: ['luxury', 'premium', 'elegant', 'minimalist'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createBusinessCollection(): TemplateCollection {
    return {
      id: 'corporate-business',
      name: 'Corporate Business',
      description: 'Professional templates for corporate websites and business applications',
      businessType: 'business',
      categories: ['content', 'navigation', 'form', 'data'],
      featured: false,
      templates: [], // Will be populated with business variants
      colorScheme: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#0ea5e9',
        background: '#ffffff'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        style: 'modern'
      },
      designPrinciples: [
        'Professional appearance',
        'Clean and organized',
        'Data-driven layouts',
        'Enterprise accessibility',
        'Scalable components'
      ],
      targetAudience: [
        'Corporations',
        'Professional services',
        'B2B companies',
        'Enterprise software',
        'Business consultancies'
      ],
      useCases: [
        'Corporate websites',
        'Business dashboards',
        'Professional portfolios',
        'Enterprise applications',
        'B2B platforms'
      ],
      metadata: {
        popularity: 65,
        difficulty: 'intermediate',
        timeToImplement: '3-5 hours',
        industry: ['corporate', 'professional-services', 'enterprise'],
        tags: ['business', 'corporate', 'professional', 'clean'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createStartupCollection(): TemplateCollection {
    return {
      id: 'modern-startup',
      name: 'Modern Startup',
      description: 'Fresh and innovative templates for tech startups and modern businesses',
      businessType: 'startup',
      categories: ['content', 'navigation', 'layout'],
      featured: true,
      templates: [], // Will be populated with startup variants
      colorScheme: {
        primary: '#8b5cf6',
        secondary: '#06b6d4',
        accent: '#f59e0b',
        background: '#fafafa'
      },
      typography: {
        headingFont: 'Space Grotesk',
        bodyFont: 'Inter',
        style: 'bold'
      },
      designPrinciples: [
        'Innovation-focused design',
        'Bold color usage',
        'Modern typography',
        'Interactive elements',
        'Growth-oriented layouts'
      ],
      targetAudience: [
        'Tech startups',
        'SaaS companies',
        'Digital agencies',
        'Innovation labs',
        'Modern brands'
      ],
      useCases: [
        'Startup landing pages',
        'Product launch sites',
        'SaaS applications',
        'Innovation showcases',
        'Modern portfolios'
      ],
      metadata: {
        popularity: 82,
        difficulty: 'intermediate',
        timeToImplement: '2-4 hours',
        industry: ['technology', 'startup', 'saas'],
        tags: ['startup', 'modern', 'tech', 'innovative'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createRestaurantCollection(): TemplateCollection {
    return {
      id: 'restaurant-food',
      name: 'Restaurant & Food',
      description: 'Appetizing templates for restaurants, cafes, and food businesses',
      businessType: 'restaurant',
      categories: ['ecommerce', 'content', 'layout'],
      featured: false,
      templates: [], // Will be populated with restaurant variants
      colorScheme: {
        primary: '#dc2626',
        secondary: '#f59e0b',
        accent: '#16a34a',
        background: '#fffbeb'
      },
      typography: {
        headingFont: 'Merriweather',
        bodyFont: 'Open Sans',
        style: 'classic'
      },
      designPrinciples: [
        'Food photography focus',
        'Warm and inviting colors',
        'Easy menu navigation',
        'Mobile ordering ready',
        'Local business friendly'
      ],
      targetAudience: [
        'Restaurants',
        'Cafes and coffee shops',
        'Food delivery services',
        'Catering businesses',
        'Food bloggers'
      ],
      useCases: [
        'Restaurant websites',
        'Online menus',
        'Food delivery apps',
        'Catering portfolios',
        'Recipe collections'
      ],
      metadata: {
        popularity: 58,
        difficulty: 'beginner',
        timeToImplement: '1-3 hours',
        industry: ['restaurant', 'food-service', 'hospitality'],
        tags: ['restaurant', 'food', 'menu', 'hospitality'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createHealthcareCollection(): TemplateCollection {
    return {
      id: 'healthcare-medical',
      name: 'Healthcare & Medical',
      description: 'Trustworthy templates for healthcare providers and medical services',
      businessType: 'healthcare',
      categories: ['content', 'form', 'navigation'],
      featured: false,
      templates: [], // Will be populated with healthcare variants
      colorScheme: {
        primary: '#0369a1',
        secondary: '#059669',
        accent: '#7c3aed',
        background: '#ffffff'
      },
      typography: {
        headingFont: 'Source Sans Pro',
        bodyFont: 'Source Sans Pro',
        style: 'classic'
      },
      designPrinciples: [
        'Trust and credibility',
        'Accessibility compliant',
        'Clean and clinical',
        'Patient-centered design',
        'Professional appearance'
      ],
      targetAudience: [
        'Healthcare providers',
        'Medical practices',
        'Hospitals and clinics',
        'Health technology',
        'Wellness businesses'
      ],
      useCases: [
        'Medical practice websites',
        'Patient portals',
        'Health information sites',
        'Telehealth platforms',
        'Wellness applications'
      ],
      metadata: {
        popularity: 42,
        difficulty: 'intermediate',
        timeToImplement: '3-5 hours',
        industry: ['healthcare', 'medical', 'wellness'],
        tags: ['healthcare', 'medical', 'professional', 'accessible'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createFashionCollection(): TemplateCollection {
    return {
      id: 'fashion-style',
      name: 'Fashion & Style',
      description: 'Trendy templates for fashion brands and style-focused businesses',
      businessType: 'fashion',
      categories: ['ecommerce', 'content', 'layout'],
      featured: true,
      templates: [], // Will be populated with fashion variants
      colorScheme: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#fefefe'
      },
      typography: {
        headingFont: 'Outfit',
        bodyFont: 'Poppins',
        style: 'modern'
      },
      designPrinciples: [
        'Visual storytelling',
        'Trend-aware design',
        'Image-centric layouts',
        'Social media integration',
        'Style-conscious typography'
      ],
      targetAudience: [
        'Fashion brands',
        'Clothing retailers',
        'Style influencers',
        'Fashion bloggers',
        'Accessory shops'
      ],
      useCases: [
        'Fashion e-commerce',
        'Style portfolios',
        'Brand lookbooks',
        'Fashion blogs',
        'Trend showcases'
      ],
      metadata: {
        popularity: 71,
        difficulty: 'intermediate',
        timeToImplement: '2-4 hours',
        industry: ['fashion', 'retail', 'lifestyle'],
        tags: ['fashion', 'style', 'trendy', 'visual'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  private createTechnologyCollection(): TemplateCollection {
    return {
      id: 'tech-software',
      name: 'Technology & Software',
      description: 'Modern templates for tech companies and software products',
      businessType: 'technology',
      categories: ['content', 'navigation', 'data', 'layout'],
      featured: true,
      templates: [], // Will be populated with tech variants
      colorScheme: {
        primary: '#6366f1',
        secondary: '#14b8a6',
        accent: '#f97316',
        background: '#fafafa'
      },
      typography: {
        headingFont: 'JetBrains Mono',
        bodyFont: 'Inter',
        style: 'modern'
      },
      designPrinciples: [
        'Technical precision',
        'Code-friendly design',
        'Data visualization ready',
        'Developer-focused UX',
        'Scalable architecture'
      ],
      targetAudience: [
        'Software companies',
        'Tech startups',
        'Developer tools',
        'SaaS platforms',
        'Technical services'
      ],
      useCases: [
        'Software landing pages',
        'Developer documentation',
        'API documentation',
        'Tech product showcases',
        'Dashboard interfaces'
      ],
      metadata: {
        popularity: 88,
        difficulty: 'advanced',
        timeToImplement: '4-6 hours',
        industry: ['technology', 'software', 'developer-tools'],
        tags: ['technology', 'software', 'developer', 'technical'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const templateCategoryManager = new TemplateCategoryManagerService();
export default templateCategoryManager;