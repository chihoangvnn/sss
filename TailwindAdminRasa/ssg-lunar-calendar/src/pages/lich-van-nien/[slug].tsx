import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { format, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { fetchLunarDay, generateDayTitle, generateDayDescription, formatDateForUrl, parseDateFromUrl, LunarDay, generateDateRange } from '@/lib/api';

interface DayPageProps {
  dayData: LunarDay;
  dateStr: string;
  prevDate: string;
  nextDate: string;
  formattedDate: string;
}

export default function ViewDayPage({ dayData, dateStr, prevDate, nextDate, formattedDate }: DayPageProps) {
  const pageTitle = generateDayTitle(dayData);
  const pageDescription = generateDayDescription(dayData);
  
  const date = new Date(dayData.solarDate);
  const vietnameseDayName = format(date, 'EEEE', { locale: vi });
  
  // Generate JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "name": `Ngày ${format(date, 'dd/MM/yyyy')}`,
        "description": pageDescription,
        "startDate": dayData.solarDate,
        "endDate": dayData.solarDate,
        "location": {
          "@type": "Place",
          "name": "Việt Nam",
          "addressCountry": "VN"
        },
        "organizer": {
          "@type": "Organization",
          "name": "Lịch Vạn Niên Online"
        }
      },
      {
        "@type": "WebPage",
        "name": pageTitle,
        "description": pageDescription,
        "url": `${process.env.SITE_URL || 'https://nhangsach.net'}/lich-van-nien/xem-ngay-${dateStr}`,
        "inLanguage": "vi-VN",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Lịch Vạn Niên Online",
          "url": process.env.SITE_URL || 'https://nhangsach.net'
        }
      }
    ]
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* SEO Meta Tags */}
        <meta name="keywords" content={`xem ngày ${formattedDate}, ${dayData.canChi}, lịch âm dương, ngày ${dayData.dayQuality === 'good' ? 'tốt' : dayData.dayQuality === 'bad' ? 'xấu' : 'bình thường'}, giờ hoàng đạo`} />
        <meta name="author" content="Lịch Vạn Niên Online" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="vi" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="vi_VN" />
        <meta property="og:site_name" content="Lịch Vạn Niên Online" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${process.env.SITE_URL || 'https://nhangsach.net'}/lich-van-nien/xem-ngay-${dateStr}`} />
        
        {/* Navigation hints for SEO */}
        <link rel="prev" href={`/lich-van-nien/xem-ngay-${prevDate}`} />
        <link rel="next" href={`/lich-van-nien/xem-ngay-${nextDate}`} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-primary-600 text-white py-4">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between mb-4">
              <Link href="/" className="text-primary-100 hover:text-white flex items-center">
                ← Về trang chủ lịch
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/lich-van-nien/xem-ngay-${prevDate}`}
                  className="bg-primary-700 hover:bg-primary-800 px-3 py-2 rounded text-sm"
                >
                  ← Ngày trước
                </Link>
                <Link 
                  href={`/lich-van-nien/xem-ngay-${nextDate}`}
                  className="bg-primary-700 hover:bg-primary-800 px-3 py-2 rounded text-sm"
                >
                  Ngày sau →
                </Link>
              </div>
            </nav>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {vietnameseDayName}, ngày {format(date, 'dd/MM/yyyy')}
              </h1>
              <p className="text-primary-100">
                {dayData.lunarDate}/{dayData.lunarMonth} Âm lịch - {dayData.canChi}
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Main day info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Solar & Lunar Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Day Quality Badge */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold mb-4 ${
                    dayData.dayQuality === 'good' ? 'bg-green-100 text-green-800' :
                    dayData.dayQuality === 'bad' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {dayData.dayQuality === 'good' ? '🟢 Ngày Hoàng Đạo (Tốt)' :
                     dayData.dayQuality === 'bad' ? '🔴 Ngày Hắc Đạo (Xấu)' :
                     '🟡 Ngày Bình Thường'
                    }
                  </div>
                  
                  {dayData.isHoliday && dayData.holidayName && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="text-red-800 font-semibold">🎉 {dayData.holidayName}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Can Chi Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin Can Chi</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Can Chi ngày:</span>
                    <span className="text-primary-600 font-semibold">{dayData.canChi}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Âm lịch:</span>
                    <span className="text-gray-800">{dayData.lunarDate}/{dayData.lunarMonth}/{dayData.lunarYear}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-700">Dương lịch:</span>
                    <span className="text-gray-800">{format(date, 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Good Hours */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Giờ Hoàng Đạo</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Tý (23h-1h)', 'Sửu (1h-3h)', 'Dần (3h-5h)', 'Mão (5h-7h)', 'Thìn (7h-9h)', 'Tỵ (9h-11h)'].map((hour, index) => (
                    <div key={index} className={`p-3 rounded-lg text-center text-sm ${
                      [0, 2, 4].includes(index) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {hour}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Tra cứu khác</h3>
                <div className="space-y-3">
                  <Link href="#" className="block p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                    📅 Xem tháng này
                  </Link>
                  <Link href="#" className="block p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    🎯 Chọn ngày khác
                  </Link>
                  <Link href="#" className="block p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    🔮 Xem tử vi
                  </Link>
                </div>
              </div>

              {/* Product Suggestions */}
              {dayData.productSuggestions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Gợi ý trong ngày</h3>
                  <div className="space-y-2">
                    {dayData.productSuggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <Link 
                href={`/lich-van-nien/xem-ngay-${prevDate}`}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-800"
              >
                <span>←</span>
                <div>
                  <div className="font-medium">Ngày trước</div>
                  <div className="text-sm text-gray-500">{format(subDays(date, 1), 'dd/MM')}</div>
                </div>
              </Link>
              
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                Về trang chủ
              </Link>
              
              <Link 
                href={`/lich-van-nien/xem-ngay-${nextDate}`}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-800"
              >
                <div className="text-right">
                  <div className="font-medium">Ngày sau</div>
                  <div className="text-sm text-gray-500">{format(addDays(date, 1), 'dd/MM')}</div>
                </div>
                <span>→</span>
              </Link>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-2">© 2024 Lịch Vạn Niên Online. Tra cứu lịch âm dương chính xác.</p>
            <p className="text-gray-400 text-sm">
              Thông tin ngày {format(date, 'dd/MM/yyyy')} - Can Chi {dayData.canChi} - Âm lịch {dayData.lunarDate}/{dayData.lunarMonth}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for the next 10 years for comprehensive SEO coverage
  const dates = generateDateRange(); // Full 10 years (~3650 pages)
  
  const paths = dates.map(dateStr => ({
    params: {
      slug: `xem-ngay-${formatDateForUrl(new Date(dateStr))}`
    }
  }));

  return {
    paths,
    fallback: 'blocking', // Enable ISR for dates not pre-generated
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slugParam = params?.slug as string;
  
  if (!slugParam) {
    return { notFound: true };
  }

  try {
    // Parse date from URL format (xem-ngay-dd-mm-yyyy) to ISO
    const isoDate = parseDateFromUrl(slugParam);
    const dayData = await fetchLunarDay(isoDate);
    
    if (!dayData) {
      return { notFound: true };
    }
    
    // Generate prev/next dates (with xem-ngay prefix for URLs)
    const currentDate = new Date(isoDate);
    const prevDate = `xem-ngay-${formatDateForUrl(subDays(currentDate, 1))}`;
    const nextDate = `xem-ngay-${formatDateForUrl(addDays(currentDate, 1))}`;
    
    return {
      props: {
        dayData,
        dateStr: slugParam.replace('xem-ngay-', ''), // Clean for display
        prevDate,
        nextDate,
        formattedDate: format(currentDate, 'dd/MM/yyyy'),
      },
      revalidate: 86400, // Revalidate daily
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
};