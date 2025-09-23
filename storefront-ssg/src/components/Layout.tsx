import React, { ReactNode } from 'react';
import Head from 'next/head';
import { StorefrontData } from '@/types';
import { generateColorShades } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  storefront?: StorefrontData;
  title?: string;
  description?: string;
}

export function Layout({ 
  children, 
  storefront, 
  title = 'Storefront',
  description = 'Trang bán hàng trực tuyến'
}: LayoutProps) {
  // Generate dynamic color scheme if storefront data is available
  const colorShades = storefront?.primaryColor 
    ? generateColorShades(storefront.primaryColor)
    : {};

  const pageTitle = storefront 
    ? `${storefront.contactInfo.businessName} - ${title}`
    : title;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={description} />

        {/* Theme color */}
        {storefront?.primaryColor && (
          <meta name="theme-color" content={storefront.primaryColor} />
        )}

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Custom CSS variables for dynamic theming */}
        {storefront?.primaryColor && (
          <style jsx global>{`
            :root {
              --primary-color: ${storefront.primaryColor};
              --primary-50: ${colorShades[50] || storefront.primaryColor};
              --primary-100: ${colorShades[100] || storefront.primaryColor};
              --primary-200: ${colorShades[200] || storefront.primaryColor};
              --primary-300: ${colorShades[300] || storefront.primaryColor};
              --primary-400: ${colorShades[400] || storefront.primaryColor};
              --primary-500: ${colorShades[500] || storefront.primaryColor};
              --primary-600: ${colorShades[600] || storefront.primaryColor};
              --primary-700: ${colorShades[700] || storefront.primaryColor};
              --primary-800: ${colorShades[800] || storefront.primaryColor};
              --primary-900: ${colorShades[900] || storefront.primaryColor};
            }
          `}</style>
        )}
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        {storefront && (
          <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo/Business name */}
                <div className="flex-shrink-0">
                  <h1 
                    className="text-xl font-bold"
                    style={{ color: storefront.primaryColor }}
                  >
                    {storefront.contactInfo.businessName}
                  </h1>
                </div>

                {/* Contact info */}
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                  {storefront.contactInfo.phone && (
                    <a 
                      href={`tel:${storefront.contactInfo.phone}`}
                      className="hover:text-gray-900 transition-colors"
                    >
                      📞 {storefront.contactInfo.phone}
                    </a>
                  )}
                  {storefront.contactInfo.email && (
                    <a 
                      href={`mailto:${storefront.contactInfo.email}`}
                      className="hover:text-gray-900 transition-colors"
                    >
                      ✉️ {storefront.contactInfo.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        {storefront && (
          <footer className="bg-gray-900 text-white mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Business Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {storefront.contactInfo.businessName}
                  </h3>
                  <div className="space-y-2 text-gray-300">
                    <p>📍 {storefront.contactInfo.address}</p>
                    <p>📞 {storefront.contactInfo.phone}</p>
                    <p>✉️ {storefront.contactInfo.email}</p>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li><a href="#products" className="hover:text-white transition-colors">Sản phẩm</a></li>
                    <li><a href="#contact" className="hover:text-white transition-colors">Liên hệ</a></li>
                    <li><a href="#about" className="hover:text-white transition-colors">Giới thiệu</a></li>
                  </ul>
                </div>

                {/* Social & Payment */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thanh toán & Giao hàng</h3>
                  <div className="text-gray-300 space-y-2">
                    <p>💳 Thanh toán khi nhận hàng</p>
                    <p>🏦 Chuyển khoản ngân hàng</p>
                    <p>🚚 Giao hàng toàn quốc</p>
                    <p>📦 Miễn phí giao hàng nội thành</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 {storefront.contactInfo.businessName}. Tất cả quyền được bảo lưu.</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}