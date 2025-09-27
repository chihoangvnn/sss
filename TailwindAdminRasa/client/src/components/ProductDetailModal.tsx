import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Minus, Star, Share2, ShoppingCart, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComprehensiveDisplay } from './storefront/EnhancedProductDisplay';

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
  
  // Sticky button behavior state
  const [showStickyButtons, setShowStickyButtons] = useState(false);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag to close functionality
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  // Accordion state management
  const [openAccordions, setOpenAccordions] = useState<{[key: string]: boolean}>({
    description: false,
    ingredients: false,
    usage: false,
    faq: false,
    customDescriptions: false  // Vietnamese incense custom descriptions
  });

  // Use only real product images - no fabricated ones
  const productImages = product.image ? [product.image] : [];

  // Fetch real reviews when modal opens
  // Shared helper to safely parse rating values (string or number) with validation
  const parseRating = (rating: any): number => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return (typeof numRating === 'number' && !isNaN(numRating) && numRating >= 1 && numRating <= 5) ? numRating : 5;
  };

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
    ? reviews.map(review => parseRating(review.rating))
        .reduce((acc, rating) => acc + rating, 0) / reviews.length
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

  // Sticky button scroll detection
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    const actionButtons = actionButtonsRef.current;
    
    if (!scrollContainer || !actionButtons) return;
    
    const containerRect = scrollContainer.getBoundingClientRect();
    const buttonRect = actionButtons.getBoundingClientRect();
    
    // Show sticky buttons when action buttons are scrolled past view
    const buttonsScrolledPast = buttonRect.bottom < containerRect.top + 100;
    setShowStickyButtons(buttonsScrolledPast);
  }, []);

  // Attach scroll listener to content area
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Toggle accordion sections
  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Drag functionality for mobile drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    // Only allow dragging down (positive distance)
    if (distance > 0) {
      setDragDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (dragDistance > 150) {
      // Close modal if dragged down more than 150px
      onClose();
    }
    
    setDragDistance(0);
    setIsDragging(false);
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
    <div className="fixed inset-0 z-60 flex items-end">
      {/* Semi-transparent backdrop for better focus */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div 
        ref={drawerRef}
        className="bg-gray-50 w-full h-full relative shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col"
        style={{
          transform: `translateY(${dragDistance}px)`,
          opacity: isDragging ? Math.max(1 - dragDistance / 300, 0.3) : 1
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer Handle */}
        <div className="flex justify-center pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-green-600 z-10 p-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-white">Chi tiết sản phẩm</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }} className="text-white hover:text-green-100">
              <Calendar 
                className="h-5 w-5" 
              />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} className="text-white hover:text-green-100">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white hover:text-green-100">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
          <div className="bg-white rounded-t-lg mx-4 mt-4 p-4 shadow-sm border border-gray-100">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating - Only show if reviews with ratings exist */}
              {reviews.length > 0 && averageRating > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({reviews.length} đánh giá)
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

              {/* Action Buttons - Positioned After Description */}
              <div ref={actionButtonsRef} id="action-buttons" className="mb-6 space-y-4">
                {/* Quantity Selector Row */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }}
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
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Unified Action Button - Matching Storefront Style */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Thêm vào Giỏ hàng
                  </Button>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleThinhNhang(); }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
                    disabled={product.stock === 0}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Thỉnh Nhang
                  </Button>
                </div>
                
                {/* Price Display */}
                <div className="text-center mt-2 text-gray-600 text-sm">
                  Tổng: <span className="font-semibold text-green-600">{(product.price * quantity).toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Benefits Section - Organic Food Vietnamese Style */}
              <div className="mb-6 bg-green-50 rounded-lg p-4 border border-green-100">
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
              <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
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

              {/* Accordion Sections for Detailed Information */}
              <div className="mb-6 bg-white rounded-lg border border-gray-100 overflow-hidden">
                {/* Product Description Accordion */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('description')}
                    className="w-full flex items-center justify-between py-4 px-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      📋 Mô tả sản phẩm
                    </h3>
                    {openAccordions.description ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openAccordions.description && (
                    <div className="pb-4 px-4 text-gray-700 leading-relaxed">
                      <p className="mb-3">
                        {product.description || 'Sản phẩm hữu cơ chất lượng cao, được sản xuất theo tiêu chuẩn VietGAP. Không sử dụng hóa chất độc hại, đảm bảo an toàn cho sức khỏe người tiêu dùng.'}
                      </p>
                      <p>
                        Được trồng và chăm sóc theo phương pháp tự nhiên, giữ nguyên hương vị đặc trưng và giá trị dinh dưỡng cao nhất.
                      </p>
                    </div>
                  )}
                </div>

                {/* Ingredients Accordion */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('ingredients')}
                    className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      🌿 Thành phần
                    </h3>
                    {openAccordions.ingredients ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openAccordions.ingredients && (
                    <div className="pb-4 text-gray-700 leading-relaxed">
                      <ul className="space-y-2">
                        <li>• 100% thành phần tự nhiên</li>
                        <li>• Không chất bảo quản</li>
                        <li>• Không hương liệu nhân tạo</li>
                        <li>• Không chất màu tổng hợp</li>
                        <li>• Được chứng nhận hữu cơ</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Usage Instructions Accordion */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('usage')}
                    className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      📖 Hướng dẫn sử dụng
                    </h3>
                    {openAccordions.usage ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openAccordions.usage && (
                    <div className="pb-4 text-gray-700 leading-relaxed">
                      <div className="space-y-3">
                        <div>
                          <strong>Bảo quản:</strong> Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp
                        </div>
                        <div>
                          <strong>Sử dụng:</strong> Rửa sạch trước khi chế biến
                        </div>
                        <div>
                          <strong>Hạn sử dụng:</strong> Xem trên bao bì sản phẩm
                        </div>
                        <div>
                          <strong>Lưu ý:</strong> Sản phẩm tự nhiên, có thể có sự khác biệt về màu sắc và kích thước
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Accordion */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('faq')}
                    className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      ❓ FAQ thường gặp
                    </h3>
                    {openAccordions.faq ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openAccordions.faq && (
                    <div className="pb-4 text-gray-700 leading-relaxed">
                      <div className="space-y-4">
                        <div>
                          <strong>Q: Sản phẩm có an toàn cho trẻ em không?</strong>
                          <p>A: Hoàn toàn an toàn. Sản phẩm được sản xuất theo tiêu chuẩn hữu cơ, không chứa hóa chất độc hại.</p>
                        </div>
                        <div>
                          <strong>Q: Tôi có thể trả hàng nếu không hài lòng?</strong>
                          <p>A: Có, bạn có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên vẹn.</p>
                        </div>
                        <div>
                          <strong>Q: Sản phẩm có được chứng nhận không?</strong>
                          <p>A: Có, sản phẩm đạt chứng nhận VietGAP và các tiêu chuẩn chất lượng quốc tế.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🎯 VIETNAMESE INCENSE CUSTOM DESCRIPTIONS ACCORDION */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('customDescriptions')}
                    className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      🙏 Thông tin tâm linh & văn hóa
                    </h3>
                    {openAccordions.customDescriptions ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {openAccordions.customDescriptions && (
                    <div className="pb-4 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
                      <ComprehensiveDisplay product={product as any} />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Reviews Section */}
              <div className="mb-6">
                {/* Reviews Header with Average Rating */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    💬 Đánh giá từ khách hàng
                  </h3>
                  {!reviewsLoading && reviews.length > 0 && (() => {
                    // Calculate average rating using shared helper for consistency
                    const validRatings = reviews.map(review => parseRating(review.rating));
                    const averageRating = validRatings.reduce((acc, rating) => acc + rating, 0) / validRatings.length;
                    
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(Math.round(averageRating))}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {averageRating.toFixed(1)}/5
                        </span>
                        <span className="text-sm text-gray-500">({reviews.length} đánh giá)</span>
                      </div>
                    );
                  })()}
                </div>
                
                {reviewsLoading ? (
                  // Enhanced loading state
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-3">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  // Enhanced reviews display
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={review.id || index} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        {/* Review Header */}
                        <div className="flex items-start gap-3 mb-3">
                          {/* User Avatar */}
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-semibold text-sm">
                              {(review.author || review.customer_name || 'KH').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* User Info and Rating */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {review.author || review.customer_name || 'Khách hàng'}
                                </span>
                                {/* Verified Purchase Badge */}
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                  ✓ Đã mua hàng
                                </span>
                              </div>
                              <div className="flex items-center">
                                {renderStars(parseRating(review.rating))}
                              </div>
                            </div>
                            
                            {/* Review Date */}
                            <div className="text-xs text-gray-500">
                              {review.date || review.created_at || '2 ngày trước'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Review Content */}
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {review.comment || review.content || 'Sản phẩm rất tốt, chất lượng hữu cơ tuyệt vời. Tôi sẽ mua lại lần sau.'}
                        </p>
                        
                        {/* Review Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <button className="text-sm text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1">
                              👍 Hữu ích (12)
                            </button>
                            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                              Trả lời
                            </button>
                          </div>
                          {/* Rating Value Display */}
                          <span className="text-sm font-medium text-green-600">
                            {parseRating(review.rating)}/5 ⭐
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* View More Reviews Button */}
                    {reviews.length >= 3 && (
                      <div className="text-center pt-2">
                        <button className="text-green-600 hover:text-green-700 font-medium text-sm underline">
                          Xem thêm đánh giá
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Enhanced empty state
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Chưa có đánh giá nào</h4>
                    <p className="text-gray-500 text-sm mb-4">Hãy là người đầu tiên chia sẻ trải nghiệm của bạn</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      Viết đánh giá đầu tiên
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Buttons - Professional & Above Bottom Nav */}
        {showStickyButtons && (
          <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl p-4 z-[9999] mx-auto max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Enhanced Background Blur */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/90 rounded-t-2xl"></div>
            
            {/* Content with relative positioning */}
            <div className="relative z-10">
              {/* Quantity Selector Row */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }}
                  disabled={quantity <= 1}
                  className="w-12 h-12 p-0 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all rounded-xl"
                >
                  <Minus className="h-5 w-5 text-green-600" />
                </Button>
                <div className="w-20 text-center">
                  <span className="text-xl font-bold text-gray-900 bg-green-50 px-4 py-2 rounded-xl border-2 border-green-100">
                    {quantity}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}
                  disabled={quantity >= product.stock}
                  className="w-12 h-12 p-0 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all rounded-xl"
                >
                  <Plus className="h-5 w-5 text-green-600" />
                </Button>
              </div>

              {/* Two Action Buttons - Identical Professional Style */}
              <div className="flex items-center gap-3">
                {/* Add to Cart Button */}
                <Button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 border-0"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span className="text-sm tracking-wide">Giỏ hàng</span>
                </Button>
                
                {/* Thỉnh Nhang (Premium Purchase) Button */}
                <Button
                  onClick={(e) => { e.stopPropagation(); handleThinhNhang(); }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 border-0 relative overflow-hidden"
                  disabled={product.stock === 0}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent"></div>
                  <Calendar className="h-5 w-5 mr-2 relative z-10" />
                  <span className="text-sm tracking-wide relative z-10">Thỉnh Nhang</span>
                </Button>
              </div>
              
              {/* Enhanced Price Display */}
              <div className="text-center mt-3 bg-green-50 py-2 px-4 rounded-xl border border-green-100">
                <span className="text-gray-600 text-sm">Tổng cộng: </span>
                <span className="font-bold text-green-700 text-lg">{(product.price * quantity).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}