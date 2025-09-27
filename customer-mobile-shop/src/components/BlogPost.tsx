'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Clock, User, Tag, Share2, BookOpen, Eye, Calendar } from 'lucide-react';
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
  readingTime: number;
  isNew?: boolean;
  isFeatured?: boolean;
  views?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

interface BlogPostProps {
  post: BlogPost;
  onBack: () => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
}

export function BlogPost({ post, onBack, onTagClick, onCategoryClick }: BlogPostProps) {
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);

  // Generate Table of Contents from content
  const generateTOC = (content: string): TableOfContentsItem[] => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const toc: TableOfContentsItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      
      toc.push({
        id,
        title,
        level
      });
    }

    return toc;
  };

  // Parse content and replace headings with proper HTML
  const parseContent = (content: string): string => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    
    return content.replace(headingRegex, (match, hashes, title) => {
      const level = hashes.length;
      const id = title.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return `<h${level} id="${id}" class="scroll-mt-4">${title.trim()}</h${level}>`;
    });
  };

  const parsedContent = useMemo(() => parseContent(post.content), [post.content]);

  useEffect(() => {
    const toc = generateTOC(post.content);
    setTableOfContents(toc);
  }, [post.content]);

  // Intersection Observer for active heading
  useEffect(() => {
    const headings = document.querySelectorAll('h1, h2, h3');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -80% 0%' }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, [parsedContent]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.seoTitle || post.title,
    "description": post.seoDescription || post.excerpt,
    "image": post.imageUrl,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "NhangSach.Net",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://nhangsach.net/blog/${post.id}`
    },
    "keywords": post.seoKeywords || post.tags,
    "wordCount": post.content.split(' ').length,
    "timeRequired": `PT${post.readingTime}M`,
    "articleSection": post.category,
    "about": {
      "@type": "Thing",
      "name": post.category
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Schema Markup - Can be handled at page level */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center text-sm text-gray-600">
            <button
              onClick={onBack}
              className="flex items-center hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Blog
            </button>
            <span className="mx-2">/</span>
            <button
              onClick={() => onCategoryClick?.(post.category)}
              className="hover:text-green-600 transition-colors"
            >
              {post.category}
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <article className="flex-1 max-w-4xl">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  onClick={() => onCategoryClick?.(post.category)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {post.category}
                </button>
                {post.isNew && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Mới
                  </span>
                )}
                {post.isFeatured && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Nổi bật
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.readingTime} phút đọc</span>
                </div>
                {post.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views.toLocaleString('vi-VN')} lượt xem</span>
                  </div>
                )}
              </div>

              {/* Featured Image */}
              {post.imageUrl && (
                <div className="mb-8">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Chia sẻ:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </header>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />

            {/* Tags */}
            <div className="mt-12 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thẻ bài viết</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </article>

          {/* Desktop Sidebar with Table of Contents */}
          <aside className="lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-6">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Mục lục
                  </h3>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToHeading(item.id)}
                        className={`
                          block w-full text-left text-sm py-2 px-3 rounded transition-colors
                          ${item.level === 1 ? 'font-semibold' : 
                            item.level === 2 ? 'pl-6' : 'pl-9'}
                          ${activeHeading === item.id 
                            ? 'bg-green-100 text-green-800 border-l-2 border-green-500' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {item.title}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              {/* Related Articles Placeholder */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bài viết liên quan</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <p>Các bài viết liên quan sẽ được hiển thị ở đây...</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}