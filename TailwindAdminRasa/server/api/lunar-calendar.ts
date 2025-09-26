// Vietnamese Lunar Calendar API with authentic calculations
// Based on traditional Vietnamese lunar calendar system

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

// Convert Gregorian to approximate lunar date (simplified traditional method)
function solarToLunar(solarDate: Date): { lunarDate: number; lunarMonth: number; lunarYear: number } {
  // Simplified lunar calculation based on traditional Vietnamese methods
  // This is a basic approximation - real implementation would use precise astronomical calculations
  
  const baseYear = 1900; // Reference year
  const yearDiff = solarDate.getFullYear() - baseYear;
  
  // Approximate lunar year calculation
  const lunarYear = baseYear + yearDiff;
  
  // Simple lunar month/date calculation (needs astronomical precision for real use)
  const dayOfYear = Math.floor((solarDate.getTime() - new Date(solarDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Approximate lunar cycle (29.53 days average)
  const lunarCycle = 29.53;
  const lunarMonthFloat = (dayOfYear % (lunarCycle * 12)) / lunarCycle;
  const lunarMonth = Math.floor(lunarMonthFloat) + 1;
  const lunarDate = Math.floor((lunarMonthFloat % 1) * lunarCycle) + 1;
  
  return {
    lunarDate: Math.min(lunarDate, 30),
    lunarMonth: Math.min(lunarMonth, 12),
    lunarYear
  };
}

// Get Can Chi for a given year
function getCanChiYear(year: number): string {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

// Get Can Chi for a given day
function getCanChiDay(date: Date): string {
  // Traditional calculation based on days since reference point
  const refDate = new Date(1900, 0, 1); // Reference date
  const daysDiff = Math.floor((date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const canIndex = daysDiff % 10;
  const chiIndex = daysDiff % 12;
  
  return `${CAN[canIndex >= 0 ? canIndex : canIndex + 10]} ${CHI[chiIndex >= 0 ? chiIndex : chiIndex + 12]}`;
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

// Main API endpoint
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month parameters are required' });
    }
    
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);
    
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
        canChiMonth: getCanChiYear(targetYear),
        seasonContext: targetMonth <= 3 ? 'Xuân' : targetMonth <= 6 ? 'Hạ' : targetMonth <= 9 ? 'Thu' : 'Đông'
      }
    };
    
    res.status(200).json(monthData);
  } catch (error) {
    console.error('Lunar calendar API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}