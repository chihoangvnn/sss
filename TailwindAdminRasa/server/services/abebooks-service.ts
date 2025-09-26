import { 
  type AbebooksAccount, 
  type AbebooksListing, 
  type AbebooksSearchHistory,
  type BookCondition,
  BOOK_CONDITIONS 
} from "@shared/schema";

/**
 * 🔄 ABEBOOKS MULTI-ACCOUNT & VENDOR MANAGEMENT SERVICE
 * 
 * Comprehensive AbeBooks integration with:
 * - 📚 Rare & Used Books specialization
 * - 💰 Multi-vendor real-time pricing
 * - 🚚 Per-seller shipping costs
 * - ⭐ Vendor ratings & reputation  
 * - 📷 Book condition details & images
 * - 🔄 Multi-account rotation for rate limiting
 */

interface AbeBooksApiResponse {
  listings: AbebooksListing[];
  totalFound: number;
  searchTime: number;
  accountUsed: string;
}

interface VendorComparison {
  bestPrice: AbebooksListing;
  cheapestWithShipping: AbebooksListing;
  highestRated: AbebooksListing;
  fastestShipping: AbebooksListing;
  localVendors: AbebooksListing[];
  totalVendors: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  conditionSummary: Record<BookCondition, number>;
}

interface AccountRotationStrategy {
  currentAccount: AbebooksAccount;
  nextAccount: AbebooksAccount;
  requestsRemaining: number;
  switchRecommended: boolean;
}

export class AbeBooksMultiAccountService {
  private mockAccounts: AbebooksAccount[] = [
    {
      id: "abe-acc-001",
      accountName: "Primary US Account",
      apiKey: "***PRIMARY_KEY***", 
      clientId: "US_CLIENT_001",
      affiliateTag: "bookstore24-20",
      isActive: true,
      isDefault: true,
      maxRequestsPerMinute: 100,
      targetCountries: ["US", "CA"],
      preferredCurrency: "USD",
      lastUsed: new Date(),
      totalRequests: 15420,
      totalErrors: 23,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date()
    },
    {
      id: "abe-acc-002", 
      accountName: "European Account",
      apiKey: "***EUROPE_KEY***",
      clientId: "EU_CLIENT_002", 
      affiliateTag: "bookstore24-eu",
      isActive: true,
      isDefault: false,
      maxRequestsPerMinute: 75,
      targetCountries: ["UK", "DE", "FR", "IT"],
      preferredCurrency: "EUR",
      lastUsed: new Date(Date.now() - 3600000), // 1 hour ago
      totalRequests: 8930,
      totalErrors: 12,
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date()
    },
    {
      id: "abe-acc-003",
      accountName: "Global Backup",
      apiKey: "***BACKUP_KEY***",
      clientId: "GLOBAL_CLIENT_003",
      affiliateTag: "bookstore24-backup", 
      isActive: true,
      isDefault: false,
      maxRequestsPerMinute: 50,
      targetCountries: ["US", "UK", "AU", "CA"],
      preferredCurrency: "USD",
      lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
      totalRequests: 2340,
      totalErrors: 3,
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date()
    }
  ];

  // Multi-account management methods
  async getActiveAccounts(): Promise<AbebooksAccount[]> {
    return this.mockAccounts.filter(acc => acc.isActive);
  }

  async getDefaultAccount(): Promise<AbebooksAccount> {
    const defaultAcc = this.mockAccounts.find(acc => acc.isDefault && acc.isActive);
    if (!defaultAcc) {
      throw new Error("No default AbeBooks account configured");
    }
    return defaultAcc;
  }

  async rotateAccount(): Promise<AccountRotationStrategy> {
    const activeAccounts = await this.getActiveAccounts();
    const currentAccount = await this.getDefaultAccount();
    
    // Find next account with least recent usage
    const nextAccount = activeAccounts
      .filter(acc => acc.id !== currentAccount.id)
      .sort((a, b) => {
        const aLastUsed = a.lastUsed ? a.lastUsed.getTime() : 0;
        const bLastUsed = b.lastUsed ? b.lastUsed.getTime() : 0;
        return aLastUsed - bLastUsed;
      })[0];

    const requestsUsed = Math.floor(Math.random() * 80) + 10; // Simulate usage
    const requestsRemaining = (currentAccount.maxRequestsPerMinute || 60) - requestsUsed;
    
    return {
      currentAccount,
      nextAccount,
      requestsRemaining,
      switchRecommended: requestsRemaining < 10
    };
  }

