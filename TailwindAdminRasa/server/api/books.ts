import express from 'express';
import { db } from '../db';
import { books, bookPrices, insertBookSchema, insertBookPriceSchema, type BookWithPrices, type BookPriceSource, BOOK_PRICE_SOURCES } from '../../shared/schema';
import { eq, desc, asc, and, like, or, sql } from 'drizzle-orm';

const router = express.Router();

// Get all books with prices
router.get('/', async (req, res) => {
  try {
    const { search, format, source, sortBy = 'title', sortOrder = 'asc', page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where conditions
    let whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )
      );
    }
    
    if (format && format !== 'all') {
      whereConditions.push(eq(books.format, format));
    }
    
    // Get books with price aggregation
    const booksWithPrices = await db
      .select({
        isbn: books.isbn,
        title: books.title,
        author: books.author,
        format: books.format,
        reviewCount: books.reviewCount,
        averageRating: books.averageRating,
        coverImageUrl: books.coverImageUrl,
        ranking: books.ranking,
        isTopSeller: books.isTopSeller,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
        priceCount: sql<number>`count(${bookPrices.id})::int`,
        lowestPrice: sql<number>`min(${bookPrices.price})::numeric`,
        highestPrice: sql<number>`max(${bookPrices.price})::numeric`,
        averagePrice: sql<number>`avg(${bookPrices.price})::numeric`,
      })
      .from(books)
      .leftJoin(bookPrices, eq(books.isbn, bookPrices.bookIsbn))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(books.isbn)
      .orderBy(sortOrder === 'desc' ? desc(books.title) : asc(books.title))
      .limit(Number(limit))
      .offset(offset);
    
    // Get detailed prices for each book
    const enrichedBooks: BookWithPrices[] = await Promise.all(
      booksWithPrices.map(async (book: any) => {
        const prices = await db
          .select()
          .from(bookPrices)
          .where(eq(bookPrices.bookIsbn, book.isbn))
          .orderBy(asc(bookPrices.price));
        
        const bestPrice = prices.find((p: any) => p.status === 'In Stock') || prices[0];
        
        return {
          ...book,
          prices,
          bestPrice,
          priceRange: book.lowestPrice && book.highestPrice ? 
            `$${book.lowestPrice} - $${book.highestPrice}` : 'N/A'
        };
      })
    );
    
    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    res.json({
      books: enrichedBooks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get statistics - MUST be before /:isbn route
router.get('/stats', async (req, res) => {
  try {
    const stats = await db
      .select({
        totalBooks: sql<number>`count(distinct ${books.isbn})::int`,
        totalPrices: sql<number>`count(${bookPrices.id})::int`,
        topSellersCount: sql<number>`count(*) filter (where ${books.isTopSeller} = true)::int`,
        avgPrice: sql<number>`avg(${bookPrices.price})::numeric`,
        avgRating: sql<number>`avg(${books.averageRating})::numeric`,
      })
      .from(books)
      .leftJoin(bookPrices, eq(books.isbn, bookPrices.bookIsbn));
    
    res.json(stats[0] || {
      totalBooks: 0,
      totalPrices: 0,
      topSellersCount: 0,
      avgPrice: 0,
      avgRating: 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single book with all prices
router.get('/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    const book = await db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn))
      .limit(1);
    
    if (!book.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const prices = await db
      .select()
      .from(bookPrices)
      .where(eq(bookPrices.bookIsbn, isbn))
      .orderBy(asc(bookPrices.price));
    
    const bestPrice = prices.find((p: any) => p.status === 'In Stock') || prices[0];
    
    const bookWithPrices: BookWithPrices = {
      ...book[0],
      prices,
      bestPrice,
      lowestPrice: prices.length > 0 ? Math.min(...prices.map((p: any) => Number(p.price))) : undefined,
      highestPrice: prices.length > 0 ? Math.max(...prices.map((p: any) => Number(p.price))) : undefined,
      averagePrice: prices.length > 0 ? prices.reduce((sum: any, p: any) => sum + Number(p.price), 0) / prices.length : undefined,
    };
    
    res.json(bookWithPrices);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create or update book
router.post('/', async (req, res) => {
  try {
    const bookData = insertBookSchema.parse(req.body);
    
    // Check if book exists
    const existingBook = await db
      .select()
      .from(books)
      .where(eq(books.isbn, bookData.isbn))
      .limit(1);
    
    let result;
    if (existingBook.length > 0) {
      // Update existing book
      result = await db
        .update(books)
        .set({ ...bookData, updatedAt: sql`now()` })
        .where(eq(books.isbn, bookData.isbn))
        .returning();
    } else {
      // Create new book
      result = await db
        .insert(books)
        .values(bookData)
        .returning();
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating/updating book:', error);
    res.status(400).json({ error: 'Invalid book data' });
  }
});

// Update book price for a source
router.post('/:isbn/prices', async (req, res) => {
  try {
    const { isbn } = req.params;
    const priceData = insertBookPriceSchema.parse({
      ...req.body,
      bookIsbn: isbn
    });
    
    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn))
      .limit(1);
    
    if (!book.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Check if price for this source already exists
    const existingPrice = await db
      .select()
      .from(bookPrices)
      .where(and(
        eq(bookPrices.bookIsbn, isbn),
        eq(bookPrices.source, priceData.source)
      ))
      .limit(1);
    
    let result;
    if (existingPrice.length > 0) {
      // Update existing price
      result = await db
        .update(bookPrices)
        .set({ 
          ...priceData, 
          lastUpdatedAt: sql`now()`,
          updatedAt: sql`now()` 
        })
        .where(eq(bookPrices.id, existingPrice[0].id))
        .returning();
    } else {
      // Create new price
      result = await db
        .insert(bookPrices)
        .values(priceData)
        .returning();
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating book price:', error);
    res.status(400).json({ error: 'Invalid price data' });
  }
});

// Bulk update prices for a book (from crawler)
router.post('/:isbn/prices/bulk', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { prices } = req.body;
    
    if (!Array.isArray(prices)) {
      return res.status(400).json({ error: 'Prices must be an array' });
    }
    
    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn))
      .limit(1);
    
    if (!book.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const results = [];
    
    for (const priceUpdate of prices) {
      try {
        const priceData = insertBookPriceSchema.parse({
          ...priceUpdate,
          bookIsbn: isbn
        });
        
        // Check if price for this source already exists
        const existingPrice = await db
          .select()
          .from(bookPrices)
          .where(and(
            eq(bookPrices.bookIsbn, isbn),
            eq(bookPrices.source, priceData.source as any)
          ))
          .limit(1);
        
        let result;
        if (existingPrice.length > 0) {
          // Update existing price
          result = await db
            .update(bookPrices)
            .set({ 
              ...priceData, 
              lastUpdatedAt: sql`now()`,
              updatedAt: sql`now()` 
            })
            .where(eq(bookPrices.id, existingPrice[0].id))
            .returning();
        } else {
          // Create new price
          result = await db
            .insert(bookPrices)
            .values(priceData)
            .returning();
        }
        
        results.push(result[0]);
      } catch (error) {
        console.error(`Error updating price for source ${priceUpdate.source}:`, error);
        results.push({ error: `Failed to update ${priceUpdate.source}` });
      }
    }
    
    res.json({ updated: results });
  } catch (error) {
    console.error('Error bulk updating prices:', error);
    res.status(500).json({ error: 'Failed to bulk update prices' });
  }
});

// Delete book price source
router.delete('/:isbn/prices/:priceId', async (req, res) => {
  try {
    const { isbn, priceId } = req.params;
    
    const result = await db
      .delete(bookPrices)
      .where(and(
        eq(bookPrices.id, priceId),
        eq(bookPrices.bookIsbn, isbn)
      ))
      .returning();
    
    if (!result.length) {
      return res.status(404).json({ error: 'Price not found' });
    }
    
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    console.error('Error deleting price:', error);
    res.status(500).json({ error: 'Failed to delete price' });
  }
});

// Import AbeBooks functionality  
import * as abebooks from './abebooks.js';

// 🔄 ABEBOOKS ENDPOINTS - Multi-Account Management
// Search endpoints
router.get('/abebooks/search/isbn/:isbn', abebooks.searchBooksByISBN);
router.get('/abebooks/search/:query', abebooks.searchBooks);

// Pricing & vendor comparison endpoints
router.get('/abebooks/pricing/:isbn', abebooks.getMultiVendorPricing);
router.get('/abebooks/best-value/:isbn', abebooks.getBestValueListings);

// Condition & quality filtering endpoints
router.get('/abebooks/condition/:condition', abebooks.filterByCondition);

// Account management endpoints
router.get('/abebooks/accounts', abebooks.getActiveAccounts);
router.post('/abebooks/accounts/rotate', abebooks.rotateAccount);
router.get('/abebooks/accounts/:accountId/metrics', abebooks.getAccountMetrics);

// Analytics & history endpoints
router.get('/abebooks/history', abebooks.getSearchHistory);

// Health & status endpoints
router.get('/abebooks/status', abebooks.getServiceStatus);

// Get available price sources
router.get('/sources', (req, res) => {
  res.json(BOOK_PRICE_SOURCES);
});

// Delete book
router.delete('/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    // Delete book (cascades to prices)
    const result = await db
      .delete(books)
      .where(eq(books.isbn, isbn))
      .returning();
    
    if (!result.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;