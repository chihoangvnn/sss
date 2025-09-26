// API integration with main backend
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export interface LunarDay {
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

export interface LunarMonthData {
  days: LunarDay[];
  monthInfo: {
    lunarMonth: number;
    lunarYear: number;
    canChiMonth: string;
    seasonContext: string;
  };
}

/**
 * Fetch lunar calendar data for a specific month
 */
export async function fetchLunarMonth(year: number, month: number): Promise<LunarMonthData | null> {
  // Use mock data in development/build mode
  if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
    const { mockApi } = await import('./mockData');
    return mockApi.fetchLunarMonth(year, month);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/lunar-calendar/bulk?startYear=${year}&startMonth=${month}&months=1`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const monthKey = `${year}-${month}`;
    
    return data[monthKey] || null;
  } catch (error) {
    console.error(`Error fetching lunar data for ${year}-${month}:`, error);
    // Fallback to mock data on API error
    const { mockApi } = await import('./mockData');
    return mockApi.fetchLunarMonth(year, month);
  }
}

/**
 * Fetch lunar calendar data for a specific date
 */
export async function fetchLunarDay(date: string): Promise<LunarDay | null> {
  // Use mock data in development/build mode
  if (process.env.NODE_ENV === 'development' || !API_BASE_URL.startsWith('http')) {
    const { mockApi } = await import('./mockData');
    return mockApi.fetchLunarDay(date);
  }
  
  try {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
    
    const monthData = await fetchLunarMonth(year, month);
    if (!monthData) return null;
    
    // Find the specific day
    const targetDate = date.split('T')[0]; // Get just the date part
    const dayData = monthData.days.find(day => day.solarDate === targetDate);
    
    return dayData || null;
  } catch (error) {
    console.error(`Error fetching lunar day for ${date}:`, error);
    // Fallback to mock data on API error
    const { mockApi } = await import('./mockData');
    return mockApi.fetchLunarDay(date);
  }
}

/**
 * Generate SEO-friendly title for a specific date
 */
export function generateDayTitle(dayData: LunarDay): string {
  const date = new Date(dayData.solarDate);
  const dayNum = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  const qualityText = dayData.dayQuality === 'good' ? 'Ngày Tốt' : 
                     dayData.dayQuality === 'bad' ? 'Ngày Xấu' : 'Ngày Bình Thường';
  
  const holidayText = dayData.isHoliday && dayData.holidayName ? ` - ${dayData.holidayName}` : '';
  
  return `Xem ngày ${dayNum}/${month}/${year} - ${qualityText} (${dayData.canChi})${holidayText}`;
}

/**
 * Generate SEO-friendly description for a specific date
 */
export function generateDayDescription(dayData: LunarDay): string {
  const date = new Date(dayData.solarDate);
  const dayNum = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  const lunarInfo = `${dayData.lunarDate}/${dayData.lunarMonth} Âm lịch`;
  const canChiInfo = `Can Chi: ${dayData.canChi}`;
  const qualityInfo = dayData.dayQuality === 'good' ? 'là ngày tốt, hoàng đạo' :
                     dayData.dayQuality === 'bad' ? 'là ngày xấu, hắc đạo' : 
                     'là ngày bình thường';
  
  const holidayInfo = dayData.isHoliday && dayData.holidayName ? 
    ` Hôm nay là ${dayData.holidayName}.` : '';
  
  return `Ngày ${dayNum}/${month}/${year} (${lunarInfo}) ${qualityInfo}. ${canChiInfo}. Tra cứu giờ hoàng đạo, việc nên làm và kiêng kỵ trong ngày.${holidayInfo}`;
}

/**
 * Generate date range for static generation (next 10 years)
 */
export function generateDateRange(): string[] {
  const dates: string[] = [];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 10);
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format date for URL (dd-mm-yyyy)
 */
export function formatDateForUrl(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Parse date from URL format (dd-mm-yyyy) to ISO
 */
export function parseDateFromUrl(dateStr: string): string {
  // Remove "xem-ngay-" prefix if present (for dynamic route params)
  const cleanDateStr = dateStr.replace(/^xem-ngay-/, '');
  const [day, month, year] = cleanDateStr.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}