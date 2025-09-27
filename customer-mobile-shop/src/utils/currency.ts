/**
 * Format price for Vietnamese locale with comma separators
 * @param price - Price in VND
 * @returns Formatted price string with ₫ symbol
 */
export function formatVietnamPrice(price: number): string {
  // Ensure we're working with integer, remove decimals and format with commas
  const integerPrice = Math.round(price);
  return integerPrice.toLocaleString('en-US') + '₫';
}

/**
 * Format price without currency symbol
 * @param price - Price in VND  
 * @returns Formatted price string without symbol
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('en-US');
}