'use client';

import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook, MessageCircle, Star, Shield, Truck, CreditCard } from 'lucide-react';

const DesktopFooter = () => {
  // SEO Schema markup for LocalBusiness (Spiritual Products)
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "NhangSach.Net",
    "description": "Nhà cung cấp nhang sạch, sản phẩm tâm linh và phong thủy hàng đầu Việt Nam",
    "url": "https://nhangsach.net",
    "telephone": "+84-912-345-678",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Nguyễn Huệ, Quận 1",
      "addressLocality": "Hồ Chí Minh",
      "addressRegion": "TP.HCM",
      "postalCode": "700000",
      "addressCountry": "VN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 10.8231,
      "longitude": 106.6297
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "22:00"
    },
    "priceRange": "$$",
    "category": ["Spiritual Products", "Incense", "Feng Shui", "Religious Items"],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "2847"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Sản phẩm nhang sạch và tâm linh",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Nhang trầm hương cao cấp"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Product",
            "name": "Tinh dầu thảo mộc phong thủy"
          }
        }
      ]
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NhangSach.Net",
    "url": "https://nhangsach.net",
    "logo": "https://nhangsach.net/logo.png",
    "sameAs": [
      "https://facebook.com/nhangsach.net",
      "https://zalo.me/nhangsach"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+84-912-345-678",
      "contactType": "customer service",
      "availableLanguage": "Vietnamese"
    }
  };

  useEffect(() => {
    // Add schema markup to document head
    const businessScript = document.createElement('script');
    businessScript.type = 'application/ld+json';
    businessScript.text = JSON.stringify(businessSchema);
    document.head.appendChild(businessScript);

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationSchema);
    document.head.appendChild(orgScript);

    return () => {
      document.head.removeChild(businessScript);
      document.head.removeChild(orgScript);
    };
  }, []);

  const productCategories = [
    { name: 'Nhang Trầm Hương', href: '/category/nhang-tram-huong', seo: 'Nhang trầm hương cao cấp Việt Nam' },
    { name: 'Nhang Thảo Mộc', href: '/category/nhang-thao-moc', seo: 'Nhang thảo mộc thiên nhiên' },
    { name: 'Tinh Dầu Thơm', href: '/category/tinh-dau-thom', seo: 'Tinh dầu thơm phòng cao cấp' },
    { name: 'Phụ Kiện Phong Thủy', href: '/category/phu-kien-phong-thuy', seo: 'Đồ phong thủy may mắn' },
    { name: 'Nến Cầu Nguyện', href: '/category/nen-cau-nguyen', seo: 'Nến cầu nguyện tâm linh' },
    { name: 'Bình Hương Đồng', href: '/category/binh-huong-dong', seo: 'Bình hương đồng thau cao cấp' }
  ];

  const supportLinks = [
    { name: 'Liên Hệ', href: '/lien-he' },
    { name: 'Chính Sách Bảo Hành', href: '/chinh-sach-bao-hanh' },
    { name: 'Hướng Dẫn Mua Hàng', href: '/huong-dan-mua-hang' },
    { name: 'Chính Sách Vận Chuyển', href: '/chinh-sach-van-chuyen' },
    { name: 'Chính Sách Đổi Trả', href: '/chinh-sach-doi-tra' },
    { name: 'Câu Hỏi Thường Gặp', href: '/faq' }
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com/nhangsach.net', icon: Facebook },
    { name: 'Zalo', href: 'https://zalo.me/nhangsach', icon: MessageCircle },
    { name: 'Email', href: 'mailto:info@nhangsach.net', icon: Mail },
    { name: 'Hotline', href: 'tel:+84912345678', icon: Phone }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          
          {/* Company Info Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">NhangSach.Net</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Nhà cung cấp nhang sạch, sản phẩm tâm linh và phong thủy hàng đầu Việt Nam. 
              Chất lượng cao, nguồn gốc thiên nhiên, mang lại bình an và may mắn.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin size={16} className="text-green-500" />
                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone size={16} className="text-green-500" />
                <span>Hotline: 0912.345.678</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail size={16} className="text-green-500" />
                <span>info@nhangsach.net</span>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">4.8/5</span>
              </div>
              <p className="text-xs text-gray-500">Từ 2,847 đánh giá khách hàng</p>
            </div>
          </div>

          {/* Products Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Sản Phẩm</h4>
            <ul className="space-y-3">
              {productCategories.map((category) => (
                <li key={category.href}>
                  <a
                    href={category.href}
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors duration-200 block"
                    title={category.seo}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Special Categories */}
            <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-100">
              <h5 className="text-sm font-semibold text-green-800 mb-2">🕯️ Đặc Biệt</h5>
              <ul className="space-y-1">
                <li>
                  <a href="/san-pham-moi" className="text-xs text-green-700 hover:text-green-900">
                    Sản phẩm mới về
                  </a>
                </li>
                <li>
                  <a href="/best-seller" className="text-xs text-green-700 hover:text-green-900">
                    Nhang bán chạy nhất
                  </a>
                </li>
                <li>
                  <a href="/combo-gia-dinh" className="text-xs text-green-700 hover:text-green-900">
                    Combo gia đình
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors duration-200 block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Business Hours */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">⏰ Giờ Mở Cửa</h5>
              <p className="text-xs text-blue-700">Thứ 2 - Chủ nhật</p>
              <p className="text-xs text-blue-700 font-semibold">8:00 - 22:00</p>
              <p className="text-xs text-blue-600 mt-1">Tư vấn 24/7 qua Zalo</p>
            </div>
          </div>

          {/* Connect Column */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Kết Nối</h4>
            
            <div className="space-y-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex items-center space-x-3 text-sm text-gray-600 hover:text-green-600 transition-colors duration-200"
                  target={social.href.startsWith('http') ? '_blank' : '_self'}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : ''}
                >
                  <social.icon size={16} />
                  <span>{social.name}</span>
                </a>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">📧 Nhận tin khuyến mãi</h5>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                  Đăng ký
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nhận thông tin ưu đãi và sản phẩm mới
              </p>
            </div>

            {/* App Download */}
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-semibold text-gray-900">📱 Tải App</h5>
              <div className="flex space-x-2">
                <button className="flex-1 bg-black text-white text-xs px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
                  App Store
                </button>
                <button className="flex-1 bg-green-600 text-white text-xs px-3 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Google Play
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Shield size={24} className="text-green-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Bảo Mật</p>
                <p className="text-xs text-gray-600">SSL & An toàn</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <Truck size={24} className="text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Giao Hàng</p>
                <p className="text-xs text-gray-600">Toàn quốc 24h</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <CreditCard size={24} className="text-purple-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Thanh Toán</p>
                <p className="text-xs text-gray-600">Đa dạng & An toàn</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <Star size={24} className="text-yellow-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Chất Lượng</p>
                <p className="text-xs text-gray-600">Cam kết 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                🕯️ © 2024 <strong>NhangSach.Net</strong> - Nhang sạch cho tâm linh và phong thủy
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bản quyền thuộc về NhangSach.Net. Thiết kế bởi <span className="text-green-600">NhangSach Team</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-xs text-gray-500">
              <a href="/terms" className="hover:text-green-600 transition-colors">Điều khoản</a>
              <a href="/privacy" className="hover:text-green-600 transition-colors">Bảo mật</a>
              <a href="/sitemap.xml" className="hover:text-green-600 transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;