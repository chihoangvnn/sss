import React, { useState } from 'react';
import { X, Plus, Minus, Heart, Star, Share2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category_id: string;
  stock: number;
  short_description?: string;
  status: string;
  description?: string;
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (quantity: number) => void;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
}

export function ProductDetailModal({ 
  product, 
  onClose, 
  onAddToCart, 
  onToggleWishlist, 
  isInWishlist 
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Use only real product images - no fabricated ones
  const productImages = product.image ? [product.image] : [];

  // Fetch real reviews when modal opens
  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await fetch(`/api/products/${product.id}/reviews`);
        if (response.ok) {
          const reviewData = await response.json();
          setReviews(reviewData || []);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product.id]);

  const averageRating = reviews.length > 0 
    ? reviews
        .filter(review => typeof review.rating === 'number' && !isNaN(review.rating))
        .reduce((acc, review, _, validReviews) => acc + review.rating / validReviews.length, 0)
    : 0;

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(quantity);
    setQuantity(1); // Reset quantity after adding to cart
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Chi tiết sản phẩm</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggleWishlist}>
              <Heart 
                className={`h-5 w-5 ${
                  isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400'
                }`} 
              />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-32">
          {/* Hero Image Carousel Section */}
          <div className="relative">
            {productImages.length > 0 ? (
              <>
                {/* Main Image Carousel */}
                <div className="relative w-full h-80 overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out h-full"
                    style={{ transform: `translateX(-${selectedImage * 100}%)` }}
                  >
                    {productImages.map((image, index) => (
                      <div key={index} className="w-full h-full flex-shrink-0">
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        {/* Error fallback for each image */}
                        <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center text-center">
                          <div>
                            <span className="text-6xl block mb-2">🖼️</span>
                            <p className="text-gray-500">Không thể tải hình ảnh</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Dots Indicators - Mockup Style: o O o o */}
                  {productImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`transition-all duration-200 ${
                            selectedImage === index 
                              ? 'w-3 h-3 bg-white rounded-full shadow-lg' 
                              : 'w-2 h-2 bg-white/60 rounded-full'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Touch/Swipe Navigation Hints */}
                  {productImages.length > 1 && (
                    <>
                      {selectedImage > 0 && (
                        <button
                          onClick={() => setSelectedImage(selectedImage - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                        >
                          ‹
                        </button>
                      )}
                      {selectedImage < productImages.length - 1 && (
                        <button
                          onClick={() => setSelectedImage(selectedImage + 1)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                        >
                          ›
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              // No product images - Enhanced placeholder matching mockup
              <div className="w-full h-80 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-8xl mb-4 block">📸</span>
                  <p className="text-gray-600 text-lg font-medium">[ Hình ảnh / video ]</p>
                  <p className="text-gray-400 text-sm mt-1">Nhang cháy, nguyên liệu</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="px-4 pb-4">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating - Only show if reviews with ratings exist */}
              {reviews.length > 0 && averageRating > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {renderStars(averageRating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({reviews.filter(r => typeof r.rating === 'number').length} đánh giá)
                  </span>
                </div>
              )}

              {/* Price & Stock */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-bold text-green-600">
                  {product.price.toLocaleString('vi-VN')}₫
                </span>
                <Badge variant="secondary" className="text-sm">
                  Còn {product.stock} sản phẩm
                </Badge>
              </div>

              {/* Description */}
              {product.short_description && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Long Description */}
              {(product.description || product.short_description) ? (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Mô tả chi tiết</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || product.short_description}
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Mô tả chi tiết</h3>
                  <div className="text-center py-4">
                    <p className="text-gray-500">Thông tin đang được cập nhật</p>
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Đánh giá từ khách hàng 
                  {!reviewsLoading && reviews.length > 0 && ` (${reviews.length})`}
                </h3>
                
                {reviewsLoading ? (
                  // Loading state
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  // Show real reviews
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {review.author || review.customer_name || 'Khách hàng'}
                          </span>
                          <div className="flex items-center">
                            {typeof review.rating === 'number' && !isNaN(review.rating) ? (
                              renderStars(review.rating)
                            ) : (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                Chưa đánh giá
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          {review.comment || review.content}
                        </p>
                        <span className="text-xs text-gray-500">
                          {review.date || review.created_at || 'Gần đây'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Empty state - no reviews
                  <div className="text-center py-6">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Chưa có đánh giá nào</p>
                    <p className="text-gray-400 text-sm">Hãy là người đầu tiên đánh giá sản phẩm này</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-10 h-10 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
                className="w-10 h-10 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Thêm vào giỏ - {(product.price * quantity).toLocaleString('vi-VN')}₫
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}