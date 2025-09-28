import {
  users,
  type User,
  type UpsertUser,
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  getProducts(options: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    search?: string;
  }): Promise<any[]>;
  getProduct(id: string): Promise<any | undefined>;
  getGenres(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Demo book data for testing multi-seller functionality
  private getDemoBooks() {
    return [
      {
        id: 'demo-1',
        title: 'The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
        author: 'Eric Ries',
        price: 28.99,
        cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
        genre_id: 'business',
        stock: 45,
        description: 'Transform your startup approach with validated learning and iterative product development. Eric Ries introduces the Build-Measure-Learn methodology that reduces market risk through scientific experimentation.',
        rating: 4.7,
        publisher: 'Crown Business',
        publication_year: 2021,
        pages: 336,
        language: 'English',
        isbn: '978-0-307-88789-4',
        status: 'active',
        isNew: true,
        isBestseller: true,
        sellers: [
          {
            id: 'seller-1',
            name: 'BookWorld',
            price: 24.99,
            rating: 4.8,
            stock: 25,
            deliveryTime: '2-3 days'
          },
          {
            id: 'seller-2',
            name: 'Academic Books',
            price: 27.50,
            rating: 4.6,
            stock: 18,
            deliveryTime: '1-2 days'
          },
          {
            id: 'seller-3',
            name: 'Business Library',
            price: 28.99,
            rating: 4.9,
            stock: 32,
            deliveryTime: '3-4 days'
          }
        ]
      }
      // Add more demo books as needed
    ];
  }

  private getDemoGenres() {
    return [
      { id: 'all', name: 'All Books', icon: '📚' },
      { id: 'business', name: 'Business & Economics', icon: '📈' },
      { id: 'science', name: 'Science & Technology', icon: '🔬' },
      { id: 'psychology', name: 'Self-Help & Personal Development', icon: '🧠' }
    ];
  }

  // Product operations using demo data
  async getProducts(options: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    search?: string;
  }): Promise<any[]> {
    let books = this.getDemoBooks();
    
    // Filter by category
    if (options.categoryId && options.categoryId !== 'all') {
      books = books.filter(book => book.genre_id === options.categoryId);
    }
    
    // Filter by search
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      books = books.filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    
    return books.slice(offset, offset + limit);
  }

  async getProduct(id: string): Promise<any | undefined> {
    const books = this.getDemoBooks();
    return books.find(book => book.id === id);
  }

  async getGenres(): Promise<any[]> {
    return this.getDemoGenres();
  }
}

// Export storage instance
export const storage = new DatabaseStorage();