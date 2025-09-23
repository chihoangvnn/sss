/**
 * Vietnamese Search Normalization Utilities
 * Provides diacritic-insensitive search and normalization for Vietnamese text
 */

// Vietnamese character mapping for normalization
const vietnameseCharMap: Record<string, string> = {
  // a characters
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
  'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
  'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
  'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',

  // e characters
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
  'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',

  // i characters
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',

  // o characters
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
  'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
  'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',

  // u characters
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
  'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',

  // y characters
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',

  // đ character
  'đ': 'd', 'Đ': 'D'
};

/**
 * Normalize Vietnamese text by removing diacritical marks
 * @param text - Text to normalize
 * @returns Normalized text without diacritical marks
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return '';
  
  return text.split('').map(char => vietnameseCharMap[char] || char).join('');
}

/**
 * Create search-optimized string (normalized, lowercased, trimmed)
 * @param text - Text to optimize for search
 * @returns Search-optimized string
 */
export function createSearchString(text: string): string {
  if (!text) return '';
  
  return normalizeVietnamese(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Create cache key that's normalized for consistent caching
 * @param query - Search query
 * @param options - Additional options for cache key
 * @returns Normalized cache key
 */
export function createSearchCacheKey(query: string, options: Record<string, any> = {}): string {
  const normalizedQuery = createSearchString(query);
  const optionsStr = Object.keys(options)
    .sort()
    .map(key => `${key}:${options[key]}`)
    .join('|');
  
  return `search:${normalizedQuery}${optionsStr ? `|${optionsStr}` : ''}`;
}

/**
 * Vietnamese-aware string matching with accent insensitive search
 * @param text - Text to search in
 * @param query - Search query
 * @returns True if query matches text (accent insensitive)
 */
export function vietnameseMatch(text: string, query: string): boolean {
  if (!text || !query) return false;
  
  const normalizedText = createSearchString(text);
  const normalizedQuery = createSearchString(query);
  
  return normalizedText.includes(normalizedQuery);
}

/**
 * Vietnamese-aware string search with multiple query support
 * @param text - Text to search in
 * @param queries - Array of search queries
 * @param matchAll - If true, all queries must match; if false, any query can match
 * @returns True if queries match according to matchAll setting
 */
export function vietnameseSearchMultiple(
  text: string, 
  queries: string[], 
  matchAll: boolean = false
): boolean {
  if (!text || !queries.length) return false;
  
  const normalizedText = createSearchString(text);
  const normalizedQueries = queries.map(createSearchString).filter(q => q.length > 0);
  
  if (normalizedQueries.length === 0) return false;
  
  if (matchAll) {
    return normalizedQueries.every(query => normalizedText.includes(query));
  } else {
    return normalizedQueries.some(query => normalizedText.includes(query));
  }
}

/**
 * Sort function for Vietnamese text that maintains diacritical awareness
 * @param a - First string
 * @param b - Second string
 * @param ascending - Sort order (default: true)
 * @returns Sort comparison result
 */
export function vietnameseSort(a: string, b: string, ascending: boolean = true): number {
  if (!a && !b) return 0;
  if (!a) return ascending ? -1 : 1;
  if (!b) return ascending ? 1 : -1;
  
  // Use Vietnamese collation if available, fallback to normalized comparison
  try {
    const result = a.localeCompare(b, 'vi-VN', { 
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true 
    });
    return ascending ? result : -result;
  } catch {
    // Fallback to normalized comparison
    const normalizedA = createSearchString(a);
    const normalizedB = createSearchString(b);
    const result = normalizedA.localeCompare(normalizedB);
    return ascending ? result : -result;
  }
}

/**
 * Filter array of objects by Vietnamese text search
 * @param items - Array of items to filter
 * @param query - Search query
 * @param searchFields - Fields to search in each item
 * @returns Filtered array
 */
export function vietnameseFilter<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  
  const queries = query.trim().split(/\s+/);
  
  return items.filter(item => {
    const searchTexts = searchFields
      .map(field => String(item[field] || ''))
      .join(' ');
    
    return vietnameseSearchMultiple(searchTexts, queries, false);
  });
}

/**
 * Highlight matching text in Vietnamese strings
 * @param text - Text to highlight matches in
 * @param query - Search query
 * @param className - CSS class for highlighting
 * @returns Text with highlighted matches
 */
export function vietnameseHighlight(
  text: string, 
  query: string, 
  className: string = 'bg-yellow-200'
): string {
  if (!text || !query.trim()) return text;
  
  const normalizedText = normalizeVietnamese(text);
  const normalizedQuery = normalizeVietnamese(query.trim());
  
  // Find all matches in normalized text
  const matches: Array<{ start: number; end: number }> = [];
  let index = normalizedText.toLowerCase().indexOf(normalizedQuery.toLowerCase());
  
  while (index !== -1) {
    matches.push({ start: index, end: index + normalizedQuery.length });
    index = normalizedText.toLowerCase().indexOf(normalizedQuery.toLowerCase(), index + 1);
  }
  
  if (matches.length === 0) return text;
  
  // Apply highlighting to original text (with diacritics)
  let result = '';
  let lastEnd = 0;
  
  matches.forEach(match => {
    // Add text before match
    result += text.substring(lastEnd, match.start);
    
    // Add highlighted match
    result += `<span class="${className}">${text.substring(match.start, match.end)}</span>`;
    
    lastEnd = match.end;
  });
  
  // Add remaining text
  result += text.substring(lastEnd);
  
  return result;
}

/**
 * Vietnamese-aware fuzzy search with scoring
 * @param text - Text to search in
 * @param query - Search query
 * @returns Score from 0-1 (1 = exact match, 0 = no match)
 */
export function vietnameseFuzzyScore(text: string, query: string): number {
  if (!text || !query) return 0;
  
  const normalizedText = createSearchString(text);
  const normalizedQuery = createSearchString(query);
  
  if (normalizedText === normalizedQuery) return 1; // Exact match
  if (normalizedText.includes(normalizedQuery)) return 0.8; // Contains query
  
  // Calculate fuzzy score based on character similarity
  const textChars = normalizedText.split('');
  const queryChars = normalizedQuery.split('');
  let matches = 0;
  
  queryChars.forEach(queryChar => {
    const index = textChars.indexOf(queryChar);
    if (index !== -1) {
      matches++;
      textChars.splice(index, 1); // Remove matched character
    }
  });
  
  const score = matches / Math.max(normalizedQuery.length, normalizedText.length);
  return Math.max(0, Math.min(1, score)); // Ensure 0-1 range
}

/**
 * Test Vietnamese search functionality
 */
export function testVietnameseSearch(): void {
  if (!import.meta.env.DEV) return;
  
  const testCases = [
    { text: 'Bánh mì thịt nướng', query: 'banh mi', expected: true },
    { text: 'Phở bò tái', query: 'pho bo', expected: true },
    { text: 'Cà phê sữa đá', query: 'ca phe sua da', expected: true },
    { text: 'Bún bò Huế', query: 'bun bo hue', expected: true },
    { text: 'Gỏi cuốn tôm thịt', query: 'goi cuon', expected: true },
    { text: 'Chả cá Hà Nội', query: 'cha ca ha noi', expected: true },
  ];
  
  console.log('🔍 Testing Vietnamese search normalization...');
  
  testCases.forEach(({ text, query, expected }, index) => {
    const result = vietnameseMatch(text, query);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: "${text}" matches "${query}" = ${result}`);
  });
  
  console.log('🔍 Vietnamese search test completed.');
}