import { storage } from './server/storage';

// Comprehensive API configurations for all system endpoints
const API_CONFIGS = [
  // ==========================================
  // 📚 BOOKS MANAGEMENT APIs
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
  // 🛍️ CORE BUSINESS APIs
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

  // ==========================================
  // 🤖 RASA CHATBOT APIs
  // ==========================================
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

  // ==========================================
  // 📱 SOCIAL MEDIA APIs
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

  // ==========================================
  // 🤖 AI SERVICES APIs
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

  // ==========================================
  // 📊 ANALYTICS & MONITORING APIs
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

  // ==========================================
  // ⚡ AUTOMATION APIs
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

  // ==========================================
  // 👥 WORKER MANAGEMENT APIs
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

  // ==========================================
  // 🎛️ API MANAGEMENT APIs
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
  }
];

export async function populateApiConfigurations() {
  console.log("🚀 Starting API configurations population...");
  
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

    console.log("\n📊 Population Summary:");
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

    console.log("\n🎉 API Management population completed!");
    return { inserted, skipped, total: API_CONFIGS.length };

  } catch (error) {
    console.error("💥 Fatal error during population:", error);
    throw error;
  }
}

// Export for use in other modules
export { API_CONFIGS };