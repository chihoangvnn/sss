import { storage } from './server/storage';

// COMPREHENSIVE API configurations for ALL system endpoints
const API_CONFIGS = [
  // ==========================================
  // 📚 BOOKS MANAGEMENT APIs (9 endpoints)
  // ==========================================
  {
    endpoint: "/api/books",
    method: "GET" as const,
    category: "Books Management",
    description: "Retrieve books list with filtering, search, and pagination",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["books", "search", "pagination"]
  },
  {
    endpoint: "/api/books/stats",
    method: "GET" as const,
    category: "Books Management",
    description: "Get comprehensive books statistics and analytics",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["books", "statistics", "analytics"]
  },
  {
    endpoint: "/api/books/:isbn",
    method: "GET" as const,
    category: "Books Management",
    description: "Get single book details with all price sources",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["books", "isbn", "details"]
  },
  {
    endpoint: "/api/books",
    method: "POST" as const,
    category: "Books Management",
    description: "Create or update book entry",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["books", "create", "update"]
  },
  {
    endpoint: "/api/books/:isbn/prices",
    method: "POST" as const,
    category: "Books Management",
    description: "Update book price for specific source",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["books", "price", "update"]
  },
  {
    endpoint: "/api/books/:isbn/prices/bulk",
    method: "POST" as const,
    category: "Books Management",
    description: "Bulk update prices from crawler systems",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["books", "bulk", "crawler"]
  },
  {
    endpoint: "/api/books/sources",
    method: "GET" as const,
    category: "Books Management",
    description: "Get available book price sources",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["books", "sources", "reference"]
  },
  {
    endpoint: "/api/books/:isbn",
    method: "DELETE" as const,
    category: "Books Management",
    description: "Delete book and all associated prices",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["books", "delete", "admin"]
  },
  {
    endpoint: "/api/books/:isbn/prices/:priceId",
    method: "DELETE" as const,
    category: "Books Management",
    description: "Delete specific price entry for book",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["books", "price", "delete"]
  },

  // ==========================================
  // 🛍️ CORE BUSINESS APIs (11 endpoints)
  // ==========================================
  {
    endpoint: "/api/products",
    method: "GET" as const,
    category: "Core Business",
    description: "Get products list with search and filtering",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["products", "search", "core"]
  },
  {
    endpoint: "/api/products/:id",
    method: "GET" as const,
    category: "Core Business",
    description: "Get single product details",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["products", "details", "core"]
  },
  {
    endpoint: "/api/products",
    method: "POST" as const,
    category: "Core Business",
    description: "Create new product",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["products", "create", "admin"]
  },
  {
    endpoint: "/api/products/:id",
    method: "PUT" as const,
    category: "Core Business",
    description: "Update product information",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["products", "update", "admin"]
  },
  {
    endpoint: "/api/products/:id",
    method: "DELETE" as const,
    category: "Core Business",
    description: "Delete product",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["products", "delete", "admin"]
  },
  {
    endpoint: "/api/customers",
    method: "GET" as const,
    category: "Core Business",
    description: "Get customers list with search",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["customers", "search", "core"]
  },
  {
    endpoint: "/api/customers",
    method: "POST" as const,
    category: "Core Business",
    description: "Create new customer",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["customers", "create", "core"]
  },
  {
    endpoint: "/api/orders",
    method: "GET" as const,
    category: "Core Business",
    description: "Get orders list with filtering",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["orders", "list", "core"]
  },
  {
    endpoint: "/api/orders",
    method: "POST" as const,
    category: "Core Business",
    description: "Create new order",
    rateLimitRequests: 60,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["orders", "create", "core"]
  },
  {
    endpoint: "/api/categories",
    method: "GET" as const,
    category: "Core Business",
    description: "Get product categories",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["categories", "reference", "core"]
  },
  {
    endpoint: "/api/industries",
    method: "GET" as const,
    category: "Core Business",
    description: "Get business industries",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["industries", "reference", "core"]
  },

  // ==========================================
  // 🤖 RASA CHATBOT APIs (5 endpoints)
  // ==========================================
  {
    endpoint: "/api/rasa-management",
    method: "GET" as const,
    category: "RASA Chatbot",
    description: "RASA system management and configuration",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["rasa", "management", "chatbot"]
  },
  {
    endpoint: "/api/rasa/chat",
    method: "POST" as const,
    category: "RASA Chatbot",
    description: "Main RASA chat interaction endpoint",
    rateLimitRequests: 300,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["rasa", "chat", "interaction"]
  },
  {
    endpoint: "/api/rasa/catalogs",
    method: "GET" as const,
    category: "RASA Chatbot",
    description: "Get content catalogs for chatbot",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["rasa", "catalogs", "content"]
  },
  {
    endpoint: "/api/rasa/products/search",
    method: "GET" as const,
    category: "RASA Chatbot",
    description: "Search products for chatbot responses",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["rasa", "products", "search"]
  },
  {
    endpoint: "/api/rasa-industry",
    method: "GET" as const,
    category: "RASA Chatbot",
    description: "Industry-specific RASA configuration",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["rasa", "industry", "config"]
  },

  // ==========================================
  // 📱 SOCIAL MEDIA APIs (5 endpoints)
  // ==========================================
  {
    endpoint: "/api/facebook-apps",
    method: "GET" as const,
    category: "Social Media",
    description: "Get Facebook app configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["facebook", "apps", "social"]
  },
  {
    endpoint: "/api/facebook-apps",
    method: "POST" as const,
    category: "Social Media",
    description: "Create Facebook app configuration",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["facebook", "apps", "create"]
  },
  {
    endpoint: "/api/auth/facebook",
    method: "GET" as const,
    category: "Social Media",
    description: "Facebook OAuth authentication",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["facebook", "auth", "oauth"]
  },
  {
    endpoint: "/api/posts",
    method: "GET" as const,
    category: "Social Media",
    description: "Get scheduled social media posts",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["posts", "scheduled", "social"]
  },
  {
    endpoint: "/api/posts",
    method: "POST" as const,
    category: "Social Media",
    description: "Create scheduled social media post",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["posts", "create", "social"]
  },

  // ==========================================
  // 🎯 CONTENT MANAGEMENT APIs (3 endpoints)
  // ==========================================
  {
    endpoint: "/api/content",
    method: "GET" as const,
    category: "Content Management",
    description: "Get content library items",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["content", "library", "management"]
  },
  {
    endpoint: "/api/themes",
    method: "GET" as const,
    category: "Content Management",
    description: "Get available themes",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["themes", "styling", "templates"]
  },
  {
    endpoint: "/api/templates",
    method: "GET" as const,
    category: "Content Management",
    description: "Get content templates",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["templates", "content", "management"]
  },

  // ==========================================
  // 🤖 AI SERVICES APIs (3 endpoints)
  // ==========================================
  {
    endpoint: "/api/ai/generate-product-descriptions",
    method: "POST" as const,
    category: "AI Services",
    description: "Generate product descriptions using AI",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["ai", "generation", "products"]
  },
  {
    endpoint: "/api/ai/variations",
    method: "POST" as const,
    category: "AI Services",
    description: "Generate content variations using AI",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["ai", "variations", "content"]
  },
  {
    endpoint: "/api/ai/hashtags",
    method: "POST" as const,
    category: "AI Services",
    description: "Generate hashtags using AI",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["ai", "hashtags", "social"]
  },

  // ==========================================
  // 📊 ANALYTICS & MONITORING APIs (4 endpoints)
  // ==========================================
  {
    endpoint: "/api/analytics",
    method: "GET" as const,
    category: "Analytics",
    description: "Get system analytics and metrics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["analytics", "metrics", "monitoring"]
  },
  {
    endpoint: "/api/limits/status",
    method: "GET" as const,
    category: "Analytics",
    description: "Get API limits and rate limiting status",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["limits", "status", "monitoring"]
  },
  {
    endpoint: "/api/health/check",
    method: "GET" as const,
    category: "Analytics",
    description: "System health check endpoint",
    rateLimitRequests: 500,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["health", "monitoring", "status"]
  },
  {
    endpoint: "/api/health/metrics",
    method: "GET" as const,
    category: "Analytics",
    description: "Get detailed system metrics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["health", "metrics", "system"]
  },

  // ==========================================
  // ⚡ AUTOMATION APIs (5 endpoints)
  // ==========================================
  {
    endpoint: "/api/automation",
    method: "GET" as const,
    category: "Automation",
    description: "Get automation configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["automation", "config", "workflow"]
  },
  {
    endpoint: "/api/satellites",
    method: "GET" as const,
    category: "Automation",
    description: "Get satellite system configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["satellites", "automation", "management"]
  },
  {
    endpoint: "/api/orchestrator/overview",
    method: "GET" as const,
    category: "Automation",
    description: "Job orchestrator system overview",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["orchestrator", "jobs", "overview"]
  },
  {
    endpoint: "/api/orchestrator/campaigns",
    method: "GET" as const,
    category: "Automation",
    description: "Get active campaigns",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["orchestrator", "campaigns", "management"]
  },
  {
    endpoint: "/api/orchestrator/quick-start",
    method: "POST" as const,
    category: "Automation",
    description: "Quick start automation campaign",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["orchestrator", "quick-start", "campaign"]
  },

  // ==========================================
  // 👥 WORKER MANAGEMENT APIs (6 endpoints)
  // ==========================================
  {
    endpoint: "/api/workers/status",
    method: "GET" as const,
    category: "Worker Management",
    description: "Get worker status information",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["workers", "status", "monitoring"]
  },
  {
    endpoint: "/api/workers/register",
    method: "POST" as const,
    category: "Worker Management",
    description: "Register new worker",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["workers", "register", "management"]
  },
  {
    endpoint: "/api/workers/jobs/pull",
    method: "GET" as const,
    category: "Worker Management",
    description: "Worker job pulling endpoint",
    rateLimitRequests: 1000,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["workers", "jobs", "polling"]
  },
  {
    endpoint: "/api/workers/heartbeat",
    method: "POST" as const,
    category: "Worker Management",
    description: "Worker heartbeat endpoint",
    rateLimitRequests: 2000,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["workers", "heartbeat", "health"]
  },
  {
    endpoint: "/api/regions/stats",
    method: "GET" as const,
    category: "Worker Management",
    description: "Get region assignment statistics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["regions", "stats", "workers"]
  },
  {
    endpoint: "/api/regions/assign",
    method: "POST" as const,
    category: "Worker Management",
    description: "Assign worker to optimal region",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["regions", "assign", "workers"]
  },

  // ==========================================
  // ❓ FAQ MANAGEMENT APIs (3 endpoints)
  // ==========================================
  {
    endpoint: "/api/faq-library",
    method: "GET" as const,
    category: "FAQ Management",
    description: "Get FAQ library items",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["faq", "library", "content"]
  },
  {
    endpoint: "/api/faq-assignments",
    method: "GET" as const,
    category: "FAQ Management",
    description: "Get FAQ assignments to content",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["faq", "assignments", "content"]
  },
  {
    endpoint: "/api/product-faqs",
    method: "GET" as const,
    category: "FAQ Management",
    description: "Get product-specific FAQs",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["faq", "products", "support"]
  },

  // ==========================================
  // ⭐ REVIEW MANAGEMENT APIs (3 endpoints)
  // ==========================================
  {
    endpoint: "/api/review-seeding",
    method: "POST" as const,
    category: "Review Management",
    description: "AI-powered review seeding",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["reviews", "ai", "seeding"]
  },
  {
    endpoint: "/api/admin/reviews",
    method: "GET" as const,
    category: "Review Management",
    description: "Admin review management interface",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["reviews", "admin", "management"]
  },
  {
    endpoint: "/api/admin/reviews/bulk-approve",
    method: "POST" as const,
    category: "Review Management",
    description: "Bulk approve reviews",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["reviews", "bulk", "approve"]
  },

  // ==========================================
  // 🔧 INFRASTRUCTURE APIs (2 endpoints)
  // ==========================================
  {
    endpoint: "/api/ngrok",
    method: "GET" as const,
    category: "Infrastructure",
    description: "Ngrok tunnel configuration",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["ngrok", "tunnel", "infrastructure"]
  },
  {
    endpoint: "/api/callbacks",
    method: "POST" as const,
    category: "Infrastructure",
    description: "Job callback and result processing",
    rateLimitRequests: 500,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["callbacks", "jobs", "processing"]
  },

  // ==========================================
  // 🎛️ API MANAGEMENT APIs (4 endpoints)
  // ==========================================
  {
    endpoint: "/api/api-configurations",
    method: "GET" as const,
    category: "API Management",
    description: "Get API configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal" as const,
    tags: ["api", "management", "config"]
  },
  {
    endpoint: "/api/api-configurations",
    method: "POST" as const,
    category: "API Management",
    description: "Create API configuration",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["api", "management", "create"]
  },
  {
    endpoint: "/api/api-configurations/:id",
    method: "PUT" as const,
    category: "API Management",
    description: "Update API configuration",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high" as const,
    tags: ["api", "management", "update"]
  },
  {
    endpoint: "/api/api-configurations/:id",
    method: "DELETE" as const,
    category: "API Management",
    description: "Delete API configuration",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical" as const,
    tags: ["api", "management", "delete"]
  }
];

