import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, User, ArrowRight, LogIn } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image?: string;
  genre_id: string;
  stock: number;
  status: string;
}

interface LandingPageProps {
  onBrowseCatalog?: () => void;
}

export function LandingPage({ onBrowseCatalog }: LandingPageProps) {
  const handleAddToCart = (book: Book) => {
    console.log('Adding to cart:', book.title);
    alert(`Added "${book.title}" to cart!`);
  };

  const handleLogin = () => {
    alert('Login functionality coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Welcome to</span>{' '}
                  <span className="block text-green-600 xl:inline">BookStore.Net</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Discover thousands of books across all genres. From bestselling novels to academic texts, find your next great read in our comprehensive online bookstore.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button 
                      onClick={handleLogin}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                    >
                      <User className="mr-2 h-5 w-5" />
                      Login to Start Shopping
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button 
                      onClick={onBrowseCatalog}
                      variant="outline"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Browse Catalog
                      <span className="ml-2">→</span>
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-green-100 rounded-xl flex items-center justify-center sm:h-72 md:h-96 lg:w-full lg:h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Find Your Next Great Read</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Featured Books
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
                  alt="The Lean Startup"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">The Lean Startup</h3>
              <p className="text-sm text-gray-600 mb-2">by Eric Ries</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-green-600">$24.99</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="text-yellow-500 mr-1">★</span>
                  4.7
                </div>
              </div>
              <Button 
                onClick={() => handleAddToCart({ 
                  id: 'demo-1', 
                  title: 'The Lean Startup', 
                  author: 'Eric Ries', 
                  price: 24.99, 
                  genre_id: 'business', 
                  stock: 50, 
                  status: 'active' 
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
                  alt="Clean Code"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">Clean Code</h3>
              <p className="text-sm text-gray-600 mb-2">by Robert C. Martin</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-green-600">$38.99</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="text-yellow-500 mr-1">★</span>
                  4.8
                </div>
              </div>
              <Button 
                onClick={() => handleAddToCart({ 
                  id: 'demo-2', 
                  title: 'Clean Code', 
                  author: 'Robert C. Martin', 
                  price: 38.99, 
                  genre_id: 'science', 
                  stock: 35, 
                  status: 'active' 
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop"
                  alt="Psychology of Money"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">Psychology of Money</h3>
              <p className="text-sm text-gray-600 mb-2">by Morgan Housel</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-green-600">$26.95</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="text-yellow-500 mr-1">★</span>
                  4.6
                </div>
              </div>
              <Button 
                onClick={() => handleAddToCart({ 
                  id: 'demo-3', 
                  title: 'Psychology of Money', 
                  author: 'Morgan Housel', 
                  price: 26.95, 
                  genre_id: 'psychology', 
                  stock: 65, 
                  status: 'active' 
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop"
                  alt="Think Like a Programmer"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">Think Like a Programmer</h3>
              <p className="text-sm text-gray-600 mb-2">by V. Anton Spraul</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-green-600">$32.95</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="text-yellow-500 mr-1">★</span>
                  4.5
                </div>
              </div>
              <Button 
                onClick={() => handleAddToCart({ 
                  id: 'demo-4', 
                  title: 'Think Like a Programmer', 
                  author: 'V. Anton Spraul', 
                  price: 32.95, 
                  genre_id: 'science', 
                  stock: 60, 
                  status: 'active' 
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={onBrowseCatalog}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg"
            >
              Browse All Books
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wide Selection</h3>
            <p className="text-gray-600">
              Browse thousands of books across all genres and categories
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">
              Quick and reliable shipping to get your books to you faster
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Support</h3>
            <p className="text-gray-600">
              Our team is here to help you find the perfect book
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}