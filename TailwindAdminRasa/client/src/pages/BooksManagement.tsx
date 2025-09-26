import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, DollarSign, Users, BarChart, Settings, Plus, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AbebooksListing {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  condition: 'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable' | 'Poor';
  price: string;
  shippingCost: string;
  vendorName: string;
  vendorRating: number;
  vendorCountry: string;
  vendorReviews: number;
  imageUrl?: string;
  description?: string;
  accountId: string;
  createdAt: string;
}

interface AbebooksAccount {
  id: string;
  accountName: string;
  isActive: boolean;
  isDefault: boolean;
  maxRequestsPerMinute: number;
  requestsUsed: number;
  targetCountries: string[];
  preferredCurrency: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface SearchResult {
  listings: AbebooksListing[];
  totalFound: number;
  searchTime: number;
  accountUsed: string;
}

export default function BooksManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'isbn' | 'general'>('isbn');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  // Fetch AbeBooks accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['abebooks-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/books/abebooks/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    }
  });

  const accounts = accountsData?.accounts || [];

  // Fetch account status
  const { data: statusData } = useQuery({
    queryKey: ['abebooks-status'],
    queryFn: async () => {
      const response = await fetch('/api/books/abebooks/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const status = statusData?.status || {};

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (params: { query: string; type: 'isbn' | 'general' }) => {
      const endpoint = params.type === 'isbn' 
        ? `/api/books/abebooks/search/isbn/${params.query}`
        : `/api/books/abebooks/search/${params.query}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Search failed');
      return response.json() as SearchResult;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: (error) => {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    searchMutation.mutate({ query: searchQuery.trim(), type: searchType });
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `$${num.toFixed(2)}`;
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      'New': 'bg-green-100 text-green-800',
      'Like New': 'bg-green-100 text-green-700',
      'Very Good': 'bg-blue-100 text-blue-800',
      'Good': 'bg-yellow-100 text-yellow-800',
      'Acceptable': 'bg-orange-100 text-orange-800',
      'Poor': 'bg-red-100 text-red-800'
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                Books Management
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive AbeBooks integration with multi-vendor pricing and rare book specialization
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {accounts.filter(acc => acc.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Requests Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {status?.totalRequestsToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Search Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {status?.averageResponseTime || '0'}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {searchResults?.totalFound || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Book Search</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">Search History</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Search AbeBooks</CardTitle>
                <CardDescription>
                  Search for books by ISBN or general query across multiple vendor accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder={searchType === 'isbn' ? 'Enter ISBN (e.g., 9780123456789)' : 'Enter book title, author, or keywords'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={searchType === 'isbn' ? 'default' : 'outline'}
                      onClick={() => setSearchType('isbn')}
                    >
                      ISBN
                    </Button>
                    <Button
                      variant={searchType === 'general' ? 'default' : 'outline'}
                      onClick={() => setSearchType('general')}
                    >
                      General
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    Found {searchResults.totalFound} listings in {searchResults.searchTime}ms 
                    using account {searchResults.accountUsed}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {searchResults.listings.map((listing) => (
                      <div key={listing.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{listing.bookTitle}</h3>
                            <p className="text-sm text-gray-600">by {listing.bookAuthor}</p>
                            <p className="text-xs text-gray-500 mt-1">ISBN: {listing.bookIsbn}</p>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <Badge className={getConditionColor(listing.condition)}>
                                {listing.condition}
                              </Badge>
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(listing.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                + {formatCurrency(listing.shippingCost)} shipping
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{listing.vendorName} ({listing.vendorCountry})</span>
                              <span>⭐ {listing.vendorRating}/5</span>
                              <span>({listing.vendorReviews} reviews)</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AbeBooks Accounts</CardTitle>
                <CardDescription>
                  Manage your AbeBooks API accounts and rotation settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{account.accountName}</h3>
                            {account.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <Badge variant={account.isActive ? 'default' : 'secondary'}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Requests: {account.requestsUsed}/{account.maxRequestsPerMinute}</span>
                            <span>Countries: {account.targetCountries.join(', ')}</span>
                            <span>Currency: {account.preferredCurrency}</span>
                            <span>Last used: {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : 'Never'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Metrics</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Performance</CardTitle>
                <CardDescription>
                  Monitor search performance and account usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search History</CardTitle>
                <CardDescription>
                  Review recent searches and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <p>Search history will appear here...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}