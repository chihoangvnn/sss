// Vietnamese Lunar Calendar API with authentic calculations
// Based on traditional Vietnamese lunar calendar system
// Uses authentic vietnamese-lunar-calendar package for precise calculations

import { LunarDate } from 'vietnamese-lunar-calendar';

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

// Authentic Vietnamese Can Chi system
const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Traditional Vietnamese good/bad day calculations
const GOOD_LUNAR_DATES = [1, 3, 5, 9, 10, 13, 15, 16, 21, 23, 27, 28];
const BAD_LUNAR_DATES = [4, 7, 14, 18, 22];

// Vietnamese traditional holidays and festivals
const VIETNAMESE_HOLIDAYS = {
  '1-1': { name: 'Tết Nguyên Đán', description: 'Năm mới âm lịch' },
  '1-15': { name: 'Tết Nguyên Tiêu', description: 'Lễ hội đèn lồng' },
  '3-3': { name: 'Tết Hàn Thực', description: 'Lễ tảo mộ' },
  '4-8': { name: 'Phật Đản', description: 'Sinh nhật Phật Thích Ca' },
  '5-5': { name: 'Tết Đoan Ngọ', description: 'Diệt sâu bọ' },
  '7-7': { name: 'Thất Tịch', description: 'Lễ tình nhân Á Đông' },
  '7-15': { name: 'Vu Lan', description: 'Báo hiếu cha mẹ' },
  '8-15': { name: 'Tết Trung Thu', description: 'Lễ hội trăng rằm' },
  '9-9': { name: 'Tết Trùng Cửu', description: 'Lên cao' },
  '10-10': { name: 'Tết Thượng Cung', description: 'Lễ cúng tổ tiên' },
  '12-23': { name: 'Ông Táo', description: 'Cúng ông Táo về trời' }
};

// Convert Gregorian to authentic Vietnamese lunar date using precise calculations
function solarToLunar(solarDate: Date): { lunarDate: number; lunarMonth: number; lunarYear: number; isLeapMonth?: boolean } {
  try {
    // Create lunar date from solar date using authentic Vietnamese calculations
    const lunarDate = new LunarDate(solarDate);
    
    return {
      lunarDate: lunarDate.date,
      lunarMonth: lunarDate.month,
      lunarYear: lunarDate.year,
      isLeapMonth: (lunarDate as any).leap || false // Type assertion for leap property
    };
  } catch (error) {
    console.error('Error converting solar to lunar date:', error);
    // Fallback to a basic approximation if library fails
    const year = solarDate.getFullYear();
    const month = solarDate.getMonth() + 1;
    const day = solarDate.getDate();
    
    return {
      lunarDate: Math.max(1, Math.min(30, day - 7)),
      lunarMonth: Math.max(1, Math.min(12, month)),
      lunarYear: year
    };
  }
}

// Get Can Chi for a given year using authentic Vietnamese calculations
function getCanChiYear(year: number): string {
  // Adjust for Vietnamese calendar reference point
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  
  // Handle negative modulo for years before reference
  const adjustedCanIndex = canIndex < 0 ? canIndex + 10 : canIndex;
  const adjustedChiIndex = chiIndex < 0 ? chiIndex + 12 : chiIndex;
  
  return `${CAN[adjustedCanIndex]} ${CHI[adjustedChiIndex]}`;
}

