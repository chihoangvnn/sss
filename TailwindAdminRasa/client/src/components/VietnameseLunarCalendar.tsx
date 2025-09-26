import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search, Filter, Star, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface CalendarCache {
  [key: string]: LunarMonthData;
}

interface SelectedDayDetail {
  day: LunarDay;
  solarDayNumber: number;
}

export function VietnameseLunarCalendar({ className = '' }: VietnameseLunarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [lunarData, setLunarData] = useState<LunarMonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced state for new features
  const [cache, setCache] = useState<CalendarCache>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedDayDetail | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterQuality, setFilterQuality] = useState<'all' | 'good' | 'bad' | 'holiday'>('all');

  // Enhanced API fetch with caching for performance
  const fetchLunarData = useCallback(async (year: number, month: number, useCache = true, updateUI = true) => {
    const cacheKey = `${year}-${month}`;
    
    // Check cache first for performance
    if (useCache && cache[cacheKey]) {
      if (updateUI) {
        setLunarData(cache[cacheKey]);
        setLoading(false);
      }
      return;
    }
    
    try {
      if (updateUI) {
        setLoading(true);
        setError(null);
      }
      
      const response = await fetch(`/api/lunar-calendar/bulk?startYear=${year}&startMonth=${month + 1}&months=3`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lunar calendar: ${response.statusText}`);
      }
      
      const bulkData: { [key: string]: LunarMonthData } = await response.json();
      
      // Update cache with all fetched months for better performance
      const newCache = { ...cache };
      Object.entries(bulkData).forEach(([key, data]) => {
        const [bulkYear, bulkMonth] = key.split('-').map(Number);
        const bulkCacheKey = `${bulkYear}-${bulkMonth - 1}`; // Convert back to 0-based month
        newCache[bulkCacheKey] = data;
      });
      setCache(newCache);
      
      // Only update UI if this is the foreground fetch
      if (updateUI) {
        const currentKey = `${year}-${month + 1}`;
        if (bulkData[currentKey]) {
          setLunarData(bulkData[currentKey]);
        } else {
          throw new Error('Current month data not found in bulk response');
        }
      }
    } catch (err) {
      if (updateUI) {
        setError(err instanceof Error ? err.message : 'Failed to load lunar calendar');
        console.error('Lunar calendar fetch error:', err);
      }
    } finally {
      if (updateUI) {
        setLoading(false);
      }
    }
  }, [cache]);

  // Fetch data when month/year changes with prefetching for performance
  useEffect(() => {
    // Foreground fetch - this updates the UI
    fetchLunarData(currentYear, currentMonth, true, true);
    
    // Prefetch adjacent months for smooth navigation (cache-only, no UI updates)
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Prefetch with slight delay to not block current request - cache only
    setTimeout(() => {
      fetchLunarData(nextYear, nextMonth, true, false); // updateUI = false
      fetchLunarData(prevYear, prevMonth, true, false); // updateUI = false
    }, 200);
  }, [currentYear, currentMonth, fetchLunarData]);

  // Enhanced navigation with smooth transitions
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
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
  }, [currentMonth, currentYear]);
  
  // Navigate to today
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }, []);
  
  // Handle day click
  const handleDayClick = useCallback((day: LunarDay) => {
    const solarDayNumber = parseInt(day.solarDate.split('-')[2]);
    setSelectedDay({ day, solarDayNumber });
  }, []);

  // Search functionality using the /search API endpoint
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const response = await fetch(
        `/api/lunar-calendar/search?query=${encodeURIComponent(query)}&year=${currentYear}&month=${currentMonth + 1}&filter=${filterQuality}`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const searchResults = await response.json();
      console.log('Search results:', searchResults);
      
      // Could implement search results display here
      // For now, just log the results
      
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [currentYear, currentMonth, filterQuality]);

  // Debounced search for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Vietnamese month and day names with traditional styling
  const monthNames = [
    'Tháng Giêng', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
    'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Chạp'
  ];

  const weekDays = [
    { short: 'CN', full: 'Chủ nhật' },
    { short: 'T2', full: 'Thứ hai' },
    { short: 'T3', full: 'Thứ ba' },
    { short: 'T4', full: 'Thứ tư' },
    { short: 'T5', full: 'Thứ năm' },
    { short: 'T6', full: 'Thứ sáu' },
    { short: 'T7', full: 'Thứ bảy' }
  ];

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

  // Enhanced styling with traditional Vietnamese colors and better UX
  const getDayStyle = useCallback((day: LunarDay | null) => {
    if (!day) return 'min-h-[70px] border border-transparent'; // Empty cell
    
    let baseStyle = `
      flex flex-col items-center justify-center p-2 rounded-xl min-h-[70px] relative cursor-pointer 
      transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg border-2
    `;
    
    if (day.isToday) {
      baseStyle += 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg border-blue-300 ';
    } else if (day.isHoliday) {
      baseStyle += 'bg-gradient-to-br from-red-100 to-red-200 text-red-800 border-red-300 shadow-md ';
    } else if (day.dayQuality === 'good') {
      baseStyle += 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 border-green-300 ';
    } else if (day.dayQuality === 'bad') {
      baseStyle += 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 border-gray-300 ';
    } else {
      baseStyle += 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 ';
    }
    
    return baseStyle;
  }, []);
  
  // Filter days based on search and quality filter
  const filteredDays = useMemo(() => {
    if (!lunarData) return [];
    
    return lunarData.days.filter(day => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          day.canChi.toLowerCase().includes(query) ||
          day.holidayName?.toLowerCase().includes(query) ||
          day.productSuggestions.some(p => p.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      
      // Quality filter
      if (filterQuality !== 'all') {
        if (filterQuality === 'holiday' && !day.isHoliday) return false;
        if (filterQuality === 'good' && day.dayQuality !== 'good') return false;
        if (filterQuality === 'bad' && day.dayQuality !== 'bad') return false;
      }
      
      return true;
    });
  }, [lunarData, searchQuery, filterQuality]);

  // Memoized calendar grid for performance
  const calendarGrid = useMemo(() => generateCalendarGrid(), [lunarData, currentYear, currentMonth]);
  
  // Get quality statistics for the month
  const monthStats = useMemo(() => {
    if (!lunarData) return { good: 0, bad: 0, holiday: 0, normal: 0 };
    
    return lunarData.days.reduce((stats, day) => {
      if (day.isHoliday) stats.holiday++;
      else if (day.dayQuality === 'good') stats.good++;
      else if (day.dayQuality === 'bad') stats.bad++;
      else stats.normal++;
      return stats;
    }, { good: 0, bad: 0, holiday: 0, normal: 0 });
  }, [lunarData]);

  return (
    <div className={`bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 shadow-xl border border-green-100 ${className}`}>
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
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-600 p-2" title={day.full}>
            {day.short}
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