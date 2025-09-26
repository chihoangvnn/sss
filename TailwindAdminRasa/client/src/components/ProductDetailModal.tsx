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
  benefits?: string | string[]; // Added benefits field for organic food business
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

  const handleThinhNhang = () => {
    // Special premium purchase action - could be immediate checkout or special blessing option
    onAddToCart(quantity);
    setQuantity(1);
    // TODO: Could trigger special checkout flow or blessing ceremony booking
    console.log('Thỉnh Nhang (Premium Purchase) initiated');
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

              {/* Benefits Section - Organic Food Vietnamese Style */}
              <div className="mb-6 bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">🌿 Lợi ích chính</h3>
                
                {/* Smart benefits based on product data */}
                <div className="space-y-3">
                  {/* Dynamic benefits from product.benefits with proper fallback */}
                  {(() => {
                    // Get benefits from product data safely with proper typing
                    const productBenefits = product.benefits;
                    let benefitsList: string[] = [];
                    
                    // Convert benefits to array format
                    if (typeof productBenefits === 'string' && productBenefits.trim()) {
                      benefitsList = productBenefits.split(',').map(b => b.trim()).filter(b => b);
                    } else if (Array.isArray(productBenefits) && productBenefits.length > 0) {
                      benefitsList = productBenefits.filter(b => typeof b === 'string' && b.trim());
                    }
                    
                    // If no valid dynamic benefits, use generic organic benefits
                    if (benefitsList.length === 0) {
                      benefitsList = [
                        '100% tự nhiên, không hóa chất',
                        'An toàn cho cả gia đình', 
                        'Nguồn gốc rõ ràng, truy xuất được',
                        'Giá trị dinh dưỡng cao'
                      ];
                    }
                    
                    return benefitsList.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{benefit}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Shipping Info Section with Checkmarks */}
              <div className="mb-6 bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">🚚 Thông tin giao hàng</h3>
                
                <div className="space-y-3">
                  {[
                    'Miễn phí vận chuyển đơn hàng từ 300.000₫',
                    'Giao hàng trong 24h khu vực nội thành',
                    'Đóng gói an toàn, giữ tươi ngon',
                    'Kiểm tra hàng trước khi thanh toán',
                    'Đổi trả trong 7 ngày nếu không hài lòng'
                  ].map((shippingInfo, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 leading-relaxed">{shippingInfo}</span>
                    </div>
                  ))}
                </div>
              </div>

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

        {/* Sticky Bottom Actions - Two Button Layout */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
          {/* Quantity Selector Row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-10 h-10 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center font-semibold text-lg">
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

          {/* Two Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-sm">Thêm vào Giỏ hàng</span>
            </Button>
            
            {/* Thỉnh Nhang (Premium Purchase) Button */}
            <Button
              onClick={handleThinhNhang}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={product.stock === 0}
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-sm">Thỉnh Nhang</span>
            </Button>
          </div>
          
          {/* Price Display */}
          <div className="text-center mt-2 text-gray-600 text-sm">
            Tổng: <span className="font-semibold text-green-600">{(product.price * quantity).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
}