export async function populateComprehensiveApiConfigurations() {
  console.log("🚀 Starting COMPREHENSIVE API configurations population...");
  console.log(`📝 Total endpoints to configure: ${API_CONFIGS.length}`);
  
  try {
    let inserted = 0;
    let skipped = 0;

    for (const config of API_CONFIGS) {
      try {
        // Check if configuration already exists
        const existing = await storage.getApiConfigurationByEndpoint(config.endpoint, config.method);

        if (existing) {
          console.log(`⏭️ Skipping existing: ${config.method} ${config.endpoint}`);
          skipped++;
          continue;
        }

        // Insert new configuration
        await storage.createApiConfiguration(config as any);
        console.log(`✅ Added: ${config.method} ${config.endpoint} [${config.category}]`);
        inserted++;

      } catch (error) {
        console.error(`❌ Error adding ${config.method} ${config.endpoint}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n📊 COMPREHENSIVE Population Summary:");
    console.log(`✅ Inserted: ${inserted} configurations`);
    console.log(`⏭️ Skipped: ${skipped} existing configurations`);
    console.log(`📝 Total defined: ${API_CONFIGS.length} configurations`);

    // Display category summary
    const categoryStats = API_CONFIGS.reduce((acc, config) => {
      acc[config.category] = (acc[config.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📋 Categories Summary:");
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} endpoints`);
    });

    console.log("\n🎉 COMPREHENSIVE API Management population completed!");
    return { inserted, skipped, total: API_CONFIGS.length };

  } catch (error) {
    console.error("💥 Fatal error during population:", error);
    throw error;
  }
}

// Export for use in other modules
export { API_CONFIGS };