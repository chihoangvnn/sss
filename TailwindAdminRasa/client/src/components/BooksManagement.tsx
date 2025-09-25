import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  BookOpen,
  DollarSign,
  Star,
  Package,
  Flame,
  Settings,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
};
import type { BookWithPrices, BookPrice, BookPriceSource } from '../../../shared/schema';

// Price source configuration with abbreviations for table headers
const PRICE_SOURCES = {
  amazon: { name: "Amazon", icon: "🛒", abbreviation: "AMZ", color: "bg-orange-100 text-orange-800" },
  walmart: { name: "Walmart", icon: "🏪", abbreviation: "WM", color: "bg-blue-100 text-blue-800" },
  barnes_noble: { name: "Barnes & Noble", icon: "📖", abbreviation: "BN", color: "bg-green-100 text-green-800" },
  target: { name: "Target", icon: "🎯", abbreviation: "TGT", color: "bg-red-100 text-red-800" },
  book_depository: { name: "Book Depository", icon: "📚", abbreviation: "BD", color: "bg-purple-100 text-purple-800" },
  ebay: { name: "eBay", icon: "🔄", abbreviation: "EB", color: "bg-yellow-100 text-yellow-800" },
  abe_books: { name: "AbeBooks", icon: "📖", abbreviation: "AB", color: "bg-indigo-100 text-indigo-800" },
  costco: { name: "Costco", icon: "🏪", abbreviation: "CTC", color: "bg-gray-100 text-gray-800" },
  custom: { name: "Custom", icon: "🔗", abbreviation: "CTM", color: "bg-pink-100 text-pink-800" },
} as const;

const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};

const getPriceStatusColor = (status: string, price: number, lowestPrice?: number): string => {
  if (status !== "In Stock") return "text-gray-500 bg-gray-100";
  if (!lowestPrice) return "text-gray-700 bg-gray-100";
  
  if (price === lowestPrice) return "text-green-700 bg-green-100";
  if (price <= lowestPrice * 1.1) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
};

