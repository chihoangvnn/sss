'use client'

import React, { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ShoppingCart, User, ArrowLeft, Plus, Minus, Store, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorefrontBottomNav } from '@/components/StorefrontBottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { AutoHideSearchBar } from '@/components/AutoHideSearchBar';
import { HiddenSearchBar } from '@/components/HiddenSearchBar';
import { FullScreenLunarCalendar } from '@/components/FullScreenLunarCalendar';
import { MediaViewer } from '@/components/MediaViewer';
import { ImageSlider } from '@/components/ImageSlider';
import { ProfileTab } from '@/components/ProfileTab';
import { WishlistTab, getWishlistCount } from '@/components/WishlistTab';
import { BlogTab } from '@/components/BlogTab';
import { BlogPost } from '@/components/BlogPost';
import { BookModal } from '@/components/ProductModal';
import { BookCatalog } from '@/components/ProductCatalog';
import DesktopChatBot from '@/components/DesktopChatBot';
import DesktopFooter from '@/components/DesktopFooter';
import { useResponsive } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { formatVietnamPrice } from '@/utils/currency';

// API base URL from environment or default  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

// Book genres with English names and icons
const BOOK_GENRES = [
  { id: 'all', name: 'All Books', icon: '📚' },
  { id: 'literature', name: 'Literature', icon: '✍️' },
  { id: 'business', name: 'Business & Economics', icon: '💼' },
  { id: 'science', name: 'Science & Technology', icon: '🔬' },
  { id: 'children', name: 'Children\'s Books', icon: '🧸' },
  { id: 'self-help', name: 'Self-Help & Personal Development', icon: '🎯' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'psychology', name: 'Psychology', icon: '🧠' },
  { id: 'cooking', name: 'Cooking & Food', icon: '👨‍🍳' },
  { id: 'art', name: 'Arts & Crafts', icon: '🎨' },
  { id: 'health', name: 'Health & Fitness', icon: '💪' },
  { id: 'education', name: 'Education', icon: '🎓' }
];

// Banner images for bookstore slider - using placeholder images for now
const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=400&fit=crop'
];


interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  genre_id: string;
  stock: number;
  description?: string;
  rating?: number;
  status: string;
  // Badge properties
  isNew?: boolean;
  isBestseller?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
  // SEO metadata fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // International support
  priceRegions?: {
    USD: number;
    EUR: number;
    GBP: number;
    AUD: number;
    CAD: number;
  };
  targetMarkets?: string[]; // ['US', 'UK', 'AU', 'CA', 'EU']
}

