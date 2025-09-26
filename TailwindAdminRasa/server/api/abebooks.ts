import type { Request, Response } from "express";
import { abeBooksService } from "../services/abebooks-service";
import type { BookCondition } from "@shared/schema";

/**
 * 🔄 ABEBOOKS API ENDPOINTS - Multi-Account Management
 * 
 * Complete AbeBooks integration with:
 * - 📚 Rare & Used Books search
 * - 💰 Multi-vendor pricing comparison  
 * - 🚚 Shipping cost analysis
 * - ⭐ Vendor ratings & reputation
 * - 📷 Book condition details
 * - 🔄 Account rotation management
 */

// 🔍 Search endpoints
export async function searchBooksByISBN(req: Request, res: Response) {
  try {
    const { isbn } = req.params;
    const { accountId } = req.query;

    if (!isbn || isbn.length < 10) {
      return res.status(400).json({ 
        error: "Valid ISBN required (10-13 digits)",
        provided: isbn 
      });
    }

    console.log(`🔍 AbeBooks ISBN search: ${isbn}${accountId ? ` (account: ${accountId})` : ''}`);

    const result = await abeBooksService.searchBooksByISBN(
      isbn, 
      accountId as string
    );

    res.json({
      success: true,
      isbn,
      ...result,
      message: `Found ${result.totalFound} AbeBooks listings from ${result.listings.length} vendors`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks ISBN search error:', error);
    res.status(500).json({ 
      error: "AbeBooks search failed",
      details: error.message 
    });
  }
}

export async function searchBooks(req: Request, res: Response) {
  try {
    const { query } = req.params;
    const { condition, maxPrice, country, publisher } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: "Search query required (minimum 2 characters)" 
      });
    }

    console.log(`🔍 AbeBooks general search: "${query}" with filters:`, {
      condition, maxPrice, country, publisher
    });

    const filters: any = {};
    if (condition) filters.condition = condition as BookCondition;
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    if (country) filters.country = country as string;
    if (publisher) filters.publisher = publisher as string;

    const result = await abeBooksService.searchBooks(query, filters);

    res.json({
      success: true,
      query,
      filters,
      ...result,
      message: `Found ${result.totalFound} listings matching "${query}"`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks general search error:', error);
    res.status(500).json({ 
      error: "AbeBooks search failed",
      details: error.message 
    });
  }
}

// 💰 Pricing & vendor comparison endpoints
export async function getMultiVendorPricing(req: Request, res: Response) {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      return res.status(400).json({ error: "ISBN required" });
    }

    console.log(`💰 AbeBooks multi-vendor pricing for: ${isbn}`);

    const comparison = await abeBooksService.getMultiVendorPricing(isbn);

    res.json({
      success: true,
      isbn,
      vendorComparison: comparison,
      summary: {
        totalVendors: comparison.totalVendors,
        priceRange: comparison.priceRange,
        averagePrice: comparison.averagePrice,
        bestValue: comparison.cheapestWithShipping,
        topRated: comparison.highestRated,
        fastest: comparison.fastestShipping
      },
      message: `Analyzed ${comparison.totalVendors} vendors for best pricing`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks pricing comparison error:', error);
    res.status(500).json({ 
      error: "Pricing comparison failed",
      details: error.message 
    });
  }
}

export async function getBestValueListings(req: Request, res: Response) {
  try {
    const { isbn } = req.params;
    const { 
      maxPrice, 
      minCondition, 
      preferLocal, 
      maxShipping 
    } = req.query;

    if (!isbn) {
      return res.status(400).json({ error: "ISBN required" });
    }

    console.log(`🎯 AbeBooks best value search for: ${isbn}`, {
      maxPrice, minCondition, preferLocal, maxShipping
    });

    const criteria: any = {};
    if (maxPrice) criteria.maxPrice = parseFloat(maxPrice as string);
    if (minCondition) criteria.minCondition = minCondition as BookCondition;
    if (preferLocal) criteria.preferLocal = preferLocal === 'true';
    if (maxShipping) criteria.maxShipping = parseFloat(maxShipping as string);

    const listings = await abeBooksService.getBestValueListings(isbn, criteria);

    res.json({
      success: true,
      isbn,
      criteria,
      bestValueListings: listings,
      count: listings.length,
      message: `Found ${listings.length} best value listings matching criteria`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks best value search error:', error);
    res.status(500).json({ 
      error: "Best value search failed",
      details: error.message 
    });
  }
}

// 📊 Condition & quality filtering endpoints
export async function filterByCondition(req: Request, res: Response) {
  try {
    const { condition } = req.params;
    const { isbn } = req.query;

    if (!condition || !Object.keys(['New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'Poor']).includes(condition)) {
      return res.status(400).json({ 
        error: "Valid condition required", 
        validConditions: ['New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'Poor']
      });
    }

    if (!isbn) {
      return res.status(400).json({ error: "ISBN required" });
    }

    console.log(`📊 AbeBooks condition filter: ${condition} for ISBN ${isbn}`);

    // First get all listings
    const searchResult = await abeBooksService.searchBooksByISBN(isbn as string);
    
    // Then filter by condition
    const filteredListings = await abeBooksService.filterByCondition(
      searchResult.listings, 
      condition as BookCondition
    );

    res.json({
      success: true,
      isbn,
      condition,
      originalCount: searchResult.listings.length,
      filteredCount: filteredListings.length,
      listings: filteredListings,
      message: `Filtered to ${filteredListings.length} listings in "${condition}" condition or better`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks condition filter error:', error);
    res.status(500).json({ 
      error: "Condition filtering failed",
      details: error.message 
    });
  }
}

// 🔄 Account management endpoints
export async function getActiveAccounts(req: Request, res: Response) {
  try {
    console.log('🔄 Getting active AbeBooks accounts');

    const accounts = await abeBooksService.getActiveAccounts();

    // Remove sensitive API keys from response
    const publicAccounts = accounts.map(acc => ({
      ...acc,
      apiKey: '***HIDDEN***'
    }));

    res.json({
      success: true,
      accounts: publicAccounts,
      count: accounts.length,
      message: `${accounts.length} active AbeBooks accounts available`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks accounts fetch error:', error);
    res.status(500).json({ 
      error: "Failed to fetch accounts",
      details: error.message 
    });
  }
}

export async function rotateAccount(req: Request, res: Response) {
  try {
    console.log('🔄 Rotating AbeBooks account');

    const strategy = await abeBooksService.rotateAccount();

    res.json({
      success: true,
      rotation: {
        currentAccount: {
          ...strategy.currentAccount,
          apiKey: '***HIDDEN***'
        },
        nextAccount: {
          ...strategy.nextAccount,
          apiKey: '***HIDDEN***'
        },
        requestsRemaining: strategy.requestsRemaining,
        switchRecommended: strategy.switchRecommended
      },
      message: strategy.switchRecommended 
        ? `Account rotation recommended (${strategy.requestsRemaining} requests remaining)`
        : `Current account has ${strategy.requestsRemaining} requests remaining`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks account rotation error:', error);
    res.status(500).json({ 
      error: "Account rotation failed",
      details: error.message 
    });
  }
}

export async function getAccountMetrics(req: Request, res: Response) {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({ error: "Account ID required" });
    }

    console.log(`📊 Getting metrics for account: ${accountId}`);

    const metrics = await abeBooksService.getAccountMetrics(accountId);

    res.json({
      success: true,
      accountId,
      metrics,
      message: `Retrieved metrics for account ${accountId}`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks account metrics error:', error);
    res.status(500).json({ 
      error: "Failed to get account metrics",
      details: error.message 
    });
  }
}

// 📈 Analytics & history endpoints
export async function getSearchHistory(req: Request, res: Response) {
  try {
    const { accountId } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📈 Getting AbeBooks search history${accountId ? ` for account ${accountId}` : ''}`);

    const history = await abeBooksService.getSearchHistory(
      accountId as string, 
      Math.min(limit, 50) // Max 50 results
    );

    res.json({
      success: true,
      searchHistory: history,
      count: history.length,
      accountId: accountId || 'all',
      message: `Retrieved ${history.length} search history entries`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks search history error:', error);
    res.status(500).json({ 
      error: "Failed to get search history",
      details: error.message 
    });
  }
}

// 🔧 Health & status endpoints
export async function getServiceStatus(req: Request, res: Response) {
  try {
    console.log('🔧 Checking AbeBooks service status');

    const accounts = await abeBooksService.getActiveAccounts();
    const defaultAccount = await abeBooksService.getDefaultAccount();

    const status = {
      serviceActive: true,
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(acc => acc.isActive).length,
      defaultAccountId: defaultAccount.id,
      lastChecked: new Date().toISOString()
    };

    res.json({
      success: true,
      status,
      message: `AbeBooks service operational with ${status.activeAccounts} active accounts`
    });

  } catch (error: any) {
    console.error('❌ AbeBooks service status error:', error);
    res.status(500).json({ 
      error: "Service status check failed",
      details: error.message,
      status: {
        serviceActive: false,
        lastChecked: new Date().toISOString()
      }
    });
  }
}