// Price cell component for individual source columns
const PriceCell: React.FC<{ 
  price: BookPrice | null; 
  source: BookPriceSource;
  lowestPrice?: number;
  onUpdate: () => void;
  onConfigure: () => void;
}> = ({ price, source, lowestPrice, onUpdate, onConfigure }) => {
  const sourceInfo = PRICE_SOURCES[source];
  
  if (!price) {
    return (
      <div className="w-20 text-center p-2 border rounded bg-gray-50">
        <div className="text-sm text-gray-400 mb-1">N/A</div>
        <div className="text-xs text-gray-400">--</div>
        <div className="flex justify-center gap-1 mt-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onConfigure}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
  
  const isOutOfStock = price.status === "Out of Stock";
  const priceValue = parseFloat(price.price);
  const displayPrice = isOutOfStock ? "OUT" : `$${priceValue.toFixed(2)}`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`w-20 text-center p-2 border rounded transition-colors ${getPriceStatusColor(price.status, priceValue, lowestPrice)}`}>
          <div className="text-sm font-medium mb-1">{displayPrice}</div>
          <div className="text-xs text-gray-500">
            {price.lastUpdatedAt ? formatTimeSince(new Date(price.lastUpdatedAt)) : ''}
          </div>
          <div className="flex justify-center gap-1 mt-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onUpdate}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            {price.sourceUrl && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(price.sourceUrl!, '_blank')}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <div className="font-medium">{sourceInfo.name}</div>
          <div>Status: {price.status}</div>
          <div>Updated: {price.lastUpdatedAt ? formatTimeSince(new Date(price.lastUpdatedAt)) : 'N/A'}</div>
          {price.sourceUrl && <div>Product ID: {price.productId}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Main component
const BooksManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookWithPrices | null>(null);
  const [newBookData, setNewBookData] = useState({
    isbn: '',
    title: '',
    author: '',
    format: 'Paperback' as const
  });

  const queryClient = useQueryClient();

  // Fetch books
  const { data: booksData, isLoading, error } = useQuery({
    queryKey: ['books', search, formatFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        format: formatFilter,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '50'
      });
      
      const response = await fetch(`/api/books?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      return response.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['books-stats'],
    queryFn: async () => {
      const response = await fetch('/api/books/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
  });

  // Mutations
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (!response.ok) {
        throw new Error('Failed to add book');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-stats'] });
      setIsAddDialogOpen(false);
      setNewBookData({ isbn: '', title: '', author: '', format: 'Paperback' });
      toast.success('Book added successfully');
    },
    onError: () => {
      toast.error('Failed to add book');
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (isbn: string) => {
      const response = await fetch(`/api/books/${isbn}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete book');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-stats'] });
      toast.success('Book deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete book');
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ isbn, source, priceData }: { isbn: string; source: BookPriceSource; priceData: any }) => {
      const response = await fetch(`/api/books/${isbn}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...priceData, source }),
      });
      if (!response.ok) {
        throw new Error('Failed to update price');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Price updated successfully');
    },
    onError: () => {
      toast.error('Failed to update price');
    },
  });

  const handleAddBook = () => {
    if (!newBookData.isbn || !newBookData.title || !newBookData.author) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    addBookMutation.mutate(newBookData);
  };

  const handleDeleteBook = (isbn: string) => {
    deleteBookMutation.mutate(isbn);
  };

  const handleUpdatePrice = (book: BookWithPrices, source: BookPriceSource) => {
    // Simulate price update with random data for demo
    const mockPriceData = {
      price: (Math.random() * 50 + 10).toFixed(2),
      status: Math.random() > 0.2 ? 'In Stock' : 'Out of Stock',
      sourceUrl: `https://${source}.com/product/example`,
      productId: `${source}_${book.isbn}`,
    };
    
    updatePriceMutation.mutate({
      isbn: book.isbn,
      source,
      priceData: mockPriceData,
    });
  };

  const books = booksData?.books || [];
  const pagination = booksData?.pagination;

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading books</p>
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Books Management</h1>
            <p className="text-muted-foreground">
              ISBN-based book tracking with multi-source price comparison
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Sources</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPrices || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Sellers</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.topSellersCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '0.0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title, author, or ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="Paperback">Paperback</SelectItem>
                  <SelectItem value="Hardcover">Hardcover</SelectItem>
                  <SelectItem value="eBook">eBook</SelectItem>
                  <SelectItem value="Audiobook">Audiobook</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="ranking">Ranking</SelectItem>
                  <SelectItem value="averageRating">Rating</SelectItem>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Books Table */}
        <Card>
          <CardHeader>
            <CardTitle>Books Database</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading books...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Book Info</th>
                      <th className="text-left p-2 font-medium">Best Price</th>
                      <th className="text-center p-2 font-medium">Rating</th>
                      <th className="text-center p-2 font-medium">Rank</th>
                      {Object.entries(PRICE_SOURCES).map(([key, source]) => (
                        <th key={key} className="text-center p-2 font-medium w-24">
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{source.icon}</span>
                            <span className="text-xs font-bold">{source.abbreviation}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book: BookWithPrices) => {
                      const pricesBySource = book.prices.reduce((acc, price) => {
                        acc[price.source] = price;
                        return acc;
                      }, {} as Record<string, BookPrice>);

                      return (
                        <tr key={book.isbn} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-start space-x-3">
                              {book.coverImageUrl && (
                                <img 
                                  src={book.coverImageUrl} 
                                  alt={book.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{book.title}</div>
                                <div className="text-sm text-gray-600">{book.author}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {book.format}
                                  </Badge>
                                  {book.isTopSeller && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Flame className="h-3 w-3 mr-1" />
                                      Top Seller
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ISBN: {book.isbn}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-2 text-center">
                            {book.bestPrice ? (
                              <div>
                                <div className="font-bold text-green-600">
                                  ${Number(book.bestPrice.price).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {PRICE_SOURCES[book.bestPrice.source as keyof typeof PRICE_SOURCES]?.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm">
                                {Number(book.averageRating || 0).toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              ({book.reviewCount} reviews)
                            </div>
                          </td>
                          
                          <td className="p-2 text-center">
                            <div className="text-sm font-medium">
                              #{book.ranking === 999999 ? 'N/A' : book.ranking}
                            </div>
                          </td>
                          
                          {Object.entries(PRICE_SOURCES).map(([sourceKey, sourceInfo]) => (
                            <td key={sourceKey} className="p-2">
                              <PriceCell
                                price={pricesBySource[sourceKey] || null}
                                source={sourceKey as BookPriceSource}
                                lowestPrice={book.lowestPrice}
                                onUpdate={() => handleUpdatePrice(book, sourceKey as BookPriceSource)}
                                onConfigure={() => handleUpdatePrice(book, sourceKey as BookPriceSource)}
                              />
                            </td>
                          ))}
                          
                          <td className="p-2">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBook(book);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{book.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBook(book.isbn)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {books.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No books found</p>
                    <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add your first book
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Add Book Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">ISBN-13 *</label>
                <Input
                  placeholder="9781234567890"
                  value={newBookData.isbn}
                  onChange={(e) => setNewBookData({ ...newBookData, isbn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Book title"
                  value={newBookData.title}
                  onChange={(e) => setNewBookData({ ...newBookData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Author *</label>
                <Input
                  placeholder="Author name"
                  value={newBookData.author}
                  onChange={(e) => setNewBookData({ ...newBookData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <Select 
                  value={newBookData.format} 
                  onValueChange={(value: any) => setNewBookData({ ...newBookData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paperback">Paperback</SelectItem>
                    <SelectItem value="Hardcover">Hardcover</SelectItem>
                    <SelectItem value="eBook">eBook</SelectItem>
                    <SelectItem value="Audiobook">Audiobook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBook} disabled={addBookMutation.isPending}>
                {addBookMutation.isPending ? 'Adding...' : 'Add Book'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default BooksManagement;