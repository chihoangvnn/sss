'use client'

import React, { useState, useMemo } from 'react';
import { Search, Clock, User, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  readingTime: number; // in minutes
  isNew?: boolean;
  isFeatured?: boolean;
}

interface BlogTabProps {
  onPostClick: (post: BlogPost) => void;
  searchQuery?: string;
  selectedCategory?: string;
  onSearchChange?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

// Mock data for nhang sạch, tâm linh, phong thủy blog posts
const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Cách chọn nhang trầm hương chất lượng cho gia đình',
    excerpt: 'Hướng dẫn chi tiết cách nhận biết và lựa chọn nhang trầm hương tự nhiên, không hóa chất để mang lại bình an cho tổ ấm.',
    content: 'Nhang trầm hương được biết đến là loại hương có mùi thơm thanh tao, giúp tĩnh tâm và mang lại năng lượng tích cực...',
    author: 'Thầy Minh An',
    publishedAt: '2025-09-20',
    category: 'Nhang Trầm',
    tags: ['nhang trầm', 'chất lượng', 'gia đình'],
    imageUrl: '/images/tram-huong-quality.jpg',
    readingTime: 5,
    isFeatured: true,
    isNew: true
  },
  {
    id: '2',
    title: 'Phong thủy đặt bàn thờ gia tiên theo tuổi gia chủ',
    excerpt: 'Nguyên tắc vàng trong việc bố trí bàn thờ gia tiên phù hợp với mệnh tuổi để thu hút tài lộc và bình an.',
    content: 'Việc đặt bàn thờ gia tiên đúng phong thủy không chỉ thể hiện lòng thành kính mà còn ảnh hưởng đến vận khí gia đình...',
    author: 'Cô Lan Hương',
    publishedAt: '2025-09-18',
    category: 'Phong Thủy',
    tags: ['phong thủy', 'bàn thờ', 'gia tiên'],
    imageUrl: '/images/ban-tho-phong-thuy.jpg',
    readingTime: 8,
    isFeatured: false,
    isNew: true
  },
  {
    id: '3',
    title: 'Tinh dầu sả chanh - Công dụng và cách sử dụng đúng cách',
    excerpt: 'Khám phá những lợi ích tuyệt vời của tinh dầu sả chanh trong việc thư giãn, khử trùng và tạo không gian sống trong lành.',
    content: 'Tinh dầu sả chanh là một trong những loại tinh dầu thiên nhiên được ưa chuộng nhất hiện nay...',
    author: 'Chị Mai Phương',
    publishedAt: '2025-09-15',
    category: 'Tinh Dầu',
    tags: ['tinh dầu', 'sả chanh', 'thư giãn'],
    imageUrl: '/images/tinh-dau-sa-chanh.jpg',
    readingTime: 6,
    isFeatured: false,
    isNew: false
  },
  {
    id: '4',
    title: 'Cách cúng rằm tháng 7 đúng cách theo truyền thống',
    excerpt: 'Hướng dẫn đầy đủ nghi lễ cúng rằm tháng 7, từ chuẩn bị lễ vật đến thời gian cúng phù hợp nhất.',
    content: 'Rằm tháng 7 âm lịch là một trong những ngày lễ quan trọng trong văn hóa tâm linh Việt Nam...',
    author: 'Thầy Đức Minh',
    publishedAt: '2025-09-12',
    category: 'Tâm Linh',
    tags: ['cúng rằm', 'tháng 7', 'truyền thống'],
    imageUrl: '/images/cung-ram-thang-7.jpg',
    readingTime: 10,
    isFeatured: true,
    isNew: false
  },
  {
    id: '5',
    title: 'Đá phong thủy nào phù hợp với mệnh Kim, Mộc, Thủy, Hỏa, Thổ',
    excerpt: 'Tìm hiểu cách chọn đá phong thủy phù hợp với ngũ hành mệnh số để tăng cường vận khí và sức khỏe.',
    content: 'Mỗi mệnh số trong ngũ hành đều có những viên đá phong thủy riêng giúp cân bằng năng lượng...',
    author: 'Thầy Hải Nam',
    publishedAt: '2025-09-10',
    category: 'Phong Thủy',
    tags: ['đá phong thủy', 'ngũ hành', 'mệnh số'],
    imageUrl: '/images/da-phong-thuy.jpg',
    readingTime: 12,
    isFeatured: false,
    isNew: false
  },
  {
    id: '6',
    title: 'Lợi ích của việc thắp nhang khi thiền định',
    excerpt: 'Khám phá tác dụng của hương thơm tự nhiên trong việc hỗ trợ thiền định, tĩnh tâm và nâng cao năng lượng tích cực.',
    content: 'Thiền định kết hợp với hương nhang tự nhiên đã được thực hành từ hàng ngàn năm trong văn hóa Á Đông...',
    author: 'Sư Thích Minh Tâm',
    publishedAt: '2025-09-08',
    category: 'Tâm Linh',
    tags: ['thiền định', 'nhang', 'tâm linh'],
    imageUrl: '/images/thien-dinh-nhang.jpg',
    readingTime: 7,
    isFeatured: false,
    isNew: false
  }
];

