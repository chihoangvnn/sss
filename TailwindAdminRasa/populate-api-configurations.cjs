#!/usr/bin/env node

/**
 * Script to populate API Management system with all API endpoints
 * Run: node --loader ts-node/esm populate-api-configurations.js
 */

const { db } = require('./server/db');
const { apiConfigurations } = require('./shared/schema');

// Comprehensive API configurations for all system endpoints
const API_CONFIGS = [
  // ==========================================
  // 📚 BOOKS MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/books",
    method: "GET",
    category: "Books Management",
    description: "Retrieve books list with filtering, search, and pagination",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["books", "search", "pagination"]
  },
  {
    endpoint: "/api/books/stats",
    method: "GET", 
    category: "Books Management",
    description: "Get comprehensive books statistics and analytics",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["books", "statistics", "analytics"]
  },
  {
    endpoint: "/api/books/:isbn",
    method: "GET",
    category: "Books Management", 
    description: "Get single book details with all price sources",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["books", "isbn", "details"]
  },
  {
    endpoint: "/api/books",
    method: "POST",
    category: "Books Management",
    description: "Create or update book entry",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["books", "create", "update"]
  },
  {
    endpoint: "/api/books/:isbn/prices",
    method: "POST",
    category: "Books Management",
    description: "Update book price for specific source",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["books", "price", "update"]
  },
  {
    endpoint: "/api/books/:isbn/prices/bulk",
    method: "POST",
    category: "Books Management",
    description: "Bulk update prices from crawler systems",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["books", "bulk", "crawler"]
  },
  {
    endpoint: "/api/books/sources",
    method: "GET",
    category: "Books Management",
    description: "Get available book price sources",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["books", "sources", "reference"]
  },
  {
    endpoint: "/api/books/:isbn",
    method: "DELETE",
    category: "Books Management",
    description: "Delete book and all associated prices",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["books", "delete", "admin"]
  },
  {
    endpoint: "/api/books/:isbn/prices/:priceId",
    method: "DELETE",
    category: "Books Management",
    description: "Delete specific price entry for book",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["books", "price", "delete"]
  },

  // ==========================================
  // 🛍️ CORE BUSINESS APIs
  // ==========================================
  {
    endpoint: "/api/products",
    method: "GET",
    category: "Core Business",
    description: "Get products list with search and filtering",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["products", "search", "core"]
  },
  {
    endpoint: "/api/products/:id",
    method: "GET",
    category: "Core Business",
    description: "Get single product details",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["products", "details", "core"]
  },
  {
    endpoint: "/api/products",
    method: "POST",
    category: "Core Business",
    description: "Create new product",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["products", "create", "admin"]
  },
  {
    endpoint: "/api/products/:id",
    method: "PUT",
    category: "Core Business",
    description: "Update product information",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["products", "update", "admin"]
  },
  {
    endpoint: "/api/products/:id",
    method: "DELETE",
    category: "Core Business",
    description: "Delete product",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["products", "delete", "admin"]
  },
  {
    endpoint: "/api/customers",
    method: "GET",
    category: "Core Business",
    description: "Get customers list with search",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["customers", "search", "core"]
  },
  {
    endpoint: "/api/customers",
    method: "POST",
    category: "Core Business",
    description: "Create new customer",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["customers", "create", "core"]
  },
  {
    endpoint: "/api/orders",
    method: "GET",
    category: "Core Business",
    description: "Get orders list with filtering",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["orders", "list", "core"]
  },
  {
    endpoint: "/api/orders",
    method: "POST",
    category: "Core Business",
    description: "Create new order",
    rateLimitRequests: 60,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["orders", "create", "core"]
  },
  {
    endpoint: "/api/categories",
    method: "GET",
    category: "Core Business",
    description: "Get product categories",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["categories", "reference", "core"]
  },
  {
    endpoint: "/api/industries",
    method: "GET",
    category: "Core Business",
    description: "Get business industries",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["industries", "reference", "core"]
  },

  // ==========================================
  // 🤖 RASA CHATBOT APIs
  // ==========================================
  {
    endpoint: "/api/rasa-management",
    method: "GET",
    category: "RASA Chatbot",
    description: "RASA system management and configuration",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["rasa", "management", "chatbot"]
  },
  {
    endpoint: "/api/rasa/chat",
    method: "POST",
    category: "RASA Chatbot",
    description: "Main RASA chat interaction endpoint",
    rateLimitRequests: 300,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["rasa", "chat", "interaction"]
  },
  {
    endpoint: "/api/rasa/catalogs",
    method: "GET",
    category: "RASA Chatbot",
    description: "Get content catalogs for chatbot",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["rasa", "catalogs", "content"]
  },
  {
    endpoint: "/api/rasa/products/search",
    method: "GET",
    category: "RASA Chatbot",
    description: "Search products for chatbot responses",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["rasa", "products", "search"]
  },
  {
    endpoint: "/api/rasa-industry",
    method: "GET",
    category: "RASA Chatbot",
    description: "Industry-specific RASA configuration",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["rasa", "industry", "config"]
  },

  // ==========================================
  // 📱 SOCIAL MEDIA APIs
  // ==========================================
  {
    endpoint: "/api/facebook-apps",
    method: "GET",
    category: "Social Media",
    description: "Get Facebook app configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["facebook", "apps", "social"]
  },
  {
    endpoint: "/api/facebook-apps",
    method: "POST",
    category: "Social Media",
    description: "Create Facebook app configuration",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["facebook", "apps", "create"]
  },
  {
    endpoint: "/api/auth/facebook",
    method: "GET",
    category: "Social Media",
    description: "Facebook OAuth authentication",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["facebook", "auth", "oauth"]
  },
  {
    endpoint: "/api/posts",
    method: "GET",
    category: "Social Media",
    description: "Get scheduled social media posts",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["posts", "scheduled", "social"]
  },
  {
    endpoint: "/api/posts",
    method: "POST",
    category: "Social Media",
    description: "Create scheduled social media post",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["posts", "create", "social"]
  },

  // ==========================================
  // 🎯 CONTENT MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/content",
    method: "GET",
    category: "Content Management",
    description: "Get content library items",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["content", "library", "management"]
  },
  {
    endpoint: "/api/themes",
    method: "GET",
    category: "Content Management",
    description: "Get available themes",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["themes", "styling", "templates"]
  },
  {
    endpoint: "/api/templates",
    method: "GET",
    category: "Content Management",
    description: "Get content templates",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["templates", "content", "management"]
  },

  // ==========================================
  // 🤖 AI SERVICES APIs
  // ==========================================
  {
    endpoint: "/api/ai/generate-product-descriptions",
    method: "POST",
    category: "AI Services",
    description: "Generate product descriptions using AI",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["ai", "generation", "products"]
  },
  {
    endpoint: "/api/ai/variations",
    method: "POST",
    category: "AI Services",
    description: "Generate content variations using AI",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["ai", "variations", "content"]
  },
  {
    endpoint: "/api/ai/hashtags",
    method: "POST",
    category: "AI Services",
    description: "Generate hashtags using AI",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["ai", "hashtags", "social"]
  },

  // ==========================================
  // 📊 ANALYTICS & MONITORING APIs
  // ==========================================
  {
    endpoint: "/api/analytics",
    method: "GET",
    category: "Analytics",
    description: "Get system analytics and metrics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["analytics", "metrics", "monitoring"]
  },
  {
    endpoint: "/api/limits/status",
    method: "GET",
    category: "Analytics",
    description: "Get API limits and rate limiting status",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["limits", "status", "monitoring"]
  },
  {
    endpoint: "/api/health/check",
    method: "GET",
    category: "Analytics",
    description: "System health check endpoint",
    rateLimitRequests: 500,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["health", "monitoring", "status"]
  },
  {
    endpoint: "/api/health/metrics",
    method: "GET",
    category: "Analytics",
    description: "Get detailed system metrics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["health", "metrics", "system"]
  },

  // ==========================================
  // ⚡ AUTOMATION APIs
  // ==========================================
  {
    endpoint: "/api/automation",
    method: "GET",
    category: "Automation",
    description: "Get automation configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["automation", "config", "workflow"]
  },
  {
    endpoint: "/api/satellites",
    method: "GET",
    category: "Automation",
    description: "Get satellite system configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["satellites", "automation", "management"]
  },
  {
    endpoint: "/api/orchestrator/overview",
    method: "GET",
    category: "Automation",
    description: "Job orchestrator system overview",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["orchestrator", "jobs", "overview"]
  },
  {
    endpoint: "/api/orchestrator/campaigns",
    method: "GET",
    category: "Automation",
    description: "Get active campaigns",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["orchestrator", "campaigns", "management"]
  },
  {
    endpoint: "/api/orchestrator/quick-start",
    method: "POST",
    category: "Automation",
    description: "Quick start automation campaign",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["orchestrator", "quick-start", "campaign"]
  },

  // ==========================================
  // 👥 WORKER MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/workers/status",
    method: "GET",
    category: "Worker Management",
    description: "Get worker status information",
    rateLimitRequests: 200,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["workers", "status", "monitoring"]
  },
  {
    endpoint: "/api/workers/register",
    method: "POST",
    category: "Worker Management",
    description: "Register new worker",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["workers", "register", "management"]
  },
  {
    endpoint: "/api/workers/jobs/pull",
    method: "GET",
    category: "Worker Management",
    description: "Worker job pulling endpoint",
    rateLimitRequests: 1000,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["workers", "jobs", "polling"]
  },
  {
    endpoint: "/api/workers/heartbeat",
    method: "POST",
    category: "Worker Management",
    description: "Worker heartbeat endpoint",
    rateLimitRequests: 2000,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["workers", "heartbeat", "health"]
  },
  {
    endpoint: "/api/regions/stats",
    method: "GET",
    category: "Worker Management",
    description: "Get region assignment statistics",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["regions", "stats", "workers"]
  },
  {
    endpoint: "/api/regions/assign",
    method: "POST",
    category: "Worker Management",
    description: "Assign worker to optimal region",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["regions", "assign", "workers"]
  },

  // ==========================================
  // ❓ FAQ MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/faq-library",
    method: "GET",
    category: "FAQ Management",
    description: "Get FAQ library items",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["faq", "library", "content"]
  },
  {
    endpoint: "/api/faq-assignments",
    method: "GET",
    category: "FAQ Management",
    description: "Get FAQ assignments to content",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["faq", "assignments", "content"]
  },
  {
    endpoint: "/api/product-faqs",
    method: "GET",
    category: "FAQ Management",
    description: "Get product-specific FAQs",
    rateLimitRequests: 150,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["faq", "products", "support"]
  },

  // ==========================================
  // ⭐ REVIEW MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/review-seeding",
    method: "POST",
    category: "Review Management",
    description: "AI-powered review seeding",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["reviews", "ai", "seeding"]
  },
  {
    endpoint: "/api/admin/reviews",
    method: "GET",
    category: "Review Management",
    description: "Admin review management interface",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["reviews", "admin", "management"]
  },
  {
    endpoint: "/api/admin/reviews/bulk-approve",
    method: "POST",
    category: "Review Management",
    description: "Bulk approve reviews",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["reviews", "bulk", "approve"]
  },

  // ==========================================
  // 🔧 INFRASTRUCTURE APIs
  // ==========================================
  {
    endpoint: "/api/ngrok",
    method: "GET",
    category: "Infrastructure",
    description: "Ngrok tunnel configuration",
    rateLimitRequests: 50,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["ngrok", "tunnel", "infrastructure"]
  },
  {
    endpoint: "/api/callbacks",
    method: "POST",
    category: "Infrastructure",
    description: "Job callback and result processing",
    rateLimitRequests: 500,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["callbacks", "jobs", "processing"]
  },

  // ==========================================
  // 🎛️ API MANAGEMENT APIs
  // ==========================================
  {
    endpoint: "/api/api-configurations",
    method: "GET",
    category: "API Management",
    description: "Get API configurations",
    rateLimitRequests: 100,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "normal",
    tags: ["api", "management", "config"]
  },
  {
    endpoint: "/api/api-configurations",
    method: "POST",
    category: "API Management",
    description: "Create API configuration",
    rateLimitRequests: 20,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["api", "management", "create"]
  },
  {
    endpoint: "/api/api-configurations/:id",
    method: "PUT",
    category: "API Management",
    description: "Update API configuration",
    rateLimitRequests: 30,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "high",
    tags: ["api", "management", "update"]
  },
  {
    endpoint: "/api/api-configurations/:id",
    method: "DELETE",
    category: "API Management",
    description: "Delete API configuration",
    rateLimitRequests: 10,
    rateLimitWindowSeconds: 60,
    isEnabled: true,
    priority: "critical",
    tags: ["api", "management", "delete"]
  }
];

