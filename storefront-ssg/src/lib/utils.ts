import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format price with VND currency
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(numPrice);
}

// Validate Vietnamese phone number
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate optimized Cloudinary URL
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  // Parse Cloudinary URL and inject transformations
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) return url;

  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width && height) transformations.push('c_fill');
  
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transformationString = transformations.join(',');
  
  return `${urlParts[0]}/upload/${transformationString}/${urlParts[1]}`;
}

// Color utility functions for theme customization
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function generateColorShades(primaryColor: string): Record<string, string> {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return {};

  return {
    50: `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`,
    100: `rgb(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)})`,
    200: `rgb(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 20)})`,
    300: `rgb(${Math.min(255, rgb.r + 10)}, ${Math.min(255, rgb.g + 10)}, ${Math.min(255, rgb.b + 10)})`,
    400: primaryColor,
    500: `rgb(${Math.max(0, rgb.r - 10)}, ${Math.max(0, rgb.g - 10)}, ${Math.max(0, rgb.b - 10)})`,
    600: `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`,
    700: `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`,
    800: `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`,
    900: `rgb(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)})`,
  };
}

// Debounce function for form inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Generate session ID for tracking
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}