const BLOG_CATEGORIES = [
  { id: 'all', name: 'Tất cả', count: MOCK_BLOG_POSTS.length },
  { id: 'Nhang Trầm', name: 'Nhang Trầm', count: MOCK_BLOG_POSTS.filter(p => p.category === 'Nhang Trầm').length },
  { id: 'Phong Thủy', name: 'Phong Thủy', count: MOCK_BLOG_POSTS.filter(p => p.category === 'Phong Thủy').length },
  { id: 'Tinh Dầu', name: 'Tinh Dầu', count: MOCK_BLOG_POSTS.filter(p => p.category === 'Tinh Dầu').length },
  { id: 'Tâm Linh', name: 'Tâm Linh', count: MOCK_BLOG_POSTS.filter(p => p.category === 'Tâm Linh').length }
];

export function BlogTab({ 
  onPostClick, 
  searchQuery: externalSearchQuery = '', 
  selectedCategory: externalSelectedCategory = 'all',
  onSearchChange,
  onCategorySelect 
}: BlogTabProps) {
  // Use controlled props if provided, otherwise use internal state
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalSelectedCategory, setInternalSelectedCategory] = useState('all');
  
  const searchQuery = onSearchChange ? externalSearchQuery : internalSearchQuery;
  const selectedCategory = onCategorySelect ? externalSelectedCategory : internalSelectedCategory;

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    let posts = MOCK_BLOG_POSTS;

    if (selectedCategory !== 'all') {
      posts = posts.filter(post => post.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [searchQuery, selectedCategory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Blog NhangSach.Net</h1>
          <p className="text-green-100 text-sm md:text-base">
            Chia sẻ kiến thức về nhang sạch, tâm linh và phong thủy
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                if (onSearchChange) {
                  onSearchChange(newQuery);
                } else {
                  setInternalSearchQuery(newQuery);
                }
              }}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 lg:min-w-fit">
            {BLOG_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (onCategorySelect) {
                    onCategorySelect(category.id);
                  } else {
                    setInternalSelectedCategory(category.id);
                  }
                }}
                className={`
                  ${selectedCategory === category.id 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'text-green-600 border-green-600 hover:bg-green-50'
                  }
                `}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Posts Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bài viết nổi bật</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.filter(post => post.isFeatured).slice(0, 2).map((post) => (
                <div 
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
                >
                  {post.imageUrl && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category}
                      </span>
                      {post.isNew && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Mới
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} phút đọc
                        </span>
                      </div>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Posts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 
               selectedCategory === 'all' ? 'Tất cả bài viết' : `Danh mục: ${BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredPosts.length} bài viết
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-gray-500">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
                >
                  {post.imageUrl && (
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {post.category}
                      </span>
                      {post.isNew && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Mới
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readingTime} phút
                      </span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{post.author}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}