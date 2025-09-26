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
          {/* Product Images */}
          <div className="p-4">
            {productImages.length > 0 ? (
              <>
                <div className="mb-4">
                  <img
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-80 object-cover rounded-xl border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/400/400';
                    }}
                  />
                </div>
                
                {/* Image Thumbnails - Only show if multiple images */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImage === index ? 'border-green-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // No product images available - show placeholder
              <div className="mb-4">
                <div className="w-full h-80 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">📦</span>
                    <p className="text-gray-500">Không có hình ảnh sản phẩm</p>
                  </div>
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