  async trackAccountUsage(accountId: string): Promise<void> {
    const account = this.mockAccounts.find(acc => acc.id === accountId);
    if (account) {
      account.lastUsed = new Date();
      account.totalRequests = (account.totalRequests || 0) + 1;
    }
  }

  // 📚 Book search with multi-account support
  async searchBooksByISBN(isbn: string, accountId?: string): Promise<AbeBooksApiResponse> {
    await this.simulateApiDelay();
    
    const account = accountId 
      ? this.mockAccounts.find(acc => acc.id === accountId) || await this.getDefaultAccount()
      : await this.getDefaultAccount();

    await this.trackAccountUsage(account.id);

    // Generate realistic mock listings for the ISBN
    const mockListings = this.generateMockListings(isbn, account.id);
    
    return {
      listings: mockListings,
      totalFound: mockListings.length,
      searchTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
      accountUsed: account.id
    };
  }

  async searchBooks(query: string, filters?: {
    condition?: BookCondition;
    maxPrice?: number;
    country?: string;
    publisher?: string;
  }): Promise<AbeBooksApiResponse> {
    await this.simulateApiDelay();
    
    const account = await this.getDefaultAccount();
    await this.trackAccountUsage(account.id);

    // Simulate search with filters
    let mockListings = this.generateMockListings(`search-${query}`, account.id);
    
    // Apply filters
    if (filters?.condition) {
      mockListings = mockListings.filter(listing => listing.condition === filters.condition);
    }
    if (filters?.maxPrice) {
      mockListings = mockListings.filter(listing => 
        parseFloat(listing.price) <= filters.maxPrice!
      );
    }
    if (filters?.country) {
      mockListings = mockListings.filter(listing => 
        listing.vendorCountry === filters.country
      );
    }

    return {
      listings: mockListings,
      totalFound: mockListings.length,
      searchTime: Math.floor(Math.random() * 800) + 300,
      accountUsed: account.id
    };
  }

  // 💰 Multi-vendor pricing analysis
  async getMultiVendorPricing(isbn: string): Promise<VendorComparison> {
    const response = await this.searchBooksByISBN(isbn);
    const listings = response.listings;

    if (listings.length === 0) {
      throw new Error(`No AbeBooks listings found for ISBN: ${isbn}`);
    }

    // Find best options
    const bestPrice = listings.reduce((best, current) => 
      parseFloat(current.price || "0") < parseFloat(best.price || "0") ? current : best
    );

    const cheapestWithShipping = listings.reduce((best, current) => {
      const bestTotal = parseFloat(best.price || "0") + parseFloat(best.shippingCost || "0");
      const currentTotal = parseFloat(current.price || "0") + parseFloat(current.shippingCost || "0");
      return currentTotal < bestTotal ? current : best;
    });

    const highestRated = listings.reduce((best, current) => {
      const bestRating = parseFloat(best.vendorRating || "0");
      const currentRating = parseFloat(current.vendorRating || "0");
      return currentRating > bestRating ? current : best;
    });

    const fastestShipping = listings.reduce((best, current) => 
      (current.estimatedDeliveryDays || 99) < (best.estimatedDeliveryDays || 99) ? current : best
    );

    const localVendors = listings.filter(listing => listing.vendorIsLocal);

    // Calculate analytics
    const prices = listings.map(l => parseFloat(l.price || "0"));
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const priceRange = { min: Math.min(...prices), max: Math.max(...prices) };

    // Condition summary
    const conditionSummary = listings.reduce((summary, listing) => {
      const condition = listing.condition as BookCondition;
      summary[condition] = (summary[condition] || 0) + 1;
      return summary;
    }, {} as Record<BookCondition, number>);

    return {
      bestPrice,
      cheapestWithShipping,
      highestRated,
      fastestShipping,
      localVendors,
      totalVendors: listings.length,
      averagePrice: Math.round(averagePrice * 100) / 100,
      priceRange,
      conditionSummary
    };
  }

  // 📊 Condition & quality filtering
  async filterByCondition(listings: AbebooksListing[], minCondition: BookCondition): Promise<AbebooksListing[]> {
    const minGrade = BOOK_CONDITIONS[minCondition].grade;
    
    return listings.filter(listing => {
      const listingGrade = BOOK_CONDITIONS[listing.condition as BookCondition]?.grade || 0;
      return listingGrade >= minGrade;
    });
  }

