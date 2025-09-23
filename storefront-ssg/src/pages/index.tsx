import { GetStaticProps } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { StorefrontConfig } from '@/types';
import { staticApi } from '@/lib/api';

interface HomePageProps {
  storefronts: StorefrontConfig[];
  generatedAt: string;
}

export default function HomePage({ storefronts, generatedAt }: HomePageProps) {
  return (
    <Layout
      title="Storefronts - Trang chủ"
      description="Khám phá các cửa hàng trực tuyến chất lượng cao với nhiều sản phẩm đa dạng"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Khám phá các{' '}
                <span className="text-blue-300">Cửa hàng</span>{' '}
                chất lượng cao
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Tìm kiếm và mua sắm từ {storefronts.length} cửa hàng trực tuyến uy tín, 
                với hàng nghìn sản phẩm chất lượng và giá cả hợp lý.
              </p>
              <a
                href="#storefronts"
                className="inline-block px-8 py-3 text-lg font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Xem tất cả cửa hàng
              </a>
            </div>
          </div>
        </section>

        {/* Storefronts Grid */}
        <section id="storefronts" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Các cửa hàng có sẵn
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Chọn cửa hàng phù hợp với nhu cầu của bạn. Mỗi cửa hàng đều được tối ưu 
                cho trải nghiệm mua sắm tốt nhất.
              </p>
            </div>

            {storefronts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {storefronts.map((storefront) => (
                  <Link 
                    key={storefront.id} 
                    href={`/${storefront.name}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:scale-105">
                      {/* Storefront Header */}
                      <div 
                        className="h-32 bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${storefront.primaryColor}, ${storefront.primaryColor}dd)`
                        }}
                      >
                        <div className="text-center text-white">
                          <h3 className="text-2xl font-bold mb-1">
                            {storefront.contactInfo.businessName}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {storefront.topProductsCount} sản phẩm
                          </p>
                        </div>
                      </div>

                      {/* Storefront Info */}
                      <div className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>🎨</span>
                            <span className="capitalize">Giao diện {storefront.theme}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📱</span>
                            <span>Tối ưu mobile</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>⚡</span>
                            <span>Tải nhanh với SSG</span>
                          </div>
                          {storefront.contactInfo.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>📞</span>
                              <span>{storefront.contactInfo.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-6">
                          <span 
                            className="inline-block px-4 py-2 text-sm font-medium text-white rounded-lg group-hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: storefront.primaryColor }}
                          >
                            Vào cửa hàng →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chưa có cửa hàng nào
                </h3>
                <p className="text-gray-600">
                  Các cửa hàng sẽ xuất hiện ở đây khi được kích hoạt.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tại sao chọn chúng tôi?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                  ⚡
                </div>
                <h3 className="text-xl font-semibold mb-2">Tốc độ siêu nhanh</h3>
                <p className="text-gray-600">
                  Sử dụng công nghệ Static Site Generation (SSG) để đảm bảo 
                  trang web tải cực nhanh
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                  📱
                </div>
                <h3 className="text-xl font-semibold mb-2">Tối ưu mobile</h3>
                <p className="text-gray-600">
                  Giao diện responsive hoàn hảo trên mọi thiết bị, 
                  từ điện thoại đến máy tính
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                  🛡️
                </div>
                <h3 className="text-xl font-semibold mb-2">Bảo mật cao</h3>
                <p className="text-gray-600">
                  Các trang web tĩnh đảm bảo bảo mật cao nhất, 
                  không có lỗ hổng server-side
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Static generation info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-2 rounded text-xs">
            Static generated at: {new Date(generatedAt).toLocaleString('vi-VN')}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const storefronts = await staticApi.fetchAllStorefronts();
    
    // Only include active storefronts
    const activeStorefronts = storefronts.filter(storefront => storefront.isActive);

    return {
      props: {
        storefronts: activeStorefronts,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating static props for home page:', error);
    return {
      props: {
        storefronts: [],
        generatedAt: new Date().toISOString(),
      },
    };
  }
};