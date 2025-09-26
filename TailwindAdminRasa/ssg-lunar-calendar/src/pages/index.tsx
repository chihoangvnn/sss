import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface CalendarPageProps {
  currentMonth: string;
  todayDate: string;
  monthDays: Array<{
    date: string;
    dayNumber: number;
    isToday: boolean;
    isCurrentMonth: boolean;
  }>;
}

export default function LunarCalendarIndex({ currentMonth, todayDate, monthDays }: CalendarPageProps) {
  const pageTitle = `Lịch Vạn Niên Online - Xem Ngày Tốt Xấu ${currentMonth}`;
  const pageDescription = `Lịch vạn niên online chi tiết cho ${currentMonth}. Xem ngày tốt xấu, Can Chi, Âm lịch, giờ hoàng đạo, lễ tết Việt Nam. Tra cứu nhanh mọi thông tin phong thủy theo ngày.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* SEO Meta Tags */}
        <meta name="keywords" content="lịch vạn niên, lịch âm dương, xem ngày tốt xấu, can chi, phong thủy, lễ tết việt nam" />
        <meta name="author" content="Lịch Vạn Niên Online" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="vi" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="vi_VN" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${process.env.SITE_URL || 'https://nhangsach.net'}/lich-van-nien`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-primary-600 text-white py-6">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Lịch Vạn Niên Online
            </h1>
            <p className="text-primary-100 text-lg">
              Tra cứu ngày tốt xấu, Can Chi, Âm lịch chính xác nhất
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Today highlight */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Hôm nay: {format(new Date(todayDate), 'dd/MM/yyyy')}
            </h2>
            <Link 
              href={`/lich-van-nien/xem-ngay-${format(new Date(todayDate), 'dd-MM-yyyy')}`}
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Xem Chi Tiết Ngày Hôm Nay
            </Link>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary-600 text-white p-4">
              <h2 className="text-xl font-semibold text-center">
                Lịch Tháng {currentMonth}
              </h2>
            </div>
            
            <div className="p-6">
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="text-center font-semibold p-2 bg-gray-100 rounded">
                    {day}
                  </div>
                ))}
                
                {monthDays.map(({ date, dayNumber, isToday, isCurrentMonth }) => (
                  <Link
                    key={date}
                    href={`/lich-van-nien/xem-ngay-${format(new Date(date), 'dd-MM-yyyy')}`}
                    className={`
                      p-3 text-center rounded-lg border-2 transition-all hover:shadow-md
                      ${isToday ? 'bg-primary-600 text-white border-primary-600' : 
                        isCurrentMonth ? 'bg-white border-gray-200 hover:border-primary-300' :
                        'bg-gray-50 text-gray-400 border-gray-100'
                      }
                    `}
                  >
                    <div className="font-semibold">{dayNumber}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick links */}
          <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Tra cứu nhanh
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="#" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-primary-600 font-semibold">Ngày Tốt</div>
                <div className="text-sm text-gray-600">Các ngày hoàng đạo</div>
              </Link>
              <Link href="#" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-primary-600 font-semibold">Lễ Tết</div>
                <div className="text-sm text-gray-600">Ngày lễ Việt Nam</div>
              </Link>
              <Link href="#" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-primary-600 font-semibold">Can Chi</div>
                <div className="text-sm text-gray-600">Thông tin Can Chi</div>
              </Link>
              <Link href="#" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-primary-600 font-semibold">Giờ Tốt</div>
                <div className="text-sm text-gray-600">Giờ hoàng đạo</div>
              </Link>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-2">© 2024 Lịch Vạn Niên Online. Tra cứu lịch âm dương chính xác.</p>
            <p className="text-gray-400 text-sm">
              Thông tin tham khảo - Nguồn từ lịch truyền thống Việt Nam
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  // Generate all days in current month for the calendar grid
  const monthDays = eachDayOfInterval({
    start: currentMonthStart,
    end: currentMonthEnd,
  }).map(date => ({
    date: date.toISOString(),
    dayNumber: date.getDate(),
    isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
    isCurrentMonth: true,
  }));

  return {
    props: {
      currentMonth: format(today, 'MM/yyyy'),
      todayDate: today.toISOString(),
      monthDays,
    },
    revalidate: 3600, // Revalidate every hour
  };
};