  async getBestValueListings(isbn: string, criteria: {
    maxPrice?: number;
    minCondition?: BookCondition;
    preferLocal?: boolean;
    maxShipping?: number;
  } = {}): Promise<AbebooksListing[]> {
    const response = await this.searchBooksByISBN(isbn);
    let listings = response.listings;

    // Apply filters
    if (criteria.maxPrice) {
      listings = listings.filter(l => parseFloat(l.price || "0") <= criteria.maxPrice!);
    }

    if (criteria.minCondition) {
      listings = await this.filterByCondition(listings, criteria.minCondition);
    }

    if (criteria.preferLocal) {
      const localListings = listings.filter(l => l.vendorIsLocal);
      if (localListings.length > 0) {
        listings = localListings;
      }
    }

    if (criteria.maxShipping) {
      listings = listings.filter(l => parseFloat(l.shippingCost || "0") <= criteria.maxShipping!);
    }

    // Score listings by value (price + shipping + condition + rating)
    return listings
      .map(listing => ({
        ...listing,
        valueScore: this.calculateValueScore(listing)
      }))
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 10); // Top 10 best value
  }

  // 🔄 Private helper methods
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 300) + 100; // 100-400ms realistic API delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateMockListings(isbn: string, accountId: string): AbebooksListing[] {
    const conditions: BookCondition[] = ["New", "Like New", "Very Good", "Good", "Acceptable"];
    const countries = ["US", "UK", "CA", "AU", "DE", "FR"];
    const vendors = [
      { name: "BookWorld International", years: 15, isLocal: false },
      { name: "Rare Books Unlimited", years: 22, isLocal: true },
      { name: "Academic Book Store", years: 8, isLocal: false },
      { name: "The Book Nook", years: 31, isLocal: true },
      { name: "Global Literature Hub", years: 12, isLocal: false },
      { name: "Vintage Pages", years: 18, isLocal: false },
      { name: "University Book Sales", years: 25, isLocal: true }
    ];

    const numListings = Math.floor(Math.random() * 8) + 3; // 3-10 listings
    const basePrice = 15 + Math.random() * 150; // $15-165 base price

    return Array.from({ length: numListings }, (_, index) => {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      // Price varies by condition
      const conditionMultiplier = BOOK_CONDITIONS[condition].grade / 5;
      const price = (basePrice * (0.3 + conditionMultiplier * 0.7)).toFixed(2);
      
      // Shipping varies by country and vendor
      const shippingCost = country === "US" ? 
        (3.99 + Math.random() * 8).toFixed(2) : 
        (8.99 + Math.random() * 15).toFixed(2);

      const vendorRating = (3.2 + Math.random() * 1.8).toFixed(1); // 3.2-5.0
      const totalRatings = Math.floor(Math.random() * 2000) + 50;

      return {
        id: `abe-listing-${isbn}-${index}`,
        bookIsbn: isbn,
        accountId,
        
        // Vendor information  
        vendorId: `vendor-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`,
        vendorName: vendor.name,
        vendorCountry: country,
        vendorCity: this.getRandomCity(country),
        
        // Vendor reputation
        vendorRating,
        vendorTotalRatings: totalRatings,
        vendorYearsSelling: vendor.years,
        vendorIsLocal: vendor.isLocal,
        
        // Book condition
        condition,
        conditionDescription: this.getConditionDescription(condition),
        
        // Pricing
        price,
        currency: country === "UK" ? "GBP" : (country === "DE" || country === "FR" ? "EUR" : "USD"),
        originalPrice: condition === "New" ? null : (parseFloat(price) * 1.2).toFixed(2),
        
        // Shipping details
        shippingCost,
        shippingMethod: Math.random() > 0.7 ? "Express" : "Standard",
        estimatedDeliveryDays: vendor.isLocal ? 
          Math.floor(Math.random() * 3) + 1 : 
          Math.floor(Math.random() * 14) + 5,
        shippingCountries: vendor.isLocal ? ["US"] : ["US", "CA", "UK"],
        
        // Book specifics
        edition: Math.random() > 0.8 ? "1st Edition" : null,
        publisher: this.getRandomPublisher(),
        publicationYear: 1990 + Math.floor(Math.random() * 35),
        language: "English",
        pages: 200 + Math.floor(Math.random() * 600),
        
        // Availability
        quantity: Math.floor(Math.random() * 3) + 1,
        availability: Math.random() > 0.9 ? "Limited" : "In Stock",
        
        // Media and links
        imageUrl: `https://images.example.com/books/${isbn}-${index}.jpg`,
        detailUrl: `https://abebooks.com/book/${isbn}-listing-${index}`,
        abebooksListingId: `ABE${Date.now()}${index}`,
        
        // Performance tracking
        views: Math.floor(Math.random() * 100),
        lastViewed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000) : null,
        
        // Sync tracking
        lastSyncAt: new Date(),
        syncStatus: "active" as const,
        
        // Timestamps
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Last 30 days
        updatedAt: new Date()
      } as AbebooksListing;
    });
  }

  private calculateValueScore(listing: AbebooksListing): number {
    const price = parseFloat(listing.price);
    const shipping = parseFloat(listing.shippingCost);
    const totalCost = price + shipping;
    
    const conditionGrade = BOOK_CONDITIONS[listing.condition as BookCondition]?.grade || 1;
    const vendorRating = parseFloat(listing.vendorRating || "3.0");
    const deliverySpeed = listing.estimatedDeliveryDays || 14;
    
    // Lower cost = higher score, better condition = higher score
    // Better rating = higher score, faster delivery = higher score  
    const costScore = Math.max(0, 100 - totalCost);
    const conditionScore = conditionGrade * 20;
    const ratingScore = vendorRating * 10;
    const speedScore = Math.max(0, 20 - deliverySpeed);
    
    return costScore + conditionScore + ratingScore + speedScore;
  }

  private getConditionDescription(condition: BookCondition): string {
    const descriptions = {
      "New": "Brand new copy, never opened or read",
      "Like New": "Minimal shelf wear, appears unread", 
      "Very Good": "Light reading wear, all pages intact and clean",
      "Good": "Moderate wear consistent with normal use",
      "Acceptable": "Heavy reading wear but complete and readable",
      "Poor": "Significant wear, may have markings or damage"
    };
    return descriptions[condition];
  }

  private getRandomCity(country: string): string {
    const cities = {
      "US": ["New York", "Boston", "Chicago", "San Francisco", "Seattle", "Portland"],
      "UK": ["London", "Edinburgh", "Manchester", "Oxford", "Cambridge"],
      "CA": ["Toronto", "Vancouver", "Montreal", "Calgary"],
      "AU": ["Sydney", "Melbourne", "Brisbane", "Perth"],
      "DE": ["Berlin", "Munich", "Hamburg", "Frankfurt"],
      "FR": ["Paris", "Lyon", "Marseille", "Toulouse"]
    };
    const cityList = cities[country as keyof typeof cities] || ["Unknown City"];
    return cityList[Math.floor(Math.random() * cityList.length)];
  }

  private getRandomPublisher(): string {
    const publishers = [
      "Penguin Random House", "HarperCollins", "Simon & Schuster",
      "Macmillan", "Hachette", "Scholastic", "Pearson",
      "Oxford University Press", "Cambridge University Press",
      "Vintage Books", "Bantam Books", "Dell Publishing"
    ];
    return publishers[Math.floor(Math.random() * publishers.length)];
  }

  // 📊 Analytics and reporting
  async getSearchHistory(accountId?: string, limit: number = 10): Promise<AbebooksSearchHistory[]> {
    // Mock search history
    return Array.from({ length: limit }, (_, index) => ({
      id: `search-${Date.now()}-${index}`,
      accountId: accountId || this.mockAccounts[0].id,
      searchQuery: `Mock search ${index + 1}`,
      searchType: Math.random() > 0.5 ? "isbn" : "title",
      filters: {},
      resultsFound: Math.floor(Math.random() * 50) + 5,
      processingTimeMs: Math.floor(Math.random() * 500) + 100,
      apiResponseTime: Math.floor(Math.random() * 300) + 50,
      isSuccess: Math.random() > 0.1,
      errorMessage: Math.random() > 0.9 ? "Rate limit exceeded" : null,
      searchedAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Last 7 days
    }));
  }

  async getAccountMetrics(accountId: string): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topSearches: string[];
    recentErrors: string[];
  }> {
    const account = this.mockAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    return {
      totalRequests: account.totalRequests || 0,
      successRate: (((account.totalRequests || 0) - (account.totalErrors || 0)) / (account.totalRequests || 1) * 100),
      averageResponseTime: 250 + Math.random() * 200, // 250-450ms
      topSearches: ["Programming Books", "Science Fiction", "History", "Art Books"],
      recentErrors: (account.totalErrors || 0) > 0 ? ["Rate limit exceeded", "API timeout"] : []
    };
  }
}

export const abeBooksService = new AbeBooksMultiAccountService();