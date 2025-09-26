import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLunarData } from '@/hooks/useLunarData';

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

interface FullScreenLunarCalendarProps {
  onBack?: () => void;
}

interface SelectedDayDetail {
  day: LunarDay;
  solarDayNumber: number;
}

export const FullScreenLunarCalendar = memo(({ onBack }: FullScreenLunarCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date()); // New state for day navigation
  
  // Use optimized hook for lunar data
  const { data: lunarData, loading, error, refetch } = useLunarData(currentYear, currentMonth, {
    prefetchAdjacent: true,
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
  });
  
  const [selectedDay, setSelectedDay] = useState<SelectedDayDetail | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);


  // Navigation
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

  // Handle day click
  const handleDayClick = useCallback((day: LunarDay) => {
    const solarDayNumber = parseInt(day.solarDate.split('-')[2]);
    setSelectedDay({ day, solarDayNumber });
  }, []);

  // Vietnamese month names
  const monthNames = [
    'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Vietnamese day names
  const dayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

  // Navigation for selected date
  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    
    // If navigated to different month, update month view
    if (newDate.getMonth() !== currentMonth || newDate.getFullYear() !== currentYear) {
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
    }
  }, [selectedDate, currentMonth, currentYear]);

  // Get selected date information (instead of just today)
  const todayInfo = useMemo(() => {
    if (!lunarData) return null;
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return lunarData.days.find(day => day.solarDate === selectedDateStr);
  }, [lunarData, selectedDate]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    if (!lunarData || !lunarData.days.length) return [];
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    // Calculate Monday-based offset: Sunday=6, Monday=0, Tuesday=1, etc.
    const dayOffset = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOffset);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const lunarDay = lunarData.days.find(d => d.solarDate === dateStr);
        const isCurrentMonth = currentDate.getMonth() === currentMonth;
        
        days.push({
          date: new Date(currentDate),
          dateStr,
          lunarDay,
          isCurrentMonth,
          solarDayNumber: currentDate.getDate()
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return days;
  }, [lunarData, currentMonth, currentYear]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải lịch âm dương...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
          <Button onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50">
      {/* Header xanh lá theo mẫu - Thu nhỏ để nổi bật phần ngày tháng */}
      <div className="bg-green-600 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-green-700 mr-2 p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-sm font-semibold">LỊCH VẠN NIÊN</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickView(true)}
            className="text-green-600 border-white bg-white hover:bg-gray-100 text-xs px-2 py-1"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Xem nhanh
          </Button>
        </div>
      </div>

      {/* Hiển thị ngày hôm nay theo mẫu */}
      {todayInfo && (
        <div className="bg-white px-4 py-6 border-b">
          <div className="flex items-center justify-between">
            {/* Navigation Button Left */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDay('prev')}
              className="text-gray-600 hover:bg-gray-100 p-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex-1 flex items-center justify-between mx-4">
              {/* Dương lịch */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Dương lịch</div>
                <div className="text-7xl font-bold text-green-600">{selectedDate.getDate()}</div>
                <div className="text-sm text-gray-700 mt-1">
                  {monthNames[selectedDate.getMonth()]} năm {selectedDate.getFullYear()}
                </div>
              </div>

              {/* Âm lịch */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Âm lịch</div>
                <div className="text-7xl font-bold text-green-800">{todayInfo?.lunarDate || '-'}</div>
                <div className="text-sm text-red-600 mt-1">
                  {todayInfo?.holidayName || `Tháng ${todayInfo?.lunarMonth || '-'} Âm`}
                </div>
              </div>
            </div>

            {/* Navigation Button Right */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDay('next')}
              className="text-gray-600 hover:bg-gray-100 p-2"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Thông tin chi tiết */}
          <div className="mt-4 space-y-2 text-sm">
            <div><span className="font-medium">Mệnh ngày:</span> {todayInfo.canChi}</div>
            <div><span className="font-medium">Giờ hoàng đạo:</span> Dần (3h-5h), Thìn (7h-9h), Tỵ (9h-11h), Thân (15h-17h), Dậu (17h-19h), Hợi (21h-23h)</div>
            <div><span className="font-medium">Tuổi xung:</span> Canh thìn, Bính thìn</div>
          </div>
        </div>
      )}

      {/* Navigation tháng theo mẫu */}
      <div className="bg-green-600 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="text-white hover:bg-green-700 p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
            
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium"
            >
              {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-green-600 border-white hover:bg-gray-100 text-xs px-2 py-1"
            >
              XEM
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="text-white hover:bg-green-700 p-1"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Header ngày trong tuần */}
      <div className="bg-gray-100 grid grid-cols-7 border-b">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center py-2 text-sm font-medium text-gray-700 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Lưới lịch */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isToday = day.lunarDay?.isToday;
            const isHoliday = day.lunarDay?.isHoliday;
            const isGoodDay = day.lunarDay?.isGoodDay;
            
            return (
              <div
                key={index}
                className={`border-r border-b last:border-r-0 h-20 p-1 cursor-pointer transition-colors ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isToday ? 'bg-yellow-100' : ''} hover:bg-gray-50`}
                onClick={() => day.lunarDay && handleDayClick(day.lunarDay)}
              >
                <div className="h-full flex flex-col">
                  {/* Ngày dương lịch */}
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-blue-600' : 
                    isHoliday ? 'text-red-600' : 
                    !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day.solarDayNumber}
                  </div>
                  
                  {/* Ngày âm lịch */}
                  {day.lunarDay && (
                    <>
                      <div className="text-xs text-gray-600">
                        {day.lunarDay.lunarDate}
                      </div>
                      
                      {/* Tên ngày âm hoặc lễ */}
                      {day.lunarDay.holidayName && (
                        <div className="text-xs text-red-600 font-medium mt-auto leading-tight">
                          {day.lunarDay.holidayName.length > 10 ? 
                            day.lunarDay.holidayName.substring(0, 10) + '...' : 
                            day.lunarDay.holidayName}
                        </div>
                      )}
                      
                      {/* Chấm màu cho ngày tốt/xấu */}
                      <div className="flex justify-center mt-auto">
                        {isGoodDay && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {day.lunarDay.dayQuality === 'bad' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chú thích */}
      <div className="bg-white border-t px-4 py-2">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Ngày hoàng đạo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Ngày hắc đạo</span>
          </div>
        </div>
      </div>

      {/* Modal chi tiết ngày */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Ngày {selectedDay.solarDayNumber} - {monthNames[currentMonth]} {currentYear}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Thông tin âm lịch</h4>
                <div className="space-y-1 text-sm">
                  <div>Ngày âm lịch: <span className="font-medium">{selectedDay.day.lunarDate}/{selectedDay.day.lunarMonth}/{selectedDay.day.lunarYear}</span></div>
                  <div>Can Chi: <span className="font-medium">{selectedDay.day.canChi}</span></div>
                  <div>Chất lượng ngày: <span className={`font-medium ${
                    selectedDay.day.dayQuality === 'good' ? 'text-green-600' :
                    selectedDay.day.dayQuality === 'bad' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedDay.day.dayQuality === 'good' ? 'Ngày tốt' :
                     selectedDay.day.dayQuality === 'bad' ? 'Ngày xấu' : 'Ngày bình thường'}
                  </span></div>
                  {selectedDay.day.holidayName && (
                    <div>Lễ/Tết: <span className="font-medium text-red-600">{selectedDay.day.holidayName}</span></div>
                  )}
                </div>
              </div>
              
              {selectedDay.day.productSuggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Gợi ý sản phẩm</h4>
                  <div className="space-y-1">
                    {selectedDay.day.productSuggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-gray-600">• {suggestion}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick view modal */}
      {showQuickView && (
        <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xem nhanh theo ngày</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Chọn ngày để xem thông tin chi tiết</p>
              <input 
                type="date" 
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setCurrentMonth(date.getMonth());
                  setCurrentYear(date.getFullYear());
                  setShowQuickView(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

FullScreenLunarCalendar.displayName = 'FullScreenLunarCalendar';

export default FullScreenLunarCalendar;