import { useState } from "react";
import { Eye, Heart, ShoppingCart, MapPin, Star, Play, Users, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ShopeeProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  sold: number;
  location: string;
  shopName: string;
  isLive?: boolean;
  viewerCount?: number;
  hasFreeship?: boolean;
  vouchers?: string[];
  discount?: number;
  tags?: string[];
}

interface ShopeeProductGridProps {
  products?: ShopeeProduct[];
  onProductClick?: (product: ShopeeProduct) => void;
  onAddToCart?: (product: ShopeeProduct) => void;
  onLikeProduct?: (product: ShopeeProduct) => void;
  className?: string;
}

// Mock data y hệt Shopee trong hình bạn gửi
const mockShopeeProducts: ShopeeProduct[] = [
  {
    id: "1",
    name: "[MỚI] Quần thể thao nam 6inch Pickleball Smash Short",
    price: 223860,
    originalPrice: 280000,
    images: ["https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Product+1"],
    rating: 5.0,
    reviewCount: 73,
    sold: 2,
    location: "Hà Nội",
    shopName: "Pickleball Store",
    isLive: true,
    viewerCount: 11700,
    hasFreeship: true,
    vouchers: ["25.9"],
    discount: 20,
    tags: ["Đã bán 73"]
  },
  {
    id: "2", 
    name: "[FREESHIP] Máy xay thịt đông nghiệp đa năng làm mịn",
    price: 731860,
    images: ["https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Product+2"],
    rating: 4.8,
    reviewCount: 156,
    sold: 3,
    location: "Bắc Ninh",
    shopName: "Kitchen Pro",
    hasFreeship: true,
    tags: ["Đã bán 7k+"]
  },
  {
    id: "3",
    name: "Quần Shorts thể thao Gym 5\" Essentials slim fit",
    price: 166683,
    images: ["https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Product+3"],
    rating: 4.9,
    reviewCount: 234,
    sold: 1,
    location: "Hà Nội",
    shopName: "Gym Wear VN"
  },
  {
    id: "4",
    name: "Áo thun thể thao Melange Exdry thấm hút mồ hôi",
    price: 155730,
    images: ["https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=Product+4"],
    rating: 4.7,
    reviewCount: 89,
    sold: 5,
    location: "TP.HCM",
    shopName: "Sport Fashion"
  },
  {
    id: "5",
    name: "Dao Đa Sỹ thép Nhật không gỉ. Dao thái thịt - Dao thái gọt hoa quả",
    price: 27900,
    images: ["https://via.placeholder.com/300x300/FECA57/FFFFFF?text=Product+5"],
    rating: 4.6,
    reviewCount: 456,
    sold: 2,
    location: "Hà Nội",
    shopName: "Kitchen Tools",
    vouchers: ["25.9"],
    tags: ["Đã bán 5k+"]
  },
  {
    id: "6",
    name: "Ghế Con Giường Xếp Gấp Gọn Thường Khi",
    price: 486330,
    originalPrice: 780000,
    images: ["https://via.placeholder.com/300x300/FF9FF3/FFFFFF?text=Product+6"],
    rating: 4.1,
    reviewCount: 234,
    sold: 1,
    location: "Hà Nội", 
    shopName: "Furniture Plus",
    discount: 38,
    vouchers: ["FREESHIP"],
    tags: ["Đã bán 3k+"]
  }
];

// Format giá Việt Nam giống Shopee
const formatShopeePrice = (price: number) => {
  return `₫${new Intl.NumberFormat('vi-VN').format(price)}`;
};

// Component Badge LIVE
const LiveBadge = ({ viewerCount }: { viewerCount?: number }) => (
  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
    <Play className="h-3 w-3 fill-white" />
    LIVE
    {viewerCount && (
      <span className="flex items-center gap-1 ml-1">
        <Users className="h-3 w-3" />
        {viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}
      </span>
    )}
  </div>
);