async function populateApiConfigurations() {
  console.log("🚀 Starting API configurations population...");
  
  try {
    // Clear existing configurations (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log("🗑️ Clearing existing API configurations...");
      await db.delete(apiConfigurations);
      console.log("✅ Existing configurations cleared");
    }

    let inserted = 0;
    let skipped = 0;

    for (const config of API_CONFIGS) {
      try {
        // Check if configuration already exists
        const existing = await db
          .select()
          .from(apiConfigurations)
          .where(and(
            eq(apiConfigurations.endpoint, config.endpoint),
            eq(apiConfigurations.method, config.method)
          ))
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️ Skipping existing: ${config.method} ${config.endpoint}`);
          skipped++;
          continue;
        }

        // Insert new configuration
        await db.insert(apiConfigurations).values({
          ...config,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accessCount: 0,
          errorCount: 0,
          avgResponseTime: 0
        });

        console.log(`✅ Added: ${config.method} ${config.endpoint} [${config.category}]`);
        inserted++;

      } catch (error) {
        console.error(`❌ Error adding ${config.method} ${config.endpoint}:`, error.message);
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
    }, {});

    console.log("\n📋 Categories Summary:");
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} endpoints`);
    });

    console.log("\n🎉 API Management population completed!");

  } catch (error) {
    console.error("💥 Fatal error during population:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateApiConfigurations()
    .then(() => {
      console.log("✨ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { populateApiConfigurations, API_CONFIGS };