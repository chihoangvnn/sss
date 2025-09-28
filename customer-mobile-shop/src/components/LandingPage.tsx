'use client'

import React from 'react';
import { BookOpen, Star, Shield, Heart, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-green-100 p-4 rounded-full">
              <BookOpen className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-green-600">BookStore.Net</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover thousands of books across all genres. From bestselling novels to academic texts, 
            find your next great read in our comprehensive online bookstore.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={login}
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Login to Start Shopping
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg"
            >
              Browse Catalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Vast Collection</h3>
            <p className="text-gray-600">
              Explore thousands of books across all genres, from fiction to academic texts.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-yellow-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Curated Selection</h3>
            <p className="text-gray-600">
              Handpicked books with ratings and reviews to help you find your perfect read.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Shopping</h3>
            <p className="text-gray-600">
              Safe and secure checkout with multiple payment options and buyer protection.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Categories
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Literature', icon: '📚', count: '1,200+' },
              { name: 'Business', icon: '💼', count: '800+' },
              { name: 'Science', icon: '🔬', count: '600+' },
              { name: 'Children\'s', icon: '🧸', count: '900+' }
            ].map((category, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} books</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Reading?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of book lovers who have found their favorite reads with us.
          </p>
          
          <Button 
            onClick={login}
            size="lg" 
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            <Heart className="mr-2 h-5 w-5" />
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}