// Component Badge Freeship
const FreeshipBadge = () => (
  <div className="absolute top-2 right-2 bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-md">
    FREESHIP
  </div>
);

// Component Voucher Badge
const VoucherBadge = ({ voucher }: { voucher: string }) => (
  <div className="bg-yellow-400 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold border border-orange-300 shadow-sm">
    {voucher}
  </div>
);

// Component Discount Badge
const DiscountBadge = ({ discount }: { discount: number }) => (
  <div className="absolute bottom-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold shadow-md">
    -{discount}%
  </div>
);

export function ShopeeProductGrid({ 
  products = mockShopeeProducts, 
  onProductClick,
  onAddToCart,
  onLikeProduct,
  className = ""
}: ShopeeProductGridProps) {
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  const handleLike = (product: ShopeeProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = new Set(likedProducts);
    if (newLiked.has(product.id)) {
      newLiked.delete(product.id);
    } else {
      newLiked.add(product.id);
    }
    setLikedProducts(newLiked);
    onLikeProduct?.(product);
  };

  const handleAddToCart = (product: ShopeeProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div className={`shopee-grid min-h-screen bg-gray-50 ${className}`}>
      {/* Shopee Header với Search Bar */}
      <div className="bg-orange-500 text-white p-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Status Bar Mock */}
          <div className="text-sm font-medium">21:54</div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-sm">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-white rounded"></div>
              <div className="w-1 h-3 bg-white rounded"></div>
              <div className="w-1 h-3 bg-white/60 rounded"></div>
              <div className="w-1 h-3 bg-white/30 rounded"></div>
            </div>
            <span className="ml-2">5G</span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3 relative">
          <input 
            type="text"
            placeholder="Coolmate"
            className="w-full h-10 pl-4 pr-12 bg-white text-gray-800 rounded-md text-sm border-0"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Camera className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Cart Icon */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <ShoppingCart className="h-6 w-6 text-white" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              99+
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid - 2 columns như Shopee */}
      <div className="grid grid-cols-2 gap-1 p-2">
        {products.map((product) => (
          <Card
            key={product.id}
            className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white"
            onClick={() => onProductClick?.(product)}
          >
            <CardContent className="p-0">
              {/* Product Image Container */}
              <div className="relative w-full aspect-square bg-gray-100">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Badges */}
                {product.isLive && <LiveBadge viewerCount={product.viewerCount} />}
                {product.hasFreeship && <FreeshipBadge />}
                {product.discount && <DiscountBadge discount={product.discount} />}

                {/* Heart Icon */}
                <button
                  onClick={(e) => handleLike(product, e)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                  style={{ right: product.hasFreeship ? '44px' : '8px' }}
                >
                  <Heart 
                    className={`h-4 w-4 transition-colors ${
                      likedProducts.has(product.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600 hover:text-red-400'
                    }`}
                  />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-2 space-y-1.5">
                {/* Vouchers */}
                {product.vouchers && product.vouchers.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {product.vouchers.map((voucher, idx) => (
                      <VoucherBadge key={idx} voucher={voucher} />
                    ))}
                  </div>
                )}

                {/* Product Name */}
                <h3 className="text-sm text-gray-800 line-clamp-2 leading-tight font-normal">
                  {product.name}
                </h3>

                {/* Price Section */}
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 font-semibold text-base">
                    {formatShopeePrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-gray-400 text-xs line-through">
                      {formatShopeePrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Rating and Sales */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{product.rating}</span>
                    {product.tags && (
                      <span className="text-gray-400 ml-1">{product.tags[0]}</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{product.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Navigation giống Shopee */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span className="text-xs text-orange-500 font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-500">Mall</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-500">Live & Video</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-500">Thông báo</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-500">Tôi</span>
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="w-32 h-1 bg-black rounded-full mx-auto mt-2"></div>
      </div>

      {/* Padding for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
}

export default ShopeeProductGrid;