interface BookGenre {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface CartItem {
  book: Book;
  quantity: number;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  readingTime: number;
  isNew?: boolean;
  isFeatured?: boolean;
  views?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export default function MobileStorefront() {
  // Responsive hooks
  const { isMobile, isTablet } = useResponsive();
  
  // Authentication
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSelectedCategory, setBlogSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [wishlistCount, setWishlistCount] = useState(0);

  // Update wishlist count on component mount and when switching to wishlist tab
  useEffect(() => {
    const updateWishlistCount = () => {
      const count = getWishlistCount();
      setWishlistCount(count);
    };
    
    updateWishlistCount();
    
    // Add event listener for storage changes (when wishlist is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookstore_wishlist') {
        updateWishlistCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for wishlist updates within same tab
    const handleWishlistUpdate = () => updateWishlistCount();
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);
  
  // Responsive layout configurations
  const layoutConfig = {
    gridCols: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4 xl:grid-cols-5',
    containerClass: isMobile ? 'w-full' : 'max-w-7xl mx-auto',
    contentPadding: isMobile ? 'p-4' : 'p-6 lg:p-8',
    gridGap: isMobile ? 'gap-3' : 'gap-4 lg:gap-6',
    showBottomNav: isMobile
  };
  
  
  

  // Infinite scroll setup - fetch books with pagination
  const { 
    data: booksData,
    isLoading: booksLoading, 
    error: booksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching: booksRefetching 
  } = useInfiniteQuery<Book[]>({
    queryKey: ['mobile-books', selectedGenre, searchQuery, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      let url = `${API_BASE_URL}/products?limit=20&offset=${pageParam}`;
      if (selectedGenre !== 'all') {
        url += `&categoryId=${selectedGenre}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Add sorting parameters
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
  
  // Flatten pages into single array
  const books = booksData?.pages.flat() || [];

  // Professional book catalog with diverse categories
  const demoBooks: Book[] = [
    // Business & Economics Books
    {
      id: 'demo-1',
      title: 'The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
      author: 'Eric Ries',
      price: 28.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 45,
      description: 'Transform your startup approach with validated learning and iterative product development. Eric Ries introduces the Build-Measure-Learn methodology that reduces market risk through scientific experimentation. Discover how to create sustainable businesses by testing hypotheses, pivoting when necessary, and avoiding common entrepreneurial pitfalls.',
      rating: 4.7,
      publisher: 'Crown Business',
      publication_year: 2021,
      pages: 336,
      language: 'English',
      isbn: '978-0-307-88789-4',
      status: 'active',
      isNew: true,
      isBestseller: true,
      seoTitle: 'Lean Startup Methodology Book | Build-Measure-Learn Framework | Eric Ries',
      seoDescription: 'Master lean startup principles with Eric Ries\' validated learning approach. Learn Build-Measure-Learn cycles, minimum viable products, and startup pivot strategies for successful entrepreneurship.',
      seoKeywords: ['lean startup', 'validated learning', 'minimum viable product', 'MVP', 'build measure learn', 'startup methodology', 'entrepreneurship', 'product development', 'business model canvas', 'customer development', 'agile startup', 'startup pivot'],
      priceRegions: {
        USD: 28.99,
        EUR: 26.50,
        GBP: 23.99,
        AUD: 42.95,
        CAD: 38.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-2',
      title: 'Think Like a Programmer: An Introduction to Creative Problem Solving',
      author: 'V. Anton Spraul',
      price: 32.95,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 60,
      description: 'Develop systematic problem-solving skills through structured programming exercises and real-world challenges. V. Anton Spraul guides you through computational thinking patterns using C++ examples that apply to any programming language. Build debugging techniques and logical reasoning abilities through progressive difficulty levels.',
      rating: 4.5,
      publisher: 'No Starch Press',
      publication_year: 2020,
      pages: 260,
      language: 'English',
      isbn: '978-1-59327-424-5',
      status: 'active',
      isRecommended: true,
      isFeatured: true,
      seoTitle: 'Programming Problem Solving Book | Computational Thinking | Debugging Techniques',
      seoDescription: 'Learn systematic programming problem-solving with C++ exercises. Master computational thinking, debugging strategies, and algorithmic reasoning for software development success.',
      seoKeywords: ['computational thinking', 'programming problem solving', 'debugging techniques', 'algorithmic thinking', 'coding logic', 'software development skills', 'programming fundamentals', 'problem decomposition', 'coding bootcamp prep', 'programming methodology'],
      priceRegions: {
        USD: 32.95,
        EUR: 30.25,
        GBP: 26.99,
        AUD: 48.95,
        CAD: 44.50
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-3',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin (Uncle Bob)',
      price: 45.99,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 35,
      description: 'Transform your coding practices with Robert "Uncle Bob" Martin\'s software craftsmanship principles. Learn refactoring patterns, naming conventions, and function design that separate professional developers from amateurs. Apply agile development techniques that improve code readability, maintainability, and team collaboration.',
      rating: 4.8,
      publisher: 'Prentice Hall',
      publication_year: 2019,
      pages: 464,
      language: 'English',
      isbn: '978-0-13-235088-4',
      status: 'active',
      isBestseller: true,
      isFeatured: true,
      seoTitle: 'Clean Code Book | Software Craftsmanship | Uncle Bob Martin | Refactoring Guide',
      seoDescription: 'Master clean code principles and software craftsmanship with Robert Martin\'s definitive guide. Learn refactoring, naming conventions, and professional development practices.',
      seoKeywords: ['clean code', 'software craftsmanship', 'refactoring', 'code quality', 'uncle bob martin', 'agile development', 'software engineering best practices', 'code readability', 'maintainable code', 'programming principles', 'software design patterns'],
      priceRegions: {
        USD: 45.99,
        EUR: 42.25,
        GBP: 37.99,
        AUD: 68.95,
        CAD: 62.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-4',
      title: 'Principles: Life and Work by Ray Dalio - Billionaire Investor\'s Guide to Success',
      author: 'Ray Dalio',
      price: 35.00,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 50,
      description: 'Systematic decision-making frameworks from Bridgewater Associates founder Ray Dalio. Learn radical transparency principles, principled thinking methodologies, and life management systems that built the world\'s largest hedge fund. Apply systematic approaches to goal-setting, problem-solving, and organizational leadership.',
      rating: 4.6,
      publisher: 'Simon & Schuster',
      publication_year: 2020,
      pages: 592,
      language: 'English',
      isbn: '978-1-5011-2454-5',
      status: 'active',
      isNew: true,
      isRecommended: true,
      seoTitle: 'Ray Dalio Principles Book | Decision Making Framework | Radical Transparency | Hedge Fund',
      seoDescription: 'Master Ray Dalio\'s systematic principles for life and work success. Learn decision-making frameworks, radical transparency, and leadership strategies from Bridgewater Associates founder.',
      seoKeywords: ['ray dalio principles', 'decision making framework', 'radical transparency', 'hedge fund strategies', 'bridgewater associates', 'systematic thinking', 'principled leadership', 'organizational management', 'investment philosophy', 'life principles'],
      priceRegions: {
        USD: 35.00,
        EUR: 32.25,
        GBP: 28.99,
        AUD: 52.95,
        CAD: 47.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-5',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software - The Gang of Four Classic',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      price: 54.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 25,
      description: 'Foundational software architecture patterns from the Gang of Four authors. Master 23 reusable design solutions including Singleton, Observer, Factory, and Strategy patterns. Learn object-oriented design principles that improve code flexibility, maintainability, and scalability across programming languages.',
      rating: 4.9,
      publisher: 'Addison-Wesley',
      publication_year: 2018,
      pages: 395,
      language: 'English',
      isbn: '978-0-201-63361-0',
      status: 'active',
      isBestseller: true,
      isFeatured: true,
      seoTitle: 'Gang of Four Design Patterns | Software Architecture | OOP Design | GoF Book',
      seoDescription: 'Master software design patterns with the classic Gang of Four book. Learn 23 reusable OOP patterns including Singleton, Observer, Factory for scalable architecture.',
      seoKeywords: ['design patterns', 'gang of four', 'GoF', 'software architecture', 'object oriented programming', 'singleton pattern', 'observer pattern', 'factory pattern', 'strategy pattern', 'software design', 'OOP patterns'],
      priceRegions: {
        USD: 54.99,
        EUR: 50.50,
        GBP: 44.99,
        AUD: 82.95,
        CAD: 74.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-6',
      title: 'Good to Great: Why Some Companies Make the Leap and Others Don\'t - Business Strategy Masterclass',
      author: 'Jim Collins',
      price: 29.99,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 40,
      description: 'Research-driven analysis of corporate transformation from business researcher Jim Collins. Examine Level 5 Leadership characteristics, Hedgehog Concept implementation, and Culture of Discipline development through 11 company case studies spanning 15 years of sustained market outperformance.',
      rating: 4.4,
      publisher: 'HarperBusiness',
      publication_year: 2019,
      pages: 320,
      language: 'English',
      isbn: '978-0-06-662099-2',
      status: 'active',
      isRecommended: true,
      seoTitle: 'Good to Great Jim Collins | Level 5 Leadership | Corporate Transformation | Business Strategy',
      seoDescription: 'Discover corporate transformation secrets with Jim Collins\' Good to Great research. Learn Level 5 Leadership, Hedgehog Concept, and Culture of Discipline for sustained business success.',
      seoKeywords: ['good to great', 'jim collins', 'level 5 leadership', 'hedgehog concept', 'corporate transformation', 'business strategy', 'culture of discipline', 'company research', 'organizational excellence', 'sustained greatness'],
      priceRegions: {
        USD: 29.99,
        EUR: 27.50,
        GBP: 24.99,
        AUD: 44.95,
        CAD: 40.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-7',
      title: 'Artificial Intelligence: A Modern Approach - The Complete AI Textbook',
      author: 'Stuart Russell, Peter Norvig',
      price: 78.99,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 15,
      description: 'Comprehensive AI education covering machine learning, neural networks, and intelligent agents. Stuart Russell and Peter Norvig present algorithmic foundations, search strategies, knowledge representation, and probabilistic reasoning. Explore computer vision, natural language processing, and robotics applications with mathematical rigor and practical implementations.',
      rating: 4.7,
      publisher: 'Pearson',
      publication_year: 2021,
      pages: 1152,
      language: 'English',
      isbn: '978-0-13-461099-3',
      status: 'active',
      isNew: true,
      isFeatured: true,
      seoTitle: 'Artificial Intelligence Textbook | Machine Learning | Neural Networks | Russell Norvig',
      seoDescription: 'Master AI fundamentals with the definitive textbook by Russell and Norvig. Covers machine learning, neural networks, computer vision, NLP, and robotics with practical examples.',
      seoKeywords: ['artificial intelligence', 'machine learning', 'neural networks', 'computer vision', 'natural language processing', 'robotics', 'AI algorithms', 'intelligent agents', 'deep learning', 'data science', 'AI textbook', 'AIMA'],
      priceRegions: {
        USD: 78.99,
        EUR: 72.50,
        GBP: 63.99,
        AUD: 118.95,
        CAD: 108.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-8',
      title: 'The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness',
      author: 'Morgan Housel',
      price: 26.95,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'psychology',
      stock: 65,
      description: 'Uncover the behavioral factors that determine financial success beyond mathematical knowledge. Morgan Housel examines psychological biases, risk perception, and decision-making patterns that influence wealth accumulation. Historical case studies reveal how emotions, timing, and luck shape financial outcomes more than intelligence.',
      rating: 4.6,
      publisher: 'Harriman House',
      publication_year: 2020,
      pages: 252,
      language: 'English',
      isbn: '978-0-85719-757-2',
      status: 'active',
      isBestseller: true,
      isNew: true,
      seoTitle: 'Psychology of Money Book | Behavioral Finance | Wealth Building Psychology | Morgan Housel',
      seoDescription: 'Understand financial behavior and wealth psychology with Morgan Housel\'s insights. Learn how emotions and biases affect money decisions, investing, and long-term financial success.',
      seoKeywords: ['psychology of money', 'behavioral finance', 'wealth psychology', 'financial behavior', 'investment psychology', 'money mindset', 'financial decision making', 'behavioral economics', 'wealth building', 'financial habits', 'morgan housel'],
      priceRegions: {
        USD: 26.95,
        EUR: 24.75,
        GBP: 21.99,
        AUD: 39.95,
        CAD: 36.50
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-9',
      title: 'Introduction to Algorithms - CLRS: The Algorithm Design Manual',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      price: 89.99,
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      genre_id: 'science',
      stock: 20,
      description: 'Comprehensive algorithmic foundations covering sorting, searching, graph algorithms, and dynamic programming. CLRS authors provide mathematical rigor with pseudocode implementations for fundamental computer science algorithms. Study computational complexity, asymptotic analysis, and advanced data structures.',
      rating: 4.8,
      publisher: 'MIT Press',
      publication_year: 2019,
      pages: 1312,
      language: 'English',
      isbn: '978-0-262-03384-8',
      status: 'active',
      isBestseller: true,
      isFeatured: true,
      seoTitle: 'CLRS Algorithms Book | Data Structures | Graph Algorithms | Dynamic Programming | MIT',
      seoDescription: 'Master fundamental algorithms with the CLRS textbook. Learn sorting, searching, graph algorithms, dynamic programming, and computational complexity with mathematical rigor.',
      seoKeywords: ['algorithms', 'data structures', 'CLRS', 'graph algorithms', 'dynamic programming', 'sorting algorithms', 'computational complexity', 'computer science', 'algorithm analysis', 'MIT textbook', 'asymptotic analysis'],
      priceRegions: {
        USD: 89.99,
        EUR: 82.75,
        GBP: 73.99,
        AUD: 135.95,
        CAD: 123.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-10',
      title: 'Zero to One: Notes on Startups, or How to Build the Future - Peter Thiel\'s Startup Bible',
      author: 'Peter Thiel with Blake Masters',
      price: 24.99,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 55,
      description: 'Monopoly theory and breakthrough innovation strategies from PayPal co-founder Peter Thiel. Learn vertical progress principles, technology development frameworks, and market creation techniques. Explore contrarian thinking approaches that differentiate successful startups from competitive businesses.',
      rating: 4.5,
      publisher: 'Crown Business',
      publication_year: 2020,
      pages: 224,
      language: 'English',
      isbn: '978-0-8041-3929-8',
      status: 'active',
      isRecommended: true,
      seoTitle: 'Zero to One Peter Thiel | Monopoly Strategy | Startup Innovation | Technology Development',
      seoDescription: 'Learn Peter Thiel\'s monopoly theory and startup innovation strategies. Master vertical progress, technology development, and market creation for breakthrough businesses.',
      seoKeywords: ['zero to one', 'peter thiel', 'monopoly strategy', 'startup innovation', 'technology development', 'vertical progress', 'market creation', 'contrarian thinking', 'paypal founder', 'silicon valley', 'breakthrough innovation'],
      priceRegions: {
        USD: 24.99,
        EUR: 22.95,
        GBP: 20.99,
        AUD: 37.95,
        CAD: 33.99
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-11',
      title: 'Thinking, Fast and Slow - Nobel Prize Winner\'s Guide to Decision Making',
      author: 'Daniel Kahneman',
      price: 31.95,
      cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
      genre_id: 'psychology',
      stock: 30,
      description: 'Cognitive psychology research on dual-system thinking from Nobel Prize winner Daniel Kahneman. Understand System 1 automatic responses versus System 2 controlled processing. Examine cognitive biases, prospect theory, and heuristic decision-making patterns affecting judgment and choice.',
      rating: 4.7,
      publisher: 'Farrar, Straus and Giroux',
      publication_year: 2018,
      pages: 499,
      language: 'English',
      isbn: '978-0-374-27563-1',
      status: 'active',
      isBestseller: true,
      isFeatured: true,
      seoTitle: 'Thinking Fast and Slow Kahneman | Cognitive Bias | Behavioral Psychology | Decision Making',
      seoDescription: 'Explore cognitive psychology and decision-making with Daniel Kahneman\'s Nobel Prize research. Learn about System 1/2 thinking, cognitive biases, and behavioral economics.',
      seoKeywords: ['thinking fast and slow', 'daniel kahneman', 'cognitive bias', 'behavioral psychology', 'decision making', 'system 1 system 2', 'prospect theory', 'heuristics', 'nobel prize psychology', 'behavioral economics', 'cognitive psychology'],
      priceRegions: {
        USD: 31.95,
        EUR: 29.25,
        GBP: 26.99,
        AUD: 47.95,
        CAD: 43.50
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    },
    {
      id: 'demo-12',
      title: 'The Innovator\'s Dilemma: When New Technologies Cause Great Firms to Fail',
      author: 'Clayton M. Christensen',
      price: 33.99,
      cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      genre_id: 'business',
      stock: 40,
      description: 'Disruptive innovation theory and corporate failure analysis from Harvard professor Clayton Christensen. Study technology transition patterns, market disruption mechanics, and strategic responses to technological change. Examine historical cases of industry transformation and competitive displacement.',
      rating: 4.4,
      publisher: 'Harvard Business Review Press',
      publication_year: 2019,
      pages: 286,
      language: 'English',
      isbn: '978-1-4221-9524-8',
      status: 'active',
      isRecommended: true,
      seoTitle: 'Innovator\'s Dilemma Christensen | Disruptive Innovation | Technology Disruption | Harvard',
      seoDescription: 'Master disruptive innovation theory with Clayton Christensen\'s Harvard research. Learn why established companies fail and how to navigate technological disruption.',
      seoKeywords: ['innovators dilemma', 'clayton christensen', 'disruptive innovation', 'technology disruption', 'sustaining innovation', 'market disruption', 'corporate strategy', 'digital transformation', 'harvard business school', 'competitive strategy'],
      priceRegions: {
        USD: 33.99,
        EUR: 31.25,
        GBP: 27.99,
        AUD: 50.95,
        CAD: 46.50
      },
      targetMarkets: ['US', 'UK', 'CA', 'AU', 'EU']
    }
  ];

  // Use demo books when API fails or returns empty
  const displayBooks = (books.length > 0 || booksLoading) ? books : demoBooks;
  
  // Force demo books for testing (temporary)
  const finalBooks = booksError || books.length === 0 ? demoBooks : displayBooks;

  // For now, use static book genres (can fetch from API later)
  const allGenres = BOOK_GENRES;
  
  // Use book genres
  const genres = allGenres;
  
  // Helper function to get category icons
  function getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('điện') || name.includes('phone') || name.includes('tech')) return '📱';
    if (name.includes('sách') || name.includes('book')) return '📚';
    if (name.includes('làm đẹp') || name.includes('beauty') || name.includes('cosmetic')) return '💄';
    if (name.includes('thời trang') || name.includes('fashion') || name.includes('clothes')) return '👕';
    if (name.includes('gia dụng') || name.includes('home')) return '🏠';
    if (name.includes('thể thao') || name.includes('sport')) return '⚽';
    return '📦';
  }

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        return prev.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(prev => prev.filter(item => item.book.id !== bookId));
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCart(prev => 
      prev.map(item =>
        item.book.id === bookId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleTabChange = (tab: string) => {
    setSelectedBook(null); // Always clear book view when changing tabs
    setActiveTab(tab);
  };


  const handleHeaderSearchClick = () => {
    setActiveTab('home');
    // Focus search input if it exists
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleHeaderCartClick = () => {
    setActiveTab('cart');
  };

  const handleProfileClick = () => {
    setActiveTab('profile');
  };

  // Helper function to render book badges
  const renderBookBadges = (book: Book) => {
    const badges = [];
    
    if (book.isNew) {
      badges.push(
        <Badge key="new" variant="new" className="text-xs">
          🆕 NEW
        </Badge>
      );
    }
    
    if (book.isBestseller) {
      badges.push(
        <Badge key="bestseller" variant="bestseller" className="text-xs">
          🏆 BESTSELLER
        </Badge>
      );
    }
    
    if (book.isRecommended) {
      badges.push(
        <Badge key="recommended" variant="freeshipping" className="text-xs">
          🎩 FEATURED
        </Badge>
      );
    }
    
    if (book.isFeatured) {
      badges.push(
        <Badge key="featured" variant="bestseller" className="text-xs">
          ⭐ POPULAR
        </Badge>
      );
    }
    
    return badges;
  };

  const renderContent = () => {
    // If a book is selected, we'll show the BookModal separately, not here
    // Continue with normal content rendering

    switch (activeTab) {
      case 'categories':
        return (
          <div className={`${layoutConfig.containerClass}`}>
            <div className={`${layoutConfig.contentPadding} pt-6`}>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Book Categories</h2>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      setSelectedGenre(genre.id);
                      setActiveTab('home');
                    }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{genre.icon}</div>
                      <h3 className="font-semibold text-gray-900">{genre.name}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="p-4 pt-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Shopping Cart ({getTotalItems()} items)</h2>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <p className="text-gray-400 text-sm">Add books to start shopping</p>
              </div>
            ) : (
              <div>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.book.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.book.cover_image ? (
                          <img 
                            src={item.book.cover_image} 
                            alt={item.book.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Store className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.book.title}</h3>
                        <p className="text-sm text-gray-600">{item.book.author}</p>
                        <p className="text-blue-600 font-bold">
                          {formatVietnamPrice(item.book.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatVietnamPrice(getTotalPrice())}
                    </span>
                  </div>
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold">
                    Checkout Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'wishlist':
        return <WishlistTab addToCart={addToCart} onBookClick={setSelectedBook} />;

      case 'profile':
        return <ProfileTab addToCart={addToCart} setActiveTab={setActiveTab} />;


      default: // 'home'
        return (
          <div className={layoutConfig.containerClass}>
            {/* Banner Slider */}
            <ImageSlider 
              images={BANNER_IMAGES}
              className="mb-6"
              autoplay={true}
              autoplayDelay={4000}
            />

            
            {/* ProductCatalog removed - categories now shown in DesktopHeader */}
            
            {/* Product Grid */}
            <div className={layoutConfig.contentPadding}>
              <div className={`grid ${layoutConfig.gridCols} ${layoutConfig.gridGap}`}>
                {booksLoading && !booksError ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="aspect-square bg-gray-200 animate-pulse" />
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))
                ) : false ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <p className="text-gray-600 mb-4">Unable to load books - showing demo</p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : finalBooks.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-600">No books found</p>
                  </div>
                ) : (
                  finalBooks.map((book) => (
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div 
                        className="aspect-[3/4] bg-gray-100 cursor-pointer relative"
                        onClick={() => setSelectedBook(book)}
                      >
                        {book.cover_image ? (
                          <img 
                            src={book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Store className="h-16 w-16" />
                          </div>
                        )}
                        {/* Book Badges - positioned at top of image */}
                        {renderBookBadges(book).length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {renderBookBadges(book)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate text-sm">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 truncate">{book.author}</p>
                        <div className="mb-3">
                          <span className="text-blue-600 font-bold text-lg">
                            {formatVietnamPrice(book.price)}
                          </span>
                          {book.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    i < Math.floor(book.rating!) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'fill-gray-200 text-gray-200'
                                  }`} 
                                />
                              ))}
                              <span className="text-xs text-gray-600 ml-1">({book.rating})</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBook(book)}
                            className="flex-1 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Details
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => addToCart(book)}
                            className="bg-blue-500 hover:bg-blue-600 w-10 h-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Infinite Loading Indicator */}
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Header - Show on tablet and desktop */}
      {!isMobile && (
        <DesktopHeader
          storeName="BookStore.Net"
          cartCount={getTotalItems()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCartClick={handleHeaderCartClick}
          onProfileClick={handleProfileClick}
          categories={genres}
          selectedCategory={selectedGenre}
          onCategorySelect={setSelectedGenre}
          showCategoryBar={true}
        />
      )}

      {/* Mobile Header - Show on mobile only */}
      {isMobile && (
        <MobileHeader
          onSearchClick={handleHeaderSearchClick}
          onCartClick={handleHeaderCartClick}
          onProfileClick={handleProfileClick}
          cartCount={getTotalItems()}
          storeName="BookStore.Net"
        />
      )}

      {/* Auto Hide Search Bar - Mobile only */}
      {isMobile && activeTab === 'home' && (
        <AutoHideSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search books..."
        />
      )}

      {/* Hidden Search Bar - Desktop only */}
      {!isMobile && (
        <HiddenSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search books..."
        />
      )}

      <main className={isMobile ? "pb-20 pt-8" : "pt-6"}>
        {renderContent()}
      </main>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <StorefrontBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          wishlistCount={wishlistCount}
        />
      )}

      {/* Desktop ChatBot - Show on desktop only */}
      {!isMobile && <DesktopChatBot />}

      {/* Desktop Footer - Show on desktop only */}
      {!isMobile && <DesktopFooter />}

      {/* Book Modal */}
      <BookModal 
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onAddToCart={addToCart}
        cart={cart}
      />

    </div>
  );
}