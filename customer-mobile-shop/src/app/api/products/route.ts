import { NextRequest, NextResponse } from 'next/server';

// Demo book data with multi-seller functionality
const demoBooks = [
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
      },
      {
        id: 'seller-4',
        name: 'ReadMore Store',
        price: 31.50,
        rating: 4.5,
        stock: 12,
        deliveryTime: '2-3 days'
      },
      {
        id: 'seller-5',
        name: 'Premium Books',
        price: 32.99,
        rating: 4.7,
        stock: 8,
        deliveryTime: '1-2 days'
      },
      {
        id: 'seller-6',
        name: 'Quick Reads',
        price: 35.99,
        rating: 4.4,
        stock: 15,
        deliveryTime: '4-5 days'
      },
      {
        id: 'seller-7',
        name: 'Study Central',
        price: 36.50,
        rating: 4.3,
        stock: 6,
        deliveryTime: '3-4 days'
      }
    ]
  },
  {
    id: 'demo-2',
    title: 'Think Like a Programmer: An Introduction to Creative Problem Solving',
    author: 'V. Anton Spraul',
    price: 32.95,
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
    genre_id: 'science',
    stock: 60,
    description: 'Develop systematic problem-solving skills through structured programming exercises and real-world challenges. V. Anton Spraul guides you through computational thinking patterns using C++ examples that apply to any programming language.',
    rating: 4.5,
    publisher: 'No Starch Press',
    publication_year: 2020,
    pages: 260,
    language: 'English',
    isbn: '978-1-59327-424-5',
    status: 'active',
    isRecommended: true,
    sellers: [
      {
        id: 'seller-4',
        name: 'TechBooks Plus',
        price: 29.95,
        rating: 4.7,
        stock: 40,
        deliveryTime: '1-2 days'
      },
      {
        id: 'seller-1',
        name: 'BookWorld',
        price: 32.95,
        rating: 4.8,
        stock: 20,
        deliveryTime: '2-3 days'
      },
      {
        id: 'seller-5',
        name: 'Code Academy Store',
        price: 35.50,
        rating: 4.6,
        stock: 15,
        deliveryTime: '3-4 days'
      }
    ]
  },
  {
    id: 'demo-3',
    title: 'The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness',
    author: 'Morgan Housel',
    price: 16.99,
    cover_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop',
    genre_id: 'psychology',
    stock: 85,
    description: 'Discover how psychology drives financial decisions and learn 19 short stories that reveal the strange ways people think about money. Morgan Housel shares timeless lessons about wealth, greed, and happiness.',
    rating: 4.8,
    publisher: 'Harriman House',
    publication_year: 2020,
    pages: 256,
    language: 'English',
    isbn: '978-0-85719-897-4',
    status: 'active',
    isBestseller: true,
    sellers: [
      {
        id: 'seller-6',
        name: 'Finance Bookshelf',
        price: 14.99,
        rating: 4.9,
        stock: 50,
        deliveryTime: '1-2 days'
      },
      {
        id: 'seller-2',
        name: 'Academic Books',
        price: 16.99,
        rating: 4.6,
        stock: 30,
        deliveryTime: '2-3 days'
      },
      {
        id: 'seller-7',
        name: 'Wisdom Library',
        price: 18.50,
        rating: 4.5,
        stock: 25,
        deliveryTime: '3-5 days'
      },
      {
        id: 'seller-3',
        name: 'Business Library',
        price: 19.95,
        rating: 4.9,
        stock: 35,
        deliveryTime: '2-4 days'
      }
    ]
  },
  {
    id: 'demo-4',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    price: 42.99,
    cover_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop',
    genre_id: 'science',
    stock: 35,
    description: 'Learn the principles of clean code from Uncle Bob. This handbook teaches agile software craftsmanship through practical examples and proven techniques for writing maintainable, readable code.',
    rating: 4.6,
    publisher: 'Prentice Hall',
    publication_year: 2008,
    pages: 464,
    language: 'English',
    isbn: '978-0-13-235088-4',
    status: 'active',
    isFeatured: true,
    sellers: [
      {
        id: 'seller-4',
        name: 'TechBooks Plus',
        price: 38.99,
        rating: 4.7,
        stock: 20,
        deliveryTime: '1-2 days'
      },
      {
        id: 'seller-8',
        name: 'Developer Resources',
        price: 41.50,
        rating: 4.8,
        stock: 12,
        deliveryTime: '2-3 days'
      },
      {
        id: 'seller-1',
        name: 'BookWorld',
        price: 42.99,
        rating: 4.8,
        stock: 18,
        deliveryTime: '2-3 days'
      },
      {
        id: 'seller-5',
        name: 'Code Academy Store',
        price: 45.99,
        rating: 4.6,
        stock: 8,
        deliveryTime: '3-4 days'
      },
      {
        id: 'seller-9',
        name: 'Programming Hub',
        price: 47.50,
        rating: 4.4,
        stock: 15,
        deliveryTime: '4-5 days'
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    
    let books = [...demoBooks];
    
    // Filter by category
    if (categoryId && categoryId !== 'all') {
      books = books.filter(book => book.genre_id === categoryId);
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      books = books.filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const paginatedBooks = books.slice(offset, offset + limit);
    
    return NextResponse.json(paginatedBooks);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}