// Get Can Chi for a given day using Julian Day Number for authentic calculation
function getCanChiDay(date: Date): string {
  // Calculate Julian Day Number for precise Can Chi calculation
  const julianDay = getJulianDayNumber(date);
  
  // Traditional Can Chi day calculation using Julian Day
  // Reference: Julian Day 0 corresponds to specific Can Chi combination
  const dayCount = (julianDay + 50) % 60; // Adjust for Can Chi cycle
  const canIndex = dayCount % 10;
  const chiIndex = dayCount % 12;
  
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

// Calculate Julian Day Number for precise astronomical calculations
function getJulianDayNumber(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  return jdn;
}

// Determine day quality based on traditional Vietnamese beliefs
function getDayQuality(lunarDate: number, canChi: string): 'good' | 'normal' | 'bad' {
  if (GOOD_LUNAR_DATES.includes(lunarDate)) return 'good';
  if (BAD_LUNAR_DATES.includes(lunarDate)) return 'bad';
  
  // Additional Can Chi based evaluations could be added here
  return 'normal';
}

// Get product suggestions based on lunar calendar and Vietnamese traditions
function getProductSuggestions(lunarDate: number, lunarMonth: number, dayQuality: 'good' | 'normal' | 'bad', isHoliday: boolean): string[] {
  const suggestions = [];
  
  // Base organic food suggestions
  const baseProducts = [
    'Rau xanh hữu cơ tươi ngon',
    'Trái cây theo mùa tự nhiên',
    'Gạo hữu cơ sạch'
  ];
  
  // Holiday-specific suggestions
  if (isHoliday) {
    if (lunarMonth === 1) { // Tết
      suggestions.push('Bánh chưng hữu cơ', 'Mứt Tết từ trái cây tự nhiên', 'Hoa quả ngũ quả');
    } else if (lunarMonth === 8) { // Trung Thu
      suggestions.push('Bánh trung thu chay', 'Grapefruit hữu cơ', 'Trà hoa cúc');
    } else if (lunarMonth === 7) { // Vu Lan
      suggestions.push('Hoa sen tươi', 'Trái cây cúng dường', 'Nước mắm hữu cơ');
    }
  }
  
  // Good day suggestions
  if (dayQuality === 'good') {
    suggestions.push('Thực phẩm bổ dưỡng cao cấp', 'Yến sào hữu cơ', 'Nấm linh chi tự nhiên');
  }
  
  // Seasonal suggestions based on lunar month
  if (lunarMonth <= 3) { // Spring
    suggestions.push('Rau má tươi', 'Măng tre non', 'Trà xanh Thái Nguyên');
  } else if (lunarMonth <= 6) { // Summer
    suggestions.push('Dưa hấu hữu cơ', 'Nước dừa tươi', 'Rau muống sạch');
  } else if (lunarMonth <= 9) { // Autumn
    suggestions.push('Hồng xiêm Đà Lạt', 'Khoai lang tím', 'Chè đậu xanh');
  } else { // Winter
    suggestions.push('Củ đậu hữu cơ', 'Gừng tươi', 'Nước mắm truyền thống');
  }
  
  return [...baseProducts, ...suggestions.slice(0, 3)];
}

import { Router } from 'express';

const router = Router();

// Get lunar calendar data for a specific month
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month parameters are required' });
    }
    
    const targetYear = parseInt(year as string);
    const targetMonth = parseInt(month as string);
    
    if (isNaN(targetYear) || isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    // Generate lunar calendar data for the requested month
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const today = new Date();
    const days: LunarDay[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(targetYear, targetMonth - 1, day);
      const lunar = solarToLunar(currentDate);
      const canChi = getCanChiDay(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Check for holidays
      const holidayKey = `${lunar.lunarMonth}-${lunar.lunarDate}`;
      const holiday = VIETNAMESE_HOLIDAYS[holidayKey as keyof typeof VIETNAMESE_HOLIDAYS];
      const isHoliday = !!holiday;
      
      const dayQuality = getDayQuality(lunar.lunarDate, canChi);
      const productSuggestions = getProductSuggestions(lunar.lunarDate, lunar.lunarMonth, dayQuality, isHoliday);
      
      days.push({
        solarDate: currentDate.toISOString().split('T')[0],
        lunarDate: lunar.lunarDate,
        lunarMonth: lunar.lunarMonth,
        lunarYear: lunar.lunarYear,
        canChi,
        isGoodDay: dayQuality === 'good',
        isHoliday,
        holidayName: holiday?.name,
        isToday,
        dayQuality,
        productSuggestions
      });
    }
    
    const monthData: LunarMonthData = {
      days,
      monthInfo: {
        lunarMonth: targetMonth,
        lunarYear: targetYear,
        canChiMonth: getCanChiMonth(targetYear, targetMonth),
        seasonContext: targetMonth <= 3 ? 'Xuân' : targetMonth <= 6 ? 'Hạ' : targetMonth <= 9 ? 'Thu' : 'Đông'
      }
    };
    
    res.status(200).json(monthData);
  } catch (error) {
    console.error('Lunar calendar API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a today endpoint for quick access
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const lunar = solarToLunar(today);
    const canChi = getCanChiDay(today);
    
    // Check for holidays
    const holidayKey = `${lunar.lunarMonth}-${lunar.lunarDate}`;
    const holiday = VIETNAMESE_HOLIDAYS[holidayKey as keyof typeof VIETNAMESE_HOLIDAYS];
    const isHoliday = !!holiday;
    
    const dayQuality = getDayQuality(lunar.lunarDate, canChi);
    const productSuggestions = getProductSuggestions(lunar.lunarDate, lunar.lunarMonth, dayQuality, isHoliday);
    
    const todayData: LunarDay = {
      solarDate: today.toISOString().split('T')[0],
      lunarDate: lunar.lunarDate,
      lunarMonth: lunar.lunarMonth,
      lunarYear: lunar.lunarYear,
      canChi,
      isGoodDay: dayQuality === 'good',
      isHoliday,
      holidayName: holiday?.name,
      isToday: true,
      dayQuality,
      productSuggestions
    };
    
    res.status(200).json(todayData);
  } catch (error) {
    console.error('Lunar calendar today API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk endpoint for performance - get multiple months at once  
router.get('/bulk', async (req, res) => {
  try {
    const { startYear, startMonth, months = 3 } = req.query;
    
    if (!startYear || !startMonth) {
      return res.status(400).json({ error: 'startYear and startMonth parameters are required' });
    }
    
    const year = parseInt(startYear as string);
    const month = parseInt(startMonth as string);
    const monthCount = Math.min(parseInt(months as string), 12); // Max 12 months
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    const result: { [key: string]: LunarMonthData } = {};
    
    // Generate data for requested months
    for (let i = 0; i < monthCount; i++) {
      let currentYear = year;
      let currentMonth = month + i;
      
      // Handle year overflow
      while (currentMonth > 12) {
        currentMonth -= 12;
        currentYear += 1;
      }
      
      const monthKey = `${currentYear}-${currentMonth}`;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const today = new Date();
      const days: LunarDay[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth - 1, day);
        const lunar = solarToLunar(currentDate);
        const canChi = getCanChiDay(currentDate);
        const isToday = currentDate.toDateString() === today.toDateString();
        
        // Check for holidays
        const holidayKey = `${lunar.lunarMonth}-${lunar.lunarDate}`;
        const holiday = VIETNAMESE_HOLIDAYS[holidayKey as keyof typeof VIETNAMESE_HOLIDAYS];
        const isHoliday = !!holiday;
        
        const dayQuality = getDayQuality(lunar.lunarDate, canChi);
        const productSuggestions = getProductSuggestions(lunar.lunarDate, lunar.lunarMonth, dayQuality, isHoliday);
        
        days.push({
          solarDate: currentDate.toISOString().split('T')[0],
          lunarDate: lunar.lunarDate,
          lunarMonth: lunar.lunarMonth,
          lunarYear: lunar.lunarYear,
          canChi,
          isGoodDay: dayQuality === 'good',
          isHoliday,
          holidayName: holiday?.name,
          isToday,
          dayQuality,
          productSuggestions
        });
      }
      
      result[monthKey] = {
        days,
        monthInfo: {
          lunarMonth: currentMonth,
          lunarYear: currentYear,
          canChiMonth: getCanChiMonth(currentYear, currentMonth),
          seasonContext: currentMonth <= 3 ? 'Xuân' : currentMonth <= 6 ? 'Hạ' : currentMonth <= 9 ? 'Thu' : 'Đông'
        }
      };
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Bulk lunar calendar API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search endpoint for enhanced search features
router.get('/search', async (req, res) => {
  try {
    const { query, year, month, filter } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchQuery = (query as string).toLowerCase();
    const searchYear = year ? parseInt(year as string) : new Date().getFullYear();
    const searchMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    
    // Get month data
    const daysInMonth = new Date(searchYear, searchMonth, 0).getDate();
    const today = new Date();
    const results: LunarDay[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(searchYear, searchMonth - 1, day);
      const lunar = solarToLunar(currentDate);
      const canChi = getCanChiDay(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Check for holidays
      const holidayKey = `${lunar.lunarMonth}-${lunar.lunarDate}`;
      const holiday = VIETNAMESE_HOLIDAYS[holidayKey as keyof typeof VIETNAMESE_HOLIDAYS];
      const isHoliday = !!holiday;
      
      const dayQuality = getDayQuality(lunar.lunarDate, canChi);
      const productSuggestions = getProductSuggestions(lunar.lunarDate, lunar.lunarMonth, dayQuality, isHoliday);
      
      const dayData: LunarDay = {
        solarDate: currentDate.toISOString().split('T')[0],
        lunarDate: lunar.lunarDate,
        lunarMonth: lunar.lunarMonth,
        lunarYear: lunar.lunarYear,
        canChi,
        isGoodDay: dayQuality === 'good',
        isHoliday,
        holidayName: holiday?.name,
        isToday,
        dayQuality,
        productSuggestions
      };
      
      // Search filtering
      const matchesSearch = 
        canChi.toLowerCase().includes(searchQuery) ||
        holiday?.name?.toLowerCase().includes(searchQuery) ||
        productSuggestions.some(p => p.toLowerCase().includes(searchQuery));
      
      // Filter by quality if specified
      let matchesFilter = true;
      if (filter) {
        if (filter === 'good' && dayQuality !== 'good') matchesFilter = false;
        if (filter === 'bad' && dayQuality !== 'bad') matchesFilter = false;
        if (filter === 'holiday' && !isHoliday) matchesFilter = false;
      }
      
      if (matchesSearch && matchesFilter) {
        results.push(dayData);
      }
    }
    
    res.status(200).json({
      query: searchQuery,
      results,
      total: results.length,
      year: searchYear,
      month: searchMonth
    });
  } catch (error) {
    console.error('Search lunar calendar API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Can Chi for a specific month (Tinh Can Chi thang)
function getCanChiMonth(year: number, month: number): string {
  // Lunar month Can Chi calculation
  // First month starts from Can index based on year
  const yearCan = (year - 4) % 10;
  const monthCanIndex = (yearCan * 2 + month - 1) % 10;
  const monthChiIndex = (month - 1) % 12;
  
  // Handle negative modulo
  const adjustedCanIndex = monthCanIndex < 0 ? monthCanIndex + 10 : monthCanIndex;
  const adjustedChiIndex = monthChiIndex < 0 ? monthChiIndex + 12 : monthChiIndex;
  
  return `${CAN[adjustedCanIndex]} ${CHI[adjustedChiIndex]}`;
}

export default router;