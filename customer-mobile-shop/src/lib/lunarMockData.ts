import { format, parse } from 'date-fns';
import { LunarDay, LunarMonthData } from './lunarApi';

// Mock lunar calendar data for development
const CAN_CHI_DAYS = [
  'Giáp Tý', 'Ất Sửu', 'Bính Dần', 'Đinh Mão', 'Mậu Thìn', 'Kỷ Tỵ',
  'Canh Ngọ', 'Tân Mùi', 'Nhâm Thân', 'Quý Dậu', 'Giáp Tuất', 'Ất Hợi',
  'Bính Tý', 'Đinh Sửu', 'Mậu Dần', 'Kỷ Mão', 'Canh Thìn', 'Tân Tỵ',
  'Nhâm Ngọ', 'Quý Mùi', 'Giáp Thân', 'Ất Dậu', 'Bính Tuất', 'Đinh Hợi',
  'Mậu Tý', 'Kỷ Sửu', 'Canh Dần', 'Tân Mão', 'Nhâm Thìn', 'Quý Tỵ',
  'Giáp Ngọ', 'Ất Mùi', 'Bính Thân', 'Đinh Dậu', 'Mậu Tuất', 'Kỷ Hợi',
  'Canh Tý', 'Tân Sửu', 'Nhâm Dần', 'Quý Mão', 'Giáp Thìn', 'Ất Tỵ',
  'Bính Ngọ', 'Đinh Mùi', 'Mậu Thân', 'Kỷ Dậu', 'Canh Tuất', 'Tân Hợi',
  'Nhâm Tý', 'Quý Sửu', 'Giáp Dần', 'Ất Mão', 'Bính Thìn', 'Đinh Tỵ',
  'Mậu Ngọ', 'Kỷ Mùi', 'Canh Thân', 'Tân Dậu', 'Nhâm Tuất', 'Quý Hợi'
];

const VIETNAMESE_HOLIDAYS = [
  { date: '01-01', name: 'Tết Dương Lịch' },
  { date: '15-01', name: 'Tết Nguyên Tiêu (Âm lịch)' }, // Approximate
  { date: '03-02', name: 'Ngày Thành Lập Đảng' },
  { date: '30-04', name: 'Ngày Giải Phóng Miền Nam' },
  { date: '01-05', name: 'Ngày Quốc Tế Lao Động' },
  { date: '02-09', name: 'Ngày Quốc Khánh' },
  { date: '20-11', name: 'Ngày Nhà Giáo Việt Nam' },
  // Lunar holidays (approximate solar dates)
  { date: '10-02', name: 'Tết Nguyên Đán (Âm lịch)' },
  { date: '11-02', name: 'Mồng 2 Tết' },
  { date: '12-02', name: 'Mồng 3 Tết' },
  { date: '15-04', name: 'Giỗ Tổ Hùng Vương' },
  { date: '15-07', name: 'Vu Lan (Âm lịch)' },
  { date: '15-08', name: 'Tết Trung Thu (Âm lịch)' }
];

const PRODUCT_SUGGESTIONS = [
  // Good days suggestions
  'Hương trầm tự nhiên cho ngày tốt',
  'Nhang thảo mộc thanh tịnh',
  'Tinh dầu hương nhu bình an',
  'Trầm hương Khánh Hòa cao cấp',
  'Nước hoa hồng tự nhiên',
  'Gia vị thảo mộc thanh lọc',
  
  // Normal days
  'Nhang trầm hương hàng ngày',
  'Tinh dầu thơm phòng',
  'Hương que truyền thống',
  'Sản phẩm thảo mộc thiên nhiên',
  
  // Bad days suggestions (cleansing/purifying products)
  'Nhang tẩy uế thanh tịnh',
  'Tinh dầu bưởi thanh lọc',
  'Hương trầm xua tà khí',
  'Muối biển tự nhiên'
];

/**
 * Generate mock lunar day data
 */
