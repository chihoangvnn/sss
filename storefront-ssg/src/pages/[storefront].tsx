import { GetStaticProps, GetStaticPaths } from 'next';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { OrderForm } from '@/components/OrderForm';
import { StorefrontData, Product } from '@/types';
import { staticApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface StorefrontPageProps {
  storefront: StorefrontData;
  generatedAt: string;
}

export default function StorefrontPage({ storefront, generatedAt }: StorefrontPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product);
    setShowOrderForm(true);
  };

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    setSelectedProduct(null);
  };

  const handleOrderCancel = () => {
    setShowOrderForm(false);
    setSelectedProduct(null);
  };

  // Get featured product (first product or product with most views)
  const featuredProduct = storefront.products[0];

  return (
    <Layout 
      storefront={storefront}
      title={`${storefront.contactInfo.businessName} - Cửa hàng trực tuyến`}
      description={`Mua sắm ${storefront.products.length} sản phẩm chất lượng cao tại ${storefront.contactInfo.businessName}. Giao hàng nhanh chóng, thanh toán khi nhận hàng.`}
    >
      {/* Hero Section */}
      {featuredProduct && (
        <section className="relative bg-gradient-to-r from-gray-900 to-gray-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                  Chào mừng đến với{' '}
                  <span style={{ color: storefront.primaryColor }}>
                    {storefront.contactInfo.businessName}
                  </span>
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Khám phá {storefront.products.length} sản phẩm chất lượng cao với giá cả hợp lý. 
                  Giao hàng nhanh chóng, thanh toán khi nhận hàng.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleAddToCart(featuredProduct)}
                    className="px-8 py-3 text-lg font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: storefront.primaryColor }}
                  >
                    Mua ngay - {formatPrice(featuredProduct.price)}
                  </button>
                  <a
                    href="#products"
                    className="px-8 py-3 text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors text-center"
                  >
                    Xem tất cả sản phẩm
                  </a>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={featuredProduct.images?.[0]?.secure_url || featuredProduct.image}
                  alt={featuredProduct.name}
                  className="w-full h-96 object-cover rounded-lg shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white text-gray-900 p-4 rounded-lg shadow-lg">
                  <div className="text-sm text-gray-600">Sản phẩm nổi bật</div>
                  <div className="font-bold text-lg">{featuredProduct.name}</div>
                  <div 
                    className="font-bold text-xl"
                    style={{ color: storefront.primaryColor }}
                  >
                    {formatPrice(featuredProduct.price)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section id="products" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sản phẩm của chúng tôi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá bộ sưu tập {storefront.products.length} sản phẩm chất lượng cao, 
              được tuyển chọn kỹ lưỡng để mang đến trải nghiệm tốt nhất cho bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {storefront.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                theme={storefront.theme}
                primaryColor={storefront.primaryColor}
                className="animate-fade-in"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: storefront.primaryColor }}
              >
                🚚
              </div>
              <h3 className="text-xl font-semibold mb-2">Giao hàng nhanh</h3>
              <p className="text-gray-600">Giao hàng trong 24h tại nội thành, 2-3 ngày toàn quốc</p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: storefront.primaryColor }}
              >
                💳
              </div>
              <h3 className="text-xl font-semibold mb-2">Thanh toán linh hoạt</h3>
              <p className="text-gray-600">COD, chuyển khoản, thanh toán online đều được hỗ trợ</p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: storefront.primaryColor }}
              >
                🛡️
              </div>
              <h3 className="text-xl font-semibold mb-2">Bảo hành chất lượng</h3>
              <p className="text-gray-600">Cam kết chất lượng, đổi trả trong 7 ngày nếu không hài lòng</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
            <p className="text-lg text-gray-600">
              Có câu hỏi? Chúng tôi luôn sẵn sàng hỗ trợ bạn!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Thông tin liên hệ</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span>{storefront.contactInfo.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <a 
                    href={`tel:${storefront.contactInfo.phone}`}
                    className="hover:underline"
                    style={{ color: storefront.primaryColor }}
                  >
                    {storefront.contactInfo.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✉️</span>
                  <a 
                    href={`mailto:${storefront.contactInfo.email}`}
                    className="hover:underline"
                    style={{ color: storefront.primaryColor }}
                  >
                    {storefront.contactInfo.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Giờ làm việc</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Thứ 2 - Thứ 6:</span>
                  <span>8:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Thứ 7:</span>
                  <span>8:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Chủ nhật:</span>
                  <span>Nghỉ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form Modal */}
      {showOrderForm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <OrderForm
              product={selectedProduct}
              storefrontConfigId={storefront.storefrontConfigId}
              onSuccess={handleOrderSuccess}
              onCancel={handleOrderCancel}
              primaryColor={storefront.primaryColor}
            />
          </div>
        </div>
      )}

      {/* Static generation info (hidden in production) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded text-xs">
          Static generated at: {new Date(generatedAt).toLocaleString('vi-VN')}
        </div>
      )}
    </Layout>
  );
}

// Static Site Generation - Build time data fetching
export const getStaticProps: GetStaticProps<StorefrontPageProps> = async ({ params }) => {
  const storefrontName = params?.storefront as string;

  if (!storefrontName) {
    return {
      notFound: true,
    };
  }

  try {
    const storefront = await staticApi.fetchStorefrontData(storefrontName);

    if (!storefront) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        storefront,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error generating static props for ${storefrontName}:`, error);
    return {
      notFound: true,
    };
  }
};

// Static Site Generation - Build time path generation
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const storefronts = await staticApi.fetchAllStorefronts();
    
    // Generate paths for all active storefronts
    const paths = storefronts
      .filter(storefront => storefront.isActive)
      .map(storefront => ({
        params: { storefront: storefront.name },
      }));

    return {
      paths,
      // Full static export - pre-generate all pages at build time
      fallback: false,
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: false,
    };
  }
};