'use client'

import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Star, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LunarDay, fetchLunarDay, fetchLunarMonth } from '@/lib/lunarApi';

interface LunarCalendarProps {
  className?: string;
}

export function LunarCalendar({ className = '' }: LunarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<LunarDay | null>(null);
  const [monthData, setMonthData] = useState<LunarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'month' | 'day'>('day');

  // Load lunar data for selected day
  useEffect(() => {
    loadDayData(selectedDate);
  }, [selectedDate]);

  // Load lunar data for current month when month view is active
  useEffect(() => {
    if (view === 'month') {
      loadMonthData(currentDate);
    }
  }, [currentDate, view]);

  const loadDayData = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = await fetchLunarDay(dateStr);
      setSelectedDayData(data);
    } catch (error) {
      console.error('Error loading lunar day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthData = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthResult = await fetchLunarMonth(year, month);
      if (monthResult) {
        setMonthData(monthResult.days);
      }
    } catch (error) {
      console.error('Error loading lunar month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const getDayQualityIcon = (quality: 'good' | 'normal' | 'bad') => {
    switch (quality) {
      case 'good': return <Star className="h-4 w-4 text-green-600" />;
      case 'bad': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDayQualityBadge = (quality: 'good' | 'normal' | 'bad') => {
    switch (quality) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'bad': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getDayQualityText = (quality: 'good' | 'normal' | 'bad') => {
    switch (quality) {
      case 'good': return 'Ngày Hoàng Đạo';
      case 'bad': return 'Ngày Hắc Đạo';
      default: return 'Ngày Bình Thường';
    }
  };

  // Render day view (default)
  const renderDayView = () => (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateDay('prev')}
          className="h-10 w-10 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center flex-1 mx-4">
          <h2 className="text-lg font-bold text-gray-800">
            {format(selectedDate, 'EEEE', { locale: vi })}
          </h2>
          <p className="text-sm text-gray-600">
            {format(selectedDate, 'dd/MM/yyyy')}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateDay('next')}
          className="h-10 w-10 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : selectedDayData ? (
        <div className="space-y-4">
          {/* Day Quality Badge */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getDayQualityBadge(selectedDayData.dayQuality)}`}>
              {getDayQualityIcon(selectedDayData.dayQuality)}
              <span className="font-semibold">{getDayQualityText(selectedDayData.dayQuality)}</span>
            </div>
            
            {selectedDayData.isHoliday && selectedDayData.holidayName && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-800 font-medium">🎉 {selectedDayData.holidayName}</span>
              </div>
            )}
          </div>

          {/* Lunar Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Thông tin Âm lịch
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Can Chi:</span>
                <span className="font-medium text-green-700">{selectedDayData.canChi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Âm lịch:</span>
                <span className="font-medium">{selectedDayData.lunarDate}/{selectedDayData.lunarMonth}/{selectedDayData.lunarYear}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dương lịch:</span>
                <span className="font-medium">{format(selectedDate, 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Product Suggestions */}
          {selectedDayData.productSuggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Gợi ý sản phẩm trong ngày</h3>
              <div className="space-y-2">
                {selectedDayData.productSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                    <span className="text-green-600 text-sm">•</span>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setView('month')}
              className="flex-1"
            >
              Xem tháng
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDate(new Date())}
              className="flex-1"
            >
              Hôm nay
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Không có dữ liệu cho ngày này
        </div>
      )}
    </div>
  );

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h2>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const dayData = monthData.find(d => d.solarDate === format(day, 'yyyy-MM-dd'));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={dayIndex}
                    onClick={() => {
                      setSelectedDate(day);
                      setView('day');
                    }}
                    className={`
                      h-12 w-full flex flex-col items-center justify-center text-xs rounded-lg relative
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                      ${isSelected ? 'bg-green-600 text-white' : ''}
                      ${isToday && !isSelected ? 'bg-green-100 text-green-800 font-bold' : ''}
                      ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                    `}
                  >
                    <span className="font-medium">{format(day, 'd')}</span>
                    {dayData && isCurrentMonth && (
                      <div className="absolute bottom-0.5 right-0.5">
                        {getDayQualityIcon(dayData.dayQuality)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Back to day view */}
        <Button 
          variant="outline" 
          onClick={() => setView('day')}
          className="w-full"
        >
          Quay lại xem ngày
        </Button>
      </div>
    );
  };

  return (
    <div className={`p-4 bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lịch Vạn Niên</h1>
          <p className="text-sm text-gray-600">Tra cứu ngày tốt xấu, Can Chi</p>
        </div>

        {/* Content */}
        {view === 'day' ? renderDayView() : renderMonthView()}
      </div>
    </div>
  );
}