export function generateMockLunarDay(solarDate: string): LunarDay {
  const date = new Date(solarDate);
  const dayIndex = Math.floor((date.getTime() / (1000 * 60 * 60 * 24))) % 60;
  const canChi = CAN_CHI_DAYS[dayIndex];
  
  // Generate lunar date (rough approximation)
  const lunarDay = ((date.getDate() + 10) % 30) + 1;
  const lunarMonth = ((date.getMonth() + 11) % 12) + 1;
  const lunarYear = date.getFullYear() - (date.getMonth() < 2 ? 1 : 0);
  
  // Determine day quality based on Can Chi
  const goodDays = ['Giáp Tý', 'Ất Sửu', 'Mậu Thìn', 'Kỷ Tỵ', 'Canh Ngọ', 'Tân Mùi'];
  const badDays = ['Nhâm Thân', 'Quý Dậu', 'Bính Tuất', 'Đinh Hợi'];
  
  const dayQuality = goodDays.includes(canChi) ? 'good' :
                    badDays.includes(canChi) ? 'bad' : 'normal';
  
  // Check for holidays
  const dateStr = format(date, 'dd-MM');
  const holiday = VIETNAMESE_HOLIDAYS.find(h => h.date === dateStr);
  
  // Select product suggestions based on day quality (deterministic)
  const dateHash = date.getTime() / (1000 * 60 * 60 * 24); // Days since epoch
  const suggestions = PRODUCT_SUGGESTIONS
    .filter((_, index) => {
      if (dayQuality === 'good') return index < 6;
      if (dayQuality === 'bad') return index >= 10;
      return index >= 6 && index < 10;
    })
    .slice(0, (Math.floor(dateHash) % 3) + 1); // Deterministic slice based on date
  
  return {
    solarDate: solarDate.split('T')[0], // Ensure just date part
    lunarDate: lunarDay,
    lunarMonth: lunarMonth,
    lunarYear: lunarYear,
    canChi: canChi,
    isGoodDay: dayQuality === 'good',
    isHoliday: !!holiday,
    holidayName: holiday?.name,
    isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    dayQuality: dayQuality,
    productSuggestions: suggestions
  };
}

/**
 * Generate mock lunar month data
 */
export function generateMockLunarMonth(year: number, month: number): LunarMonthData {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const days: LunarDay[] = [];
  for (let day = 1; day <= endDate.getDate(); day++) {
    const dateStr = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
    days.push(generateMockLunarDay(dateStr));
  }
  
  return {
    days,
    monthInfo: {
      lunarMonth: ((month + 10) % 12) + 1,
      lunarYear: year - (month < 3 ? 1 : 0),
      canChiMonth: CAN_CHI_DAYS[(month - 1) % 12],
      seasonContext: getSeason(month)
    }
  };
}

/**
 * Get season context for month
 */
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'Xuân - Mùa sinh trưởng, thích hợp trồng trọt';
  if (month >= 6 && month <= 8) return 'Hạ - Mùa phát triển, năng lượng cao';
  if (month >= 9 && month <= 11) return 'Thu - Mùa thu hoạch, tích trữ năng lượng';
  return 'Đông - Mùa nghỉ ngơi, bảo tồn sức khỏe';
}

/**
 * Development mode API functions with mock data
 */
export const mockApi = {
  async fetchLunarMonth(year: number, month: number): Promise<LunarMonthData | null> {
    // Simulate deterministic API delay in development only
    if (process.env.NODE_ENV === 'development') {
      const delay = 300 + ((year + month) % 200); // Deterministic delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return generateMockLunarMonth(year, month);
  },
  
  async fetchLunarDay(date: string): Promise<LunarDay | null> {
    // Simulate deterministic API delay in development only
    if (process.env.NODE_ENV === 'development') {
      const dateObj = new Date(date);
      const delay = 200 + (dateObj.getTime() % 200); // Deterministic delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return generateMockLunarDay(date);
  }
};