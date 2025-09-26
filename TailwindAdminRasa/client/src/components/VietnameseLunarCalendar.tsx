import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LunarDay {
  solarDate: string; // ISO date string
  lunarDate: number;
  lunarMonth: number;
  lunarYear: number;
  canChi: string;
  isGoodDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isToday: boolean;
  dayQuality: 'good' | 'normal' | 'bad';
  productSuggestions: string[];
}

interface LunarMonthData {
  days: LunarDay[];
  monthInfo: {
    lunarMonth: number;
    lunarYear: number;
    canChiMonth: string;
    seasonContext: string;
  };
}

interface VietnameseLunarCalendarProps {
  className?: string;
}

export function VietnameseLunarCalendar({ className = '' }: VietnameseLunarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [lunarData, setLunarData] = useState<LunarMonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real Vietnamese lunar calendar data from API
  const fetchLunarData = async (year: number, month: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/lunar-calendar?year=${year}&month=${month + 1}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lunar calendar: ${response.statusText}`);
      }
      
      const data: LunarMonthData = await response.json();
      setLunarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lunar calendar');
      console.error('Lunar calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month/year changes
  useEffect(() => {
    fetchLunarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Generate calendar grid with proper alignment
  const generateCalendarGrid = (): (LunarDay | null)[] => {
    if (!lunarData) return [];
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const grid: (LunarDay | null)[] = [];
    
    // Add empty cells for week alignment
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    
    // Add actual days
    lunarData.days.forEach(day => {
      const solarDay = parseInt(day.solarDate.split('-')[2]);
      if (solarDay >= 1 && solarDay <= daysInMonth) {
        grid.push(day);
      }
    });
    
    return grid;
  };

  const getDayStyle = (day: LunarDay | null) => {
    if (!day) return 'min-h-[60px]'; // Empty cell
    
    let baseStyle = 'flex flex-col items-center justify-center p-1 rounded-lg min-h-[60px] relative cursor-pointer hover:bg-gray-50 ';
    
    if (day.isToday) {
      baseStyle += 'bg-blue-500 text-white font-bold ';
    } else if (day.isHoliday) {
      baseStyle += 'bg-red-100 text-red-800 ';
    } else if (day.dayQuality === 'good') {
      baseStyle += 'bg-green-100 text-green-800 ';
    } else if (day.dayQuality === 'bad') {
      baseStyle += 'bg-gray-100 text-gray-600 ';
    } else {
      baseStyle += 'text-gray-700 ';
    }
    
    return baseStyle;
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-lg font-bold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>Ngày lễ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>Ngày tốt</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Hôm nay</span>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Đang tải lịch âm dương...</div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Không thể tải lịch âm dương</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => fetchLunarData(currentYear, currentMonth)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* Calendar days */}
      {!loading && !error && lunarData && (
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, index) => (
            <div key={index} className={getDayStyle(day)}>
              {day && (
                <>
                  <div className="text-sm font-medium">
                    {parseInt(day.solarDate.split('-')[2])}
                  </div>
                  <div className="text-xs text-center">
                    <div>{day.lunarDate}/{day.lunarMonth}</div>
                    <div className="text-xs truncate max-w-full" title={day.canChi}>
                      {day.canChi.split(' ')[0]}
                    </div>
                  </div>
                  {day.isHoliday && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Today's info */}
      {!loading && !error && lunarData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Hôm nay</h3>
          {(() => {
            const today = lunarData.days.find(day => day.isToday);
            if (today) {
              return (
                <div className="text-sm text-gray-700">
                  <p>Ngày âm lịch: {today.lunarDate}/{today.lunarMonth} {lunarData.monthInfo.canChiMonth}</p>
                  <p>Can Chi: {today.canChi}</p>
                  <p className={today.dayQuality === 'good' ? 'text-green-600' : today.dayQuality === 'bad' ? 'text-red-600' : 'text-gray-600'}>
                    {today.dayQuality === 'good' ? '✅ Ngày tốt cho mua sắm' : 
                     today.dayQuality === 'bad' ? '❌ Ngày không tốt' : '⚪ Ngày bình thường'}
                  </p>
                  {today.isHoliday && (
                    <p className="text-red-600">🏮 {today.holidayName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Mùa: {lunarData.monthInfo.seasonContext}</p>
                </div>
              );
            }
            return <p className="text-sm text-gray-500">Không có thông tin hôm nay</p>;
          })()}
        </div>
      )}

      {/* Product suggestions based on lunar calendar */}
      {!loading && !error && lunarData && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">🌱 Gợi ý sản phẩm hôm nay</h3>
          <div className="text-sm text-green-700">
            {(() => {
              const today = lunarData.days.find(day => day.isToday);
              if (today && today.productSuggestions.length > 0) {
                return today.productSuggestions.map((suggestion, index) => (
                  <p key={index}>• {suggestion}</p>
                ));
              }
              return (
                <>
                  <p>• Rau xanh hữu cơ tươi ngon</p>
                  <p>• Trái cây theo mùa tự nhiên</p>
                  <p>• Thực phẩm hữu cơ sạch</p>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default VietnameseLunarCalendar;