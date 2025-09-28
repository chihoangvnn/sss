'use client';

import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Star, Shield, Truck, CreditCard, Book, Globe, Award } from 'lucide-react';

const DesktopFooter = () => {
  // SEO Schema markup for International BookStore
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "BookStore", 
    "name": "BookStore.Net",
    "description": "Professional international bookstore specializing in business, science & technology, and psychology books with global shipping",
    "url": "https://bookstore.net",
    "telephone": "+1-555-123-4567",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "456 Knowledge Avenue",
      "addressLocality": "New York",
      "addressRegion": "NY", 
      "postalCode": "10001",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "21:00"
    },
    "priceRange": "$$$",
    "category": ["Business Books", "Technology Books", "Psychology Books", "Professional Literature"],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "5247"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org", 
    "@type": "Organization",
    "name": "BookStore.Net",
    "url": "https://bookstore.net",
    "logo": "https://bookstore.net/logo.png",
    "sameAs": [
      "https://facebook.com/bookstore.net",
      "https://twitter.com/bookstore_net", 
      "https://instagram.com/bookstore.net"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-123-4567", 
      "contactType": "customer service",
      "availableLanguage": ["English", "Spanish", "French", "German"]
    }
  };

  useEffect(() => {
    // Add schema markup to document head
    const businessScript = document.createElement('script');
    businessScript.type = 'application/ld+json';
    businessScript.text = JSON.stringify(businessSchema);
    document.head.appendChild(businessScript);

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationSchema);
    document.head.appendChild(orgScript);

    return () => {
      document.head.removeChild(businessScript);
      document.head.removeChild(orgScript);
    };
  }, []);

  const bookCategories = [
    { name: 'Business & Economics', href: '/category/business', seo: 'Professional business and economics books' },
    { name: 'Science & Technology', href: '/category/science', seo: 'Computer science and technology books' },
    { name: 'Psychology', href: '/category/psychology', seo: 'Behavioral psychology and decision making' },
    { name: 'Literature', href: '/category/literature', seo: 'Classic and modern literature' },
    { name: 'Self-Help & Development', href: '/category/self-help', seo: 'Personal development and self-improvement' },
    { name: 'History', href: '/category/history', seo: 'Historical books and biographies' }
  ];

  const supportLinks = [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Shipping Information', href: '/shipping' },
    { name: 'Return Policy', href: '/returns' },
    { name: 'Order Tracking', href: '/track-order' },
    { name: 'Customer Support', href: '/support' },
    { name: 'FAQ', href: '/faq' }
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Our Mission', href: '/mission' }, 
    { name: 'Careers', href: '/careers' },
    { name: 'Press & Media', href: '/press' },
    { name: 'Partnerships', href: '/partnerships' },
    { name: 'Wholesale', href: '/wholesale' }
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com/bookstore.net', icon: Facebook },
    { name: 'Twitter', href: 'https://twitter.com/bookstore_net', icon: Twitter },
    { name: 'Instagram', href: 'https://instagram.com/bookstore.net', icon: Instagram },
    { name: 'Email', href: 'mailto:hello@bookstore.net', icon: Mail }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          
          {/* Company Info Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Book className="text-white" size={18} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">BookStore.Net</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Your premier destination for professional books in business, technology, and psychology. 
              Serving readers worldwide with carefully curated content for lifelong learning.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin size={16} className="text-blue-500" />
                <span>456 Knowledge Avenue, New York, NY 10001</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone size={16} className="text-blue-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail size={16} className="text-blue-500" />
                <span>hello@bookstore.net</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe size={16} className="text-blue-500" />
                <span>Global shipping available</span>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">4.9/5</span>
              </div>
              <p className="text-xs text-gray-500">Based on 5,247 customer reviews</p>
            </div>
          </div>

          {/* Book Categories Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Book Categories</h4>
            <ul className="space-y-3">
              {bookCategories.map((category) => (
                <li key={category.href}>
                  <a
                    href={category.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 block"
                    title={category.seo}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Featured Collections */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">📚 Featured Collections</h5>
              <ul className="space-y-1">
                <li>
                  <a href="/bestsellers" className="text-xs text-blue-700 hover:text-blue-900">
                    International Bestsellers
                  </a>
                </li>
                <li>
                  <a href="/new-releases" className="text-xs text-blue-700 hover:text-blue-900">
                    New Releases
                  </a>
                </li>
                <li>
                  <a href="/recommended" className="text-xs text-blue-700 hover:text-blue-900">
                    Staff Recommendations
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Customer Support Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Business Hours */}
            <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-100">
              <h5 className="text-sm font-semibold text-green-800 mb-2">🕘 Business Hours</h5>
              <p className="text-xs text-green-700">Monday - Sunday</p>
              <p className="text-xs text-green-700 font-semibold">9:00 AM - 9:00 PM (EST)</p>
              <p className="text-xs text-green-600 mt-1">24/7 online ordering</p>
            </div>
          </div>

          {/* Connect & Newsletter Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h4>
            
            <div className="space-y-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex items-center space-x-3 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  target={social.href.startsWith('http') ? '_blank' : '_self'}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : ''}
                >
                  <social.icon size={16} />
                  <span>{social.name}</span>
                </a>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">📬 Newsletter</h5>
              <div className="flex space-x-2 mb-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Get book recommendations and exclusive deals
              </p>
            </div>

            {/* Company Links */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-900">Company</h5>
              {companyLinks.slice(0, 3).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Signals Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Shield size={24} className="text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Secure Shopping</p>
                <p className="text-xs text-gray-600">SSL Protected</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <Truck size={24} className="text-green-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Global Shipping</p>
                <p className="text-xs text-gray-600">Fast Delivery</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <CreditCard size={24} className="text-purple-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Easy Payments</p>
                <p className="text-xs text-gray-600">All Major Cards</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <Award size={24} className="text-yellow-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Quality Guarantee</p>
                <p className="text-xs text-gray-600">Authentic Books</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                📚 © 2024 <strong>BookStore.Net</strong> - Your Gateway to Professional Knowledge
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Empowering professionals worldwide through quality literature and expert knowledge.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-xs text-gray-500">
              <a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="/sitemap" className="hover:text-blue-600 transition-colors">Sitemap</a>
              <a href="/accessibility" className="hover:text-blue-600 transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;